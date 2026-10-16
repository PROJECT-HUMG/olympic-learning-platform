# Production setup, delivery and recovery

Route: **GitHub checks → verified SSH → exact tested checkout → ordinary sequential Compose
builds → Compose readiness → public HTTPS smoke**. Target: Ubuntu 24.04 amd64,
`https://olympic.nghlong3004.me`. Production branch is exactly **`deploy`**; `main` runs CI only.

Use the existing server and owned checkout. The setup reference below is for operator verification/recovery, not a requirement to reprovision a working host. Agents do not create/delete cloud resources.
Retain backups and migration safety;
never remove volumes, run `down -v`, Flyway clean, or automatically downgrade data.
Local operator `.env` and unrelated repository work remain outside delivery.

## Resource budget and honest limits

[Production Compose](../../deploy/compose.prod.yml) owns these fixed budgets;
legacy resource variables in the operator dotenv cannot silently enlarge them.
Development Compose is unchanged. Limits are ceilings, not reserved RAM.

| Service | RAM cap | RAM + swap cap | Internal budget |
| --- | --- | --- | --- |
| API | 512 MiB | 768 MiB | Heap64–320 MiB; code cache64/direct32 MiB maxima; remaining space for metaspace, stacks, GC/JIT and other native allocations |
| PostgreSQL16 | 160 MiB | 224 MiB | shared_buffers32MB; work_mem2MB; maintenance_work_mem16MB;20 connections; one autovacuum worker; no parallel workers per query;64MB /dev/shm |
| Redis7 | 96 MiB | 128 MiB | maxmemory32MB, **noeviction**, existing AOF/fsync-every-second persistence and snapshot defaults retained |
| Web Nginx | 32 MiB | 48 MiB | Worker autotuning with0.5 CPU ceiling;8MiB /tmp tmpfs |

Runtime caps total800 MiB, leaving **nominally224 MiB** of1 GiB for kernel, SSH,
Docker/containerd and host proxy. Usable MemTotal is lower than nominal RAM;
this is not a guaranteed reservation or adequate margin at sustained full caps.
API /tmp uses ephemeral disk for multipart spooling instead of RAM tmpfs; private
persistent storage remains its named volume. Upload, permission and prod rules
are unchanged. API pool3/1 leaves room within PostgreSQL20 for health, maintenance
and backup. `work_mem` is per sort/hash operation, not a per-connection total;
complex queries can still exceed this budget. Do not disable autovacuum/fsync.

Redis owns the assessment import stream, not merely a disposable cache:
[queue](../../apps/api/src/main/java/me/nghlong3004/olympic/assessment/service/impl/RedisAssessmentImportQueue.java)
acknowledges but does not trim/delete records. At capacity, new writes fail rather
than evict existing/pending work. Buffers and fork copy-on-write add memory beyond
maxmemory. Monitor growth; no automatic stream pruning, eviction or durability
change is introduced. AOF's existing one-second crash-loss window is unchanged.

The API also has expensive paths: [PDF reader](../../apps/api/src/main/java/me/nghlong3004/olympic/assessment/service/impl/PdfDocumentReaderImpl.java)
retains rendered220DPI pages, with an existing100-page input limit; figures can
reach24 million pixels. This configuration does **not** substantiate every legal
large PDF/image, concurrent import/export or sustained room workload. Initial
acceptance is modest routine CRUD/public reads and small uploads at low concurrency,
not a new product restriction or changed validation policy. JVM heap limits do
not cap native allocations; readiness passing is not a load/soak proof.

### Ordinary server builds and swap

[Helper](../../deploy/deploy.py) uses ordinary `docker compose build api`, then
`docker compose build web`. There is no custom builder, build cgroup/CPU budget,
Maven/Node build heap cap or host resource-pressure gate. Compose uses its normal
installed Docker build backend. API/web commands retain 1200/900-second timeouts;
job timeout remains 65 minutes. Exact image revision/platform and readiness gates
remain unchanged. Builds do not intentionally stop running app services.

Retain the operator's **2 GiB disk-backed host swap**. Uncapped Java25/Node builds
can consume the 1 GiB host's available RAM and swap, compete with running services,
be killed, time out or make SSH unresponsive. Runtime service caps do **not** cap
build memory. Sequential service ordering avoids API/web overlap but does not
limit internal build parallelism. Swap assists peaks; it does not guarantee fit
or responsiveness. This risk is explicitly accepted for the ordinary Compose
route; no new approval or custom builder setup is required.

