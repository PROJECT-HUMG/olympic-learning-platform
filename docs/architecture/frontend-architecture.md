# Frontend state, data and lifecycle ownership

Start with [named features](../README.md#feature-lookup), [web setup/checks](../../apps/web/README.md), [web instructions](../../apps/web/AGENTS.md) and [UI rules](web-ui.md). Runtime routes in [routes.tsx](../../apps/web/src/router/routes.tsx), not a draft diagram or unused route constant, establish the mounted experience.

## Shared ownership

[Mounted routes](../../apps/web/src/router/routes.tsx), feature hooks/services, [QueryClient](../../apps/web/src/lib/query-client.ts) and [Axios](../../apps/web/src/lib/axios.ts) own actual route/server-state flow. RHF/local drafts own unsaved inputs; they are intentional editable authority, not a second server cache. [Auth](authentication.md#current-security-owners) owns refresh/identity/private-cache clearing. [List-search owner](../ui/owners/layout-and-discovery.md#list-search-and-url-state) owns debounce/IME/URL/POP. [Home/motion](../ui/owners/home-registry-and-motion.md) owns startup/media, without business-query or permission gates. The prior anonymous News startup-expiry query loss was repaired through public-read classification; intercepted proof does not establish deployed timing.

## Uploads and cancellation

Feature owners retain selected File objects, validation, dirty/busy guards and actual response confirmation. Kokonut Recognition selection never calls its upstream simulated-success fallback. [Evidence owner](../ui/owners/identity-and-recognition.md#selecting-and-submitting-recognition-evidence) documents metadata+file association and progress limits. Other flows retain their own cancellation contracts: [document download modal](../../apps/web/src/features/documents/components/document-download-modal.tsx) can cancel link/file acquisition, cleans old operations and never forwards account credentials to storage. Unknown byte totals remain indeterminate. A generic component does not add cancellation to an already accepted server operation.

## Focused verification and safe harnesses

[The feature lookup](../README.md#feature-lookup) links responsible Node/API/browser checks. From `apps/web`, use `node --test --test-isolation=none tests/<name>.test.ts`; build/lint commands live in its README. [Supported routed browser commands](../../apps/web/README.md#browser-checks) share owned host/browser/CDP setup and synthetic APIs; other runners retain their distinct host/interception contracts.

[Room workspace](../../apps/web/tests/study-room-browser-check.mjs) and [player](../../apps/web/tests/study-player-browser-check.mjs) use synthetic API/YouTube fixtures. Run `pnpm check:browser rooms`; no live audio/multiuser claim follows.

Use [current status](../reviews/ux-flow-audit.md) for recorded validation/limits. Source/fixture coverage is distinct from all-role/all-state rendering, actual providers, device/AT behavior and production performance.
