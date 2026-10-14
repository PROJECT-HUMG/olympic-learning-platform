# Recovery, motion, loading and consolidation records

> Preserved checkpoint record: `7a70002` (14/10/2026). Dated claims, counts, pending/publication states and temporary evidence paths below describe their original checkpoints; they are not current release or live-proof claims.

# Rà soát luồng sử dụng và điều hướng

Ngày: 01/10/2026. Phạm vi: các màn hiện có, điều hướng theo quyền, tài khoản, kho tài liệu, quản lý bài viết/câu hỏi/người dùng. Không bổ sung hệ thống thi hoặc luyện tập trong đợt này.

Checkpoint trước khi sửa UX: `ecbfb14` — `feat: add study rooms and refresh student UI`. Các thay đổi bên dưới nằm sau checkpoint này.


## Daily recovery and accessibility — accepted local candidate, 07/10/2026

Lead directly implemented and accepts the three prioritized fixes from
`/tmp/daily-skills-review-handoff-20261007.json`, on verified clean entry HEAD
`a8120b622b364e94be265a94bd2a312e036d57bb`. No delegation or active Peer write
ownership. Optional long-title readability remains deferred. No stage/commit,
dependency, live-backend or external change. Exact seven-path candidate/base
hashes and immutable snapshots: `/tmp/daily-recovery-final-manifest-20261007.json`
and `/tmp/daily-recovery-candidate-20261007/`.

| Outcome / reproduction | Responsible path and accepted behavior |
| --- | --- |
| Groups → Tạo nhóm mới → enter a name → failed POST → Tạo nhóm again | `apps/web/src/features/daily/groups/group-controls.tsx`: creation-owned error in the still-open native dialog, using existing `groupError` and destructive token. Failure rethrows to unchanged `useGroupAction`; shared creation/invitation request gate, external notice, abort and retry semantics retained. Name clears only on existing confirmed success. New opening/accepted retry clears creation feedback; invitation notices are never copied into the dialog. |
| Clear an existing task title or enter whitespace, pause, then type a valid title | `apps/web/src/features/daily/lib/plan-editor.ts`: one shared title validator for row and save, same trim/200-character rules; rejected save identifies row number without mutating local draft. `components/daily-plan-editor.tsx`: inline associated error and `aria-invalid`, stable task/input identity. `ui/daily-sync-status.tsx`: contextual validation text in existing atomic polite status after debounce, without focus changes or live region per keystroke/row. |
| Open Create-group dialog → Close by keyboard or pointer | `groups/group-controls.tsx`: Close44×44px with no flex shrink, existing native close/Escape/return-focus semantics. No dialog replacement. |

Additional changed paths: `apps/web/tests/daily-auto-sync.test.ts` (invalid row,
limits, draft nonmutation and recovery regression),
`apps/web/tests/daily-recovery-browser-check.mjs` (mounted synthetic fixtures),
and this existing status source. No autosync, auth, privacy, evidence, consent,
permission or room/player owner changed. Preserve800ms serialized/versioned
autosync, editable normal-sync inputs, explicit Submit/sharing, dirty/conflict
guards and private revalidation gates; unchanged boundaries are source-reviewed,
not claimed as newly exercised end-to-end.

### Before/after evidence and actual checks

Controlling before evidence: `/tmp/daily-skill-review-5KL17C/results.json`.
At320×640 light, create503 kept the name but feedback was outside the modal and
AX-ignored (`activeModalDialog`); Close32×32. At320×640 dark, empty title prevented
PUT but lacked invalid/description association and contextual live text.
Excluded original6ElaYA wrong hidden-checkbox selection remains excluded.

After: `/tmp/daily-recovery-Sj59nv/results.json`, seven scenario groups pass,
12 PNGs, no captured runtime exceptions, product/test hashes stable during run.
Requested viewport, layout/client/scroll width, visualViewport/scale and PNG
dimensions separately recorded: all fit requested320×640,320×360 or1440×900,
scale1, no horizontal page overflow. Actual mounted Daily routes with intercepted
synthetic student/API fixtures under headless Chromium on owned Vite3114.

- Create503/retry at320×640 light,320×360 dark and1440×900 light: AX-exposed alert
  inside open native modal, same name retained; Close44×44 after existing entrance
  settles; Escape and keyboard Close return focus to opener. Pending retry retains
  name/input node, repeated submits produce no duplicate POST; release navigates
  on confirmed success with the same submitted name. See
  `group-create-error-320x640-light.png` vs before `group-create-error-320-light.png`,
  and final `group-create-error-320x360-dark.png`/pending/retried PNGs.
- Empty and whitespace titles at320×640 dark: affected row has associated error,
  invalid semantics and contextual polite status; no PUT after debounce. Input
  node, raw local text and typing focus retained. Corrected title immediately
  clears row error, autosync resumes, Submit remains separate. Final
  `day-invalid-title-320-dark.png` scrolls to the row to expose the inline message;
  before PNG uses the same viewport/theme at page-top. DOM/AX evidence establishes
  association/visibility; screenshots alone do not establish spoken announcements.
- Held versioned PUT: fields remain editable, newer text and focus survive old
  response, next batch serializes (`maxActiveSaves:1`). Save503 pauses even after
  another edit until explicit retry;409 retains conflict draft/focus without
  silent retry or overwrite.

Checks: build passed (session7518;3710 modules; existing large-chunk warning);
lint passed (session52808;40 existing warnings, none in changed files; log
`/tmp/daily-recovery-lint-20261007.log`);29 targeted Node tests passed,0 failures
or skips (session78390: auto-sync/wire/policy/study-ui); diff check passed.
Probe-only failures preserved separately: kY8I5D attempted to serialize a DOM
node through CDP; ecKURD sampled43.95px Close during the existing entrance.
Driver now avoids DOM serialization and measures after settle; neither is a
passing run or evidence of a44px final-state product failure.

Guidance applied: installed web-design-guidelines (Vercel agent-skills pin
`063bee94c3f4df8453406c830b0a7df0f2860278`) and ui-ux-pro-max (nextlevelbuilder pin
`477bcb28c9812b385cb51a4605ddf30d7b2266e2`). Reused actual assessed local Vercel
rules `/tmp/daily-review-vercel-guidelines-20261007.md` (SHA256
`d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234`) and targeted
UX/React guidance: error near affected control, contextual announcement and
focus preservation. Project `docs/architecture/web-ui.md` remains design
authority; no generated palette/system or new external fetch.

Limits: no live backend/persistence/authorization, real screen-reader speech,
physical/software keyboard, Safari/Firefox or new contrast proof. Task invalid
state rendered320×640 dark; broader task themes/short screens and invitation
error isolation are source-only in this delivery. Dedicated reduced-motion
validation omitted/unverified; existing motion support untouched. Devtools island
in dev PNGs is not a production Daily control. Owned browser exited and isolated
profiles removed; owned Vite3114 stopped and port closed. Other runtimes untouched.

