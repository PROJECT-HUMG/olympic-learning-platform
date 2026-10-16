# Layout, lists and discovery

[Named features](../../README.md#feature-lookup) link individual screens. [UI rules](../../architecture/web-ui.md) own design direction; this guide identifies layout/query seams.

## Layout owners

| Task | Responsible owner |
| --- | --- |
| Type/tokens/measure/gutters/heading-action rhythm | [index.css](../../../apps/web/src/index.css), [page-layout.css](../../../apps/web/src/components/ui/page-layout.css), [PageHeader](../../../apps/web/src/components/ui/page-header.tsx), [PublicPageHeader](../../../apps/web/src/components/ui/public-page-header.tsx), [PageSection](../../../apps/web/src/components/ui/page-section.tsx) |
| Public/workspace navigation | [navigation](../../../apps/web/src/layouts/navigation.ts), [PublicLayout](../../../apps/web/src/layouts/public-layout.tsx), [DashboardLayout](../../../apps/web/src/layouts/dashboard-layout.tsx). Authenticated workspace destination stays in account menu; guest sign-in remains visible |
| Result feedback | [ListFeedback](../../../apps/web/src/components/ui/list-feedback.tsx), [EmptyState](../../../apps/web/src/components/ui/empty-state.tsx); feature owns query state/retry/busy and actual reset scope |
| Reader composition | [RichTextViewer](../../../apps/web/src/components/ui/rich-text-viewer.tsx) and its scoped CSS; scientific readers/Tiptap remain distinct |

## List search and URL state

[useListSearch/useUrlListSearch](../../../apps/web/src/hooks/use-list-search.ts) extend the existing debounce for350ms draft updates; [list-navigation](../../../apps/web/src/lib/list-navigation.ts) owns page/parameter changes and safe returns. SearchInput is presentation only.

| List | Actual field/matching owner |
| --- | --- |
| Honors | Server `subject`, immediate `year`; retain year navigation, unknown params and page reset |
| Documents public/management | Server `keyword`, subject/category/tag IDs; active chips, secondary/full reset scopes and paging remain distinct |
| News | URL `q` maps to request `keyword`, canonical `type`; keep pinned/release/expiry/sort behavior |
| Subjects | Local Vietnamese accent-insensitive name/code match, `q`; link to Documents subject filter |
| Post management / users / questions | Existing keyword/status; user name/email search; question subject/topic/status/search. Preserve each server contract, role and page convention |
| Room lobby / chooser lists | Existing local hook and actual matching scope; do not advertise global/server search where absent |

Typing uses REPLACE without one history entry per keystroke; discrete changes apply immediately, usually PUSH, and reset page. Preserve IME composition, input focus, mounted draft identity, POP/back/forward and safe deep links. Concurrent query acknowledgements retain newer typing; departed routes/old URL scopes cannot write. Old responses stay under old keys; consume AbortSignal where the service supports it. Rankings has no keyword API. Home search navigates explicitly; save/publish/auth/OTP never auto-submit.

## Topic, contributor and exam entries

- [TopicManagement](../../../apps/web/src/features/system-categories/components/topic-management.tsx) lives in the existing taxonomy tabs at `/admin/categories?tab=topics&subjectId=…`. The URL owns selected tab/subject. Existing `/topics` create/disable operations invalidate both manual-question and import topic caches. Names are subject-scoped; a disable removes the enabled choice without deleting referenced questions. The confirmation explains publication consequences. New-topic conflict/failure retains input; CreationDialog owns dirty/busy close and focus. Phone tabs wrap so the topic destination stays visible.
- [DocumentsManagementPage](../../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx) reuses its form/list for student `/my-documents`. The owner filter is fixed to the authenticated identity, not a supplied URL parameter; it never queries all documents while identity is missing. [Creation capability](../../../apps/web/src/features/documents/document-access.ts) reads private session permissions. Navigation offers students with DOCUMENT_UPLOAD their own entry; direct student access retains existing own-document edits/deletes after a grant is removed. Upload/create remain server-authorized. The create form offers explicit single-flight session/permission refresh without replaying uploads or mutations; it retains the draft for a deliberate retry. This does not change token-revocation policy. File/metadata save failures keep entered values and uploaded identity; the shared form requires the API's existing nonempty tag set.
- [navigation.ts](../../../apps/web/src/layouts/navigation.ts) and the dashboard link students to `/exams`, staff to their `/lecturer/exams` or `/admin/exams` lists. Published-paper subroutes resolve to that navigation owner. This adds no attempts/grading or change to API release/solution restrictions.

Run `rtk pnpm check:browser journeys` using [the shared options](../../../apps/web/README.md#browser-checks). [ContributionAndTopicApiTest](../../../apps/api/src/test/java/me/nghlong3004/olympic/document/ContributionAndTopicApiTest.java) exercises real filter/method security and services with synthetic repositories/storage. Browser interception proves routed interactions, not actual DB/provider/security enforcement.

## Documents phone filter sheet

[DocumentFilters](../../../apps/web/src/features/documents/components/document-filters.tsx) moves only subject/category/tag controls into existing [Sheet](../../../apps/web/src/components/ui/sheet.tsx) below640px. Search and active chips remain visible; desktop facets stay visible. One selector set mounts, with URL state retained across open/close/breakpoints. “Xong” only dismisses already-applied filters. Secondary reset retains keyword; full reset retains unrelated URL parameters.

[document-discovery.css](../../../apps/web/src/features/documents/components/document-discovery.css) owns bounded dvh/safe-area geometry and the scrolling body/footer. Radix owns focus containment/nested Popover dismissal/Escape. Header receives initial focus; normal dismissal returns trigger, breakpoint teardown returns to persistent search. Preserve reduced-motion overlay/content overrides.

## Local compositions

Honors [public-pages/recognition.css](../../../apps/web/src/features/recognition/public-pages.tsx) combine cover/title/year/subject, full participant names/awards and album action. Cards grow with content; accessible year label remains visually hidden. [Ranking presentation](../../../apps/web/src/features/recognition/ranking-presentation.tsx) stays a compact rank/identity/score directory with real ties/full names.

News [PublicNewsFeature](../../../apps/web/src/features/post/components/public-news-feature.tsx) and [CSS](../../../apps/web/src/features/post/components/public-news-feature.css) align search/four category controls, omit redundant desktop page summary and use compact editorial rows with neutral body, quiet surface/hover/focus contrast and faint category tint. Existing pinned cue/status colors remain; the companion appears only for actual pinned data. Article title/body/related content keep one reading measure and existing TOC/media/share owners.

## Focused checks

[Document Sheet browser check](../../../apps/web/tests/document-filter-sheet-browser-check.mjs), [list-navigation tests](../../../apps/web/tests/list-navigation.test.ts), [News navigation tests](../../../apps/web/tests/news-navigation.test.ts), [product layout runner](../../../apps/web/tests/product-layout-browser-check.mjs) and [navigation runner](../../../apps/web/tests/navigation-browser-check.mjs) cover bounded contracts/representatives. Inspect runner modes before use; screenshots/source coverage are not all-route/backend/physical-device proof. [Current status](../../reviews/ux-flow-audit.md) records remaining limits.
