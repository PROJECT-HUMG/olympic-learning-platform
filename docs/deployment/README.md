# Production delivery: fresh 1 GiB replacement

Route: **GitHub checks → verified SSH → exact tested checkout → ordinary sequential Compose
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

The previous `olympic-low-memory` builder's remote cleanup remains **unverified**
after its stop failed. This route does not use/manage it and performs no automatic
builder removal, cache pruning or Docker cleanup. Operator may inspect its state
privately if pressure persists; never blindly prune unrelated resources.
No host OS resource limits or tuning are imposed by the helper. Existing swap and
operator host settings are preserved. No 1 GiB fit is promised from configuration,
CI checks or local testing. Heavy PDF/image runtime limitations remain as above.

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

Watch the exact Delivery run/SHA. Helper enforces production profile, tested
checkout, image revision/platform/identity, data health and a **successful nonempty
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

Ordinary Compose candidate base: `87d9f29cf5f009718631081be2133ba325c92b25`.
Direct Lead ownership; no Peers/profile substitution. Runtime Compose caps and
operator swap/env are preserved. Accepted Daily7 hashes remain outside staging;
operator env values remain unread. Existing status source is this document.

Lead accepts the six-path simplification after bounded source review/checks:
remove dedicated builder/config/cleanup and build-time heap caps; retain sequential
builds, CI checks, strict SSH, exact checkout, serialization/timeouts, persistent
volumes, pre-migration backup and health/public smoke. Uncapped build pressure is
an accepted risk, not a new setup requirement. No host OS limits are installed.
Local checks: 18 offline regressions pass with zero skips; workflow lint,
Bash/Python syntax, runbook command parsing and diff checks pass.
Candidate/commit/check identifiers are recorded in
`/tmp/olympic-compose-build-final-manifest-20261008.json`. Local regression evidence:
`/tmp/olympic-compose-build-tests-20261008.log`. Docker app deployment/network
operations are mocked in offline tests; local parsing is not whole-VPS1GiB proof.
Actual trial outcome must be recorded separately. HTTPS, real SMTP2525/TLS/OTP,
low-load soak and heavy-feature capacity remain unverified until observed.

Historical results retained, not current setup requirements:

- e4a0b6f API test failure repaired by1d2309d without weakening the test gate;
  b0b26b5 failed key preflight before operator-reported key correction.