## Secondary-screen interaction motion — accepted, 07/10/2026

Integrated local candidate based on `9143b3acd67198a94e8dc29f3a29490c13a63e21`.
Exact base/candidate SHA256 and paths: `/tmp/ui-secondary-motion-final-manifest-20261007.json`.
Entry: `/tmp/ui-secondary-motion-entry-20261007.json`. Latest motion delta is nine
paths: seven product paths below, `apps/web/tests/secondary-motion-browser-check.mjs`
and this existing status source. Combined working tree has twelve changed paths,
including the three preserved toast product/test paths; index remains empty. No
new commit or dependency. Lead owns all integration scopes after relinquishment.

| Usable effect / trigger | Responsible owner and rationale | Changed product paths |
| --- | --- | --- |
| Open/reopen native “Cách tính điểm thành tích” with pointer or summary Enter | Native `toggle` + Web Animations API reveals content opacity .7→1/tiny -3px settle in160ms. Cancels existing wrapper animations on close/reopen. No React open-state coordination, height animation or focus intervention; native disclosure/table scroll retained. Static visible fallback if animate unavailable. | `apps/web/src/features/recognition/components.tsx`, `apps/web/src/features/recognition/recognition.css` |
| Assessment review receives confirmed APPROVED/REJECTED | Installed Framer Motion `AnimatePresence initial={false}` and keyed status label fade150ms. Library owns presence/replay/cleanup instead of previous-status state, transient flags/timers. Only label identity changes: mounted editors and draft keys untouched. Initial confirmed status and unchanged refetch stay still; pending mutation cannot imply success. | `apps/web/src/features/assessment/components/assessment-draft-list.tsx`, sibling `assessment-motion.css` |
| Processing import receives a changed server phase | Direct150ms background/border/color CSS transitions are sufficient for existing marker state. No extra animation lifecycle or inferred progress; spinner/numeric progress/phase mapping unchanged. | `apps/web/src/features/assessment/components/assessment-import-progress.tsx`, sibling `assessment-motion.css` |
| Explicit Manual question “Xem”, including repeated Edit→Xem | Small feature CSS opacity reveal150ms remains suitable: existing click owns a transient presentation intent, animationend/200ms cleanup clear it. No animation on initial view, routine query or permission-driven changes. No exit/height animation or interaction delay. Draft/permission/rendering/focus behavior retained. | `apps/web/src/features/questions/components/manual-question-form.tsx`, sibling `manual-preview.css` |

Installed ownership was verified in `apps/web/package.json`: Framer Motion12.42.2,
GSAP3.15.0 and tw-animate-css1.4.0 (declared ranges). Existing Framer owner is
`components/ui/fade-in.tsx`; GSAP owns the startup timeline; tw-animate-css is
imported by `src/index.css`. Neither a GSAP timeline nor generic entrance classes
improve the phase color transition or explicit one-shot preview. Native WAAPI
fits uncontrolled details better than wrapping disclosure state in a library.

### Actual responses, disposition and repairs

Fresh configured profiles/notes, original bounded briefs, launches and verified
runtime identities: `/tmp/ui-secondary-motion-peer-launches-20261007.json`.
All three used configured alias/model
`slp-agent-profile-muwz3aai-alhlbc9trsf/gemini-3.8-flash-high`, full-access;
thinking/features absent, actual provider antigravity and runtime null/[].
No native/Grok substitute or profile setting change.

- Recognition `4a646a65-91a2-4c39-901a-bf763188dea2`: complete actual hash-identified
  handoff and relinquishment are preserved in
  `/tmp/ui-secondary-motion-recognition-response-20261007.md`; immutable returned
  files/patch in `/tmp/ui-scoring-rules-candidate-20261007/` reverified. Original
  source acceptance did not establish runtime reopen reliability. Initial CSS
  first-open passed but native reopen failed; Lead superseded that replay code
  with native toggle/WAAPI after owning the relinquished scope. Exact original
  and final candidate acceptance/scoped repair:
  `/tmp/ui-secondary-motion-recognition-disposition-20261007.md`.
- Assessment `e7aa6080-b971-495c-9996-feec8c73f24a`: actual response
  `/tmp/ui-secondary-motion-assessment-response-20261007.md`; verified original
  immutable three-file candidate `/tmp/ui-assessment-motion-candidate-20261007/`.
  Explicit ACCEPT sent and actual closure acknowledgment received. Lead later
  simplified status lifecycle to installed Framer Motion, retaining direct phase
  CSS. Final refinement/disposition and exact hashes:
  `/tmp/ui-secondary-motion-assessment-disposition-20261007.md`.
- Manual `59a929c3-35d0-4fef-8988-712352876993`: actual response
  `/tmp/ui-secondary-motion-manual-response-20261007.md`; immutable candidate
  `/tmp/ui-manual-preview-candidate-20261007/` reverified; returned product bytes
  unchanged. Explicit ACCEPT sent and closure/relinquishment acknowledged.
  Integrated disposition: `/tmp/ui-secondary-motion-manual-disposition-20261007.md`.

Recognition returned artifact and provider execution are separate. After its
complete handoff, execution failed with status error/activeTurn null:
`API error (attempt 1): request failed: Post "https://daily-cloudcode-pa.googleapis.com/v1internal:streamGenerateContent?alt=sse": read tcp 172.21.45.104:43510->172.217.114.4:443: read: connection reset by peer`.
No further dispatch/retry/prompt/settings change/substitution was made to that
Peer. Its assignment/artifact loop is closed; provider failure remains a failed
execution, not a successful Peer run. Ready Assessment/Manual work and authorized
Lead-owned integration continued independently.

### Actual verification and limits

Final browser artifact `/tmp/ui-secondary-motion-jggTm6/results.json`: **44 checks
pass**, six PNG observations, no runtime exceptions, product/test source hashes
stable during the run and reverified against the final tree. Actual mounted
routes use intercepted synthetic API/PDF data in headless Chromium, not live data.

- Recognition: summary Enter opens/reopens and reveals each time at320×640 light
  and1280×800 dark; unchanged-query refetch does not replay; final content visible,
  summary focus retained. Native animate instrumentation forwards to the actual
  browser API and records160ms frames. No claim of full table visual coverage in
  the mobile screenshot where much of the table is below the fold.
