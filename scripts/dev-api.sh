#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

exec ./scripts/load-env.sh bash -euo pipefail -c '
# Resolve Java after load-env so an explicit environment selection wins.
valid_java_home() {
    local candidate="${1:-}" java_version javac_version
    [[ -n "$candidate" && -d "$candidate" && -x "$candidate/bin/java" && -x "$candidate/bin/javac" ]] || return 1
    java_version="$("$candidate/bin/java" -version 2>&1)" || return 1
    javac_version="$("$candidate/bin/javac" -version 2>&1)" || return 1
    [[ "$java_version" =~ version\ \"25[.\"+-] && "$javac_version" =~ (^|[[:space:]])javac\ 25([.+-]|$) ]]
}

sdkman_java_home() (
    # SDKMAN assumes optional variables/options from interactive shells. Keep
    # its changes (including PATH/completion hooks) out of the Maven environment.
    set +eu
    set +o pipefail
    export SDKMAN_DIR="$1" SDKMAN_OFFLINE_MODE=true
    unset ZSH_VERSION SDKMAN_ENV
    export SDKMAN_OLD_PWD="$PWD" # Prevent init from invoking sdk env/other candidates.
    source "$SDKMAN_DIR/bin/sdkman-init.sh" >/dev/null 2>&1 || exit 1

    # Read only the Java selection, never execute a project .sdkmanrc or call
    # sdk env/install (which can involve other tools or the network).
    for project_config in apps/api/.sdkmanrc .sdkmanrc; do
        if [[ -r "$project_config" ]]; then
            while IFS="=" read -r candidate version || [[ -n "$candidate" ]]; do
                candidate="${candidate//[[:space:]]/}"
                version="${version%%#*}"
                version="${version//[[:space:]]/}"
                if [[ "$candidate" == java && "$version" =~ ^[[:alnum:]][[:alnum:].+_-]*$ ]]; then
                    selected_home="$SDKMAN_DIR/candidates/java/$version"
                    if valid_java_home "$selected_home"; then
                        printf "%s\n" "$selected_home"
                        exit 0
                    fi
                fi
            done < "$project_config"
        fi
    done
    if valid_java_home "${JAVA_HOME:-}"; then
        printf "%s\n" "$JAVA_HOME"
        exit 0
    fi
    exit 1
)

if ! valid_java_home "${JAVA_HOME:-}"; then
    JAVA_HOME=""
    sdkman_roots=()
    if [[ -n "${SDKMAN_DIR:-}" ]]; then sdkman_roots+=("$SDKMAN_DIR"); fi
    if [[ -n "${HOME:-}" && "${SDKMAN_DIR:-}" != "$HOME/.sdkman" ]]; then
        sdkman_roots+=("$HOME/.sdkman")
    fi
    for sdkman_root in "${sdkman_roots[@]}"; do
        [[ -r "$sdkman_root/bin/sdkman-init.sh" ]] || continue
        if selected_home="$(sdkman_java_home "$sdkman_root")"; then
            JAVA_HOME="$selected_home"
            break
        fi
    done
    if [[ -z "$JAVA_HOME" ]]; then
        path_java="$(type -P java || true)"
        if [[ -n "$path_java" ]]; then
            java_settings="$("$path_java" -XshowSettings:properties -version 2>&1)" || java_settings=""
            selected_home="$(printf "%s\n" "$java_settings" | sed -n "s/^[[:space:]]*java.home = //p")"
            if valid_java_home "$selected_home"; then JAVA_HOME="$selected_home"; fi
        fi
    fi
fi
if ! valid_java_home "${JAVA_HOME:-}"; then
    printf "%s\n" "Java 25 JDK not found. Set JAVA_HOME to an installed JDK 25 (with bin/java and bin/javac), select an installed Java 25 in SDKMAN, or put it on PATH. No software was installed." >&2
    exit 1
fi
# Preserve absolute explicit selections; resolve relative homes before changing directory.
if [[ "$JAVA_HOME" != /* ]]; then JAVA_HOME="$(cd "$JAVA_HOME" && pwd -P)"; fi
export JAVA_HOME

cd apps/api
exec ./mvnw spring-boot:run
'
