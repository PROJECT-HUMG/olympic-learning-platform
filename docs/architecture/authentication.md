---
last_updated: 2026-10-08
owner: Olympic Engineering
status: Draft
title: Authentication Architecture
version: 1
---

# Authentication

## Turnstile — password login, registration and reset-email request

`POST /auth/login`, `POST /auth/register` and `POST /auth/password/forgot` use
`turnstileToken`. Actions are `login`, `register` and `password_reset`, respectively.
When protection is enabled, the backend validates success, exact allowed
hostname and action before login account lookup/password checking/session issuance,
account creation or email side effects. OAuth, refresh/logout, token-based
password reset and OTP verify/resend/resume remain unchanged; OTP rate limits
and cooldowns remain in force. Turnstile is not a replacement for rate limiting.
The shared `LoginRequest` token is optional for JSON/constructor compatibility,
but required by the password-login service whenever enforcement is enabled.
Registration resume still accepts credentials without a CAPTCHA token.

Backend runtime environment: `TURNSTILE_ENABLED`, `TURNSTILE_SECRET_KEY`,
`TURNSTILE_ALLOWED_HOSTNAMES` (comma-separated frontend hostnames, no scheme,
path or port), `TURNSTILE_TIMEOUT` (default `2s`, allowed `1s`–`10s`, connect/request
timeouts each bounded). Frontend build environment: `VITE_TURNSTILE_ENABLED`,
`VITE_TURNSTILE_SITE_KEY`. Both enable flags must agree. Defaults leave the
feature disabled until explicitly configured; no dev/profile-based bypass.
Enabled backend with missing required configuration must fail clearly;
provider errors/timeouts fail closed with a retryable response. Missing public
key or widget failure blocks the frontend form rather than bypassing it.
All three forms use the same enable flags and key pair, not separate per-action
configuration. Disabled mode loads no widget, omits the token and performs no
Siteverify call. Every attempted login resets its single-use challenge in `finally`,
including credential errors, provider failures and network uncertainty; inputs and
email-not-verified guidance remain available. Automatic refresh/replay still excludes
`/auth/login`. No login rate-limit/lockout policy is introduced by this extension.

Vite embeds the public site key at build time. Dockerfile/Compose pass the
frontend build arguments; changing runtime variables on an already-built web
container does not change that key: rebuild the frontend. The secret is ONLY
a backend runtime secret, never a Docker build argument, Vite variable, Git
file or chat message. Provision it through the deployment environment's secure
secret mechanism. Real keys can be configured before deployment without calling
Cloudflare; actually loading the enabled widget or submitting the protected form
uses Cloudflare and requires separate authorization for this candidate.

Localhost: explicitly leave both flags false for ordinary offline development.
Automated checks use fake widget/provider responses, not Cloudflare. To exercise
Cloudflare's documented test-key configuration later, explicitly enable both
flags and supply the official matching test site/secret keys plus permitted
local hostnames; test keys are NOT production protection. Such widget/Siteverify
calls have not been authorized or performed here. There is no shipped fake
verifier mode that can accidentally bypass production.

Owner setup before real activation: create a Turnstile widget in Cloudflare,
authorize the frontend hostnames, provide its public site key for the web build
and secret key securely for the backend, and configure the backend's exact
hostname allowlist. Cloudflare dashboard hostname authorization includes
subdomains, but the backend deliberately uses an exact allowlist. Cloudflare
DNS/proxy is not required for Turnstile; edge/WAF is a separate configuration.
Cloudflare recommends separate test/local configuration from production keys.

Official documentation read on 03/10/2026:

- [Server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/): mandatory server validation, single-use tokens valid 300 seconds, maximum 2048 characters.
- [Client rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/): explicit SPA rendering, expiry/error callbacks, removal/reset.
- [Testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/): official dummy keys work on localhost and other domains; using them still involves provider calls.
- [Hostnames](https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/): dashboard hostname rules, no scheme/port/path.
- [Overview](https://developers.cloudflare.com/turnstile/): usable without routing traffic through Cloudflare/CDN.

Candidate verification checkpoint — 03/10/2026: Lead ACCEPTs the complete local
Turnstile integration after source inspection and Grok Peer `52759927` independent
read-only review (no concrete blocker). Lead focused offline Maven rerun:
43 Turnstile unit/configuration checks plus 3 OTP controller checks pass, zero
failures/errors/skips. Includes Spring binding failures for enabled protection
with missing keys/hosts; existing OTP integration test dependency wiring fixed.
Frontend build passes (existing
large-chunk warning); lint passes (29 existing warnings); Node 50/50 pass.
Isolated Chromium fake-widget/fake-API checks passed for both forms: token gating,
expiry, action/payload, reset after submission, outage retaining form and error
retry; no runtime exceptions. Every nonlocal browser request was intercepted;
no widget/Siteverify network call occurred. Temporary reproduction harness:
`/tmp/olympic-turnstile-D5ef24/check.mjs`. Live Cloudflare behavior, real keys and
full production startup remain unverified. OTP DB cooldown tests were not rerun;
the implementation/limits were not changed. Protection remains disabled until
explicitly configured; acceptance is of the integration, not live deployment.
Feature-scoped local commit is authorized. No push, deploy or provisioning.

Password-login delivery — 08/10/2026: the above 03/10 checkpoint is historical.
Current delivery is the ordinary main-branch checks -> strict SSH -> exact tested
checkout -> sequential API/web Compose builds. The existing `/opt/olympic/.env`
owns runtime Turnstile values and public frontend build arguments; GitHub Turnstile
Variables are not forwarded. Public site-key changes require a web rebuild;
API env changes require container recreation, not just restart. Neither filled
env file enters the checkout/build contexts. Runtime RAM caps, backup/migration,
named volumes, readiness/HTTPS and smoke gates are unchanged.

This bounded release ships the login form/token/action and API enforcement
together using the existing flags. An old tab/client without a login token gets
400 once backend protection is enabled; reload to obtain the new login form.
There is no missing-token grace period or automatic fail-open. Compose replacement
is not atomic; briefly incompatible in-flight requests must be retried with the
new page/fresh challenge. Provider failures return503 rather than issuing a
session. The operator reports frontend activation deployed and backend=true
prepared in the server dotenv; effective live flags/keys are not independently
verified and are never read for this delivery.

Lead ACCEPT — 08/10/2026: bounded password-login candidate based on
`97626f7ef28de999e45dc57164b0fe3e870df883`, owned directly after source/contract
inspection. Four API owners, four web owners, four existing API test files,
`apps/web/tests/login-turnstile-browser-check.mjs` and this document are the only
14 accepted paths. No dependency, schema, credential, auth-policy or resource
configuration changes. Daily7 candidate hashes and pre-existing local deployment
status remain preserved and excluded from this commit.

Local checks: Java25 Maven focused suite53/53 and PostgreSQL Testcontainers OTP
integration15/15, no failures/errors/skips; web Node169/169, production build
passes with existing chunk warning, lint passes with40 existing warnings.
Interception-only Chromium checks pass enabled/disabled login, action/payload,
pending duplicate-click prevention, expired challenge focus/input continuity,
credential/provider errors and fresh-token retries, pending-account guidance,
script-load retry, identity cache/token and role redirect. The first harness
geometry assertion incorrectly compared scrollWidth to innerWidth despite a
vertical scrollbar; it was corrected to check horizontal overflow against
clientWidth. Product source did not change for that harness failure.

Evidence: `/tmp/olympic-login-turnstile-api-focused.log`,
`/tmp/olympic-login-turnstile-otp.log`, and
`/tmp/olympic-login-turnstile-Gm5pyT/results.json` with320px light/1440px dark
screenshots. Browser processes/Vite ports3118/3119 and temporary profiles are
cleaned. Synthetic widget geometry does not prove real Cloudflare widget layout;
no live credentials, CAPTCHA/Siteverify success, cookie or OTP request was used.
Dedicated reduced-motion validation is omitted/unverified. Normal CI/deploy and
public smoke are authorized; record their actual outcome separately from
interactive login/Cloudflare verification and sustained1GiB capacity.

> This document specifies the authentication architecture used by the
> Olympic Learning Platform.

------------------------------------------------------------------------

# 1. Purpose

Authentication verifies user identity before any protected resource is
accessed.

Goals:

-   Secure authentication
-   Stateless access tokens
-   Revocable refresh sessions
-   Protection against token theft
-   Consistent authentication flow

------------------------------------------------------------------------

# 2. Authentication Components

  Component                Responsibility
  ------------------------ -------------------------------------------
  Spring Security          Security framework
  JWT Access Token         Short-lived API authentication
  Refresh Token            Obtain new access tokens
  Refresh Token Rotation   Replace refresh token after every refresh
  Refresh Token Family     Detect token replay
  HttpOnly Cookie          Secure refresh token storage
  Email Verification       Activate account
  Password Reset           Recover credentials

------------------------------------------------------------------------

# 3. High-Level Flow

``` mermaid
flowchart LR

Browser --> LoginAPI
LoginAPI --> JWT
JWT --> ProtectedAPI
ProtectedAPI --> Browser

Browser --> RefreshAPI
RefreshAPI --> NewJWT
```

------------------------------------------------------------------------

# 4. Login Flow

``` mermaid
sequenceDiagram

participant U as User
participant C as Client
participant S as Spring Boot
participant DB as Database

U->>C: Login
C->>S: POST /auth/login
S->>DB: Verify credentials
DB-->>S
S-->>C: Access Token + Refresh Cookie
```

On success:

-   JWT access token returned.
-   Refresh token stored in HttpOnly cookie.
-   Security context established for subsequent requests.

------------------------------------------------------------------------

# 5. Access Token

Characteristics:

-   Short-lived
-   Signed JWT
-   Sent using Authorization header

Example:

``` text
Authorization: Bearer <access_token>
```

Access tokens are never persisted by the backend.

------------------------------------------------------------------------

# 6. Refresh Token Rotation

Every successful refresh operation:

1.  Validates current refresh token.
2.  Invalidates the previous token.
3.  Creates a brand-new refresh token.
4.  Returns a new access token.

This reduces the impact of stolen refresh tokens.

------------------------------------------------------------------------

# 7. Refresh Token Family

Refresh tokens belong to the same token family.

``` mermaid
flowchart LR

RT1 --> RT2 --> RT3 --> RT4
```

If an old refresh token is reused:

-   Entire family is revoked.
-   User must authenticate again.

This provides replay attack detection.

------------------------------------------------------------------------

# 8. Email Verification

Before full account activation:

1.  User registers.
2.  Verification email is sent.
3.  User opens verification link.
4.  Account becomes verified.

Unverified accounts have limited authentication capabilities according
to business rules.

------------------------------------------------------------------------

# 9. Password Reset

Flow:

``` mermaid
sequenceDiagram

User->>Server: Request reset
Server-->>User: Email link
User->>Server: New password
Server-->>User: Success
```

Requirements:

-   One-time token
-   Expiration time
-   Immediate invalidation after use

------------------------------------------------------------------------

# 10. Logout

Logout performs:

-   Refresh token revocation
-   Cookie removal
-   Session invalidation (logical)
-   Client access token discard

------------------------------------------------------------------------

# 11. Failure Scenarios

  Situation                 Response
  ------------------------- -------------------------
  Invalid credentials       401 Unauthorized
  Expired access token      401 Unauthorized
  Invalid refresh token     401 Unauthorized
  Refresh replay detected   Revoke token family
  Unverified account        Business error response

Errors follow RFC7807 Problem Details.

------------------------------------------------------------------------

# 12. Security Principles

-   Never store JWT in LocalStorage.
-   Always use HTTPS in production.
-   Refresh tokens remain HttpOnly.
-   Rotate refresh tokens after every use.
-   Validate token expiration.
-   Record security-sensitive events.

------------------------------------------------------------------------

# 13. Responsibilities

Client:

-   Send access token.
-   Retry once after refresh.
-   Logout when refresh fails.

Backend:

-   Validate JWT.
-   Rotate refresh token.
-   Detect replay.
-   Enforce authentication rules.

------------------------------------------------------------------------

# 14. Future Enhancements

Possible future additions:

-   OAuth2 Login
-   MFA / TOTP
-   Passkeys
-   Device management
-   Session dashboard

------------------------------------------------------------------------

# 15. Related Documents

-   authorization.md
-   backend-architecture.md
-   request-lifecycle.md
-   technology-decisions.md
