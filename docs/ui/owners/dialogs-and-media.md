# Dialog, creation, evidence and native lifecycle owners

> Source lookup reorganized from checkpoint `7a70002`. Dated evidence and adoption counts below remain checkpoint-specific. Start with [current UI guide](../README.md); verify the responsible source before editing.

## Mobile modal frame audit (8773df0)

Original read-only audit of HEAD `8773df072c58b0b52a33e5f6116fd70918320458` plus
the separately pending Daily recovery, 10/10/2026. That audit made no runtime
edits. The subsequently authorized [five local repairs](dialogs-and-media.md#mobile-modal-repairs-10102026)
resolve its findings. Their scoped publication is authorized; the separate Daily
recovery remains pending.
[Findings/evidence and preservation accounting](../../reviews/history/admin-and-modals-20261010.md#mobile-modal-frame-audit-8773df0)
are in the existing status source. Source discovery found **43 modal construction
sites in34 files**, including CreationDialog's own frame/dirty confirmation and
unrouted legacy PostManagement. These are construction sites, not43 screens or
43 independent owners. Shared primitives and Sheet/Select portal behavior were
also inspected. All material consumers below were source-reviewed; fresh rendered
coverage is explicitly narrower.

### Current frame ownership

- [Dialog](../../../apps/web/src/components/ui/dialog.tsx): installed Radix owns
  modal focus trapping/scroll lock. The centered frame has16px nominal viewport
  gutters, `max-height:calc(100dvh - 2rem)` and **whole-frame scrolling**. Its44px
  absolute Close, heading and footer scroll with content. Its single grid column
  now uses minmax(0,1fr); full title/description wrap unbroken text. Consumer width/height
  overrides remain material; shared reuse does not establish safe long-content
  layout.
- [CreationDialog](../../../apps/web/src/components/ui/creation-dialog.tsx) /
  [CSS](../../../apps/web/src/components/ui/creation-dialog.css): fixed heading/Close
  with a separate shrinking, scrolling body; ≤68rem, compact ≤36rem. Full100dvh
  only at widths≤640px, including short portrait. Wider phone landscape uses
  the centered frame. Top header and bottom body padding honor safe-area insets;
  left/right insets are not currently explicit. Actions remain owned by each form
  at the body end, rather than a universal sticky footer. Actual honor/document
  error forms reached actions at320×280 and667×320 without losing the44px Close.
  Busy/dirty guards and return-focus contracts remain unchanged.
- [AlertDialog](../../../apps/web/src/components/ui/alert-dialog.tsx): centered,
  bounded, whole-frame scrolling confirmation. Short-screen confirmation actions
  are reachable by scrolling/Tab. Existing feature pending-dismissal guards stay
  local. Dirty-close Cancel preserved the form in the sampled viewport matrix.
- [EvidenceViewer](../../../apps/web/src/components/ui/evidence-gallery.tsx) /
  [CSS](../../../apps/web/src/components/ui/evidence-gallery.css): whole-frame scroll
  with only the compact title/44px Close sticky, separate zoomable image scroll
  area and bounded wrapping controls/index. Full description scrolls while
  retaining its ARIA relationship. Features still supply freshly authorized
  media/actions. The historical findings below are resolved by the local repairs.
- [ImageLightbox](../../../apps/web/src/components/ui/image-lightbox.tsx): fullscreen
 100dvh black frame, contained image,44px Close. Fresh320×568/844×390 rendering
  fits; Escape returns to the article image. Notch/physical browser chrome remains
  unverified; offsets use16px rather than explicit safe-area insets.
- Daily's [sticky header](../../../apps/web/src/features/daily/ui/daily-dialog-header.tsx)
  and [notebook CSS](../../../apps/web/src/features/daily/ui/study-notebook.css) remain
  local to autosync/task/evidence flows. Native group creation remains a different
  owner; native room music deliberately keeps player children mounted and restores
  scroll/focus. Do not replace either native lifecycle merely to match the frame.

### Historical pre-fix problems and smallest remedies

| Priority / task | Exact owner/site | Observed problem | Smallest fitting follow-up |
| --- | --- | --- | --- |
| High: inspect identity/review safely | [DialogContent](../../../apps/web/src/components/ui/dialog.tsx):65; [PermissionDialog](../../../apps/web/src/pages/admin/users/admin-users-page.tsx):244; [Recognition review](../../../apps/web/src/features/recognition/admin-page.tsx):121 | Valid long email /191-character achievement title makes the implicit grid column wider than the288px frame at320px: scroll widths903/1783px. Context and review controls are clipped. | Make the responsible shared grid column shrink (`minmax(0,1fr)`), make header/description shrink and wrap unbroken user text. Retain readable full context; do not hide overflow as the fix. Verify affected contextual/confirmation variants. |
| High: view/download private evidence | [EvidenceDownload](../../../apps/web/src/features/recognition/components.tsx):68; [EvidenceViewer](../../../apps/web/src/components/ui/evidence-gallery.tsx):50; [CSS](../../../apps/web/src/components/ui/evidence-gallery.css):11 | A valid75-character attachment name in the nowrap download button expands the viewer's288px grid to668px; the sticky header/Close is pushed horizontally outside the screen. Reproduced on an actual admin review route. | Bound/shrink the viewer grid and controls; wrap the feature-owned download label or show concise “Tải tệp” with full filename in its accessible name/context. Preserve download callback, disablement and private-media adapters. |
| High: reach viewer controls on short phones | [Evidence gallery header](../../../apps/web/src/components/ui/evidence-gallery.css):12; [AchievementEvidence description](../../../apps/web/src/features/recognition/achievement-evidence.tsx):34 | With short action labels and a valid191-character record title, the sticky header is286px inside a248px frame at320×280. Scrolling to the bottom still paints context over the zoom control; a focused enabled “Phóng to” is fully obscured. This is independent of filename overflow. | Keep only the compact title/44px Close row sticky; let full record/privacy description scroll normally while retaining DialogDescription/ARIA relationships. No loss of private context or media gates. |
| Medium: native group creation on mobile | [GroupList](../../../apps/web/src/features/daily/groups/group-controls.tsx):87,137; [study-dialog CSS](../../../apps/web/src/features/daily/ui/study-notebook.css):117 | Cancel/Create are36px high; Close/Input are44px. At320×280, an outside wheel moves the background page from163→226 while the native dialog stays open (`body overflow:visible`). | Add44px action sizing to the Daily native frame and explicit open/close body-scroll restoration using the existing native-room pattern. Preserve group draft/error/request/return-focus authority; do not convert it to Radix. |
| Medium usability: nested picker dismissal | [RichTextEditor image dialog](../../../apps/web/src/components/ui/rich-text-editor.tsx):115; [Dialog absolute Close](../../../apps/web/src/components/ui/dialog.tsx):77 | At320×280 scrolling the upload chooser54px to see its help text moves the sole pointer Close to y=-30. Escape still returns to the exact parent toolbar button. Crop/room forms also scroll top Close away but retain bottom Cancel/Close. | For this chooser, keep its small heading/Close row reachable or add an explicit bottom Cancel. Do not add fixed footers to every short confirmation or alter upload-busy/nested-focus semantics. |

### Source coverage ledger

“Fresh” means actual source owner rendered with synthetic content/API, not a live
backend or every route/state. Mounted-owner probes explicitly mark synthetic child
composition; they do not exercise Daily autosync or actual room playback.

| Source construction sites | Variant and coverage |
| --- | --- |
| [creation-dialog.tsx](../../../apps/web/src/components/ui/creation-dialog.tsx) — DialogContent:32, AlertDialogContent:63 | Shared creation frame + nested dirty confirmation; fresh honor/document error forms and dirty Cancel across320/390/short/landscape. |
| [evidence-gallery.tsx](../../../apps/web/src/components/ui/evidence-gallery.tsx) — DialogContent:50 | Shared protected viewer; fresh actual admin evidence + mounted-owner long-title/short-filename stress and focused zoom. |
| [image-lightbox.tsx](../../../apps/web/src/components/ui/image-lightbox.tsx) — DialogContent:31 | Fullscreen News image; fresh actual reader320 portrait/844 landscape, Escape and focus return. |
| [rich-text-editor.tsx](../../../apps/web/src/components/ui/rich-text-editor.tsx) — DialogContent:115, DialogContent:451 | Nested image/link dialogs in actual PostForm; fresh short320 upload layout, link validation, Escape to parent trigger. |
| [daily-plan-editor.tsx](../../../apps/web/src/features/daily/components/daily-plan-editor.tsx) — DialogContent:238, DialogContent:261 | Daily add-task/reflection; pending Daily source inspected. Reflection owner/header/fields mounted with synthetic task/error composition; actual syncing not run. |
| [evidence-panel.tsx](../../../apps/web/src/features/daily/evidence/evidence-panel.tsx) — DialogContent:112 | Daily upload + shared viewer adapter; source reviewed; existing private-media/lifecycle evidence reused. |
| [group-controls.tsx](../../../apps/web/src/features/daily/groups/group-controls.tsx) — dialog:87 | Native create-group; original route320×280 audit recorded36px actions/background scroll; current local repair proves44px actions/restored lock separately from pending recovery. |
| [use-daily-confirm.tsx](../../../apps/web/src/features/daily/ui/use-daily-confirm.tsx) — AlertDialogContent:25 | Daily confirmation; source reviewed. Shared AlertDialog matrix freshly sampled through creation dirty guard. |
| [document-download-modal.tsx](../../../apps/web/src/features/documents/components/document-download-modal.tsx) — DialogContent:91 | Cancelable download/progress/error Dialog; source reviewed; historical lifecycle evidence retained, no fresh download probe. |
| [post-management-feature.tsx](../../../apps/web/src/features/post/components/post-management-feature.tsx) — AlertDialogContent:222, CreationDialog:252 | POST create/edit CreationDialog and pending delete AlertDialog; fresh actual long form/nested choosers/delete503 matrix. |
| [post-management.tsx](../../../apps/web/src/features/post/components/post-management.tsx) — AlertDialogContent:187 | Unrouted legacy delete confirmation; source-only, not claimed as a routed screen. |
| [admin-page.tsx](../../../apps/web/src/features/recognition/admin-page.tsx) — CreationDialog:49, CreationDialog:93, DialogContent:120, DialogContent:121 | Recognition honor create/edit/publish, admin submission, delete and review; fresh create error + review long context; publish/eligibility/pending historical evidence reused. |
| [private-pages.tsx](../../../apps/web/src/features/recognition/private-pages.tsx) — CreationDialog:37 | Achievement add/resubmit CreationDialog; source reviewed, prior creation/private-viewer proof reused. |
| [public-pages.tsx](../../../apps/web/src/features/recognition/public-pages.tsx) — DialogContent:56 | Honors album photo Dialog; source reviewed (600px bounded width, contained65dvh media), not freshly rendered. |
| [edit-room-rhythm.tsx](../../../apps/web/src/features/study-room/components/edit-room-rhythm.tsx) — DialogContent:31 | Rhythm form and restart context; actual owner freshly mounted, fields/presets/footer/short viewport/Escape; no room mutation. |
| [room-music-dialog.tsx](../../../apps/web/src/features/study-room/components/room-music-dialog.tsx) — dialog:26 | Persistent native music; actual owner mounted with synthetic queue/player sentinel, sticky44px Close, body lock, focus return and same DOM child after closing. |
| [room-track-dialog.tsx](../../../apps/web/src/features/study-room/components/room-track-dialog.tsx) — DialogContent:22 | Track request form; actual owner mounted with long policy text. Fresh short frame, focused resize/draft retention, Escape. No real queue action. |
| [study-room-scene.tsx](../../../apps/web/src/features/study-room/components/study-room-scene.tsx) — DialogContent:152 | Member context Dialog; source-only, explicit focus restoration inspected. |
| [study-room-session.tsx](../../../apps/web/src/features/study-room/components/study-room-session.tsx) — DialogContent:219, AlertDialogContent:227 | Settings + nested transfer/close confirmation; source-only, role/pending/focus contracts inspected; prior continuity proof remains bounded. |
| [study-rooms-lobby.tsx](../../../apps/web/src/features/study-room/components/study-rooms-lobby.tsx) — CreationDialog:47 | Room creation CreationDialog; source and prior retained-draft/pending evidence, not freshly repeated. |
| [transfer-room-ownership.tsx](../../../apps/web/src/features/study-room/components/transfer-room-ownership.tsx) — DialogContent:24 | Nested member chooser/native select inside settings; source-only, local capability/online eligibility retained. |
| [system-category-form-modal.tsx](../../../apps/web/src/features/system-categories/components/system-category-form-modal.tsx) — CreationDialog:99 | Category/subject/tag compact creation/edit; source + previous keyboard/form proof, not freshly repeated. |
| [gpa-calculator.tsx](../../../apps/web/src/features/toolkit/components/gpa-calculator.tsx) — CreationDialog:67 | Compact course creation; source + prior range-validation/draft proof, not freshly repeated. |
| [avatar-crop-dialog.tsx](../../../apps/web/src/features/user/components/avatar-crop-dialog.tsx) — DialogContent:69 | Crop frame; actual owner freshly mounted with synthetic image, reachable actions/arrow-capable viewport, Tab trap/Escape/body lock. No upload/apply mutation. |
| [avatar-upload-card.tsx](../../../apps/web/src/features/user/components/avatar-upload-card.tsx) — AlertDialogContent:162 | Avatar remove AlertDialog; source-only; no avatar mutation. |
| [change-password-modal.tsx](../../../apps/web/src/features/user/components/change-password-modal.tsx) — DialogContent:76 | Floating password fields/error form; source-only,44px targets and existing reset/pending/return-focus behavior inspected. |
| [admin-users-page.tsx](../../../apps/web/src/pages/admin/users/admin-users-page.tsx) — DialogContent:244 | Permission Dialog; actual route populated with12 long descriptions, long email, scrolling/Escape/focus matrix. No grant/revoke. |
| [assessment-import-page.tsx](../../../apps/web/src/pages/assessment-import-page.tsx) — CreationDialog:137 | Compact PDF-upload creation; source + prior invalid-upload/pending/authorization/expiry proof, no fresh upload or live job. |
| [register-page.tsx](../../../apps/web/src/pages/auth/register-page.tsx) — CreationDialog:11 | Routed compact registration/Turnstile; source + prior synthetic widget/validation/routed return proof. Real widget/IME not tested. |
| [admin-categories-page.tsx](../../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx) — AlertDialogContent:314 | Category deletion AlertDialog; source + prior pending/error/target proof reused. |
| [documents-management-page.tsx](../../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx) — AlertDialogContent:211, CreationDialog:242 | Create/edit CreationDialog and delete AlertDialog; fresh empty/validation/long form geometry; pending deletion historical proof reused. |
| [document-detail-page.tsx](../../../apps/web/src/pages/document-detail-page.tsx) — DialogContent:353 | Reader edit retains ordinary Dialog95vw/90vh override, whole-frame scroll; fresh390 portrait/320 short populated editor and reachable bottom actions. It differs from management CreationDialog; dirty-close is not supplied here. |
| [exam-editor-page.tsx](../../../apps/web/src/pages/exam-editor-page.tsx) — CreationDialog:13 | Routed new-exam CreationDialog; source + prior short/dirty/routed-focus evidence reused. Frozen/read routes stay separate. |
| [question-detail-page.tsx](../../../apps/web/src/pages/question-detail-page.tsx) — CreationDialog:528 | Routed manual-question creation; source + prior draft/metadata/nested-option proof reused; existing DOM-nesting warning not retested as a modal issue. |

### Verification and remaining limits

Fresh matrix:320×568 light,390×844 dark,320×280 dark,844×390 light and667×320
dark for honor/document error forms, permission/review context and post-delete
failure; additional crop/music/track/rhythm/reflection owners at the first four
sizes. Light/dark coverage is representative, not every variant at both themes.
Native/WebView/notch behavior is not inferred from Chromium metrics.

Controlled focused-input resizing390×844→390×280 preserved the room draft but
left its focused input below the frame until Tab caused scrolling. This is a
**layout/visual viewport resize approximation**, not a physical virtual keyboard
failure verdict. Real Android/iOS IME, browser chrome, zoom, safe-area insets,
landscape cutouts, soft-keyboard dismissal and assistive technology remain
unverified. The HTML viewport has no `viewport-fit=cover` or `interactive-widget`
policy. Validate those devices before prescribing viewport JS or changing that
browser policy. The base/fullscreen lightbox has no explicit notch-aware offset;
CreationDialog only implements top/bottom inset padding.

Normal CreationDialog, short confirmations, fullscreen lightbox and native room
music samples are usable within their recorded limits. Do not replace purposeful
native persistence, autosync reflection or reader/media contracts with a universal
modal engine. No build/lint/backend suite was repeated for this source/docs audit.
Owned Vite/Chromium ran with `envDir:false`, synthetic intercepted API/assets and
blocked external media/widgets; no live content, permissions, uploads or settings
were changed. Development screenshots may include the TanStack Query Devtools
launcher; it is not evidence of a production modal control.


## Mobile modal repairs (10/10/2026)

**Accepted mobile-modal repairs on8773df0; scoped commit/push authorized.** All five historical
findings above are resolved in their responsible owners; dimensions and feature
policies were retained. This section supersedes the audit's “findings only” state.

| Repair | Actual before → after evidence |
| --- | --- |
| Dialog shrink/wrap | On actual Users/Recognition review routes at320px,288px frames had903/1783px scroll widths →288/288px. Long email and191-character review context remain complete. No overflow-hiding substitute. |
| Evidence controls/download | On actual admin review,288px viewer expanded to668px →288px. Bounded control children and concise “Tải tệp” retain full original filename in caption and accessible button name; async download/AbortSignal/object-URL behavior unchanged. Close stays within the viewport. |
| Compact sticky viewer header | Only “Minh chứng” +44px Close remain sticky; full record/privacy DialogDescription scrolls. At320×280, focused Zoom is y95.81–139.81, below header bottom74.25, with successful center hit-test. Audit's independent short-filename/long-context reproduction remains linked below. |
| Native Daily group | Cancel/Create36px →44px (all three buttons44px). Outside wheel moved page120→320 before →120→120 after. Prior inline overflow restores on Escape, Cancel, pointer Close and actual route unmount. Name retention/native pending dismissal policy is unchanged. Creation-owned error feedback and the Close class repair are separately pending Daily recovery; this UI rule independently supplies44×44px targets. |
| Nested POST image chooser | Before: sole pointer Close scrolled out and no bottom exit. After: bottom44px Cancel at y204–248 within320×280 frame, activated through real pointer events. Escape restores exact parent image trigger; pending upload disables Cancel and blocks Escape.503 failure keeps parent title, successful same-file retry inserts the storage URL; dirty-close Continue preserves draft. |

Reproducible runner: [mobile-modal-browser-check.mjs](../../../apps/web/tests/mobile-modal-browser-check.mjs),
against an owned Vite server (`VISUAL_WEB_URL`; set `VISUAL_SCOPED_COMMIT=1`
when the separate Daily recovery is absent; synthetic intercepted API/media,
external requests blocked). `VISUAL_BASELINE=1` records expected pre-fix defects.
Exact before source includes accepted pending Daily recovery, not only clean HEAD.

- [Before results](/tmp/mobile-modal-fixes-before-eKZfEx/results.json),9 screenshots;
  [after results](/tmp/mobile-modal-fixes-after-Vs667I/results.json),41 screenshots/10 check groups.
- Representative pairs: [permissions before](/tmp/mobile-modal-fixes-before-eKZfEx/permissions-320x280-dark.png) /
  [after](/tmp/mobile-modal-fixes-after-Vs667I/permissions-320x280-dark.png);
  [evidence before](/tmp/mobile-modal-fixes-before-eKZfEx/viewer-focus-320x280-dark.png) /
  [after](/tmp/mobile-modal-fixes-after-Vs667I/viewer-focus-320x280-dark.png);
  [picker before](/tmp/mobile-modal-fixes-before-eKZfEx/nested-image-bottom-320x280-light.png) /
  [after](/tmp/mobile-modal-fixes-after-Vs667I/nested-image-bottom-320x280-light.png).
- After matrix:320×568 light,390×844 dark,320×280 dark,667×320 light,
  844×390 dark,768×1024 light,1280×800 dark. Native group and nested picker
  stress/lifecycle checks use320×280; focused URL resize uses390×844→390×280.
- TypeScript + production Vite bundle passed with `envDir:false` synthetic public
  configuration (same app/plugin build stages); lint passed with existing warnings.
  31 focused Node regressions passed against the integrated working tree: POST image validation, Daily autosync,
  groups/evidence contracts, Recognition presentation and admin recovery contracts.
- Interrupted probe results are preserved separately, not counted as clean runs:
  `/tmp/mobile-modal-fixes-after-w8kFuP` (premature focus assertion), `bQCfC7`
  (resize/scroll timing), `v8MwQv` (development live reload while editing README).
  The final runner waits for return focus and settled viewport geometry.

No physical Android/iOS keyboard, browser chrome/notch/screen reader or live backend
proof. Emulated focused resizing is the controllable keyboard approximation.
Synthetic failures/blocked external fonts and navigation-aborted requests remain
in results; they are not concealed as successful live traffic. Development
Devtools launcher is not a production modal control. Existing private-media gate,
identity/expiry/refetch and room persistence evidence remains bounded; those
adapters/player contracts were source-preserved rather than broadly re-probed.
No dedicated reduced-motion test, dependency, Java change or live content mutation.

Accepted integrated working-tree path/hash ledger, entry→final patch and Daily overlap reconstruction:
[/tmp/mobile-modal-fixes-final-manifest-20261010.json](/tmp/mobile-modal-fixes-final-manifest-20261010.json).
Prior audit supplement hashes identify earlier bytes only; the manifest records
changed docs anew. Scoped committed blobs differ from integrated working-tree bytes
where pending Daily hunks are excluded; see `/tmp/mobile-modal-publication-20261010.json`. Independent Daily/auth/deploy bytes and the entry status prefix remain preserved
in the working tree. Only the modal audit/repair status sections belong to this commit. Use the [owner lookup](shared-controls.md#interaction-owner-lookup), not a
new universal modal wrapper, for later repairs.


Scoped publication proof: the exact staged source excludes pending Daily recovery.
`/tmp/mobile-modal-fixes-after-ex9eGh/results.json` passed six screenshots/three
check groups (native44×44px targets/wheel lock/close/focus/unmount, nested picker
pending/failure/retry/draft and focused resize). TypeScript passed on the isolated
index snapshot. The runner's scoped mode expects the existing external group-error
notice; it does not claim that pending creation-owned feedback shipped. Existing
31-test/build/lint and41-screenshot integrated evidence is reused for unchanged
contracts. A probe expectation mismatch (`OoEIWO`) was corrected to the actual
feature-owned localized error status, with no business-policy change.


## Creation frame geometry and floating controls 10/10/2026

Base1a3463d (previous fixes committed/pushed, live deployment unobserved).
The production-only cropping reproduction and new layout rules are in
[UI authority](../history/features-and-modal.md#creation-frame-geometry-and-floating-controls-10102026);
[status/evidence](../../reviews/history/admin-and-modals-20261010.md#creation-frame-geometry-and-floating-controls-20261010)
records exact artifacts and preservation accounting. Earlier development/synthetic
string-overflow proof does not close this positioning defect.

Quick reproduction: build with an env-safe Vite config (`envDir:false`), preview
the minified bundle, then run `VISUAL_PRODUCTION=1 VISUAL_CREATION_FLOW=1` with
`VISUAL_WEB_URL` pointing at the owned preview server and
[mobile-modal-browser-check.mjs](../../../apps/web/tests/mobile-modal-browser-check.mjs).
The script uses actual admin routes with intercepted synthetic APIs, captures
open/settled/static rectangles, and checks body/action/focus/dirty/busy/upload/error
lifecycles at320/390/short/landscape/tablet/desktop.
`VISUAL_FLOATING_FIXTURE=1` against an owned development server additionally mounts
[actual submenu/item-aligned owners](../../../apps/web/tests/fixtures/floating-controls.tsx)
for nested keyboard checks. Fixture content is synthetic, never production data.

PostForm/DocumentForm keep validation and requests; CreationDialog keeps only
frame/dismissal/focus. PDF UploadDropzone keeps the same upload contract with a
native overlaid chooser button and a separate visible44px Clear. Dialog,
EvidenceGallery, Daily native lifecycle/private adapters and room continuity are
unchanged by this correction. Shared floating motion has no mount-delay controller
or dependency addition; account-specific animation is removed from navigation.css.
Known limits: exact operator device/live bundle, physical keyboard/visual viewport
and real upload/backend behavior remain unverified. The prior seven-path Daily
recovery and unrelated documentation remain separately dirty.


## CreationDialog and error-toast coexistence — 15/10/2026

[Sonner presentation](../../../apps/web/src/components/ui/sonner.css) owns the top-right toast gutter while an open CreationDialog is present. Match the existing [68rem/full-screen frame](../../../apps/web/src/components/ui/creation-dialog.css): the toast remains readable beside the Close action rather than obscuring it. Width and safe insets remain bounded; ordinary placement returns on modal close. If CreationDialog frame/Close sizing changes, verify this geometry too. This CSS-only exception does not hide error feedback, alter Sonner timers/announcements or change Radix focus, busy/dirty confirmation or nesting. [Actual touch/error regression](../../../apps/web/tests/individual-recognition-browser-check.mjs) supports `--toast-before` (pinned prior CSS) and `--toast-only`; [review/proof](../../reviews/ux-flow-audit.md#profile-clarity-review-and-toast-close-correction--15102026).


### Creation frame scrolling during evidence selection — 15/10/2026

The controlled Kokonut evidence picker exposed a second scroll owner during `scrollIntoView`/focus: at320px the frame remained at y0, but outer `scrollTop=37` moved the44px Close to y−22 while the intended body also scrolled. [CreationDialog CSS](../../../apps/web/src/components/ui/creation-dialog.css) now uses `overflow:clip` on the outer fixed flex frame; only its existing shrinking body may scroll. This prevents programmatic/focus scrolling of the frame without changing coordinates, transforms, dimensions, responsive geometry, Radix lifecycle or feature state. Upload probes assert frame/Close bounds after scrolling to the picker at phone/desktop sizes; the toast touch/dirty/busy/nesting regression remains separate. [Current evidence status](../../reviews/ux-flow-audit.md#kokonut-recognition-evidence-and-electric-logo-rollback--15102026).
