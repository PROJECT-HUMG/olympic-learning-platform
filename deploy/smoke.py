"""Bounded public GET smoke checks; no login, writes, redirects or private data."""
import argparse
import json
import re
import time
from urllib.error import HTTPError
from urllib.request import build_opener, HTTPRedirectHandler, Request
from release import ORIGIN


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def get(path):
    request = Request(ORIGIN + path, headers={"Cache-Control": "no-cache", "User-Agent": "Olympic-deploy-smoke/1"})
    with build_opener(NoRedirect()).open(request, timeout=8) as response:
        return response.read(2_000_000), response.headers


def check(sha):
    if not re.fullmatch(r"[a-f0-9]{40}", sha):
        raise ValueError("Complete expected commit SHA required")
    marker, headers = get("/release.json")
    if json.loads(marker).get("sha") != sha or "no-store" not in headers.get("Cache-Control", ""):
        raise ValueError("Public web identity/cache mismatch")
    html, _ = get("/")
    if b'id="root"' not in html:
        raise ValueError("Public SPA document missing")
    asset = re.search(rb'(?:src|href)="(/assets/[^" ]+\.js)"', html)
    if not asset:
        raise ValueError("Public hashed JavaScript reference missing")
    js, _ = get(asset[1].decode())
    if not js or js.lstrip().lower().startswith(b"<!doctype"):
        raise ValueError("Public JavaScript request returned fallback document")
    metadata = json.loads(get("/api/v1/documents/metadata")[0])
    if not all(isinstance(metadata.get(k), list) for k in ("categories", "subjects", "tags")):
        raise ValueError("Public API metadata shape mismatch")
    try:
        get("/actuator/health/readiness")
    except HTTPError as error:
        if error.code != 404:
            raise ValueError("Unexpected public actuator response") from None
    else:
        raise ValueError("Actuator must not be publicly exposed")


def wait(sha):
    for attempt in range(6):
        try:
            check(sha)
            return {"origin": ORIGIN, "sha": sha, "attempts": attempt + 1,
                    "checks": ["release identity", "SPA", "hashed JS", "public API metadata", "actuator blocked"]}
        except (OSError, ValueError) as error:
            if attempt == 5:
                # Do not print response bodies, auth material or request metadata.
                raise RuntimeError("Public smoke failed after six attempts") from error
            time.sleep(5)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sha")
    args = parser.parse_args()
    try:
        print(json.dumps(wait(args.sha)))
    except (RuntimeError, ValueError):
        parser.exit(1, "Public smoke failed; expected identity/API/ingress not confirmed.\n")
