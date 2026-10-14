# Historical component adoption and discovery evidence

> Preserved checkpoint record: `7a70002` (14/10/2026). Dated claims, counts, pending/publication states and temporary evidence paths below describe their original checkpoints; they are not current release or live-proof claims.

## Three-cluster consolidation (working candidate, 09/10/2026)

The three-cluster implementation is included in the completed reuse consolidation
on the UI base above. The original13-cluster inventory is historical; equivalent
residual owners are now implemented below.
The [post-consolidation residual sweep](reuse-audit-20261009-10.md#post-consolidation-residual-sweep)
independently checks all42 page entries and375 source files, confirms these owners
have no equivalent shadow copies, and adds/corrects remaining findings. The seven-path
Daily recovery remains a separate pending candidate. Its editor/group/status/test
fixes remain pending separately. Reflection extraction overlaps the day editor:
only its import/composition is committed; recovery hunks stay in the working tree.
Plan/evidence timestamp changes belong to reuse scope. Historical manifests retain historical hashes.

| Owner / API | Verified direct consumers | Behavior and intentional boundary |
| --- | --- | --- |
| [validatePostImage](../../../apps/web/src/features/post/lib/post-image-validation.ts): `Pick<File, "type" \| "size">` → `"type" \| "size" \| null` | [PostImageUpload](../../../apps/web/src/features/post/components/post-image-upload.tsx#L26), [ImageInsertDialog in RichTextEditor](../../../apps/web/src/components/ui/rich-text-editor.tsx#L63): **2 files** | Existing `image/*` MIME family, inclusive 5MiB limit, type-error precedence. This is client feedback, not byte/security validation. Both use native [Button](../../../apps/web/src/components/ui/button.tsx) activation and the existing [storageService](../../../apps/web/src/features/documents/services/storage.service.ts), folder POST. Clear input after capturing File so same-file validation/failure retry works; per-picker in-flight guard plus disabled/busy state prevent duplicate requests. Thumbnail completes with asset ID/preview/removal; editor inserts URL/closes its existing Dialog and preserves text. URL insertion stays separate. No upload framework, private-media policy or new whitelist. |
| [explicitInstant](../../../apps/web/src/features/daily/lib/explicit-instant.ts#L6): `unknown` → `string \| null` | [daily-contract](../../../apps/web/src/features/daily/lib/daily-contract.ts#L97), [evidence-contract](../../../apps/web/src/features/daily/evidence/evidence-contract.ts#L125): **2 files**, **3 call sites** | One original regex/parser beside platform-calendar; genuine civil date, explicit zone, bounded time and Date.parse validity. Preserve spelling/fraction/offset acceptance and nullable plan adapter. Full DTO identity/kind/shape rules remain separate. No auto-sync/private query/editor changes. |
| [RetryFeedback](../../../apps/web/src/components/ui/retry-feedback.tsx#L4): `{ message: string; actions: ReactNode }` | [DocumentsManagementPage](../../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L149), [PostManagementFeature](../../../apps/web/src/features/post/components/post-management-feature.tsx#L174), [QuestionBankPage](../../../apps/web/src/pages/question-bank-page.tsx#L156): **3 files / 3 sites**, all routed | Exact compact alert, border/padding/centered text; actions are caller-owned. Existing Button type=button, isFetching disablement and refetch callbacks stay in each feature. Initial retry without cached data returns to loading; cached-error retry retains disabled alert. No query engine, illustrated ListFeedback replacement, generic loading or permission wrapper. |

Thumbnail preview Change/Remove are keyboard-visible through focus-within,
visible below640px, and44px targets; Remove has an accessible name. Existing
Dialog/its DialogTrigger own editor modal focus/scroll/Escape/return; the image
trigger is now connected to Radix rather than leaving a controlled modal without
a trigger. No new manual key handlers or body-scroll lifecycle.
For a compact management retry use:

```tsx
<RetryFeedback message="Không thể tải danh sách tài liệu." actions={
  <Button type="button" variant="outline" disabled={isFetching}
    onClick={() => void refetch()}>Thử lại</Button>
} />
```

[Regressions](../../../apps/web/tests/ui-three-cluster.test.ts) exercise MIME/size
boundaries and both timestamp DTO consumers. [Owned browser probe](../../../apps/web/tests/ui-three-cluster-browser-check.mjs)
mounts both pickers and all three real management consumers at1440/768/320px with
intercepted synthetic API/storage and light/dark presentation. It verifies native
Enter/Space chooser activation, invalid-file request prevention, failure/retry,
pending gates, distinct completion, editor draft/modal focus and query precedence.
Evidence and limits are in the [existing status](../../reviews/ux-flow-audit.md).
No live backend/storage or exhaustive all-screen claim follows from these fixtures.


## Mobile and Recognition evidence owners (09/10/2026)

| Owner / source | API and actual adoption | Important boundary / variant |
| --- | --- | --- |
| [EvidencePreviews / EvidenceViewer](../../../apps/web/src/components/ui/evidence-gallery.tsx), [CSS](../../../apps/web/src/components/ui/evidence-gallery.css) | Two consumer files: [Daily EvidencePanel](../../../apps/web/src/features/daily/evidence/evidence-panel.tsx) and [AchievementEvidence](../../../apps/web/src/features/recognition/achievement-evidence.tsx). Items carry id/name/image/detail; feature renderImage/renderActions supply authorized media and operations. Previews calls onOpen(item,button); controlled Viewer takes open/selectedId/onSelect, feature feedback, description and close-focus callback. | Shared composed presentation, not shared Daily business logic. Two images/+N, bounded file previews, all-items index, prev/next, native Button/installed Dialog, sticky 44px Close, scrollable short viewport and 2× zoom with keyboard-scrollable image region. Feature gates must remove stale bytes on access revalidation. |
| [raster-image](../../../apps/web/src/lib/raster-image.ts) | rasterImageType(bytes) validates bounded PNG/JPEG/WebP/GIF headers; isRasterImageType(type) is only classification, not permission or byte validation. Daily's evidence-preview remains a compatibility re-export; Recognition consumes the same byte owner. | Never display arbitrary HTML/SVG from filename or MIME alone. Existing storage endpoints and file rules remain feature-owned. |
| [AchievementEvidence](../../../apps/web/src/features/recognition/achievement-evidence.tsx) → [AchievementRecord](../../../apps/web/src/features/recognition/private-pages.tsx) | Private history `/profile/achievements` and admin `/admin/recognition?tab=reviews` use the same adapter. Lazy visible previews; viewer fetches selected bytes, optional download and explicit image retry. Record/version/attachment/session keys isolate lifecycle; metadata revalidation and owner/admin identity gate mounting. | Public profiles/milestones never use it, even for public achievements. API reauthorizes each evidence request; no signed/public URL added. Abort/revoke on unmount. Close returns to thumbnail or record heading if revalidation removed it. Approval/rejection remain separate explicit operations. |
| [HonorEditor](../../../apps/web/src/features/recognition/honor-editor.tsx) | Existing native status Select and save contract. Admin list Công bố album passes publishIntent; editor still requires explicit Lưu và công bố. New create defaults Draft; inline validation/server/conflict feedback retains saved draft and input. | Existing upload-before-publication sequence, expectedVersion, participant validation and admin APIs remain. No forced photo requirement or automatic publish. |
| [LoginForm](../../../apps/web/src/features/auth/components/login-form.tsx), [auth CSS](../../../apps/web/src/layouts/welcome-layout.css) | Password field/error followed by recovery link at ≤900px; 26px normal account→password gap instead of 70px. Desktop remains 26px with above-field link; other auth screens retain their owners. | 52px fields, 44px mobile recovery/reveal, validation/focus/drafts and Turnstile/login contracts unchanged. |
| [MobileNavbar](../../../apps/web/src/layouts/components/mobile-navbar.tsx), [CSS](../../../apps/web/src/layouts/components/mobile-navbar.css) | One composed owner, two direct consumers: [PublicHeader](../../../apps/web/src/layouts/components/public-header.tsx) and [DashboardLayout](../../../apps/web/src/layouts/dashboard-layout.tsx), only below768px. `account: ReactNode` supplies existing UserDropdown or anonymous login Link; caller supplies enclosing controlled Sheet/drawer. Logo → ThemeToggle → account/login → labelled Menu;64px row,44px targets,8px gaps. | Public/outside design is the reference. Logo-only mobile; Menu remains visibly labelled with accessible name and Radix expanded/controls semantics. Workspace page-context text sits below the sticky row; desktop/tablet shell differences remain. One CSS owner supplies mobile row spacing/divider/focus; anonymous narrow CTA padding stays with PublicHeader. No auth-layout or room/session ownership moved. |
| [NavigationDrawer](../../../apps/web/src/layouts/components/navigation-drawer.tsx), [navigation CSS](../../../apps/web/src/layouts/navigation.css) | Public/workspace use the same role-filtered drawer; mobile theme switch unmounted. Caller owns controlled open state, destinations and footer. Workspace returns focus to the actual trigger or new breakpoint entry. | Retain role-filtered destinations, Sheet focus, theme persistence and tablet/desktop display settings. Drawer titles/page titles are not brand labels. |

Rendered evidence uses synthetic data on actual local routes at 320×568,390×900,
768×900 and1440×900, plus375px reviewer checks. This does not assert all-screen,
live authorization, Cloudflare verification or physical-mobile validation.

Narrow anonymous public navigation also keeps the logo from shrinking into the
theme target: at <360px only horizontal navbar/button padding is compacted,
retaining44px height,8px target separation and complete login/Menu labels.

The focused shell probe is [mobile-navbar-browser-check.mjs](../../../apps/web/tests/mobile-navbar-browser-check.mjs):
`NAVBAR_WEB_URL=http://127.0.0.1:3126 node tests/mobile-navbar-browser-check.mjs`
from `apps/web`, with a separately owned Vite server. It intercepts synthetic API
and blocks external traffic. `NAVBAR_BASELINE=1` records before behavior;
`NAVBAR_EXTRA_ONLY=1` isolates breakpoint/account/theme checks;
`NAVBAR_ROOM_ONLY=1` isolates synthetic joined-room/player continuity. Evidence
covers public anonymous/account and workspace mobile320/390 light/dark, short320,
tablet/desktop and role destinations; it does not establish real auth, streaming,
backend, physical-device or AT speech behavior. See the existing status for exact
accepted snapshot, screenshots, failed-driver evidence and preservation accounting.


## Visual and creation coverage (10/10/2026)

Current local candidate on `f7db010`; source coverage below supersedes the older
flat-list presentation descriptions. All42 page entries were reconciled with
[routes.tsx](../../../apps/web/src/router/routes.tsx) and actual feature imports.
This is a source ledger, **not42 rendered passes**. No query/authorization engine
or general editor framework was introduced.

| Shared owner | Actual contract / adoption |
| --- | --- |
| [Card](../../../apps/web/src/components/ui/card.tsx), [PageSection](../../../apps/web/src/components/ui/page-section.tsx), [page-layout.css](../../../apps/web/src/components/ui/page-layout.css) | Panel edge/depth; muted/divided headings; mobile16px/desktop24px panel padding. `content-card` is CSS reuse on semantic records, `filter-panel` a standalone search band. Nested toolbars remain flat. |
| [CreationDialog](../../../apps/web/src/components/ui/creation-dialog.tsx) + [CSS](../../../apps/web/src/components/ui/creation-dialog.css) | `open/onOpenChange`, `title/description`, form-owned `dirty/busy`, `children(close)`. Optional compact `className`; ordered `returnFocusSelector` fallbacks for routed creation, bounded5s lazy-mount focus observation.12 frames in11 actual consumer files (admin Recognition owns two). Explicit success bypasses discard; failed validation/save/upload retains mounted form state. |
| [Dialog](../../../apps/web/src/components/ui/dialog.tsx) | Existing installed Radix modal mechanics; shared default44px Close and reserved title space. Daily custom/native owners are separate. |
| [HonorsPage](../../../apps/web/src/features/recognition/public-pages.tsx) + [recognition.css](../../../apps/web/src/features/recognition/recognition.css) | Cohesive editorial media card; year/search toolbar, metadata/participants/album link. Public/private media adapters and scoring remain separate. |
| [RichTextEditor](../../../apps/web/src/components/ui/rich-text-editor.tsx) → [PostForm](../../../apps/web/src/features/post/components/post-form.tsx) | Existing nested image dialog; optional upload-busy callback, guarded in-flight dismissal; native44px toolbar controls. Asset-ID thumbnail and URL-content completion remain distinct. No new upload framework. |

```tsx
<CreationDialog open={creating} onOpenChange={setCreating}
  title="Tạo nội dung" description="Lưu bản nháp trước khi công bố."
  dirty={formState.dirty} busy={formState.busy}>
  {close => <ExistingForm onStateChange={setFormState}
    onCancel={close} onDone={() => setCreating(false)} />}
</CreationDialog>
```

Form callbacks own actual contracts; do not copy this example's labels/policy
where the feature already differs. Modal presentation never grants publication,
visibility, upload access or bypasses a failed metadata revalidation.

### Page-family adoption ledger

Each of the42 source page entries is linked below. `Inherited` means an actual
shared owner changes its rendered composition; `local` identifies a changed
responsible feature. Exceptions are intentional, not unreviewed route gaps.

| Page entry / family | Actual visual owner and creation outcome |
| --- | --- |
| [about-page.tsx](../../../apps/web/src/pages/about-page.tsx) | Inherited PageSection panel/heading; no create entry. |
| [achievement-profile-page.tsx](../../../apps/web/src/pages/achievement-profile-page.tsx) | Public Recognition: inherited sections and year-grouped milestones with muted bands/divided chronology; public filtering retained, no private-evidence mounting or create entry. |
| [admin/recognition-page.tsx](../../../apps/web/src/pages/admin/recognition-page.tsx) | Local Recognition card records/filter band; Honor create/edit/explicit publish and admin achievement submission use CreationDialog. |
| [admin/users/admin-users-page.tsx](../../../apps/web/src/pages/admin/users/admin-users-page.tsx) | Local filter-panel + inherited page-table; account operations/permissions retained; no user-create control. |
| [assessment-import-page.tsx](../../../apps/web/src/pages/assessment-import-page.tsx) | Inherited panels; PDF import action opens compact CreationDialog. Job polling/review/publish remain on page after upload. |
| [auth/forgot-password-page.tsx](../../../apps/web/src/pages/auth/forgot-password-page.tsx) | Intentional auth/floating-field shell; recovery is not content creation. |
| [auth/login-page.tsx](../../../apps/web/src/pages/auth/login-page.tsx) | Intentional auth shell; working password/Turnstile/OAuth unchanged. Create-account link navigates to register page. |
| [auth/register-page.tsx](../../../apps/web/src/pages/auth/register-page.tsx) | Direct RegisterForm inside AuthCardLayout / WelcomeLayout; single shrinkable grid track, wrapping resume action and 44px password controls; challenge persistence and Turnstile unchanged. |
| [auth/reset-password-page.tsx](../../../apps/web/src/pages/auth/reset-password-page.tsx) | Intentional auth shell; reset semantics untouched. |
| [auth/verify-email-page.tsx](../../../apps/web/src/pages/auth/verify-email-page.tsx) | Intentional verification shell; no new creation/policy. |
| [competitions-page.tsx](../../../apps/web/src/pages/competitions-page.tsx) | Local guidance surface + existing header/actions; no invented live registration feature. |
| [daily-groups-page.tsx](../../../apps/web/src/pages/daily-groups-page.tsx) | Intentional notebook/group workspace; existing native Create and installed/custom task dialogs retained, pending recovery untouched. |
| [daily-owner-page.tsx](../../../apps/web/src/pages/daily-owner-page.tsx) | Intentional flat notebook; existing task/evidence/reflection dialogs, serialized sync/guards unchanged. |
| [daily-shared-review-page.tsx](../../../apps/web/src/pages/daily-shared-review-page.tsx) | Intentional read-only notebook/private revalidation; section shadow/header-fill opt-out; feedback owner retained. |
| [daily-week-page.tsx](../../../apps/web/src/pages/daily-week-page.tsx) | Intentional weekly calendar/reflection/workspace; no forced card/grid or new creation flow. |
| [dashboard/categories/admin-categories-page.tsx](../../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx) | Inherited table surface; scrollable Radix tabs keep44px triggers/color-only transitions; SystemCategoryFormModal uses compact CreationDialog for category/subject/tag; floating fields retained. |
| [dashboard/documents/documents-management-page.tsx](../../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx) | Local standalone filter-panel + inherited ManagementListRow; DocumentForm uses spacious CreationDialog and file/metadata/save gates. |
| [dashboard/posts/post-management-page.tsx](../../../apps/web/src/pages/dashboard/posts/post-management-page.tsx) | Local filter-panel + inherited rows/Card; PostForm uses spacious CreationDialog with nested editor choosers/busy propagation. |
| [dashboard-page.tsx](../../../apps/web/src/pages/dashboard-page.tsx) | Inherited section header/surface and local shared shortcut tiles; links to feature creation flows, no new mutation. |
| [document-detail-page.tsx](../../../apps/web/src/pages/document-detail-page.tsx) | Local metadata/preview/description content-card; shared feature-owned reader/skeleton viewport scales to short phones; complete edit/download labels stack on mobile. Reading/download/identity/iframe contract retained; not a creation dialog. |
| [documents-page.tsx](../../../apps/web/src/pages/documents-page.tsx) | Search-first filter panel with visible labels/active removals; DocumentCard/ListItem now group subject/kind/tags/title/description with shared DocumentThumbnail and explicit open. Two tablet/three desktop columns; error-count precedence and aria-pressed view state. Existing URL/query/pagination/download contracts retained. |
| [exam-drafts-page.tsx](../../../apps/web/src/pages/exam-drafts-page.tsx) | Feature-local ExamListItem shares title/version/points/release grouping across draft/paper lists with content-card tokens; Tạo đề opens addressable new-editor modal. |
| [exam-editor-page.tsx](../../../apps/web/src/pages/exam-editor-page.tsx) | New-only spacious CreationDialog; existing edit route/PageSection remains. Save handoff/version/publish eligibility retained. |
| [exam-paper-page.tsx](../../../apps/web/src/pages/exam-paper-page.tsx) | Purposeful frozen-paper reader; release/solution/figure gates unchanged, no per-question decorative nesting. |
| [exam-papers-page.tsx](../../../apps/web/src/pages/exam-papers-page.tsx) | Feature-local ExamListItem shares title/version/points/release grouping with drafts; native44px title links/return paths retained; no creation entry. |
| [exam-preview-page.tsx](../../../apps/web/src/pages/exam-preview-page.tsx) | Purposeful staff preview, shared header/buttons; no new creation policy. |
| [history-page.tsx](../../../apps/web/src/pages/history-page.tsx) | Local guidance surface; feature-availability explanation and real destinations retained. |
| [home-page.tsx](../../../apps/web/src/pages/home-page.tsx) | Local Home news card edge/depth; cinematic hero/notebook purpose remains. Registration link uses routed modal. |
| [honor-detail-page.tsx](../../../apps/web/src/pages/honor-detail-page.tsx) | Inherited sections + responsive existing gallery/reader; public photo query/viewer unchanged. |
| [honors-page.tsx](../../../apps/web/src/pages/honors-page.tsx) | Local bounded16:10 cards with contiguous metadata/participant/album action and compact mobile year/search rows. |
| [my-achievements-page.tsx](../../../apps/web/src/pages/my-achievements-page.tsx) | Local grouped records + inherited panels; Thêm/Bổ sung open CreationDialog; protected evidence/view/download unchanged. |
| [news-detail-page.tsx](../../../apps/web/src/pages/news-detail-page.tsx) | Purposeful article/author/reading layout; existing lightbox retained, not wrapped wholesale into cards. |
| [news-page.tsx](../../../apps/web/src/pages/news-page.tsx) | Local editorial card edge/depth, filter-panel search and occupied responsive pinned columns; pinned/feed membership, retries and URL submission unchanged. |
| [not-found-page.tsx](../../../apps/web/src/pages/not-found-page.tsx) | Intentional welcome/fallback identity; no forced shell/card. |
| [practice-page.tsx](../../../apps/web/src/pages/practice-page.tsx) | Local guidance surface; no fake practice/create feature. |
| [profile-page.tsx](../../../apps/web/src/pages/profile-page.tsx) | Inherited PageSection/Card surfaces; identity uses surface tokens and existing compact two-column composition at≤1099px; avatar/security editor/chooser and private revalidation remain task-specific. |
| [question-bank-page.tsx](../../../apps/web/src/pages/question-bank-page.tsx) | Local filter-panel + CardHeader metadata/status, CardContent question body and CardFooter wrapping actions; actual permissions/pending callbacks preserved; create link opens addressable new-editor modal. |
| [question-detail-page.tsx](../../../apps/web/src/pages/question-detail-page.tsx) | New-only spacious CreationDialog; manual create context/actions avoid duplicate page heading. Existing read/edit/schema/figures/handoff stay domain-owned. |
| [rankings-page.tsx](../../../apps/web/src/pages/rankings-page.tsx) | Local filter-panel; RankingList owns one content-card/context band/divided ordered comparison rows and44px identity links; inherited profile panels; no editorial/scored-policy merge. |
| [study-room-page.tsx](../../../apps/web/src/pages/study-room-page.tsx) | Intentional persistent room/scene/player; session lifecycle/settings/track dialogs unchanged; no frame remount for appearance. |
| [subjects-page.tsx](../../../apps/web/src/pages/subjects-page.tsx) | Local catalogue edge/depth, muted compact toolbar and purposeful two-column directory; no invented subject-create permission. |
| [toolkit-page.tsx](../../../apps/web/src/pages/toolkit-page.tsx) | Local GPA workspace/result surfaces, divided compact editable rows and compact Add-course modal using actual calculateGpa rules. Room creation now spacious CreationDialog; persistent room navigation/access unchanged. |

### Creation entry coverage and boundaries

| Entry / smallest actual owner | Modal and retained semantics |
| --- | --- |
| Admin Honors / [HonorEditor](../../../apps/web/src/features/recognition/honor-editor.tsx) | CreationDialog: draft default, explicit publish, expectedVersion, eligibility and upload-before-publication; failures retain draft/files. Child participants/photos stay within editor. |
| Personal/admin achievements / [AchievementEditor](../../../apps/web/src/features/recognition/achievement-editor.tsx) | CreationDialog in private/admin page owners; explicit submit/re-submit, authorized identity and bounded evidence, pending/error gates. |
| Documents / [DocumentForm](../../../apps/web/src/features/documents/components/document-form.tsx) | CreationDialog; RHF dirty state includes dropdowns and file/error state, upload busy, feature-owned metadata/save/retry. |
| Posts / [PostForm](../../../apps/web/src/features/post/components/post-form.tsx) | CreationDialog; explicit draft/publish behavior unchanged, nested Tiptap image/link dialogs, in-flight uploads block parent close. |
| Categories/subjects/tags / [SystemCategoryFormModal](../../../apps/web/src/features/system-categories/components/system-category-form-modal.tsx) | Compact CreationDialog; existing code/name generation/validation and pending/failure drafts. |
| Questions / [QuestionDetailPage](../../../apps/web/src/pages/question-detail-page.tsx), [ManualQuestionWorkspace](../../../apps/web/src/features/questions/components/manual-question-form.tsx) | `/r/questions/new` remains deep-linkable but opens CreationDialog; explicit dirty close, saved-ID handoff preserved. Option/part/scientific-block Add stays within parent editor. Duplicate existing question remains a distinct explicit server operation. |
| Exams / [ExamEditorPage](../../../apps/web/src/pages/exam-editor-page.tsx) | `/r/exams/new` opens CreationDialog; version/save/publish/frozen gates unchanged. Adding published question placements stays in this editor. |
| PDF import / [AssessmentImportPage](../../../apps/web/src/pages/assessment-import-page.tsx) | Compact CreationDialog; selected-file validation/failure retention, pending dismissal blocked; ongoing analysis/review remains on page. |
| Study-room create / [StudyRoomsLobby](../../../apps/web/src/features/study-room/components/study-rooms-lobby.tsx) | CreationDialog instead of inline form; native constraints/policy/access, failure retention, pending close, success enters room. Track request is already its own installed Dialog; player is not remounted. |
| GPA Add / [GpaCalculator](../../../apps/web/src/features/toolkit/components/gpa-calculator.tsx) | Compact CreationDialog; credits/grade use existing calculation rules before explicit insertion. Existing partially edited rows/storage/results remain editable. |
| Account creation / [RegisterPage](../../../apps/web/src/pages/auth/register-page.tsx) | Direct card-based registration inside AuthCardLayout; register/verification/resume form owners, secure session, action/token reset and resumable challenge retained. No OTP sent by probes. |
| Daily task/evidence/reflection/group creation | Already-modal [DailyDialogHeader](../../../apps/web/src/features/daily/ui/daily-dialog-header.tsx) / installed/native feature owners retained. Native group dialog includes separately pending recovery. Serialized autosync, dirty/navigation/Submit and sharing/private gates stay with Daily; no replacement based only on markup similarity. |
| Native file choices, form-row/options/parts/placements, ownership transfer, feedback | Subordinate editing/permission workflows, not independent entity-create destinations. Keep current parent/chooser or existing modal and business invariants. |
| Legacy unrouted PostManagement/PostEditor | Not an active entry point in routes.tsx; retained source excluded from mounted creation counts. No misleading claim that legacy imports are routed adoption. |

The owned [visual/modal browser probe](../../../apps/web/tests/visual-layout-browser-check.mjs)
uses synthetic intercepted data and locally generated imagery only. Baseline is a
frozen `f7db010` web tree plus the four pending Daily runtime files, never an env
copy. `VISUAL_WEB_URL` selects an owned Vite with env loading disabled;
`VISUAL_BASELINE=1` records before, `VISUAL_CREATION_ONLY=1` narrows lifecycle checks.
Representative dimensions are320×568,390×844,820×900,1440×900 and320×360 across
light/dark. Actual evidence/results and candidate boundary accounting belong in
the [existing status](../../reviews/ux-flow-audit.md), not an all-screen rendered claim.

### Responsible local compositions beyond Honors

These are actual owners, not new universal components. Their links complement the
42-page ledger above; source inspection is distinct from representative rendering.

| Owner | Purpose / retained contract |
| --- | --- |
| [public-news-feature.css](../../../apps/web/src/features/post/components/public-news-feature.css) | Task-first discovery band, compact editorial rows and `auto-fit/minmax` occupied pinned columns;64px phone media remains beside titles. Queries and membership are owned by PublicNewsFeature. |
| [document-reader.css](../../../apps/web/src/features/documents/components/document-reader.css) → [DocumentDetailPage](../../../apps/web/src/pages/document-detail-page.tsx) | One viewport owner for loaded/skeleton reader, short-phone dimensions; native iframe/fallback and feature downloads untouched. Mobile header actions stack rather than clip labels. |
| [RankingList](../../../apps/web/src/features/recognition/ranking-presentation.tsx) + [CSS](../../../apps/web/src/features/recognition/ranking-presentation.css) | Existing ordered rows share one `content-card` surface/context band. Domain presentation model still owns rank/points/links;44px native profile activation. |
| [PublicAchievementMilestones](../../../apps/web/src/features/recognition/achievement-presentation.tsx) + [CSS](../../../apps/web/src/features/recognition/achievement-presentation.css) | Bounded year groups/divided records inside existing PageSection, no nested elevated cards or private-media adapter. Public projection/filter model remains owner. |
| [profile.css](../../../apps/web/src/features/user/components/profile.css) | Existing identity compact grid extended to stacked tablet layout, standalone surface tokens; actual form/avatar/account owners keep draft/focus/access authority. |
| [toolkit.css](../../../apps/web/src/features/toolkit/components/toolkit.css) | GPA row dividers/compact spacing, existing result hierarchy. Room discovery/player remain purposeful flat/persistent surfaces. |
| [AdminCategoriesPage](../../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx) | Installed Radix Tabs and horizontal internal scroll retained;44px triggers. Modal/data-table/metadata feedback remain existing owners. |
| [ExamListItem](../../../apps/web/src/features/exams/components/exam-read.tsx) | One feature-local draft/paper list composition; bounded native title Link with a shrinkable text child, version/points badges and separate release/timezone line. Frozen reader bodies/gates remain separate. |
| [QuestionBankPage](../../../apps/web/src/pages/question-bank-page.tsx) | Existing CardHeader/Content/Footer now separate metadata/status, question summary and wrapping44px actions. Search submission, URL filters, duplicate/archive/restore permissions and callbacks retain their original owners. |

`VISUAL_BROAD=1` on the existing browser probe exercises nonempty fixtures for these
families plus assessment lists across320/390/820/1440 and320×360, light/dark. Its
follow-up before tree is the frozen accepted56-path candidate, separate from the
original HEAD-based comparisons. No env files are copied. Exact completed checks,
interrupted runs and omissions are recorded in the existing status, not inferred
from this source ledger.


### Document discovery preview storage cases (10/10/2026)

| Owner / actual use sites | API / boundary |
| --- | --- |
| [DocumentThumbnail](../../../apps/web/src/features/documents/components/document-thumbnail.tsx), [discovery CSS](../../../apps/web/src/features/documents/components/document-discovery.css) | `src?: string|null`, `compact?: boolean`. Three consumer files/three sites: [DocumentCard](../../../apps/web/src/features/documents/components/document-card.tsx), [DocumentListItem](../../../apps/web/src/features/documents/components/document-list-item.tsx), [DashboardDocumentList](../../../apps/web/src/features/documents/components/dashboard-document-list.tsx). Inner state resets when src changes; lazy image load/error, fixed frame/whole-page containment and readable fallback. No general media framework, original fetch or client URL transformation. |
| [DocumentFilters](../../../apps/web/src/features/documents/components/document-filters.tsx) | Existing SearchInput + Combobox owners; visible labels/selected chips, Enter/Tìm trim, selectors reset page only, reset preserves view/unrelated params. Subject and existing tags support subject/topic discovery; kind/context distinguishes similarly named records. |
| [DocumentServiceImpl.enrich](../../../apps/api/src/main/java/me/nghlong3004/olympic/document/service/impl/DocumentServiceImpl.java) → [CloudinaryStorageService.getThumbnailUri](../../../apps/api/src/main/java/me/nghlong3004/olympic/storage/service/impl/CloudinaryStorageService.java) | Existing optional thumbnailUrl DTO field, no new schema. Only Cloudinary + DOCUMENT + application/pdf requests preview resolution. Only existing generated `documents/UUID.pdf` keys yield an unsigned HTTPS `image/upload`, pg1, c_limit600×800, JPG candidate; all other keys yield null. Original download/access APIs remain unchanged. |

Official Cloudinary guidance verified10/10/2026:
[PDF delivery](https://cloudinary.com/documentation/ts_how_to_upload_manage_and_deliver_pdf_files),
[upload/resource types](https://cloudinary.com/documentation/upload_parameters),
[media access](https://cloudinary.com/documentation/control_access_to_media).
Image-resource PDFs support page-to-image delivery; raw PDFs do not transform.
Private derived-image delivery can have different visibility from the original:
never convert a private URL just to obtain a thumbnail. Account PDF delivery blocks
and strict transformation rules are possible; neither setting was inspected/changed.

Actual repository uploader uses resource_type:auto, random folder/UUID public_id,
overwrite:false, no explicit private/authenticated type or access_control override.
It retains public_id plus format as storageKey but discards returned resource_type /
type/access metadata. Therefore eligible legacy keys are **candidates, not verified
public image assets**. The thumbnail owner addresses only the existing unsigned
public image/upload namespace; it never retries a private/raw/authenticated namespace,
signs delivery or requests originals/asset metadata. No account API call or backfill
is hidden in a list request. Generated URL existence is not successful rendering.

| Storage case | Actual behavior / limitation |
| --- | --- |
| Public Cloudinary image/upload PDF, generated document key, matching file metadata; permitted derivative | Page1 JPG can render when delivered; aspect-contained600×800 limit never crops/upscales. Offline URL construction and browser synthetic image success verified; live assets untested. |
| Raw/password-protected PDF sharing a legacy document key | An image/upload candidate may not exist; browser error shows unavailable. No raw conversion, reupload or namespace fallback. Historical resource_type cannot be reconstructed from current DB metadata. |
| Private/authenticated/token-restricted asset | No private/signed URL generation or access override. Public candidate cannot grant that asset's access; blocked delivery falls back. Proven private source is never mounted through Daily/Recognition adapters. |
| Wrong provider/folder/MIME, non-generated/malformed key or missing file | thumbnailUrl stays null; no new preview request. Other originals/download workflows remain existing owners. |
| Account PDF block / strict transform / missing or failed derivative | Honest unavailable fallback on image error; ordinary document retry remains feature-owned. Account eligibility cannot be established offline. No security setting changed. |
| Pending image | Reserved portrait/skeleton with loading semantics; title, metadata and native open remain available. |

Supporting arbitrary historical/raw assets reliably would require retaining verified
resource/delivery/access metadata (schema/backfill decision) and possibly account
eligibility/allowed transformations (operator decision). Neither is part of this
candidate. Do not enable public access or migrate private assets as a preview fix.
The [existing status](../../reviews/ux-flow-audit.md) records exact candidate and learner
walks; synthetic fixtures are not evidence of live Cloudinary authorization.


### Documents/News discovery owners and task evidence (10/10/2026)

| Actual owner / mounted adoption | Purpose / invariant |
| --- | --- |
| [PublicNewsFeature](../../../apps/web/src/features/post/components/public-news-feature.tsx) → [NewsPage](../../../apps/web/src/pages/news-page.tsx) | One search/type/active-filter band before pinned content; SearchInput,44px Button/native type Links, PageHeader and existing pagination/feedback. Search matches title, on-submit trim and feature URL/reset rules unchanged. Priority query enabled only unfiltered page1, feed9/publishedAt descending; pinned remain in feed. |
| [PostListItem](../../../apps/web/src/features/post/components/post-list-item.tsx) + [CSS](../../../apps/web/src/features/post/components/public-news-feature.css) | Two board call sites: NewsList feed and PublicNewsFeature pinned band. One Link groups type/date/title/deadline/summary/open cue; supporting64px phone or160px wide image, error removes image only. Distinct card variant remains for related posts; no competing shared primitive. |
| [NewsDetailFeature](../../../apps/web/src/features/post/components/news-detail-feature.tsx) → NewsDetailPage |72ch body measure and compact lead/related spacing; existing RichTextViewer, ArticleToc, ImageLightbox Dialog, progress/share/author/deadline/related owners retained. TOC uses aria-expanded/controls; no new lightbox or reading policy. |
| [DocumentThumbnail](../../../apps/web/src/features/documents/components/document-thumbnail.tsx) | Three actual consumers listed in the storage reference above. Reserved3:4 page containment and loading/error/unavailable states; no original PDF fetch. Document filters/cards/list keep subject/kind/tags/description/open and independent retries. |

No new route entries or global adoption counts are implied. The42-page ledger is
inherited broad source coverage; this supplement inspects and renders Documents,
News, their readers and document-management thumbnail ownership specifically.
[Design rationale and public references](features-and-modal.md#documents-and-news-catalogue--editorial-discovery-10102026)
record concrete alternatives and token decisions. The existing browser probe has
`VISUAL_DOCUMENTS=1` / `VISUAL_NEWS=1` modes, `VISUAL_BASELINE=1`,
`VISUAL_MATRIX_EXTRA=1` for complementary themes and
`VISUAL_DISCOVERY_MATRIX_ONLY=1` for layout-only runs. Fixtures contain synthetic
content/images, never screenshot personal data. Results/side-by-side comparisons,
keyboard/find/open/return/retry observations and interrupted probes are recorded in
[existing status](../../reviews/ux-flow-audit.md), not inferred from import counts.


### Admin recovery and discovery owners (10/10/2026)

Follow-up to the [a4821ed admin task audit](../../reviews/ux-flow-audit.md#admin-ui-task-audit-a4821ed).
These changes preserve the existing creation/publication/permission contracts.
The current remedy disposition and bounded evidence live in the
[existing status](../../reviews/ux-flow-audit.md#admin-ui-audit-remedies-20261010).

| Owner / actual consumers | Contract and task benefit |
| --- | --- |
| [OptionQueryFeedback](../../../apps/web/src/components/ui/option-query-feedback.tsx) | Presentation only: `label`, `pending`, `error`, `retrying`, `onRetry`. Pending status precedes error; error uses InlineRetryFeedback and Button loading/disablement. Six consumer files: Documents management, Question Bank, manual question workspace, legacy QuestionEditForm, ExamForm and import AssessmentDraftCard. Callers retain values, queries, dependent subject/topic gates and drafts. A failed options request is never represented as a genuinely empty list. |
| [post-status](../../../apps/web/src/features/post/post-status.ts) → DashboardPostList / PostManagementFeature | `postDisplayStatus` derives EXPIRED only for PUBLISHED; draft/archive keep their real status and separate deadline. `postManagementStatusQuery` maps EXPIRED to existing published+expired predicates and active PUBLISHED to published+not-expired. No API/filter/publication policy added. |
| [PostManagementFeature](../../../apps/web/src/features/post/components/post-management-feature.tsx), [DocumentsManagementPage](../../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx) → replaceListParam | Search keeps500ms debounce; status or subject/category selects use existing request fields. URL-backed filters reset one-based page; Documents pairs its subject/kind controls on phones. Reset removes only each feature's filters/page, preserving other URL context. Posts counters stay informational and become compact on phones. CreationDialog/form owners unchanged. |
| Posts / Documents / [AdminCategoriesPage](../../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx) → AlertDialog | Pending mutation blocks every close request, not just Cancel. Failure keeps target and visible inline error; idle cancel and success close remain available. Mutation/callback/policy authority stays local; no universal delete state engine. |
| [AdminUsersPage](../../../apps/web/src/pages/admin/users/admin-users-page.tsx) | Local UserIdentity/UserPermissions are reused in mobile record rows and desktop Table. Below768px identity, email, role, permissions, joined date and44px action stay together; wider table retains headers with tablet scroll guidance. Action accessible names identify the user; programmatically opened permission Dialog restores focus to its exact trigger. One query/pagination/permission mutation owner. |
| [DashboardDocumentList](../../../apps/web/src/features/documents/components/dashboard-document-list.tsx), [DashboardPostList](../../../apps/web/src/features/post/components/dashboard-post-list.tsx) | ManagementListRow remains shared. Document titles wrap to reveal distinguishing suffixes; native detail/open targets retained. POST-owned thumbnail reserves64×48 on phones /96×64 wider and falls back honestly on error. DocumentThumbnail/PDF policy remains the separate existing owner. |
| [import-session](../../../apps/web/src/features/assessment/import-session.ts), [AssessmentImportPage](../../../apps/web/src/pages/assessment-import-page.tsx), [hooks](../../../apps/web/src/features/assessment/hooks/use-assessment-import.ts) | `?importId=UUID` restores a known job through authorized endpoints, not a new upload. Invalid IDs make no job request. Query identities include account/token revision, consume AbortSignal and revalidate on mount. Same-account retained review rows preserve local corrections through transient token/query failures; placeholders/errors never authorize media or writes. Account changes reset local rows.401/403/404/410 suppress cached private content; transient failures retain text and expose explicit retry. No invented job lifetime or history. |
| [AssessmentDraftCard](../../../apps/web/src/features/assessment/components/assessment-draft-list.tsx) | Caught save/approve/reject failure focuses role=alert and retains fields. One row-operation lock gates sibling fields/actions; per-job mutation keys coordinate publish gates. Approve still saves first. Denied writes revalidate authorized status/drafts; media mounts only after successful current checks. |
| [Recognition QueryFeedback](../../../apps/web/src/features/recognition/components.tsx), [ExamProblem](../../../apps/web/src/features/exams/components/exam-feedback.tsx) | Required fetching/busy prop is passed by all direct consumers; retries remain disabled throughout cached refetch. Recognition section buttons have aria-current for the active destination; existing native navigation remains, not simulated tab semantics. |

Intentional variants remain: desktop relational tables, immediate permission changes,
exam frozen/release gates, Recognition review/publication and private-media adapters,
feature-specific metadata validation, reader layouts and Daily native-dialog/autosync
contracts. These changes do not consolidate business state merely because markup
looks similar. The seven-path Daily recovery and unrelated auth/deploy status remain
separately pending; source adoption is not all-screen/live validation.
