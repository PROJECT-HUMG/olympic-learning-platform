# Shared UI owners and screen adoption

[UI authority](web-ui.md) · [Frontend guide](../../apps/web/README.md) · [Route definitions](../../apps/web/src/router/routes.tsx) · [Route constants](../../apps/web/src/router/route-constants.ts)

## Scope and how to read this reference

The visual/creation and Documents/News discovery work is committed and pushed as
`a4821ed8c869baa7131aa2a10ace3b10cab632be` (parent `f7db010`); see the
[actual 42-entry visual/creation ledger](#visual-and-creation-coverage-10102026).
The original cross-file inventory was verified on 09/10/2026 at UI commit
`bd47c5b6bed35ce64900e39a5e5eea8c90e60c5b`, including the separately pending Daily
recovery in the working tree. The [cross-file reuse audit](web-ui-reuse-audit.md)
records all 42 page entries, import/JSX evidence, direct consumer counts, copied
structures/helpers and justified local exceptions. It supplements the route table
below rather than treating matching CSS or transitive imports as component reuse.
The original inventory began at candidate `f2cc0db66460a4b7c6c58007461f42e009eca56e9c3aac8b190523f3667e82c5`
on base `0f06fcbaf757d06f243b7385e3ca68fc0b0d3530`; earlier manifests still identify
their earlier bytes exactly. Honors search, Dialog lightbox, shared list feedback
and compact mobile headers are now committed UI behavior.
The route inventory is source evidence, not all-screen rendered or backend validation. The preceding
candidate's representative Chromium checks remain bounded to their recorded
screens/states; see the [existing audit](../reviews/ux-flow-audit.md).

Boundary: prior shared-owner consolidation is committed in `ec98761`; mobile/Recognition
and navbar work is committed in `e84f988` / `f7db010`. The10/10 visual/creation
refactor and discovery supplement shipped in `a4821ed`. Dated candidate sections
below retain their original checkpoint/evidence descriptions; they do not denote
new pending runtime work. Publication and the subsequent read-only
[admin task audit](../reviews/ux-flow-audit.md#admin-ui-task-audit-a4821ed) are recorded
in the existing status. The subsequent admin remedies are described in
[Admin recovery and discovery owners](#admin-recovery-and-discovery-owners-10102026).
The separately accepted seven-path Daily recovery remains uncommitted: creation-owned
error feedback, task-row invalid/error association and the native Create-dialog44px
Close fix are pending Daily changes, not behavior shipped by this UI commit. Daily's
mobile title token adjustment is committed UI. The earlier control table describes
those owners; the10/10 ledger additionally describes the shipped visual/creation
adoption. Pending Daily recovery is marked explicitly.

Adoption means different things:

- **Composition:** importing `SearchInput`, `PageHeader`, `AppPagination`, etc.
  reuses their presentation/interaction implementation.
- **Primitive:** `Input`, `Button`, `Label`, Radix/native controls are reused, but
  the feature still composes the search, form, feedback or page.
- **Style:** `.page-shell`, `.page-toolbar`, `.page-section` and heading classes
  share CSS only; hand-written matching markup is not component adoption.
- **Domain owner:** a feature composition is reused within its domain, such as
  Daily's date picker or Recognition's `Pager`. This is useful reuse without an
  application-wide component.

Shared ownership is real but partial. Ordinary searches have nine direct
`SearchInput` consumer files. `NativeSelect` has fourteen, Radix `Select` three,
and `Combobox` one (Documents, with three filter instances). The source scan found
no raw `<select>` outside `NativeSelect`. These are direct source-file counts,
not route counts: aliases and branches reuse the same implementation. Imports
through large feature modules can overcount reachability; the table below names
actual rendered branches rather than equating every reachable import with use.
There is **no shared query/filter state engine or universal page component**.
Counts include retained source even when it is not mounted: AppPagination has
eight routed consumer files plus the unused legacy PostManagement; Card has seven
routed plus two legacy files, Badge nine plus two, DropdownMenu three plus one.
The two FormField owners are counted separately: floating fields in ten files,
RHF fields in two. RichTextEditor additionally composes Select/Dialog internally.
See the audit for exact call sites and the import-reachability limit.

## Search, filter and layout owners

| Owner / source | Purpose and API essentials | Actual consumers / boundaries |
| --- | --- | --- |
| [SearchInput](../../apps/web/src/components/ui/search-input.tsx) → [Input](../../apps/web/src/components/ui/input.tsx) | Flexible wrapper, decorative icon, 44px input; accepts Input props; `type="search"` default. Supply label/`aria-label`. | [DocumentFilters](../../apps/web/src/features/documents/components/document-filters.tsx), [SubjectDirectory](../../apps/web/src/features/subjects/components/subject-directory.tsx), [PublicNewsFeature](../../apps/web/src/features/post/components/public-news-feature.tsx), [PostManagementFeature](../../apps/web/src/features/post/components/post-management-feature.tsx), [document management](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx), [Users](../../apps/web/src/pages/admin/users/admin-users-page.tsx), [QuestionSearch](../../apps/web/src/pages/question-bank-page.tsx), [PublishedBank](../../apps/web/src/features/exams/components/exam-editor.tsx), [HonorsPage](../../apps/web/src/features/recognition/public-pages.tsx). No query, debounce, submission or URL ownership. Documents uses `type="text"` because its explicit clear owns apply/URL behavior. |
| [NativeSelect](../../apps/web/src/components/ui/native-select.tsx) | Native select props/events/options; default 44px, `controlSize="sm"` 36px. Label externally. | Questions/manual/scientific editors, Assessment draft review, exam editor, Recognition fields, Daily priority/sharing, GPA, room policy/ownership. Browser owns option-menu interaction; application theme supplies native color scheme. |
| [Select](../../apps/web/src/components/ui/select.tsx) | Installed Radix composition: Root `value`/`onValueChange`; Trigger/Value/Content/Item. Trigger default 44px/full width, `size="sm"` 32px. Popper collision/portal owner; bounded reading width and wrapped 44px items. | [DocumentForm](../../apps/web/src/features/documents/components/document-form.tsx), [PostForm](../../apps/web/src/features/post/components/post-form.tsx), [legacy question editor](../../apps/web/src/pages/question-detail-page.tsx). Keep their controlled values, nullable adapters and metadata gates. Do not change owner solely for appearance. |
| [Combobox](../../apps/web/src/components/ui/combobox.tsx) → [PopoverContent](../../apps/web/src/components/ui/popover.tsx) | `options: {value,label}[]`, controlled `value`, `onChange(value)`, `disabled`, `aria-label`, localized placeholder/empty text. `className` controls wrapper; `inputClassName` input. | Documents subject/category/tag filters only. Local label filtering and active-option keyboard behavior belong here; installed Radix owns collision/portal/dismissal. Enter/Escape/selection retain input focus; Tab navigates normally. It is not a server-backed account search. |
| [PageHeader](../../apps/web/src/components/ui/page-header.tsx) | `title`, optional `description`, `actions`, `titleId`, `className`; h1 and responsive action row. Description accepts block React content via div. | 29 direct consumer files across functional pages/features. Does not load data or decide permission visibility. [PublicPageHeader](../../apps/web/src/components/ui/public-page-header.tsx) is a thin alias with no current consumers; prefer PageHeader. |
| [PageSection](../../apps/web/src/components/ui/page-section.tsx) | Labelled section, generated h2 ID, title/description/actions/children, native section props. Description is inside p: use text/inline content. | 12 direct consumer files: Profile/security, dashboard/About, Daily plan/shared review, scientific/exam editors and Recognition. It owns panel markup, not loading state. Do not wrap every flat list in another card. |
| [page-layout.css](../../apps/web/src/components/ui/page-layout.css) | `.page-shell`: 72rem maximum and 32px gap (16px at ≤640px); `--public` adds gutters. `.page-toolbar`: wrapping flex, 16px gaps. `.page-table`, `.page-guidance`, `.page-prose`, heading/section classes. | CSS pattern reuse across public/workspace surfaces. No React toolbar component. Document/News readers use heading tokens without PageHeader; Daily groups sometimes use section markup/classes directly. Workspace gutters belong to DashboardLayout. |
| [list-navigation.ts](../../apps/web/src/lib/list-navigation.ts) | Existing helpers for safe list return paths and associated navigation state. | Feature owners keep filters/page/view/return paths and page reset; presentation components must not take over this contract. |

Minimal composition (feature handlers still own application behavior):

```tsx
<div className="page-shell">
  <PageHeader title="Danh sách" />
  <form role="search" className="page-toolbar" onSubmit={applySearch}>
    <SearchInput aria-label="Tìm trong danh sách" value={draft}
      onChange={event => setDraft(event.target.value)} />
    <Button type="submit">Tìm</Button>
  </form>
</div>
```

This is an example, not a requirement to turn existing debounced searches into
forms. PublishedBank is already inside an editor: preserve its explicit button,
Enter/IME and nested-form guards instead of inserting a nested form.

## Route and screen adoption

`r` means both `/admin` and `/lecturer`. Shared app chrome is separate from page
bodies: [PublicLayout](../../apps/web/src/layouts/public-layout.tsx),
[DashboardLayout](../../apps/web/src/layouts/dashboard-layout.tsx),
[AuthCardLayout](../../apps/web/src/layouts/auth-card-layout.tsx),
[navigation](../../apps/web/src/layouts/navigation.ts) and
[NavigationDrawer](../../apps/web/src/layouts/components/navigation-drawer.tsx)
own responsive navigation. They do not make every body a shared page composition.

| Routes / family | Page → actual body owner | Adoption and intentional variation / remaining local composition |
| --- | --- | --- |
| `/` | [HomePage](../../apps/web/src/pages/home-page.tsx) → [HomeHeroSection](../../apps/web/src/features/home/components/home-hero-section.tsx), HomeStudyNotebook/HomeLatestNewsSection | Shared Input/Button, domain post presentation; hero's prominent search and cinematic sections are intentional local compositions, not SearchInput/PageHeader. |
| `/subjects` | [SubjectsPage](../../apps/web/src/pages/subjects-page.tsx) → [SubjectDirectory](../../apps/web/src/features/subjects/components/subject-directory.tsx) | SearchInput, PageHeader, public shell CSS; local Vietnamese matching/cards remain feature-owned. |
| `/documents` | [DocumentsPage](../../apps/web/src/pages/documents-page.tsx) → [DocumentFilters](../../apps/web/src/features/documents/components/document-filters.tsx), [DocumentList](../../apps/web/src/features/documents/components/document-list.tsx) | SearchInput, Combobox, AppPagination; search-first layout has sr-only h1, intentionally no visible PageHeader. Chips/view switch remain local; empty/error presentation uses EmptyState/ListFeedback. |
| `/documents/:slug` | [DocumentDetailPage](../../apps/web/src/pages/document-detail-page.tsx) | Public shell and heading classes, primitives, domain download Dialog/skeletons; reader title/metadata/action layout is not PageHeader. No list search/select in the reader itself. |
| `/news` | [NewsPage](../../apps/web/src/pages/news-page.tsx) → [PublicNewsFeature](../../apps/web/src/features/post/components/public-news-feature.tsx), [NewsList](../../apps/web/src/features/post/components/news-list.tsx) | SearchInput, PageHeader, AppPagination; category navigation uses URL Links, not a dropdown. Empty/error feed presentation uses EmptyState/ListFeedback; pinned/feed composition preserves independent retries. |
| `/news/:slug` | [NewsDetailPage](../../apps/web/src/pages/news-detail-page.tsx) → [NewsDetailFeature](../../apps/web/src/features/post/components/news-detail-feature.tsx) | Shared RichTextViewer, Skeleton, Button and heading classes; local reader/metadata and ImageLightbox backed by Dialog; no PageHeader. |
| `/honors` | [HonorsPage](../../apps/web/src/pages/honors-page.tsx) → [HonorsPage implementation](../../apps/web/src/features/recognition/public-pages.tsx) | PageHeader; domain Field/YearField/Pager/QueryFeedback reuse NativeSelect/AppPagination. List search now uses SearchInput + the existing submit Button; typing does not apply filters. |
| `/honors/:id` | [HonorDetailPage](../../apps/web/src/pages/honor-detail-page.tsx) → [public-pages](../../apps/web/src/features/recognition/public-pages.tsx) | PageHeader/PageSection after data resolves; shared album Dialog. Other exports' Pager/select imports do not mean this detail branch has filters. |
| `/rankings` | [RankingsPage](../../apps/web/src/pages/rankings-page.tsx) → [public-pages](../../apps/web/src/features/recognition/public-pages.tsx) | PageHeader, NativeSelect through YearField, AppPagination through Pager; domain ranking list and native scoring disclosure stay. |
| `/achievements/:userId` | [AchievementProfilePage](../../apps/web/src/pages/achievement-profile-page.tsx) → [public-pages](../../apps/web/src/features/recognition/public-pages.tsx) | Stable PageHeader, PageSection and QueryFeedback; no list search/pager in this branch. Public content gate remains feature-owned. |
| `/toolkit?tool=rooms`, `/toolkit?tool=gpa` | [ToolkitPage](../../apps/web/src/pages/toolkit-page.tsx) → [ToolkitFeature](../../apps/web/src/features/toolkit/components/toolkit-feature.tsx), [StudyRoomsLobby](../../apps/web/src/features/study-room/components/study-rooms-lobby.tsx), [GpaCalculator](../../apps/web/src/features/toolkit/components/gpa-calculator.tsx) | PageHeader, shared Tabs; GPA uses Input/NativeSelect/Button with domain validation, lobby uses styled native inputs. Neither is a list-search page. |
| `/study-rooms/:roomId` | [StudyRoomPage](../../apps/web/src/pages/study-room-page.tsx) → [StudyRoomSession](../../apps/web/src/features/study-room/components/study-room-session.tsx) | PageHeader, Dialog/AlertDialog/DropdownMenu, NativeSelect policy fields; custom scene, seat paging, audio/range inputs and native music dialog preserve persistent player continuity. |
| `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | [auth page wrappers](../../apps/web/src/pages/auth) → [auth forms](../../apps/web/src/features/auth/components) | Shared floating FormField/Button and TurnstileChallenge where enabled; feature-owned heading/error/OTP/resume compositions in AuthCardLayout. SocialLoginButtons currently has no consumers. No PageHeader/list filters. |
| `/dashboard`, `/r/dashboard` | [DashboardPage](../../apps/web/src/pages/dashboard-page.tsx) | PageHeader/PageSection, shared links/buttons; role-aware shortcuts are intentional domain content. |
| `/profile` | [ProfilePage](../../apps/web/src/pages/profile-page.tsx) → [profile/security/avatar components](../../apps/web/src/features/user/components) | PageHeader/PageSection, floating FormField, Dialog/AlertDialog and shared AvatarImage; account identity and mounted-editor refresh handling stay feature-owned. |
| `/profile/achievements` | [MyAchievementsPage](../../apps/web/src/pages/my-achievements-page.tsx) → [private-pages](../../apps/web/src/features/recognition/private-pages.tsx), [AchievementEditor](../../apps/web/src/features/recognition/achievement-editor.tsx) | PageHeader/PageSection, NativeSelect, domain QueryFeedback/Field, native checkbox/disclosure. Visibility/evidence/submission are explicit feature operations. |
| `/daily` including date/history/week query views | [DailyOwnerPage](../../apps/web/src/pages/daily-owner-page.tsx) → [DailyPlanEditor](../../apps/web/src/features/daily/components/daily-plan-editor.tsx) | PageHeader/PageSection, Input/Textarea/Checkbox/NativeSelect, shared dialogs; domain date/history/sync/empty/evidence composition. Flat task surface is intentional. |
| `/daily/week` | [DailyWeekPage](../../apps/web/src/pages/daily-week-page.tsx) → [DailyWeekEditor](../../apps/web/src/features/daily/components/daily-week-editor.tsx) | PageHeader, domain StudyDatePicker/StudyDisclosure/StudyWeekStats/DailySyncStatus; local weekly reflection layout. |
| `/daily/groups`, `/daily/groups/:groupId` | [DailyGroupsPage](../../apps/web/src/pages/daily-groups-page.tsx) → [GroupList/GroupConsent](../../apps/web/src/features/daily/groups/group-controls.tsx) | PageHeader, NativeSelect and domain date/identity/empty/retry; hand-written `.page-section` markup is CSS reuse. Creation keeps its native modal dialog; creation-owned error/44px Close are pending Daily recovery, excluded from this UI commit. |
| `/daily/groups/:groupId/reviews/:ownerId` (day/week) | [DailySharedReviewPage](../../apps/web/src/pages/daily-shared-review-page.tsx) | PageHeader/PageSection and domain date/progress/disclosure/feedback; read-only plan and private revalidation gates are intentional. |
| `/practice`, `/history` | [PracticePage](../../apps/web/src/pages/practice-page.tsx), [HistoryPage](../../apps/web/src/pages/history-page.tsx) | PageHeader, shell and guidance-action CSS/Button; truthful feature guidance, not implemented exercise/history flows. |
| `/competitions`, `/about` | [CompetitionsPage](../../apps/web/src/pages/competitions-page.tsx), [AboutPage](../../apps/web/src/pages/about-page.tsx) | Public PageHeader/shell; About also PageSection. Guidance/content rather than list filters. |
| `/r/documents` | [DocumentsManagementPage](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx) → [DocumentForm](../../apps/web/src/features/documents/components/document-form.tsx), [DashboardDocumentList](../../apps/web/src/features/documents/components/dashboard-document-list.tsx) | PageHeader/SearchInput/AppPagination/RetryFeedback/toolbar CSS; RHF Form, Radix Select, Dialog/AlertDialog, EmptyState. Metadata/loading/retry/upload behavior remains domain-owned. |
| `/r/posts` | [PostManagementPage](../../apps/web/src/pages/dashboard/posts/post-management-page.tsx) → [PostManagementFeature](../../apps/web/src/features/post/components/post-management-feature.tsx), [PostForm](../../apps/web/src/features/post/components/post-form.tsx) | PageHeader/SearchInput/AppPagination/RetryFeedback/toolbar CSS; RHF Form, Radix Select, Dialog/AlertDialog, EmptyState and RichTextEditor. |
| `/admin/users` | [AdminUsersPage](../../apps/web/src/pages/admin/users/admin-users-page.tsx) | PageHeader/SearchInput/AppPagination/toolbar CSS; shared Dialog/Table/Badge, local row permissions and feedback. |
| `/admin/categories` | [QuestionBankPage](../../apps/web/src/pages/question-bank-page.tsx) | Existing CardHeader/Content/Footer separate metadata/body/actions; filter/submission/query and permission/pending callbacks retained. |
| [ExamListItem](../../apps/web/src/features/exams/components/exam-read.tsx) | Two actual list consumers reuse feature-local presentation with existing Badge/Link/surface tokens; metadata wraps, title has44px target/minimum width bounds; readers and release gates untouched. |
| [AdminCategoriesPage](../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx) → [category components](../../apps/web/src/features/system-categories/components) | PageHeader, Tabs, Table, Dialog/AlertDialog, floating FormField, Skeleton. Tabbed metadata tasks intentionally have no list-search bar. |
| `/admin/recognition` | [AdminRecognitionPage wrapper](../../apps/web/src/pages/admin/recognition-page.tsx) → [admin-page](../../apps/web/src/features/recognition/admin-page.tsx), [HonorEditor](../../apps/web/src/features/recognition/honor-editor.tsx), AchievementEditor | PageHeader/PageSection, NativeSelect, Dialog and domain QueryFeedback/Field/UserPicker; grouped review records; reviewer-owned gates retained. UserPicker is server search + native selection, not Combobox. |
| `/r/questions` | [QuestionBankPage](../../apps/web/src/pages/question-bank-page.tsx) | PageHeader/SearchInput/NativeSelect/AppPagination/RetryFeedback/toolbar CSS; Card/Skeleton and feature-owned query state. One bounded search/filter band. |
| `/r/questions/new`, `/r/questions/:id` | [QuestionDetailPage](../../apps/web/src/pages/question-detail-page.tsx) → [ManualQuestionWorkspace](../../apps/web/src/features/questions/components/manual-question-form.tsx) or legacy editor | Both use PageHeader/primitives; manual/scientific branch uses NativeSelect/PageSection, legacy branch Radix Select/floating title FormField. Schema/nullable adapters/figure gates explain different form owners. |
| `/r/questions/import` | [AssessmentImportPage](../../apps/web/src/pages/assessment-import-page.tsx) → [assessment components](../../apps/web/src/features/assessment/components) | PageHeader/Card/Skeleton/Button, compact NativeSelect in mounted draft review; local status/progress/retry distinguish polling from restarting a job. |
| `/r/exams` | [ExamDraftsPage](../../apps/web/src/pages/exam-drafts-page.tsx) → [ExamDraftList](../../apps/web/src/features/exams/components/exam-read.tsx) | Domain Shell composes PageHeader/shell CSS; bordered draft rows, ExamLoading/ExamProblem. No list search/pagination currently offered. |
| `/r/exams/new`, `/r/exams/:examId` | [ExamEditorPage](../../apps/web/src/pages/exam-editor-page.tsx) → [ExamEditor/PublishedBank](../../apps/web/src/features/exams/components/exam-editor.tsx) | PageHeader/PageSection/NativeSelect/SearchInput/AppPagination; draft/version/publish and nested-form rules remain local. |
| `/r/exams/:examId/preview` | [ExamPreviewPage](../../apps/web/src/pages/exam-preview-page.tsx) → [ExamPreview](../../apps/web/src/features/exams/components/exam-read.tsx) | Domain Shell + PageHeader, shared Button; solution toggle and question renderer stay task-specific. |
| `/r/exams/papers`, `/exams`; `/r/exams/papers/:paperId`, `/exams/:paperId` | [ExamPapersPage](../../apps/web/src/pages/exam-papers-page.tsx), [ExamPaperPage](../../apps/web/src/pages/exam-paper-page.tsx) → [exam-read](../../apps/web/src/features/exams/components/exam-read.tsx) | Domain Shell/PageHeader/feedback, bordered paper list/frozen-paper reader; staff solution toggle versus student release/content gate. No shared filter bar in these branches. |
| `*` | [NotFoundPage](../../apps/web/src/pages/not-found-page.tsx) → [WelcomeLayout](../../apps/web/src/layouts/welcome-layout.tsx) | Shared Button; intentional auth-style 404 identity, not PageHeader. |

Redirects have no independent screen to normalize: `/study-rooms` →
`/toolkit?tool=rooms`, `/lecturer` and `/admin` → their dashboards. The
`QUESTION_IMPORT`/`QUESTION_BANK` constants are not standalone mounted routes;
actual authoring paths use role prefixes. Query views do not create new page owners.


## Mobile header rules and actual adoption

The full route table above remains the source inventory of all42 page entries;
mobile refinement adds no routes or component API. PageHeader still has29 direct
consumer files. At ≤640px [page-layout.css](../../apps/web/src/components/ui/page-layout.css)
owns 24px/1.25 titles, 16px page gaps/public top inset, 8px description margin with
1.6 line height, 12px header row/divider spacing and 8px action gaps. Copy has a full
row; actions wrap with labels intact and minimum44px targets. Titles/descriptions
have no fixed height, clamp or removal. Above640px, shared tablet/desktop rules
remain unchanged. The [workspace content inset](../../apps/web/src/layouts/navigation.css)
is16px on narrow screens; this changes body spacing, not global navigation geometry.

| Page families from the route inventory | Actual mobile owner / decision |
| --- | --- |
| Subjects, News feed, public/private/admin Recognition; dashboard/profile; About/Competitions/Practice/History; document/post/user/category management; question bank/manual/legacy/import; exam list/editor/preview/frozen papers | Existing PageHeader composition inherits compact copy/actions/spacing. Exam Shell composes it; no new universal page wrapper. Permission/context branches and all actions remain feature-owned. |
| Daily owner/week/groups/shared reviews | [study-notebook.css](../../apps/web/src/features/daily/ui/study-notebook.css) keeps flat borderless regions, existing16px mobile gap and domain controls. The mobile title override now uses the common24px token; no editor, sync or dialog lifecycle changes. |
| Study-room session | [study-room.css](../../apps/web/src/features/study-room/components/study-room.css) retains its24–32px bounded title and explicit mobile action grid; shared header copy/spacing applies. Persistent media, scene and controls remain domain-owned. |
| Document reader | Shared title token; [DocumentDetailPage](../../apps/web/src/pages/document-detail-page.tsx) keeps metadata/download composition. Mobile metadata panel padding16px and internal row gap16px, rather than24px; desktop/tablet padding/actions retained. |
| News reader | Shared title token; [NewsDetailFeature](../../apps/web/src/features/post/components/news-detail-feature.tsx) retains title/metadata/author/thumbnail/reading layout. Mobile breadcrumb/title top inset16px, smaller metadata/author/grid gaps and24px gap to article; existing `sm:` values retain tablet/desktop treatment. |
| Login/register/reset/verification/resume | [welcome-layout.css](../../apps/web/src/layouts/welcome-layout.css) already uses the title token. Headings inherit24px; deliberate line breaks, descriptions, floating52px fields, Turnstile and auth shell remain. |
| Home, search-first Documents, fallback/404 and redirects | Hero/cinematic search remains distinct; Documents retains accessible sr-only h1; already-small session fallback/intentional404 and screenless redirects are not normalized. No new title band. |

The owned [mobile header probe](../../apps/web/tests/ui-mobile-header-browser-check.mjs)
uses10 actual route families: Subjects, Honors, News, document management, exam new,
Daily groups, both readers, login and Home. Run from `apps/web` with a separately
owned Vite on3118: `node tests/ui-mobile-header-browser-check.mjs` (override
`MOBILE_HEADER_WEB_URL` if needed). `MOBILE_HEADER_BASELINE=1` captures baseline;
it is not final acceptance. `MOBILE_HEADER_SHORT_ONLY=1` focuses320x360 dark;
`MOBILE_HEADER_READERS_ONLY=1` focuses the two readers. Four viewport/theme combinations are1440x900 light,
820x900 dark,320x640 light and320x360 dark. It records title/header/description/action
geometry, screenshots, no page overflow,44px header actions, keyboard link activation
and exam field identity/draft/focus through viewport resize. All API/external traffic
is intercepted; auth is synthetic/anonymous for the login presentation. No production
credentials or mutations occur. The ten rendered routes are representative, not
all-screen runtime validation; Daily/room persistence and AT speech are not proven
by CSS or these fixtures. See the [status/evidence](../reviews/ux-flow-audit.md).

## Three-cluster consolidation (working candidate, 09/10/2026)

The three-cluster implementation is included in the completed reuse consolidation
on the UI base above. The original13-cluster inventory is historical; equivalent
residual owners are now implemented below.
The [post-consolidation residual sweep](web-ui-reuse-audit.md#post-consolidation-residual-sweep)
independently checks all42 page entries and375 source files, confirms these owners
have no equivalent shadow copies, and adds/corrects remaining findings. The seven-path
Daily recovery remains a separate pending candidate. Its editor/group/status/test
fixes remain pending separately. Reflection extraction overlaps the day editor:
only its import/composition is committed; recovery hunks stay in the working tree.
Plan/evidence timestamp changes belong to reuse scope. Historical manifests retain historical hashes.

| Owner / API | Verified direct consumers | Behavior and intentional boundary |
| --- | --- | --- |
| [validatePostImage](../../apps/web/src/features/post/lib/post-image-validation.ts): `Pick<File, "type" \| "size">` → `"type" \| "size" \| null` | [PostImageUpload](../../apps/web/src/features/post/components/post-image-upload.tsx#L26), [ImageInsertDialog in RichTextEditor](../../apps/web/src/components/ui/rich-text-editor.tsx#L63): **2 files** | Existing `image/*` MIME family, inclusive 5MiB limit, type-error precedence. This is client feedback, not byte/security validation. Both use native [Button](../../apps/web/src/components/ui/button.tsx) activation and the existing [storageService](../../apps/web/src/features/documents/services/storage.service.ts), folder POST. Clear input after capturing File so same-file validation/failure retry works; per-picker in-flight guard plus disabled/busy state prevent duplicate requests. Thumbnail completes with asset ID/preview/removal; editor inserts URL/closes its existing Dialog and preserves text. URL insertion stays separate. No upload framework, private-media policy or new whitelist. |
| [explicitInstant](../../apps/web/src/features/daily/lib/explicit-instant.ts#L6): `unknown` → `string \| null` | [daily-contract](../../apps/web/src/features/daily/lib/daily-contract.ts#L97), [evidence-contract](../../apps/web/src/features/daily/evidence/evidence-contract.ts#L125): **2 files**, **3 call sites** | One original regex/parser beside platform-calendar; genuine civil date, explicit zone, bounded time and Date.parse validity. Preserve spelling/fraction/offset acceptance and nullable plan adapter. Full DTO identity/kind/shape rules remain separate. No auto-sync/private query/editor changes. |
| [RetryFeedback](../../apps/web/src/components/ui/retry-feedback.tsx#L4): `{ message: string; actions: ReactNode }` | [DocumentsManagementPage](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L149), [PostManagementFeature](../../apps/web/src/features/post/components/post-management-feature.tsx#L174), [QuestionBankPage](../../apps/web/src/pages/question-bank-page.tsx#L156): **3 files / 3 sites**, all routed | Exact compact alert, border/padding/centered text; actions are caller-owned. Existing Button type=button, isFetching disablement and refetch callbacks stay in each feature. Initial retry without cached data returns to loading; cached-error retry retains disabled alert. No query engine, illustrated ListFeedback replacement, generic loading or permission wrapper. |

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

[Regressions](../../apps/web/tests/ui-three-cluster.test.ts) exercise MIME/size
boundaries and both timestamp DTO consumers. [Owned browser probe](../../apps/web/tests/ui-three-cluster-browser-check.mjs)
mounts both pickers and all three real management consumers at1440/768/320px with
intercepted synthetic API/storage and light/dark presentation. It verifies native
Enter/Space chooser activation, invalid-file request prevention, failure/retry,
pending gates, distinct completion, editor draft/modal focus and query precedence.
Evidence and limits are in the [existing status](../reviews/ux-flow-audit.md).
No live backend/storage or exhaustive all-screen claim follows from these fixtures.

## Other reusable patterns: use the actual owner

| Pattern | Source / API / current call sites | Selection guidance |
| --- | --- | --- |
| Actions and pending buttons | [Button](../../apps/web/src/components/ui/button.tsx): variant/size/asChild/loading; loading adds spinner/aria-busy and disables native button. Used across forms, lists and dialogs. | Set `type="button"` for non-submit actions. `asChild` links retain anchor semantics; native disabled does not disable a link. Feature owns request gate. |
| Two different FormFields | [floating FormField](../../apps/web/src/components/ui/form-field.tsx): id/label/error/helperText, 52px notch/password reveal; auth, profile/password, category modal, legacy question title. [RHF Form](../../apps/web/src/components/ui/form.tsx): Controller/FormItem/FormLabel/FormControl/FormMessage; DocumentForm/PostForm. | They share a name, not an API. Alias imports when necessary. Preserve existing controlled/default values and validation owner; RHF associates errors but does not itself announce every change. |
| Pagination | [AppPagination](../../apps/web/src/components/ui/app-pagination.tsx): one-based currentPage/totalPages/onPageChange, default numbered or compact variant; hides when totalPages ≤ 1. [Pagination primitives](../../apps/web/src/components/ui/pagination.tsx) are its markup owner. | Documents/News/management/Users/question bank/PublishedBank reuse it. Recognition [Pager](../../apps/web/src/features/recognition/components.tsx) adapts zero-based API. Do not replace room seat paging or calendars with collection paging. |
| Initial route/session loading | [RouteSuspense](../../apps/web/src/router/route-suspense.tsx) → [PageLoading](../../apps/web/src/components/ui/page-loading.tsx); [SessionLoading](../../apps/web/src/router/guards/session-loading.tsx), [SessionError](../../apps/web/src/router/guards/session-error.tsx); [startup-preloader](../../apps/web/src/app/startup-preloader.ts). | Lazy-route/auth readiness is not query loading; query/filter changes must not replay startup. Guards withhold unauthorized children. |
| Query feedback and skeletons | [Skeleton](../../apps/web/src/components/ui/skeleton.tsx); domain document/post/import skeletons. Recognition [QueryFeedback](../../apps/web/src/features/recognition/components.tsx), exams [ExamLoading/ExamProblem](../../apps/web/src/features/exams/components/exam-feedback.tsx), Daily [DailySyncStatus](../../apps/web/src/features/daily/ui/daily-sync-status.tsx) and [Retry](../../apps/web/src/features/daily/groups/group-controls.tsx). | Pending/error/empty composition and retry target remain feature-owned. Use one meaningful pending region, decorative skeleton children; do not convert private revalidation or conflict into generic loading/empty. |
| Compact management errors | [RetryFeedback](../../apps/web/src/components/ui/retry-feedback.tsx): message/actions only; document/post management and Question Bank (3 routed consumers). | Preserve caller branch precedence, disabled retry gate and callbacks. Public illustrated feedback and private query gates have different contracts. |
| Empty/error lists | [ListFeedback](../../apps/web/src/components/ui/list-feedback.tsx): icon/title/children/actions, `tone="empty"` (status) or `tone="error"` (alert), wrapping description/action regions. [EmptyState](../../apps/web/src/components/ui/empty-state.tsx) delegates the empty variant; four feature consumers: public DocumentList/NewsList and DashboardDocumentList/DashboardPostList. | DocumentList and NewsList reuse ListFeedback errors but retain state precedence, request gates, retry callbacks and copy. News empty reset remains a separate explicit action. No query/loading/persistence engine. [StudyEmpty](../../apps/web/src/features/daily/ui/study-notebook.tsx) remains a compact domain owner. |
| Dialogs and confirmation | [Dialog](../../apps/web/src/components/ui/dialog.tsx), [AlertDialog](../../apps/web/src/components/ui/alert-dialog.tsx), [Sheet](../../apps/web/src/components/ui/sheet.tsx): installed Radix semantics/portal/focus/short-viewport scrolling. [DailyDialogHeader](../../apps/web/src/features/daily/ui/daily-dialog-header.tsx), [useDailyConfirm](../../apps/web/src/features/daily/ui/use-daily-confirm.tsx) compose them. | Document/post/user/category/room/evidence dialogs reuse them. Native group Create and [RoomMusicDialog](../../apps/web/src/features/study-room/components/room-music-dialog.tsx) are existing feature owners; preserve close/focus/request gates and persistent media. File/permission/beforeunload prompts stay native. |
| Menus, popovers and date picker | [DropdownMenu](../../apps/web/src/components/ui/dropdown-menu.tsx): account/Daily task/room menus. [Popover](../../apps/web/src/components/ui/popover.tsx): Combobox/listening controls. Daily [StudyDatePicker](../../apps/web/src/features/daily/ui/study-date-picker.tsx) composes Radix directly. | Calendar owns civil-date keyboard navigation and guarded onSelect acceptance; not a generic searchable option list. Keep permission/navigation guards at caller. |
| Chips, badges and cards | [Badge](../../apps/web/src/components/ui/badge.tsx), [Card](../../apps/web/src/components/ui/card.tsx); domain [PostBadge](../../apps/web/src/features/post/components/post-badge.tsx), [PostStatusBadge](../../apps/web/src/features/post/components/post-status-badge.tsx), [PostListItem](../../apps/web/src/features/post/components/post-list-item.tsx), [DocumentCard](../../apps/web/src/features/documents/components/document-card.tsx). | Card/Badge are primitives, not authorization or whole item behavior. Home and News reuse PostBadge; only News feed/pinned/related items use PostListItem. HomeNewsItem stays local. Document filter chips have removal buttons; category Links navigate; status badges are not interactive filters. Do not merge these merely for shape. |
| Identity and private media | [AvatarImage](../../apps/web/src/features/user/components/avatar-image.tsx), [UserHoverCard](../../apps/web/src/features/user/components/user-hover-card.tsx); Daily [evidence components](../../apps/web/src/features/daily/evidence), Recognition HonorImage/[AchievementEvidence](../../apps/web/src/features/recognition/achievement-evidence.tsx)/EvidenceDownload, question figure resolvers. | Reuse identity/crop rendering. Private byte fetch, abort/revoke, permission/expiry and evidence visibility remain with their domain; no generic URL card may bypass them. |
| Auth and rich content | [TurnstileChallenge](../../apps/web/src/features/auth/components/turnstile-challenge.tsx), [SocialLoginButtons](../../apps/web/src/features/auth/components/social-login-buttons.tsx); [RichTextEditor](../../apps/web/src/components/ui/rich-text-editor.tsx), [RichTextViewer](../../apps/web/src/components/ui/rich-text-viewer.tsx). | Auth reuses provider/token lifecycle without changing enforcement. Post rich text differs from scientific question blocks/frozen exam content; retain sanitization/figure contracts, not a universal editor. |

## Follow-up dispositions and remaining opportunities

The [completed owner inventory](web-ui-reuse-audit.md#completed-residual-consolidation-09102026)
is authoritative for current definitions/calls/counts and preserved boundaries.
These eight residual patterns now reuse equivalent ownership:

| Owner / API | Exact current consumers | Adoption / boundary |
| --- | --- | --- |
| [replaceListParam](../../apps/web/src/lib/list-navigation.ts#L2): params/key/value → cloned params | [public-pages.tsx:24](../../apps/web/src/features/recognition/public-pages.tsx#L24); [admin-page.tsx:27](../../apps/web/src/features/recognition/admin-page.tsx#L27); [manual-question.ts:116](../../apps/web/src/features/questions/components/manual-question.ts#L116) | 3 files/3 calls/4 screen compositions. Typed key, draft/submit, query/navigation rules remain local; Documents/News have different reset/batch rules. |
| [parseToolkitDecimal](../../apps/web/src/features/toolkit/lib/decimal.ts#L2): string → finite number/null | [gpa.ts:37](../../apps/web/src/features/toolkit/lib/gpa.ts#L37); [gpa.ts:38](../../apps/web/src/features/toolkit/lib/gpa.ts#L38); [gpa-goal.ts:25](../../apps/web/src/features/toolkit/lib/gpa-goal.ts#L25); [gpa-goal.ts:26](../../apps/web/src/features/toolkit/lib/gpa-goal.ts#L26); [gpa-goal.ts:27](../../apps/web/src/features/toolkit/lib/gpa-goal.ts#L27); [gpa-goal.ts:28](../../apps/web/src/features/toolkit/lib/gpa-goal.ts#L28) | 2 files/6 calls/2 panels on one route. Same dot/comma/trim syntax; credit/range/aggregation/overflow rules stay local. |
| [DailyReflectionField](../../apps/web/src/features/daily/ui/daily-reflection-field.tsx#L5): id/label/value/onChange | [daily-plan-editor.tsx:246](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L246); [daily-plan-editor.tsx:247](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L247); [daily-plan-editor.tsx:248](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L248); [daily-week-editor.tsx:153](../../apps/web/src/features/daily/components/daily-week-editor.tsx#L153); [daily-week-editor.tsx:154](../../apps/web/src/features/daily/components/daily-week-editor.tsx#L154); [daily-week-editor.tsx:155](../../apps/web/src/features/daily/components/daily-week-editor.tsx#L155); [daily-week-editor.tsx:156](../../apps/web/src/features/daily/components/daily-week-editor.tsx#L156) | 2 files/7 sites. Same associated Label/Textarea/classes/4000 limit; sync/session/edit/focus authority stays local. Day-editor recovery hunks excluded from commit. |
| [ManagementListRow + ManagementRowActions](../../apps/web/src/components/ui/management-list-row.tsx#L6): children/actions frame; onEdit/onDelete closures | [dashboard-document-list.tsx:31](../../apps/web/src/features/documents/components/dashboard-document-list.tsx#L31); [dashboard-post-list.tsx:33](../../apps/web/src/features/post/components/dashboard-post-list.tsx#L33) | 2 files/2 sites for each owner. Exact row/action/44px Button presentation; record/status/expiry/thumbnail/permissions/confirmation stay local. |
| [PaginationFooter](../../apps/web/src/components/ui/pagination-footer.tsx#L4): pageOffset/size/total/itemLabel/children | [post-management-feature.tsx:192](../../apps/web/src/features/post/components/post-management-feature.tsx#L192); [documents-management-page.tsx:167](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L167) | 2 files/2 sites. Exact range/frame/scroll wrapper; AppPagination passed by caller, page-clamp/query adapters remain local. |
| [InlineRetryFeedback](../../apps/web/src/components/ui/inline-retry-feedback.tsx#L4): message/actions | [admin-categories-page.tsx:254](../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx#L254); [profile-page.tsx:42](../../apps/web/src/pages/profile-page.tsx#L42) | 2 files/2 sites. Cached-refresh strip only; caller Buttons/loading/retry and terminal identity/cache gates retained. Compact RetryFeedback remains different. |
| [Button destructive-solid](../../apps/web/src/components/ui/button.tsx#L22): existing variant, also accepted by AlertDialogAction | [post-management-feature.tsx:226](../../apps/web/src/features/post/components/post-management-feature.tsx#L226); [documents-management-page.tsx:202](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L202); [avatar-upload-card.tsx:167](../../apps/web/src/features/user/components/avatar-upload-card.tsx#L167); [use-daily-confirm.tsx:27](../../apps/web/src/features/daily/ui/use-daily-confirm.tsx#L27) | 4 files/4 sites. Exact existing solid treatment including inherited primary border; tinted destructive variant unchanged. Radix/request/focus/close untouched. |
| [hasUuidFormat](../../apps/web/src/lib/uuid.ts#L2): lexical string predicate | [evidence-contract.ts:45](../../apps/web/src/features/daily/evidence/evidence-contract.ts#L45); [daily-contract.ts:107](../../apps/web/src/features/daily/lib/daily-contract.ts#L107); [group-contract.ts:5](../../apps/web/src/features/daily/groups/group-contract.ts#L5); [review-display.ts:62](../../apps/web/src/features/daily/lib/review-display.ts#L62); [paper-figures.ts:7](../../apps/web/src/features/exams/paper-figures.ts#L7); [figure-resolution.ts:23](../../apps/web/src/features/questions/components/figure-resolution.ts#L23); [manual-question.ts:30](../../apps/web/src/features/questions/components/manual-question.ts#L30) | 7 files/7 calls. Exact case-insensitive regex; no version/authority policy. Type/null/DTO/existence/access adapters stay separate. |

Choose these owners only where their documented contract fits. Room fields,
downloads, identity, formatting, private query gates, Groups timestamps and native/
persistent dialogs retain differences. GroupScreen PageSection markup and inactive
legacy cleanup stay low priority. The direct index is refreshed against381 source
files and42 page entries. Existing PageHeader29/32, SearchInput9/9, NativeSelect14/24,
Dialog17/20 and RetryFeedback3/3 adoption counts remain unchanged. Proof is
representative synthetic Chromium, not all-screen/live backend validation.

| Priority / evidence | Impact | Smallest responsible next step |
| --- | --- | --- |
| Resolved: [ImageLightbox](../../apps/web/src/components/ui/image-lightbox.tsx), used by [NewsDetailFeature](../../apps/web/src/features/post/components/news-detail-feature.tsx) | Baseline rendered checks showed no modal focus containment/return and loss of an existing inline body scroll lock after close. | Native button trigger and existing Dialog now own keyboard/modal focus, close/return and scroll locking; image styling and click-on-image behavior remain. No manual body overflow writes/listeners/portal lifecycle. |
| Resolved: [HonorsPage filter](../../apps/web/src/features/recognition/public-pages.tsx) | Ordinary list search now receives shared SearchInput presentation. | Existing Field ID/label, draft, explicit trimmed submission, year preservation/page reset and URL synchronization remain feature-owned. [UserPicker](../../apps/web/src/features/recognition/components.tsx) deliberately retains server-query/native-selection semantics; never replace it with client Combobox. |
| Resolved: [DocumentList](../../apps/web/src/features/documents/components/document-list.tsx), [NewsList](../../apps/web/src/features/post/components/news-list.tsx) | Empty/error presentation now has one ListFeedback owner via direct error use and EmptyState delegation. | Content-shaped skeletons, Documents error-before-loading precedence, News loading-before-error precedence, distinct retry/reset and pinned-feed boundaries stay local. News out-of-range recovery remains feature-composed; no universal query wrapper. |
| CSS-only section reuse: [GroupScreen](../../apps/web/src/pages/daily-groups-page.tsx), around line 73 | Repeats page-section header/content markup, so future PageSection semantics can drift. Its flat work-surface CSS is intentional. | Consider PageSection with existing class override if markup/aria equivalence is preserved; keep group revalidation, membership gates and mounted content rules. Low priority, not a usability defect by itself. |
| Unmounted duplication: [PostManagement](../../apps/web/src/features/post/components/post-management.tsx), lines 60–83; unused PublicPageHeader alias | Legacy search/header and list/dialog implementation can mislead later edits and inflate adoption counts. Current routes mount PostManagementFeature instead; no live-screen defect established. | Verify no downstream imports, then retire the legacy file in a separate authorized cleanup. Do not update it as though it owns the current screen. |

Use this order when choosing an owner: reuse current behavior; extend its
responsible feature/shared composition; use the existing native/Radix mechanism;
only then add a small component for an actual repeated contract. Keep props
about presentation/interaction, not hypothetical query/provider strategies.
Preserve labels/focus, disabled/invalid semantics, 320px/short viewport wrapping,
theme and existing reduced-motion support. UI/UX Pro Max's targeted React guidance
and Vercel Web Interface Guidelines informed this source audit; generated generic
palettes, universal shells and indiscriminate component conversions did not.

## Trying and validating the adopted owners

Run the frontend normally. On `/honors`, edit the subject without submitting, then
press Enter/Tìm: only explicit submission applies the trimmed URL filter and resets
page while preserving year. On a News detail with an image, Enter/Space opens the
image dialog; Tab stays inside, Escape/Close/backdrop returns to the image trigger,
and clicking the image itself keeps it open. Documents/News errors retain their
own explicit retry; filtered News empty state still offers its existing reset.

The owned synthetic route probe is
[`ui-adoption-browser-check.mjs`](../../apps/web/tests/ui-adoption-browser-check.mjs):
`ADOPTION_WEB_URL=http://127.0.0.1:3118 node tests/ui-adoption-browser-check.mjs`
from `apps/web`, with Vite started separately. It blocks external/API traffic,
records source hashes, screenshots and interaction results at desktop/tablet/320px
narrow/short widths in light/dark. `ADOPTION_BASELINE=1` records older behavior
without candidate-only assertions; it is not candidate acceptance. Physical mobile
keyboards, AT speech, other browser engines, backend and dedicated reduced-motion
validation are outside this proof. Existing reduced-motion Dialog behavior remains.

The focused `ADOPTION_FEEDBACK_ONLY=1` probe scrolls each empty/error panel into
view and uses a clearly synthetic stable identity to isolate presentation from
anonymous initialization. Its screenshots do not prove authentication. Current
acceptance and failed-driver/cleanup limits are recorded in the existing audit.

## Mobile and Recognition evidence owners (09/10/2026)

| Owner / source | API and actual adoption | Important boundary / variant |
| --- | --- | --- |
| [EvidencePreviews / EvidenceViewer](../../apps/web/src/components/ui/evidence-gallery.tsx), [CSS](../../apps/web/src/components/ui/evidence-gallery.css) | Two consumer files: [Daily EvidencePanel](../../apps/web/src/features/daily/evidence/evidence-panel.tsx) and [AchievementEvidence](../../apps/web/src/features/recognition/achievement-evidence.tsx). Items carry id/name/image/detail; feature renderImage/renderActions supply authorized media and operations. Previews calls onOpen(item,button); controlled Viewer takes open/selectedId/onSelect, feature feedback, description and close-focus callback. | Shared composed presentation, not shared Daily business logic. Two images/+N, bounded file previews, all-items index, prev/next, native Button/installed Dialog, sticky 44px Close, scrollable short viewport and 2× zoom with keyboard-scrollable image region. Feature gates must remove stale bytes on access revalidation. |
| [raster-image](../../apps/web/src/lib/raster-image.ts) | rasterImageType(bytes) validates bounded PNG/JPEG/WebP/GIF headers; isRasterImageType(type) is only classification, not permission or byte validation. Daily's evidence-preview remains a compatibility re-export; Recognition consumes the same byte owner. | Never display arbitrary HTML/SVG from filename or MIME alone. Existing storage endpoints and file rules remain feature-owned. |
| [AchievementEvidence](../../apps/web/src/features/recognition/achievement-evidence.tsx) → [AchievementRecord](../../apps/web/src/features/recognition/private-pages.tsx) | Private history `/profile/achievements` and admin `/admin/recognition?tab=reviews` use the same adapter. Lazy visible previews; viewer fetches selected bytes, optional download and explicit image retry. Record/version/attachment/session keys isolate lifecycle; metadata revalidation and owner/admin identity gate mounting. | Public profiles/milestones never use it, even for public achievements. API reauthorizes each evidence request; no signed/public URL added. Abort/revoke on unmount. Close returns to thumbnail or record heading if revalidation removed it. Approval/rejection remain separate explicit operations. |
| [HonorEditor](../../apps/web/src/features/recognition/honor-editor.tsx) | Existing native status Select and save contract. Admin list Công bố album passes publishIntent; editor still requires explicit Lưu và công bố. New create defaults Draft; inline validation/server/conflict feedback retains saved draft and input. | Existing upload-before-publication sequence, expectedVersion, participant validation and admin APIs remain. No forced photo requirement or automatic publish. |
| [LoginForm](../../apps/web/src/features/auth/components/login-form.tsx), [auth CSS](../../apps/web/src/layouts/welcome-layout.css) | Password field/error followed by recovery link at ≤900px; 26px normal account→password gap instead of 70px. Desktop remains 26px with above-field link; other auth screens retain their owners. | 52px fields, 44px mobile recovery/reveal, validation/focus/drafts and Turnstile/login contracts unchanged. |
| [MobileNavbar](../../apps/web/src/layouts/components/mobile-navbar.tsx), [CSS](../../apps/web/src/layouts/components/mobile-navbar.css) | One composed owner, two direct consumers: [PublicHeader](../../apps/web/src/layouts/components/public-header.tsx) and [DashboardLayout](../../apps/web/src/layouts/dashboard-layout.tsx), only below768px. `account: ReactNode` supplies existing UserDropdown or anonymous login Link; caller supplies enclosing controlled Sheet/drawer. Logo → ThemeToggle → account/login → labelled Menu;64px row,44px targets,8px gaps. | Public/outside design is the reference. Logo-only mobile; Menu remains visibly labelled with accessible name and Radix expanded/controls semantics. Workspace page-context text sits below the sticky row; desktop/tablet shell differences remain. One CSS owner supplies mobile row spacing/divider/focus; anonymous narrow CTA padding stays with PublicHeader. No auth-layout or room/session ownership moved. |
| [NavigationDrawer](../../apps/web/src/layouts/components/navigation-drawer.tsx), [navigation CSS](../../apps/web/src/layouts/navigation.css) | Public/workspace use the same role-filtered drawer; mobile theme switch unmounted. Caller owns controlled open state, destinations and footer. Workspace returns focus to the actual trigger or new breakpoint entry. | Retain role-filtered destinations, Sheet focus, theme persistence and tablet/desktop display settings. Drawer titles/page titles are not brand labels. |

Rendered evidence uses synthetic data on actual local routes at 320×568,390×900,
768×900 and1440×900, plus375px reviewer checks. This does not assert all-screen,
live authorization, Cloudflare verification or physical-mobile validation.

Narrow anonymous public navigation also keeps the logo from shrinking into the
theme target: at <360px only horizontal navbar/button padding is compacted,
retaining44px height,8px target separation and complete login/Menu labels.

The focused shell probe is [mobile-navbar-browser-check.mjs](../../apps/web/tests/mobile-navbar-browser-check.mjs):
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
[routes.tsx](../../apps/web/src/router/routes.tsx) and actual feature imports.
This is a source ledger, **not42 rendered passes**. No query/authorization engine
or general editor framework was introduced.

| Shared owner | Actual contract / adoption |
| --- | --- |
| [Card](../../apps/web/src/components/ui/card.tsx), [PageSection](../../apps/web/src/components/ui/page-section.tsx), [page-layout.css](../../apps/web/src/components/ui/page-layout.css) | Panel edge/depth; muted/divided headings; mobile16px/desktop24px panel padding. `content-card` is CSS reuse on semantic records, `filter-panel` a standalone search band. Nested toolbars remain flat. |
| [CreationDialog](../../apps/web/src/components/ui/creation-dialog.tsx) + [CSS](../../apps/web/src/components/ui/creation-dialog.css) | `open/onOpenChange`, `title/description`, form-owned `dirty/busy`, `children(close)`. Optional compact `className`; ordered `returnFocusSelector` fallbacks for routed creation, bounded5s lazy-mount focus observation.12 frames in11 actual consumer files (admin Recognition owns two). Explicit success bypasses discard; failed validation/save/upload retains mounted form state. |
| [Dialog](../../apps/web/src/components/ui/dialog.tsx) | Existing installed Radix modal mechanics; shared default44px Close and reserved title space. Daily custom/native owners are separate. |
| [HonorsPage](../../apps/web/src/features/recognition/public-pages.tsx) + [recognition.css](../../apps/web/src/features/recognition/recognition.css) | Cohesive editorial media card; year/search toolbar, metadata/participants/album link. Public/private media adapters and scoring remain separate. |
| [RichTextEditor](../../apps/web/src/components/ui/rich-text-editor.tsx) → [PostForm](../../apps/web/src/features/post/components/post-form.tsx) | Existing nested image dialog; optional upload-busy callback, guarded in-flight dismissal; native44px toolbar controls. Asset-ID thumbnail and URL-content completion remain distinct. No new upload framework. |

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
| [about-page.tsx](../../apps/web/src/pages/about-page.tsx) | Inherited PageSection panel/heading; no create entry. |
| [achievement-profile-page.tsx](../../apps/web/src/pages/achievement-profile-page.tsx) | Public Recognition: inherited sections and year-grouped milestones with muted bands/divided chronology; public filtering retained, no private-evidence mounting or create entry. |
| [admin/recognition-page.tsx](../../apps/web/src/pages/admin/recognition-page.tsx) | Local Recognition card records/filter band; Honor create/edit/explicit publish and admin achievement submission use CreationDialog. |
| [admin/users/admin-users-page.tsx](../../apps/web/src/pages/admin/users/admin-users-page.tsx) | Local filter-panel + inherited page-table; account operations/permissions retained; no user-create control. |
| [assessment-import-page.tsx](../../apps/web/src/pages/assessment-import-page.tsx) | Inherited panels; PDF import action opens compact CreationDialog. Job polling/review/publish remain on page after upload. |
| [auth/forgot-password-page.tsx](../../apps/web/src/pages/auth/forgot-password-page.tsx) | Intentional auth/floating-field shell; recovery is not content creation. |
| [auth/login-page.tsx](../../apps/web/src/pages/auth/login-page.tsx) | Intentional auth shell; working password/Turnstile/OAuth unchanged. Create-account link opens routed modal. |
| [auth/register-page.tsx](../../apps/web/src/pages/auth/register-page.tsx) | Compact routed CreationDialog around existing register/verification/resume owners; single shrinkable grid track, wrapping resume action and44px password controls; challenge persistence and Turnstile unchanged. |
| [auth/reset-password-page.tsx](../../apps/web/src/pages/auth/reset-password-page.tsx) | Intentional auth shell; reset semantics untouched. |
| [auth/verify-email-page.tsx](../../apps/web/src/pages/auth/verify-email-page.tsx) | Intentional verification shell; no new creation/policy. |
| [competitions-page.tsx](../../apps/web/src/pages/competitions-page.tsx) | Local guidance surface + existing header/actions; no invented live registration feature. |
| [daily-groups-page.tsx](../../apps/web/src/pages/daily-groups-page.tsx) | Intentional notebook/group workspace; existing native Create and installed/custom task dialogs retained, pending recovery untouched. |
| [daily-owner-page.tsx](../../apps/web/src/pages/daily-owner-page.tsx) | Intentional flat notebook; existing task/evidence/reflection dialogs, serialized sync/guards unchanged. |
| [daily-shared-review-page.tsx](../../apps/web/src/pages/daily-shared-review-page.tsx) | Intentional read-only notebook/private revalidation; section shadow/header-fill opt-out; feedback owner retained. |
| [daily-week-page.tsx](../../apps/web/src/pages/daily-week-page.tsx) | Intentional weekly calendar/reflection/workspace; no forced card/grid or new creation flow. |
| [dashboard/categories/admin-categories-page.tsx](../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx) | Inherited table surface; scrollable Radix tabs keep44px triggers/color-only transitions; SystemCategoryFormModal uses compact CreationDialog for category/subject/tag; floating fields retained. |
| [dashboard/documents/documents-management-page.tsx](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx) | Local standalone filter-panel + inherited ManagementListRow; DocumentForm uses spacious CreationDialog and file/metadata/save gates. |
| [dashboard/posts/post-management-page.tsx](../../apps/web/src/pages/dashboard/posts/post-management-page.tsx) | Local filter-panel + inherited rows/Card; PostForm uses spacious CreationDialog with nested editor choosers/busy propagation. |
| [dashboard-page.tsx](../../apps/web/src/pages/dashboard-page.tsx) | Inherited section header/surface and local shared shortcut tiles; links to feature creation flows, no new mutation. |
| [document-detail-page.tsx](../../apps/web/src/pages/document-detail-page.tsx) | Local metadata/preview/description content-card; shared feature-owned reader/skeleton viewport scales to short phones; complete edit/download labels stack on mobile. Reading/download/identity/iframe contract retained; not a creation dialog. |
| [documents-page.tsx](../../apps/web/src/pages/documents-page.tsx) | Search-first filter panel with visible labels/active removals; DocumentCard/ListItem now group subject/kind/tags/title/description with shared DocumentThumbnail and explicit open. Two tablet/three desktop columns; error-count precedence and aria-pressed view state. Existing URL/query/pagination/download contracts retained. |
| [exam-drafts-page.tsx](../../apps/web/src/pages/exam-drafts-page.tsx) | Feature-local ExamListItem shares title/version/points/release grouping across draft/paper lists with content-card tokens; Tạo đề opens addressable new-editor modal. |
| [exam-editor-page.tsx](../../apps/web/src/pages/exam-editor-page.tsx) | New-only spacious CreationDialog; existing edit route/PageSection remains. Save handoff/version/publish eligibility retained. |
| [exam-paper-page.tsx](../../apps/web/src/pages/exam-paper-page.tsx) | Purposeful frozen-paper reader; release/solution/figure gates unchanged, no per-question decorative nesting. |
| [exam-papers-page.tsx](../../apps/web/src/pages/exam-papers-page.tsx) | Feature-local ExamListItem shares title/version/points/release grouping with drafts; native44px title links/return paths retained; no creation entry. |
| [exam-preview-page.tsx](../../apps/web/src/pages/exam-preview-page.tsx) | Purposeful staff preview, shared header/buttons; no new creation policy. |
| [history-page.tsx](../../apps/web/src/pages/history-page.tsx) | Local guidance surface; feature-availability explanation and real destinations retained. |
| [home-page.tsx](../../apps/web/src/pages/home-page.tsx) | Local Home news card edge/depth; cinematic hero/notebook purpose remains. Registration link uses routed modal. |
| [honor-detail-page.tsx](../../apps/web/src/pages/honor-detail-page.tsx) | Inherited sections + responsive existing gallery/reader; public photo query/viewer unchanged. |
| [honors-page.tsx](../../apps/web/src/pages/honors-page.tsx) | Local bounded16:10 cards with contiguous metadata/participant/album action and compact mobile year/search rows. |
| [my-achievements-page.tsx](../../apps/web/src/pages/my-achievements-page.tsx) | Local grouped records + inherited panels; Thêm/Bổ sung open CreationDialog; protected evidence/view/download unchanged. |
| [news-detail-page.tsx](../../apps/web/src/pages/news-detail-page.tsx) | Purposeful article/author/reading layout; existing lightbox retained, not wrapped wholesale into cards. |
| [news-page.tsx](../../apps/web/src/pages/news-page.tsx) | Local editorial card edge/depth, filter-panel search and occupied responsive pinned columns; pinned/feed membership, retries and URL submission unchanged. |
| [not-found-page.tsx](../../apps/web/src/pages/not-found-page.tsx) | Intentional welcome/fallback identity; no forced shell/card. |
| [practice-page.tsx](../../apps/web/src/pages/practice-page.tsx) | Local guidance surface; no fake practice/create feature. |
| [profile-page.tsx](../../apps/web/src/pages/profile-page.tsx) | Inherited PageSection/Card surfaces; identity uses surface tokens and existing compact two-column composition at≤1099px; avatar/security editor/chooser and private revalidation remain task-specific. |
| [question-bank-page.tsx](../../apps/web/src/pages/question-bank-page.tsx) | Local filter-panel + CardHeader metadata/status, CardContent question body and CardFooter wrapping actions; actual permissions/pending callbacks preserved; create link opens addressable new-editor modal. |
| [question-detail-page.tsx](../../apps/web/src/pages/question-detail-page.tsx) | New-only spacious CreationDialog; manual create context/actions avoid duplicate page heading. Existing read/edit/schema/figures/handoff stay domain-owned. |
| [rankings-page.tsx](../../apps/web/src/pages/rankings-page.tsx) | Local filter-panel; RankingList owns one content-card/context band/divided ordered comparison rows and44px identity links; inherited profile panels; no editorial/scored-policy merge. |
| [study-room-page.tsx](../../apps/web/src/pages/study-room-page.tsx) | Intentional persistent room/scene/player; session lifecycle/settings/track dialogs unchanged; no frame remount for appearance. |
| [subjects-page.tsx](../../apps/web/src/pages/subjects-page.tsx) | Local catalogue edge/depth, muted compact toolbar and purposeful two-column directory; no invented subject-create permission. |
| [toolkit-page.tsx](../../apps/web/src/pages/toolkit-page.tsx) | Local GPA workspace/result surfaces, divided compact editable rows and compact Add-course modal using actual calculateGpa rules. Room creation now spacious CreationDialog; persistent room navigation/access unchanged. |

### Creation entry coverage and boundaries

| Entry / smallest actual owner | Modal and retained semantics |
| --- | --- |
| Admin Honors / [HonorEditor](../../apps/web/src/features/recognition/honor-editor.tsx) | CreationDialog: draft default, explicit publish, expectedVersion, eligibility and upload-before-publication; failures retain draft/files. Child participants/photos stay within editor. |
| Personal/admin achievements / [AchievementEditor](../../apps/web/src/features/recognition/achievement-editor.tsx) | CreationDialog in private/admin page owners; explicit submit/re-submit, authorized identity and bounded evidence, pending/error gates. |
| Documents / [DocumentForm](../../apps/web/src/features/documents/components/document-form.tsx) | CreationDialog; RHF dirty state includes dropdowns and file/error state, upload busy, feature-owned metadata/save/retry. |
| Posts / [PostForm](../../apps/web/src/features/post/components/post-form.tsx) | CreationDialog; explicit draft/publish behavior unchanged, nested Tiptap image/link dialogs, in-flight uploads block parent close. |
| Categories/subjects/tags / [SystemCategoryFormModal](../../apps/web/src/features/system-categories/components/system-category-form-modal.tsx) | Compact CreationDialog; existing code/name generation/validation and pending/failure drafts. |
| Questions / [QuestionDetailPage](../../apps/web/src/pages/question-detail-page.tsx), [ManualQuestionWorkspace](../../apps/web/src/features/questions/components/manual-question-form.tsx) | `/r/questions/new` remains deep-linkable but opens CreationDialog; explicit dirty close, saved-ID handoff preserved. Option/part/scientific-block Add stays within parent editor. Duplicate existing question remains a distinct explicit server operation. |
| Exams / [ExamEditorPage](../../apps/web/src/pages/exam-editor-page.tsx) | `/r/exams/new` opens CreationDialog; version/save/publish/frozen gates unchanged. Adding published question placements stays in this editor. |
| PDF import / [AssessmentImportPage](../../apps/web/src/pages/assessment-import-page.tsx) | Compact CreationDialog; selected-file validation/failure retention, pending dismissal blocked; ongoing analysis/review remains on page. |
| Study-room create / [StudyRoomsLobby](../../apps/web/src/features/study-room/components/study-rooms-lobby.tsx) | CreationDialog instead of inline form; native constraints/policy/access, failure retention, pending close, success enters room. Track request is already its own installed Dialog; player is not remounted. |
| GPA Add / [GpaCalculator](../../apps/web/src/features/toolkit/components/gpa-calculator.tsx) | Compact CreationDialog; credits/grade use existing calculation rules before explicit insertion. Existing partially edited rows/storage/results remain editable. |
| Account creation / [RegisterPage](../../apps/web/src/pages/auth/register-page.tsx) | Addressable compact CreationDialog; register/verification/resume form owners, secure session, action/token reset and resumable challenge retained. No OTP sent by probes. |
| Daily task/evidence/reflection/group creation | Already-modal [DailyDialogHeader](../../apps/web/src/features/daily/ui/daily-dialog-header.tsx) / installed/native feature owners retained. Native group dialog includes separately pending recovery. Serialized autosync, dirty/navigation/Submit and sharing/private gates stay with Daily; no replacement based only on markup similarity. |
| Native file choices, form-row/options/parts/placements, ownership transfer, feedback | Subordinate editing/permission workflows, not independent entity-create destinations. Keep current parent/chooser or existing modal and business invariants. |
| Legacy unrouted PostManagement/PostEditor | Not an active entry point in routes.tsx; retained source excluded from mounted creation counts. No misleading claim that legacy imports are routed adoption. |

The owned [visual/modal browser probe](../../apps/web/tests/visual-layout-browser-check.mjs)
uses synthetic intercepted data and locally generated imagery only. Baseline is a
frozen `f7db010` web tree plus the four pending Daily runtime files, never an env
copy. `VISUAL_WEB_URL` selects an owned Vite with env loading disabled;
`VISUAL_BASELINE=1` records before, `VISUAL_CREATION_ONLY=1` narrows lifecycle checks.
Representative dimensions are320×568,390×844,820×900,1440×900 and320×360 across
light/dark. Actual evidence/results and candidate boundary accounting belong in
the [existing status](../reviews/ux-flow-audit.md), not an all-screen rendered claim.

### Responsible local compositions beyond Honors

These are actual owners, not new universal components. Their links complement the
42-page ledger above; source inspection is distinct from representative rendering.

| Owner | Purpose / retained contract |
| --- | --- |
| [public-news-feature.css](../../apps/web/src/features/post/components/public-news-feature.css) | Task-first discovery band, compact editorial rows and `auto-fit/minmax` occupied pinned columns;64px phone media remains beside titles. Queries and membership are owned by PublicNewsFeature. |
| [document-reader.css](../../apps/web/src/features/documents/components/document-reader.css) → [DocumentDetailPage](../../apps/web/src/pages/document-detail-page.tsx) | One viewport owner for loaded/skeleton reader, short-phone dimensions; native iframe/fallback and feature downloads untouched. Mobile header actions stack rather than clip labels. |
| [RankingList](../../apps/web/src/features/recognition/ranking-presentation.tsx) + [CSS](../../apps/web/src/features/recognition/ranking-presentation.css) | Existing ordered rows share one `content-card` surface/context band. Domain presentation model still owns rank/points/links;44px native profile activation. |
| [PublicAchievementMilestones](../../apps/web/src/features/recognition/achievement-presentation.tsx) + [CSS](../../apps/web/src/features/recognition/achievement-presentation.css) | Bounded year groups/divided records inside existing PageSection, no nested elevated cards or private-media adapter. Public projection/filter model remains owner. |
| [profile.css](../../apps/web/src/features/user/components/profile.css) | Existing identity compact grid extended to stacked tablet layout, standalone surface tokens; actual form/avatar/account owners keep draft/focus/access authority. |
| [toolkit.css](../../apps/web/src/features/toolkit/components/toolkit.css) | GPA row dividers/compact spacing, existing result hierarchy. Room discovery/player remain purposeful flat/persistent surfaces. |
| [AdminCategoriesPage](../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx) | Installed Radix Tabs and horizontal internal scroll retained;44px triggers. Modal/data-table/metadata feedback remain existing owners. |
| [ExamListItem](../../apps/web/src/features/exams/components/exam-read.tsx) | One feature-local draft/paper list composition; bounded native title Link with a shrinkable text child, version/points badges and separate release/timezone line. Frozen reader bodies/gates remain separate. |
| [QuestionBankPage](../../apps/web/src/pages/question-bank-page.tsx) | Existing CardHeader/Content/Footer now separate metadata/status, question summary and wrapping44px actions. Search submission, URL filters, duplicate/archive/restore permissions and callbacks retain their original owners. |

`VISUAL_BROAD=1` on the existing browser probe exercises nonempty fixtures for these
families plus assessment lists across320/390/820/1440 and320×360, light/dark. Its
follow-up before tree is the frozen accepted56-path candidate, separate from the
original HEAD-based comparisons. No env files are copied. Exact completed checks,
interrupted runs and omissions are recorded in the existing status, not inferred
from this source ledger.


### Document discovery preview storage cases (10/10/2026)

| Owner / actual use sites | API / boundary |
| --- | --- |
| [DocumentThumbnail](../../apps/web/src/features/documents/components/document-thumbnail.tsx), [discovery CSS](../../apps/web/src/features/documents/components/document-discovery.css) | `src?: string|null`, `compact?: boolean`. Three consumer files/three sites: [DocumentCard](../../apps/web/src/features/documents/components/document-card.tsx), [DocumentListItem](../../apps/web/src/features/documents/components/document-list-item.tsx), [DashboardDocumentList](../../apps/web/src/features/documents/components/dashboard-document-list.tsx). Inner state resets when src changes; lazy image load/error, fixed frame/whole-page containment and readable fallback. No general media framework, original fetch or client URL transformation. |
| [DocumentFilters](../../apps/web/src/features/documents/components/document-filters.tsx) | Existing SearchInput + Combobox owners; visible labels/selected chips, Enter/Tìm trim, selectors reset page only, reset preserves view/unrelated params. Subject and existing tags support subject/topic discovery; kind/context distinguishes similarly named records. |
| [DocumentServiceImpl.enrich](../../apps/api/src/main/java/me/nghlong3004/olympic/document/service/impl/DocumentServiceImpl.java) → [CloudinaryStorageService.getThumbnailUri](../../apps/api/src/main/java/me/nghlong3004/olympic/storage/service/impl/CloudinaryStorageService.java) | Existing optional thumbnailUrl DTO field, no new schema. Only Cloudinary + DOCUMENT + application/pdf requests preview resolution. Only existing generated `documents/UUID.pdf` keys yield an unsigned HTTPS `image/upload`, pg1, c_limit600×800, JPG candidate; all other keys yield null. Original download/access APIs remain unchanged. |

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
The [existing status](../reviews/ux-flow-audit.md) records exact candidate and learner
walks; synthetic fixtures are not evidence of live Cloudinary authorization.


### Documents/News discovery owners and task evidence (10/10/2026)

| Actual owner / mounted adoption | Purpose / invariant |
| --- | --- |
| [PublicNewsFeature](../../apps/web/src/features/post/components/public-news-feature.tsx) → [NewsPage](../../apps/web/src/pages/news-page.tsx) | One search/type/active-filter band before pinned content; SearchInput,44px Button/native type Links, PageHeader and existing pagination/feedback. Search matches title, on-submit trim and feature URL/reset rules unchanged. Priority query enabled only unfiltered page1, feed9/publishedAt descending; pinned remain in feed. |
| [PostListItem](../../apps/web/src/features/post/components/post-list-item.tsx) + [CSS](../../apps/web/src/features/post/components/public-news-feature.css) | Two board call sites: NewsList feed and PublicNewsFeature pinned band. One Link groups type/date/title/deadline/summary/open cue; supporting64px phone or160px wide image, error removes image only. Distinct card variant remains for related posts; no competing shared primitive. |
| [NewsDetailFeature](../../apps/web/src/features/post/components/news-detail-feature.tsx) → NewsDetailPage |72ch body measure and compact lead/related spacing; existing RichTextViewer, ArticleToc, ImageLightbox Dialog, progress/share/author/deadline/related owners retained. TOC uses aria-expanded/controls; no new lightbox or reading policy. |
| [DocumentThumbnail](../../apps/web/src/features/documents/components/document-thumbnail.tsx) | Three actual consumers listed in the storage reference above. Reserved3:4 page containment and loading/error/unavailable states; no original PDF fetch. Document filters/cards/list keep subject/kind/tags/description/open and independent retries. |

No new route entries or global adoption counts are implied. The42-page ledger is
inherited broad source coverage; this supplement inspects and renders Documents,
News, their readers and document-management thumbnail ownership specifically.
[Design rationale and public references](web-ui.md#documents-and-news-catalogue--editorial-discovery-10102026)
record concrete alternatives and token decisions. The existing browser probe has
`VISUAL_DOCUMENTS=1` / `VISUAL_NEWS=1` modes, `VISUAL_BASELINE=1`,
`VISUAL_MATRIX_EXTRA=1` for complementary themes and
`VISUAL_DISCOVERY_MATRIX_ONLY=1` for layout-only runs. Fixtures contain synthetic
content/images, never screenshot personal data. Results/side-by-side comparisons,
keyboard/find/open/return/retry observations and interrupted probes are recorded in
[existing status](../reviews/ux-flow-audit.md), not inferred from import counts.


### Admin recovery and discovery owners (10/10/2026)

Follow-up to the [a4821ed admin task audit](../reviews/ux-flow-audit.md#admin-ui-task-audit-a4821ed).
These changes preserve the existing creation/publication/permission contracts.
The current remedy disposition and bounded evidence live in the
[existing status](../reviews/ux-flow-audit.md#admin-ui-audit-remedies-20261010).

| Owner / actual consumers | Contract and task benefit |
| --- | --- |
| [OptionQueryFeedback](../../apps/web/src/components/ui/option-query-feedback.tsx) | Presentation only: `label`, `pending`, `error`, `retrying`, `onRetry`. Pending status precedes error; error uses InlineRetryFeedback and Button loading/disablement. Six consumer files: Documents management, Question Bank, manual question workspace, legacy QuestionEditForm, ExamForm and import AssessmentDraftCard. Callers retain values, queries, dependent subject/topic gates and drafts. A failed options request is never represented as a genuinely empty list. |
| [post-status](../../apps/web/src/features/post/post-status.ts) → DashboardPostList / PostManagementFeature | `postDisplayStatus` derives EXPIRED only for PUBLISHED; draft/archive keep their real status and separate deadline. `postManagementStatusQuery` maps EXPIRED to existing published+expired predicates and active PUBLISHED to published+not-expired. No API/filter/publication policy added. |
| [PostManagementFeature](../../apps/web/src/features/post/components/post-management-feature.tsx), [DocumentsManagementPage](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx) → replaceListParam | Search keeps500ms debounce; status or subject/category selects use existing request fields. URL-backed filters reset one-based page; Documents pairs its subject/kind controls on phones. Reset removes only each feature's filters/page, preserving other URL context. Posts counters stay informational and become compact on phones. CreationDialog/form owners unchanged. |
| Posts / Documents / [AdminCategoriesPage](../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx) → AlertDialog | Pending mutation blocks every close request, not just Cancel. Failure keeps target and visible inline error; idle cancel and success close remain available. Mutation/callback/policy authority stays local; no universal delete state engine. |
| [AdminUsersPage](../../apps/web/src/pages/admin/users/admin-users-page.tsx) | Local UserIdentity/UserPermissions are reused in mobile record rows and desktop Table. Below768px identity, email, role, permissions, joined date and44px action stay together; wider table retains headers with tablet scroll guidance. Action accessible names identify the user; programmatically opened permission Dialog restores focus to its exact trigger. One query/pagination/permission mutation owner. |
| [DashboardDocumentList](../../apps/web/src/features/documents/components/dashboard-document-list.tsx), [DashboardPostList](../../apps/web/src/features/post/components/dashboard-post-list.tsx) | ManagementListRow remains shared. Document titles wrap to reveal distinguishing suffixes; native detail/open targets retained. POST-owned thumbnail reserves64×48 on phones /96×64 wider and falls back honestly on error. DocumentThumbnail/PDF policy remains the separate existing owner. |
| [import-session](../../apps/web/src/features/assessment/import-session.ts), [AssessmentImportPage](../../apps/web/src/pages/assessment-import-page.tsx), [hooks](../../apps/web/src/features/assessment/hooks/use-assessment-import.ts) | `?importId=UUID` restores a known job through authorized endpoints, not a new upload. Invalid IDs make no job request. Query identities include account/token revision, consume AbortSignal and revalidate on mount. Same-account retained review rows preserve local corrections through transient token/query failures; placeholders/errors never authorize media or writes. Account changes reset local rows.401/403/404/410 suppress cached private content; transient failures retain text and expose explicit retry. No invented job lifetime or history. |
| [AssessmentDraftCard](../../apps/web/src/features/assessment/components/assessment-draft-list.tsx) | Caught save/approve/reject failure focuses role=alert and retains fields. One row-operation lock gates sibling fields/actions; per-job mutation keys coordinate publish gates. Approve still saves first. Denied writes revalidate authorized status/drafts; media mounts only after successful current checks. |
| [Recognition QueryFeedback](../../apps/web/src/features/recognition/components.tsx), [ExamProblem](../../apps/web/src/features/exams/components/exam-feedback.tsx) | Required fetching/busy prop is passed by all direct consumers; retries remain disabled throughout cached refetch. Recognition section buttons have aria-current for the active destination; existing native navigation remains, not simulated tab semantics. |

Intentional variants remain: desktop relational tables, immediate permission changes,
exam frozen/release gates, Recognition review/publication and private-media adapters,
feature-specific metadata validation, reader layouts and Daily native-dialog/autosync
contracts. These changes do not consolidate business state merely because markup
looks similar. The seven-path Daily recovery and unrelated auth/deploy status remain
separately pending; source adoption is not all-screen/live validation.