- Assessment320×640 light: initially approved and unchanged refetch still; held
  actual approval/rejection requests remain unconfirmed until released; confirmed
  label fades observed by intermediate opacity sampling, each once. Editor node,
  unsaved text and input focus retained. Fresh processing job server phase advances
  RENDERING_PAGES→PARSING_QUESTIONS, progress20→64; actual150ms marker transition
  observed, unchanged-phase refetch does not restart it.
- Manual1280×800 dark: initial editor has no reveal; explicit Xem repeats after
  Edit, retains unsaved title; identity refetch retains preview node/focus and
  does not replay. Role downgrade removes unauthorized editor without reveal;
  no save/publish POST. Initial direct-view suppression is source-only.
- Requested viewport, layout, visualViewport/scale and PNG dimensions recorded
  separately. Mobile observations actually320×640, scale1, scrollWidth320; no
  page overflow. Desktop visual width can exclude scrollbar (Recognition1265px
  within1280px). Screenshots include Recognition, review, phases and Manual preview.

Final build passed (session83891,3710 modules), lint passed (session99402, existing
warnings only), diff check passed. Existing168 Node tests passed,0 failures/skips
(session68767), before final native Recognition/Framer refinements; final browser,
build and lint cover those refinements. No repeated Node run claimed.

Preserved failed evidence: `/tmp/ui-secondary-motion-GKGx9m/results.json` and
`/tmp/ui-secondary-motion-6ouc3a/results.json` demonstrate original CSS reopen gap;
`/tmp/ui-secondary-motion-PUIHX9/results.json` shows abandoned ::details-content
attempt without animation. `/tmp/ui-secondary-motion-2r8Xl9/results.json` passed26
checks then stopped on a wrong driver selector, repaired in the runner; this was
not a product defect. Failed probes are not relabeled passes.

Reduced-motion immediate final states remain supported in code (native preference
check/final CSS, Framer useReducedMotion/duration0, CSS reveal/transition suppression).
Dedicated reduced-motion validation was removed by scope update and is
**unverified**, not a runtime pass. Update was routed to assigned Peers. No new
Safari/Firefox, physical-device, assistive-technology, live backend or performance
proof. Narrow Manual viewport was not newly exercised. Captured exception checks
do not assert absence of console warnings: Vite logged existing Manual PageHeader
p/Badge div nesting warnings; both shared owners and that description were already
present at base, unchanged in this scope.

Preserved toast hashes: `sonner.tsx`35546cde6cf284d7adebf50d937d7a35fb000b7205e99fe92e95786930b3ac57;
`sonner.css`bf1b1024e619465c3fc6e599ca7c9832ec21ba5e2f8d927d52d535debf6c14fe;
`tests/toast-browser-check.mjs`ff6ce282b01378d0c4cea62ab1164794eb3586148d3ddb96a524a1f0372a7e73.
This shared status source gained authorized motion documentation, so its older
toast manifest hash is superseded. No identity/expiry/permission, Daily private
revalidation/draft or room player changes. Owned Vite3112 session80637 stopped;
port closure verified; browser runs cleaned their own profiles. Other runtimes,
agent lifecycle and schedules untouched. All Peer write scopes closed; integrated
candidate usable locally and remains unstaged/uncommitted.

## Shared toast presentation — accepted, 07/10/2026

Base/entry HEAD: `9143b3acd67198a94e8dc29f3a29490c13a63e21`, clean index and
working tree at entry. Prior consolidation, loading and rendered repairs are
committed at this base; older “unstaged/uncommitted” entries below describe their
pre-commit checkpoints. Lead exclusively owned this toast repair; no Peer was
dispatched and no shared scope changed ownership. This new candidate remains
local and uncommitted, with an empty index.

### Usable behavior and design decision

The mounted shared owner is `apps/web/src/components/ui/sonner.tsx`, used once by
`App.tsx:18` with Sonner 2.0.7, richColors, top-right placement and closeButton.
The original next-themes hook did not follow the app's Zustand/resolved theme.
Long notices also exposed mismatched icon slots and a vertically centered28px
close target; supplied action/cancel buttons squeezed the mobile text column.
The repair uses the existing resolved-theme hook and app card/font/color/radius
tokens, top-aligned24px status badges with decorative16px glyphs, wrapping text,
44px localized close/actions, visible keyboard focus and safe-area mobile
gutters. Supplied actions occupy their own rows; cancel uses the muted surface.
The loading glyph is quiet under reduced motion. No caller or App edits.

Three treatments were considered against actual callers:

- **Chosen: calm academic notice.** Neutral card, primary success/check glyph,
  destructive error glyph and readable text suit profile/document saves and
  auth/API errors without competing with study content. More restrained than
  fully tinted cards; supplied actions make a notice taller when present.
- **Tinted status card.** Stronger success/error color distinction, but more
  visual noise for routine saves and more theme/contrast responsibility.
- **Compact receipt.** Smaller for short saves, but long API/upload descriptions
  would require another presentation variant. Deferred as unnecessary.

Real consumer evidence: `features/user/hooks/use-update-profile.ts:15,19`
(profile save/error), `features/auth/components/login-form.tsx:37,41`
(login success/API error), `pages/dashboard/documents/documents-management-page.tsx:88–112`
(document create/edit/delete results), `features/post/components/post-image-upload.tsx:25,32,54`
(image-upload rejection descriptions), and `features/recognition/hooks.ts:9,13`
(mutation success/error) plus `features/recognition/components.tsx:61` (evidence
failure). Recognition notifications confirm changes; no live achievement event
or celebration was invented. Current production callers do not supply Sonner
action objects or use loading/promise/info/warning/custom APIs. Action and
pending branches below are explicitly synthetic compatibility checks, not new
product flows. No retry/undo buttons were added to callers.

Messages, callbacks, permissions/error handling and notification policy remain
feature-owned. Sonner retains stacking, dismissal/swipe, hotkey/focus handling,
timers/default4000ms, promise lifecycle and same-ID updates. Its native loading
toast remains non-dismissable. Auth/expiry, Daily drafts/private revalidation and
room media/canvas files are unchanged.

### Exact candidate and rendered evidence

Changed paths: `apps/web/src/components/ui/sonner.tsx`, new sibling `sonner.css`,
new `apps/web/tests/toast-browser-check.mjs`, and this status document. Exact base
and candidate hashes/evidence identifiers:
`/tmp/ui-toast-final-manifest-20261007.json`. Lead ACCEPTS these shared owner/style
changes after diff inspection and rendered verification. Consumers can use the
existing toast calls immediately; no dependency, API or migration change.

Matched before/after record: `/tmp/ui-toast-before-after-20261007.json` compares
the first16 observations from `/tmp/ui-toast-dX6kGl/results.json` with
`/tmp/ui-toast-19cFua/results.json`. Baseline owner bytes match committed HEAD.
Identical messages, OS light, reduced motion, explicit theme, DPR1 and viewport
settings;320×640 mobile and1280×800 desktop, light/dark, success/error/loading/
supplied actions. Requested, layout, visual viewport/scale and PNG dimensions
are recorded separately and match; mobile is actually320px at scale1.

