# Production delivery

Repository-owned path: GitHub Actions → GHCR → Ubuntu24.04 amd64 Droplet →
`https://olympic.nghlong3004.me`. The operator reports setup steps1–9 complete.
That report does not establish SSH access, credentials, registry permissions,
DNS/certificates, SMTP delivery or successful application startup. No remote
operation or publication was performed during local preparation.

## Trigger and checks

[Delivery workflow](../../.github/workflows/delivery.yml) runs `checks` for every
pull request and every push to **main**, the inspected production branch.
Only a successful **push to refs/heads/main** can publish and deploy. No PR or
`pull_request_target` execution gets production credentials/packages-write access.
Configure branch protection to require **Delivery / checks** (select the emitted
`checks` context in GitHub); a checked-in workflow alone does not enforce merges.
The `production` Environment should restrict deployments to main and retain the
operator's review/protection rules. There is no manual untested deployment trigger.

Checks use Node24, pnpm10.17.0 (matching web Dockerfile), Temurin Java25 and the
Maven3.9.16 wrapper. Web frozen install/lint/all Node tests/build, delivery offline
regressions and **all Maven verify tests including PostgreSQL Testcontainers** run
before publication. Docker must be available on the GitHub-hosted runner;
`check-test-reports.py` refuses missing/zero/failed/skipped Surefire results.
The optional authoring browser harness is not part of Maven's default test suite.
Dockerfile API packaging still skips tests; it is not the publication gate.

Images build on **ubuntu-24.04 GitHub-hosted runners**, platform linux/amd64;
the Droplet only pulls images. The publisher alone gets `packages:write`, using
the job's ephemeral GITHUB_TOKEN. All jobs default to `contents:read` and checkout
does not retain Git credentials. Actions are pinned to public upstream commit
SHAs. Images have commit revision/source labels and tags:

```text
ghcr.io/<lowercase owner/repository>-api:sha-<commit>-<run-id>-<attempt>
ghcr.io/<lowercase owner/repository>-web:sha-<commit>-<run-id>-<attempt>
```

Deployment uses **the returned sha256 digests**, never a tag or latest.
The `production-release` Actions artifact contains `release.json` and
`release.tar.gz`; it records exact images, commit/run identity, migration hashes,
public web build settings and deployment-file hashes. Public `release.json` in
the web image contains only its commit SHA. Vite secrets are never build inputs.
The local CI/CD commit excludes the pre-existing uncommitted Daily candidate;
Actions builds committed checkout bytes, not that working tree.

## Remaining operator prerequisites

Use the reported existing setup; do not re-provision or replace secrets blindly.

| Owner / location | Required state before pushing production |
| --- | --- |
| GitHub Environment **production**, variables | `DEPLOY_HOST` (Droplet IPv4 or DNS name), `DEPLOY_USER` (SSH user), `DEPLOY_PORT` (defaults22), `VITE_TURNSTILE_ENABLED` (`true`/`false`, defaultsfalse), `VITE_TURNSTILE_SITE_KEY` (public key when enabled). Build flags must agree with backend protection/hostname settings. |
| GitHub Environment **production**, secrets | `DEPLOY_SSH_KEY` (dedicated deploy private key), `DEPLOY_KNOWN_HOSTS` (verified complete known_hosts entries; nonstandard port uses `[host]:port`). Verify the SSH fingerprint through the DigitalOcean console/another trusted channel before storing it. Do not use runtime ssh-keyscan as trust establishment. |
| Repository/package access | Actions enabled; production Environment rules/main branch rule configured; GITHUB_TOKEN permitted to publish the two packages. Package Actions access must include this repository, especially if packages already exist. No personal write PAT is required in Actions. |
| Deploy user on host | Docker Engine/Compose plugin≥2.24, Python3, Bash, GNU timeout/tar, SSH and ca-certificates installed. User can run Docker and owns `/opt/olympic/{incoming,releases,shared,state,backups}`; directories mode700. Docker membership and this SSH key effectively grant root-level host authority; scope the key/operator accordingly. |
| Private GHCR pulls | Deploy user's Docker credential store has a separate GHCR read credential (normally classic PAT `read:packages`, authorized for organization SSO if applicable). It needs access to **both** packages. Do not copy the ephemeral Actions token to the server or put read credentials in release.json/production.env. Verify package access after first publication; before that, image pull cannot be established. |
| Host config / secrets | `shared/host-config.json` from [template](../../deploy/host-config.example.json), repository value equals actual lowercase GITHUB_REPOSITORY. `shared/production.env` from [template](../../deploy/production.env.example), deploy-user-owned mode600, filled through the operator's secret process. No repository `.env` is used by production commands. |
| HTTPS ingress | Host Nginx site based on [deploy/nginx.conf](../../deploy/nginx.conf), trusted certificate at the referenced Let's Encrypt paths; renewal established. DNS/AAAA must actually reach this host. Only80/443 public; SSH restricted to approved sources. No DB/Redis/8080/3000 public exposure. |

