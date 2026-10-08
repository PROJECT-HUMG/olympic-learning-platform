# Production delivery

Current route: **GitHub checks → verified SSH → owned checkout at the tested
commit → server-side Docker Compose build/start → readiness and public smoke**.
Production is `https://olympic.nghlong3004.me`, Ubuntu24.04 linux/amd64.
This replaces GHCR/image-only delivery by explicit scope change. No publication,
release archive, SCP upload, host-config.json or server GHCR credential is needed.
Do not execute old archive/digest instructions; their retained release folders,
images, backups and state are not deleted by this change.

## Trigger and trust boundaries

[Delivery](../../.github/workflows/delivery.yml) runs checks for PRs and pushes to
**main**, the inspected production branch. Only a successful push to main deploys,
using the **production** Environment. All jobs have `contents:read`; no package
write permission or production credentials in PR checks. Checkouts do not persist
Git credentials. CI retains Node24/pnpm10.17.0 web lint/tests/build, delivery
regressions and Java25/Maven verify with PostgreSQL Testcontainers. Missing,
failed or skipped API reports refuse deployment. API image packaging skips tests;
that is not the CI gate. Configure existing branch/Environment protections to
require checks/main; YAML alone does not enforce merging.

[SSH transport](../../deploy/ssh-deploy.sh) uses DEPLOY_HOST, DEPLOY_USER,
DEPLOY_PORT(default22) and Environment secrets DEPLOY_SSH_KEY/DEPLOY_KNOWN_HOSTS.
The intended existing Windows key was reported valid locally; the updated GitHub
secret is not thereby verified. Real multiline unencrypted key/known-host bytes
are CRLF-normalized, validated without printing values, and written to temporary
600 files in a700 directory, removed on exit. Hashed known_hosts entries work.
Nonstandard ports require `[host]:port`. StrictHostKeyChecking, IdentitiesOnly
and BatchMode remain enabled; no runtime keyscan, password fallback or trust bypass.

The runner sends only the checked-in [deployment program](../../deploy/deploy.py)
on SSH stdin to Python3, with validated tested SHA/workflow sequence/repository
arguments. It sends **no archive, checkout, env file, app data or credentials**.
The server fetches that full SHA from the configured repository's HTTPS URL,
verifies FETCH_HEAD/HEAD and checks it out detached; it never pulls a moving main.
This public repository needs no second server GitHub SSH key or GHCR read token.
A future private-repository change requires separately prepared read access.

## Existing server setup and exact environment path

The production environment file is **`/opt/olympic/.env`**, already reported
configured by the operator. Its existence, owner/mode and usable values remain
unverified until actual preflight/startup. Do not move, overwrite, print, source
into a shell, upload or commit it. Compose receives this explicit path via
`--env-file` and PRODUCTION_ENV_FILE; it never selects checkout/local workspace
`.env`. The root workspace `.env` contains a local operator CI key and is a
**different file**: ignored/untracked, never read, bundled or deployed by this task.
[production.env.example](../../deploy/production.env.example) is reference only,
not an instruction to replace the configured file or rotate stable keys/passwords.

Owned paths are deliberately separate:

```text
/opt/olympic/.env               existing operator secrets, deploy-user-owned600
/opt/olympic/checkout/          Git checkout/build contexts, created automatically
/opt/olympic/state/             host lock, status/current/previous/latest JSON
/opt/olympic/backups/           exclusive pre-app PostgreSQL dumps, mode600
```

The program creates missing owned state/backups/checkout directories and initializes
Git automatically. It refuses a nonempty non-Git checkout, wrong repository origin,
tracked changes or nonignored untracked files, with an actionable error. Existing
ignored operator files are preserved; checkout uses `--no-overwrite-ignore`.
There is no `git reset --hard`, `git clean`, force update or destructive cleanup.
Fix actual local changes outside automation; don't hide them behind a reset.

Only remaining setup prerequisites, if not already satisfied:

- Configured deploy user needs Bash/SSH/Python3/Git, Docker Engine with Compose
  plugin>=2.24 and Docker daemon access. Docker membership/key grants host-level
  authority; retain the existing approved account/key policy.