| Matched320px evidence | Before | Accepted repair |
| --- | --- | --- |
| Explicit app dark / Sonner theme | dark / light | dark / dark |
| Close target | 28×28, vertically centered | 44×44, top-right, localized name/focus ring |
| Icon slot / child | 16px /24px | 24px /16px, top-aligned |
| Long supplied-action text column | 13.016px | 218px |
| Long action fixture height | 6948.75px; controls offscreen | 539.375px; both44px controls visible |

Inspect screenshots `320-dark-actions.png` in the baseline and final directories
and final `320-light-error.png` / `keyboard-close-focus.png`. The chosen surface
matches existing Be Vietnam Pro and blue card tokens in both themes.

### Actual checks and limits

- Final browser run: **104 checks PASS**,18 screenshots/observations, no runtime
  exceptions or source drift. App and its actual Sonner singleton are mounted;
  synthetic APIs/messages intercept all external/backend requests.
- Keyboard action invokes once; preventDefault retains the toast. Cancel invokes
  once and dismisses. Same ID updates without duplication; promise loading→
  success/error and auto-dismiss callback pass. Alt+T→Tab reaches Close with
  a visible ring; leaving the region restores the prior input, and keyboard
  dismissal records one onDismiss with that input focused. Callback/focus evidence
  is resolved for these tested paths, not generalized to every consumer.
- Actual LoginForm submits one rejected synthetic503 POST, displays the exact
  parsed long API message within320px, and remains on `/login`.
- Build PASS on final CSS (existing >500kB chunk warnings). Lint PASS with existing
  warnings only;168 Node tests PASS,0 failures/skips before the final cancel CSS
  refinement. Only CSS and the browser assertion changed afterward; final build
  and rendered run cover that refinement. Final diff check PASS.
- The baseline's later hotkey assertion failed because of the driver modifier/
  focus setup. Other interim probes exposed fixture-regex, cleanup, focus-history
  and CORS-preflight problems; they are preserved as failed evidence, not app
  regressions. No claim that the baseline suite passed. Driver repairs and the
  final104 checks provide fresh candidate callback/focus/LoginForm evidence.
- Limits: headless Chromium with synthetic messages/APIs; no live backend,
  upload or achievement event proof, physical device/Safari/Firefox, touch swipe,
  real safe-area inset, live screen reader speech or performance measurement.
  Still longer messages, shorter screens and multitoast interaction were not
  exercised. Existing Sonner policy was retained; no new duration or viewport
  scrolling policy is inferred from this bounded probe.

To reproduce against an owned local Vite server on3111, run
`rtk proxy node tests/toast-browser-check.mjs` from `apps/web`; override
`TOAST_WEB_URL` for another local server. It creates an isolated Chromium profile,
records screenshots/results under `/tmp/ui-toast-*` and cleans its own browser.
The task-owned Vite server was stopped at closure. No staging or commit.

## Rendered UI breakage repair — accepted, 07/10/2026

The local candidate repairs demonstrated narrow-layout failures; no redesign or
new UI framework. Base remains `7e183c2a5c346bf02369f9f3d2aabfbc071ee1a4`.
Entry `/tmp/ui-visual-entry-20261007.json` covered433 files, all matching on
resumption. Prior accepted consolidation/loading and documentation-only closure
were preserved. No old Peer identity was reused. Index remains unstaged.

### Usable changes and exact task paths

| Path under `apps/web/` | Before → after / preserved behavior |
| --- | --- |
| `src/features/assessment/components/assessment-draft-list.tsx` | At320, review controls extended to x450 and were clipped by the card despite page scrollWidth320. Explicit zero-min mobile tracks/items and wrapping action row keep textarea/native selects/confidence/Save/Approve/Reject within the card. Desktop220px source preview, events, payloads and approval/publication guards remain. |
| `src/features/documents/components/dashboard-document-list.tsx` | Long category+subject metadata forced a1481px mobile content row and1514px page scroll width. Bound the column-flex row to the card; wrap bounded metadata badges with flexible height. Title truncation and description clamp, dates/counts/edit/delete remain. |
| `src/features/documents/components/document-form.tsx` | Implicit mobile tracks stretched fields to657px in a304px dialog. Explicit single zero-min column and shrinkable field owner retain create/edit layouts, RHF wiring, payload, upload gate and pending behavior. |
| `src/pages/dashboard/documents/documents-management-page.tsx` | The existing document dialog composition now owns an explicit single zero-min grid column; shared Dialog defaults and close/pending semantics unchanged. |
| `src/components/ui/select.tsx` | Shared visible value uses min-width0 and truncation; conflicting flex/line-clamp styles removed. Full selected/option text remains in DOM/accessibility; existing Radix events, menu positioning and standard44/compact32 sizing remain. Mounted document menus wrap the full long option inside viewport. |
| `tests/visual-risk-browser-check.mjs` | New mounted-route Chromium probe with explicitly synthetic stress data; separate requested/layout/visual/scale/PNG measurements, local/control bounds, keyboard and pending/payload assertions. All API/external requests intercepted; not live content. |

The seventh task path is this status source, `docs/reviews/ux-flow-audit.md`.
All other ENTRY files, including auth/expiry/Profile, Daily draft/private gates,
room-player/canvas, question figure authorization and the remaining accepted
loading changes, remain byte-identical. Complete integrated candidate (62 changed
paths relative to HEAD), task delta/hashes and evidence identities:
`/tmp/ui-visual-final-manifest-20261007.json`; archive
`/tmp/ui-visual-final-candidate-20261007.tar.gz`. Lead ACCEPTS this integrated
candidate after exact diff and rendered inspection; usable locally, uncommitted.

### Viewport clarification and before/after evidence

The original `/tmp/ui-visual-yYoUkI/results.json` labels described requested
viewports, not necessarily the measured layout viewport. The richer
`/tmp/ui-visual-TbgQcV/results.json` established documents' expanded layout viewport
while visual viewport/PNG stayed320×640 at scale1. The fresh unchanged-source run
`/tmp/ui-visual-XaNeqJ/results.json` reproduced this from
`/tmp/ui-visual-before-runtime-20261007`, copied and verified against immutable
`/tmp/ui-visual-source-before-20261007`/ENTRY. Final repaired run:
`/tmp/ui-visual-Ltg2K0/results.json`. Same data, device metrics, DPR1, mobile flag,
reduced motion and theme settings for matched observations; only the additional
keyboard/pending proof adds interaction states. Explicit comparison and preserved
source identities: `/tmp/ui-visual-before-after-20261007.json`.

