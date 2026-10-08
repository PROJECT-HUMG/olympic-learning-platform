# Production delivery: fresh 1 GiB replacement

Route: **GitHub checks → verified SSH → exact tested checkout → capped server
builds → Compose readiness → public HTTPS smoke**. Target: Ubuntu 24.04 amd64,
`https://olympic.nghlong3004.me`. Production branch is **main**.

Replacement is a fresh installation: no old database/upload export or migration
from the old Droplet is required. Agents do not create/delete cloud resources.
Once this installation has persistent data, retain backups and migration safety;
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

### Server builds and swap

[Helper](../../deploy/deploy.py) creates a dedicated `olympic-low-memory`
**docker-container** Buildx builder, leaving the default builder alone. It checks
768MiB RAM/1536MiB RAM+swap,0.75 CPU and [single-worker config](../../deploy/buildkitd.toml).
API then web build sequentially. BuildKit's `--memory` Compose flag is unsupported,
so it is not used. Buildx>=0.14 provides default-load into the local Docker engine.
Maven build heap is384MiB; Node build heap512MiB, with native memory inside the
builder budget. Runtime API JVM flags do not apply to Maven. Builds stop the owned
builder afterward, retaining its cache; they do not stop existing app services.

Require **2 GiB disk-backed host swap** on this1 GiB path. Preflight requires at
least1 GiB free swap and128MiB MemAvailable before building. A nominal2 GiB
swapfile may report2047MiB usable after its header; preflight accepts that overhead. API/web timeouts are
1200/900s; job65min. Swap can accommodate cold pages/peaks, but cannot enlarge Java
heap, guarantee responsiveness or replace physical RAM. Builds can compete with
running services; sustained swapping/pressure is a failure signal, not success.

If bounded builds still exhaust memory/time, the smallest architectural alternative
is building the same checked Dockerfiles on GitHub and deploying immutable images.
That requires an explicit decision; this implementation retains server builds.
Moving builds alone does not solve heavy PDF/image runtime memory: that requires
more RAM or separately authorized processing changes. No1 GiB fit is promised
from configuration or synthetic tests.

## Replacement setup, in order

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
docker compose build --help
docker buildx version
```

Need Bash, Git, Python>=3.11, Docker Engine, Compose>=2.24 **with --builder support**,
Buildx>=0.14, Nginx, Certbot and curl. Fresh-host installation reference:

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
to `/etc/fstab` once, after checking no duplicate entry. For this fresh low-memory
namespace, `/etc/sysctl.d/90-olympic-memory.conf` may contain:

```text
vm.swappiness=10
vm.overcommit_memory=1
```

Apply using `sudo sysctl --system`. Overcommit permits Redis persistence forks;
container caps/swap still matter and do not guarantee allocations will succeed.
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

Operator: point domain A to the **new IP** and update/remove stale AAAA as appropriate
for the replacement's actual IPv6. Check public resolution. No agent mutates DNS.
Provision the certificate before installing the full HTTPS reference. On a fresh
site, use this temporary HTTP-only `/etc/nginx/sites-available/olympic`:

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
accepted commit SHA in the handoff**, not a moving main, into a temporary file:

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

- Variables: `DEPLOY_HOST` = replacement address, `DEPLOY_USER` = approved deploy
  account, `DEPLOY_PORT` = SSH port(default22).
- Secrets: `DEPLOY_SSH_KEY` = intended private key; `DEPLOY_KNOWN_HOSTS` = newly
  verified matching host entry. Do not reuse an old fingerprint for a new host.

Do not paste secrets into chat/logs or assume workspace dotenv configures GitHub.
Existing Environment/branch protections should require main/checks. Repository
YAML does not itself enforce merge protection. No settings are changed by agents.

PR/main pushes run full Node24/pnpm10.17.0 web lint/tests/build, deployment tests
and Java25 Maven verify with PostgreSQL Testcontainers/report gate. Missing/skipped
API tests refuse delivery. Eligible main pushes, or **Run workflow on main**, run
checks before deployment; manual dispatch is not a test bypass. All jobs use
contents:read. Strict known-host/IdentitiesOnly/BatchMode key preflight remains.
Deploys serialize without cancelling an active migration; host lock covers exact
checkout through smoke. Full SHA fetched/verified detached; never moving `git pull`.
Operator reports replacement host/key/swap/env configured; the authorized first
push tests those inputs, not the old overloaded host. HTTPS remains unverified.

### 7. First deployment, diagnostics and ongoing protection

Watch the exact Delivery run/SHA. Helper enforces capped builder/config, production
profile, image revision/platform/identity, data health and a **successful nonempty
mode600 pg_dump before API/Flyway starts**, even on a fresh database. Build/backup
failure refuses app replacement. Running image IDs/health then host and runner
smokes check TLS, release SHA/cache, SPA/hashed JS, public API metadata and blocked
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
ADMIN_ONLY merely to test mail. See [OTP](../architecture/registration-otp.md).

## Current acceptance/status

Resource candidate base: `e8d37d88fd6bfae0f668b7f21b77364d313b91d8`. Direct Lead
ownership; no Peers/profile substitution. Daily7 accepted hashes remain unstaged;
operator env values remain unread. Existing status source is this document.

Lead ACCEPT: the nine-path resource/setup candidate is suitable for the authorized
replacement pipeline trial after source review and bounded checks; live readiness
remains unverified. This push also includes the existing e8d37d8 timeout cleanup.

Local evidence:19 offline regressions pass, zero skips, real Compose parsing with
synthetic dotenv, real local Git and OpenSSH dummy-key checks. Dedicated builder
probe accepts/exposes configured768/1536MiB/0.75CPU/single-worker budgets and was
removed afterward. Docker host reports about6GiB; **this is not whole-VPS1GiB
runtime/build proof**. No full local app stack/load test was added. API large-input,
Redis capacity, actual swap/latency, HTTPS and replacement readiness remain live
limits. Candidate/check/run identifiers are recorded in
`/tmp/olympic-1g-final-manifest-20261008.json`; tests in
`/tmp/olympic-1g-delivery-tests-20261008.log`, builder evidence in
`/tmp/olympic-1g-builder-check-20261008.json`.

Historical results retained, not current setup requirements: e4a0b6f/API test failure
repaired by1d2309d; b0b26b5/key preflight failed; d740e7e
[37747477416](https://github.com/PROJECT-HUMG/olympic-learning-platform/actions/runs/37747477416)
passed checks/build/backup gates but failed app readiness(exit1), RAM below2GiB,
public marker502. Full logs were403 anonymously; first exception/OOM was not
established. e8d37d8 corrected local command-group timeout cleanup, not that unknown
readiness cause. Replacement is fresh and is the only currently authorized target;
normal trial results must be recorded separately from source acceptance.