Required production values include POSTGRES password, stable JWT/encryption
key/salt, existing admin seed credentials, Cloudinary storage credentials,
existing Google/GitHub OAuth registration credentials, and the SMTP host/user/
password/from. Existing YAML declares both OAuth clients, so blank IDs may fail
startup even if the UI does not use OAuth. This path does not rewrite providers.
Use real existing registrations; review disabling an unused integration separately.
Keep registration policy `ADMIN_ONLY` unless the operator has explicitly chosen
another existing mode. Do not rotate encryption/JWT keys as part of deployment.
Keep database credentials aligned with an already initialized Postgres volume;
changing POSTGRES_PASSWORD does not rotate that existing DB user's password.

For private GHCR login, as the deploy user (operator executes later, no token in
shell arguments/history):

```bash
read -rsp 'GHCR read token: ' ghcr_read_token
printf '%s' "$ghcr_read_token" | docker login ghcr.io -u '<read-token-owner>' --password-stdin
unset ghcr_read_token
```

## Files, ingress and first run

The standalone [production Compose](../../deploy/compose.prod.yml) is deliberately
not merged with root `compose.yml`; it has **no build**, forces `prod`, and keeps
physical volumes `olympic_platform_postgres-data`, `olympic_platform_redis-data`
and `olympic_platform_api-storage`. Compose project is always `olympic_platform`.
Never run development Compose against the production host/project.

Host Nginx routes `/api/` **directly to127.0.0.1:8080**, while SPA/assets route to
127.0.0.1:3000. The web container's existing forwarding-header replacement cannot
rewrite production HTTPS/client IP. Host ingress clears client Forwarded/prefix/
SSL headers and replaces X-Forwarded-* with canonical host, HTTPS,443 and actual
remote address. `prod` trusts those headers; do not expose API directly or add an
untrusted proxy/CDN. If a CDN is adopted later, review restricted real_ip trust
first. API upload caps25MB, feature ownership/permissions and no-store responses
remain authoritative; ingress26m permits multipart framing, without raising app
limits. No public actuator/docs route or public DB/Redis mapping is provided.

Reference validation commands on the **already configured host**, without
dumping expanded production configuration:

```bash
sudo nginx -t
sudo systemctl reload nginx  # only after successful config/certificate validation
sudo certbot renew --dry-run
```

If the existing ingress differs, review/copy `deploy/nginx.conf` to the host and
install that owned site as `/etc/nginx/sites-available/olympic`, link it from
`/etc/nginx/sites-enabled/olympic`, then run the validation/reload commands above.
Preserve other sites; do not overwrite unrelated host configuration. HTTPS trust
and loopback API routing must match this reference before deploy smoke can pass.