| 320-light measurement | Before | After |
| --- | --- | --- |
| Requested and PNG | 320×640 | 320×640 |
| Document layout viewport / innerWidth | 1280×2560 /1280 | 320×640 /320 |
| Document visual viewport / scale | 320×640 /1 | 320×640 /1 |
| Document page scroll width | 1514 | 320 |
| Dialog width / scroll width / grid column | 304 /689 /657.156 | 304 /304 /272 |
| Open category menu width | 652.156, offscreen | 310, within320; full option wraps |

Observed cause is content-driven layout expansion, not an observed zoom change.
No universal1280px engine ceiling or media-query rule is claimed (390 baseline
layout1514, mobile media still matched). No global overflow suppression added.
Scroll position can differ naturally with repaired content size and focus; it is
recorded separately. Desktop viewport metrics also record scrollbar deductions.

### Actual Peer responses and Lead dispositions

Fresh profile notes/settings materialized exactly as configured:
`slp-agent-profile-muwz3aai-alhlbc9trsf/gemini-3.8-flash-high`, full-access,
absent thinking/features overrides; actual runtime null thinking/features `[]`.
Briefs, launches, verified identities/settings:
`/tmp/ui-visual-peer-launches-20261007.json`.

- Assessment writer `6b49f1c1-b0e5-406e-874e-81a37f9eab0e`: ACCEPT exact one-file
  candidate `a88044c754bfd09ee861a7b7f74df06861c4c2fdd1272418b1370bfe06057dcc` after
  ENTRY diff/copy/patch hash inspection. Only class names changed. Peer single-file
  lint is evidence; Lead supplied actual rendering, action bounds/focus and save
  proof. Estimated intrinsic-width formulas were not accepted as measured facts.
  Exact response/disposition: `/tmp/ui-visual-assessment-peer-response-20261007.md`,
  `/tmp/ui-visual-assessment-peer-disposition-20261007.md`. Closure acknowledged;
  ownership fully relinquished.
- Read-only document Peer `20f51428-2d75-4be9-8e56-db6814ca0aed`: ACCEPT source-
  supported column-flex/metadata and implicit grid/value diagnosis. REJECT
  universal1280px ceiling, inferred engine internals/media-query generalization
  and confidence percentages; these were retracted. Optional overflow hiding and
  shared Dialog/SelectContent redesign rejected as unnecessary; actual bounded
  rendering passes. Exact response/disposition:
  `/tmp/ui-visual-document-peer-response-20261007.md`,
  `/tmp/ui-visual-document-peer-disposition-20261007.md`. Assignment closed with
  read-only ownership relinquished. Lead owns integrated handoff; no active writer.

### Validation and limits

- Final mounted-route run:39 observations/14 explicit check records PASS, zero
  runtime exceptions, no global/local horizontal overflow or clipped assessment
  controls. Candidate source/test hashes identical across run. 320/390/768/1440,
  light/dark and reduced motion; dialogs/drawers additionally320×360 dark. Rendered
  assessment, document management/edit/category menu, recognition participant
  editing/delete, manual question authoring, Profile, staff/student/guest drawers
  and management empty/error/retry paths. No demonstrated additional material
  defect on those sampled paths; this is bounded coverage, not all-screen proof.
- Tab/Enter reaches visible document Edit/Select/Save/Close at320; category menu
  opens, selected option accepted by Enter. One PUT with exact title/description/
  category/subject/tag payload, pending Save/Cancel disabled; success closes,
  reopen/close adds no mutation. At320×360 dark, save and close both reached by
  keyboard and unobscured at their tested center points. Vertical content scroll
  is intentional; no claim that all fields fit simultaneously.
- Assessment Tab reaches visible Save; all three review action rectangles fit
  horizontally and vertically after scroll. One PATCH, pending approve/publish
  disabled. Before action right edges343.8/450.4 are repaired. Screenshot
  `assessment-actions-320-light.png` shows all actions and visible focus.
- Screenshot inspection: final assessment actions; document card, edit/menu and
  save pending at320 light;390 dark edit;320×360 dark save. Screenshots and complete
  metrics are adjacent to results JSON. Intermediate focused document proof
  `/tmp/ui-visual-7RCYYM/results.json`; first integrated38-observation proof
  `/tmp/ui-visual-As9z9M/results.json` preserved. Original driver-only localStorage
  failure `/tmp/ui-visual-wL7hZX/failure.json` remains historical, not a product bug.
- Existing consolidation browser regression:22 checks PASS, zero exceptions,
  `/tmp/ui-consolidation-BJr40A/results.json`. Shared Button, pagers, native/Radix/
  Combobox, compact sizing/notch, figure visibility, RHF error/label associations,
  document validation/payload/upload/pending, category retry, destructive async
  confirmation, search debounce and disallowed-role mount remain verified.
- Existing Node suite:168 PASS, zero failure/skip, exec session24492 result recorded
  in `/tmp/ui-visual-node-result-20261007.json`. Build PASS (TypeScript/Vite, existing
  timing/chunk warnings); lint PASS, zero errors/40 existing warnings. Logs:
  `/tmp/ui-visual-build-20261007.log`, `/tmp/ui-visual-lint-20261007.log`. Final runner
  syntax/single-file lint and git diff check PASS.
- All browser data/API/PDF is synthetic on real app paths or existing regression
  fixture; no live backend/storage persistence or authorization proof. Chromium
  emulation is not physical phone, virtual keyboard, Safari/WebKit/Firefox or
  spoken assistive-technology proof. No measured CLS or timing claim. No additional
  product decision required for this bounded candidate.
- Owned browser profiles were cleaned by runners. Owned Vite3109 and isolated
  before-source Vite3110 stopped after validation; no unrelated service removed.
  No push/merge/deploy/dependency/external settings/destructive operations.

## Skeleton/loading implementation — accepted, 07/10/2026

The six accepted proposals from `/tmp/ui-skeleton-audit-consolidated-20261007.md`
are implemented in the local uncommitted candidate. The original audit snapshot
and corrected Peer dispositions remain historical inputs; the proposals are no
longer pending implementation. Base remains
`7e183c2a5c346bf02369f9f3d2aabfbc071ee1a4`. On entry, all 45 consolidation files
matched the accepted review-closure manifest; the intervening closure delta was
documentation only. Implementation entry manifest (429 files):
`/tmp/ui-skeleton-implementation-entry-20261007.json`, SHA256
`fa22bf974b64c12129407e666dedb40d31dd5c54c5412a50834350408fa78d37`.

