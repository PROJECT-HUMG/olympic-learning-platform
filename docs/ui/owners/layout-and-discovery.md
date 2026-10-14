# Shared layout, search and discovery owners

> Source lookup reorganized from checkpoint `7a70002`. Dated evidence and adoption counts below remain checkpoint-specific. Start with [current UI guide](../README.md); verify the responsible source before editing.

### Shared visual lookup — 13/10/2026

| Find by task | Owner / actual consumers |
| --- | --- |
| Page measure,gutters,heading/action alignment,section rhythm,filter bands | [page-layout.css](../../../apps/web/src/components/ui/page-layout.css) → [PageHeader](../../../apps/web/src/components/ui/page-header.tsx), [PublicPageHeader](../../../apps/web/src/components/ui/public-page-header.tsx), [PageSection](../../../apps/web/src/components/ui/page-section.tsx). Existing page-shell/filter-panel/content-card/page-table classes are the adoption seam. |
| Card slots,surface hierarchy and table heading density | [Card](../../../apps/web/src/components/ui/card.tsx), [Table](../../../apps/web/src/components/ui/table.tsx), existing [theme tokens](../../../apps/web/src/index.css); questions,documents and management consumers reuse slots. |
| Action versus navigation/prose;44px mobile targets | [Button](../../../apps/web/src/components/ui/button.tsx) plus page-layout.css; asChild retains anchors. Existing profile identity remains [UserIdentity](../../../apps/web/src/features/user/components/user-hover-card.tsx), not a Button. |
| Empty/error context | [ListFeedback](../../../apps/web/src/components/ui/list-feedback.tsx) → [EmptyState](../../../apps/web/src/components/ui/empty-state.tsx), DocumentList and legacy Post list; feature owns state and retry. Compact RetryFeedback/inline metadata variants remain intentional. |
| Album grouping / compact real-rank rows | [public-pages](../../../apps/web/src/features/recognition/public-pages.tsx), [Recognition CSS](../../../apps/web/src/features/recognition/recognition.css), [RankingList](../../../apps/web/src/features/recognition/ranking-presentation.tsx) and [ranking CSS](../../../apps/web/src/features/recognition/ranking-presentation.css). Rankings54rem supersedes the earlier60rem note. |
| Dashboard welcome | [DashboardWelcomeBanner](../../../apps/web/src/features/dashboard/components/dashboard-welcome-banner.tsx) reuses PageHeader and existing role destinations. |
| Long form frame / nested controls | Existing [interaction index](shared-controls.md#interaction-owner-lookup), CreationDialog and Post/Document forms remain owners. Common layout adds no containing-block transform. |

Proof runner: [taste-layout-browser-check.mjs](../../../apps/web/tests/taste-layout-browser-check.mjs), actual routes with synthetic intercepted APIs. [Coverage/variants](../history/shared-language.md#shared-foundation-adoption--13102026) and [status/evidence](../../reviews/history/redesign-20261013-14.md#taste-shared-foundations--13102026) distinguish source adoption from rendered coverage.

RichTextViewer reading rhythm is owned by [rich-text-viewer.css](../../../apps/web/src/components/ui/rich-text-viewer.css), imported by [RichTextViewer](../../../apps/web/src/components/ui/rich-text-viewer.tsx); no typography plugin is installed. It scopes headings/paragraphs/lists/links/media/code/table bounds to rendered content and leaves Tiptap editor/frozen scientific readers distinct. [Public profile CSS](../../../apps/web/src/features/user/components/public-profile.css) now owns the quiet resting identity target and two-line visible linked name, with the same full aria-label and optional preview/detail; Rankings needs no competing identity skin.


## Full application owner and search lookup — 13/10/2026

This is the current interaction/layout lookup, superseding the earlier manual-submit list-search descriptions. The existing route owner remains `src/router/routes.tsx`; no competing component system or directory restructure.

| Family / task | Responsible composition and common adoption | Intentional variant / proof boundary |
| --- | --- | --- |
| All public/workspace routes | `index.css` tokens → `page-layout.css`, PageHeader/PublicPageHeader/PageSection; `navigation.css`/public-header/dashboard shell | Existing destinations/drawers/role guards; current screenshot matrix covers representative routes, not every role/state. |
| Home / real discovery | `home-hero-section.tsx/css`, HomeStudyNotebook; `home-page.css` | Compact navigation search remains explicit because Home has no results list. Home notebook selectors never style Daily root. |
| Subjects / Documents | SubjectDirectory; DocumentFilters/DocumentList/DocumentCard; document-discovery.css |3:4 preview/compact media, subject/code local match; actual title/subject/kind/tag only. PDF/storage/download unchanged. |
| Honors / rankings / public profiles | Recognition public-pages/components/recognition.css; RankingList; public-profile.css; UserIdentity/UserAvatar | Year remains supported; published/approved-active/ranking consent/private evidence gates unchanged. |
| News / reader | PublicNewsFeature, PostListItem, public-news-feature.css; RichTextViewer | Four canonical type links; editorial rows; no fake featured taxonomy/read-time. PublicRead query metadata survives anonymous expiry. |
| Dashboard / placeholder guidance | DashboardPage + welcome/quick-actions; About/Competitions/Practice/History/NotFound use PageHeader/guidance/Button | No invented metrics/activity. Unmounted demo widgets/legacy PostManagement remain outside active adoption. |
| Admin/lecturer records | Posts/Documents management, Users, Categories; management rows/Card/Table/PaginationFooter; filter-panel | Real supported filters only; same permissions/delete/pending/error owners. Users retains narrow identity/actions and bounded table scrolling. |
| Recognition management / personal achievements | admin-page/private-pages + Recognition fields/status/CreationDialog | Review/evidence/score/draft semantics retained; common field/control surfaces, not gallery policy. |
| Question/import/exam editing and lists | QuestionBank/QuestionDetail, AssessmentImport/AssessmentDraftList, ExamEditor/ExamRead; PageHeader/PageSection/Card + scientific CSS | Scientific content, frozen readers, release gates and identity revalidation remain task-specific. Chooser search never submits editor. |
| Auth / private profile | WelcomeLayout/auth-card-layout; FormField/label-input.css; profile.css | Existing Auth/Turnstile/expiry/password/crop owners;52px labelled fields,44px password target; mobile one column. |
| Daily day/week/group/shared review | StudyNotebook/flat work regions; groups.css; shared controls/header | Native dialogs/scroll lock, drafts/private gates and serialized800ms sync retained byte-for-byte except separate group presentation CSS. |
| Toolkit / room | ToolkitFeature/GpaCalculator/toolkit.css; StudyRoomsLobby/study-room.css | GPA math/storage unchanged; persistent joined scene/player remains a separate variant. No route/card wrapper over media lifecycle. |
| Long create/edit/viewer/chooser dialogs | Existing CreationDialog/Dialog/EvidenceGallery/native Daily/image-picker index above | Fixed inset/dvh/safe-area/root transform fix retained; no new modal positioning or animation controller. |

`use-list-search.ts` extends existing `useDebounce` for the350ms list draft lifecycle. `useListSearch` serves local choosers; `useUrlListSearch` distinguishes REPLACE acknowledgement from POP/scope changes and rejects writes after browser URL leads a departing lazy route. SearchInput is presentation only. No timer duplication, universal matching parser, WebSocket or auto-submit.

| Mounted search | Parameter / matching owner | Navigation/query contract |
| --- | --- | --- |
| Honors | `subject` → existing server subject match | Compact `year` immediately; page reset; keep unknown URL params. |
| Documents public/management | `keyword`; existing subject/category/tag IDs | Metadata chooser immediate; explicit active chips/reset; server pagination retained. |
| News | `q` → request `keyword`; canonical `type` | Type immediate, current publishedAt sort/priority rules; unknown params retained. |
| Subjects | `q`; existing Vietnamese accent-insensitive name/code match | Local list only, existing sort and subject→Documents destination. |
| Posts management | `keyword`; existing `status` mapping | Server paging/EXPIRED mapping unchanged. |
| Users | `search`; URL one-based `page` → zero-based API | Current name/email match and permission owner; no new server fields. |
| Question Bank | `search`; existing subject/topic/status | Immediate discrete filters and zero-based request paging. |
| Exam published bank | local `search`, keyed by subject | Page resets; composition pauses; Enter cannot save surrounding form. |
| Recognition UserPicker | local server `search` | Selected identity retained; existing student/active eligibility filter; no public lookup of private DTO. |

Every list uses raw local typing and trimmed settled values;350ms debounce pauses IME, clear is immediate, changed filters reset page, typing uses REPLACE (no entry per keystroke), POP cancels pending drafts. Old request responses remain keyed to old queries; signals are consumed by Documents/News/Users/Questions services. Form save/submit/publish/OTP and OS native select do not inherit search semantics.

Machine source ledger and exact rendered coverage are `/tmp/humg-product-20261013/source-adoption.json` and final manifest. The ledger inventories current sources/direct consumers/styles; it does not assert all-screen rendering. The existing [interaction-owner lookup](shared-controls.md#interaction-owner-lookup) remains authoritative for nested/modal lifecycle.

Current integration detail (14/10/2026): URL search retains newer typing across concurrent acknowledgements without consuming echo refs during render; browser POP resets mounted drafts immediately and old-route writes are rejected. CreationDialog returns focus from discard confirmation into the form only while the parent remains open, leaving full close to restore the opener. Dashboard quick links use actual library/News/Daily/profile destinations as compact rows; no upload or unavailable practice action is implied.



## Whole-page composition — 14/10/2026

Quick source lookup for the current page arrangement (shared interaction/modal owners above remain authoritative):

| Find by task | Responsible source / consumers |
| --- | --- |
| Page introduction,section hierarchy and layout rhythm | `components/ui/page-layout.css` → PageHeader/PublicPageHeader/PageSection and existing page-shell classes; no default extra header divider. |
| Matching public/workspace edges | `layouts/components/public-header.css`, `public-footer.tsx`, `navigation.css`, `dashboard-layout.tsx`; retain drawers/rails/role guards/focus handoff. |
| Browse/filter documents | `pages/documents-page.tsx` → DocumentFilters,DocumentList,DocumentCard; `document-discovery.css` owns desktop facets/results and mobile stacking. Search ownership remains useUrlListSearch; no matching or paging change. |
| Scan News/pinned notices | PublicNewsFeature and `public-news-feature.css`; one existing `showPinned` condition owns both section presence and companion layout. No relational-CSS fallback dependency. |
| Recognize albums / change Recognition destination | `features/recognition/public-pages.tsx` + `recognition.css`; local `RecognitionNavigation` uses Button-as-Link and `page-local-nav` selected state. RankingList/RankingRow/useGSAP files are byte-identical to the accepted parent. |
| Start a learning/admin task | HomePage + `home-page.css` + HomeLatestNewsSection; DashboardPage/DashboardQuickActions + dashboard classes in page-layout.css. Real role destinations only. |
| Read an article | NewsDetailFeature + new feature-local `news-detail.css`; existing RichTextViewer,ArticleToc,ImageLightbox,share/query/return-path owners retained; related links use existing board variant. |
| Open a public identity/detail | Existing UserIdentity/UserAvatar/public profile query; `public-profile.css` and public-pages own quieter profile hierarchy/return actions. No DTO or avatar delivery change. |

Machine source ledger: `/tmp/humg-composition-20261014/source-adoption.json` inventories403 frontend sources and59 route definitions, with hashes/direct shared owners/styles. The route matrix records actual rendered representatives separately. Scientific/frozen readers,auth,Daily/native dialogs,joined rooms/media and complex editor contracts remain intentional task layouts; shared heading/gutter adoption does not imply all-role/all-state rendering or live authorization proof.

Owned proof extends the existing `tests/product-layout-browser-check.mjs` with bounded route/viewport selection,composition geometry/interactions and independent state cases. New comparisons and final manifest live under `/tmp/humg-composition-20261014`; no duplicate repository tracker or new UI framework.


### Album, News and menu refinement — 14/10/2026

- Honors: `public-pages.tsx` owns the cover/heading/participants/footer composition; `recognition.css` owns the two-column desktop gallery and full name wrapping (an explicit local override of UserIdentity's compact clamp). `components.tsx` Field/YearField accept `hideLabel` only for this Honors selector; its real Label/id relationship remains. Ranking timeframe is still visibly labelled.
- News: PublicNewsFeature removes only the duplicate summary above [AppPagination](../../../apps/web/src/components/ui/app-pagination.tsx); numbered current-page names/aria-current and compact mobile current/total remain with that owner. `public-news-feature.css` aligns44px search/category anchors without the extra category frame. Query/search/category/paging ownership is unchanged.
- Top menu: PublicHeader/MobileNavbar in `layouts/components` retain `aria-label="Mở menu điều hướng"`, shared Sheet/Radix keyboard/dismissal and focus return; `navigation.css` owns44×44px icon geometry. Public-header.css retains the desktop divider. Desktop workspace side-rail destination labels remain intentional.
- Proof: existing product-layout-browser-check.mjs `PRODUCT_REFINEMENTS` and `PRODUCT_REFINEMENTS_INTERACTIONS`; before/after,geometry and exact increment live under `/tmp/humg-refinements-20261014`. Synthetic fixtures only; no new media/identity/DTO/query owner.


### News depth and workspace shortcut — 14/10/2026

- `features/post/components/public-news-feature.css` owns the neutral shared feed surface,16px/12px row insets,quiet pointer background,inset keyboard ring and scoped PostBadge tint. NewsList/PostListItem retain content/links/media fallback; loading/error/empty/query and semantic deadline owners are unchanged. No new wrapper or shared Badge API.
- `layouts/components/public-header.tsx` now reserves the direct CTA for guest sign-in. Signed-in public headers use existing UserDropdown. `features/auth/components/user-dropdown.tsx` keeps one existing first workspace Link through getDashboardRoute,with icon/44px target,medium weight and a descriptive trigger title. Dashboard/mobile consumers reuse that same menu; role guards/router are unchanged.
- Existing product-layout-browser-check.mjs adds bounded `PRODUCT_NEWS_DEPTH` and `PRODUCT_ACCOUNT_NAV` modes for actual synthetic routes. Comparisons,geometry,results and exact increment are in `/tmp/humg-news-depth-20261014`; no live mutations or new dependency.



### Documents phone filter sheet — 14/10/2026

| Find by interaction | Owner / consumers |
| --- | --- |
| Phone search, active chips, filter count/reset, secondary sheet | [DocumentFilters](../../../apps/web/src/features/documents/components/document-filters.tsx) on DocumentsPage; below640px only secondary subject/category/tag selectors move. Search and active chips remain in page flow. At640px and above facets remain visible. One selector set mounts. |
| Sheet geometry, short-screen body scroll and safe areas | [document-discovery.css](../../../apps/web/src/features/documents/components/document-discovery.css), `.document-filter-sheet*`; existing [Sheet](../../../apps/web/src/components/ui/sheet.tsx)/Radix owns portal, focus containment, nested Popover dismissal and scroll lock. Heading gets initial focus; normal close returns trigger; breakpoint teardown returns to persistent search. |
| Query/URL/debounce | Existing useUrlListSearch → list-navigation and DocumentsPage → useSearchDocuments.350ms typing REPLACE, immediate discrete PUSH and page reset; no new matching/backend fields. Sheet reset clears secondary predicates only; full reset retains its existing scope. |
| Modal reduced motion | Existing global modal rule in [index.css](../../../apps/web/src/index.css) now includes sheet content/overlay to override state-animation utility precedence. No second motion owner. |
| Owned synthetic browser proof | [document-filter-sheet-browser-check.mjs](../../../apps/web/tests/document-filter-sheet-browser-check.mjs): actual route/Sheet/Popover/query owners; `--before`, `--card-assessment-only` and bounded state modes. Self-hosted Vite disables env loading; all APIs intercepted. |

[Design decision](../../architecture/design-system.md#documents-phone-discovery-and-card-assessment--14102026) and [acceptance/limits](../../reviews/history/documents-filters-20261014.md#documents-mobile-filter-sheet--accepted-local-14102026). Comparison gallery and exact incremental manifest: `/tmp/humg-documents-final-20261014/`. Card/thumbnail source and earlier card CSS are unchanged; no Kokonut drawer adoption or new dependency.