If HTTPS has not actually been issued, use an HTTP-only ACME webroot site first;
do not load TLS config referencing nonexistent certificates. Reference issuance
command (only if needed): `sudo certbot certonly --webroot -w /var/www/letsencrypt
-d olympic.nghlong3004.me`. Do not redo completed certificate/setup work. Official
references: [Docker Ubuntu installation](https://docs.docker.com/engine/install/ubuntu/),
[Certbot Nginx guidance](https://certbot.eff.org/instructions?ws=nginx&os=ubuntunoble).

After reviewing/committing these files and confirming the above prerequisites,
push the CI/CD commit on **main** to the GitHub repository (`git push origin main`).
This is the next externally effective operator action; local preparation did not
perform it. Daily changes remain separate until separately committed.

The workflow transfers only the release bundle, verifies known-host SSH, extracts
to a new owned `/opt/olympic/releases/<sha>-<run-id>-<attempt>` and invokes:

```bash
python3 /opt/olympic/releases/<id>/deploy/deploy.py deploy <id> --root /opt/olympic
```

The script validates repository/bundle/digest/platform/revision and secret-file
permissions, pulls only API/web, waits up to180s for Postgres/Redis, and takes a
custom-format pg_dump **before starting the new API/Flyway migrations**. Backup
failure stops app replacement. App Compose health waits up to420s; API readiness
includes readinessState+DB+Redis, not SMTP delivery. Digest/health are inspected
after start. Public smoke checks TLS, matching no-store release SHA, SPA/hashed
JavaScript, `/api/v1/documents/metadata` shape and actuator404 on the host, then
again from the GitHub runner. Smoke has six bounded attempts,8s per GET and5s
between attempts; no write/auth endpoint or OTP is invoked by CI.

Status evidence:

```text
/opt/olympic/state/status.json     deploying / failed / healthy; stage, backup, previous, smoke
/opt/olympic/state/current.json    last release passing host readiness+public smoke
/opt/olympic/state/previous.json   previous healthy manifest
/opt/olympic/state/latest.json     highest attempted app-deployment workflow sequence
/opt/olympic/backups/<id>-<UTC>.dump pre-app PostgreSQL snapshot (mode600)
```

GitHub deploy concurrency never cancels a running deploy; host flock also guards
manual recovery. GitHub may replace a **pending** run with a newer push; the host
sequence fence refuses stale deployments that finish building out of order.
Keep this workflow identity/run-number lineage; resetting it needs operator
review of the sequence fence. First publication can succeed while deploy fails;
inspect job summaries/artifacts and host status separately. A cancelled/disconnected
SSH session is not evidence of rollback or success. If runner smoke fails after
host success, current.json may identify healthy host deployment while Actions
correctly remains failed; investigate public reachability before retrying.

## Backup, failure and bounded recovery

No automatic app rollback or database rollback is performed. After failure,
apps/schema may have partially advanced, even though current.json still records
the last healthy release. Restricted service logs and real Flyway history must
be inspected by the operator; do not print production.env, `compose config`,
`docker inspect` full environments or credentials into CI/support logs.

Backups are consistent pre-deployment DB snapshots, including PostgreSQL-owned
private evidence. They are not an off-host/disaster recovery solution. Arrange
encrypted off-host retention and a tested restore before schema-risking releases;
also retain Redis volume and `/app/storage` export data. No release, backup, image
or volume pruning is automatic. Check disk capacity and take a coordinated backup
when data outside PostgreSQL matters. Restoring a snapshot loses writes after its
timestamp and is an explicit maintenance/data-recovery decision, never a deploy
script operation. **Never `down -v`, volume rm/prune, Flyway clean or drop data.**

Recovery paths:

1. Failure before app replacement: correct the operator-owned configuration/
   registry/ingress cause, then rerun failed Actions jobs. A rerun creates a new
   attempt ID/digests/bundle and remains subject to checks/Environment protection.
   A host-local retry of the exact prepared release also takes a new backup.
   The CI transport refuses to overwrite an existing immutable release directory.
2. Failure after app replacement: inspect stage, digests, schema/Flyway state and
   backup first. Prefer a checked forward repair when migrations changed. Do not
   keep looping failed deployments without identifying the cause.
3. Application-only recovery is permitted **only after an operator confirms
   schema/data/API compatibility**, using a retained known release. The script
   additionally requires identical migration fingerprints with the latest
   attempted/active release, and never reverses a migration:

   ```bash
   python3 /opt/olympic/releases/<latest-id>/deploy/deploy.py rollback <previous-id> \
     --root /opt/olympic --schema-compatible
   ```

   Matching migration files is necessary but not sufficient: changed data formats,
   OTP lifecycle or other app semantics may still prevent safe rollback. Different
   fingerprints are refused; restoring an older image against newer Flyway
   history may also fail validation. That case requires reviewed forward repair
   or a separately approved maintenance restore, not a bypass flag.

Deployments are single-host replacements, not zero-downtime releases. Existing
room client/player code is untouched, but API restarts can interrupt polling/
uploads; coordinate releases, and do not promise seamless in-flight requests.

## SMTP2525 and real OTP acceptance

SMTP remains the current MAIL_* integration, not a new provider. Template uses
2525 with auth/STARTTLS, required TLS and server certificate identity checking;
all remain configurable for the actual provider. MAIL_HOST must be reachable
from the API container (localhost means that container, not the Droplet).
Port2525 alone does not establish TLS/auth/delivery. Confirm provider credentials,
verified MAIL_FROM/domain and outbound firewall rules. Test the real provider
from the host/container network without printing password/session/OTP:

```bash
openssl s_client -starttls smtp -connect '<smtp-host>:2525' \
  -servername '<smtp-host>' -verify_hostname '<smtp-host>' -verify_return_error
```

Require a valid certificate and announced STARTTLS, then exercise real app mail
with an operator-controlled address. If the chosen existing registration mode
supports OTP, register, confirm real inbox delivery/links/branding, verify the
code to ACTIVE, confirm resend cooldown/replaced-code rejection and HTTPS secure
cookie/login behavior. If production stays ADMIN_ONLY, use a separately approved
test/staging SELF_VERIFY configuration; do not silently change policy to test OTP.
Also verify the existing invitation/reset mail used by the selected policy.
Use [OTP contract](../architecture/registration-otp.md) and
[account email](../architecture/account-email.md) for expected behavior. SMTP
health/Testcontainers/template tests do not prove real OTP delivery. Forwarded
HTTPS/client-IP trust and production cookie behavior remain live acceptance
checks; do not include OTP, challenge secrets or auth cookies in evidence.

## Local acceptance, 08/10/2026

Local candidate/status and exact hashes are recorded in
`/tmp/olympic-delivery-final-manifest-20261008.json` after final validation/commit.
All seven pre-existing Daily candidate paths must remain byte-identical to
`/tmp/daily-recovery-final-manifest-20261007.json` and outside this commit.
Preparation uses direct Lead ownership; no Peers, provider changes or retries.

| Local proof | Result / evidence |
| --- | --- |
| Workflow validation | actionlint1.7.7 PASS; public tool archive verified against upstream release checksums; action commit pins resolved from public upstream tags. |
| Delivery regressions |12 PASS,0 skipped; `/tmp/olympic-delivery-tests-20261008.log`. Real Compose CLI validates only fabricated env values; deployment/SSH/public-smoke dependencies are replaced by offline fixtures. Covers immutable identity/bundle, backup-before-start/failure, digest/health/smoke promotion, host lock/stale order, schema/consent recovery, skipped API report refusal and strict SSH credential cleanup. |
| Python/Bash syntax | Python AST and `bash -n deploy/ssh-deploy.sh` PASS. |
| Current web tree |169 Node tests PASS,0 failures/skips; build PASS (existing large-chunk warning); lint PASS (40 pre-existing warnings); `/tmp/olympic-delivery-web-{tests,build,lint}-20261008.log`. Includes one uncommitted Daily test; committed CI checkout excludes it until Daily is separately committed. |
| Preservation | All seven Daily hashes match the accepted manifest, including the shared UX status document; none staged for CI/CD. No actual `.env` values read or expanded config printed. |

API tests were **not locally rerun**: no Java executable/JDK25 in this execution
environment. CI is configured to run them with Docker before publishing, but that
future execution is not claimed as passing. No production image build/pull, real
nginx binary/certificate validation, registry publication, SSH/deploy or public
network smoke was performed. These and production values/SMTP2525 real OTP remain
unverified until the operator performs them. Dedicated reduced-motion validation
is not part of delivery preparation. Reported setup is kept separate from proof.
