"""Real local Git/Compose parsing; Docker deployment and public network are mocked."""
import fcntl
import hashlib
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
import smoke

REPO = "PROJECT-HUMG/olympic-learning-platform"


@unittest.skipUnless(shutil.which("git") and shutil.which("docker"), "Git/Docker CLI unavailable")
class DeliveryTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="olympic-checkout-test-")
        self.folder = Path(self.temporary.name)
        self.root = self.folder / "host"
        self.root.mkdir(mode=0o700)
        self.secret = self.root / ".env"
        self.secret.write_text("# Synthetic operator env, never a real secret\n")
        self.secret.chmod(0o600)
        self.source = self.folder / "source"
        self.source.mkdir()
        self.git("init", "--quiet")
        self.git("config", "user.email", "fixture@example.test")
        self.git("config", "user.name", "Fixture")
        migrations = self.source / "apps/api/src/main/resources/db/migration"
        migrations.mkdir(parents=True)
        (migrations / "V1__fixture.sql").write_text("-- fixture migration\n")
        (self.source / ".gitignore").write_text(".env\n")
        (self.source / "deploy").mkdir()
        shutil.copyfile(ROOT / "deploy/compose.prod.yml", self.source / "deploy/compose.prod.yml")
        (self.source / "apps/web").mkdir()
        self.git("add", ".")
        self.git("commit", "-qm", "fixture initial")
        self.sha = self.git("rev-parse", "HEAD").decode().strip()
        (self.source / "newer.txt").write_text("untested moving branch content\n")
        self.git("add", ".")
        self.git("commit", "-qm", "fixture newer main")
        self.newer = self.git("rev-parse", "HEAD").decode().strip()
        self.calls = []

    def git(self, *args):
        return subprocess.check_output(["git", "-C", str(self.source), *args], stderr=subprocess.DEVNULL)

    def tearDown(self):
        self.temporary.cleanup()

    def target(self, sha=None, sequence=1):
        with patch("deploy.repository_url", return_value=str(self.source)):
            return deploy.Deployment(self.root, sha or self.sha, sequence, REPO)

    def fake_run(self, target, failing_stage=None, empty_backup=False):
        real = target.run
        def run(args, timeout=120, output=None, hint="fixture"):
            self.calls.append(args)
            if args[0] == "git":
                return real(args, timeout, output, hint)
            if target.stage == failing_stage:
                raise RuntimeError("Synthetic operation failure")
            if output:
                output.write(b"" if empty_backup else b"PGDMP synthetic dump")
                return None
            if args[:3] == ["docker", "compose", "version"]:
                return b"2.38.2"
            if args[1:3] == ["image", "inspect"]:
                service = "api" if "-api:" in args[-1] else "web"
                return json.dumps({"id": "sha256:" + service, "arch": "amd64", "os": "linux", "revision": target.sha}).encode()
            if args[1] == "inspect":
                return json.dumps({"image": "sha256:" + args[-1], "health": "healthy"}).encode()
            if "ps" in args:
                return args[-1].encode()
            return b"fixture"
        return run

    def execute(self, target, failing=None, empty_backup=False, smoke_failure=False):
        with patch.object(target, "run", side_effect=self.fake_run(target, failing, empty_backup)), \
             patch("builtins.print"), \
             patch.object(target, "public_smoke", side_effect=RuntimeError("Synthetic smoke failure") if smoke_failure else None,
                          return_value={"sha": target.sha}):
            target.execute()

    def test_exact_commit_not_moving_main_and_explicit_operator_env(self):
        before = self.secret.read_bytes()
        target = self.target()
        self.execute(target)
        head = subprocess.check_output(["git", "-C", str(target.checkout), "rev-parse", "HEAD"]).decode().strip()
        self.assertEqual(head, self.sha)
        self.assertNotEqual(head, self.newer)
        self.assertFalse((target.checkout / "newer.txt").exists())
        self.assertEqual(self.secret.read_bytes(), before)
        self.assertNotIn(str(self.secret), [a for call in self.calls if call[0] == "git" for a in call])
        self.assertEqual(target.env["PRODUCTION_ENV_FILE"], str(self.secret))
        self.assertEqual(target.env["COMPOSE_PARALLEL_LIMIT"], "1")
        builds = [call[-1] for call in self.calls if "build" in call]
        self.assertEqual(builds, ["api", "web"])
        backup = next(i for i, call in enumerate(self.calls) if "pg_dump" in call)
        start = next(i for i, call in enumerate(self.calls) if "--no-build" in call)
        self.assertLess(backup, start)
        self.assertEqual(deploy.read_json(target.state / "current.json")["sha"], self.sha)
        self.assertEqual(deploy.read_json(target.state / "status.json")["outcome"], "healthy")
        self.assertEqual(target.backup.stat().st_mode & 0o777, 0o600)
        self.assertFalse(any(a in ("reset", "clean", "down", "--volumes") for call in self.calls for a in call))
        self.assertTrue(all("--env-file" in call for call in self.calls if call[:2] == ["docker", "compose"] and "version" not in call))

    def test_dirty_checkout_and_wrong_origin_refuse_preserving_operator_changes(self):
        target = self.target()
        self.execute(target)
        note = target.checkout / "operator-note.txt"
        note.write_text("keep this work")
        target = self.target(self.newer, 2)
        with self.assertRaisesRegex(ValueError, "local changes"):
            self.execute(target)
        self.assertEqual(note.read_text(), "keep this work")
        note.unlink()
        subprocess.run(["git", "-C", str(target.checkout), "remote", "set-url", "origin", "https://github.com/other/project.git"], check=True)
        with self.assertRaisesRegex(ValueError, "origin differs"):
            self.execute(target)

    def test_ignored_env_in_checkout_is_retained_and_never_selected(self):
        target = self.target()
        self.execute(target)
        ignored = target.checkout / ".env"
        ignored.write_text("# dummy ignored operator content")
        target = self.target(self.newer, 2)
        self.execute(target)
        self.assertEqual(ignored.read_text(), "# dummy ignored operator content")
        self.assertEqual(target.env["PRODUCTION_ENV_FILE"], str(self.secret))

    def test_bootstrap_actionable_missing_env_permissions_and_nonempty_checkout(self):
        target = self.target()
        self.secret.unlink()
        with self.assertRaisesRegex(ValueError, "Missing /opt/olympic/.env"):
            target.execute()
        self.secret.write_text("dummy")
        self.secret.chmod(0o644)
        with self.assertRaisesRegex(ValueError, "mode600"):
            target.execute()
        self.secret.chmod(0o600)
        target.checkout.mkdir()
        (target.checkout / "keep.txt").write_text("operator")
        with self.assertRaisesRegex(ValueError, "nonempty"):
            self.execute(target)
        self.assertEqual((target.checkout / "keep.txt").read_text(), "operator")

    def test_host_lock_and_stale_sequence_refuse_checkout_mutation(self):
        target = self.target()
        target.bootstrap()
        with (target.state / "deploy.lock").open("w") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            with self.assertRaisesRegex(ValueError, "host lock"):
                target.execute()
        deploy.atomic_json(target.state / "latest.json", {"sequence": 2})
        with self.assertRaisesRegex(ValueError, "Superseded"):
            target.execute()
        self.assertFalse(target.checkout.exists())

    def test_build_or_backup_failure_never_replaces_apps(self):
        for stage in ("api server build", "web server build", "pre-migration backup"):
            with self.subTest(stage=stage):
                self.calls.clear()
                target = self.target()
                with self.assertRaises(RuntimeError):
                    self.execute(target, failing=stage)
                self.assertFalse(any("--no-build" in call for call in self.calls))
                self.assertEqual(deploy.read_json(target.state / "status.json")["stage"], stage)
        target = self.target()
        with self.assertRaisesRegex(RuntimeError, "Empty database backup"):
            self.execute(target, empty_backup=True)

    def test_health_or_smoke_failure_keeps_previous_and_reports_unknown_running_state(self):
        target = self.target()
        self.execute(target)
        old = deploy.read_json(target.state / "current.json")
        for stage in ("app readiness", "public smoke"):
            target = self.target(self.newer, 2)
            with self.assertRaises(RuntimeError):
                self.execute(target, failing=stage if stage == "app readiness" else None,
                             smoke_failure=stage == "public smoke")
            self.assertEqual(deploy.read_json(target.state / "current.json"), old)
            status = deploy.read_json(target.state / "status.json")
            self.assertEqual(status["outcome"], "failed")
            self.assertEqual(status["database_rollback"], "never automatic")
            self.assertTrue(target.backup.exists())

    def test_missing_or_modified_migration_refuses_app_downgrade(self):
        target = self.target()
        self.execute(target)
        latest = deploy.read_json(target.state / "latest.json")
        latest["migrations"]["V2__already_attempted.sql"] = "f" * 64
        deploy.atomic_json(target.state / "latest.json", latest)
        target = self.target(self.newer, 2)
        with self.assertRaisesRegex(ValueError, "Migration history"):
            self.execute(target)

    def test_repository_and_commit_arguments_cannot_inject_commands(self):
        for repository in ("other;cmd/project", "../project", "owner/project;touch"):
            with self.assertRaises(ValueError):
                deploy.repository_url(repository)
        with self.assertRaises(ValueError):
            deploy.Deployment(self.root, "main;cmd", 1, REPO)

    def test_api_report_gate_refuses_skips_and_missing_reports(self):
        reports = self.folder / "reports"
        reports.mkdir()
        command = [sys.executable, str(ROOT / "deploy/check-test-reports.py"), str(reports)]
        self.assertNotEqual(subprocess.run(command, capture_output=True).returncode, 0)
        for skipped in (0, 1):
            (reports / "TEST-fixture.xml").write_text(f'<testsuite tests="1" failures="0" errors="0" skipped="{skipped}"/>')
            self.assertEqual(subprocess.run(command, capture_output=True).returncode, skipped)

    def test_production_compose_build_contexts_tokens_ports_and_preserved_volumes(self):
        names = ("POSTGRES_PASSWORD", "JWT_SECRET_KEY", "ENCRYPTION_KEY", "ENCRYPTION_SALT", "OLYMPIC_ADMIN_EMAIL",
                 "OLYMPIC_ADMIN_USERNAME", "OLYMPIC_ADMIN_PASSWORD", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY",
                 "CLOUDINARY_API_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET",
                 "MAIL_HOST", "MAIL_FROM")
        self.secret.write_text("\n".join(f"{name}=synthetic-fixture" for name in names))
        env = {k: v for k, v in os.environ.items() if k in ("PATH", "HOME", "LANG")}
        env.update(DEPLOY_SHA=self.sha, PRODUCTION_ENV_FILE=str(self.secret))
        r = subprocess.run(["docker", "compose", "--env-file", str(self.secret), "-f", str(ROOT / "deploy/compose.prod.yml"),
                            "config", "--format", "json"], cwd=self.folder, env=env, capture_output=True, check=True)
        config = json.loads(r.stdout)  # Never print expanded config, even synthetic fixtures.
        for service, item in config["services"].items():
            if service in ("api", "web"):
                self.assertIn("build", item)
                self.assertTrue(item["image"].endswith(":" + self.sha))
                self.assertEqual(item["build"]["labels"]["org.opencontainers.image.revision"], self.sha)
            else:
                self.assertFalse(item.get("ports"))
            for port in item.get("ports", []):
                self.assertEqual(port["host_ip"], "127.0.0.1")
        self.assertEqual(config["services"]["api"]["environment"]["SPRING_PROFILES_ACTIVE"], "prod")
        self.assertEqual(config["services"]["api"]["environment"]["MAIL_PORT"], "2525")
        self.assertEqual(config["services"]["web"]["build"]["args"]["RELEASE_SHA"], self.sha)
        for name in ("postgres", "redis", "api-storage"):
            key = name + "-data" if name in ("postgres", "redis") else name
            self.assertEqual(config["volumes"][key]["name"], "olympic_platform_" + key)

    def test_public_smoke_identity_api_asset_and_private_actuator(self):
        def get(path):
            if path == "/release.json": return json.dumps({"sha": self.sha}).encode(), {"Cache-Control": "no-store"}
            if path == "/": return b'<div id="root"></div><script src="/assets/fixture.js"></script>', {}
            if path.startswith("/assets/"): return b"console.log('fixture')", {}
            if path == "/api/v1/documents/metadata": return b'{"categories":[],"subjects":[],"tags":[]}', {}
            raise HTTPError(path, 404, "Blocked", {}, None)
        with patch("smoke.get", side_effect=get):
            smoke.check(self.sha)
            with self.assertRaises(ValueError): smoke.check("b" * 40)
        with patch("smoke.get", side_effect=OSError("fixture offline")), patch("smoke.time.sleep"):
            with self.assertRaises(RuntimeError): smoke.wait(self.sha)


if __name__ == "__main__":
    os.umask(0o077)
    unittest.main()