- `/opt/olympic` must be deploy-user-owned and writable. If missing/wrong, the
  operator can prepare the namespace with `sudo install -d -m700 -o <deploy-user>
  /opt/olympic`, preserving its existing children. Inspect permissions without
  values using `stat -c '%U %a' /opt/olympic /opt/olympic/.env`. The deployment
  will not chown, replace credentials or silently create an empty env file.
- Production Environment retains the two named SSH secrets and three connection
  variables. Server needs outbound HTTPS to this GitHub repository and public
  Docker/Maven/npm registries. No GHCR credential/publisher setting is required.
- Existing HTTPS/DNS/certificate and host Nginx must route the trusted ingress as
  below. No DNS/cloud/secret settings are mutated by repository automation.

Required app values remain stable JWT/encryption keys, DB password aligned with
the existing volume, admin seed, storage/OAuth and mail configuration. Existing
Spring YAML declares both OAuth clients; blank IDs can prevent startup. No provider
rewrite/fake production client was added. Preserve ADMIN_ONLY registration unless
an existing authorized policy says otherwise. Public VITE_TURNSTILE_ENABLED/
VITE_TURNSTILE_SITE_KEY now come from **server `/opt/olympic/.env` build settings**,
not a removed GHCR publication job; match backend Turnstile/hostname policy.
Do not put private keys/secrets in Vite build arguments.

## Build, backup, readiness and ingress

[Production Compose](../../deploy/compose.prod.yml) is standalone, not merged with
root development Compose. It builds existing API Java25 and web Node24 Dockerfiles
on the server sequentially (API then web), tagging local images with the full
commit SHA and revision labels. Web `/release.json` contains only that SHA with
no-store. API/web contexts are checkout/apps/api and checkout/apps/web; the
operator env is outside both, and Docker ignore rules exclude env files.
No source/dependency/package change is required. Runtime uses explicit `prod`,
DB/Redis readiness and local image IDs/health verification.

Physical volumes remain **olympic_platform_postgres-data**,
**olympic_platform_redis-data**, **olympic_platform_api-storage**, project
olympic_platform. No DB/Redis host ports. API/web bind only127.0.0.1:8080/3000.
Existing DB passwords must match existing initialized volumes; POSTGRES_PASSWORD
is not an automatic password rotation mechanism.

[Host Nginx reference](../../deploy/nginx.conf) routes `/api/` directly to loopback
API, bypassing web nginx's forwarding-header replacement. It clears spoofed
Forwarded/prefix/SSL headers, replaces scheme/host/port/client IP with trusted
HTTPS ingress values, blocks actuator/docs, keeps26m multipart ingress against
app25MB limits, and proxies SPA/assets to web. Preserve the existing certificate,
other sites and renewal. Validate the existing site with `sudo nginx -t` before
any operator-owned reload; no ingress/cloud change is performed by CI. A CDN/real_ip
change requires a separate trust review. Production secure-cookie/proxy behavior
still requires actual live acceptance.

The host lock covers **checkout, builds, backup and app replacement**. GitHub deploy
concurrency never cancels an active job; sequence fencing rejects older attempted
app deployments. Builds timeout900s(API)/600s(web); data readiness180s, backup180s,
app readiness420s, bounded public smoke. A successful custom pg_dump is required
**before new API/Flyway starts**; build/backup failure refuses app replacement.
Failed or empty backups stop normal deployment. After readiness, verify running
image IDs match the built images, then check public TLS/release SHA/no-store,
SPA/hashed JS, public document metadata and blocked actuator on the host and
again on the GitHub runner. Smoke performs no login/write/OTP operation.

Owned command processes run in a separate process group. Timeout/interruption
stops the CLI and its local plugin children before releasing the checkout lock.
This does not undo work already accepted by Docker/Flyway; remote daemon/app
state still needs inspection after a failed or interrupted deployment.

State metadata records stage/outcome/SHA/sequence, previous healthy SHA and backup.
Only fully healthy host readiness+smoke promotes current.json/previous.json;
latest.json captures attempted app migration fingerprints/image IDs. A runner
smoke failure after host success can leave a healthy host pointer while Actions
correctly fails. Child output/expanded Compose/secrets are never forwarded; errors
identify the stage, timeout/exit and the owning configuration/resource check.
Inspect restricted service/Flyway diagnostics as operator, without env dumps.