No host OS resource limits or tuning are imposed by the helper. Existing swap and
operator host settings are preserved. No 1 GiB fit is promised from configuration,
CI checks or local testing. Heavy PDF/image runtime limitations remain as above.

## Existing server inputs and setup reference

Steps already reported complete should be **verified**, not blindly repeated.
All following server/DNS/GitHub/certificate actions are operator-only.

### 1. Prerequisites

Verify Ubuntu24.04/amd64, actual RAM/swap/disk and current Docker access:

```bash
uname -m
free -h
swapon --show
df -h /opt /var/lib/docker
git --version
python3 --version
docker info --format '{{.Architecture}} memory={{.MemTotal}} memoryLimits={{.MemoryLimit}} swapLimits={{.SwapLimit}}'
docker compose version
```

Need Bash, Git, Python>=3.11, Docker Engine with its standard build backend,
Compose>=2.24, Nginx, Certbot and curl. No dedicated Buildx builder, custom config
or version gate is required. Fresh-host standard Docker installation reference:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git python3 nginx certbot ufw dnsutils
sudo install -m0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
printf 'deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu %s stable\n' "$VERSION_CODENAME" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker nginx
```

This reads public OS metadata, never application dotenv. Outbound HTTPS must reach
GitHub and public Docker/Maven/npm registries. No GHCR token is required for this
public repository. No dependency/provider rewrite is needed.

### 2. Swap and firewall

If adequate swap is already active, retain it. The following creates a fresh file
only; an existing `/swapfile` is never overwritten or reinitialized:

```bash
if [ ! -e /swapfile ]; then
  sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
fi
```

Verify `swapon --show` reports2GiB. If the existing file is inactive/wrong size,
review it as operator; do not run mkswap over it. Add `/swapfile none swap sw 0 0`
to `/etc/fstab` once, after checking no duplicate entry. No sysctl tuning or
host resource limits are required by this delivery path.
Keep the initial console/session open until a second verified SSH session works.
Allow SSH before enabling the firewall:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Apply the same ports in any operator-managed cloud firewall. Do not expose5432/6379/8080/3000
or actuator. GitHub-hosted runner source IPs vary; don't assume a fixed runner IP.

### 3. Deploy account, key and verified host

Use the approved account; the example fresh account is `deploy`. If absent:

```bash
sudo adduser --disabled-password --gecos '' deploy
sudo usermod -aG docker deploy
sudo install -d -m700 -o deploy -g deploy /home/deploy/.ssh /opt/olympic
```

Install the intended **public** deploy key in `/home/deploy/.ssh/authorized_keys`,
owner deploy/mode600; directory700. Preserve any existing authorized keys. Docker
membership grants host-level authority. Reconnect after membership changes and
verify Docker access without sudo. The CI private key must be unencrypted, real
multiline OpenSSH content; keep it local/GitHub Secret, never in app dotenv/Git.

From the trusted server console obtain the public host fingerprint:

```bash
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

On Windows, collect a candidate entry with `ssh-keyscan -t ed25519 -p 22 NEW_IP`,
save ASCII, and check it using `ssh-keygen -lf`. **Compare with the console
fingerprint before trusting it**; keyscan alone is not verification. For another
port the entry must be `[host]:port`, matching DEPLOY_HOST/PORT exactly. Test a
normal strict-host-checking connection before enabling a pipeline. A stall before
the server banner is pre-authentication; don't diagnose a bad key from that alone.

`DEPLOY_KNOWN_HOSTS` is the runner's list of **trusted public SSH host keys for
the application server** (`DEPLOY_HOST`/`DEPLOY_PORT`), not GitHub's identity and
not the private login key. It stops the runner sending its login attempt to an
impostor. The transport writes it into a temporary `known_hosts`, checks the
host/port entry and uses `StrictHostKeyChecking yes`; a changed/mismatched key
fails closed. `DEPLOY_SSH_KEY` is separate: its private login key proves the deploy
account's identity to that server; the matching public login key is authorized
on the server. Never copy a private host key or login key into `known_hosts`.

