# Admin and mobile-modal audit and repair records

> Preserved checkpoint record: `7a70002` (14/10/2026). Dated claims, counts, pending/publication states and temporary evidence paths below describe their original checkpoints; they are not current release or live-proof claims.

<a id="admin-ui-task-audit-a4821ed"></a>

## Admin UI task audit (10/10/2026, pushed a4821ed)

**Disposition:** audit complete; findings accepted as follow-up work, not runtime
repairs. HEAD is `a4821ed8c869baa7131aa2a10ace3b10cab632be`, matching the recorded
normal origin/main push. No new staging, commit, push, deployment observation or
live mutation. Existing seven-path Daily recovery and unrelated operator docs are
separate and preserved. This section appends after the unchanged396024-byte status
prefix. The [component reference](../../architecture/web-ui-components.md) links here.

Applied frontend-design, ui-ux-pro-max and freshly fetched
[Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).
Judgment follows administrator tasks and the current UI authority: finding the
right record, reading its actual status, inspecting authorized evidence and taking
a safe action. Shared ownership is evidence from imports/JSX, not matching CSS.

### Route and creation coverage

[Actual router](../../../apps/web/src/router/routes.tsx) mounts **8 admin families,
16 screen paths**, including six role-generated exam routes. `/admin` is a redirect,
not a seventeenth screen. Lecturer aliases reuse owners; shared authenticated
Daily/Profile/Toolkit routes are not additional admin families. Unrouted legacy
PostManagement/DocumentManagement implementations are excluded from this ledger.

| Family / concrete admin paths | Actual owners and task assessment | Inspection evidence |
| --- | --- | --- |
| Dashboard: `/admin/dashboard` | [DashboardPage](../../../apps/web/src/pages/dashboard-page.tsx) uses PageHeader/PageSection and role navigation shortcuts; useful task groups, no invented metrics or Create action. Keep this purposeful simpler surface. | Source; prior broad shell evidence, no new dashboard render. |
| Users: `/admin/users` | [AdminUsersPage](../../../apps/web/src/pages/admin/users/admin-users-page.tsx) uses SearchInput/Table/AppPagination and a bounded permission Dialog. No Create User action exists. Grant/revoke are immediate permission operations, not draft creation. F6 below. | Populated320/390/820/1440; native Enter opens permission Dialog, Escape closes,44px actions measured. No grant/revoke performed. |
| Categories: `/admin/categories` (categories/subjects/tags) | [AdminCategoriesPage](../../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx) → [SystemCategoryDataTable](../../../apps/web/src/features/system-categories/components/system-category-data-table.tsx) and [SystemCategoryFormModal](../../../apps/web/src/features/system-categories/components/system-category-form-modal.tsx). Installed Radix Tabs, three Create intents through CreationDialog, floating-field exception retained. F3/F6. | Populated category table at four widths; all three branches source-inspected. Prior subject-tab keyboard/modal evidence reused; tags not freshly rendered. |
| Documents: `/admin/documents` | [DocumentsManagementPage](../../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx) → [DashboardDocumentList](../../../apps/web/src/features/documents/components/dashboard-document-list.tsx). Real ManagementListRow/ManagementRowActions, DocumentThumbnail, RetryFeedback, PaginationFooter and guarded CreationDialog adoption. Cohesive rows already exist; F3/F5/F7 concern task usability. | Two similarly titled synthetic records at four widths; existing modal/dropdown-dirty/upload evidence reused. |
| Posts: `/admin/posts` | [PostManagementFeature](../../../apps/web/src/features/post/components/post-management-feature.tsx) → [DashboardPostList](../../../apps/web/src/features/post/components/dashboard-post-list.tsx). Same shared management row/actions, feedback/range footer and CreationDialog; rich editor/nested image chooser retained. F2/F3/F5/F7. | Draft/archive with past deadlines and blocked thumbnails at four widths; pending-delete Escape503 probe. Prior nested-dialog/upload proof reused. |
| Recognition: `/admin/recognition` (honors/reviews/admin-submit) | [AdminRecognitionPage](../../../apps/web/src/features/recognition/admin-page.tsx) → HonorEditor/AchievementEditor/AchievementRecord. Both creation intents use CreationDialog. Drafts have explicit **Công bố album**; reviewer evidence uses [AchievementEvidence](../../../apps/web/src/features/recognition/achievement-evidence.tsx) → shared EvidencePreviews/EvidenceViewer. Review lists remain purposefully flat; approval/rejection/revocation keep separate confirmation/reason/version contracts. F8. | Honors list at four widths; cold error/retry. Existing publication/eligibility/draft-failure and reviewer/private-revalidation evidence reused. No live publication or evidence download. |
| Questions: `/admin/questions`, `/admin/questions/import`, `/admin/questions/new`, `/admin/questions/:id` | [QuestionBankPage](../../../apps/web/src/pages/question-bank-page.tsx), [AssessmentImportPage](../../../apps/web/src/pages/assessment-import-page.tsx), [QuestionDetailPage](../../../apps/web/src/pages/question-detail-page.tsx). CardHeader/body/footer grouping, labeled native filters, shared search/URL helper and compact RetryFeedback are real reuse. New manual question and PDF import open CreationDialog; editing remains a dedicated workspace, schema/asset/permission differences retained. F1/F4/F9. | Bank at four widths and failed metadata; synthetic import modal→review/save/reject failures at320. Earlier bank duplicate/search and new-question dirty evidence reused. Legacy detail branch source-only. |
| Exams: `/admin/exams`, `/admin/exams/new`, `/admin/exams/:examId`, `/admin/exams/:examId/preview`, `/admin/exams/papers`, `/admin/exams/papers/:paperId` | [ExamEditorPage](../../../apps/web/src/pages/exam-editor-page.tsx), [ExamEditor](../../../apps/web/src/features/exams/components/exam-editor.tsx), [exam-read](../../../apps/web/src/features/exams/components/exam-read.tsx). Shared ExamListItem groups title/version/points/release context; new exam is routed CreationDialog, save transitions to its dedicated edit route. Explicit publish eligibility/conflict/version remains. Frozen readers stay article/question lists, not nested cards. F4/F8. | All six route branches and owners source-inspected; existing list/modal/dirty/search evidence reused. No fresh frozen reader or live release-gate test. |

