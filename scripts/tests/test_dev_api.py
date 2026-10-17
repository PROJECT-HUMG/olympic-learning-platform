"""Run the actual launcher/env loader with isolated JDKs and a Maven sentinel."""
from pathlib import Path
import shlex
import shutil
import subprocess
import tempfile
import unittest


REPO = Path(__file__).resolve().parents[2]


class DevApiJavaTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="humg-dev-api-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "project with spaces"
        (self.root / "scripts").mkdir(parents=True)
        (self.root / "apps/api").mkdir(parents=True)
        self.home = self.root / "home"
        self.home.mkdir()
        self.bin = self.root / "bin"
        self.bin.mkdir()
        for command in ("bash", "dirname", "sed"):
            (self.bin / command).symlink_to(shutil.which(command))
        for script in ("dev-api.sh", "load-env.sh"):
            shutil.copy2(REPO / "scripts" / script, self.root / "scripts" / script)
        (self.root / ".env.dev").write_text("SENTINEL=original\n")
        self.executable(self.root / "apps/api/mvnw", '''#!/bin/bash
if [[ "${CHECK_STRICT:-}" == 1 ]]; then
    [[ -o errexit && -o nounset && -o pipefail ]] || exit 97
fi
printf '%s\\n' "$JAVA_HOME" "$PWD" "$*" "$SENTINEL" "$PATH"
exit "${MAVEN_EXIT:-0}"
''')
        for command in ("curl", "wget", "sdk"):
            self.executable(self.bin / command, '''#!/bin/bash
printf 'unexpected external command\\n' >> "$HOME/network-attempt"
exit 99
''')
        self.env = {
            "HOME": str(self.home), "PATH": str(self.bin), "LC_ALL": "C",
        }

    def executable(self, path, content):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        path.chmod(0o755)

    def jdk(self, name, version="25.0.4", compiler=True, failure=False):
        root = self.root / name
        self.executable(root / "bin/java", f'''#!/bin/bash
if [[ "${{1:-}}" == -XshowSettings:properties ]]; then
    printf '    java.home = %s\\n' {shlex.quote(str(root))} >&2
fi
printf 'openjdk version "%s"\\n' {shlex.quote(version)} >&2
exit {1 if failure else 0}
''')
        if compiler:
            self.executable(root / "bin/javac", f'''#!/bin/bash
[[ -z "${{JAVA_TOOL_OPTIONS:-}}" ]] || printf 'Picked up JAVA_TOOL_OPTIONS\\n' >&2
printf 'javac %s\\n' {shlex.quote(version)} >&2
''')
        return root

    def sdkman(self, root=None, current=None, failure=False):
        root = root or self.home / ".sdkman"
        if current:
            (root / "candidates/java").mkdir(parents=True, exist_ok=True)
            (root / "candidates/java/current").symlink_to(current)
        self.executable(root / "bin/sdkman-init.sh", '''# Deliberate SDKMAN-like optional variables, stdout and shell side effects.
printf initialized > "$HOME/sdkman-initialized"
[[ -z "$OPTIONAL_SDKMAN_VARIABLE" ]] || exit 95
[[ "$SDKMAN_OFFLINE_MODE" == true && "$SDKMAN_OLD_PWD" == "$PWD" && -z "$SDKMAN_ENV" ]] || exit 96
printf 'SDKMAN initialization chatter\\n'
''' + ("exit 31\n" if failure else '''export JAVA_HOME="$SDKMAN_DIR/candidates/java/current"
export SENTINEL=changed-by-sdkman PATH=/invalid-sdkman-path
set +e +u
set +o pipefail
'''))
        return root

    def launch(self, expected=None, code=0, **env):
        result = subprocess.run(
            [shutil.which("bash"), "-euo", "pipefail", "scripts/dev-api.sh"],
            cwd=self.root, env={**self.env, **env}, text=True,
            capture_output=True, timeout=10,
        )
        self.assertEqual(result.returncode, code, result.stderr)
        self.assertFalse((self.home / "network-attempt").exists())
        if expected:
            values = result.stdout.splitlines()
            self.assertEqual(values, [str(expected), str(self.root / "apps/api"),
                                      "spring-boot:run", "original", str(self.bin)])
            self.assertEqual(result.stderr, "")
        else:
            self.assertEqual(result.stdout, "")
        return result

    def test_explicit_java_home_wins_without_loading_sdkman(self):
        explicit = self.jdk("explicit JDK")
        self.sdkman(failure=True)
        self.launch(expected=explicit, JAVA_HOME=str(explicit))
        self.assertFalse((self.home / "sdkman-initialized").exists())

    def test_env_file_selection_wins(self):
        explicit = self.jdk("env JDK")
        with (self.root / ".env.dev").open("a") as stream:
            stream.write("JAVA_HOME=" + shlex.quote(str(explicit)) + "\n")
        self.launch(expected=explicit)

    def test_unset_uses_home_sdkman_and_isolates_shell_changes(self):
        self.sdkman(current=self.jdk("selected JDK"))
        self.launch(expected=self.home / ".sdkman/candidates/java/current")

    def test_sdkman_shell_options_do_not_weaken_launcher(self):
        self.sdkman(current=self.jdk("strict JDK"))
        with (self.root / ".env.dev").open("a") as stream:
            stream.write("export SHELLOPTS\n")
        self.launch(expected=self.home / ".sdkman/candidates/java/current", CHECK_STRICT="1")

    def test_invalid_and_wrong_major_explicit_selections_fall_back(self):
        self.sdkman(current=self.jdk("SDK JDK"))
        for home in ("/does-not-exist", str(self.jdk("old JDK", "21.0.1"))):
            with self.subTest(home=home):
                self.launch(expected=self.home / ".sdkman/candidates/java/current", JAVA_HOME=home)

    def test_configured_sdkman_directory_wins(self):
        custom = self.sdkman(self.root / "custom SDK", self.jdk("custom JDK"))
        self.sdkman(current=self.jdk("default JDK"))
        self.launch(expected=custom / "candidates/java/current", SDKMAN_DIR=str(custom))

    def test_missing_configured_sdkman_falls_back_to_home(self):
        self.sdkman(current=self.jdk("home JDK"))
        self.launch(expected=self.home / ".sdkman/candidates/java/current", SDKMAN_DIR="/absent")

    def test_installed_project_java_precedes_default_without_executing_config(self):
        custom = self.sdkman(current=self.jdk("default JDK"))
        selected = self.jdk("project JDK")
        (custom / "candidates/java/25-project").symlink_to(selected)
        (self.root / ".sdkmanrc").write_text("java=25-project\nsdk install java fake\n")
        self.launch(expected=custom / "candidates/java/25-project")
        (custom / "candidates/java/25-api").symlink_to(self.jdk("API project JDK"))
        (self.root / "apps/api/.sdkmanrc").write_text("java=25-api # local selection\n")
        self.launch(expected=custom / "candidates/java/25-api")

    def test_missing_project_jdk_does_not_install(self):
        self.sdkman(current=self.jdk("default JDK"))
        (self.root / ".sdkmanrc").write_text("java=25-not-installed\n")
        self.launch(expected=self.home / ".sdkman/candidates/java/current")

    def test_path_fallback_with_sdkman_missing_or_failed(self):
        jdk = self.jdk("PATH JDK")
        (self.bin / "java").symlink_to(jdk / "bin/java")
        self.launch(expected=jdk)
        self.sdkman(failure=True)
        self.launch(expected=jdk)
        self.sdkman(current=self.jdk("old SDK default", "21.0.1"))
        self.launch(expected=jdk)

    def test_relative_java_home_survives_api_directory_change(self):
        jdk = self.jdk("relative JDK")
        self.launch(expected=jdk, JAVA_HOME="relative JDK")

    def test_version_banner_with_tool_options_is_usable(self):
        jdk = self.jdk("options JDK")
        self.launch(expected=jdk, JAVA_HOME=str(jdk), JAVA_TOOL_OPTIONS="-Xmx64m")

    def test_unusable_jre_wrong_major_and_failing_binary_fail_before_maven(self):
        for name, options in (("JRE", {"compiler": False}),
                              ("old", {"version": "21.0.1"}),
                              ("broken", {"failure": True})):
            with self.subTest(name=name):
                result = self.launch(code=1, JAVA_HOME=str(self.jdk(name, **options)))
                self.assertIn("Java 25 JDK not found", result.stderr)
                self.assertIn("Set JAVA_HOME", result.stderr)

    def test_no_java_or_failed_sdkman_has_actionable_error(self):
        for broken in (False, True):
            if broken:
                self.sdkman(failure=True)
            result = self.launch(code=1)
            self.assertIn("Java 25 JDK not found", result.stderr)
            self.assertIn("No software was installed", result.stderr)

    def test_maven_failure_propagates(self):
        jdk = self.jdk("explicit JDK")
        self.launch(expected=jdk, code=23, JAVA_HOME=str(jdk), MAVEN_EXIT="23")

    def test_env_loader_failure_propagates_without_launching_maven(self):
        (self.root / ".env.dev").write_text("return 17\n")
        self.launch(code=17)


if __name__ == "__main__":
    unittest.main()
