"""Real OpenSSH parsing with disposable keys; transport is mocked, never connected."""
import hashlib
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "ssh-deploy.sh"
RELEASE = "a" * 40 + "-1-1"


@unittest.skipUnless(shutil.which("ssh") and shutil.which("ssh-keygen"), "OpenSSH CLI unavailable")
class SshTransportTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="olympic ssh fixture ")
        self.root = Path(self.temporary.name)
        self.keygen = shutil.which("ssh-keygen")
        key = self.root / "dummy-key"
        subprocess.run([self.keygen, "-q", "-t", "ed25519", "-N", "", "-f", str(key)], check=True)
        self.key = key.read_text()
        self.public = " ".join(key.with_suffix(".pub").read_text().split()[:2])
        self.log = self.root / "transport.jsonl"
        tools = self.root / "tools"
        tools.mkdir()
        # Real ssh -G and ssh-keygen parse the generated config/key. No socket used.
        mock = '''#!/usr/bin/env python3
import hashlib, json, os, pathlib, subprocess, sys
name = pathlib.Path(sys.argv[0]).name
config = pathlib.Path(sys.argv[2])
parsed = subprocess.run([os.environ["REAL_SSH"], "-G", "-F", str(config), "production"], capture_output=True)
if parsed.returncode: sys.exit(255)
values = {}
for line in parsed.stdout.decode().splitlines():
    k, _, v = line.partition(" ")
    values.setdefault(k, v)
key = pathlib.Path(values["identityfile"])
hosts = config.parent / "known_hosts"
if subprocess.run([os.environ["REAL_KEYGEN"], "-y", "-P", "", "-f", str(key)], capture_output=True).returncode: sys.exit(255)
body = sys.stdin.read() if name == "ssh" else ""
if body and subprocess.run(["bash", "-n"], input=body, text=True, capture_output=True).returncode: sys.exit(2)
record = {"command": name, "args": sys.argv[1:], "config": str(config), "key": str(key),
          "hosts": str(hosts), "key_mode": key.stat().st_mode & 0o777,
          "hosts_mode": hosts.stat().st_mode & 0o777, "dir_mode": config.parent.stat().st_mode & 0o777,
          "key_sha": hashlib.sha256(key.read_bytes()).hexdigest(),
          "hosts_sha": hashlib.sha256(hosts.read_bytes()).hexdigest(), "values": values, "body": body}
with open(os.environ["TRANSPORT_LOG"], "a") as out: out.write(json.dumps(record) + "\\n")
sys.exit(255 if os.environ.get("FAIL_STAGE") == name else 0)
'''
        for name in ("ssh", "scp"):
            f = tools / name
            f.write_text(mock)
            f.chmod(0o700)
        (self.root / "release.tar.gz").write_bytes(b"dummy archive")
        self.env = {k: v for k, v in os.environ.items() if k in ("PATH", "HOME", "LANG")}
        self.env.update(PATH=str(tools) + os.pathsep + os.environ["PATH"], TMPDIR=str(self.root),
                        REAL_SSH=shutil.which("ssh"), REAL_KEYGEN=self.keygen,
                        TRANSPORT_LOG=str(self.log), DEPLOY_HOST="fixture.example.test",
                        DEPLOY_USER="deployer", DEPLOY_PORT="2222", RELEASE_ID=RELEASE,
                        DEPLOY_SSH_KEY=self.key,
                        DEPLOY_KNOWN_HOSTS=f"[fixture.example.test]:2222 {self.public}\n")

    def tearDown(self):
        self.temporary.cleanup()

    def run_script(self, **overrides):
        self.log.unlink(missing_ok=True)
        return subprocess.run(["bash", str(SCRIPT)], cwd=self.root,
                              env=dict(self.env, **overrides), capture_output=True)

    def records(self):
        return [json.loads(line) for line in self.log.read_text().splitlines()] if self.log.exists() else []

    def assert_cleaned(self):
        for r in self.records():
            self.assertFalse(Path(r["config"]).parent.exists())
        self.assertFalse(list(self.root.glob("tmp.*")))

    def test_lf_crlf_final_newline_and_nonstandard_port_preserve_content_and_contract(self):
        for newline, port, final in [("\n", "22", True), ("\r\n", "2222", True), ("\n", "2222", False)]:
            with self.subTest(newline=repr(newline), port=port, final=final):
                host = "fixture.example.test" if port == "22" else f"[fixture.example.test]:{port}"
                hosts = f"{host} {self.public}\n"
                key_input = self.key if final else self.key.rstrip("\n")
                r = self.run_script(DEPLOY_PORT=port, DEPLOY_SSH_KEY=key_input.replace("\n", newline),
                                    DEPLOY_KNOWN_HOSTS=hosts.replace("\n", newline))
                self.assertEqual(r.returncode, 0, r.stderr.decode())
                records = self.records()
                self.assertEqual([x["command"] for x in records], ["scp", "ssh"])
                for x in records:
                    self.assertEqual(x["key_sha"], hashlib.sha256((self.key + ("\n" if final else "")).encode()).hexdigest())
                    self.assertEqual(x["hosts_sha"], hashlib.sha256((hosts + "\n").encode()).hexdigest())
                    self.assertEqual((x["key_mode"], x["hosts_mode"], x["dir_mode"]), (0o600, 0o600, 0o700))
                    self.assertEqual(x["values"]["hostname"], "fixture.example.test")
                    self.assertEqual(x["values"]["user"], "deployer")
                    self.assertEqual(x["values"]["port"], port)
                    self.assertEqual(x["values"]["stricthostkeychecking"], "true")
                    self.assertEqual(x["values"]["batchmode"], "yes")
                    self.assertEqual(x["values"]["identitiesonly"], "yes")
                self.assertEqual(records[0]["args"], ["-F", records[0]["config"], "release.tar.gz",
                                                     f"production:/opt/olympic/incoming/{RELEASE}.tar.gz"])
                self.assertEqual(records[1]["args"], ["-F", records[1]["config"], "production", f"bash -s -- '{RELEASE}'"])
                self.assertIn('id=$1', records[1]["body"])
                self.assertIn('root=/opt/olympic', records[1]["body"])
                self.assertIn('timeout --signal=TERM --kill-after=30s 1500s python3', records[1]["body"])
                self.assertNotIn(self.key.encode(), r.stdout + r.stderr)
                self.assert_cleaned()

    def test_hashed_known_host_matches_without_replacing_host_trust(self):
        hosts = self.root / "hashed-hosts"
        hosts.write_text(self.env["DEPLOY_KNOWN_HOSTS"])
        subprocess.run([self.keygen, "-H", "-f", str(hosts)], capture_output=True, check=True)
        r = self.run_script(DEPLOY_KNOWN_HOSTS=hosts.read_text())
        self.assertEqual(r.returncode, 0, r.stderr.decode())
        self.assert_cleaned()

    def test_invalid_encrypted_escaped_key_or_wrong_host_port_refuse_network_and_clean_up(self):
        encrypted = self.root / "encrypted-key"
        subprocess.run([self.keygen, "-q", "-t", "ed25519", "-N", "dummy-passphrase", "-f", str(encrypted)], check=True)
        for change in ({"DEPLOY_SSH_KEY": "invalid-dummy-key"},
                       {"DEPLOY_SSH_KEY": self.key.replace("\n", "\\n")},
                       {"DEPLOY_SSH_KEY": encrypted.read_text()},
                       {"DEPLOY_KNOWN_HOSTS": f"other.example.test {self.public}"},
                       {"DEPLOY_KNOWN_HOSTS": f"fixture.example.test {self.public}"},
                       {"DEPLOY_HOST": "fixture; invalid"}, {"DEPLOY_PORT": "65536"}):
            with self.subTest(fields=list(change)):
                r = self.run_script(**change)
                self.assertNotEqual(r.returncode, 0)
                self.assertEqual(self.records(), [])
                self.assertNotIn(self.key.encode(), r.stdout + r.stderr)
                self.assert_cleaned()

    def test_transport_exit_and_stage_survive_failure_without_claiming_remote_rollback(self):
        for stage, message, count in (("scp", b"SSH release transfer", 1),
                                      ("ssh", b"SSH remote deployment session", 2)):
            with self.subTest(stage=stage):
                r = self.run_script(FAIL_STAGE=stage)
                self.assertEqual(r.returncode, 255)
                self.assertIn(message, r.stderr)
                self.assertIn(b"remote state may be unknown", r.stderr)
                self.assertEqual(len(self.records()), count)
                self.assert_cleaned()


if __name__ == "__main__":
    unittest.main()
