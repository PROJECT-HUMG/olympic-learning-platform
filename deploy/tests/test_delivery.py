"""Offline delivery contract/failure tests. No registry/server/network access."""
import fcntl
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "deploy"))
import deploy
import release
import smoke

SHA = "a" * 40
REPO = "fixture/olympic"


def manifest(sequence=1, sha=SHA):
    return {"version": 1, "repository": REPO, "sha": sha, "id": f"{sha}-{sequence}-1", "sequence": sequence,
            "api_image": f'ghcr.io/{REPO}-api@sha256:{"b" * 64}',
            "web_image": f'ghcr.io/{REPO}-web@sha256:{"c" * 64}',
            "migrations": {"V1__fixture.sql": "d" * 64},
            "public_config": {"turnstile_enabled": "false", "turnstile_site_key": ""},
            "bundle": {name: release.sha256(ROOT / "deploy" / name) for name in release.BUNDLE_FILES}}


class DeliveryTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="olympic-delivery-test-")
        self.root = Path(self.temporary.name)
        (self.root / "shared").mkdir()
        (self.root / "shared" / "host-config.json").write_text(json.dumps({"repository": REPO, "public_origin": release.ORIGIN}))
        self.secret = self.root / "shared" / "production.env"
        self.secret.write_text("# Synthetic test fixture only, not a real secret\n")
        self.secret.chmod(0o600)
        self.calls = []

    def tearDown(self):
        self.temporary.cleanup()

    def prepared(self, value):
        folder = self.root / "releases" / value["id"]
        (folder / "deploy").mkdir(parents=True)
        for name in release.BUNDLE_FILES:
            shutil.copyfile(ROOT / "deploy" / name, folder / "deploy" / name)
        (folder / "release.json").write_text(json.dumps(value))
        return deploy.Deployment(self.root, value["id"])

    def fake_run(self, deployment, failing_stage=None):
        def run(args, timeout=120, output=None):
            self.calls.append(args)
            if deployment.stage == failing_stage:
                raise RuntimeError("Synthetic operation failure")
            if output:
                output.write(b"PGDMP synthetic database dump")
                return None
            if args[1:3] == ["image", "inspect"]:
                return json.dumps({"arch": "amd64", "os": "linux", "revision": deployment.manifest["sha"]}).encode()
            if args[1] == "inspect":
                service = args[-1]
                return json.dumps({"image": deployment.manifest[service + "_image"], "health": "healthy"}).encode()
            if "ps" in args:
                return args[-1].encode()
            return b""
        return run

    def test_manifest_rejects_tags_other_owners_injection_and_bad_build_inputs(self):
        value = manifest()
        self.assertEqual(release.validate(value, REPO), value)
        for field, invalid in [("api_image", f"ghcr.io/{REPO}-api:latest"),
                               ("repository", "other/project"), ("id", "../../shared"),
                               ("sha", "main;touch /tmp/invalid"), ("sequence", 0)]:
            with self.subTest(field=field), self.assertRaises(ValueError):
                release.validate(dict(value, **{field: invalid}), REPO)
        value["public_config"]["turnstile_enabled"] = "true"
        with self.assertRaises(ValueError):
            release.validate(value)

    def test_generated_release_freezes_actual_migrations_and_bundle_bytes(self):
        output = self.root / "release.json"
        env = {"GITHUB_REPOSITORY": "Fixture/Olympic", "GITHUB_SHA": SHA, "GITHUB_RUN_ID": "10",
               "GITHUB_RUN_ATTEMPT": "2", "GITHUB_RUN_NUMBER": "3", "API_DIGEST": "sha256:" + "b" * 64,
               "WEB_DIGEST": "sha256:" + "c" * 64, "VITE_TURNSTILE_ENABLED": "false"}
        with patch.dict(os.environ, env):
            release.create(output)
        value = json.loads(output.read_text())
        self.assertEqual(value["id"], f"{SHA}-10-2")
        self.assertEqual(value["repository"], REPO)
        self.assertTrue(value["migrations"])
        for name, digest in value["bundle"].items():
            self.assertEqual(digest, release.sha256(ROOT / "deploy" / name))
        self.assertNotIn("production.env", output.read_text())

    def test_bundle_tampering_and_secret_permissions_fail_preflight(self):
        value = manifest()
        self.prepared(value)
        folder = self.root / "releases" / value["id"]
        (folder / "deploy" / "compose.prod.yml").write_text("tampered")
        with self.assertRaises(ValueError):
            deploy.Deployment(self.root, value["id"])
        self.secret.chmod(0o644)
        with self.assertRaises(ValueError):
            self.prepared(manifest(2))

    def test_success_requires_backup_digest_health_and_public_smoke_before_promotion(self):
        target = self.prepared(manifest())
        evidence = {"sha": SHA, "checks": ["fixture smoke"]}
        with patch.object(target, "run", side_effect=self.fake_run(target)), patch("deploy.public_smoke", return_value=evidence):
            target.execute()
        self.assertEqual(deploy.read_json(target.state / "current.json")["sha"], SHA)
        self.assertEqual(deploy.read_json(target.state / "status.json")["outcome"], "healthy")
        self.assertTrue(target.backup.read_bytes().startswith(b"PGDMP"))
        backup_index = next(i for i, args in enumerate(self.calls) if "pg_dump" in args)
        app_index = next(i for i, args in enumerate(self.calls) if "--no-build" in args)
        self.assertLess(backup_index, app_index)
        self.assertTrue(all("down" not in args and "--volumes" not in args for args in self.calls))
        self.assertTrue(all("--env-file" in args for args in self.calls if args[1] == "compose"))

    def test_failed_health_or_smoke_keeps_previous_pointer_without_claiming_rollback(self):
        for failing in ("app readiness", "public smoke"):
            with self.subTest(stage=failing):
                target = self.prepared(manifest(2 if failing == "app readiness" else 3))
                old = manifest()
                deploy.atomic_json(target.state / "current.json", old)
                with patch.object(target, "run", side_effect=self.fake_run(target, failing)), patch("deploy.public_smoke", side_effect=RuntimeError("Synthetic smoke failure")):
                    with self.assertRaises(RuntimeError):
                        target.execute()
                self.assertEqual(deploy.read_json(target.state / "current.json"), old)
                status = deploy.read_json(target.state / "status.json")
                self.assertEqual(status["outcome"], "failed")
                self.assertEqual(status["stage"], failing)
                self.assertTrue(target.backup.exists())

    def test_backup_failure_refuses_app_start(self):
        target = self.prepared(manifest())
        with patch.object(target, "run", side_effect=self.fake_run(target, "pre-migration backup")):
            with self.assertRaises(RuntimeError):
                target.execute()
        self.assertFalse(any("--no-build" in args for args in self.calls))

    def test_host_lock_and_stale_order_refuse_mutation(self):
        target = self.prepared(manifest())
        with (target.state / "deploy.lock").open("w") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            with self.assertRaises(BlockingIOError):
                target.execute()
        deploy.atomic_json(target.state / "latest.json", {"sequence": 2})
        with self.assertRaises(ValueError):
            target.execute()
        self.assertFalse((target.state / "status.json").exists())

    def test_rollback_requires_consent_equal_schema_and_retains_highwater(self):
        old = manifest()
        target = self.prepared(old)
        newer = manifest(2, "e" * 40)
        self.prepared(newer)
        deploy.atomic_json(target.state / "current.json", newer)
        deploy.atomic_json(target.state / "latest.json", {"sequence": 2})
        with self.assertRaises(ValueError):
            target.execute(rollback=True)
        newer["migrations"]["V2__new.sql"] = "f" * 64
        (self.root / "releases" / newer["id"] / "release.json").write_text(json.dumps(newer))
        with self.assertRaises(ValueError):
            target.execute(rollback=True, schema_compatible=True)
        newer["migrations"].pop("V2__new.sql")
        (self.root / "releases" / newer["id"] / "release.json").write_text(json.dumps(newer))
        with patch.object(target, "run", side_effect=self.fake_run(target)), patch("deploy.public_smoke", return_value={"sha": SHA}):
            target.execute(rollback=True, schema_compatible=True)
        self.assertEqual(deploy.read_json(target.state / "latest.json")["sequence"], 2)

    def test_smoke_checks_identity_asset_api_and_private_actuator(self):
        def get(path):
            if path == "/release.json":
                return json.dumps({"sha": SHA}).encode(), {"Cache-Control": "no-store"}
            if path == "/":
                return b'<div id="root"></div><script src="/assets/example.js"></script>', {}
            if path.startswith("/assets/"):
                return b"console.log('fixture')", {}
            if path == "/api/v1/documents/metadata":
                return b'{"categories":[],"subjects":[],"tags":[]}', {}
            raise HTTPError(path, 404, "Blocked", {}, None)
        with patch("smoke.get", side_effect=get):
            smoke.check(SHA)
            with self.assertRaises(ValueError):
                smoke.check("f" * 40)
        with patch("smoke.get", side_effect=OSError("fixture offline")), patch("smoke.time.sleep"):
            with self.assertRaises(RuntimeError):
                smoke.wait(SHA)

    def test_api_report_gate_rejects_skips_and_missing_reports(self):
        reports = self.root / "reports"
        reports.mkdir()
        command = [sys.executable, str(ROOT / "deploy" / "check-test-reports.py"), str(reports)]
        self.assertNotEqual(subprocess.run(command, capture_output=True).returncode, 0)
        report = reports / "TEST-fixture.xml"
        for skipped in (0, 1):
            report.write_text(f'<testsuite tests="1" failures="0" errors="0" skipped="{skipped}"/>')
            self.assertEqual(subprocess.run(command, capture_output=True).returncode, skipped)

    def test_ssh_transport_uses_strict_known_hosts_and_never_bundles_credentials(self):
        tools = self.root / "fake-tools"
        tools.mkdir()
        log = self.root / "ssh-contract.txt"
        # All transport/key commands replaced locally; no socket or real key is used.
        for command in ("ssh", "scp", "ssh-keygen"):
            executable = tools / command
            executable.write_text('#!/bin/bash\nset -eu\nif [[ "$1" == "-F" ]]; then cat "$2" >> "$CONTRACT_LOG"; fi\nexit 0\n')
            executable.chmod(0o700)
        (self.root / "release.tar.gz").write_bytes(b"synthetic archive")
        env = dict(os.environ, PATH=str(tools) + os.pathsep + os.environ["PATH"], CONTRACT_LOG=str(log),
                   DEPLOY_HOST="fixture.example.test", DEPLOY_USER="deployer", DEPLOY_PORT="22",
                   DEPLOY_SSH_KEY="synthetic-private-key", DEPLOY_KNOWN_HOSTS="synthetic-public-key", RELEASE_ID=manifest()["id"])
        run = subprocess.run(["bash", str(ROOT / "deploy" / "ssh-deploy.sh")], cwd=self.root, env=env, capture_output=True)
        self.assertEqual(run.returncode, 0)
        self.assertNotIn(b"synthetic-private-key", run.stdout + run.stderr)
        config = log.read_text()
        self.assertIn("StrictHostKeyChecking yes", config)
        self.assertIn("BatchMode yes", config)
        self.assertIn("IdentitiesOnly yes", config)
        for line in config.splitlines():
            if line.strip().startswith(("IdentityFile ", "UserKnownHostsFile ")):
                self.assertFalse(Path(line.split()[-1]).exists())
        env["DEPLOY_HOST"] = "fixture; unsafe"
        self.assertNotEqual(subprocess.run(["bash", str(ROOT / "deploy" / "ssh-deploy.sh")], cwd=self.root, env=env, capture_output=True).returncode, 0)

    @unittest.skipUnless(shutil.which("docker"), "Docker Compose CLI unavailable")
    def test_compose_with_synthetic_values_is_image_only_prod_and_preserves_volumes(self):
        names = ("POSTGRES_PASSWORD", "JWT_SECRET_KEY", "ENCRYPTION_KEY", "ENCRYPTION_SALT",
                 "OLYMPIC_ADMIN_EMAIL", "OLYMPIC_ADMIN_USERNAME", "OLYMPIC_ADMIN_PASSWORD",
                 "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET",
                 "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET")
        self.secret.write_text("\n".join(f"{name}=synthetic-fixture" for name in names))
        env = dict(os.environ, API_IMAGE=manifest()["api_image"], WEB_IMAGE=manifest()["web_image"], PRODUCTION_ENV_FILE=str(self.secret))
        result = subprocess.run(["docker", "compose", "--env-file", str(self.secret), "-f", str(ROOT / "deploy" / "compose.prod.yml"), "config", "--format", "json"], env=env, capture_output=True, check=True)
        config = json.loads(result.stdout)  # Never print expanded config, even this fixture.
        for service, data in config["services"].items():
            self.assertNotIn("build", data)
            if service in ("postgres", "redis"):
                self.assertFalse(data.get("ports"))
            for port in data.get("ports", []):
                self.assertEqual(port["host_ip"], "127.0.0.1")
        self.assertEqual(config["services"]["api"]["environment"]["SPRING_PROFILES_ACTIVE"], "prod")
        self.assertEqual(config["services"]["api"]["environment"]["MAIL_PORT"], "2525")
        self.assertEqual(config["volumes"]["postgres-data"]["name"], "olympic_platform_postgres-data")
        self.assertEqual(config["volumes"]["redis-data"]["name"], "olympic_platform_redis-data")
        self.assertEqual(config["volumes"]["api-storage"]["name"], "olympic_platform_api-storage")


if __name__ == "__main__":
    unittest.main()
