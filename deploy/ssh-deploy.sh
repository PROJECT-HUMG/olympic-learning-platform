#!/usr/bin/env bash
# CI transport only. SSH secrets never enter Git, build contexts or server env.
set -euo pipefail
umask 077
: "${DEPLOY_HOST:?}" "${DEPLOY_USER:?}" "${DEPLOY_PORT:?}"
: "${DEPLOY_SSH_KEY:?}" "${DEPLOY_KNOWN_HOSTS:?}" "${DEPLOY_SHA:?}" "${DEPLOY_SEQUENCE:?}" "${DEPLOY_REPOSITORY:?}"
[[ "$DEPLOY_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]]
[[ "$DEPLOY_USER" =~ ^[a-z_][a-z0-9_-]*$ ]]
[[ "$DEPLOY_PORT" =~ ^[1-9][0-9]{0,4}$ ]] && (( DEPLOY_PORT <= 65535 ))
[[ "$DEPLOY_SHA" =~ ^[a-f0-9]{40}$ ]]
[[ "$DEPLOY_SEQUENCE" =~ ^[1-9][0-9]*$ ]]
[[ "$DEPLOY_REPOSITORY" =~ ^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$ ]]
test -s deploy/deploy.py
ssh_dir=$(mktemp -d)
trap 'rm -rf "$ssh_dir"' EXIT
# Preserve multiline/escaped content; normalize only CRLF line endings.
printf '%s\n' "$DEPLOY_SSH_KEY" | sed 's/\r$//' > "$ssh_dir/key"
printf '%s\n' "$DEPLOY_KNOWN_HOSTS" | sed 's/\r$//' > "$ssh_dir/known_hosts"
if ! ssh-keygen -y -P '' -f "$ssh_dir/key" >/dev/null 2>&1; then
  printf '%s\n' '::error::DEPLOY_SSH_KEY must be a valid unencrypted private key with real multiline content.' >&2
  exit 1
fi
known_host=$DEPLOY_HOST
if [[ "$DEPLOY_PORT" != 22 ]]; then known_host="[$DEPLOY_HOST]:$DEPLOY_PORT"; fi
if ! ssh-keygen -l -f "$ssh_dir/known_hosts" >/dev/null 2>&1 \
    || ! ssh-keygen -F "$known_host" -f "$ssh_dir/known_hosts" >/dev/null 2>&1; then
  printf '%s\n' '::error::DEPLOY_KNOWN_HOSTS must contain a valid verified entry matching DEPLOY_HOST and DEPLOY_PORT.' >&2
  exit 1
fi
cat > "$ssh_dir/config" <<EOF
Host production
  HostName $DEPLOY_HOST
  User $DEPLOY_USER
  Port $DEPLOY_PORT
  IdentityFile "$ssh_dir/key"
  UserKnownHostsFile "$ssh_dir/known_hosts"
  StrictHostKeyChecking yes
  IdentitiesOnly yes
  BatchMode yes
  ConnectTimeout 15
  ServerAliveInterval 15
  ServerAliveCountMax 3
EOF
transport_failure() {
  printf '::error::%s failed (exit %s). Inspect preceding SSH stderr; remote state may be unknown.\n' "$1" "$2" >&2
  exit "$2"
}
# Send only the tested deployment program, never archives, app data or env files.
# It fetches the exact SHA into the owned server checkout before Compose builds.
ssh -F "$ssh_dir/config" production "python3 - '$DEPLOY_SHA' '$DEPLOY_SEQUENCE' '$DEPLOY_REPOSITORY'" \
  < deploy/deploy.py || transport_failure 'SSH checkout/build deployment session' "$?"