Configure the complete verified line once in the existing GitHub **production
Environment secret `DEPLOY_KNOWN_HOSTS`**. Its shape is
`HOST ssh-ed25519 BASE64_PUBLIC_HOST_KEY`, or `[HOST]:PORT ...` for a non-22 port;
a fingerprint alone is not a known-host entry. The trusted server console's
`/etc/ssh/ssh_host_ed25519_key.pub` supplies the public key; prefix it with the exact
configured host, or collect a candidate with keyscan and compare its fingerprint
with that console as above. An already independently verified local `known_hosts`
entry is also usable (hashed hostnames are supported). Convenient setup is to
prepare/verify a small file once and paste/import it into that Environment secret;
normal deployments reuse it. Public host keys could instead be kept in a reviewed
repository file or Environment variable, but this implementation expects the secret.
Do not run unverified keyscan on every workflow run or disable checking for convenience.
Stable DNS can simplify addressing; changing the server/key still requires verification.
No settings or secret values are changed by this documentation.

### 4. Application env and owned paths

Keep the exact server path **`/opt/olympic/.env`**, deploy-owned/mode600. If already
configured, preserve it. If absent on this fresh host, the operator fills it
privately using an editor with umask077. Never source, print, upload or commit it.
Do not copy the workspace root `.env` wholesale: that separate ignored file
contains a local CI key and is never deployed.

Required names (no values here): `POSTGRES_PASSWORD`, `JWT_SECRET_KEY`,
`ENCRYPTION_KEY`, `ENCRYPTION_SALT`, `OLYMPIC_ADMIN_EMAIL`,
`OLYMPIC_ADMIN_USERNAME`, `OLYMPIC_ADMIN_PASSWORD`, `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `MAIL_HOST`,
`MAIL_FROM`, and mail credentials `MAIL_USERNAME`/`MAIL_PASSWORD` when SMTP auth is
used. Use real valid existing registration/configuration, not fake OAuth clients.
See [reference names/defaults](../../deploy/production.env.example); do not replace
the configured file with that blank template. Configurable MAIL_PORT defaults2525,
with STARTTLS required and TLS identity checking. Preserve ADMIN_ONLY unless an
existing product decision authorizes another registration policy. Optional AI and
Turnstile settings remain unchanged; public VITE_TURNSTILE_* build flags must match
backend hostname/protection policy. No private secret belongs in a Vite build arg.

```bash
stat -c '%U %a' /opt/olympic /opt/olympic/.env
```

The helper creates `/opt/olympic/checkout`, `/state`, `/backups` itself. Checkout
and both build contexts are separate from dotenv. It refuses wrong origins,
nonempty non-Git checkout or local changes; no forced reset/clean. Physical volumes
remain `olympic_platform_postgres-data`, `olympic_platform_redis-data` and
`olympic_platform_api-storage`. Initial volumes are fresh; later passwords/keys
must remain consistent with their data.

### 5. Domain and HTTPS BEFORE public smoke

Operator: verify domain A/AAAA matches the existing server and its actual IPv6,
with a valid certificate and HTTPS ingress. Retain working DNS/certificates.
No agent mutates DNS. For fresh-host recovery only, provision the certificate
before the full HTTPS reference, starting with this temporary HTTP-only
`/etc/nginx/sites-available/olympic`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name olympic.nghlong3004.me;
    location /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
    location / { return 503; }
}
```

Prepare/enable this owned site, leaving other sites alone, then obtain the certificate:

```bash
sudo install -d -m755 /var/www/letsencrypt
if [ ! -e /etc/nginx/sites-enabled/olympic ] && [ ! -L /etc/nginx/sites-enabled/olympic ]; then
  sudo ln -s /etc/nginx/sites-available/olympic /etc/nginx/sites-enabled/olympic
else
  test "$(readlink -f /etc/nginx/sites-enabled/olympic)" = /etc/nginx/sites-available/olympic || { echo 'Review existing Olympic site link'; exit 1; }
fi
sudo nginx -t && sudo systemctl reload nginx
sudo certbot certonly --webroot -w /var/www/letsencrypt -d olympic.nghlong3004.me
```

Download [the final ingress reference](../../deploy/nginx.conf) from the **full
accepted commit SHA in the handoff**, not a moving branch, into a temporary file:

