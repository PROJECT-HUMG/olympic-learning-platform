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

Build includes TypeScript and production bundling; report inherited warnings/skipped checks. Choose focused checks from [the feature lookup](../../docs/README.md#feature-lookup). Use the [browser entry point below](#browser-checks) for the migrated routed checks; other runners retain their own setup.

Current [Daily checks and disposable persistence harness](../../docs/architecture/frontend-architecture.md#focused-verification-and-safe-harnesses) supersede older manual-save HTTP runners. Browser interception/fixture identities establish frontend behavior, not live API authorization/persistence, real mail/YouTube/provider behavior, physical autofill/AT/GPU or production capacity. Do not run HTTP mutation probes against an operator/live API or read environment credentials merely to collect screenshots.

## Browser checks

From `apps/web`, Node24 and installed Chromium are sufficient; no Playwright package, browser download or running dev/API server is required. If PATH selects a different pnpm, use `rtk proxy corepack pnpm@10.17.0` in place of `rtk pnpm`.

```bash
rtk pnpm check:browser --list
rtk pnpm check:browser otp --help
rtk pnpm check:browser otp
rtk pnpm check:browser auth --section=recovery
rtk pnpm check:browser media --evidence-only
rtk pnpm check:browser home --timeout-ms=120000
rtk proxy node --test tests/browser/session.test.mjs
```

[The small check catalog](tests/browser/checks.mjs) owns names, options and discovery; [session.mjs](tests/browser/session.mjs) owns isolated Vite/Chromium/CDP lifecycle. Existing runner files also accept the same options when invoked directly. Fixtures, requests, route interactions, screenshots and assertions stay in their feature runner.

| Check | Flow-specific options (default runs its full current scope) |
| --- | --- |
| `otp` | `--visual-only` or `--interactions-only`; `--before` reads the historical component for visual comparison |
| `auth` | `--section=forms` (default), `recovery`, `reset`, `lifecycle`, `status-visuals`, `loading` or `turnstile`; `--forgot-only` bounds only the Turnstile section |
| `home` | `--before` reads the historical hero; current scope includes frame samples, motion clips, search and local original MP4 playback |
| `media` | `--evidence-only` omits album checks; `--before` is historical album comparison |

All four support `--browser <executable>`, `--output <NEW directory>`, `--timeout-ms <100..300000>` (default30000 per Chromium startup/CDP call, not a whole-suite deadline), and `--no-sandbox`. Browser discovery reuses PATH Chromium/Chrome or an already installed Linux Playwright Chromium cache; an explicit executable overrides discovery. Sandbox remains enabled by default; use `--no-sandbox` only if the trusted local environment cannot support it. Nothing installs a browser. Unknown options, sections and conflicting scope flags fail rather than silently run the wrong check. Cold routed compilation and Home clip encoding can need the longer timeout on a busy host; clips replay measured frame timing.

The host binds an owned ephemeral loopback port, including Vite WebSocket traffic. Each run has a new browser profile/cache and ignores `.env`, project Vite config and inherited `VITE_*` values; only explicit synthetic public flags are supplied. File watching is disabled so unrelated edits cannot reload the candidate mid-check. It never attaches to an existing browser/profile/server. Do not add a live-URL option to these intercepted checks. They render **actual product routes with synthetic APIs/session challenges**, not isolated component fixtures or live backend enforcement.

Evidence defaults to a new `/tmp/humg-browser-<check>-*` directory; `--output` requires an existing parent and refuses any existing target. `results.json` or `failure.json`, screenshots/optional motion clips and `lifecycle.json` remain for diagnosis; startup failures retain a bounded Chromium stderr tail. Confirmed navigation/request cancellations are retained separately; unexpected fixture/CDP errors still fail the check. Startup failure, assertion failure, socket closure and SIGINT/SIGTERM cleanup stop/await only owned Chromium, close the host and remove the temporary profile/cache/config; lifecycle status records cleanup failure rather than claiming success. SIGKILL/host crashes cannot run JavaScript cleanup. The lifecycle test deliberately uses failure paths and an independent listener to check ownership.

Other runners are intentionally **not migrated**: isolated CodeSlots/SwipeToast/primitive fixtures, Home/auth scene/preloader checks, Daily and authoring HTTP harnesses, room/YouTube and older UI runners retain their differing contracts. Inspect their source/options and relevant owner guide before running; this entry point is not a universal suite or proof of their equivalence. Historical `--before` output is never current acceptance proof.