## Server capacity and recovery limits

The initially considered1GB VPS size is **not verified**. Runtime default API cap
is2g (a limit, not reserved memory), PostgreSQL has256MB shared memory, and Java25
compilation plus Node/TypeScript/Vite builds add heap/native memory while existing
services run. Sequential builds reduce concurrency, but do not establish1GB fit.
The deployment reports actual RAM/swap and warns below2GiB; it does not change
server size, swap or memory policy. Build exit137/OOM, timeout or disk exhaustion
requires actual host evidence and an operator resource decision. No tiny-server
success or safe swap substitute is claimed. A capacity problem is a limitation
of this requested server-build path, not a requirement to restore GHCR delivery.

No automatic application rollback/database downgrade occurs. Missing/changed
prior attempted migration fingerprints are refused before starting apps. Even
matching SQL files are not a complete data/API compatibility proof. After app
replacement, failures can leave advanced apps/schema; retain status/backups and
prefer a checked forward repair. Older job attempts are fenced. Operator app-only
recovery requires confirmed schema/data compatibility and a reviewed tested
commit, not a forced checkout/reset. Database restore is a separate maintenance
and data-loss decision. Never `down -v`, prune/remove volumes, Flyway clean or drop.

Pre-app pg_dump covers PostgreSQL-owned private evidence but is not off-host
recovery. Retain encrypted off-host backups/tested restore and API storage/Redis
as appropriate; no pruning is automatic. This single host replaces services and
is not zero downtime. API restarts can interrupt polling/uploads; client draft,
permissions/private gates and room/player code are unchanged, not proof of
seamless in-flight requests.

## SMTP2525 and real OTP

Current MAIL_* integration is retained, configurable, default2525 with auth/
STARTTLS and TLS certificate identity checking. SMTP/readiness/template tests do
not prove real mail. Operator must verify actual host/container network reachability,
provider/from-domain/auth/TLS and real invitation/reset or policy-permitted OTP.
A non-secret TLS reference command is `openssl s_client -starttls smtp -connect
'<smtp-host>:2525' -servername '<smtp-host>' -verify_hostname '<smtp-host>'
-verify_return_error`. Do not print credentials, sessions or OTPs. For an existing
allowed SELF_VERIFY test, confirm delivery, verify-to-ACTIVE, resend cooldown and
replaced-code rejection; do not switch ADMIN_ONLY policy just to test. See
[OTP contract](../architecture/registration-otp.md) and
[account email](../architecture/account-email.md).

## Current source acceptance and trial status

Base for this route change: `b0b26b59c1eff130431c09c0b536c56aa404a2a6` on main.
Direct Lead ownership, no Peers/profile substitutions. Preserve all seven Daily
candidate hashes in `/tmp/daily-recovery-final-manifest-20261007.json`; never stage
those paths or the workspace env. Superseded release.py/host-config template and
GHCR/archive jobs are removed; physical server data/history is retained. The
existing deployment status source is this document, not a duplicate tracker.

Lead accepted the12-path checkout/Compose candidate after source review and16
passing offline regressions (zero skips), Bash/Python syntax, actionlint1.7.7 and
`git diff --check`. Tests use synthetic env, real local Git with an advancing
branch, real Compose configuration parsing and OpenSSH key/config parsing with
generated dummy keys. Docker app operations and public network are mocked.
Proof: `/tmp/olympic-checkout-delivery-tests-20261008.log`; exact candidate/commit
and preservation evidence: `/tmp/olympic-checkout-delivery-final-manifest-20261008.json`.
Server-side builds, production values, HTTPS/OTP and actual server capacity remain
unverified until live trial. No owned services were started; test temporary
directories/SSH material were cleaned and existing development containers retained.
Dedicated reduced-motion validation is outside this delivery task.

Prior route history (superseded instructions, preserved evidence):

