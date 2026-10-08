"""Owned checkout deployment: exact tested commit, server builds, backup before migrations."""
import argparse
import fcntl
import hashlib
import json
import os
import platform
import re
import shutil
import signal
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


def atomic_json(path, value):
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, indent=2) + "\n")
    temporary.replace(path)


def read_json(path):
    return json.loads(path.read_text()) if path.exists() else None


def repository_url(repository):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*/[A-Za-z0-9][A-Za-z0-9_.-]*", repository):
        raise ValueError("Invalid GitHub repository")
    return "https://github.com/" + repository.lower() + ".git"


class Deployment:
    def __init__(self, root, sha, sequence, repository):
        if not re.fullmatch(r"[a-f0-9]{40}", sha) or type(sequence) is not int or sequence < 1:
            raise ValueError("Full tested commit SHA and positive workflow sequence required")
        self.url = repository_url(repository)
        self.repository = repository.lower()
        self.sha, self.sequence = sha, sequence
        self.root = root.resolve()
        self.checkout = self.root / "checkout"
        self.stage, self.backup = "bootstrap", None
        self.env = dict(os.environ, GIT_TERMINAL_PROMPT="0", DEPLOY_SHA=sha,
                        PRODUCTION_ENV_FILE=str(self.root / ".env"),
                        COMPOSE_PARALLEL_LIMIT="1")
        self.compose = ["docker", "compose", "--project-name", "olympic_platform", "--env-file",
                        self.env["PRODUCTION_ENV_FILE"], "-f", str(self.checkout / "deploy" / "compose.prod.yml")]
        self.state = self.root / "state"

    def run(self, args, timeout=120, output=None, hint="Inspect the corresponding host command safely"):
        # Production dotenv/child errors may contain credentials. Never forward child output.
        process = subprocess.Popen(args, env=self.env, stdout=output or subprocess.PIPE,
                                   stderr=subprocess.PIPE, start_new_session=True)
        try:
            stdout, _stderr = process.communicate(timeout=timeout)
        except BaseException as error:
            # Docker CLI can spawn a Compose plugin. Stop the owned process group
            # before releasing the checkout lock on timeout or interruption.
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            process.communicate()
            if isinstance(error, subprocess.TimeoutExpired):
                raise RuntimeError(f"{self.stage} timed out after {timeout}s. {hint}") from None
            raise
        if process.returncode:
            raise RuntimeError(f"{self.stage} failed (exit {process.returncode}). {hint}")
        return stdout

    def git(self, *args):
        return self.run(["git", "-C", str(self.checkout), *args], timeout=180,
                        hint="Check checkout permissions, GitHub HTTPS reachability and repository read access")

    def record(self, outcome, previous=None, evidence=None):
        atomic_json(self.state / "status.json", {"outcome": outcome, "stage": self.stage,
            "sha": self.sha, "sequence": self.sequence, "previous": previous,
            "backup": str(self.backup) if self.backup else None,
            "time": datetime.now(timezone.utc).isoformat(), "evidence": evidence,
            "database_rollback": "never automatic"})

    def bootstrap(self):
        try:
            self.root.mkdir(mode=0o700, exist_ok=True)
            if self.root.stat().st_uid != os.geteuid():
                raise ValueError("/opt/olympic must be owned by the configured deploy user; operator must correct ownership without replacing data")
            for name in ("state", "backups"):
                directory = self.root / name
                if directory.is_symlink():
                    raise ValueError("Owned deployment directories must not be symlinks")
                directory.mkdir(mode=0o700, exist_ok=True)
        except OSError:
            raise ValueError("Cannot create owned /opt/olympic folders; operator: install -d -m700 -o <deploy-user> /opt/olympic") from None
        if platform.system() != "Linux" or platform.machine() not in ("x86_64", "amd64"):
            raise ValueError("This production target requires linux/amd64")
        for tool in ("git", "docker"):
            if not shutil.which(tool):
                raise ValueError(f"Host prerequisite missing: {tool}; install through the operator setup")
        secret = self.root / ".env"
        if not secret.is_file():
            raise ValueError("Missing /opt/olympic/.env; verify the reported operator file exists, without replacing credentials")
        if secret.stat().st_uid != os.geteuid() or secret.stat().st_mode & 0o077:
            raise ValueError("/opt/olympic/.env must be deploy-user-owned mode600 or stricter; never print its contents")

    def update_checkout(self):
        if self.checkout.is_symlink():
            raise ValueError("Owned checkout must not be a symlink")
        if not (self.checkout / ".git").exists():
            if self.checkout.exists() and any(self.checkout.iterdir()):
                raise ValueError("Checkout path is nonempty without Git; preserve operator files and choose/prepare the owned checkout")
            self.checkout.mkdir(mode=0o700, exist_ok=True)
            self.git("init", "--quiet")
            self.git("remote", "add", "origin", self.url)
        if self.checkout.stat().st_uid != os.geteuid():
            raise ValueError("Checkout must be owned by deploy user")
        origin = self.git("remote", "get-url", "origin").decode().strip().lower()
        allowed = {self.url, self.url.removesuffix(".git"), f"git@github.com:{self.repository}.git",
                   f"ssh://git@github.com/{self.repository}.git"}
        if origin not in allowed:
            raise ValueError("Checkout origin differs from configured GitHub repository; no remote was changed")
        if self.git("status", "--porcelain", "--untracked-files=all").strip():
            raise ValueError("Checkout has local changes/untracked files; preserve and resolve them outside deployment. No reset/clean performed")
        # HTTPS for this public repository avoids a second server-side SSH credential.
        self.git("fetch", "--no-tags", "--depth=1", self.url, self.sha)
        fetched = self.git("rev-parse", "FETCH_HEAD^{commit}").decode().strip()
        if fetched != self.sha:
            raise ValueError("Fetched commit differs from the tested SHA")
        names = self.git("ls-tree", "-r", "--name-only", self.sha).decode().splitlines()
        if any((Path(n).name == ".env" or Path(n).name.startswith(".env.") or Path(n).name == "production.env")
               and Path(n).name != ".env.example" for n in names):
            raise ValueError("Tested tree contains a protected env path; deployment refused")
        self.git("checkout", "--detach", "--no-overwrite-ignore", self.sha)
        if self.git("rev-parse", "HEAD").decode().strip() != self.sha:
            raise ValueError("Checkout identity mismatch")

    def public_smoke(self):
        sys.path.insert(0, str(self.checkout / "deploy"))
        from smoke import wait
        return wait(self.sha)

    def execute(self):
        self.bootstrap()
        with (self.state / "deploy.lock").open("w") as lock:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                raise ValueError("Another checkout/build/deployment owns the host lock; no changes made") from None
            current = read_json(self.state / "current.json")
            latest = read_json(self.state / "latest.json") or {"sequence": 0}
            if self.sequence < latest["sequence"] or (self.sequence == latest["sequence"] and latest.get("sha", self.sha) != self.sha):
                raise ValueError("Superseded/mismatched workflow sequence refused; no checkout/app changes made")
            previous = current.get("sha") if current else None
            def mark(stage):
                self.stage = stage
                self.record("deploying", previous)
            try:
                mark("host prerequisites")
                self.run(["docker", "info", "--format", "{{.ServerVersion}}"], hint="Deploy user needs access to the Docker daemon")
                version = self.run(["docker", "compose", "version", "--short"]).decode().strip()
                numbers = re.match(r"v?([0-9]+)\.([0-9]+)", version)
                if not numbers or tuple(map(int, numbers.groups())) < (2, 24):
                    raise ValueError("Docker Compose plugin >=2.24 required")
                capacity = {}
                for line in Path("/proc/meminfo").read_text().splitlines():
                    key, _, value = line.partition(":")
                    if key in ("MemTotal", "SwapTotal", "MemAvailable", "SwapFree"):
                        capacity[key + "MiB"] = int(value.split()[0]) // 1024
                print(json.dumps({"host_capacity": capacity, "builds": "sequential; small-server fit unverified"}))
                if capacity.get("MemTotalMiB", 0) < 1536:
                    print("::warning::Uncapped Compose builds on a small host can exhaust RAM/swap or stall SSH; runtime service caps do not limit build memory.")
                mark("tested checkout")
                self.update_checkout()
                migrations = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in
                              sorted((self.checkout / "apps/api/src/main/resources/db/migration").glob("V*.sql"))}
                baseline = latest.get("migrations") or (current or {}).get("migrations", {})
                if not migrations or any(migrations.get(k) != v for k, v in baseline.items()):
                    raise ValueError("Migration history removed/changed; forward repair/schema review required, no automatic downgrade")
                mark("production Compose validation")
                self.run(self.compose + ["config", "--quiet"], hint="Check required /opt/olympic/.env values privately; never dump expanded Compose")
                # Ordinary Compose builds, ordered to avoid API/web build overlap.
                for service, limit in (("api", 1200), ("web", 900)):
                    mark(service + " server build")
                    self.run(self.compose + ["build", service], timeout=limit,
                             hint="Inspect the API/web Docker build error privately and host RAM/swap/disk; running apps have not been replaced")
                image_ids = {}
                for service in ("api", "web"):
                    image = f"olympic-platform-{service}:{self.sha}"
                    fmt = '{"id":{{json .Id}},"arch":{{json .Architecture}},"os":{{json .Os}},"revision":{{json (index .Config.Labels "org.opencontainers.image.revision")}}}'
                    info = json.loads(self.run(["docker", "image", "inspect", "--format", fmt, image]))
                    if info["arch"] != "amd64" or info["os"] != "linux" or info["revision"] != self.sha:
                        raise ValueError("Built image platform/revision mismatch")
                    image_ids[service] = info["id"]
                mark("data service readiness")
                self.run(self.compose + ["up", "-d", "--wait", "--wait-timeout", "180", "postgres", "redis"], timeout=210,
                         hint="Inspect PostgreSQL/Redis health; preserve existing passwords and named volumes")
                mark("pre-migration backup")
                stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
                self.backup = self.root / "backups" / (self.sha + "-" + stamp + ".dump")
                with os.fdopen(os.open(self.backup, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), "wb") as output:
                    self.run(self.compose + ["exec", "-T", "postgres", "pg_dump", "-U", "olympic_platform", "-d", "olympic_platform",
                                            "--format=custom", "--no-owner", "--no-acl"], timeout=180, output=output,
                             hint="Database snapshot failed; no app replacement permitted")
                if not self.backup.stat().st_size:
                    raise RuntimeError("Empty database backup; app replacement refused")
                attempted = {"sha": self.sha, "sequence": self.sequence, "migrations": migrations, "image_ids": image_ids}
                atomic_json(self.state / "latest.json", attempted)
                mark("app readiness")
                self.run(self.compose + ["up", "-d", "--no-build", "--no-deps", "--wait", "--wait-timeout", "420", "api", "web"], timeout=480,
                         hint="Inspect restricted app/Flyway logs and backup; no automatic rollback")
                for service in ("api", "web"):
                    container = self.run(self.compose + ["ps", "-q", service]).decode().strip()
                    fmt = '{"image":{{json .Image}},"health":{{json .State.Health.Status}}}'
                    info = json.loads(self.run(["docker", "inspect", "--format", fmt, container]))
                    if info["image"] != image_ids[service] or info["health"] != "healthy":
                        raise RuntimeError("Running image identity/health mismatch")
                mark("public smoke")
                evidence = self.public_smoke()
                if current and current.get("sha") != self.sha:
                    atomic_json(self.state / "previous.json", current)
                atomic_json(self.state / "current.json", attempted)
                self.stage = "complete"
                self.record("healthy", previous, evidence)
                print(json.dumps({"outcome": "healthy", "sha": self.sha, "evidence": evidence}))
            except (Exception, KeyboardInterrupt) as error:
                self.record("failed", previous, {"reason": str(error) if isinstance(error, (ValueError, RuntimeError)) else type(error).__name__})
                raise


def interrupted(_signum, _frame):
    raise RuntimeError("Deployment interrupted; inspect host state before recovery")


if __name__ == "__main__":
    os.umask(0o077)
    signal.signal(signal.SIGTERM, interrupted)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sha")
    parser.add_argument("sequence", type=int)
    parser.add_argument("repository")
    parser.add_argument("--root", type=Path, default=Path("/opt/olympic"))
    args = parser.parse_args()
    try:
        Deployment(args.root, args.sha, args.sequence, args.repository).execute()
    except (Exception, KeyboardInterrupt) as error:
        reason = str(error) if isinstance(error, (ValueError, RuntimeError)) else type(error).__name__
        print(f"::error::Deployment failed: {reason}. Inspect /opt/olympic/state/status.json; no automatic rollback.", file=sys.stderr)
        sys.exit(1)
