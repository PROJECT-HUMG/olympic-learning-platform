"""Single-host digest deployment. No automatic app or database rollback."""
import argparse
import fcntl
import json
import os
import re
import signal
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from release import ORIGIN, read_release
from smoke import wait as public_smoke


def atomic_json(path, value):
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, indent=2) + "\n")
    temporary.replace(path)


def read_json(path):
    return json.loads(path.read_text()) if path.exists() else None


class Deployment:
    def __init__(self, root, release_id):
        self.root = root.resolve()
        if not re.fullmatch(r"[a-f0-9]{40}-[1-9][0-9]*-[1-9][0-9]*", release_id):
            raise ValueError("Invalid release id")
        self.folder = self.root / "releases" / release_id
        if self.folder.is_symlink() or self.folder.resolve().parent != self.root / "releases":
            raise ValueError("Release must be an owned directory")
        config = json.loads((self.root / "shared" / "host-config.json").read_text())
        if config["public_origin"] != ORIGIN:
            raise ValueError("Host origin mismatch")
        self.manifest = read_release(self.folder, config["repository"])
        secret_file = self.root / "shared" / "production.env"
        if (not secret_file.is_file() or secret_file.stat().st_mode & 0o077
                or secret_file.stat().st_uid != os.geteuid()):
            raise ValueError("production.env must be deploy-user-owned with mode600 (or stricter)")
        # Explicit env-file prevents implicit loading of a repository/root .env.
        self.env = dict(os.environ, API_IMAGE=self.manifest["api_image"], WEB_IMAGE=self.manifest["web_image"],
                        PRODUCTION_ENV_FILE=str(secret_file))
        self.compose = ["docker", "compose", "--project-name", "olympic_platform", "--env-file", str(secret_file),
                        "-f", str(self.folder / "deploy" / "compose.prod.yml")]
        self.state = self.root / "state"
        self.state.mkdir(mode=0o700, exist_ok=True)
        self.stage = "preflight"
        self.backup = None

    def run(self, args, timeout=120, output=None):
        # Command stdout/stderr may include interpolated secrets; never forward them.
        result = subprocess.run(args, env=self.env, stdout=output or subprocess.PIPE,
                                stderr=subprocess.PIPE, timeout=timeout, check=False)
        if result.returncode:
            raise RuntimeError(f"{self.stage} command failed (exit {result.returncode})")
        return result.stdout

    def record(self, outcome, previous, evidence=None):
        atomic_json(self.state / "status.json", {"outcome": outcome, "stage": self.stage,
            "release": self.manifest["id"], "sha": self.manifest["sha"],
            "previous": previous, "backup": str(self.backup) if self.backup else None,
            "time": datetime.now(timezone.utc).isoformat(), "evidence": evidence,
            "database_rollback": "never automatic"})

    def execute(self, rollback=False, schema_compatible=False):
        with (self.state / "deploy.lock").open("w") as lock:
            # Host lock supplements GitHub concurrency, including manual recovery.
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            current = read_json(self.state / "current.json")
            previous = current["id"] if current else None
            last_status = read_json(self.state / "status.json")
            latest = read_json(self.state / "latest.json") or {"sequence": 0}
            if rollback:
                if not schema_compatible or not current:
                    raise ValueError("Rollback requires a known release and explicit schema-compatible acknowledgment")
                active_id = last_status["release"] if last_status and last_status["outcome"] != "healthy" else current["id"]
                active = read_release(self.root / "releases" / active_id, self.manifest["repository"])
                if active["migrations"] != self.manifest["migrations"]:
                    raise ValueError("Migration fingerprints differ; forward repair/schema review required")
            elif self.manifest["sequence"] < latest["sequence"]:
                raise ValueError("Superseded push refused; no changes made")
            def mark(stage):
                self.stage = stage
                self.record("deploying", previous)

            self.record("deploying", previous)
            try:
                mark("compose validation")
                self.run(self.compose + ["config", "--quiet"])
                mark("image pull")
                self.run(self.compose + ["pull", "api", "web"], timeout=300)
                for service in ("api", "web"):
                    image_format = '{"arch":{{json .Architecture}},"os":{{json .Os}},"revision":{{json (index .Config.Labels "org.opencontainers.image.revision")}}}'
                    info = json.loads(self.run(["docker", "image", "inspect", "--format", image_format, self.manifest[service + "_image"]]))
                    if info["arch"] != "amd64" or info["os"] != "linux" or info["revision"] != self.manifest["sha"]:
                        raise ValueError("Image platform/revision mismatch")
                mark("data service readiness")
                self.run(self.compose + ["up", "-d", "--wait", "--wait-timeout", "180", "postgres", "redis"], timeout=210)
                mark("pre-migration backup")
                backups = self.root / "backups"
                backups.mkdir(mode=0o700, exist_ok=True)
                stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
                self.backup = backups / (self.manifest["id"] + "-" + stamp + ".dump")
                # Exclusive file creation preserves earlier evidence, even on retries.
                with self.backup.open("xb") as output:
                    self.run(self.compose + ["exec", "-T", "postgres", "pg_dump", "-U", "olympic_platform",
                                            "-d", "olympic_platform", "--format=custom", "--no-owner", "--no-acl"], timeout=180, output=output)
                if self.backup.stat().st_size == 0:
                    raise RuntimeError("Empty database backup; deployment refused")
                mark("app readiness")
                atomic_json(self.state / "latest.json", {"sequence": max(latest["sequence"], self.manifest["sequence"])})
                self.record("deploying", previous)
                self.run(self.compose + ["up", "-d", "--no-build", "--no-deps", "--wait", "--wait-timeout", "420", "api", "web"], timeout=480)
                for service in ("api", "web"):
                    container = self.run(self.compose + ["ps", "-q", service]).decode().strip()
                    container_format = '{"image":{{json .Config.Image}},"health":{{json .State.Health.Status}}}'
                    info = json.loads(self.run(["docker", "inspect", "--format", container_format, container]))
                    if info["image"] != self.manifest[service + "_image"] or info["health"] != "healthy":
                        raise RuntimeError("Running digest or health mismatch")
                mark("public smoke")
                evidence = public_smoke(self.manifest["sha"])
                if current and current["id"] != self.manifest["id"]:
                    atomic_json(self.state / "previous.json", current)
                atomic_json(self.state / "current.json", self.manifest)
                self.stage = "complete"
                self.record("healthy", previous, evidence)
                print(json.dumps({"outcome": "healthy", "release": self.manifest["id"], "evidence": evidence}))
            except (Exception, KeyboardInterrupt):
                # Running apps/schema may already have changed. Never claim old apps restored.
                self.record("failed", previous)
                raise


def interrupted(_signum, _frame):
    raise RuntimeError("Deployment interrupted; inspect recorded state")


if __name__ == "__main__":
    os.umask(0o077)
    signal.signal(signal.SIGTERM, interrupted)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["deploy", "rollback"])
    parser.add_argument("release")
    parser.add_argument("--root", type=Path, default=Path("/opt/olympic"))
    parser.add_argument("--schema-compatible", action="store_true")
    args = parser.parse_args()
    try:
        Deployment(args.root, args.release).execute(args.command == "rollback", args.schema_compatible)
    except (Exception, KeyboardInterrupt) as error:
        # No child output/expanded config/secret values in delivery logs.
        reason = str(error) if isinstance(error, (ValueError, RuntimeError)) else type(error).__name__
        print(f"Deployment failed: {reason}; inspect host state/status.json and restricted service logs.", file=sys.stderr)
        sys.exit(1)
