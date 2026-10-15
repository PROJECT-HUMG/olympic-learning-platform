# Authentication and authorization

[Named auth routes](../README.md#auth) and [routed/form owners](../ui/owners/shared-controls.md#auth-forms-recovery-and-token-status-owners) lead to the actual UI. This contract owns security/verification/delivery; presentation and shared fields remain in the UI guide.

## Current security owners

[SecurityFilterChainsConfig](../../apps/api/src/main/java/me/nghlong3004/olympic/common/security/SecurityFilterChainsConfig.java) / [SecurityEndpoints](../../apps/api/src/main/java/me/nghlong3004/olympic/common/security/SecurityEndpoints.java) enforce stateless Bearer security, explicit public methods, admin restrictions and method security; fallback denies unlisted routes. Domain services retain ownership/active-account checks. UI role guards/navigation never grant access.

[AuthServiceImpl](../../apps/api/src/main/java/me/nghlong3004/olympic/auth/service/impl/AuthServiceImpl.java), [refresh service](../../apps/api/src/main/java/me/nghlong3004/olympic/auth/service/impl/RefreshTokenServiceImpl.java) and [JWT service](../../apps/api/src/main/java/me/nghlong3004/olympic/auth/service/impl/JwtTokenServiceImpl.java) own credentials, hashing, rotation and replay handling. Refresh uses HttpOnly cookies; Secure/SameSite/CORS follow runtime configuration. Current API CSRF is disabled; no different cookie/CSRF policy is introduced. Broader access-token revocation consistency remains unresolved.

[Axios](../../apps/web/src/lib/axios.ts), [single-flight refresh](../../apps/web/src/lib/session-refresh.ts) and [auth-session expiry](../../apps/web/src/lib/auth-session.ts) retain identity revisions, late401 handling and private-cache clearing. Only explicitly public minimal DTO queries survive expiry; this metadata grants no data access. Never expose plaintext passwords, tokens or private evidence in public DTOs/logs.

## Registration OTP

[RegistrationVerificationServiceImpl](../../apps/api/src/main/java/me/nghlong3004/olympic/auth/service/impl/RegistrationVerificationServiceImpl.java), [rate-limit service](../../apps/api/src/main/java/me/nghlong3004/olympic/auth/service/impl/RegistrationRateLimitServiceImpl.java), [requests](../../apps/api/src/main/java/me/nghlong3004/olympic/auth/request) and [AuthController](../../apps/api/src/main/java/me/nghlong3004/olympic/auth/controller/AuthController.java) own the exact payloads/endpoints:

- New registration stays PENDING until six-digit email OTP verification; registration/verification issue no login tokens. `register` returns nested `verification`; `/auth/registration/{verify,resend,email,resume}` return their existing message/challenge contracts. The challenge carries normalized email, deadlines and a64-character base64url session secret. Secret responses are `no-store`; never put session/OTP/password in URLs/logs.
- Code lifetime10minutes, session1hour, resend/resume cooldown60seconds, max5 wrong attempts/code. Fixed service limits: sending10/user/hour and30/IP/hour; registration10/IP/hour; resume20/IP/hour and10/identifier/hour including bad passwords; verify60/IP/10minutes. Client countdowns are advisory; API Clock/rate gates decide.
- Codes use SecureRandom, sessions48 random bytes. DB stores SHA-256(session) and SHA-256(session + ":" + code), not plaintext secrets. Atomic hashed-key rate buckets use REQUIRES_NEW and survive request rollback; old buckets are cleaned after their retention interval.
- Operations lock user before challenge. Wrong-code attempts persist despite ApiException; DB failures roll back. Resend/resume/email correction replace the challenge and revoke old email tokens atomically; mail queues only after commit. A provider failure is not verification success. Repeated verification of an already-verified valid session retains existing idempotence.
- Correcting a different email may bypass same-address cooldown but not sending limits; an existing email returns409 without replacing current challenge. Only that session's PENDING account may be edited; identity/password/username stay fixed. Resume requires email/username and password, replacing the old session/code.
- [Routed OTP](../ui/owners/shared-controls.md#routed-otp-composition) uses one native CodeSlots input with leading zeros/paste/autofill and explicit submit. Only challenge state is stored in sessionStorage, never code/password; storage failure retains in-memory use. Success clears it. Lost/expired sessions resume by credentials, preserving the return destination.

V13 must be applied by the API before the matching web calls; never rewrite an applied migration. Rolling back to link-only UI cannot serve users holding OTP challenges. Rate-limit remoteAddr relies on trusted ingress: current production [host Nginx](../../deploy/nginx.conf) proxies API directly and replaces forwarding headers; [web Nginx](../../apps/web/nginx.conf) does so for its own proxy route. Never trust arbitrary client X-Forwarded-For or expose the API outside that boundary; a new CDN needs an explicit trusted-proxy arrangement.

## Token links and recovery

`/verify-email` remains the separate legacy token-link path, not six-digit entry. Still-valid old links remain usable until consumed/expired/replaced. Password reset accepts PASSWORD_RESET or ADMIN_INVITE; the UI receives an opaque token and cannot infer purpose. Preserve generic recovery receipts, retryable failures with values retained, persistent recognized-token failure and the existing recovery action. Obsolete/unmounted token responses must not navigate or overwrite a newer flow. No invitation-specific recovery/resend policy exists.

## Turnstile — password login, registration and reset-email request

When enabled, `/auth/login`, `/auth/register` and `/auth/password/forgot` require `turnstileToken` with exact actions `login`, `register`, `password_reset`. Validate success/exact hostname/action before credential lookup/session issuance, account creation or mail effects. Missing configuration fails startup; widget/provider failure blocks submission or fails closed/retryable. Resume/OTP/token-reset/refresh/logout retain existing gates, not a new CAPTCHA or login rate-limit policy. Each attempted protected submission resets its single-use challenge; no login refresh/replay loop.

Backend runtime names: `TURNSTILE_ENABLED`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_ALLOWED_HOSTNAMES` (exact hostnames, no scheme/path/port), `TURNSTILE_TIMEOUT` (2s default,1–10s bounds). Frontend build names: `VITE_TURNSTILE_ENABLED`, `VITE_TURNSTILE_SITE_KEY`. Flags must agree; disabled mode loads no widget/provider call. Public site-key changes require rebuilding web; the secret stays backend-only, never Vite/build args/Git. Dashboard hostname rules do not replace the backend exact allowlist; Cloudflare DNS/proxy is not required.

Ordinary offline checks disable/intercept the widget/provider. Test keys still call Cloudflare and are not production protection; actual activation/settings/provider calls need current authority. Use [operator setup](../deployment/README.md), not old release narratives, to configure/reconcile the real environment.

## Account email

[AuthMailTemplate](../../apps/api/src/main/java/me/nghlong3004/olympic/common/mail/AuthMailTemplate.java) / [HTML template](../../apps/api/src/main/resources/mail/auth-email.html) serve registration OTP (code only), password recovery, admin invitation and legacy verification (correct action/fallback URL). UTF-8 multipart/related includes plain-text/HTML alternatives and the classpath [transparent PNG](../../apps/api/src/main/resources/mail/olympic-logo.png) via CID `olympic-logo`,44×44CSS px. Web's static SVG is separate; do not recreate a public email-logo copy. Brand text survives image blocking.

Preserve the compact table/inline-CSS/system-font layout, no remote resources/JavaScript, escaped recipient/code/URL, absolute HTTP(S) action URLs without userinfo, and no OTP/token in preheaders. Mail-client dark CSS has light inline/plain-text fallback; it does not synchronize the website's stored theme or guarantee Gmail/Outlook rendering. Existing `MAIL_*`/mail-enabled settings remain; emitted messages/SMTP loopback do not prove actual delivery.

## Focused verification and limits

- [RegistrationOtpIntegrationTest](../../apps/api/src/test/java/me/nghlong3004/olympic/auth/RegistrationOtpIntegrationTest.java), OTP controller/Turnstile/JWT tests: backend rules and isolated DB behavior where Docker runs.
- [Auth-family](../../apps/web/tests/auth-family-browser-check.mjs), [routed OTP](../../apps/web/tests/registration-verification-browser-check.mjs), [CodeSlots control](../../apps/web/tests/code-slots-browser-check.mjs): distinct intercepted scopes, not live enforcement/physical autofill/AT proof.
- [AuthMailDeliveryTest](../../apps/api/src/test/java/me/nghlong3004/olympic/common/mail/AuthMailDeliveryTest.java): four SMTP-loopback strategies, MIME/CID/escaping/size/disabled-mail checks. Inspect emitted HTML/EML under JVM temp `olympic-auth-mail-preview` for narrow/light-dark/long-value/image-failure rendering; no real mailbox is needed.

Run focused API classes from `apps/api` with `rtk proxy ./mvnw -Dtest=<Class> test`; runner source and [current status](../reviews/ux-flow-audit.md) identify remaining proof limits. Provider/mail/production/physical-device behavior needs separate appropriate observation.