| Responsible owner / active consumers | Usable behavior and invariants |
| --- | --- |
| AssessmentImportPage; feature status/draft skeletons | Initial status/draft failures now show truthful feedback and GET refetch retry, retaining import ID/header. Initial retries move to a named busy region; cached failures keep actual progress/drafts alongside feedback. FAILED-job restart remains a separate POST, without re-upload. Status and draft placeholders describe their phases, with seven progress steps. Publish stays disabled during status/draft revalidation, errors, job retry or publication, and for empty/unapproved drafts. Existing validation/upload/approval guards remain. |
| Shared Skeleton; question bank and existing compositions | Reduced motion removes pulse. Blocks are decorative by default; compatible bank rectangles now reuse this owner. One composition-level status/busy region announces meaningful text rather than each cell. |
| Category table, document/news/question detail, assessment and Profile wrappers | Named pending regions or sr-only pending text, busy semantics, quiet decoration. Existing query error/empty branches remain distinct. No new skeletons for Daily, rooms, news rows or uploads. |
| DocumentCardSkeleton, public document grid | 160px image region, actual body/footer spacing, borders/tokens and flexible sizing replace fixed280/180 geometry and the spurious body icon. Optional description/actions remain variable; no exact final-height or measured CLS guarantee. |
| SessionLoading, ProtectedRoute and RoleGuard; question detail | Neutral initial auth status replaces a dashboard-shaped promise. Existing delay/error/redirect/role checks remain; no authorized shell is mounted before resolution. Authorized question pending retains safe page-shell/back navigation without mounting editor/private content. |
| ProfilePage; existing useAuth login boundary | Same-account non-auth refresh failure retains the exact dirty editor DOM/value with inline GET retry. Identity ID key resets A's drafts for B; ordinary token rotation does not. 401/403/404/no-user hides editor/authorized actions; expiry uses existing cache cleanup/redirect. Login cancels pending current-user queries before replacing token/cache so a late successful A response cannot overwrite B. HTTP need not be aborted for completion discard. |

### Ownership and exact dispositions

Two useful bounded Peers used freshly refreshed configured Antigravity - Peer
notes/settings: alias/model
`slp-agent-profile-muwz3aai-alhlbc9trsf/gemini-3.8-flash-high`, full-access,
absent thinking/features launch overrides; actual runtime null thinking and
features `[]`. Exact briefs, launch requests and runtime identities:
`/tmp/ui-skeleton-implementation-launches-20261007.json`. No Grok/native substitute.

- Assessment Peer `d9d06f67-e6b2-46e7-babe-18b5a6702ec9`: ACCEPT completed two-file
  candidate's source-supported error/retry/phase behavior after ownership was
  relinquished. REJECT claim that its original publish gate blocked every status
  refetch; Lead repaired that gate and consolidated page-local query error blocks,
  responsive heading constraints and seven-step shape. The provider then errored:
  **API error (attempt 1): INTERNAL (code 500): Internal error encountered.**
  Affected delegation stopped; no follow-up/retry/replacement/settings change.
  Completed artifact remained reviewable and usable for authorized integration.
  Exact response/error/disposition: `/tmp/ui-loading-assessment-peer-response-20261007.md`,
  `/tmp/ui-loading-assessment-runtime-error-20261007.json`,
  `/tmp/ui-loading-assessment-disposition-20261007.md`.
- Profile Peer `ffbeec1d-b3b1-41a6-8ac8-b7634c82b9aa`: ACCEPT one-file candidate
  `02b35b2468f330d933843ecc4c0cbadfdd5b63d642260963addb3929e69718b2` for stable
  editor slot, identity reset and auth-error hiding. ACCEPT its REOPEN_REQUEST
  for the pending A response/login B cache race. Lead repaired the existing login
  hook, added Profile pending busy semantics and owns browser proof. Final backend trace
  (`UserServiceImpl.me:53`, `ErrorCode.USER_NOT_FOUND:45`) proves deleted accounts
  return404; Lead rejected retaining the editor for that response and added404
  to the page-owned unavailable-account condition with fresh browser proof. REJECT extra
  logout work: failure to abort HTTP alone does not prove a removed query can
  corrupt a new cache. No token-revision draft key or auth framework. Closure
  acknowledged and ownership relinquished. Exact response/disposition:
  `/tmp/ui-loading-profile-peer-response-20261007.md`,
  `/tmp/ui-loading-profile-disposition-20261007.md`.

Lead ACCEPTS the integrated candidate after source/ENTRY diff inspection and the
checks below. Returned writer hashes are intermediate; final complete path/hash
identity is `/tmp/ui-loading-final-manifest-20261007.json`, with archive
`/tmp/ui-loading-final-candidate-20261007.tar.gz`. This includes prior accepted
uncommitted work; the manifest separately identifies the 19-path implementation
delta against ENTRY. Index remains unstaged; no push/merge/deploy/install/external
settings changes. Lead owns the integrated handoff; both Peer write scopes closed.

### Fresh verification and precise limits

- Web build PASS (TypeScript/Vite8.1.5); existing large-chunk/plugin-timing warnings.
  Lint PASS, zero errors/40 existing warnings, no new loading-fixture warnings.
  Logs: `/tmp/ui-loading-build.log`, `/tmp/ui-loading-lint.log`. Diff check PASS.
- Existing Node suite: 168 PASS, zero failure/skip,
  `/tmp/ui-loading-node.log`. After login-boundary repair, relevant auth routes/
  session-refresh tests additionally passed 10/10, zero skips,
  `/tmp/ui-loading-auth-node.log`. Existing installed Node24.21.0/dependencies only.
- Fresh `tests/loading-states-browser-check.mjs`: **21 check groups PASS**, zero
  runtime exceptions; `/tmp/ui-loading-hRthBn/results.json`. All431 web source/test
  file hashes unchanged across run. Intercepted API/PDF only, actual page/guard/
  query/Axios/login/RHF code mounted in a fixture MemoryRouter.
- Held initial status and draft errors -> keyboard GET retries -> recovery;
  retained header/import ID/genuine progress; no retry POST/re-upload. NEEDS_REVIEW
  disables publish; actual save/approve enables it. Cached status error prevents
  unverified publish. FAILED-job retry uses distinct `/retry` POST. Phase-specific
  pending semantics and mobile-dark draft placeholder have fresh proof.
- Dirty Profile DOM/value survives503/recovery and token rotation. Actual
  `useAuth.login` replaces A with B while A's /me response is held; A's HTTP response
  then completes, and B remains in cache/editor with A's draft removed. 403 hides
  cached editor;404/deleted-account fetch also removes account UI;401/rejected refresh invokes expiry and protected redirect.
- Actual DashboardLayout withheld while auth pending and for disallowed student;
  RoleGuard releases children only for allowed role. Question pending Back works
  by keyboard, no editor/private data. Bank shared skeleton -> empty transition,
  reduced motion, document/news detail names and decoration checked.
