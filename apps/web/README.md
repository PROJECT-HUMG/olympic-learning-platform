# Web

React19/TypeScript/Vite8/Tailwind4 SPA. [Named features](../../docs/README.md#feature-lookup) → responsible routes/components/API owners/checks. [UI rules](../../docs/architecture/web-ui.md), [UI owner index](../../docs/ui/README.md), [state/Daily lifecycle](../../docs/architecture/frontend-architecture.md) and [current checkpoint](../../docs/reviews/ux-flow-audit.md) contain focused context. Read [AGENTS.md](AGENTS.md) before changes.

## Local setup

Use Node24 and pnpm; from `apps/web`:

```bash
rtk pnpm install --frozen-lockfile
rtk pnpm dev
```

Open `http://localhost:3000`. Vite proxies `/api` to API8080; run the backend separately for real requests. Shared Axios uses `VITE_API_BASE_URL`, default `http://localhost:8080/api/v1`; Docker builds with `/api/v1` and Nginx proxying. Vite values are embedded at build time: never put secrets in `VITE_*`.

Turnstile uses `VITE_TURNSTILE_ENABLED`/`VITE_TURNSTILE_SITE_KEY` at build time, with independent matching backend enforcement. See [setup and failure policy](../../docs/architecture/authentication.md#turnstile--password-login-registration-and-reset-email-request). Ordinary offline checks use disabled/intercepted widget settings, not live provider calls.

## Source ownership

| Area | Owner |
| --- | --- |
| Mounted routes and guards | `src/router/routes.tsx`, route constants and guards |
| Page/feature/layout composition | `src/pages`, `src/features`, `src/layouts`; role destinations in `src/layouts/navigation.ts` |
| Server state/transport/session | Feature hooks/services/types, QueryClient, `src/lib/axios.ts`, session-refresh/auth-session |
| Theme/frames/controls | `src/index.css`, `src/components/ui`, [owner guides](../../docs/ui/README.md) |
| Real initial loading/media | `src/app/startup-preloader.ts`, RouteSuspense/PageLoading, cinematic-media/scene |

Use existing owners; preserve data/privacy, dirty/busy/focus, URL state, mobile/dark/reduced-motion and static-logo/theme-video behavior. Guidance-only practice/history/competition pages and unmounted demo widgets are not live features. The feature lookup distinguishes them.

## Checks

```bash
rtk pnpm build
rtk pnpm lint
rtk proxy node --test --test-isolation=none tests/*.test.ts
rtk pnpm preview
```

Build includes TypeScript and production bundling; report inherited warnings/skipped checks. Choose focused tests/browser runners from [the feature lookup](../../docs/README.md#feature-lookup), then inspect each runner's usage: some self-host with env loading disabled, others require an already-running owned local Vite/preview. URL/Chromium overrides and before/layout/interaction flags vary; old baseline modes are not acceptance proof.

Current [Daily checks and disposable persistence harness](../../docs/architecture/frontend-architecture.md#focused-verification-and-safe-harnesses) supersede older manual-save HTTP runners. Browser interception/fixture identities establish frontend behavior, not live API authorization/persistence, real mail/YouTube/provider behavior, physical autofill/AT/GPU or production capacity. Do not run HTTP mutation probes against an operator/live API or read environment credentials merely to collect screenshots.