**Create coverage:** ten top-level record/job creation intents: documents1, posts1,
categories3, honors/admin-submit2, manual question1, PDF import1, exam1. All use
CreationDialog directly or through the existing form modal. Routed `/new` URLs
retain deep links; they now render dialogs, not an unguarded creation page. Inline
participant/placement additions mutate the current editor draft, not a separate
record-creation flow; forcing another modal there adds unnecessary nesting.
Existing reading/editing routes and the immediate permission Dialog are deliberate
variants. Source adoption alone does not prove every submission branch at runtime.

### Prioritized findings and smallest remedies

Priorities express administrator impact, not blanket WCAG severity. P1 is the first
correctness/recovery slice; P2 is meaningful usability/lifecycle work; P3 is polish.
No finding changes publication/access policy or implies a proven backend exploit.

| ID / priority | Exact source and concrete task problem | Evidence / smallest responsible remedy |
| --- | --- | --- |
| **F1 / P1: import review failures disappear; sibling actions remain live** | [AssessmentDraftCard:42](../../../apps/web/src/features/assessment/components/assessment-draft-list.tsx#L42), [actions:77](../../../apps/web/src/features/assessment/components/assessment-draft-list.tsx#L77), [mutation hooks:34](../../../apps/web/src/features/assessment/hooks/use-assessment-import.ts#L34): save/approve/reject use uncaught mutateAsync; no row error presentation or hook onError. While rejection is pending, Save and Approve remain enabled. An administrator cannot tell whether a correction/review failed and can start competing row operations. | Synthetic503 save and reject produce unhandled rejections, no alert/toast, unchanged draft text; held rejection leaves Save/Approve enabled. Add row-owned caught error/role=alert and one explicit-operation busy gate across its actions (and fields where snapshot consistency requires it). Keep save→approve order, feature callbacks, retained text and existing eligibility. Do not move business review into a generic feedback framework. |
| **F2 / P2: expiry replaces real draft/archive status** | [DashboardPostList:30](../../../apps/web/src/features/post/components/dashboard-post-list.tsx#L30) derives EXPIRED from deadline regardless of stored status; [backend expired-count policy:57](../../../apps/api/src/main/java/me/nghlong3004/olympic/post/repository/PostSpecifications.java#L57) counts expired **PUBLISHED** posts. Admins see “Hết hiệu lực” for a draft/archive while counters say draft1/archive1/expired0. | Both synthetic DRAFT and ARCHIVED records with past deadlines render the wrong badge at every matrix width. Restrict display expiry to published records, retaining real status and separate deadline context. Add a small status/deadline regression; no API/public-access change. |
| **F3 / P2: pending destructive confirmation can vanish on Escape** | [Posts:206](../../../apps/web/src/features/post/components/post-management-feature.tsx#L206), [Documents:182](../../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L182), [Categories:311](../../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx#L311) clear target unconditionally in onOpenChange despite disabled Cancel/Confirm. Recognition already guards its close handler while pending. | Held synthetic Post delete: Escape closes the confirmation before503 completes, losing the visible target/retry context. Documents/categories have equivalent source handlers; their extra probe was interrupted before navigation and is **not** a runtime pass. Gate close on the feature mutation's pending state and retain target/failure feedback. Reuse Radix/AlertDialog; don't disable dismissal globally for idle dialogs. |
| **F4 / P2: required metadata failure resembles missing options** | [Question Bank:90](../../../apps/web/src/pages/question-bank-page.tsx#L90), [manual question:233](../../../apps/web/src/features/questions/components/manual-question-form.tsx#L233), [exam subject:109](../../../apps/web/src/features/exams/components/exam-editor.tsx#L109), [import subject/topic:63](../../../apps/web/src/features/assessment/components/assessment-draft-list.tsx#L63). These four owners default failed metadata to absent options without recovery presentation; topic errors likewise have no useful retry. | Failed Bank metadata renders enabled “Môn học: Tất cả” with no subjects/alert while records load normally. Other owners source-confirmed, not separately failure-rendered. Reuse existing status/Button/InlineRetryFeedback presentation beside the controls, feature-owned refetch/disabled states and cached-data distinction. Preserve main query, typed drafts, selected identities and URL semantics. DocumentForm already demonstrates a fitting metadata loading/error/retry pattern. |
| **F5 / P2: mobile record identity loses the distinguishing text** | [Document title:39](../../../apps/web/src/features/documents/components/dashboard-document-list.tsx#L39) is single-line truncate; [Post media/title:34](../../../apps/web/src/features/post/components/dashboard-post-list.tsx#L34) reserves96×64px at every width and lacks an image-error fallback. Shared ManagementListRow is adopted; these are local content decisions, not duplicate row owners. | At320 two different document suffixes collapse into the same visible prefix (175px title width versus478/488px text); DOM accessible names remain full, so this is primarily sighted record-finding, not missing link names. Blocked Post images show broken-image alt text and squeeze titles to two short lines. Permit useful document wrapping/detail disclosure and add a bounded Post error/media fallback at the feature owner. Preserve native open/edit/delete targets and avoid a universal media framework. |
| **F6 / P2: mobile tables separate record identity from safe action** | [Users table/action:71](../../../apps/web/src/pages/admin/users/admin-users-page.tsx#L71), [category table:85](../../../apps/web/src/features/system-categories/components/system-category-data-table.tsx#L85), [Table:5](../../../apps/web/src/components/ui/table.tsx#L5). Five-column Users and four-column categories keep actions at the far right with no scroll guidance/retained identity. | Users table is743px inside271px at320,356px at390 and666px at820; its first action starts at x659 on320. Category382px table exceeds286/356px mobile container; desktop fits. Overflow stays inside Table, and keyboard activation reaches the permission Dialog: **not** page overflow or an unreachable keyboard action. Add contextual scroll guidance and retain record identity/action during narrow use (bounded sticky columns or a genuinely useful compact record composition). Keep desktop table, semantic headers,44px actions and current pagination. |
| **F7 / P2: status counters consume space but cannot find records** | [Post query:51](../../../apps/web/src/features/post/components/post-management-feature.tsx#L51), [counts:133](../../../apps/web/src/features/post/components/post-management-feature.tsx#L133), [available request fields](../../../apps/web/src/features/post/types/post.types.ts#L48); [document toolbar:129](../../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L129). Posts show four noninteractive counters but offer keyword only; Documents offers keyword only despite known subject/kind. | At320 Post search begins y469, after176px of counter/section space; at390 y447. Administrators must scan pages to find drafts or a subject. A next product slice can group a labeled status control with search (existing status/expired request contract), compact counters on phones, and consider subject/kind management controls where actual fields fit. Preserve debounce/page reset/ownership; do not turn counters into unexplained buttons or invent new sort/publication policy. This is usability work, not a current broken filter promise. |
| **F8 / P3: local feedback and active navigation omit state semantics** | [Recognition QueryFeedback:15](../../../apps/web/src/features/recognition/components.tsx#L15), [admin navigation:46](../../../apps/web/src/features/recognition/admin-page.tsx#L46), [ExamProblem:7](../../../apps/web/src/features/exams/components/exam-feedback.tsx#L7). Retry owners accept no fetching/busy state; Recognition active buttons differ only by variant with no aria-current/pressed. | Cold Recognition retry **correctly changes to pending/loading** (no button); cached-data retry remains a source-identified missing busy contract, not a reproduced cached-state pass. Extend these feature feedback owners with fetching state or reuse shared presentation where equivalent; propagate callbacks locally. Add aria-current/pressed to existing section buttons without pretending they are Radix tabs. TanStack may deduplicate queries; no duplicate writes claimed. |
| **F9 / P2: PDF review session has no return path** | [AssessmentImportPage:24](../../../apps/web/src/pages/assessment-import-page.tsx#L24) keeps importId only in component state; [progress:39](../../../apps/web/src/features/assessment/components/assessment-import-progress.tsx#L39) says the job continues when leaving. Current service reads known IDs but this screen provides no history/resume entry. | Source fact: leaving/reloading loses the UI's ID; server job continuation is not evidence of resumable review. Smallest fitting follow-up: preserve a validated job ID in the route/query and revalidate it through the existing authorized status/draft endpoints, with honest missing/forbidden/error/reset states. No new job history framework, uploads, or backend policy inferred. Navigation/reload behavior not newly browser-exercised. |

Additional accessible-context polish can use the existing ManagementRowActions and
SystemCategoryDataTable owners for record-specific Edit/Delete names. Current
buttons have text/sr-only names and44px targets; generic repeated names are weaker
context, not unnamed controls. Keep purposeful dense NativeSelect exceptions,
floating FormField, reader layouts and permission/review semantics.

### Evidence, limits and preservation

Fresh owned Chromium inspection uses actual source at HEAD, an envDir:false local
Vite config and intercepted synthetic APIs/assets. Six populated admin list
families at320×568 light,390×844 dark,820×900 light and1440×900 dark produced no
page horizontal overflow.29 completed screenshots include the matrix, permission
dialog, metadata/cold-retry state and import failures; this is **not** all16-screen
rendering, complementary themes at every width, physical-device or screen-reader
proof. No live backend policy, persistence, Cloudinary, Turnstile or release gate
was newly exercised. No production mutation/request was used for the probes.

Completed results: `/tmp/admin-audit-after-2DCK11/results.json` (two320 checkpoints,
then fixture Badge-selector failure), `/tmp/admin-audit-after-SgVY2B/results.json`
(remaining22 matrix shots +3 interaction shots; no probe errors), and
`/tmp/admin-import-audit-after-x1dUSG/results.json` (two failure states; expected
unhandled row rejections captured explicitly, no probe errors). `/tmp` audit
drivers leave repository runtime/tests untouched. The initial fixture intercepted
the SPA route accidentally; corrected to API-only before usable inspection.
Interrupted/failed artifacts are retained as failures, not passes. An extra
cached-retry/documents/categories lifecycle probe at
`/tmp/admin-state-audit-after-k9FYHS/results.json` stopped on local
ERR_CONNECTION_REFUSED before app navigation; its requested observations remain
unverified. No repeated unchanged retry or provider substitution followed.

Reused completed evidence: `/tmp/visual-layout-after-B8TO0C/results.json`
(modal focus/Escape/backdrop/dirty-close/short viewport/nested upload),
`/tmp/visual-layout-after-lZrupW/results.json` (categories/Bank/exam native keyboard
and query/draft return), `/tmp/mobile-four-after-RuZKwX/results.json`
(publication/eligibility/failure/pending/draft/nonadmin), and
`/tmp/mobile-four-after-slqYkk/results.json` (reviewer evidence/identity/private
revalidation/reason/version/approval). Their completed checks are reused for the
unchanged owners, not claimed as fresh exhaustive/live proof. Prior175web tests,
12focused API tests and build/lint are recorded publication evidence; no unrelated
suite rerun is warranted for this source/docs audit.

Exact documentation hashes, incremental patch and preserved entry hashes are in
`/tmp/admin-ui-audit-handoff-20261010.json`. Runtime source remains unchanged;
index stays empty. Owned Chromium fixtures are closed and local Vite is stopped
at handoff. Operator env was never read/printed/hashed/copied/staged; no external
settings or CI/deployment monitoring performed.


<a id="admin-ui-audit-remedies-20261010"></a>
## Admin audit remedies — implementation and acceptance (10/10/2026)

Follow-up authority covers the evidenced F1–F9 remedies from
`/tmp/admin-ui-audit-handoff-20261010.json` on actual base
`a4821ed8c869baa7131aa2a10ace3b10cab632be`, scoped local commit and normal
origin/main push. No live admin/content mutations, external settings changes or
post-push pipeline/deployment monitoring. Lead implemented directly; no Peer
scope/profile was launched or substituted. Existing frontend-design, UI/UX Pro Max
and Web Interface Guidelines informed the task-based fixes; brand/creation owners
remain unchanged. [Actual owner/API reference](../../ui/history/component-adoption-20261009-10.md#admin-recovery-and-discovery-owners-10102026)
and [layout rules](../../ui/history/features-and-modal.md#admin-record-finding-and-recovery-refinements-10102026)
are updated rather than introducing another tracker.

### Finding dispositions and concrete before/after

| Finding | Implemented owner / observed result |
| --- | --- |
| **F1 accepted/resolved** | AssessmentDraftCard catches save/approve/reject failures, focuses a row alert and preserves corrections; one operation lock gates fields/sibling actions. Per-job mutation keys also gate publish. Held reject previously left Save/Approve enabled and503 produced unhandled rejections; now all siblings/publish are blocked and save/reject503 retain text with a visible error. Save→approve order remains. |
| **F2 accepted/resolved** | POST-owned postDisplayStatus derives expiry only for PUBLISHED; a past DRAFT/ARCHIVED deadline no longer contradicts real badges/counters. Deadline context and stored status/API policy remain unchanged. Pure boundary tests and actual rendered badges agree. |
| **F3 accepted/resolved** | Posts/Documents/Categories use their existing AlertDialog owners with pending-close gates and retained inline target/error. Escape and backdrop stay blocked during held deletion;503 preserves target/retry, explicit successful retry closes. Earlier interrupted Documents/Categories evidence is now replaced by completed synthetic checks. |
| **F4 accepted/resolved** | OptionQueryFeedback is a small presentation beside existing queries: nine direct JSX sites across six files (Bank, manual question, legacy QuestionEditForm, ExamForm, import rows, Documents management). Loading/error/retry and dependent-option disablement distinguish failure from absence; cold unavailable options retain selected identity fallbacks. Bank results/query remain independent. All three question/exam editor variants and import retain typed corrections through metadata/topic failure/retry; retry is type=button. |
| **F5 accepted/resolved** | Management document links wrap full distinguishing title suffixes (175px frame,90px wrapped height on320) rather than single-line truncate. POST thumbnail is64×48 on phones /96×64 wider and has an honest failed/no-image fallback. Existing ManagementListRow/DocumentThumbnail/native open targets remain. No general gallery/media owner or access policy added. |
| **F6 requested Users remedy accepted/resolved** | Local UserIdentity/UserPermissions serve compact rows below768px and the existing wider Table. Mobile identity/email/status/permissions/date/action stay together;44px contextual action names identify the exact account. Tablet scroll guidance retains desktop table semantics. A newly observed keyboard close-focus defect is repaired by restoring the exact permission trigger. Categories retain their bounded relational table and44px actions; optional additional record-context polish is not a new blocking refactor. |
| **F7 accepted/resolved** | Posts status/expiry and Documents subject/category use supported PostSearchRequest/DocumentSearchRequest fields. URL filters use replaceListParam/getPageNumber, preserve keyword500ms debounce, reset pagination, support Back and feature-only Reset without deleting unrelated context. Phone Post counters are compact (search y469.28→387.28 at320). Documents pairs subject/kind controls to reduce filter-band height without shrinking44px selects. No new backend filter/sort/publication policy. |
| **F8 accepted/resolved** | Recognition section navigation has aria-current; all nine QueryFeedback uses in four files pass retrying. All seven ExamProblem uses in two files pass isFetching. Cached failure retries stay disabled/busy during held requests; cold pending keeps its existing loading precedence. |
| **F9 accepted/resolved** | PDF import stores a UUID-only importId in URL, then revalidates existing staff/owner-authorized status/drafts endpoints. Reload makes no new upload/job. Invalid IDs make no job request. Account/token query scope, AbortSignal and on-mount checks protect identity. Same-account review composition preserves local corrections through transient503/token revalidation; current successful queries alone authorize media/writes.401/403/404/410 suppress cached private content; denied draft requests retain visible failure/retry rather than silently blanking the screen. Non-staff routes request no job/evidence. Denied jobs can return explicitly to PDF selection. No fabricated expiry/history or permissions bypass. |

The unchanged server contracts were traced in AssessmentImportServiceImpl
(requireStaff/requireImport/requireOwnedImportForUpdate), PostSpecifications and
PostSearchRequest/DocumentSearchRequest. No Java/API/schema changes were needed.
CreationDialog, Recognition publication/review/private viewer policy, frozen exams,
auth/Turnstile, room continuity and Daily autosync/native dialog authority remain
with their existing owners. The prior seven-path Daily recovery remains pending.

### Actual proof and limits

- `rtk pnpm build`: TypeScript + production bundle pass on final runtime edits;
  existing large-chunk warning remains. `rtk pnpm lint`: exit0, existing fast-refresh
  and upload-dropzone dependency warnings, no new remedy warnings.
- `rtk proxy node --test --test-isolation=none tests/*.test.ts`:180pass,0fail,
  including five new pure status/filter/UUID/denial regressions. This working-tree
  suite also includes the separately pending accepted Daily tests; it does not
  stage or publish those repairs. Pure helper inputs are unchanged by subsequent
  layout/editor integration fixes.
- Owned actual-source Chromium driver:
  `apps/web/tests/admin-remedies-browser-check.mjs`, envDir:false Vite3137,
  synthetic intercepted API/assets only. `/tmp/admin-remedies-after-CefMjU/results.json`:
  **26completed checks,41screenshots,errors[]**. Six populated list families at
  320×568 light,390×844 dark,820×900 light and1440×900 dark; no page horizontal
  overflow. Users keyboard open/identity/Escape/focus, all three held-delete
  Escape/backdrop/failure/retry lifecycles, URL/debounce/pagination/Back/reset,
  Bank metadata, cached Recognition/Exam retries, import corrections/pending/
  save→approve/reload/identity/token/transient503/403/404/410/draft denial/session
  expiry/non-staff gates, and three question/exam editor metadata cases complete.
- A final Documents-only layout supplement records the paired mobile filter
  arrangement after that integrated run. Earlier
  `/tmp/admin-remedies-after-cwiROc/results.json` contains four Documents matrix
  shots plus three editor checks; its inherited matrix description incorrectly
  says six families, so count only its actual routes/screenshots. The driver label
  is corrected; exact supplemental result/path is in the candidate handoff.
- Development Vite output also reports the existing ManualQuestionWorkspace
  paragraph containing Badge's div (DOM-nesting warning). Its source is unchanged
  from base; browser `errors[]` tracks probe assertions/runtime exceptions, not a
  claim of zero console warnings. This separate markup cleanup remains outside
  the requested remedies.
- Prior unchanged modal/publication/private-viewer/room evidence is reused from
  the audit handoff. No all16-admin-screen/live backend authorization/persistence,
  physical device, screen-reader, live Cloudinary or deployment proof is claimed.
  No backend suite rerun (Java/contracts unchanged), new dependency or dedicated
  reduced-motion test. No live content/upload/publication/deletion/permission change.

Interrupted probe artifacts remain distinct from passes: R6MrGZ selected a shell
hidden label instead of card fallback; DOCHgx completed the matrix then exposed
Users focus return; b6OlL1 used an outdated SPA transition during lifecycle tests;
C8DkbY/0GlwAX/KebPka used cold-retry/asynchronous/reset or retained-alert selectors;
9FIp1z exposed missing independent draft-denial feedback. Their concrete issues or
fixtures were corrected, and CefMjU completed the integrated checks. They are not
counted as clean whole runs. Focused successful BJRXOh/xHpslF proofs remain recorded.

### Candidate, overlap and publication boundary

Exact accepted path/full-hash ledger and patch accounting:
`/tmp/admin-remedies-final-manifest-20261010.json`; incremental UI patch and
preserved status patch paths/hashes are listed there. **ACCEPT** the final scoped
runtime/docs/tests candidate after completed proof and source/import review for
normal commit/push. Technical acceptance does not claim deployment success.

Entry preservation: `/tmp/admin-remedies-entry-20261010.json`. The first396024bytes
of the working status document retain SHA256
`7259094169972b771355e67bc63f8ebe5710595c7531e335b44466ad3850c8cf`.
Only HEAD's status plus the authorized admin-audit/remedy suffix is staged;
whole dirty status is not staged. All eight independent file hashes (Daily code,
Daily tests/browser fixture, auth/deploy docs) remain unchanged. Root operator
.env stays ignored/untracked: no contents read, printed, copied, hashed or staged.
After commit verify exact committed blobs, empty index and preserved dirty work;
normal push to the inspected configured origin/main only, then report and stop.


## Mobile modal frame audit (8773df0)

10/10/2026; READ-ONLY runtime/source audit, documentation-only supplement. Actual
HEAD8773df072c58b0b52a33e5f6116fd70918320458; index empty at entry. Full owner/site
coverage, priorities and smallest remedies are in the [component reference](../../ui/owners/dialogs-and-media.md#mobile-modal-frame-audit-8773df0):43construction sites/34files, shared primitives plus Sheet/Select and native variants inspected.

### Disposition / concrete observations

ACCEPT the audit findings as follow-up inputs, **not runtime fixes or release
approval**. High priority: shared Dialog implicit grid intrinsic width clips long
identity/review content (288px frame →903/1783px scroll width); Recognition's long
filename download label expands shared evidence frame to668px and moves Close
off-screen; independently, a191-character achievement title makes the full sticky
evidence header286px high inside248px at320×280, completely covering a focused
zoom button. Keep only title/Close sticky and scroll full context; constrain/wrap
content/actions in their owners. Medium: native Daily group bottom actions36px
and outside-wheel background scroll163→226; nested image chooser scrolling54px
moves sole Close to y=-30. Purposeful room/native/Daily owners remain distinct.
These are evidenced defects/usability costs, not authority to change lifecycle,
private-media/business gates, pending dismissal or draft behavior.

### Evidence and bounds

- `/tmp/mobile-modal-audit-7Az1sC/results.json`: first three complete form/context/
  delete matrices (320×568 light,390×844 dark,320×280 dark), plus partial844×390.
 42screenshots and7recorded checks; run stopped on a hidden responsive Users
  trigger selected by the probe. Valid earlier screenshots remain observations;
  this is **not a clean whole run**. `/tmp/mobile-modal-audit-X19GUC/results.json`
  completes844×390 light/667×320 dark matrices (24screenshots,4checks), then stops
  on an incorrect rich-editor title selector. No product timeout inferred.
- `/tmp/mobile-modal-audit-eVzQgB/results.json`: completed nested image/link,
  protected evidence/zoom/focus and populated reader-edit probes (11screenshots,
 3checks); tail interrupted by incomplete synthetic News DTO. Exclude its failed
  reader-tail readiness from proof. `/tmp/mobile-modal-audit-50MS77/results.json`
  completes the corrected actual News lightbox/native Daily group tail
  (4screenshots,2checks,errors[]); no live server was contacted.
- `/tmp/mobile-modal-owner-audit-uy09OK/results.json`: actual crop/native-music/
  track/rhythm owners plus assembled Daily reflection composition;40screenshots,
 20checks,errors[],320/390 portrait,320short/844landscape,representative light/dark.
  Persistent player sentinel stays the same DOM node; this is not YouTube playback
  or Daily serialized-sync proof.
- `/tmp/mobile-modal-owner-audit-9dKC6E/results.json`: viewer long record-title
  stress with short download label isolates sticky-header height from filename
  overflow (12screenshots,4checks,errors[]). `/tmp/mobile-modal-owner-audit-nZrL5x/results.json`
  explicitly focuses enabled “Phóng to” at320×280 (3screenshots,1check,errors[]):
  focused rect y143.64–187.64 is fully covered by header ending y247.64.
- `/tmp/mobile-modal-owner-audit-FufTcr/results.json`: focused resize/draft retained,
  reflection last-field/retry focus, crop14Tab trap and Radix/native-room outside
  wheel lock (5screenshots,4checks,errors[]). A390×844→390×280 resize leaves focused
  room input at y454–498 until Tab reveals the next control; only emulation,
  not a physical keyboard/browser verdict.
- `/tmp/mobile-modal-audit-5o4W6b/results.json`: native Daily outside wheel scroll
  observation (2screenshots,1check,errors[]),body overflow visible. Close/Input44px,
  Cancel/Create36px. This pending Daily source was inspected without alteration.

Earlier failed harness artifacts5maTAZ/ukdqtz (disabled-document-submit/validation
selectors),k9D7zP (virtual fixture resolver),A9oUSn (stale fixture module) andC6zvX4
(incomplete News DTO) remain excluded from passing evidence. External fonts/media
are blocked; expected fixture503s and navigation-aborted resources are recorded.
No exhaustive all-screen render/live authorization/persistence/real Turnstile,
physical Android/iOS IME,notch/browser chrome or screen-reader proof. Prior adequate
creation/publication/private-media/pending-delete evidence is reused explicitly,
not called fresh. No unrelated build/lint/test suite,CI/deploy monitoring,secret
reads,live mutations or runtime fixes. Development Query Devtools launcher can
appear in screenshots; do not diagnose it as a production modal action.

### Preservation / supplemental handoff

Entry `/tmp/mobile-modal-audit-entry-20261010.json` and docs entry
`/tmp/mobile-modal-docs-entry-20261010.json`. The complete425208-byte pre-audit
status prefix remains bit-identical with SHA256
`dfdaf779f2dd2805c6cf27f913cfbbd1f01f75e94ec4164bedf33de760f29936`;
all eight independent dirty Daily/auth/deploy file hashes are retained. Documentation
changes are only this audit/reference/authority clarification, without changing
prior candidate manifests. Exact new doc hashes, incremental entry-to-final patch,
source inventory/probe identities and final preservation result:
`/tmp/mobile-modal-audit-handoff-20261010.json`. Runtime and index remain unchanged;
no staging,commit,push/deploy. Owned synthetic Vite/Chromium are stopped after probes.


## Mobile modal repairs 20261010

Lead accepts all five local remedies on base8773df072c58b0b52a33e5f6116fd70918320458,
following the [historical modal audit](admin-and-modals-20261010.md#mobile-modal-frame-audit-8773df0).
Scoped commit and normal origin/main push are authorized; no post-push CI/deploy
monitoring. Pending Daily recovery and unrelated auth/deploy work remain excluded.
[Owner lookup](../../ui/owners/shared-controls.md#interaction-owner-lookup) and
[actual before/after results, rules and limits](../../ui/owners/dialogs-and-media.md#mobile-modal-repairs-10102026)
are the discoverable reference; this resolves the audit findings rather than
opening another tracker.

Dialog now shrinks/wraps complete contextual text; EvidenceViewer bounds its
controls, keeps only compact title/Close sticky and scrolls full privacy context;
Recognition download keeps full original filename accessible with concise visible
label; native Daily group has44px actions and restores its own prior body overflow
on close/unmount; nested POST image picker has guarded bottom Cancel. Existing
business/media/draft/pending policies stay with their owning features.

Clean final Chromium probe: `/tmp/mobile-modal-fixes-after-Vs667I/results.json`
(41 screenshots,10 check groups, no assertion/runtime exceptions), paired with
exact entry-source before `/tmp/mobile-modal-fixes-before-eKZfEx/results.json`.
Focused zoom center hit-test, narrow long identity/review text, native wheel lock
and close/focus/unmount restoration, nested upload pending/failure/retry and
retained parent draft are observed.320/390/short/landscape/light-dark plus tablet
and desktop are representative, not all-screen or live-backend proof. Controlled
viewport shrink is not physical IME/notch/screen-reader validation. Earlier failed
probe attempts remain recorded in the reference.31 focused Node tests, TypeScript,
Vite production build and lint passed; existing warnings/blocked synthetic traffic
are retained as limits. No whole-app repeat scan or live mutation.

Accounting: `/tmp/mobile-modal-fixes-entry-20261010/entry.json` preserves all entry
bytes. The task's GroupList scroll-lock hunks are incremental to the prior accepted
Daily recovery; entry reconstruction excludes them and reproduces that file's
original hash. Independent Daily/auth/deploy paths and this file's430720-byte entry
prefix remain identical. Complete paths/hashes, prior doc supplement identity,
patch/reconstruction proof and runtime cleanup are recorded in
`/tmp/mobile-modal-fixes-final-manifest-20261010.json`; old doc hashes are historical,
not falsely reused for these updated documents. Publication records scoped committed hashes separately in
`/tmp/mobile-modal-publication-20261010.json`. Original accepted candidate hashes
remain historical. The native44px CSS rule also guarantees minimum width, so
committed targets do not depend on the pending Daily Close class change.


Publication acceptance: Lead ACCEPT the scoped12-path result, excluding the prior
Daily GroupList error/Close-class hunks and the85-line Daily recovery status section.
Only the directly relevant historical modal audit and current remedy/index/design
updates accompany this task. Native minimum-width CSS makes44×44 targets independent
of the pending Close class. Probe whitespace and a scoped-mode fixture expectation
were corrected. Index-only TypeScript and the scoped native/nested Chromium probe
passed (`/tmp/mobile-modal-fixes-after-ex9eGh/results.json`,6screenshots/3checks,
errors[]); prior adequate build/lint/31regressions/41screenshots reused. No live
mutation. Scoped hashes, original accepted manifest, pending patch/reconstruction,
actual commit/push result and runtime cleanup belong to the supplemental
`/tmp/mobile-modal-publication-20261010.json`. No CI/deployment observation requested.


## Creation frame geometry and floating controls 20261010

Base1a3463d7df9fa55d7db3e0692ad44562cbff00c2. Previous12-path fixes were scoped
committed/pushed as1a3463d; origin/main was verified at that SHA before this repair.
No deployment monitoring: exact live bytes/phone browser version remain unknown.
Physical feedback reopened geometry despite earlier narrow-string development proof.

Root cause reproduced in the minified baseline bundle: the mobile translate reset
was lowered to transform:translate(0,0), leaving inherited Tailwind individual−50%
translations active. Both actual Post-create and Document-create routes measured
−160/−284 at320×568 and−195/−140 at390×280, animated and animation-disabled.
Body-portal/HTML/body ancestors had no transform/filter/contain containing block.
Development routes stayed correctly positioned; animations were not the cause.
Before artifacts: `/tmp/mobile-modal-fixes-after-ueNsrx/results.json` (baseline
production despite historical directory naming), and development comparison
`/tmp/mobile-modal-fixes-after-GykjqZ/results.json`. Private screenshot was viewed
read-only and never copied into fixtures, docs or artifacts.

CreationDialog now opts out of inherited centering translations and uses insets/
auto margins. Compact fixed title/Close, scrolling context/body, all safe-area
insets and narrow/short fullscreen frames keep controls reachable. Post metadata
precedes cover upload, mobile editor shares body scroll, heading trigger is44px;
Document gaps/actions fit narrow widths. PDF chooser is a native keyboard button,
separate clear is visible44px. Feature validation/upload/save/permission and
public-vs-draft contracts remain unchanged. Shared floating-controls.css owns
140/90ms presence,3px/.98 travel/scale and110ms color transitions through Select,
DropdownMenu/submenu and Popover/Combobox; competing account reveal is removed.
Radix placement/focus/typeahead/presence remains authoritative; item-aligned and
native Select stay static. No dependency or global modal framework.

Consolidated production probe: `/tmp/mobile-modal-fixes-after-UyXUAd/results.json`,
38 screenshots/20 passing groups, errors[].320×568 light,390×844 dark,320×280 dark,
390×280 light,667×320 light,768×1024 dark,1280×800 light. Captures first25 mount
frames plus settled/static rectangles, action/body overflow, background scroll,
focused mobile/tablet viewport shrink, dirty Close/Escape/continue/discard/return.
Actual Post/Document routes verify validation, nested picker pointer/focus, held
upload/save dismissal, failed/retried upload with URL versus asset-ID completion,
metadata retry and save failures retaining title/editor. Actual Select typeahead,
Combobox draft/filtering without animation replay, account menu keyboard/collision/
quick reopen cleanup pass. Nested submenu/item-aligned Select fixture passes at
320×280/390×844/1280×800: `/tmp/mobile-modal-fixes-after-MmfOJ7/results.json`
(3screenshots/3groups). The fixture imports actual shared owners; no live mutation.

TypeScript, env-safe production Vite build, Oxlint and all180 Node tests pass.
Build uses envDir:false and synthetic public constants, never operator env.
Existing chunk-size/esbuild optional-import/lint warnings remain. Full suite log:
`/tmp/modal-motion-all-tests-20261010.log`; build log:
`/tmp/modal-motion-build-20261010.log`. Prior failed probes remain separate:9cAGqV
passed mobile/tablet but failed artificial desktop focus shrink; pO7Kqm used a
wrong validation selector; w7MMac exposed competing account motion, now removed.
Nested fixture attempts nvEJt9/W5MmHT/P2LvOg recorded trigger/focus timing and
artificial full-width-anchor geometry before correcting the fixture; they are
not passing evidence. Final consolidated/fixture results above supersede them.

Limits: representative synthetic Chromium, not physical-phone IME/iOS/notch/pinch
zoom, screen-reader, all-screen/backend or deployment proof. Layout-viewport
resize is controllable; visual-only keyboard shrink is not established. No live
posts/uploads/publication/admin changes, external settings or dedicated reduced-
motion validation. Existing OS reduced-motion handling is retained in source.

Lead ACCEPT the coherent19-path repair for scoped commit/normal origin/main push,
after exact index-only compilation and preservation checks.
Index-only TypeScript/Vite build passed; focused minified probe
`/tmp/mobile-modal-fixes-after-EdY15U/results.json` has4screenshots/errors[] and
in-bounds open/settled/static Post/Document frames at320×568 and390×280. Final
Oxlint passes with pre-existing warnings and one export-only warning in the new
synthetic submenu fixture (no runtime error).
[Owner lookup](../../ui/owners/shared-controls.md#interaction-owner-lookup) and
[design rules](../../ui/history/features-and-modal.md#creation-frame-geometry-and-floating-controls-10102026)
are updated in place. `/tmp/creation-frame-motion-final-manifest-20261010.json`
records base, complete scoped hashes/patch and evidence;
`/tmp/creation-frame-motion-publication-20261010.json` records staged/committed
hashes and push. Entry pending patch/status prefix is preserved byte-for-byte;
the85-line Daily status insertion is excluded from index alongside five tracked
Daily files/untracked browser check and unrelated auth/deploy docs. Operator.env
is ignored/untracked/excluded. Owned local runtimes close before completion.
No post-push pipeline/deploy follow-up.