- Chromium accessibility tree records status/live/busy and accessible pending
  text; decorative blocks are hidden, no per-cell status. Keyboard Enter retry/
  Back and visible focus use actual browser events. This is not proof of spoken
  announcements on real screen-reader software.
- Document cards at1440/390 light/dark and320 dark: actual/skeleton160px image,
  footer border/token parity, optional/no-description cards and no horizontal
  overflow. Screenshots reviewed for these surfaces, assessment feedback/dark
  drafts, Profile dirty refresh, neutral guard and question/bank pending.
- Failed driver evidence retained: `/tmp/ui-loading-Hh5K4w` expected an error-card
  button to remain during initial refetch; `/tmp/ui-loading-Eqv4o4` omitted Enter's
  character event and did not activate the button. Corrected driver verifies the
  actual pending replacement and trusted keyboard activation. Intermediate19-group
  pass `/tmp/ui-loading-zS6lMk` and20-group pass `/tmp/ui-loading-VISOFf` are
  superseded by final21-group pass `/tmp/ui-loading-hRthBn`.

Daily/room/player/privacy files still exactly match ENTRY, as do untouched prior
consolidation files. No blanket keepPreviousData, news/table skeleton framework or
private-refetch visibility change. All authorized skeleton proposals are delivered;
no material product decision is pending. Live backend/storage/session policy,
physical devices, Firefox/WebKit, screen-reader speech and measured CLS remain
unverified. Cached draft-fetch failure is source-supported; fresh browser forcing
covered initial draft failure and cached status failure, not every failure variant.
Optional content means exact height/shift is not promised. Owned Vite/Chromium
processes and temporary browser profiles are cleaned; evidence remains in /tmp.

<details>
<summary>Complete implementation delta against ENTRY (19 paths)</summary>

```text
apps/web/src/components/ui/skeleton.tsx
apps/web/src/features/assessment/components/assessment-import-skeleton.tsx
apps/web/src/features/auth/hooks/use-auth.ts
apps/web/src/features/documents/components/document-card-skeleton.tsx
apps/web/src/features/post/components/news-detail-feature.tsx
apps/web/src/features/system-categories/components/system-category-data-table.tsx
apps/web/src/pages/assessment-import-page.tsx
apps/web/src/pages/document-detail-page.tsx
apps/web/src/pages/profile-page.tsx
apps/web/src/pages/question-bank-page.tsx
apps/web/src/pages/question-detail-page.tsx
apps/web/src/router/guards/protected-route.tsx
apps/web/src/router/guards/role-guard.tsx
apps/web/src/router/guards/session-loading.tsx
apps/web/tests/fixtures/loading-states.html
apps/web/tests/fixtures/loading-states.tsx
apps/web/tests/loading-states-browser-check.mjs
docs/architecture/web-ui.md
docs/reviews/ux-flow-audit.md
```

</details>

## Frontend UI consolidation — accepted local implementation, 07/10/2026

Base: `7e183c2a5c346bf02369f9f3d2aabfbc071ee1a4`; clean tree on entry. The
integrated uncommitted candidate is accepted after exact source/diff inspection,
native checks and representative rendered behavior. No API, dependencies, profile
settings, push, merge or deployment changes. Shared contracts are recorded in
[web UI conventions](../../architecture/web-ui.md).

| Shared owner / behavior | Active consumers and before/after |
| --- | --- |
| Category query state, existing RHF `ui/form` helpers | Category management now separates initial failure from empty with retry; cached tables survive refresh failure with a retry banner. Document title/category/subject/tag/description use associated labels, error IDs and invalid state; description errors are visible. Schema, single `setValue(..., {shouldValidate:true})`, tag-array payload and upload gates stay intact. |
| `ui/button` | Loading cannot be overridden by `disabled=false`; it retains caller disabled conditions, action text, one hidden spinner and `aria-busy`. Compatible document/post/category submits, category/document retry/delete, permission grant/revoke and honor delete use it. Async closure/confirmation semantics remain feature-owned. |
| `ui/app-pagination` | Every button is explicitly non-submit; one-based default and compact previous/status/next variants share one owner. Recognition's feature adapter and exam PublishedBank convert zero-based pages at their existing boundary. Existing document/post/user/question consumers receive the safe semantics. |
| `ui/native-select`, `ui/select`, `ui/combobox` | All previously native selects in active question/scientific authoring, question bank, exams, assessment drafts, Daily/groups, room policy/ownership, recognition and GPA now reuse native styling with unchanged events/options/guards. Standard controls are 44px; explicit compact native/Radix controls are 36px/32px. Editor typography remains compact; 52px floating notch unchanged. Combobox's `inputClassName` reaches the visible input; document filters use it for rounded controls. Common local select CSS removed; feature layout/priority styles retained. |
| Questions `figure-notices` | Editor and viewer share pending/error/retry presentation. Existing resolver/authenticated asset access, visible figure filtering, student answer/solution restrictions and retry target remain unchanged. |
| `ui/search-input`, `ui/empty-state` | Document/post/user management and question-bank searches share presentation only. Existing local debounce or explicit submission/URL contracts remain with the feature. Document/post management share matching status empty cards. Public pill/search and content-shaped skeleton layouts stay specialized; document list announces loading/empty/error and uses shared loading on retry. |

The repaired bounded category/document candidate was accepted with exact SHA256
`3e713cacaf3df52f51c892e18308e69fc282f39343d4ed7baa0d954ebe064a4d` and
`6488dd5e530d69260e1c028b2deccab56db8e1abd2f5f2171aaa86d19cf28f7f` respectively.
Ownership closed before integration migrated their loading presentation. These
intermediate hashes are superseded by the integrated source/test hashes in the
final browser manifest. Full changed-file snapshot and hashes:
`/tmp/ui-consolidation-final-candidate.tar.gz`, `/tmp/ui-consolidation-final-manifest.json`.

### Actual verification and evidence

- Web `rtk pnpm build`: PASS (TypeScript + Vite 8.1.5); existing >500kB chunk
  warning retained. `rtk pnpm lint`: PASS, zero errors, existing warnings retained.
  `git diff --check`: PASS. Node 24.21.0, existing installed dependencies only.
- `rtk proxy node --test --test-isolation=none tests/*.test.ts`: **168 PASS**,
  zero failures/skips; `/tmp/ui-consolidation-node.log`.