- d740e7e [37747477416](https://github.com/PROJECT-HUMG/olympic-learning-platform/actions/runs/37747477416)
  passed checks/build/backup but failed app readiness; first exception/OOM unknown.
- e8d37d8 corrected owned command-group timeout cleanup.
- 87d9f29 [37783928154](https://github.com/PROJECT-HUMG/olympic-learning-platform/actions/runs/37783928154),
  attempt1: checks113333713855 passed web/deployment/API Testcontainers. Deploy
  113334962857 passed small-host swap preflight, failed bounded builder setup
  (exit1), then warned builder stop failed. App builds/backup/replacement were not
  reached and runner smoke was skipped. An independent HTTPS probe returned
  connection refused. Full job logs were HTTP403 anonymously; exact Docker cause
  and remote builder cleanup unknown. The old builder probe on a6GiB Docker host
  passed its own budget/config checks, not whole-host1GiB operation. Its local
  test builder was removed. The custom-builder stage is now removed by explicit
  route decision; its failure no longer creates a setup/approval requirement.

The authorized meaningful commit push triggers new checks and an ordinary Compose
trial on **main**. Complete HTTPS from section5 before requiring successful public
smoke. No cloud/DNS/secret settings are changed by this implementation; production
values and actual host readiness remain reported inputs until evidence confirms.

### Ordinary Compose trial: actual result

`0d40e3f49ddb0fa5120e6900512bed605d71fbb6` (`fix(deploy): use ordinary Compose
builds`) was pushed nonforce to origin/main as the single outgoing commit, with
six scoped paths including deletion of `deploy/buildkitd.toml`; Daily was excluded.
[Delivery37787694140](https://github.com/PROJECT-HUMG/olympic-learning-platform/actions/runs/37787694140),
attempt1, completed **failure**. Checks113346583562 passed web/deployment/API
Testcontainers gates. Deploy113347532704 failed inside the SSH step with
**Public smoke failed after six attempts**; runner smoke was skipped.

The helper invokes that public smoke only after sequential ordinary API/web builds,
image revision/platform checks, data readiness, successful pre-migration backup,
app readiness and running image identity/health checks pass. This trial therefore
advanced past those gates on the reported replacement; it did not promote a
complete/healthy release pointer. It is startup evidence, not proof of sustained
1GiB operation or heavy-feature capacity. No automatic rollback/DB downgrade occurred.
No custom builder setup/stop or host resource limits were used by this candidate.

A single independent public smoke probe returned **connection refused** at the
HTTPS release request. Complete section5's operator-owned certificate/host Nginx
HTTPS ingress using the full SHA above; verify Nginx configuration/listener and
443 reachability rather than change application memory or bypass public smoke.
No live UI/public API success is claimed. Full job logs returned HTTP403 anonymously;
no authenticated/direct server surface was available. Retained evidence:
`/tmp/olympic-compose-build-run-37787694140*.json` and
`/tmp/olympic-compose-build-final-manifest-20261008.json`.

Useful non-secret operator checks for this concrete remaining ingress failure:

```bash
cat /opt/olympic/state/status.json
sudo nginx -t
sudo systemctl is-active nginx
sudo ss -ltnp '( sport = :443 )'
curl --connect-timeout 5 --max-time 10 --fail --silent --show-error https://olympic.nghlong3004.me/release.json
```

Preserve the certificate/env/data; do not disable TLS verification or dump expanded
configuration. After HTTPS is correct, Run workflow on main through normal gates
and require both smokes; do not retry unchanged failures. Real SMTP2525/TLS/OTP
remains an operator check after public readiness. Previous remote builder cleanup
remains unknown and no automatic removal/pruning was attempted. All seven Daily
hashes remain exact, operator dotenv unread and index empty. This outcome-only
status update stays local/uncommitted to avoid an unchanged pipeline retry.

### Public asset permissions repair

Base: `0d40e3f49ddb0fa5120e6900512bed605d71fbb6`. The HTTPS reference routes
static requests to web port3000 and API directly to8080. A matching favicon403
at port3000 and HTTPS localizes the static failure upstream of host ingress.
Independent public requests returned nginx HTML403 for favicon/icons, the actual
/social-icons/github.png, /images/anime-day.webp and /videos/anime-day.mp4 paths.
Anonymous /api/v1/users/me returned Bearer401; public document metadata returned200.
A nonexistent root github.png or /videos/anime-day.webp returned SPA HTML and is
not proof that the real asset loads. No credentials/session mutations were used.

Source/artifact cause: the deployment program's restrictive umask077 applies to
Git checkout. An actual installed Vite copy probe preserves a public file's600
mode into dist, while generated index is644. Runtime Docker COPY preserves those
modes with root ownership; official nginx uses an unprivileged nginx worker.
The before-image regression reproduced root-asset403 and inaccessible nested
assets falling back to HTML. This is a serving permission failure, not an API
permission/CORS rule or HTTPS ingress block.

Lead ACCEPT: normalize directories755/files644 only under /usr/share/nginx/html
in the web runtime image, retaining root ownership and no nginx worker write
access. Do not relax checkout/env/backup permissions or use chmod777. No host
nginx/security/auth/resource-policy changes are made. Smoke now checks favicon
and a real poster MIME/body in addition to release/JS/API/actuator; it refuses
403 and fallback HTML. Nineteen deployment tests pass, including a real synthetic
nginx runtime fixture at32MiB/48MiB swap/0.5CPU, readable/nonwritable public files
and video206 Range response. This per-container local evidence on a larger host
is not whole-VPS1GiB capacity proof. Owned test containers/images/directories were
removed; the pulled declared nginx base remains cached. Prior remote builder
cleanup remains unknown; no resources are pruned.

Auth remains separate: GET /users/me needs an access token; POST /auth/refresh
without a valid refresh cookie legitimately returns401. POST /auth/login is public
and validates local identifier/password plus account status. No real login request,
credential, cookie or session was inspected. A diagnosis needs redacted endpoint,
method, status/error body and WWW-Authenticate, plus whether Authorization was
present (no token value) and whether a cookie was issued/blocked (attributes only).
An expired attached Bearer can fail before a public handler; invalid local login
credentials also produce401. Do not assume either cause or request passwords.
Prod secure/HttpOnly/SameSiteStrict refresh cookies, explicit public origin CORS
and trusted HTTPS forwarding are preserved; existing CSRF policy is untouched.

Setup reconciliation: Ubuntu docker.io/Compose is compatible with the successful
ordinary build/readiness trial; no Docker vendor migration/custom builder is
required. Deploy-owned /opt/olympic750 and .env600 match actual preflight; keep
/opt/olympic/.env separate from checkout and local operator env. Correct fstab
/swapfile none swap sw 0 0 needs no correction. The current public API/static
responses demonstrate TLS ingress reachability but not complete UI/login success.
Webroot Certbot renewal scheduling does not itself prove an nginx reload hook;
verify a post-issuance dry-run and equivalent reload integration separately. No
server setting changes or certificate/key/env reads are performed for this check.

Exact candidate/check/live identifiers are recorded in
`/tmp/olympic-static-final-manifest-20261008.json`. Before/after logs:
`/tmp/olympic-static-before-20261008.log`, `/tmp/olympic-static-after-20261008.log`.
The meaningful scoped commit push triggers normal checks/SSH/Compose/readiness
and both public smokes. Live outcome must be recorded separately; actual login,
SMTP2525/TLS/OTP and sustained1GiB capacity remain unverified.
