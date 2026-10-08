#!/usr/bin/env bash
# CI transport only. SSH secrets never enter the release archive or server env.
set -euo pipefail
umask 077
: "${DEPLOY_HOST:?}" "${DEPLOY_USER:?}" "${DEPLOY_PORT:?}"
: "${DEPLOY_SSH_KEY:?}" "${DEPLOY_KNOWN_HOSTS:?}" "${RELEASE_ID:?}"
[[ "$DEPLOY_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]]
[[ "$DEPLOY_USER" =~ ^[a-z_][a-z0-9_-]*$ ]]
[[ "$DEPLOY_PORT" =~ ^[1-9][0-9]{0,4}$ ]] && (( DEPLOY_PORT <= 65535 ))
[[ "$RELEASE_ID" =~ ^[a-f0-9]{40}-[1-9][0-9]*-[1-9][0-9]*$ ]]
test -s release.tar.gz
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
  printf '::error::%s failed (exit %s). Inspect preceding SSH/SCP stderr; remote state may be unknown.\n' "$1" "$2" >&2
  exit "$2"
}
# Pre-existing owner-managed root and incoming directory; no provisioning here.
scp -F "$ssh_dir/config" release.tar.gz "production:/opt/olympic/incoming/$RELEASE_ID.tar.gz" \
  || transport_failure 'SSH release transfer' "$?"
ssh -F "$ssh_dir/config" production "bash -s -- '$RELEASE_ID'" <<'REMOTE' \
  || transport_failure 'SSH remote deployment session' "$?"
set -euo pipefail
umask 077
id=$1
root=/opt/olympic
test -d "$root/shared"
test ! -e "$root/releases/$id"
mkdir "$root/releases/$id"
tar --extract --gzip --file "$root/incoming/$id.tar.gz" --directory "$root/releases/$id" --no-same-owner --no-same-permissions
timeout --signal=TERM --kill-after=30s 1500s python3 "$root/releases/$id/deploy/deploy.py" deploy "$id" --root "$root"
REMOTE