```bash
# Set this public variable to the full accepted SHA; it contains no secret.
olympic_commit=FULL_ACCEPTED_COMMIT_SHA
curl --fail --silent --show-error "https://raw.githubusercontent.com/PROJECT-HUMG/olympic-learning-platform/$olympic_commit/deploy/nginx.conf" -o /tmp/olympic-nginx.conf
sudo install -m644 /tmp/olympic-nginx.conf /etc/nginx/sites-available/olympic
sudo nginx -t && sudo systemctl reload nginx
sudo certbot renew --dry-run
```

Again reload only after validation. The reference routes `/api/` **directly to
127.0.0.1:8080**, bypassing web nginx's forwarding-header replacement, replaces
spoofed forwarding headers with trusted HTTPS/client IP, proxies SPA to3000,
blocks public actuator/docs and preserves26m ingress against API25MB limits.
No DB/Redis public ports. A new CDN/real_ip trust arrangement needs separate review.
Until apps start, upstream502 is expected; a missing/untrusted certificate is not.
Reported setup does not establish HTTPS, secure cookies or API health.

### 6. GitHub production settings and exact trigger

In **production** Environment, operator verifies/updates:

- Variables: `DEPLOY_HOST` = existing server address, `DEPLOY_USER` = approved deploy
  account, `DEPLOY_PORT` = SSH port(default22).
- Secrets: `DEPLOY_SSH_KEY` = intended private key; `DEPLOY_KNOWN_HOSTS` = independently
  verified matching host entry. Retain existing trust unless a host change is verified.

Do not paste secrets into chat/logs or assume workspace dotenv configures GitHub.
The existing **production Environment must allow `deploy`** under its deployment
branch rules. Verify any required reviewers and branch protections separately;
YAML does not change GitHub settings. `main` may keep its ordinary CI protections.
These are operator inputs, not actions performed by this change.

[Delivery](../../.github/workflows/delivery.yml) runs checks on pull requests and
pushes to `main` or `deploy`. **Only `push` + `refs/heads/deploy` deploys**, after
checks pass. There is no manual dispatch or alternate branch/ref input. Failed
checks never SSH. Checks use Node24/pnpm12.4.2 lint/tests/build and Java25 Maven
verify with PostgreSQL Testcontainers/report gate; skipped/missing API tests refuse
delivery. Permissions remain contents:read, with production secrets only in the
deploy job. Environment approval, if configured, remains enforced.

The flow has three owners:

1. The workflow serializes production jobs without cancelling an active migration.
2. [SSH transport](../../deploy/ssh-deploy.sh) validates the key and existing trusted
   known-host entry, uses StrictHostKeyChecking/IdentitiesOnly/BatchMode, and streams
   only the checked-out helper. It sends the tested full SHA, workflow sequence and
   GitHub repository, never credentials/app archives/env files to the checkout.
3. [Server helper](../../deploy/deploy.py) locks `/opt/olympic/state/deploy.lock`,
   fetches `refs/heads/deploy` from GitHub and requires its tip to equal the tested
   push SHA before a detached checkout. A superseded queued run fails safely; use
   the newer deploy-push run. It validates Compose, builds API then web **on the
   server**, checks image identities, starts data services, takes the backup, then
   replaces API/web and checks health/public HTTPS. Only success promotes release
   pointers. No registry image publishing, app artifact transfer, custom builder,
   forced reset/clean or duplicate runner smoke stage is needed.

The checkout stays `/opt/olympic/checkout`; `.env`, state, backups and named volumes
stay outside it. No npm/Node installation is required on the server host: Docker's
web build stage uses Node24; production serves its static output through Nginx,
while the API runs Java25. Verify the actual host/key/swap/env/HTTPS before a release;
old reported setup or an earlier delivery success is not current readiness proof.

### Node and action runtimes

