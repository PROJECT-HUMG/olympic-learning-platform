"""Immutable release manifest. Public build inputs only, never production secrets."""
import argparse
import hashlib
import json
import os
import re
from pathlib import Path

ORIGIN = "https://olympic.nghlong3004.me"
BUNDLE_FILES = ("compose.prod.yml", "deploy.py", "release.py", "smoke.py")


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate(manifest, repository=None):
    if manifest.get("version") != 1:
        raise ValueError("Unsupported release format")
    repo = manifest.get("repository", "")
    if not re.fullmatch(r"[a-z0-9_.-]+/[a-z0-9_.-]+", repo) or (repository and repo != repository):
        raise ValueError("Release repository mismatch")
    sha = manifest.get("sha", "")
    if not re.fullmatch(r"[a-f0-9]{40}", sha):
        raise ValueError("Expected complete commit SHA")
    if not re.fullmatch(sha + r"-[1-9][0-9]*-[1-9][0-9]*", manifest.get("id", "")):
        raise ValueError("Invalid release directory identity")
    if type(manifest.get("sequence")) is not int or manifest["sequence"] < 1:
        raise ValueError("Invalid workflow sequence")
    for service in ("api", "web"):
        prefix = f"ghcr.io/{repo}-{service}@sha256:"
        if not re.fullmatch(re.escape(prefix) + r"[a-f0-9]{64}", manifest.get(service + "_image", "")):
            raise ValueError("Expected repository-owned digest image")
    migrations = manifest.get("migrations", {})
    if not migrations or any(not re.fullmatch(r"V[0-9]+__[a-zA-Z0-9_]+\.sql", k)
                             or not re.fullmatch(r"[a-f0-9]{64}", v) for k, v in migrations.items()):
        raise ValueError("Missing or invalid migration fingerprint")
    config = manifest.get("public_config", {})
    if config.get("turnstile_enabled") not in ("true", "false"):
        raise ValueError("Invalid public Turnstile setting")
    if config["turnstile_enabled"] == "true" and not config.get("turnstile_site_key"):
        raise ValueError("Enabled web protection requires a public site key")
    if set(manifest.get("bundle", {})) != set(BUNDLE_FILES):
        raise ValueError("Incomplete deployment bundle")
    return manifest


def read_release(folder, repository=None):
    manifest = validate(json.loads((folder / "release.json").read_text()), repository)
    if folder.name != manifest["id"]:
        raise ValueError("Release path does not match manifest")
    for filename, digest in manifest["bundle"].items():
        if sha256(folder / "deploy" / filename) != digest:
            raise ValueError("Deployment bundle bytes changed")
    return manifest


def create(output):
    owner = os.environ["GITHUB_REPOSITORY"].lower()
    sha = os.environ["GITHUB_SHA"]
    manifest = {
        "version": 1, "repository": owner, "sha": sha,
        "id": f'{sha}-{os.environ["GITHUB_RUN_ID"]}-{os.environ["GITHUB_RUN_ATTEMPT"]}',
        "sequence": int(os.environ["GITHUB_RUN_NUMBER"]),
        "api_image": f'ghcr.io/{owner}-api@{os.environ["API_DIGEST"]}',
        "web_image": f'ghcr.io/{owner}-web@{os.environ["WEB_DIGEST"]}',
        "migrations": {p.name: sha256(p) for p in sorted(Path("apps/api/src/main/resources/db/migration").glob("V*.sql"))},
        "public_config": {"turnstile_enabled": os.environ.get("VITE_TURNSTILE_ENABLED", "false"),
                          "turnstile_site_key": os.environ.get("VITE_TURNSTILE_SITE_KEY", "")},
        "bundle": {name: sha256(Path(__file__).parent / name) for name in BUNDLE_FILES},
    }
    validate(manifest)
    output.write_text(json.dumps(manifest, indent=2) + "\n")
    print(manifest["id"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["create"])
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    create(args.output)
