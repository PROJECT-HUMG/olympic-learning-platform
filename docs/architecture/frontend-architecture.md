# Frontend state, data and lifecycle ownership

Start with [named features](../README.md#feature-lookup), [web setup/checks](../../apps/web/README.md), [web instructions](../../apps/web/AGENTS.md) and [UI rules](web-ui.md). Runtime routes in [routes.tsx](../../apps/web/src/router/routes.tsx), not a draft diagram or unused route constant, establish the mounted experience.

## Shared ownership

[Mounted routes](../../apps/web/src/router/routes.tsx), feature hooks/services, [QueryClient](../../apps/web/src/lib/query-client.ts) and [Axios](../../apps/web/src/lib/axios.ts) own actual route/server-state flow. RHF/local drafts own unsaved inputs; they are intentional editable authority, not a second server cache. [Auth](authentication.md#current-security-owners) owns refresh/identity/private-cache clearing. [List-search owner](../ui/owners/layout-and-discovery.md#list-search-and-url-state) owns debounce/IME/URL/POP. [Home/motion](../ui/owners/home-registry-and-motion.md) owns startup/media, without business-query or permission gates. The prior anonymous News startup-expiry query loss was repaired through public-read classification; intercepted proof does not establish deployed timing.

## Daily drafts, sync and recovery

[Daily pages/hooks](../../apps/web/src/features/daily), [day/week API](../../apps/api/src/main/java/me/nghlong3004/olympic/daily/service/impl/DailyServiceImpl.java), [group](../../apps/api/src/main/java/me/nghlong3004/olympic/group/service/impl/GroupServiceImpl.java), [shared review](../../apps/api/src/main/java/me/nghlong3004/olympic/daily/sharing/service/impl/SharedDailyServiceImpl.java) and [feedback](../../apps/api/src/main/java/me/nghlong3004/olympic/daily/feedback/service/impl/DailyFeedbackServiceImpl.java) retain distinct owners.

- Use UTC+7 civil dates and the existing platform calendar. Entry date stays stable through edits/refetch/midnight; preserve explicit date/week/history links. Invalid explicit dates never silently become today. The 07:30 first-submission cutoff is not a reflection deadline; no reflection countdown target is accepted.
- Visiting creates no empty plan. Confirming Add persists only that task through the versioned append endpoint; cancel writes nothing. Pending blocks dismissal; failure retains input and the stable retry UUID.
- Other edits/reflections use [800ms serialized autosync](../../apps/web/src/features/daily/hooks/use-daily-auto-sync.ts). Add pauses batching. Inputs can remain editable in flight; rebase the acknowledgement so newer edits survive and the next batch uses the acknowledged version.
- Invalid intermediate data remains local. Connection/unknown-outcome errors stop automatic retries and retain drafts for explicit recovery. A lost-success response may lead to version conflict on retry; do not guess success or overwrite another device. Conflict reload requires confirmation. Navigation/unload guards protect unsynchronized changes.
- Submit alone records first submission, including supported empty Submit; later edits preserve that stamp. Sharing, consent/revocation and identified feedback publication remain explicit. Guard private day/week/group/evidence reads by current identity/membership/version/access; generic public profile visibility confers no access.
- Reflection closes without discarding edits and uses the same sync/error/retry state. Date/sharing/navigation conflicts use Stay/discard choices. Task deletion warns that associated evidence is removed. Native tab-unload protection remains.
- Evidence stays feature-owned: abort/revoke private raster URLs on scope change/unmount; honest nonimage/legacy file/link states; original authorized downloads. Upload does not submit or enable sharing. Native group creation and persistent room music retain separate modal lifecycles.

## Uploads and cancellation

Feature owners retain selected File objects, validation, dirty/busy guards and actual response confirmation. Kokonut Recognition selection never calls its upstream simulated-success fallback. [Evidence owner](../ui/owners/identity-and-recognition.md#selecting-and-submitting-recognition-evidence) documents metadata+file association and progress limits. Other flows retain their own cancellation contracts: [document download modal](../../apps/web/src/features/documents/components/document-download-modal.tsx) can cancel link/file acquisition, cleans old operations and never forwards account credentials to storage. Unknown byte totals remain indeterminate. A generic component does not add cancellation to an already accepted server operation.

## Focused verification and safe harnesses

[The feature lookup](../README.md#feature-lookup) links responsible Node/API/browser checks. From `apps/web`, use `rtk proxy node --test --test-isolation=none tests/<name>.test.ts`; build/lint commands live in its README. Browser runners differ in host/interception settings; inspect their source/usage before running.

- Current Daily UI/sync: [daily-auto-sync-browser-check.mjs](../../apps/web/tests/daily-auto-sync-browser-check.mjs), [daily-ux-browser-check.mjs](../../apps/web/tests/daily-ux-browser-check.mjs) and [recovery check](../../apps/web/tests/daily-recovery-browser-check.mjs). `DAILY_CHECK_SCOPE=layout` or `interactions` bounds the UI runner; `DAILY_WEB_URL`/`DAILY_CHROME_PATH` select owned local inputs.
- Real local persistence: explicitly start the opt-in disposable [AuthoringBrowserHarness](../../apps/api/src/test/java/me/nghlong3004/olympic/authoring/AuthoringBrowserHarness.java) on loopback8095, then `DAILY_HTTP_HARNESS=disposable rtk proxy node tests/daily-persistence-http-browser-check.mjs`. The runner refuses an existing plan; use a fresh `DAILY_HTTP_DATE` rather than clearing data. This uses fixture identities/disposable PostgreSQL, not production cookie/provider proof or authority to mutate a live API.
- Older `daily-http-browser-check.mjs`, `daily-group-http-browser-check.mjs` and `daily-evidence-http-browser-check.mjs` contain pre-autosync/manual-save assumptions. Their existence is not current Daily acceptance; prefer current UI/persistence runners and actual API integration tests.
- [Room listening](../../apps/web/tests/study-room-listening-browser-check.mjs) and [player](../../apps/web/tests/study-player-browser-check.mjs) use synthetic API/YouTube fixtures. Use sequential bounded room scopes on software-WebGL hosts; no physical GPU/audio/live-multiuser claim follows.

Use [current status](../reviews/ux-flow-audit.md) for recorded validation/limits. Source/fixture coverage is distinct from all-role/all-state rendering, actual providers, device/AT behavior and production performance.
