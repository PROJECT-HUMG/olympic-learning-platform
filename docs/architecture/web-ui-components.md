# Shared UI owners and screen adoption

[UI authority](web-ui.md) · [Frontend guide](../../apps/web/README.md) · [Route definitions](../../apps/web/src/router/routes.tsx) · [Route constants](../../apps/web/src/router/route-constants.ts)

## Scope and how to read this reference

Source inventory established on 09/10/2026 from the accepted, uncommitted UI candidate
`f2cc0db66460a4b7c6c58007461f42e009eca56e9c3aac8b190523f3667e82c5`, on HEAD
`0f06fcbaf757d06f243b7385e3ca68fc0b0d3530`. All 42 page entry files, their
route aliases, layouts and relevant feature owners were inventoried. Adoption below
reflects the bounded follow-up implementation (Honors search, Dialog lightbox and
shared list feedback, then compact mobile headers); earlier manifests still identify their earlier bytes exactly.
The route inventory is source evidence, not all-screen rendered or backend validation. The preceding
candidate's representative Chromium checks remain bounded to their recorded
screens/states; see the [existing audit](../reviews/ux-flow-audit.md).

Local commit boundary: the shared UI product changes and this reference belong
to the scoped UI commit recorded in the [existing status](../reviews/ux-flow-audit.md).
The separately accepted seven-path Daily recovery remains uncommitted: creation-owned
error feedback, task-row invalid/error association and the native Create-dialog44px
Close fix are pending Daily changes, not behavior shipped by this UI commit. Daily's
mobile title token adjustment is included in UI scope. The adoption table applies
to committed UI owners; references to pending Daily recovery are marked explicitly.

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
| `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | [auth page wrappers](../../apps/web/src/pages/auth) → [auth forms](../../apps/web/src/features/auth/components) | Shared floating FormField/Button, social buttons and TurnstileChallenge where enabled; feature-owned heading/error/OTP/resume compositions in AuthCardLayout. No PageHeader/list filters. |
| `/dashboard`, `/r/dashboard` | [DashboardPage](../../apps/web/src/pages/dashboard-page.tsx) | PageHeader/PageSection, shared links/buttons; role-aware shortcuts are intentional domain content. |
| `/profile` | [ProfilePage](../../apps/web/src/pages/profile-page.tsx) → [profile/security/avatar components](../../apps/web/src/features/user/components) | PageHeader/PageSection, floating FormField, Dialog/AlertDialog and shared AvatarImage; account identity and mounted-editor refresh handling stay feature-owned. |
| `/profile/achievements` | [MyAchievementsPage](../../apps/web/src/pages/my-achievements-page.tsx) → [private-pages](../../apps/web/src/features/recognition/private-pages.tsx), [AchievementEditor](../../apps/web/src/features/recognition/achievement-editor.tsx) | PageHeader/PageSection, NativeSelect, domain QueryFeedback/Field, native checkbox/disclosure. Visibility/evidence/submission are explicit feature operations. |
| `/daily` including date/history/week query views | [DailyOwnerPage](../../apps/web/src/pages/daily-owner-page.tsx) → [DailyPlanEditor](../../apps/web/src/features/daily/components/daily-plan-editor.tsx) | PageHeader/PageSection, Input/Textarea/Checkbox/NativeSelect, shared dialogs; domain date/history/sync/empty/evidence composition. Flat task surface is intentional. |
| `/daily/week` | [DailyWeekPage](../../apps/web/src/pages/daily-week-page.tsx) → [DailyWeekEditor](../../apps/web/src/features/daily/components/daily-week-editor.tsx) | PageHeader, domain StudyDatePicker/StudyDisclosure/StudyWeekStats/DailySyncStatus; local weekly reflection layout. |
| `/daily/groups`, `/daily/groups/:groupId` | [DailyGroupsPage](../../apps/web/src/pages/daily-groups-page.tsx) → [GroupList/GroupConsent](../../apps/web/src/features/daily/groups/group-controls.tsx) | PageHeader, NativeSelect and domain date/identity/empty/retry; hand-written `.page-section` markup is CSS reuse. Creation keeps its native modal dialog; creation-owned error/44px Close are pending Daily recovery, excluded from this UI commit. |
| `/daily/groups/:groupId/reviews/:ownerId` (day/week) | [DailySharedReviewPage](../../apps/web/src/pages/daily-shared-review-page.tsx) | PageHeader/PageSection and domain date/progress/disclosure/feedback; read-only plan and private revalidation gates are intentional. |
| `/practice`, `/history` | [PracticePage](../../apps/web/src/pages/practice-page.tsx), [HistoryPage](../../apps/web/src/pages/history-page.tsx) | PageHeader, shell and guidance-action CSS/Button; truthful feature guidance, not implemented exercise/history flows. |
| `/competitions`, `/about` | [CompetitionsPage](../../apps/web/src/pages/competitions-page.tsx), [AboutPage](../../apps/web/src/pages/about-page.tsx) | Public PageHeader/shell; About also PageSection. Guidance/content rather than list filters. |
| `/r/documents` | [DocumentsManagementPage](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx) → [DocumentForm](../../apps/web/src/features/documents/components/document-form.tsx), [DashboardDocumentList](../../apps/web/src/features/documents/components/dashboard-document-list.tsx) | PageHeader/SearchInput/AppPagination/toolbar CSS; RHF Form, Radix Select, Dialog/AlertDialog, EmptyState. Metadata/loading/retry/upload behavior remains domain-owned. |
| `/r/posts` | [PostManagementPage](../../apps/web/src/pages/dashboard/posts/post-management-page.tsx) → [PostManagementFeature](../../apps/web/src/features/post/components/post-management-feature.tsx), [PostForm](../../apps/web/src/features/post/components/post-form.tsx) | PageHeader/SearchInput/AppPagination/toolbar CSS; RHF Form, Radix Select, Dialog/AlertDialog, EmptyState and RichTextEditor. |
| `/admin/users` | [AdminUsersPage](../../apps/web/src/pages/admin/users/admin-users-page.tsx) | PageHeader/SearchInput/AppPagination/toolbar CSS; shared Dialog/Table/Badge, local row permissions and feedback. |
| `/admin/categories` | [AdminCategoriesPage](../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx) → [category components](../../apps/web/src/features/system-categories/components) | PageHeader, Tabs, Table, Dialog/AlertDialog, floating FormField, Skeleton. Tabbed metadata tasks intentionally have no list-search bar. |
| `/admin/recognition` | [AdminRecognitionPage wrapper](../../apps/web/src/pages/admin/recognition-page.tsx) → [admin-page](../../apps/web/src/features/recognition/admin-page.tsx), [HonorEditor](../../apps/web/src/features/recognition/honor-editor.tsx), AchievementEditor | PageHeader/PageSection, NativeSelect, Dialog and domain QueryFeedback/Field/UserPicker; flat review list retained. UserPicker is server search + native selection, not Combobox. |
| `/r/questions` | [QuestionBankPage](../../apps/web/src/pages/question-bank-page.tsx) | PageHeader/SearchInput/NativeSelect/AppPagination/toolbar CSS; Card/Skeleton and feature feedback. One bounded search/filter band. |
| `/r/questions/new`, `/r/questions/:id` | [QuestionDetailPage](../../apps/web/src/pages/question-detail-page.tsx) → [ManualQuestionWorkspace](../../apps/web/src/features/questions/components/manual-question-form.tsx) or legacy editor | Both use PageHeader/primitives; manual/scientific branch uses NativeSelect/PageSection, legacy branch Radix Select/floating title FormField. Schema/nullable adapters/figure gates explain different form owners. |
| `/r/questions/import` | [AssessmentImportPage](../../apps/web/src/pages/assessment-import-page.tsx) → [assessment components](../../apps/web/src/features/assessment/components) | PageHeader/Card/Skeleton/Button, compact NativeSelect in mounted draft review; local status/progress/retry distinguish polling from restarting a job. |
| `/r/exams` | [ExamDraftsPage](../../apps/web/src/pages/exam-drafts-page.tsx) → [ExamDraftList](../../apps/web/src/features/exams/components/exam-read.tsx) | Domain Shell composes PageHeader/shell CSS; flat lists, ExamLoading/ExamProblem. No list search/pagination currently offered. |
| `/r/exams/new`, `/r/exams/:examId` | [ExamEditorPage](../../apps/web/src/pages/exam-editor-page.tsx) → [ExamEditor/PublishedBank](../../apps/web/src/features/exams/components/exam-editor.tsx) | PageHeader/PageSection/NativeSelect/SearchInput/AppPagination; draft/version/publish and nested-form rules remain local. |
| `/r/exams/:examId/preview` | [ExamPreviewPage](../../apps/web/src/pages/exam-preview-page.tsx) → [ExamPreview](../../apps/web/src/features/exams/components/exam-read.tsx) | Domain Shell + PageHeader, shared Button; solution toggle and question renderer stay task-specific. |
| `/r/exams/papers`, `/exams`; `/r/exams/papers/:paperId`, `/exams/:paperId` | [ExamPapersPage](../../apps/web/src/pages/exam-papers-page.tsx), [ExamPaperPage](../../apps/web/src/pages/exam-paper-page.tsx) → [exam-read](../../apps/web/src/features/exams/components/exam-read.tsx) | Domain Shell/PageHeader/feedback, flat list/frozen-paper renderer; staff solution toggle versus student release/content gate. No shared filter bar in these branches. |
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

## Other reusable patterns: use the actual owner

| Pattern | Source / API / current call sites | Selection guidance |
| --- | --- | --- |
| Actions and pending buttons | [Button](../../apps/web/src/components/ui/button.tsx): variant/size/asChild/loading; loading adds spinner/aria-busy and disables native button. Used across forms, lists and dialogs. | Set `type="button"` for non-submit actions. `asChild` links retain anchor semantics; native disabled does not disable a link. Feature owns request gate. |
| Two different FormFields | [floating FormField](../../apps/web/src/components/ui/form-field.tsx): id/label/error/helperText, 52px notch/password reveal; auth, profile/password, category modal, legacy question title. [RHF Form](../../apps/web/src/components/ui/form.tsx): Controller/FormItem/FormLabel/FormControl/FormMessage; DocumentForm/PostForm. | They share a name, not an API. Alias imports when necessary. Preserve existing controlled/default values and validation owner; RHF associates errors but does not itself announce every change. |
| Pagination | [AppPagination](../../apps/web/src/components/ui/app-pagination.tsx): one-based currentPage/totalPages/onPageChange, default numbered or compact variant; hides when totalPages ≤ 1. [Pagination primitives](../../apps/web/src/components/ui/pagination.tsx) are its markup owner. | Documents/News/management/Users/question bank/PublishedBank reuse it. Recognition [Pager](../../apps/web/src/features/recognition/components.tsx) adapts zero-based API. Do not replace room seat paging or calendars with collection paging. |
| Initial route/session loading | [RouteSuspense](../../apps/web/src/router/route-suspense.tsx) → [PageLoading](../../apps/web/src/components/ui/page-loading.tsx); [SessionLoading](../../apps/web/src/router/guards/session-loading.tsx), [SessionError](../../apps/web/src/router/guards/session-error.tsx); [startup-preloader](../../apps/web/src/app/startup-preloader.ts). | Lazy-route/auth readiness is not query loading; query/filter changes must not replay startup. Guards withhold unauthorized children. |
| Query feedback and skeletons | [Skeleton](../../apps/web/src/components/ui/skeleton.tsx); domain document/post/import skeletons. Recognition [QueryFeedback](../../apps/web/src/features/recognition/components.tsx), exams [ExamLoading/ExamProblem](../../apps/web/src/features/exams/components/exam-feedback.tsx), Daily [DailySyncStatus](../../apps/web/src/features/daily/ui/daily-sync-status.tsx) and [Retry](../../apps/web/src/features/daily/groups/group-controls.tsx). | Pending/error/empty composition and retry target remain feature-owned. Use one meaningful pending region, decorative skeleton children; do not convert private revalidation or conflict into generic loading/empty. |
| Empty/error lists | [ListFeedback](../../apps/web/src/components/ui/list-feedback.tsx): icon/title/children/actions, `tone="empty"` (status) or `tone="error"` (alert), wrapping description/action regions. [EmptyState](../../apps/web/src/components/ui/empty-state.tsx) delegates the empty variant; four feature consumers: public DocumentList/NewsList and DashboardDocumentList/DashboardPostList. | DocumentList and NewsList reuse ListFeedback errors but retain state precedence, request gates, retry callbacks and copy. News empty reset remains a separate explicit action. No query/loading/persistence engine. [StudyEmpty](../../apps/web/src/features/daily/ui/study-notebook.tsx) remains a compact domain owner. |
| Dialogs and confirmation | [Dialog](../../apps/web/src/components/ui/dialog.tsx), [AlertDialog](../../apps/web/src/components/ui/alert-dialog.tsx), [Sheet](../../apps/web/src/components/ui/sheet.tsx): installed Radix semantics/portal/focus/short-viewport scrolling. [DailyDialogHeader](../../apps/web/src/features/daily/ui/daily-dialog-header.tsx), [useDailyConfirm](../../apps/web/src/features/daily/ui/use-daily-confirm.tsx) compose them. | Document/post/user/category/room/evidence dialogs reuse them. Native group Create and [RoomMusicDialog](../../apps/web/src/features/study-room/components/room-music-dialog.tsx) are existing feature owners; preserve close/focus/request gates and persistent media. File/permission/beforeunload prompts stay native. |
| Menus, popovers and date picker | [DropdownMenu](../../apps/web/src/components/ui/dropdown-menu.tsx): account/Daily task/room menus. [Popover](../../apps/web/src/components/ui/popover.tsx): Combobox/listening controls. Daily [StudyDatePicker](../../apps/web/src/features/daily/ui/study-date-picker.tsx) composes Radix directly. | Calendar owns civil-date keyboard navigation and guarded onSelect acceptance; not a generic searchable option list. Keep permission/navigation guards at caller. |
| Chips, badges and cards | [Badge](../../apps/web/src/components/ui/badge.tsx), [Card](../../apps/web/src/components/ui/card.tsx); domain [PostBadge](../../apps/web/src/features/post/components/post-badge.tsx), [PostStatusBadge](../../apps/web/src/features/post/components/post-status-badge.tsx), [PostListItem](../../apps/web/src/features/post/components/post-list-item.tsx), [DocumentCard](../../apps/web/src/features/documents/components/document-card.tsx). | Card/Badge are primitives, not authorization or whole item behavior. Home/public News reuse PostBadge/PostListItem. Document filter chips have removal buttons; category Links navigate; status badges are not interactive filters. Do not merge these merely for shape. |
| Identity and private media | [AvatarImage](../../apps/web/src/features/user/components/avatar-image.tsx), [UserHoverCard](../../apps/web/src/features/user/components/user-hover-card.tsx); Daily [evidence components](../../apps/web/src/features/daily/evidence), Recognition HonorImage/EvidenceDownload, question figure resolvers. | Reuse identity/crop rendering. Private byte fetch, abort/revoke, permission/expiry and evidence visibility remain with their domain; no generic URL card may bypass them. |
| Auth and rich content | [TurnstileChallenge](../../apps/web/src/features/auth/components/turnstile-challenge.tsx), [SocialLoginButtons](../../apps/web/src/features/auth/components/social-login-buttons.tsx); [RichTextEditor](../../apps/web/src/components/ui/rich-text-editor.tsx), [RichTextViewer](../../apps/web/src/components/ui/rich-text-viewer.tsx). | Auth reuses provider/token lifecycle without changing enforcement. Post rich text differs from scientific question blocks/frozen exam content; retain sanitization/figure contracts, not a universal editor. |

## Follow-up dispositions and remaining opportunities

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