| Commit/run | Actual result |
| --- | --- |
| e4a0b6f / [37659245805](https://github.com/PROJECT-HUMG/olympic-learning-platform/actions/runs/37659245805) | API checks failed; publication/deploy skipped. Avatar JPA slice lacked FileMapper; independently reproduced and repaired in1d2309d without weakening gate. |
|1d2309d / [37711071398](https://github.com/PROJECT-HUMG/olympic-learning-platform/actions/runs/37711071398) | Full checks and GHCR publish passed; deploy exit255, stderr unavailable; public marker502. No success inferred. |
| b0b26b5 / [37714366319](https://github.com/PROJECT-HUMG/olympic-learning-platform/actions/runs/37714366319) | Checks/publish passed; key preflight exit1 before SCP/SSH. Operator subsequently reported key update; local Windows parsing doesn't verify the GitHub secret. |

Authenticated rerun/log access was unavailable (no gh/auth token/connector or
connected browser); public GitHub run/job/annotation observation and strict SSH
Git push remain available. Root workspace env was never used as GitHub/server
configuration. Updated key and existing operator setup remain reported inputs.
### Checkout trial: actual result and next frontier

`d740e7ea5da8b93e1bd6a58a14ae35fdb944432c` (`ci: deploy tested checkout with
server builds`) was pushed nonforce to origin/main as the only outgoing commit.
[Delivery 37747477416](https://github.com/PROJECT-HUMG/olympic-learning-platform/actions/runs/37747477416),
attempt 1, completed **failure**: checks job 113212299743 passed web/delivery/API
Testcontainers gates; deploy job 113213130718 failed in the SSH checkout/build step.
Actual annotations report **app readiness failed (exit 1)** and **RAM below 2 GiB**.
The tested helper reaches this stage only after SSH/preflight, exact checkout,
sequential image builds/identity checks, data readiness and a nonempty pre-app
backup pass. Actual env value correctness, migration completion and service
health are not established. Runner public smoke was skipped; an independent
public release-marker GET returned 502. No healthy deployment is claimed.

Job logs endpoint `/actions/jobs/113213130718/logs` returned 403 anonymously;
Lead has no authenticated Actions log or direct server SSH surface. Public
run/job/annotation evidence is retained under
`/tmp/olympic-checkout-run-37747477416*.json`. The stage failure does not identify
the first API/Flyway exception or prove OOM. Low RAM is an observed concern,
not an established root cause. No unchanged deployment retry was issued.

A separate local dummy-process probe demonstrated a nested child surviving the
original subprocess timeout. Lead accepted a bounded helper/test correction:
terminate the owned command group before releasing the host lock. All 17 updated
offline tests pass, zero skips, including a real nested-child timeout check;
Bash/Python syntax and diff checks pass. Interrupt cleanup is source-reviewed,
not separately signal-tested; Docker daemon cancellation remains unverified.
This follow-up is committed locally, held from push because it does not resolve
the actual server readiness failure. All seven Daily hashes remain exact and unstaged;
operator env values remain unread and untouched. No owned services were started;
dummy processes and test temporary folders were cleaned.

Next operator input is non-secret readiness evidence, not another bootstrap:

```bash
cat /opt/olympic/state/status.json
free -m
docker ps -a --filter label=com.docker.compose.project=olympic_platform --format '{{.ID}} {{.Names}} {{.Status}}'
# Inspect only non-secret state; do not dump the complete container config.
docker inspect --format '{{.Name}} status={{.State.Status}} exit={{.State.ExitCode}} oom={{.State.OOMKilled}} restarts={{.RestartCount}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' $(docker ps -aq --filter label=com.docker.compose.project=olympic_platform)
curl --max-time 8 --silent --output /dev/null --write-out '%{http_code}\n' http://127.0.0.1:8080/actuator/health/readiness
```

Inspect restricted API/Flyway startup logs in the operator session for the first
underlying exception; share only redacted diagnostics, no env dumps/secret or
private records. Keep the recorded backup and current data. If OOM is confirmed,
review measured host capacity/API cap before an operator resource decision;
otherwise repair the actual exception/health cause. Once the blocker is remedied,
push the local cleanup commit to main for the next gated trial, then verify host
status/health and both public smokes. SMTP2525/TLS and a real permitted OTP remain
operator live checks; the pipeline smoke does not validate mail.