Node24 is retained consistently in `setup-node` and the
[web Docker build stage](../../apps/web/Dockerfile). The official
[Node release schedule](https://github.com/nodejs/Release/blob/main/schedule.json)
lists Node20 EOL as 2026-04-30, Node22 maintenance through 2027-04-30, and Node24
LTS through 2028-04-30 (maintenance begins 2026-10-20). Node26 is Current on this
review date, 2026-10-15, with LTS scheduled for 2026-10-28. Node24 is the supported
LTS choice, without a needless build-major migration.
[locked Vite8.1.5](https://registry.npmjs.org/vite/8.1.5) and plugin-react6.0.3 require
`^20.19.0 || >=22.12.0`; [pnpm12.4.2](https://registry.npmjs.org/pnpm/12.4.2) is a native executable; its [installation guide](https://pnpm.io/installation) supports Node24 and Linux glibc/musl builds. npm-based installation needs Node22.13+, satisfied by Node24. Meeting an engine range does not make EOL Node20 maintained.

The old action pins declared their **own** bundled `node20` runtime; that was
separate from `setup-node: 24` and never the application runtime. The retained
SHA-pinned checkout5/setup-node5/setup-java5 and upload-artifact6 declare `node24`
in their upstream action metadata. Artifact5 still declared node20, hence6.
Node24 actions require a runner at least2.327.1; ubuntu-24.04 GitHub-hosted runners
supply it. Actual runner overrides of old action runtimes were not observed.
The separate pnpm setup action is removed: Corepack reads the same `apps/web/package.json#packageManager` pin (pnpm12.4.2) in CI and Docker, reducing an extra action/runtime owner. Its pnpm cache setup
is removed too; this may make CI installs slower, without changing the lockfile
or app dependencies. Maven cache/test report artifacts remain. The complete multi-document pnpm lockfile includes native package-manager integrity metadata and unchanged application resolutions. Frozen installs retain pnpm12’s strict unreviewed-build policy; do not bypass it with ignore-scripts/allow-all flags. The Docker cache mount is the explicit pnpm store. No Node process is
shipped in the Nginx final image and no host Node upgrade is prescribed.

### 7. First deployment, diagnostics and ongoing protection

Watch the exact Delivery deploy-push run/SHA. Safe stages are printed; child output
that can contain dotenv secrets stays private. Helper enforces production profile, tested
checkout, image revision/platform/identity, data health and a **successful nonempty
mode600 pg_dump before API/Flyway starts**, even on a fresh database. Build/backup
failure refuses app replacement. Running image IDs/health then the host-run public
smoke checks TLS, release SHA/cache, SPA/hashed JS, public API metadata and blocked
actuator. No health gate is weakened. Expected healthy status is `complete/healthy`
in `/opt/olympic/state/status.json`; only that promotes current/previous pointers.

Read-only non-secret diagnostics:

```bash
cat /opt/olympic/state/status.json
free -h
vmstat 1 5
docker stats --no-stream
docker ps -a --filter label=com.docker.compose.project=olympic_platform --format '{{.ID}} {{.Names}} {{.Status}}'
docker inspect --format '{{.Name}} cap={{.HostConfig.Memory}} swap={{.HostConfig.MemorySwap}} oom={{.State.OOMKilled}} exit={{.State.ExitCode}} restarts={{.RestartCount}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' $(docker ps -aq --filter label=com.docker.compose.project=olympic_platform)
curl --max-time 8 --silent --output /dev/null --write-out '%{http_code}\n' http://127.0.0.1:8080/actuator/health/readiness
sudo journalctl -k --since '1 hour ago' --no-pager --grep 'oom|out of memory|killed process' --case-sensitive=no
```

Do not dump complete container configuration,
expanded Compose or env. Restrict API/Flyway log inspection to the operator session;
share only the redacted first exception/health evidence. CPU/memory utilization
alone does not prove OOM. Redis `INFO memory`/`XLEN olympic:assessment-imports` can
be checked privately without dumping keys/payloads. Monitor available RAM, swap
pressure, errors/restarts and low-load request latency after startup.

The API now has a [fresh-install V1 baseline](../../apps/api/README.md#flyway-baseline),
consolidated with explicit authorization while the old V1–V24 were unapplied.
The helper still rejects changed/removed migration fingerprints in existing state.
If an operator host has old history/fingerprints despite that premise, stop and
reconcile the actual state separately; do not delete/repair state or reset a DB
as part of delivery. No compatibility with an already-migrated old database is claimed.

**Recovery:** inspect status first. A build/backup failure leaves the old app
containers serving; the failed checkout is not proof of the running release.
Fix the cause, then use **Re-run failed jobs** for the same deploy-push SHA only
while it is still the `deploy` tip. Otherwise use the newer checked deploy push.
The sequence guard rejects older runs after a newer app replacement attempt.

For a failed readiness/smoke after replacement, running state is unknown until
checked; `current.json` still names the last healthy release, **not necessarily
what is running**. `latest.json` retains the attempted images/migrations,
`previous.json` the prior healthy release, and status records the backup path.
Images/backups are not pruned. Prefer a reviewed forward repair/revert on `deploy`
that preserves all attempted migrations. If immediate image rollback is necessary,
the operator must first establish schema/config compatibility and use the retained
healthy SHA/images with the matching Compose definition and the same explicit
project/env/volumes; do not use `--build` or restart data services for that image
rollback. Repeat image identity/readiness/public smoke and reconcile status before
resuming CI. This is manual recovery, not a bypass workflow or automatic DB restore.

No automatic app/schema rollback, pruning or destructive cleanup. Migration
fingerprints prevent removing/changing attempted SQL; that is not a full backward
compatibility proof. A failed update can leave schema advanced. Retain recorded
backup/status and prefer a checked forward repair; DB restore is a separate data
loss/maintenance decision. Stopping owned CLI/plugin groups on timeout does not
undo Docker/Flyway work. Keep encrypted off-host backups and tested restore once
persistent data exists, including API storage/Redis as appropriate; local pg_dump
alone is not disaster recovery. This single host is not zero downtime; preserve
client draft/private gates and room code, but do not claim uninterrupted requests.

Verify real SMTP2525 connectivity, provider/auth/from-domain/STARTTLS and a policy-
permitted invitation/reset/OTP after app health. For TLS use `openssl s_client
-starttls smtp -connect SMTP_HOST:2525 -servername SMTP_HOST -verify_hostname
SMTP_HOST -verify_return_error`; do not reveal credentials/OTPs or change
ADMIN_ONLY merely to test mail. See [OTP](../architecture/authentication.md#registration-otp).

## Incident diagnosis and retained limits

- **Imports:** drain old unfenced workers before deploying the committed lifecycle repair; mixed old/new safety is not proven. [Backend lifecycle/compensation limits](../architecture/backend-architecture.md#accepted-repairs-and-limits) remain material even after readiness passes.
- **HTTPS smoke failure:** preserve the failed status/backup, inspect `sudo nginx -t`, `sudo systemctl is-active nginx`, `sudo ss -ltnp '( sport = :443 )'`, and bounded `curl --fail https://olympic.nghlong3004.me/release.json`. Check certificate/listener/DNS/reachability before changing application memory or bypassing smoke. Do not repeatedly retry unchanged failures.
- **Static403 or SPA HTML instead of media:** verify the actual public path, response MIME/body and video Range behavior at web port3000 and HTTPS. A restrictive checkout umask can produce600 public assets. The runtime web image normalizes only `/usr/share/nginx/html` directories755/files644, root-owned and nginx-readable/nonwritable. Do not use chmod777, relax env/backup/checkout permissions, or change API auth/CORS to repair static serving. [Web Dockerfile](../../apps/web/Dockerfile), [smoke](../../deploy/smoke.py) and [deployment tests](../../deploy/tests) own the regression.
- **Auth401:** anonymous `/users/me` and refresh without a valid cookie legitimately fail. An expired attached Bearer can fail before a public handler; invalid credentials are another cause. Diagnose redacted endpoint/method/status/message/WWW-Authenticate, header presence and cookie attributes, never token/password values. Do not weaken secure cookies, CORS or forwarding to make a probe pass.
- **Renewal:** certificate issuance/scheduling is not proof of an nginx reload hook. Verify renewal dry-run and reload integration separately without exposing private keys.
- **Old custom builder:** cleanup of the former `olympic-low-memory` remote builder remains unverified after a historical stop failure. Ordinary Compose does not use/manage it. Operator may inspect privately; no automatic removal, pruning or vendor migration is indicated.

Historical delivery/public-smoke success and operator-reported functionality exist, but establish neither the current checkout's deployment nor sustained whole-host1GiB capacity. Actual SMTP2525/TLS/OTP, live Turnstile/auth/private flows, media playback and low-load/heavy-feature soak need appropriate current observation. CI/mocked deployment tests are not whole-host fit proof. Use current release/status evidence for each authorized deployment; the [local project status](../reviews/ux-flow-audit.md) is separate.
