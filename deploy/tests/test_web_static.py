"""Serve restrictive public-file fixtures through the actual web runtime image."""
import shutil
import subprocess
import tempfile
import time
import unittest
import uuid
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]


@unittest.skipUnless(shutil.which("docker"), "Docker CLI unavailable")
class WebStaticTests(unittest.TestCase):
    def test_nginx_worker_reads_restrictive_build_assets_without_write_access(self):
        image = "olympic-static-test:" + uuid.uuid4().hex
        container = None
        def docker(*args):
            return subprocess.check_output(["docker", *args], stderr=subprocess.STDOUT, timeout=180).decode().strip()
        with tempfile.TemporaryDirectory(prefix="olympic-static-test-") as temporary:
            folder = Path(temporary)
            dist = folder / "dist"
            dist.mkdir(mode=0o755)
            (dist / "index.html").write_text('<div id="root">synthetic fixture</div>')
            (dist / "index.html").chmod(0o644)
            fixtures = {"favicon.svg": b'<svg xmlns="http://www.w3.org/2000/svg"/>',
                        "icons.svg": b'<svg xmlns="http://www.w3.org/2000/svg"/>',
                        "social-icons/github.png": b"synthetic png fixture",
                        "images/anime-day.webp": b"synthetic webp fixture",
                        "videos/anime-day.mp4": b"synthetic video fixture"}
            # Vite preserves restrictive public-file modes after checkout umask077.
            # Include restrictive input directories to test traversal repair too.
            for name, content in fixtures.items():
                path = dist / name
                path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
                path.write_bytes(content)
                path.chmod(0o600)
            source = (ROOT / "apps/web/Dockerfile").read_text()
            runtime = source[source.index("FROM nginx:"):]
            runtime = runtime.replace("COPY --from=build /workspace/dist", "COPY dist")
            (folder / "Dockerfile").write_text(runtime)
            shutil.copyfile(ROOT / "apps/web/nginx.conf", folder / "nginx.conf")
            try:
                docker("build", "--tag", image, str(folder))
                container = docker("run", "--detach", "--memory", "32m", "--memory-swap", "48m",
                                   "--cpus", "0.5", "--env", "NGINX_ENTRYPOINT_WORKER_PROCESSES_AUTOTUNE=1",
                                   "--add-host", "api:127.0.0.1", "--publish", "127.0.0.1::80", image)
                address = docker("port", container, "80/tcp")
                origin = "http://" + address
                for attempt in range(50):
                    try:
                        with urlopen(origin + "/", timeout=2) as response:
                            self.assertEqual(response.status, 200)
                        break
                    except (URLError, OSError):
                        if attempt == 49:
                            self.fail("Fixture nginx did not become ready: " + docker("logs", container)[-1500:])
                        time.sleep(0.2)
                for name, content in fixtures.items():
                    with self.subTest(path=name):
                        with urlopen(origin + "/" + name, timeout=3) as response:
                            self.assertEqual(response.status, 200)
                            self.assertEqual(response.read(), content)
                        docker("exec", "--user", "nginx", container, "sh", "-c",
                               'test -r "$1" && test ! -w "$1"', "sh", "/usr/share/nginx/html/" + name)
                request = Request(origin + "/videos/anime-day.mp4", headers={"Range": "bytes=0-3"})
                with urlopen(request, timeout=3) as response:
                    self.assertEqual(response.status, 206)
                    self.assertEqual(response.read(), b"synt")
            finally:
                if container:
                    subprocess.run(["docker", "rm", "--force", container], stdout=subprocess.DEVNULL,
                                   stderr=subprocess.DEVNULL, timeout=30)
                subprocess.run(["docker", "image", "rm", image], stdout=subprocess.DEVNULL,
                               stderr=subprocess.DEVNULL, timeout=30)


if __name__ == "__main__":
    unittest.main()