- `tests/ui-consolidation-browser-check.mjs`: **22 check groups PASS**, zero
  runtime exceptions, unchanged 43-file web source/test manifest across run;
  `/tmp/ui-consolidation-VQOTnb/results.json`. 1440px light / 390px dark component
  renders cover sizes, 52px notch, native/Radix/Combobox keyboard behavior,
  button disabled precedence, both pager variants inside a form without submission,
  field associations and invalid/valid payloads, description validation,
  completed-upload/create/clear gates and pending save/cancel. Mounted category
  retry, recognition URL/API paging, held honor DELETE/Escape/success, management
  empty/search and student route exclusion also passed. Search retains local
  debounce where originally local; no new URL-state behavior is claimed.
- Existing `scroll-dialog-browser-check.mjs`: **28 PASS**;
  `/tmp/scroll-dialog-dCh7US/results.json`. Light/dark desktop/tablet/mobile and
  320x360 dialogs, keyboard/focus/scroll, touch emulation, reduced motion,
  destructive cancel/delete and no parent post submission.
- Existing `daily-auto-sync-browser-check.mjs`: **32 PASS**, maximum one active
  save; `/tmp/daily-auto-sync-Vk95fO/results.json`. Actual priority/completion edits,
  versioned async guards, retained errors/conflict, explicit confirmations,
  save/reopen and responsive/dark rendering preserved.
- Existing `figure-resolution-browser-check.mjs`: PASS;
  `/tmp/ui-consolidation-figure-resolution/results.json`. Existing authenticated
  resolver/session/account transitions and hidden-answer restrictions exercised.
- Screenshots reviewed: desktop/mobile shared controls and document errors,
  category failure, focused scientific/room selectors, management empty/search,
  pending honor deletion, mobile dark Daily, and mobile dark link dialog. Evidence
  PNGs remain beside the above result manifests.

Failed driver runs are excluded: fixture-only JSON overflow (DOM evidence identifies
`output#figure-layout`), transient pager unmount during query fetching, premature
Radix keyboard events before option focus, and an incorrect management-search URL
expectation. Fixtures now wrap JSON, navigation waits for a new document/startup,
keyboard checks wait for actual focus, and search asserts its existing local API
contract. Failed artifacts remain at `/tmp/ui-consolidation-FdVGiR`, `-ldebmd`,
`-R7xQcU`, `-uVxyHU`, `-neuRHC`; the final complete pass is `-VQOTnb`.

### Limits and retained recommendations

Independent post-implementation review closed on 07/10/2026. Reviewer
`a35352de-bc58-4477-a70c-fb158aa9acb5` inspected all 45 integrated changed
paths against the above base, archive and manifest SHA256
`43ca8c6f4d298f54d2f9bb2fd461f78d1508071cfac25ef97cb5be0bf2690a34`;
no drift was found. Lead ACCEPTS **no material introduced issue identified**,
not a guarantee of zero bugs. No active consumer combines Button `asChild`
with `loading`; that future contract concern is deferred until actual use.
Redundant search padding and a hypothetical null empty-state icon do not
justify repairs. No code changes or repeated checks followed this review.
Complete response and dispositions: `/tmp/ui-consolidation-independent-review-20261007.md`.
Existing browser/live-backend limits below remain; the original frozen manifest
and archive are preserved. This closure entry is a documentation-only delta
after review ownership was relinquished; frontend candidate bytes are unchanged.

Browser evidence uses explicitly synthetic local auth/APIs, with external requests
blocked. It proves client behavior, not live backend authorization, database/storage
persistence or physical-device behavior. Chromium only; WebKit/Firefox and actual
mobile keyboards remain unverified. Cached category refresh-error retention is
source-verified but not separately forced in the browser. Representative control
surfaces were exercised, not every populated consumer or screen-reader engine.

Broader native-checkbox style consolidation, specialized search/empty/loading
layouts, provider/popover relocation and inactive component cleanup remain
unimplemented; they are not required for these matching behaviors. Preserve native
checkbox semantics, Daily async confirmations, content-shaped skeletons and the
room's persistent player lifecycle rather than force a uniform replacement.
No material product decision blocks use of this scoped implementation. The owned
Vite process and browser processes are stopped; temporary browser profiles are
cleaned while result manifests/screenshots remain. Existing services are untouched.

<details>
<summary>Complete changed paths (45 files)</summary>

```text
apps/web/src/components/ui/app-pagination.tsx
apps/web/src/components/ui/button.tsx
apps/web/src/components/ui/combobox.tsx
apps/web/src/components/ui/empty-state.tsx
apps/web/src/components/ui/native-select.tsx
apps/web/src/components/ui/rich-text-editor.tsx
apps/web/src/components/ui/search-input.tsx
apps/web/src/components/ui/select.tsx
apps/web/src/features/assessment/components/assessment-draft-list.tsx
apps/web/src/features/daily/components/daily-plan-editor.tsx
apps/web/src/features/daily/groups/group-controls.tsx
apps/web/src/features/daily/ui/study-notebook.css
apps/web/src/features/documents/components/dashboard-document-list.tsx
apps/web/src/features/documents/components/document-filters.tsx
apps/web/src/features/documents/components/document-form.tsx
apps/web/src/features/documents/components/document-list.tsx
apps/web/src/features/exams/components/exam-editor.tsx
apps/web/src/features/post/components/dashboard-post-list.tsx
apps/web/src/features/post/components/post-form.tsx
apps/web/src/features/post/components/post-management-feature.tsx
apps/web/src/features/questions/components/figure-notices.tsx
apps/web/src/features/questions/components/manual-question-form.tsx
apps/web/src/features/questions/components/manual-question-viewer.tsx
apps/web/src/features/questions/components/scientific-block-editor.tsx
apps/web/src/features/questions/components/scientific-content.css
apps/web/src/features/recognition/achievement-editor.tsx
apps/web/src/features/recognition/admin-page.tsx
apps/web/src/features/recognition/components.tsx
apps/web/src/features/recognition/honor-editor.tsx
apps/web/src/features/recognition/recognition.css
apps/web/src/features/study-room/components/room-policy-fields.tsx
apps/web/src/features/study-room/components/study-room.css
apps/web/src/features/study-room/components/transfer-room-ownership.tsx
apps/web/src/features/system-categories/components/system-category-form-modal.tsx
apps/web/src/features/toolkit/components/gpa-calculator.tsx
apps/web/src/features/toolkit/components/toolkit.css
apps/web/src/pages/admin/users/admin-users-page.tsx
apps/web/src/pages/dashboard/categories/admin-categories-page.tsx
apps/web/src/pages/dashboard/documents/documents-management-page.tsx
apps/web/src/pages/question-bank-page.tsx
apps/web/tests/fixtures/ui-consolidation.html
apps/web/tests/fixtures/ui-consolidation.tsx
apps/web/tests/ui-consolidation-browser-check.mjs
docs/architecture/web-ui.md
docs/reviews/ux-flow-audit.md
```

</details>
