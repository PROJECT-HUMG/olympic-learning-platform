# Cross-file frontend reuse audit

[Component/API reference](web-ui-components.md) · [Design authority](web-ui.md) · [Status and historical rendered evidence](../reviews/ux-flow-audit.md)

## Snapshot, method and conclusions

Original source-only inventory, 09/10/2026, HEAD `bd47c5b6bed35ce64900e39a5e5eea8c90e60c5b`.
Includes the accepted **uncommitted** seven-path Daily recovery; it is not part of
that commit. Shared-owner/three-cluster work was subsequently committed in `ec98761`.
The current10/10 visual/creation candidate remains unstaged on `f7db010`; its
[actual coverage](web-ui-components.md#visual-and-creation-coverage-10102026) and
[status](../reviews/ux-flow-audit.md) separate current and historical evidence.
Operator env files were not read or included.

All **42 page entry files** and the route/lazy-page wiring were inspected, with a
original scan of **372 source files** (222 TSX, 120 TS, 30 CSS), including the page entries. TypeScript AST
inspection matched JSX to its actual imported owner, separating floating FormField
from RHF FormField. Local definitions, raw controls, repeated class strings and
helpers were inspected at their callers. Counts below are distinct source files,
with JSX sites listed separately; loops are one source site, not one rendered item.
Two files/screens trigger inspection, three or more strengthen the case; neither
threshold automatically requires extraction. Identical function names and similar
visuals alone do not establish equivalent behavior.

- **Already shared:** ordinary search presentation; native/Radix select and menu
  mechanisms; functional page headings; pagination controls; modal primitives;
  Documents/News list feedback; several domain compositions and lifecycle helpers.
- **Shared since `ec98761`:** POST image validation/native Button
  activation (2 pickers), Daily explicitInstant (2 DTO consumers), RetryFeedback
  (3 management consumers). Completion/request ownership remains feature-local.
- **Now also shared:** all eight equivalent residual clusters in the current adoption
  table below. Identity/room/download contracts retain partial overlap; toolbar/shell
  CSS is style reuse, not a composed component.
- **Intentionally local:** hero/reader/auth heading compositions, calendars,
  native group creation and persistent room music, private query/evidence gates,
  scientific/frozen content and form adapters with different data contracts.

Import reachability from main → router/layouts is used only to identify inactive
source. Multi-export feature modules make transitive imports an upper bound;
branch inspection, not that graph, determines screen adoption. This is not a claim
that all states/screens were rendered. Dynamic arbitrary-string imports or external
consumers are outside the inventory. The existing component reference supplies API
contracts; this document supplies actual repetition and ownership evidence.

## Implemented follow-up / cluster dispositions

At the historical three-cluster checkpoint on `bd47c5b`, three of the original
**13 clusters** were resolved and **10 were deferred** (later dispositions below), including cosmetic management
rows/range summaries. That implementation was a targeted update; the subsequent
[full-source residual sweep](#post-consolidation-residual-sweep) adds new findings
and corrects earlier equivalence/counts without further runtime edits. See the [current owner APIs and exact
consumers](web-ui-components.md#three-cluster-consolidation-working-candidate-09102026).

- **POST pickers — resolved:** [validatePostImage](../../apps/web/src/features/post/lib/post-image-validation.ts)
  has2 consumer files: [thumbnail](../../apps/web/src/features/post/components/post-image-upload.tsx#L26)
  and [editor dialog](../../apps/web/src/components/ui/rich-text-editor.tsx#L63).
  Native Button owns Enter/Space, existing storageService owns upload. Feature
  progress/error and asset-ID versus URL completion stay separate. MIME policy is
  unchanged; no generic upload framework or private-media merge.
- **Daily instant — resolved:** one [explicitInstant](../../apps/web/src/features/daily/lib/explicit-instant.ts)
  parser/regex,2 consumer files/3 call sites: plan required/nullable adapters and
  evidence createdAt. Broader DTO contracts remain separate. Pending Daily recovery
  editor/group/test bytes are untouched.
- **Compact management errors — resolved:** [RetryFeedback](../../apps/web/src/components/ui/retry-feedback.tsx)
  has3 routed consumers/sites: [documents](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L148),
  [posts](../../apps/web/src/features/post/components/post-management-feature.tsx#L173),
  [Question Bank](../../apps/web/src/pages/question-bank-page.tsx#L156).
  Presentation only; callbacks, disabled gates, cache/pending precedence stay local.

The table below retains all13 historical clusters for traceability; resolved rows
name the implemented owner rather than remaining recommendations. No changes to
intentionally differing room/media/search/formatting/native-dialog/form contracts.

## Completed residual consolidation (09/10/2026)

Current implementation on base `bd47c5b6bed35ce64900e39a5e5eea8c90e60c5b`,
including the accepted three-cluster runtime work and documentation supplements.
All eight genuinely equivalent residual clusters are migrated. Current discovery
covers **381 source files (227 TSX,124 TS,30 CSS)** and all **42 page entries**.
Historical tables below record earlier findings; this table and the refreshed
import/JSX index describe committed reuse adoption. Source links for overlapping
Daily files use index/commit lines; pending recovery produces different working-tree
line offsets, recorded separately in the final manifest. No general upload/form/query framework
or business-record abstraction was added.

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

All intended consumers import/use these owners; equivalent shadow definitions are
absent. POST validation2 files, strict instant2 files/3 calls and RetryFeedback3
files/3 sites remain adopted. Remaining matching bodies are local Daily navigation
guards, per-picker progress and management page-clamp effects. Their shared engines
already own lifecycle; moving small callsite adapters would obscure domain gates.
Room inputs/downloads/identity/private contracts/chips/native dialogs keep the
previously documented differences. Groups' looser timestamp policy is unchanged;
no silent contract tightening or claim of zero arbitrary duplication.

Proof:175 Node tests, TypeScript/Vite production build (env loading disabled), lint
with existing warnings. Expanded synthetic Chromium probe18 checks at1440/768/320px,
light/dark: prior pickers/compact retry plus reflection association/value/node/focus,
both management row Enter/Space callbacks/44px targets, inline retry disablement,
last-page ranges and solid confirmation Escape/focus return. Evidence:
`/tmp/three-cluster-after-or0mBm/results.json`. Existing before/after evidence remains
historical. No live/all-screen/physical-device/AT or dedicated reduced-motion proof.

## Post-consolidation residual sweep

Historical source-only checkpoint preceding the completed residual consolidation: accepted three-cluster candidate
`3de13873de64945dfa00b8d58a70d6c536fb797cd1af3e1e38482c69e30220d6`,
base `bd47c5b6bed35ce64900e39a5e5eea8c90e60c5b`. Fresh discovery covers
**375 source files (223 TSX, 122 TS, 30 CSS)**, including all **42 TSX page entries**
in the [coverage ledger](#coverage-ledger-all-42-page-entries), route/re-export
wiring and supporting components/helpers/styles. AST import/JSX evidence and
repeated function/regex/class/CSS discovery were followed by semantic inspection
of candidate repetitions. This is not line-by-line manual or all-screen rendered
validation. Matching classes/property sets alone do not establish reusable behavior.
Temporary source evidence: `/tmp/ui-residual-source-sweep-20261009.json` and
`/tmp/ui-residual-css-discovery-20261009.json`; these contain source facts, not env.

**Resolved owners confirmed, no equivalent shadow copies found:**

| Owner | Actual definition and intended consumers | Boundary |
| --- | --- | --- |
| POST image validation | [validatePostImage:2](../../apps/web/src/features/post/lib/post-image-validation.ts#L2) → [PostImageUpload:26](../../apps/web/src/features/post/components/post-image-upload.tsx#L26), [RichTextEditor:63](../../apps/web/src/components/ui/rich-text-editor.tsx#L63): **2 files / 2 calls** | Sole POST image-family/5MiB guard. Both retain native Button activation and storageService; asset-ID versus URL completion/progress/toasts remain local. Recognition albums, scientific figures, evidence and avatars have different policies, not shadows. |
| Daily strict instant | [explicitInstant:6](../../apps/web/src/features/daily/lib/explicit-instant.ts#L6) → [daily-contract:97,103](../../apps/web/src/features/daily/lib/daily-contract.ts#L97), [evidence-contract:125](../../apps/web/src/features/daily/evidence/evidence-contract.ts#L125): **2 files / 3 calls** | Sole strict date/time/explicit-zone parser; nullable adapter and DTO authority remain separate. Groups' looser timestamp reader is a different contract, described below. |
| Compact management error | [RetryFeedback:4](../../apps/web/src/components/ui/retry-feedback.tsx#L4) → [documents:148](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L148), [posts:173](../../apps/web/src/features/post/components/post-management-feature.tsx#L173), [questions:156](../../apps/web/src/pages/question-bank-page.tsx#L156): **3 files / 3 JSX sites** | Sole exact compact alert composition/class. Caller retains callback, pending disablement and cache/error precedence. Public ListFeedback, cached warnings and private gates differ. |

**At this historical checkpoint, equivalent duplication remained; the eight rows below are now resolved.** Priorities below measure follow-up
benefit, not demonstrated failures. P2 = useful shared validation/URL mechanics;
P3 = smaller presentation/maintenance benefit. These were findings before the subsequently authorized implementation. The original 13-cluster table remains historical; its ten deferred
clusters are not an exhaustive count after this sweep.

| Residual pattern / exact sites | Count and equivalence | Benefit / smallest fitting owner |
| --- | --- | --- |
| **P2 · URL set/delete/reset-page**: Recognition [public-pages:24](../../apps/web/src/features/recognition/public-pages.tsx#L24), [admin-page:27](../../apps/web/src/features/recognition/admin-page.tsx#L27); Questions [replaceQuestionBankParam:111](../../apps/web/src/features/questions/components/manual-question.ts#L111) | **3 implementations / 3 files / 4 screen compositions**: Honors, Rankings, Admin Recognition, Question Bank (role aliases reuse it). All clone params, set/delete a value, clear page unless updating page. Questions adds a typed allowed-key API. | One pure mutation helper beside [list-navigation](../../apps/web/src/lib/list-navigation.ts), with typed/domain adapters retained. Small scope; avoids reset-rule drift. Preserve explicit submit, draft/URL synchronization and query/navigation rules. Documents always resets page; News batches changes, so exclude those from the exact cluster. |
| **P2 · Toolkit decimal parser**: [gpa.ts:27](../../apps/web/src/features/toolkit/lib/gpa.ts#L27), [gpa-goal.ts:17](../../apps/web/src/features/toolkit/lib/gpa-goal.ts#L17) | **2 helpers / 2 calculator panels on one Toolkit GPA route**. Same trimmed nonnegative decimal syntax, dot/comma conversion and finite-number/null result. [GpaCalculator:69](../../apps/web/src/features/toolkit/components/gpa-calculator.tsx#L69) mounts the goal panel. | Toolkit-owned pure decimal parser. Small validation-maintenance improvement; keep course credits >0 versus goal credits ≥0, scale/ranges/aggregation/overflow at callers. No current input failure demonstrated. |
| **P3 · Daily reflection field**: [ReviewField:449](../../apps/web/src/features/daily/ui/daily-reflection-field.tsx#L5), [WeekField:172](../../apps/web/src/features/daily/ui/daily-reflection-field.tsx#L5) | **2 identical definitions / 7 JSX uses**: day [247–249](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L246), week [154–157](../../apps/web/src/features/daily/components/daily-week-editor.tsx#L154). Same id/label/value/onChange props, associated Label/Textarea, 4000-character limit and layout. | Small Daily-owned DailyReflectionField; prevents association/limit/style drift. Existing accessibility works. Keep edit callbacks/session/autosync outside; implementation would overlap pending Daily recovery and needs explicit patch accounting. No universal form wrapper. |
| **P3 · Management row/action frame**: Documents [33 / actions89](../../apps/web/src/features/documents/components/dashboard-document-list.tsx#L33), Posts [35 / actions94](../../apps/web/src/features/post/components/dashboard-post-list.tsx#L35) | **2 files/screens**. Exact responsive frame and edit/delete strip; Button/EmptyState already shared. Thumbnails, metadata, status/expiry/title-link gates differ. | Optional presentation row with content/actions slots, or just action strip. Maintenance benefit; keep record types, permissions and confirmations local. No missing44px behavior currently shown. |
| **P3 · Pagination range/footer**: Documents [166](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L166), Posts [191](../../apps/web/src/features/post/components/post-management-feature.tsx#L191) | **2 files/screens**. Same range calculation/wrapping markup, feature noun differs. Clamp-effect bodies also match at [63](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L63) / [62](../../apps/web/src/features/post/components/post-management-feature.tsx#L62). AppPagination already owns controls. | Optional PaginationRange presentation beside AppPagination; retain offset/clamp/query state at callers. Cosmetic/maintenance benefit, not a reason for a query hook. |
| **P3 · Cached-refresh warning**: [Profile:43](../../apps/web/src/pages/profile-page.tsx#L43), [Categories:255](../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx#L255) | **2 presentation sites** with same alert/frame/message/outline retry. Profile retains same-session editor only for transient refresh error; Categories retains cached metadata. Shared Button already disables while loading. | Optional small inline retry presentation beside feedback owners. Preserve each terminal/private gate and callback; centered RetryFeedback is not visually equivalent. No retry defect shown. |
| **P3 · Solid-danger confirmation classes**: [Post:243](../../apps/web/src/features/post/components/post-management-feature.tsx#L243), [Avatar:167](../../apps/web/src/features/user/components/avatar-upload-card.tsx#L167), [Documents:219](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L219), conditional [useDailyConfirm:27](../../apps/web/src/features/daily/ui/use-daily-confirm.tsx#L27) | **4 files / 4 sites** (3 literal + 1 conditional). Same AlertDialogAction classes. Primitive/focus lifecycle already shared. | Cosmetic policy choice only: existing [Button destructive](../../apps/web/src/components/ui/button.tsx) is tinted, whereas these are solid. If consistency is desired, extend existing variant ownership after choosing treatment; dropping classes is not appearance-preserving. No new confirmation wrapper. |
| **P3 · UUID lexical format**: [evidence:10](../../apps/web/src/features/daily/evidence/evidence-contract.ts#L10), [groups:4](../../apps/web/src/features/daily/groups/group-contract.ts#L4), [plan:8](../../apps/web/src/features/daily/lib/daily-contract.ts#L8), [review:24](../../apps/web/src/features/daily/lib/review-display.ts#L24), [paper figures:6](../../apps/web/src/features/exams/paper-figures.ts#L6), [question figures:20](../../apps/web/src/features/questions/components/figure-resolution.ts#L20), [manual question:5](../../apps/web/src/features/questions/components/manual-question.ts#L5) | **7 regex definitions / 7 files**, identical format literal; type guards/null adapters and authority differ. | Optional pure lexical predicate with existing adapters retained. Small typo/maintenance benefit only; never consolidate DTO or authorization contracts. |

### Partial repetition and intentional differences

The [earlier local/conditional inventory](#remaining-local-duplication) and
[contract exceptions](#inspected-repetition-that-should-stay-local) remain relevant:

- **Room inputs:** three CSS definitions in one feature owner, five consumer files
  (including actual [EditRoomRhythm:42](../../apps/web/src/features/study-room/components/edit-room-rhythm.tsx#L42)).
  Common44px/border tokens coexist with different font/padding/focus rules. Input
  could own the base in a bounded follow-up; this is partial overlap, not three
  behavior-equivalent components. Keep native validation/valueAsNumber/stale gates.
- **Blob downloads:** three files share objectURL/anchor mechanics but differ in
  attached versus detached anchors,100ms versus1000ms revoke, filename and
  public/private authenticated/abort/request ownership. Only tiny agreed mechanics
  could be shared. Six representative identity strips already share AvatarImage;
  initials/crop/menu/hover/private retrieval differ. News/Home item and chip contracts
  likewise remain purposeful, not missing universal components.
- **Groups timestamp concern:** [group-contract:9](../../apps/web/src/features/daily/groups/group-contract.ts#L9)
  has a looser explicit-zone suffix + Date.parse check, used four times across
  invitation/shared-summary/contribution DTO readers ([50](../../apps/web/src/features/daily/groups/group-contract.ts#L50),
  [61](../../apps/web/src/features/daily/groups/group-contract.ts#L61), [74](../../apps/web/src/features/daily/groups/group-contract.ts#L74)).
  It lacks the strict parser's separate calendar/time-range checks. This is a
  source-level acceptance-policy difference, not an equivalent shadow or observed
  live failure. Tightening it needs a separate contract decision/regression slice;
  the intended plan/evidence consolidation is complete.
- **Already owned / low-payoff repetition:** PageHeader/SearchInput/native and Radix
  controls/dialogs/pagination/feedback retain the verified counts below. Toolbar/
  shell/auth-heading CSS is real style reuse, not a composed component. GroupScreen
  has one local PageSection-shaped copy, not two local definitions. Three guidance
  pages already share headings/Button/action CSS. SessionLoading/SessionError share
  a short frame class ([5](../../apps/web/src/router/guards/session-loading.tsx#L5),
  [11](../../apps/web/src/router/guards/session-error.tsx#L11)); status versus alert,
  width and retry differ. Extraction would add little value.
- **Repeated styling is not missing lifecycle ownership:** assessment/document
  skeletons match content-frame geometry intentionally; POST picker icon/progress
  decorations remain beside distinct completion handlers. Trailing-slash removal
  in [navigation:139](../../apps/web/src/layouts/navigation.ts#L139) and
  [post-login routing:52](../../apps/web/src/router/route-constants.ts#L52) serves
  different matching/security contexts.17 cross-file CSS leaf-property groups are
  largely flex/reset/token/focus/image-cover declarations; cascade/context differs.
  No universal wrappers follow from those matches.
- **Inactive source:** three old Home section headings and legacy dashboard/card/list
  copies are not mounted by current [HomePage](../../apps/web/src/pages/home-page.tsx)
  or Dashboard. Their cleanup is optional, not a live UI defect or adoption blocker.

No new runtime defect was demonstrated. The highest-value remaining equivalent
mechanics are the URL helper and Toolkit parser; the Daily reflection field is a
small presentation follow-up. No claim of zero duplication or exhaustive semantic
equivalence is made. Prior172-test/build/lint and15-check rendered evidence remains
evidence for the unchanged three-cluster candidate only; none was rerun for this
documentation audit. Dedicated reduced-motion/all-screen/live-backend validation
remains outside this sweep. Runtime/test bytes, pending Daily recovery and unrelated
work are preserved; the documentation supplement accounts for changed doc hashes.

## Verified existing ownership

The exact definition and direct consumers for these shared owners appear in the
expandable call-site index below. Counts exclude `components/ui` internals, which
are identified separately when relevant. “Routed” means import-reachable consumer
files, including conditional branches, not simultaneously visible screens.

| Pattern / actual owner | Routed / total consumer files; source sites | What is reused / what is not |
| --- | --- | --- |
| [PageHeader](../../apps/web/src/components/ui/page-header.tsx#L12) | 29 / 29; 32 | Heading/action markup and shared mobile tokens; local title/data/action visibility remains feature-owned. |
| [PageSection](../../apps/web/src/components/ui/page-section.tsx#L11) | 12 / 12; 20 | Labelled panel composition. One Daily GroupScreen copies its markup; flat domain styling is purposeful. |
| [SearchInput](../../apps/web/src/components/ui/search-input.tsx#L7) | 9 / 9; 9 | Input/icon presentation only; no universal apply/debounce/URL engine. |
| [NativeSelect](../../apps/web/src/components/ui/native-select.tsx#L4) | 14 / 14; 24 | Native control/event/option semantics. No raw select outside this owner. |
| [Select](../../apps/web/src/components/ui/select.tsx#L7) | 3 / 3; 8 | Installed Radix rich select. RichTextEditor additionally uses it internally for heading levels. |
| [Combobox](../../apps/web/src/components/ui/combobox.tsx#L25) | 1 / 1; 1 | One mapped Documents source site renders three filters; shared searchable list/keyboard + Radix popup ownership. |
| [Dialog](../../apps/web/src/components/ui/dialog.tsx#L10) | 17 / 17; 20 | Radix modal lifecycle. ImageLightbox/RichTextEditor additionally compose it internally; DailyDialogHeader uses subcomponents. |
| [AlertDialog](../../apps/web/src/components/ui/alert-dialog.tsx#L7) | 6 / 7; 7 | Confirmation primitive; feature owns consent/request gates. Legacy PostManagement accounts for the extra file. |
| [DropdownMenu](../../apps/web/src/components/ui/dropdown-menu.tsx#L9) | 3 / 4; 4 | Account, Daily task and room actions; legacy DocumentGrid is the fourth. No competing mounted ordinary menu implementation found. |
| [Card](../../apps/web/src/components/ui/card.tsx#L4) | 7 / 9; 25 | Surface primitives only. Legacy DocumentGrid/PostCard add two files; actual DocumentCard/PostListItem are different domain compositions. |
| [Badge](../../apps/web/src/components/ui/badge.tsx#L33) | 9 / 11; 18 | CVA presentation primitives; status/category mappings remain domain-owned. Two legacy document views add files. |
| [Floating FormField](../../apps/web/src/components/ui/form-field.tsx#L29) | 10 / 10; 21 | 52px input/notch/password/error ownership. Not interchangeable with RHF field context. |
| [RHF FormField](../../apps/web/src/components/ui/form.tsx#L29) | 2 / 2; 13 | Controller context/label/control/error association in DocumentForm/PostForm; same JSX name, different API. |
| [AppPagination](../../apps/web/src/components/ui/app-pagination.tsx#L18) | 8 / 9; 9 | One-based numbered/compact controls, delegated Pagination primitives. Extra file is legacy PostManagement; range summaries still copied. |
| [Skeleton](../../apps/web/src/components/ui/skeleton.tsx#L3) | 12 / 13; 135 | Decorative skeleton primitive, not content shape or query state. Legacy PostCardSkeleton adds a file; News/Subjects also have CSS skeletons. |
| [RetryFeedback](../../apps/web/src/components/ui/retry-feedback.tsx#L4) | 3 / 3; 3 | Compact alert/message/actions presentation; feature queries/retries remain local. |
| [ListFeedback](../../apps/web/src/components/ui/list-feedback.tsx#L5) | 2 / 2; 2 | Equivalent public DocumentList/NewsList error presentation only; EmptyState is an additional shared internal adapter. |
| [EmptyState](../../apps/web/src/components/ui/empty-state.tsx#L4) | 4 / 4; 4 | Delegates to ListFeedback, shared by public and dashboard Documents/News. Feature retry/reset/state precedence stays local. |

CSS ownership is also real but is a separate reuse level:

- `.page-shell`: 31 consumer files; `.page-toolbar`: five — Documents filters,
  document/post management, Users, Questions. Definition is
  [page-layout.css:7–20](../../apps/web/src/components/ui/page-layout.css#L7).
  There is no Toolbar or universal Page React component. Feature-specific form rows
  remain markup composition, even if they use the same gap.
- `.auth-heading`: seven feature files use the common auth/token styles; that is
  style reuse, not a shared AuthHeading component.
- Room inputs use one feature CSS owner, but its base/rhythm/track definitions
  repeat the ordinary input presentation; see the consolidation finding below.

Existing domain reuse is not application-wide abstraction:

| Definition / actual use sites | Count / reused contract |
| --- | --- |
| [post-list-item.tsx](../../apps/web/src/features/post/components/post-list-item.tsx#L13) → [news-list.tsx](../../apps/web/src/features/post/components/news-list.tsx#L41); [public-news-feature.tsx](../../apps/web/src/features/post/components/public-news-feature.tsx#L82); [news-detail-feature.tsx](../../apps/web/src/features/post/components/news-detail-feature.tsx#L399) | 3 files: board/feed, pinned and related posts; Home does not consume PostListItem. |
| [components.tsx](../../apps/web/src/features/recognition/components.tsx#L15) → [public-pages.tsx](../../apps/web/src/features/recognition/public-pages.tsx#L37); [private-pages.tsx](../../apps/web/src/features/recognition/private-pages.tsx#L31); [admin-page.tsx](../../apps/web/src/features/recognition/admin-page.tsx#L45) | QueryFeedback: 3 external files + its own UserPicker, 9 sites. Pending precedence and domain retry wrapper, not app-wide query logic. |
| [avatar-crop-dialog.tsx](../../apps/web/src/features/user/components/avatar-crop-dialog.tsx) → [avatar-upload-card.tsx](../../apps/web/src/features/user/components/avatar-upload-card.tsx#L176); [group-avatar.tsx](../../apps/web/src/features/daily/groups/group-avatar.tsx#L115) | 2 files: same crop interaction. AvatarImage is reused by 11 files (9 routed, 2 legacy); fetch/save/preview lifecycles remain local. |
| [use-daily-auto-sync.ts](../../apps/web/src/features/daily/hooks/use-daily-auto-sync.ts#L14) → [daily-plan-editor.tsx](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L76); [daily-week-editor.tsx](../../apps/web/src/features/daily/components/daily-week-editor.tsx#L40) | 2 editors: 800ms serialized/versioned sync owner. Repeated local navigation glue does not imply two independent autosync engines. |
| [use-daily-editor.ts](../../apps/web/src/features/daily/hooks/use-daily-editor.ts#L24) → [daily-plan-editor.tsx](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L62); [daily-week-editor.tsx](../../apps/web/src/features/daily/components/daily-week-editor.tsx#L35); [feedback-panel.tsx](../../apps/web/src/features/daily/groups/feedback-panel.tsx#L37) | Session/leave helpers: 4 files including GroupConsent; dirty/conflict/account-leave rules already shared. |
| [study-date-picker.tsx](../../apps/web/src/features/daily/ui/study-date-picker.tsx) → [daily-groups-page.tsx](../../apps/web/src/pages/daily-groups-page.tsx#L45); [daily-owner-page.tsx](../../apps/web/src/pages/daily-owner-page.tsx#L72); [daily-shared-review-page.tsx](../../apps/web/src/pages/daily-shared-review-page.tsx#L50) | 5 files including day/week editors: civil-date popup and guarded onSelect; not ordinary option filtering. |
| [daily-sync-status.tsx](../../apps/web/src/features/daily/ui/daily-sync-status.tsx#L5) → [daily-plan-editor.tsx](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L83); [daily-week-editor.tsx](../../apps/web/src/features/daily/components/daily-week-editor.tsx#L167) | 2 editors. Pending Daily recovery adjusts validation announcement; committed UI does not include that change. |
| [use-turnstile-challenge.ts](../../apps/web/src/features/auth/hooks/use-turnstile-challenge.ts#L6) → [login-form.tsx](../../apps/web/src/features/auth/components/login-form.tsx#L89); [register-form.tsx](../../apps/web/src/features/auth/components/register-form.tsx#L175); [forgot-password-form.tsx](../../apps/web/src/features/auth/components/forgot-password-form.tsx#L86) | 3 forms use the hook + TurnstileChallenge component, distinct login/register/password_reset actions. OTP/OAuth/refresh are not duplicate challenge implementations. |
| [use-debounce.ts](../../apps/web/src/hooks/use-debounce.ts#L3) → [admin-users-page.tsx](../../apps/web/src/pages/admin/users/admin-users-page.tsx#L38); [documents-management-page.tsx](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L39); [post-management-feature.tsx](../../apps/web/src/features/post/components/post-management-feature.tsx#L40) | 3 routed consumers + legacy PostManagement. Do not substitute this simple debounce for Daily autosync. |
| [list-navigation.ts](../../apps/web/src/lib/list-navigation.ts#L2) → [public-pages.tsx](../../apps/web/src/features/recognition/public-pages.tsx#L20); [documents-page.tsx](../../apps/web/src/pages/documents-page.tsx#L30); [manual-question.ts](../../apps/web/src/features/questions/components/manual-question.ts#L108) | getPageNumber: 4 files including Recognition admin; safe return helper: 7 files. Zero-based conversion stays at feature boundary. |

## Remaining local duplication

Historical13-cluster ledger: POST/instant/compact retry and management rows/ranges/URL mutation are now resolved. Other entries remain conditional/local. Original priorities are follow-up value, not a claim that every row is a current defect:
**P1** source-level accessibility issue; **P2** clear consolidation/maintenance
benefit; **P3** small/conditional opportunity. All remedies below are findings,
not implemented changes. Counts name the inspected equivalence cluster, not every
occurrence of a word or visual shape.

| Pattern / exact definition or use sites | Count / existing responsible owner | Equivalence, impact, smallest practical follow-up |
| --- | --- | --- |
| Resolved · POST image pickers: [PostImageUpload](../../apps/web/src/features/post/components/post-image-upload.tsx); [ImageInsertDialog](../../apps/web/src/components/ui/rich-text-editor.tsx) | 2 mounted consumers; native Button, validatePostImage and storageService shared. | See implemented disposition above. Local upload progress/toasts and asset-ID versus URL completion are intentional; no general upload framework. |
| Resolved · Compact management errors: [documents](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L148); [posts](../../apps/web/src/features/post/components/post-management-feature.tsx#L173); [questions](../../apps/web/src/pages/question-bank-page.tsx#L156) | 3 mounted files; RetryFeedback presentation owner. | Exact compact markup now shared; caller keeps loading/error precedence, callback and isFetching gate. Public illustration/private feedback contracts remain separate. |
| Resolved · Management row/actions: [dashboard-document-list.tsx](../../apps/web/src/features/documents/components/dashboard-document-list.tsx#L33); [dashboard-post-list.tsx](../../apps/web/src/features/post/components/dashboard-post-list.tsx#L35) | 2 files; Button/EmptyState shared, row frame and action markup copied. | Same responsive border/frame, edit/delete button strip and44px overrides (Documents:89–107; Posts:94–112). Small presentation row/action slots can share layout without passing a generic document/post record. Preserve PDF thumbnail dimensions, download counts, post status/expiry/link gating and caller confirmation. No universal business card. |
| Resolved · Pagination range summary: [documents-management-page.tsx](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L172); [post-management-feature.tsx](../../apps/web/src/features/post/components/post-management-feature.tsx#L197) | 2 files; AppPagination shared, summary calculation/markup copied. | Same apiPageOffset*size+1 and min((offset+1)*size,totalElements), same wrapping container; noun differs. Share a presentation summary/footer next to AppPagination with start/end/total and feature-supplied label. Do not move page-query state or zero-based adapters into it; out-of-range behavior stays feature-owned. |
| Resolved · Explicit instant validator: [daily-contract](../../apps/web/src/features/daily/lib/daily-contract.ts#L97); [evidence-contract](../../apps/web/src/features/daily/evidence/evidence-contract.ts#L125) | 2 consumer files; one explicitInstant regex/parser beside platform-calendar. | Original strict acceptance preserved; plan nullable adapter and full evidence/plan DTO validation remain separate. Regression exercises malformed dates/zones/ranges and offset equivalence through both consumers. |
| P3 · Ordinary room input styling: [study-room.css](../../apps/web/src/features/study-room/components/study-room.css#L5); [study-room.css](../../apps/web/src/features/study-room/components/study-room.css#L170); [study-room.css](../../apps/web/src/features/study-room/components/study-room.css#L298) | 3 CSS definitions used by5 files: lobby:53/56–58, policy:22, session:140, rhythm:42 (mapped3), track:27–28; existing Input primitive. | Already one CSS module, not5 copied components, but44px/border/background/padding/focus duplicated beside Input. Reuse Input for ordinary text/number/URL fields and remove only overlapping room declarations; retain label/grid/width/density overrides, native validation/valueAsNumber, stale rhythm and queue gates. Range/file/player inputs are purposeful native controls. |
| Resolved · URL mutation: [public-pages.tsx](../../apps/web/src/features/recognition/public-pages.tsx#L24); [admin-page.tsx](../../apps/web/src/features/recognition/admin-page.tsx#L27); [manual-question.ts](../../apps/web/src/features/questions/components/manual-question.ts#L111) | 3 equivalent implementations /4 screen compositions; list-navigation already owns safe page/return parsing. | Fresh sweep corrects the original2-copy finding: Question Bank has identical clone/set-delete/reset-page mechanics with typed allowed keys. Share only the pure mutation; retain parsing/draft/submit/navigation. Documents always resets page and News batches updates; neither belongs to this exact cluster. |
| P3 · Identity fallback/author strip: [document-detail-page.tsx](../../apps/web/src/pages/document-detail-page.tsx#L230); [news-detail-feature.tsx](../../apps/web/src/features/post/components/news-detail-feature.tsx#L277); [dashboard-post-list.tsx](../../apps/web/src/features/post/components/dashboard-post-list.tsx#L78); [admin-users-page.tsx](../../apps/web/src/pages/admin/users/admin-users-page.tsx#L124); [user-dropdown.tsx](../../apps/web/src/features/auth/components/user-dropdown.tsx#L52); [user-hover-card.tsx](../../apps/web/src/features/user/components/user-hover-card.tsx#L28) | 6 representative mounted files; AvatarImage shared, fallback/ring/name strip local. | Same identity-image presentation partially repeats; initials differ (charAt/[0], one Unicode initial, room two-word initials), as do menu/hover/name semantics. If revisited, extend user identity presentation around AvatarImage for size/fallback only; preserve crop, interactive trigger and fetched identity ownership. Do not replace group-private avatar fetches with public URLs. |
| P3 · Blob download mechanics: [components.tsx](../../apps/web/src/features/recognition/components.tsx#L60); [evidence-panel.tsx](../../apps/web/src/features/daily/evidence/evidence-panel.tsx#L87); [documents.service.ts](../../apps/web/src/features/documents/services/documents.service.ts#L36) | 3 files; no shared saveBlob helper. | Object URL → download anchor → delayed revoke repeats. Recognition/Daily use1000ms; Documents uses100ms and parses server filename after credential-free public byte fetch. A tiny blob-to-download helper may own anchor/revoke only with agreed delay; keep auth/abort/API/filename/retry/success semantics at each caller. This is not a generic private download service. |
| P3 · Section markup: [daily-groups-page.tsx](../../apps/web/src/pages/daily-groups-page.tsx#L67); [page-section.tsx](../../apps/web/src/components/ui/page-section.tsx#L13) | 1 local copy + existing definition used by12 files. | Same header/h2/content structure currently hand-written with shared classes. PageSection with study-work-surface class can own it if labelled-region equivalence and hidden/mounted private gates are retained. Flat styling is intentional; do not wrap it in a new card. |
| P3 · Guidance pages: [practice-page.tsx](../../apps/web/src/pages/practice-page.tsx#L8); [history-page.tsx](../../apps/web/src/pages/history-page.tsx#L8); [competitions-page.tsx](../../apps/web/src/pages/competitions-page.tsx#L8) | 3 files; PageHeader/Button and page-guidance__actions already shared. | Tiny repeated shell/2links; copy/destination/public gutter differ. A small local guidance composition is possible, but existing primitives/CSS already own the important behavior; extraction has low payoff and must retain truthful unavailable-feature content. |
| P3 · News item/thumbnail presentation: [home-latest-news-section.tsx](../../apps/web/src/features/home/components/home-latest-news-section.tsx#L10); [post-list-item.tsx](../../apps/web/src/features/post/components/post-list-item.tsx#L13); [post-thumbnail.tsx](../../apps/web/src/features/post/components/post-thumbnail.tsx#L10) | 2 live item definitions; existing PostBadge reused, PostThumbnail has1 routed +1 legacy consumer. | Image-error fallback and post title/type/date recur, but Home is a cinematic preview without list-return context; board items have pinned/expiry/return behavior and hide failed illustrations. PostThumbnail creates blurred-fill double images and has no error fallback, so it is not equivalent. Share only an actual repeated image-failure helper if needed; retain purposeful item variants. |
| P3 · Inactive legacy surfaces: [post-management.tsx](../../apps/web/src/features/post/components/post-management.tsx#L60); [document-grid.tsx](../../apps/web/src/features/documents/components/document-grid.tsx#L51); [document-data-table.tsx](../../apps/web/src/features/documents/components/document-data-table.tsx#L131); [public-page-header.tsx](../../apps/web/src/components/ui/public-page-header.tsx#L1) | 4 isolated examples; current owners are PostManagementFeature, DocumentList and PageHeader. | No incoming source imports/use from mounted app. Legacy files inflate Card/Badge/menu/table/pager adoption counts and can misdirect edits. Optional isolated removal after confirming downstream consumers; not a missing live adoption requirement. Old dashboard card family (3 copied frames at continue-learning:9, recent-activities:8, quick-actions:8) is also unmounted. |

## Inspected repetition that should stay local

| Evidence / count | Why extraction or owner replacement is not justified |
| --- | --- |
| [components.tsx](../../apps/web/src/features/recognition/components.tsx#L21); [manual-question-form.tsx](../../apps/web/src/features/questions/components/manual-question-form.tsx#L150) | 2 Field definitions. Recognition generates ID via render callback + optional hint; manual editor requires stable explicit IDs. Shared Label/Input already fit. RHF and floating fields have different geometry/validation APIs; do not create a universal Field simply from label + input repetition. |
| [daily-plan-editor.tsx](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L126); [daily-week-editor.tsx](../../apps/web/src/features/daily/components/daily-week-editor.tsx#L59) | 2 sets of replaceForm/edit/blocked/guard/fetch glue. Session, leave rules and800ms sync are already shared. Day permits absent server plan + task Add/Submit; week normalizes Monday and requires returned data. Only a narrowly demonstrated common guard helper is worth considering; no new generic editor/session engine. |
| [subject-directory.tsx](../../apps/web/src/features/subjects/components/subject-directory.tsx#L12); [string-utils.ts](../../apps/web/src/lib/string-utils.ts#L1); [combobox.tsx](../../apps/web/src/components/ui/combobox.tsx#L73) | 2 accent utilities plus1 search policy. Subjects lowercases/NFD/removes marks/đ/trims; code generation uses a case-preserving replacement table; Combobox is lowercase-only matching. These are not equivalent search contracts. Centralize normalization only after explicitly preserving or deciding those differences; no automatic filtering change. |
| [evidence-panel.tsx](../../apps/web/src/features/daily/evidence/evidence-panel.tsx#L179); [document-download-modal.tsx](../../apps/web/src/features/documents/components/document-download-modal.tsx#L18) | 2 formatBytes definitions: Daily rounds up to KiB after bytes; Documents displays scaled decimal precision with unknown/zero handling and KB/MB labels. Not byte-equivalent formatting. Keep until an agreed unit/precision policy makes a shared helper worthwhile. |
| [exam-contract.ts](../../apps/web/src/features/exams/exam-contract.ts#L7); [daily-contract.ts](../../apps/web/src/features/daily/lib/daily-contract.ts#L82) | 2 record and nullableText definitions. Exams reject arrays and coalesce absent nullable text to null; Daily record/absence handling differs. Never merge trust-boundary validators by name. Domain parseApiError wrappers also distinguish conflict/access-lost/contract failures rather than duplicate a universal error policy. |
| [figure-resolution.tsx](../../apps/web/src/features/questions/components/figure-resolution.tsx#L24); [paper-figure-resolver.tsx](../../apps/web/src/features/exams/components/paper-figure-resolver.tsx#L10) | 2 private figure resolvers/cache families. Questions require freshly confirmed profile authority and unsaved-question handling; paper scope includes token/revision/audience and frozen asset access. Similar object-URL code does not establish equivalent authorization lifecycle. Keep endpoint/cache/generation/visibility contracts separate. |
| [group-controls.tsx](../../apps/web/src/features/daily/groups/group-controls.tsx#L86); [room-music-dialog.tsx](../../apps/web/src/features/study-room/components/room-music-dialog.tsx#L26) | 2 native dialog owners. Group Create retains name/request/close/focus; room modal keeps the player mounted while hidden and owns body-lock restoration. Shared Dialog already owns other ordinary modals. Do not switch these merely to improve adoption counts. |
| [document-filters.tsx](../../apps/web/src/features/documents/components/document-filters.tsx#L142); [public-news-feature.tsx](../../apps/web/src/features/post/components/public-news-feature.tsx#L100); [post-badge.tsx](../../apps/web/src/features/post/components/post-badge.tsx#L22); [private-pages.tsx](../../apps/web/src/features/recognition/private-pages.tsx#L16) | Remove-filter buttons, category navigation Links, post-type span and data-status marker are4 different contracts, not interchangeable chips. PostBadge is shared domain styling, not Badge reuse; PostStatusBadge composes Badge. Recognition status maps do not mean post-status equivalence. |
| [components.tsx](../../apps/web/src/features/recognition/components.tsx#L15); [exam-feedback.tsx](../../apps/web/src/features/exams/components/exam-feedback.tsx#L3); [daily-account-gate.tsx](../../apps/web/src/features/daily/components/daily-account-gate.tsx#L6) | 3 feedback owners: Recognition pending-first query wrapper, Exams explicit flat messages, Daily fresh private identity gating. Public ListFeedback and compact management errors do not justify universalizing state precedence/permission. Content-shaped loading skeletons also remain local. |

## Coverage ledger: all 42 page entries

This ledger follows actual imports/re-exports and JSX branches. `PH` = PageHeader,
`PS` = PageSection; “local” means composed locally, not necessarily duplicated.
Role aliases/new-vs-detail paths reuse these entry files; route names and guard
ownership remain in [routes.tsx](../../apps/web/src/router/routes.tsx) and the
[family adoption table](web-ui-components.md#route-and-screen-adoption). Components
in multi-export Recognition/exam files are counted only in their actual branch.

| Page entry | Body inspected / shared ownership versus intentional local composition |
| --- | --- |
| [about-page.tsx](../../apps/web/src/pages/about-page.tsx) | PH/PS; public prose/guidance local. |
| [achievement-profile-page.tsx](../../apps/web/src/pages/achievement-profile-page.tsx) | Re-export → public-pages AchievementProfilePage: PH/PS/QueryFeedback/public achievement composition; no Honors search. |
| [admin/recognition-page.tsx](../../apps/web/src/pages/admin/recognition-page.tsx) | Re-export → admin-page: PH/PS/Field/QueryFeedback/Pager/Dialog; review permissions local. |
| [admin/users/admin-users-page.tsx](../../apps/web/src/pages/admin/users/admin-users-page.tsx) | PH/SearchInput/AppPagination/Table/Dialog/AvatarImage/Badge; user gates/feedback local. |
| [assessment-import-page.tsx](../../apps/web/src/pages/assessment-import-page.tsx) | PH/Card; shared assessment progress/draft/skeleton components, compact NativeSelect; job/retry semantics local. |
| [auth/forgot-password-page.tsx](../../apps/web/src/pages/auth/forgot-password-page.tsx) | ForgotPasswordForm: floating fields/Button/Turnstile owner; auth heading/status CSS. |
| [auth/login-page.tsx](../../apps/web/src/pages/auth/login-page.tsx) | LoginForm: floating fields/Button/Turnstile owner; password-login/session feedback local. |
| [auth/register-page.tsx](../../apps/web/src/pages/auth/register-page.tsx) | RegisterForm/resume/verification: floating fields/Turnstile; OTP/context gates local. |
| [auth/reset-password-page.tsx](../../apps/web/src/pages/auth/reset-password-page.tsx) | ResetPasswordForm: floating fields/Button; reset token/context local, no challenge widget here. |
| [auth/verify-email-page.tsx](../../apps/web/src/pages/auth/verify-email-page.tsx) | VerifyEmailCard: shared Button/auth status CSS; token verification local. |
| [competitions-page.tsx](../../apps/web/src/pages/competitions-page.tsx) | PH/Button; public guidance markup shares CSS, not a composed guidance owner. |
| [daily-groups-page.tsx](../../apps/web/src/pages/daily-groups-page.tsx) | GroupList/GroupScreen/GroupConsent: PH/native dialog/StudyDatePicker/Retry; manual PS-shaped markup; pending Daily creation repair. |
| [daily-owner-page.tsx](../../apps/web/src/pages/daily-owner-page.tsx) | Calendar/history PH; DailyPlanEditor: PH/PS/Checkbox/NativeSelect/Dialog/shared autosync; pending title validation recovery. |
| [daily-shared-review-page.tsx](../../apps/web/src/pages/daily-shared-review-page.tsx) | PH/PS/StudyDatePicker/StudyProgress/StudyEmpty/Retry/EvidencePanel; private day/week/revalidation branches local. |
| [daily-week-page.tsx](../../apps/web/src/pages/daily-week-page.tsx) | DailyWeekEditor: PH/StudyDatePicker/StudyDisclosure/DailySyncStatus/shared autosync; week adapter local. |
| [dashboard-page.tsx](../../apps/web/src/pages/dashboard-page.tsx) | PH/PS + navigation groups; shortcut Links local. Legacy dashboard card components not mounted. |
| [dashboard/categories/admin-categories-page.tsx](../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx) | PH/Tabs/Table/Dialog/AlertDialog; floating form fields in modal, metadata gates local. |
| [dashboard/documents/documents-management-page.tsx](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx) | PH/SearchInput/AppPagination; DashboardDocumentList/DocumentForm/RHF/Select/Dialog; RetryFeedback shared; range locally repeated. |
| [dashboard/posts/post-management-page.tsx](../../apps/web/src/pages/dashboard/posts/post-management-page.tsx) | PostManagementFeature → PH/SearchInput/AppPagination/PostForm/RHF/Select/Dialog; RetryFeedback shared; range locally repeated. |
| [document-detail-page.tsx](../../apps/web/src/pages/document-detail-page.tsx) | Title-token CSS/Badge/UserHoverCard/AvatarImage/Dialog/DocumentDownloadModal; reader header local. |
| [documents-page.tsx](../../apps/web/src/pages/documents-page.tsx) | DocumentFilters SearchInput/Combobox + DocumentList/ListFeedback/EmptyState/AppPagination; search-first sr-only h1. |
| [exam-drafts-page.tsx](../../apps/web/src/pages/exam-drafts-page.tsx) | ExamDraftList → domain Shell/PH/ExamLoading/ExamProblem; flat drafts and safe return local. |
| [exam-editor-page.tsx](../../apps/web/src/pages/exam-editor-page.tsx) | ExamEditor → PH/PS/NativeSelect; PublishedBank SearchInput/AppPagination; explicit save/publish placement local. |
| [exam-paper-page.tsx](../../apps/web/src/pages/exam-paper-page.tsx) | ExamPaperRead → Shell/PH/feedback/FrozenExamItem; student/staff/solutions/release gates local. |
| [exam-papers-page.tsx](../../apps/web/src/pages/exam-papers-page.tsx) | ExamPaperList → Shell/PH/feedback; versioned paper list local. |
| [exam-preview-page.tsx](../../apps/web/src/pages/exam-preview-page.tsx) | ExamPreview → Shell/PH/feedback + question-scoped item rendering; solutions/return local. |
| [history-page.tsx](../../apps/web/src/pages/history-page.tsx) | PH/Button; same guidance markup pattern as Practice, different copy. |
| [home-page.tsx](../../apps/web/src/pages/home-page.tsx) | HomeHeroSection/HomeStudyNotebook/HomeLatestNewsSection; Input/Button/Tabs/PostBadge, local hero/news item; no PH/SearchInput. |
| [honor-detail-page.tsx](../../apps/web/src/pages/honor-detail-page.tsx) | Re-export → HonorDetailPage: PH/PS/Participants/HonorImage/Dialog; album gates local, no list search. |
| [honors-page.tsx](../../apps/web/src/pages/honors-page.tsx) | Re-export → HonorsPage: PH/SearchInput/YearField/Field/Pager/QueryFeedback; explicit submit/URL local. |
| [my-achievements-page.tsx](../../apps/web/src/pages/my-achievements-page.tsx) | Re-export → private-pages: PH/PS/AchievementRecord/Field/native checkbox/evidence; explicit visibility/submission local. |
| [news-detail-page.tsx](../../apps/web/src/pages/news-detail-page.tsx) | NewsDetailFeature: token heading/Breadcrumb/AvatarImage/RichTextViewer/Dialog-owned ImageLightbox/PostListItem; reader local. |
| [news-page.tsx](../../apps/web/src/pages/news-page.tsx) | PublicNewsFeature: PH/SearchInput/Pinned PostListItem/NewsList/ListFeedback/EmptyState/AppPagination; category Links local. |
| [not-found-page.tsx](../../apps/web/src/pages/not-found-page.tsx) | WelcomeLayout/Button/Links; purposeful404 layout, no functional PH. |
| [practice-page.tsx](../../apps/web/src/pages/practice-page.tsx) | PH/Button; guidance CSS/markup, no fabricated exercises. |
| [profile-page.tsx](../../apps/web/src/pages/profile-page.tsx) | PH/PS/floating fields/AvatarImage/crop Dialog/AlertDialog; identity refresh/error presentation local. |
| [question-bank-page.tsx](../../apps/web/src/pages/question-bank-page.tsx) | PH/SearchInput/NativeSelect/AppPagination/Card/Skeleton; RetryFeedback shared; query filters remain local. |
| [question-detail-page.tsx](../../apps/web/src/pages/question-detail-page.tsx) | ManualQuestionWorkspace or legacy branch: both PH; manual PS/NativeSelect/local Field, legacy Card/Select/floating field; figure contracts local. |
| [rankings-page.tsx](../../apps/web/src/pages/rankings-page.tsx) | Re-export → RankingsPage: PH/YearField/Pager/QueryFeedback/RankingList/native ScoringRules; no Honors search. |
| [study-room-page.tsx](../../apps/web/src/pages/study-room-page.tsx) | StudyRoomSession: PH/menus/dialogs/RoomPolicyFields/native persistent music; scene/player/paging/room inputs local. |
| [subjects-page.tsx](../../apps/web/src/pages/subjects-page.tsx) | SubjectDirectory: PH/SearchInput; local accent matching/list/feedback/CSS skeleton with metadata states. |
| [toolkit-page.tsx](../../apps/web/src/pages/toolkit-page.tsx) | ToolkitFeature: PH/Tabs; GPA Input/NativeSelect and StudyRoomsLobby/RoomPolicyFields, validation/domain layouts local. |

## Direct definition/import/JSX evidence index

Expandable lists give every external direct site for the selected shared patterns,
including retained legacy files. Each link targets the JSX line; definition links
above target the owner. They count reuse of implementation, not cloned CSS.
`components/ui` internal composition is excluded from these counts: e.g.
RichTextEditor Select/Dialog, ImageLightbox Dialog, EmptyState ListFeedback,
AppPagination Pagination and Combobox PopoverContent.

<details>
<summary>PageHeader: 29 consumer files / 32 source sites</summary>

- [daily-plan-editor.tsx](../../apps/web/src/features/daily/components/daily-plan-editor.tsx): [223](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L223)
- [daily-week-editor.tsx](../../apps/web/src/features/daily/components/daily-week-editor.tsx): [126](../../apps/web/src/features/daily/components/daily-week-editor.tsx#L126)
- [group-controls.tsx](../../apps/web/src/features/daily/groups/group-controls.tsx): [60](../../apps/web/src/features/daily/groups/group-controls.tsx#L60)
- [exam-editor.tsx](../../apps/web/src/features/exams/components/exam-editor.tsx): [100](../../apps/web/src/features/exams/components/exam-editor.tsx#L100)
- [exam-read.tsx](../../apps/web/src/features/exams/components/exam-read.tsx): [17](../../apps/web/src/features/exams/components/exam-read.tsx#L17)
- [post-management-feature.tsx](../../apps/web/src/features/post/components/post-management-feature.tsx): [129](../../apps/web/src/features/post/components/post-management-feature.tsx#L129)
- [public-news-feature.tsx](../../apps/web/src/features/post/components/public-news-feature.tsx): [59](../../apps/web/src/features/post/components/public-news-feature.tsx#L59)
- [manual-question-form.tsx](../../apps/web/src/features/questions/components/manual-question-form.tsx): [450](../../apps/web/src/features/questions/components/manual-question-form.tsx#L450)
- [admin-page.tsx](../../apps/web/src/features/recognition/admin-page.tsx): [40](../../apps/web/src/features/recognition/admin-page.tsx#L40)
- [private-pages.tsx](../../apps/web/src/features/recognition/private-pages.tsx): [30](../../apps/web/src/features/recognition/private-pages.tsx#L30)
- [public-pages.tsx](../../apps/web/src/features/recognition/public-pages.tsx): [35](../../apps/web/src/features/recognition/public-pages.tsx#L35), [52](../../apps/web/src/features/recognition/public-pages.tsx#L52), [64](../../apps/web/src/features/recognition/public-pages.tsx#L64), [79](../../apps/web/src/features/recognition/public-pages.tsx#L79)
- [study-room-session.tsx](../../apps/web/src/features/study-room/components/study-room-session.tsx): [138](../../apps/web/src/features/study-room/components/study-room-session.tsx#L138)
- [subject-directory.tsx](../../apps/web/src/features/subjects/components/subject-directory.tsx): [27](../../apps/web/src/features/subjects/components/subject-directory.tsx#L27)
- [toolkit-feature.tsx](../../apps/web/src/features/toolkit/components/toolkit-feature.tsx): [14](../../apps/web/src/features/toolkit/components/toolkit-feature.tsx#L14)
- [about-page.tsx](../../apps/web/src/pages/about-page.tsx): [10](../../apps/web/src/pages/about-page.tsx#L10)
- [admin-users-page.tsx](../../apps/web/src/pages/admin/users/admin-users-page.tsx): [53](../../apps/web/src/pages/admin/users/admin-users-page.tsx#L53)
- [assessment-import-page.tsx](../../apps/web/src/pages/assessment-import-page.tsx): [84](../../apps/web/src/pages/assessment-import-page.tsx#L84)
- [competitions-page.tsx](../../apps/web/src/pages/competitions-page.tsx): [9](../../apps/web/src/pages/competitions-page.tsx#L9)
- [daily-groups-page.tsx](../../apps/web/src/pages/daily-groups-page.tsx): [37](../../apps/web/src/pages/daily-groups-page.tsx#L37)
- [daily-owner-page.tsx](../../apps/web/src/pages/daily-owner-page.tsx): [68](../../apps/web/src/pages/daily-owner-page.tsx#L68)
- [daily-shared-review-page.tsx](../../apps/web/src/pages/daily-shared-review-page.tsx): [48](../../apps/web/src/pages/daily-shared-review-page.tsx#L48)
- [dashboard-page.tsx](../../apps/web/src/pages/dashboard-page.tsx): [19](../../apps/web/src/pages/dashboard-page.tsx#L19)
- [admin-categories-page.tsx](../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx): [195](../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx#L195)
- [documents-management-page.tsx](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx): [121](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L121)
- [history-page.tsx](../../apps/web/src/pages/history-page.tsx): [9](../../apps/web/src/pages/history-page.tsx#L9)
- [practice-page.tsx](../../apps/web/src/pages/practice-page.tsx): [9](../../apps/web/src/pages/practice-page.tsx#L9)
- [profile-page.tsx](../../apps/web/src/pages/profile-page.tsx): [28](../../apps/web/src/pages/profile-page.tsx#L28)
- [question-bank-page.tsx](../../apps/web/src/pages/question-bank-page.tsx): [105](../../apps/web/src/pages/question-bank-page.tsx#L105)
- [question-detail-page.tsx](../../apps/web/src/pages/question-detail-page.tsx): [584](../../apps/web/src/pages/question-detail-page.tsx#L584)

</details>

<details>
<summary>PageSection: 12 consumer files / 20 source sites</summary>

- [daily-plan-editor.tsx](../../apps/web/src/features/daily/components/daily-plan-editor.tsx): [356](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L356)
- [exam-editor.tsx](../../apps/web/src/features/exams/components/exam-editor.tsx): [104](../../apps/web/src/features/exams/components/exam-editor.tsx#L104), [117](../../apps/web/src/features/exams/components/exam-editor.tsx#L117)
- [scientific-block-editor.tsx](../../apps/web/src/features/questions/components/scientific-block-editor.tsx): [346](../../apps/web/src/features/questions/components/scientific-block-editor.tsx#L346)
- [admin-page.tsx](../../apps/web/src/features/recognition/admin-page.tsx): [43](../../apps/web/src/features/recognition/admin-page.tsx#L43), [51](../../apps/web/src/features/recognition/admin-page.tsx#L51)
- [private-pages.tsx](../../apps/web/src/features/recognition/private-pages.tsx): [31](../../apps/web/src/features/recognition/private-pages.tsx#L31), [32](../../apps/web/src/features/recognition/private-pages.tsx#L32), [35](../../apps/web/src/features/recognition/private-pages.tsx#L35)
- [public-pages.tsx](../../apps/web/src/features/recognition/public-pages.tsx): [54](../../apps/web/src/features/recognition/public-pages.tsx#L54), [55](../../apps/web/src/features/recognition/public-pages.tsx#L55), [79](../../apps/web/src/features/recognition/public-pages.tsx#L79), [79](../../apps/web/src/features/recognition/public-pages.tsx#L79)
- [account-security-card.tsx](../../apps/web/src/features/user/components/account-security-card.tsx): [13](../../apps/web/src/features/user/components/account-security-card.tsx#L13)
- [profile-form.tsx](../../apps/web/src/features/user/components/profile-form.tsx): [46](../../apps/web/src/features/user/components/profile-form.tsx#L46)
- [about-page.tsx](../../apps/web/src/pages/about-page.tsx): [11](../../apps/web/src/pages/about-page.tsx#L11)
- [daily-shared-review-page.tsx](../../apps/web/src/pages/daily-shared-review-page.tsx): [60](../../apps/web/src/pages/daily-shared-review-page.tsx#L60)
- [dashboard-page.tsx](../../apps/web/src/pages/dashboard-page.tsx): [23](../../apps/web/src/pages/dashboard-page.tsx#L23)
- [profile-page.tsx](../../apps/web/src/pages/profile-page.tsx): [68](../../apps/web/src/pages/profile-page.tsx#L68), [82](../../apps/web/src/pages/profile-page.tsx#L82)

</details>

<details>
<summary>SearchInput: 9 consumer files / 9 source sites</summary>

- [document-filters.tsx](../../apps/web/src/features/documents/components/document-filters.tsx): [27](../../apps/web/src/features/documents/components/document-filters.tsx#L27)
- [exam-editor.tsx](../../apps/web/src/features/exams/components/exam-editor.tsx): [165](../../apps/web/src/features/exams/components/exam-editor.tsx#L165)
- [post-management-feature.tsx](../../apps/web/src/features/post/components/post-management-feature.tsx): [153](../../apps/web/src/features/post/components/post-management-feature.tsx#L153)
- [public-news-feature.tsx](../../apps/web/src/features/post/components/public-news-feature.tsx): [98](../../apps/web/src/features/post/components/public-news-feature.tsx#L98)
- [public-pages.tsx](../../apps/web/src/features/recognition/public-pages.tsx): [36](../../apps/web/src/features/recognition/public-pages.tsx#L36)
- [subject-directory.tsx](../../apps/web/src/features/subjects/components/subject-directory.tsx): [35](../../apps/web/src/features/subjects/components/subject-directory.tsx#L35)
- [admin-users-page.tsx](../../apps/web/src/pages/admin/users/admin-users-page.tsx): [57](../../apps/web/src/pages/admin/users/admin-users-page.tsx#L57)
- [documents-management-page.tsx](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx): [127](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L127)
- [question-bank-page.tsx](../../apps/web/src/pages/question-bank-page.tsx): [47](../../apps/web/src/pages/question-bank-page.tsx#L47)

</details>

<details>
<summary>NativeSelect: 14 consumer files / 24 source sites</summary>

- [assessment-draft-list.tsx](../../apps/web/src/features/assessment/components/assessment-draft-list.tsx): [64](../../apps/web/src/features/assessment/components/assessment-draft-list.tsx#L64), [69](../../apps/web/src/features/assessment/components/assessment-draft-list.tsx#L69)
- [daily-plan-editor.tsx](../../apps/web/src/features/daily/components/daily-plan-editor.tsx): [286](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L286), [305](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L305), [428](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L428)
- [group-controls.tsx](../../apps/web/src/features/daily/groups/group-controls.tsx): [216](../../apps/web/src/features/daily/groups/group-controls.tsx#L216)
- [exam-editor.tsx](../../apps/web/src/features/exams/components/exam-editor.tsx): [107](../../apps/web/src/features/exams/components/exam-editor.tsx#L107)
- [manual-question-form.tsx](../../apps/web/src/features/questions/components/manual-question-form.tsx): [479](../../apps/web/src/features/questions/components/manual-question-form.tsx#L479), [486](../../apps/web/src/features/questions/components/manual-question-form.tsx#L486), [509](../../apps/web/src/features/questions/components/manual-question-form.tsx#L509)
- [scientific-block-editor.tsx](../../apps/web/src/features/questions/components/scientific-block-editor.tsx): [398](../../apps/web/src/features/questions/components/scientific-block-editor.tsx#L398)
- [achievement-editor.tsx](../../apps/web/src/features/recognition/achievement-editor.tsx): [38](../../apps/web/src/features/recognition/achievement-editor.tsx#L38), [42](../../apps/web/src/features/recognition/achievement-editor.tsx#L42)
- [admin-page.tsx](../../apps/web/src/features/recognition/admin-page.tsx): [48](../../apps/web/src/features/recognition/admin-page.tsx#L48)
- [components.tsx](../../apps/web/src/features/recognition/components.tsx): [33](../../apps/web/src/features/recognition/components.tsx#L33), [86](../../apps/web/src/features/recognition/components.tsx#L86)
- [honor-editor.tsx](../../apps/web/src/features/recognition/honor-editor.tsx): [59](../../apps/web/src/features/recognition/honor-editor.tsx#L59), [59](../../apps/web/src/features/recognition/honor-editor.tsx#L59), [62](../../apps/web/src/features/recognition/honor-editor.tsx#L62)
- [room-policy-fields.tsx](../../apps/web/src/features/study-room/components/room-policy-fields.tsx): [13](../../apps/web/src/features/study-room/components/room-policy-fields.tsx#L13)
- [transfer-room-ownership.tsx](../../apps/web/src/features/study-room/components/transfer-room-ownership.tsx): [30](../../apps/web/src/features/study-room/components/transfer-room-ownership.tsx#L30)
- [gpa-calculator.tsx](../../apps/web/src/features/toolkit/components/gpa-calculator.tsx): [30](../../apps/web/src/features/toolkit/components/gpa-calculator.tsx#L30)
- [question-bank-page.tsx](../../apps/web/src/pages/question-bank-page.tsx): [125](../../apps/web/src/pages/question-bank-page.tsx#L125), [137](../../apps/web/src/pages/question-bank-page.tsx#L137)

</details>

<details>
<summary>Select: 3 consumer files / 8 source sites</summary>

- [document-form.tsx](../../apps/web/src/features/documents/components/document-form.tsx): [186](../../apps/web/src/features/documents/components/document-form.tsx#L186), [218](../../apps/web/src/features/documents/components/document-form.tsx#L218), [248](../../apps/web/src/features/documents/components/document-form.tsx#L248)
- [post-form.tsx](../../apps/web/src/features/post/components/post-form.tsx): [138](../../apps/web/src/features/post/components/post-form.tsx#L138), [179](../../apps/web/src/features/post/components/post-form.tsx#L179)
- [question-detail-page.tsx](../../apps/web/src/pages/question-detail-page.tsx): [315](../../apps/web/src/pages/question-detail-page.tsx#L315), [344](../../apps/web/src/pages/question-detail-page.tsx#L344), [388](../../apps/web/src/pages/question-detail-page.tsx#L388)

</details>

<details>
<summary>Combobox: 1 consumer files / 1 source sites</summary>

- [document-filters.tsx](../../apps/web/src/features/documents/components/document-filters.tsx): [100](../../apps/web/src/features/documents/components/document-filters.tsx#L100)

</details>

<details>
<summary>Dialog: 17 consumer files / 20 source sites</summary>

- [daily-plan-editor.tsx](../../apps/web/src/features/daily/components/daily-plan-editor.tsx): [235](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L235), [259](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L259)
- [evidence-panel.tsx](../../apps/web/src/features/daily/evidence/evidence-panel.tsx): [113](../../apps/web/src/features/daily/evidence/evidence-panel.tsx#L113), [137](../../apps/web/src/features/daily/evidence/evidence-panel.tsx#L137)
- [document-download-modal.tsx](../../apps/web/src/features/documents/components/document-download-modal.tsx): [90](../../apps/web/src/features/documents/components/document-download-modal.tsx#L90)
- [post-management-feature.tsx](../../apps/web/src/features/post/components/post-management-feature.tsx): [234](../../apps/web/src/features/post/components/post-management-feature.tsx#L234)
- [admin-page.tsx](../../apps/web/src/features/recognition/admin-page.tsx): [53](../../apps/web/src/features/recognition/admin-page.tsx#L53), [54](../../apps/web/src/features/recognition/admin-page.tsx#L54)
- [public-pages.tsx](../../apps/web/src/features/recognition/public-pages.tsx): [56](../../apps/web/src/features/recognition/public-pages.tsx#L56)
- [edit-room-rhythm.tsx](../../apps/web/src/features/study-room/components/edit-room-rhythm.tsx): [29](../../apps/web/src/features/study-room/components/edit-room-rhythm.tsx#L29)
- [room-track-dialog.tsx](../../apps/web/src/features/study-room/components/room-track-dialog.tsx): [21](../../apps/web/src/features/study-room/components/room-track-dialog.tsx#L21)
- [study-room-scene.tsx](../../apps/web/src/features/study-room/components/study-room-scene.tsx): [151](../../apps/web/src/features/study-room/components/study-room-scene.tsx#L151)
- [study-room-session.tsx](../../apps/web/src/features/study-room/components/study-room-session.tsx): [219](../../apps/web/src/features/study-room/components/study-room-session.tsx#L219)
- [transfer-room-ownership.tsx](../../apps/web/src/features/study-room/components/transfer-room-ownership.tsx): [23](../../apps/web/src/features/study-room/components/transfer-room-ownership.tsx#L23)
- [system-category-form-modal.tsx](../../apps/web/src/features/system-categories/components/system-category-form-modal.tsx): [101](../../apps/web/src/features/system-categories/components/system-category-form-modal.tsx#L101)
- [avatar-crop-dialog.tsx](../../apps/web/src/features/user/components/avatar-crop-dialog.tsx): [68](../../apps/web/src/features/user/components/avatar-crop-dialog.tsx#L68)
- [change-password-modal.tsx](../../apps/web/src/features/user/components/change-password-modal.tsx): [75](../../apps/web/src/features/user/components/change-password-modal.tsx#L75)
- [admin-users-page.tsx](../../apps/web/src/pages/admin/users/admin-users-page.tsx): [248](../../apps/web/src/pages/admin/users/admin-users-page.tsx#L248)
- [documents-management-page.tsx](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx): [211](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L211)
- [document-detail-page.tsx](../../apps/web/src/pages/document-detail-page.tsx): [353](../../apps/web/src/pages/document-detail-page.tsx#L353)

</details>

<details>
<summary>AlertDialog: 7 consumer files / 7 source sites</summary>

- [use-daily-confirm.tsx](../../apps/web/src/features/daily/ui/use-daily-confirm.tsx): [24](../../apps/web/src/features/daily/ui/use-daily-confirm.tsx#L24)
- [post-management-feature.tsx](../../apps/web/src/features/post/components/post-management-feature.tsx): [201](../../apps/web/src/features/post/components/post-management-feature.tsx#L201)
- [post-management.tsx](../../apps/web/src/features/post/components/post-management.tsx): [186](../../apps/web/src/features/post/components/post-management.tsx#L186) — unmounted legacy source
- [study-room-session.tsx](../../apps/web/src/features/study-room/components/study-room-session.tsx): [227](../../apps/web/src/features/study-room/components/study-room-session.tsx#L227)
- [avatar-upload-card.tsx](../../apps/web/src/features/user/components/avatar-upload-card.tsx): [158](../../apps/web/src/features/user/components/avatar-upload-card.tsx#L158)
- [admin-categories-page.tsx](../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx): [311](../../apps/web/src/pages/dashboard/categories/admin-categories-page.tsx#L311)
- [documents-management-page.tsx](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx): [177](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L177)

</details>

<details>
<summary>DropdownMenu: 4 consumer files / 4 source sites</summary>

- [user-dropdown.tsx](../../apps/web/src/features/auth/components/user-dropdown.tsx): [44](../../apps/web/src/features/auth/components/user-dropdown.tsx#L44)
- [daily-plan-editor.tsx](../../apps/web/src/features/daily/components/daily-plan-editor.tsx): [431](../../apps/web/src/features/daily/components/daily-plan-editor.tsx#L431)
- [document-grid.tsx](../../apps/web/src/features/documents/components/document-grid.tsx): [113](../../apps/web/src/features/documents/components/document-grid.tsx#L113) — unmounted legacy source
- [study-room-session.tsx](../../apps/web/src/features/study-room/components/study-room-session.tsx): [134](../../apps/web/src/features/study-room/components/study-room-session.tsx#L134)

</details>

<details>
<summary>Card: 9 consumer files / 25 source sites</summary>

- [assessment-draft-list.tsx](../../apps/web/src/features/assessment/components/assessment-draft-list.tsx): [54](../../apps/web/src/features/assessment/components/assessment-draft-list.tsx#L54)
- [assessment-import-progress.tsx](../../apps/web/src/features/assessment/components/assessment-import-progress.tsx): [23](../../apps/web/src/features/assessment/components/assessment-import-progress.tsx#L23)
- [assessment-import-skeleton.tsx](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx): [6](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L6), [43](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L43)
- [document-grid.tsx](../../apps/web/src/features/documents/components/document-grid.tsx): [51](../../apps/web/src/features/documents/components/document-grid.tsx#L51) — unmounted legacy source
- [post-card.tsx](../../apps/web/src/features/post/components/post-card.tsx): [42](../../apps/web/src/features/post/components/post-card.tsx#L42) — unmounted legacy source
- [post-form.tsx](../../apps/web/src/features/post/components/post-form.tsx): [113](../../apps/web/src/features/post/components/post-form.tsx#L113), [200](../../apps/web/src/features/post/components/post-form.tsx#L200), [227](../../apps/web/src/features/post/components/post-form.tsx#L227)
- [assessment-import-page.tsx](../../apps/web/src/pages/assessment-import-page.tsx): [90](../../apps/web/src/pages/assessment-import-page.tsx#L90), [187](../../apps/web/src/pages/assessment-import-page.tsx#L187), [211](../../apps/web/src/pages/assessment-import-page.tsx#L211)
- [question-bank-page.tsx](../../apps/web/src/pages/question-bank-page.tsx): [167](../../apps/web/src/pages/question-bank-page.tsx#L167), [176](../../apps/web/src/pages/question-bank-page.tsx#L176)
- [question-detail-page.tsx](../../apps/web/src/pages/question-detail-page.tsx): [105](../../apps/web/src/pages/question-detail-page.tsx#L105), [120](../../apps/web/src/pages/question-detail-page.tsx#L120), [155](../../apps/web/src/pages/question-detail-page.tsx#L155), [196](../../apps/web/src/pages/question-detail-page.tsx#L196), [207](../../apps/web/src/pages/question-detail-page.tsx#L207), [221](../../apps/web/src/pages/question-detail-page.tsx#L221), [305](../../apps/web/src/pages/question-detail-page.tsx#L305), [411](../../apps/web/src/pages/question-detail-page.tsx#L411), [431](../../apps/web/src/pages/question-detail-page.tsx#L431), [451](../../apps/web/src/pages/question-detail-page.tsx#L451), [546](../../apps/web/src/pages/question-detail-page.tsx#L546)

</details>

<details>
<summary>Badge: 11 consumer files / 18 source sites</summary>

- [dashboard-document-list.tsx](../../apps/web/src/features/documents/components/dashboard-document-list.tsx): [56](../../apps/web/src/features/documents/components/dashboard-document-list.tsx#L56), [61](../../apps/web/src/features/documents/components/dashboard-document-list.tsx#L61)
- [document-data-table.tsx](../../apps/web/src/features/documents/components/document-data-table.tsx): [47](../../apps/web/src/features/documents/components/document-data-table.tsx#L47), [52](../../apps/web/src/features/documents/components/document-data-table.tsx#L52) — unmounted legacy source
- [document-grid.tsx](../../apps/web/src/features/documents/components/document-grid.tsx): [105](../../apps/web/src/features/documents/components/document-grid.tsx#L105), [143](../../apps/web/src/features/documents/components/document-grid.tsx#L143) — unmounted legacy source
- [post-status-badge.tsx](../../apps/web/src/features/post/components/post-status-badge.tsx): [41](../../apps/web/src/features/post/components/post-status-badge.tsx#L41)
- [manual-question-form.tsx](../../apps/web/src/features/questions/components/manual-question-form.tsx): [452](../../apps/web/src/features/questions/components/manual-question-form.tsx#L452)
- [avatar-upload-card.tsx](../../apps/web/src/features/user/components/avatar-upload-card.tsx): [138](../../apps/web/src/features/user/components/avatar-upload-card.tsx#L138), [139](../../apps/web/src/features/user/components/avatar-upload-card.tsx#L139)
- [user-hover-card.tsx](../../apps/web/src/features/user/components/user-hover-card.tsx): [43](../../apps/web/src/features/user/components/user-hover-card.tsx#L43)
- [admin-users-page.tsx](../../apps/web/src/pages/admin/users/admin-users-page.tsx): [148](../../apps/web/src/pages/admin/users/admin-users-page.tsx#L148), [162](../../apps/web/src/pages/admin/users/admin-users-page.tsx#L162)
- [document-detail-page.tsx](../../apps/web/src/pages/document-detail-page.tsx): [203](../../apps/web/src/pages/document-detail-page.tsx#L203), [206](../../apps/web/src/pages/document-detail-page.tsx#L206), [213](../../apps/web/src/pages/document-detail-page.tsx#L213)
- [question-bank-page.tsx](../../apps/web/src/pages/question-bank-page.tsx): [182](../../apps/web/src/pages/question-bank-page.tsx#L182)
- [question-detail-page.tsx](../../apps/web/src/pages/question-detail-page.tsx): [586](../../apps/web/src/pages/question-detail-page.tsx#L586)

</details>

<details>
<summary>Floating FormField: 10 consumer files / 21 source sites</summary>

- [forgot-password-form.tsx](../../apps/web/src/features/auth/components/forgot-password-form.tsx): [76](../../apps/web/src/features/auth/components/forgot-password-form.tsx#L76)
- [login-form.tsx](../../apps/web/src/features/auth/components/login-form.tsx): [60](../../apps/web/src/features/auth/components/login-form.tsx#L60), [70](../../apps/web/src/features/auth/components/login-form.tsx#L70)
- [register-form.tsx](../../apps/web/src/features/auth/components/register-form.tsx): [121](../../apps/web/src/features/auth/components/register-form.tsx#L121), [133](../../apps/web/src/features/auth/components/register-form.tsx#L133), [144](../../apps/web/src/features/auth/components/register-form.tsx#L144), [155](../../apps/web/src/features/auth/components/register-form.tsx#L155), [165](../../apps/web/src/features/auth/components/register-form.tsx#L165)
- [registration-verification.tsx](../../apps/web/src/features/auth/components/registration-verification.tsx): [124](../../apps/web/src/features/auth/components/registration-verification.tsx#L124), [140](../../apps/web/src/features/auth/components/registration-verification.tsx#L140)
- [reset-password-form.tsx](../../apps/web/src/features/auth/components/reset-password-form.tsx): [85](../../apps/web/src/features/auth/components/reset-password-form.tsx#L85), [95](../../apps/web/src/features/auth/components/reset-password-form.tsx#L95)
- [resume-registration-form.tsx](../../apps/web/src/features/auth/components/resume-registration-form.tsx): [45](../../apps/web/src/features/auth/components/resume-registration-form.tsx#L45), [46](../../apps/web/src/features/auth/components/resume-registration-form.tsx#L46)
- [system-category-form-modal.tsx](../../apps/web/src/features/system-categories/components/system-category-form-modal.tsx): [107](../../apps/web/src/features/system-categories/components/system-category-form-modal.tsx#L107), [115](../../apps/web/src/features/system-categories/components/system-category-form-modal.tsx#L115)
- [change-password-modal.tsx](../../apps/web/src/features/user/components/change-password-modal.tsx): [86](../../apps/web/src/features/user/components/change-password-modal.tsx#L86), [98](../../apps/web/src/features/user/components/change-password-modal.tsx#L98), [110](../../apps/web/src/features/user/components/change-password-modal.tsx#L110)
- [profile-form.tsx](../../apps/web/src/features/user/components/profile-form.tsx): [49](../../apps/web/src/features/user/components/profile-form.tsx#L49)
- [question-detail-page.tsx](../../apps/web/src/pages/question-detail-page.tsx): [375](../../apps/web/src/pages/question-detail-page.tsx#L375)

</details>

<details>
<summary>RHF FormField: 2 consumer files / 13 source sites</summary>

- [document-form.tsx](../../apps/web/src/features/documents/components/document-form.tsx): [153](../../apps/web/src/features/documents/components/document-form.tsx#L153), [178](../../apps/web/src/features/documents/components/document-form.tsx#L178), [210](../../apps/web/src/features/documents/components/document-form.tsx#L210), [242](../../apps/web/src/features/documents/components/document-form.tsx#L242), [273](../../apps/web/src/features/documents/components/document-form.tsx#L273)
- [post-form.tsx](../../apps/web/src/features/post/components/post-form.tsx): [118](../../apps/web/src/features/post/components/post-form.tsx#L118), [132](../../apps/web/src/features/post/components/post-form.tsx#L132), [155](../../apps/web/src/features/post/components/post-form.tsx#L155), [173](../../apps/web/src/features/post/components/post-form.tsx#L173), [191](../../apps/web/src/features/post/components/post-form.tsx#L191), [192](../../apps/web/src/features/post/components/post-form.tsx#L192), [205](../../apps/web/src/features/post/components/post-form.tsx#L205), [232](../../apps/web/src/features/post/components/post-form.tsx#L232)

</details>

<details>
<summary>AppPagination: 9 consumer files / 9 source sites</summary>

- [exam-editor.tsx](../../apps/web/src/features/exams/components/exam-editor.tsx): [172](../../apps/web/src/features/exams/components/exam-editor.tsx#L172)
- [post-management-feature.tsx](../../apps/web/src/features/post/components/post-management-feature.tsx): [193](../../apps/web/src/features/post/components/post-management-feature.tsx#L193)
- [post-management.tsx](../../apps/web/src/features/post/components/post-management.tsx): [177](../../apps/web/src/features/post/components/post-management.tsx#L177) — unmounted legacy source
- [public-news-feature.tsx](../../apps/web/src/features/post/components/public-news-feature.tsx): [145](../../apps/web/src/features/post/components/public-news-feature.tsx#L145)
- [components.tsx](../../apps/web/src/features/recognition/components.tsx): [30](../../apps/web/src/features/recognition/components.tsx#L30)
- [admin-users-page.tsx](../../apps/web/src/pages/admin/users/admin-users-page.tsx): [197](../../apps/web/src/pages/admin/users/admin-users-page.tsx#L197)
- [documents-management-page.tsx](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx): [168](../../apps/web/src/pages/dashboard/documents/documents-management-page.tsx#L168)
- [documents-page.tsx](../../apps/web/src/pages/documents-page.tsx): [128](../../apps/web/src/pages/documents-page.tsx#L128)
- [question-bank-page.tsx](../../apps/web/src/pages/question-bank-page.tsx): [269](../../apps/web/src/pages/question-bank-page.tsx#L269)

</details>

<details>
<summary>Skeleton: 13 consumer files / 135 source sites</summary>

- [assessment-import-skeleton.tsx](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx): [10](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L10), [12](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L12), [13](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L13), [16](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L16), [18](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L18), [19](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L19), [25](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L25), [26](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L26), [39](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L39), [40](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L40), [45](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L45), [46](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L46), [50](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L50), [52](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L52), [53](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L53), [56](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L56), [57](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L57), [58](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L58), [62](../../apps/web/src/features/assessment/components/assessment-import-skeleton.tsx#L62)
- [verify-email-card.tsx](../../apps/web/src/features/auth/components/verify-email-card.tsx): [56](../../apps/web/src/features/auth/components/verify-email-card.tsx#L56), [57](../../apps/web/src/features/auth/components/verify-email-card.tsx#L57), [58](../../apps/web/src/features/auth/components/verify-email-card.tsx#L58), [59](../../apps/web/src/features/auth/components/verify-email-card.tsx#L59)
- [document-card-skeleton.tsx](../../apps/web/src/features/documents/components/document-card-skeleton.tsx): [7](../../apps/web/src/features/documents/components/document-card-skeleton.tsx#L7), [11](../../apps/web/src/features/documents/components/document-card-skeleton.tsx#L11), [12](../../apps/web/src/features/documents/components/document-card-skeleton.tsx#L12), [14](../../apps/web/src/features/documents/components/document-card-skeleton.tsx#L14), [18](../../apps/web/src/features/documents/components/document-card-skeleton.tsx#L18), [19](../../apps/web/src/features/documents/components/document-card-skeleton.tsx#L19), [21](../../apps/web/src/features/documents/components/document-card-skeleton.tsx#L21)
- [document-list-item-skeleton.tsx](../../apps/web/src/features/documents/components/document-list-item-skeleton.tsx): [7](../../apps/web/src/features/documents/components/document-list-item-skeleton.tsx#L7), [8](../../apps/web/src/features/documents/components/document-list-item-skeleton.tsx#L8), [11](../../apps/web/src/features/documents/components/document-list-item-skeleton.tsx#L11), [12](../../apps/web/src/features/documents/components/document-list-item-skeleton.tsx#L12), [15](../../apps/web/src/features/documents/components/document-list-item-skeleton.tsx#L15), [18](../../apps/web/src/features/documents/components/document-list-item-skeleton.tsx#L18)
- [news-detail-feature.tsx](../../apps/web/src/features/post/components/news-detail-feature.tsx): [56](../../apps/web/src/features/post/components/news-detail-feature.tsx#L56), [58](../../apps/web/src/features/post/components/news-detail-feature.tsx#L58), [60](../../apps/web/src/features/post/components/news-detail-feature.tsx#L60), [69](../../apps/web/src/features/post/components/news-detail-feature.tsx#L69), [70](../../apps/web/src/features/post/components/news-detail-feature.tsx#L70), [73](../../apps/web/src/features/post/components/news-detail-feature.tsx#L73), [74](../../apps/web/src/features/post/components/news-detail-feature.tsx#L74), [75](../../apps/web/src/features/post/components/news-detail-feature.tsx#L75), [78](../../apps/web/src/features/post/components/news-detail-feature.tsx#L78), [80](../../apps/web/src/features/post/components/news-detail-feature.tsx#L80), [81](../../apps/web/src/features/post/components/news-detail-feature.tsx#L81), [85](../../apps/web/src/features/post/components/news-detail-feature.tsx#L85), [92](../../apps/web/src/features/post/components/news-detail-feature.tsx#L92), [94](../../apps/web/src/features/post/components/news-detail-feature.tsx#L94), [95](../../apps/web/src/features/post/components/news-detail-feature.tsx#L95), [99](../../apps/web/src/features/post/components/news-detail-feature.tsx#L99), [100](../../apps/web/src/features/post/components/news-detail-feature.tsx#L100), [101](../../apps/web/src/features/post/components/news-detail-feature.tsx#L101), [103](../../apps/web/src/features/post/components/news-detail-feature.tsx#L103), [104](../../apps/web/src/features/post/components/news-detail-feature.tsx#L104), [105](../../apps/web/src/features/post/components/news-detail-feature.tsx#L105), [107](../../apps/web/src/features/post/components/news-detail-feature.tsx#L107), [108](../../apps/web/src/features/post/components/news-detail-feature.tsx#L108), [109](../../apps/web/src/features/post/components/news-detail-feature.tsx#L109), [112](../../apps/web/src/features/post/components/news-detail-feature.tsx#L112), [113](../../apps/web/src/features/post/components/news-detail-feature.tsx#L113), [113](../../apps/web/src/features/post/components/news-detail-feature.tsx#L113), [113](../../apps/web/src/features/post/components/news-detail-feature.tsx#L113)
- [post-card-skeleton.tsx](../../apps/web/src/features/post/components/post-card-skeleton.tsx): [10](../../apps/web/src/features/post/components/post-card-skeleton.tsx#L10), [12](../../apps/web/src/features/post/components/post-card-skeleton.tsx#L12), [12](../../apps/web/src/features/post/components/post-card-skeleton.tsx#L12), [13](../../apps/web/src/features/post/components/post-card-skeleton.tsx#L13), [13](../../apps/web/src/features/post/components/post-card-skeleton.tsx#L13), [14](../../apps/web/src/features/post/components/post-card-skeleton.tsx#L14), [14](../../apps/web/src/features/post/components/post-card-skeleton.tsx#L14), [15](../../apps/web/src/features/post/components/post-card-skeleton.tsx#L15) — unmounted legacy source
- [system-category-data-table.tsx](../../apps/web/src/features/system-categories/components/system-category-data-table.tsx): [57](../../apps/web/src/features/system-categories/components/system-category-data-table.tsx#L57), [62](../../apps/web/src/features/system-categories/components/system-category-data-table.tsx#L62), [63](../../apps/web/src/features/system-categories/components/system-category-data-table.tsx#L63)
- [document-detail-page.tsx](../../apps/web/src/pages/document-detail-page.tsx): [112](../../apps/web/src/pages/document-detail-page.tsx#L112), [120](../../apps/web/src/pages/document-detail-page.tsx#L120), [121](../../apps/web/src/pages/document-detail-page.tsx#L121), [122](../../apps/web/src/pages/document-detail-page.tsx#L122), [126](../../apps/web/src/pages/document-detail-page.tsx#L126), [127](../../apps/web/src/pages/document-detail-page.tsx#L127), [132](../../apps/web/src/pages/document-detail-page.tsx#L132), [134](../../apps/web/src/pages/document-detail-page.tsx#L134), [135](../../apps/web/src/pages/document-detail-page.tsx#L135), [138](../../apps/web/src/pages/document-detail-page.tsx#L138), [139](../../apps/web/src/pages/document-detail-page.tsx#L139), [140](../../apps/web/src/pages/document-detail-page.tsx#L140), [141](../../apps/web/src/pages/document-detail-page.tsx#L141), [142](../../apps/web/src/pages/document-detail-page.tsx#L142), [143](../../apps/web/src/pages/document-detail-page.tsx#L143), [149](../../apps/web/src/pages/document-detail-page.tsx#L149), [150](../../apps/web/src/pages/document-detail-page.tsx#L150), [158](../../apps/web/src/pages/document-detail-page.tsx#L158), [165](../../apps/web/src/pages/document-detail-page.tsx#L165), [166](../../apps/web/src/pages/document-detail-page.tsx#L166), [172](../../apps/web/src/pages/document-detail-page.tsx#L172), [173](../../apps/web/src/pages/document-detail-page.tsx#L173), [174](../../apps/web/src/pages/document-detail-page.tsx#L174), [175](../../apps/web/src/pages/document-detail-page.tsx#L175), [176](../../apps/web/src/pages/document-detail-page.tsx#L176)
- [profile-page.tsx](../../apps/web/src/pages/profile-page.tsx): [55](../../apps/web/src/pages/profile-page.tsx#L55), [57](../../apps/web/src/pages/profile-page.tsx#L57), [58](../../apps/web/src/pages/profile-page.tsx#L58)
- [question-bank-page.tsx](../../apps/web/src/pages/question-bank-page.tsx): [152](../../apps/web/src/pages/question-bank-page.tsx#L152), [153](../../apps/web/src/pages/question-bank-page.tsx#L153)
- [question-detail-page.tsx](../../apps/web/src/pages/question-detail-page.tsx): [103](../../apps/web/src/pages/question-detail-page.tsx#L103), [104](../../apps/web/src/pages/question-detail-page.tsx#L104), [107](../../apps/web/src/pages/question-detail-page.tsx#L107), [108](../../apps/web/src/pages/question-detail-page.tsx#L108), [109](../../apps/web/src/pages/question-detail-page.tsx#L109), [110](../../apps/web/src/pages/question-detail-page.tsx#L110)
- [guest-route.tsx](../../apps/web/src/router/guards/guest-route.tsx): [28](../../apps/web/src/router/guards/guest-route.tsx#L28), [29](../../apps/web/src/router/guards/guest-route.tsx#L29), [30](../../apps/web/src/router/guards/guest-route.tsx#L30), [31](../../apps/web/src/router/guards/guest-route.tsx#L31), [36](../../apps/web/src/router/guards/guest-route.tsx#L36), [37](../../apps/web/src/router/guards/guest-route.tsx#L37), [43](../../apps/web/src/router/guards/guest-route.tsx#L43), [44](../../apps/web/src/router/guards/guest-route.tsx#L44), [45](../../apps/web/src/router/guards/guest-route.tsx#L45), [48](../../apps/web/src/router/guards/guest-route.tsx#L48), [55](../../apps/web/src/router/guards/guest-route.tsx#L55), [56](../../apps/web/src/router/guards/guest-route.tsx#L56), [62](../../apps/web/src/router/guards/guest-route.tsx#L62), [63](../../apps/web/src/router/guards/guest-route.tsx#L63), [66](../../apps/web/src/router/guards/guest-route.tsx#L66), [67](../../apps/web/src/router/guards/guest-route.tsx#L67), [75](../../apps/web/src/router/guards/guest-route.tsx#L75), [77](../../apps/web/src/router/guards/guest-route.tsx#L77), [80](../../apps/web/src/router/guards/guest-route.tsx#L80), [86](../../apps/web/src/router/guards/guest-route.tsx#L86), [87](../../apps/web/src/router/guards/guest-route.tsx#L87), [91](../../apps/web/src/router/guards/guest-route.tsx#L91), [95](../../apps/web/src/router/guards/guest-route.tsx#L95)
- [session-loading.tsx](../../apps/web/src/router/guards/session-loading.tsx): [8](../../apps/web/src/router/guards/session-loading.tsx#L8)

</details>

<details>
<summary>ListFeedback: 2 consumer files / 2 source sites</summary>

- [document-list.tsx](../../apps/web/src/features/documents/components/document-list.tsx): [25](../../apps/web/src/features/documents/components/document-list.tsx#L25)
- [news-list.tsx](../../apps/web/src/features/post/components/news-list.tsx): [28](../../apps/web/src/features/post/components/news-list.tsx#L28)

</details>

<details>
<summary>EmptyState: 4 consumer files / 4 source sites</summary>

- [dashboard-document-list.tsx](../../apps/web/src/features/documents/components/dashboard-document-list.tsx): [19](../../apps/web/src/features/documents/components/dashboard-document-list.tsx#L19)
- [document-list.tsx](../../apps/web/src/features/documents/components/document-list.tsx): [63](../../apps/web/src/features/documents/components/document-list.tsx#L63)
- [dashboard-post-list.tsx](../../apps/web/src/features/post/components/dashboard-post-list.tsx): [21](../../apps/web/src/features/post/components/dashboard-post-list.tsx#L21)
- [news-list.tsx](../../apps/web/src/features/post/components/news-list.tsx): [35](../../apps/web/src/features/post/components/news-list.tsx#L35)

</details>

## Choosing the next consolidation

The three selected clusters are implemented; no other cluster is silently
accepted for extraction. Remaining row/footer copies are low-risk presentation
opportunities but lower benefit than the keyboard/validation ownership just
completed. Two-use opportunities with different contracts stay local unless a
real maintenance or interaction problem warrants a bounded adaptation. Preserve
feature-owned requests, consent, drafts, navigation, query and private authority;
no strategy props, query engine or universal page/editor framework.

The installed UI/UX Pro Max React search returned composition and single-responsibility
guidance (`stacks/react.csv`). Vercel's public Web Interface Guidelines were fetched
for semantic native activation/focus checks. They support judgment, not adoption
counts or new product policy. Source files/imports/AST sites are the evidence; the original
audit used source facts; the separate three-cluster probe adds only its recorded
synthetic screen/state coverage (see status), not whole-application proof.


## Visual presentation and creation ownership (10/10/2026)

Shared import adoption was insufficient evidence of visual usability. The local
candidate on `f7db010` extends responsible Card/PageSection/table/guidance tokens
with visible edges and restrained elevation; semantic article/list cards reuse
CSS rather than claim composed-component reuse. Honors groups media/body/metadata/
participants/action; Documents, News, catalogue, management, exams, dashboard and
GPA receive fitting surface/layout adoption. Readers, rankings, Daily calendars/
notebooks, auth shells and persistent rooms retain purposeful differing structure.
The [42-entry source ledger and complete creation inventory](web-ui-components.md#visual-and-creation-coverage-10102026)
record actual owners and exceptions. CreationDialog has12 mounted frame call sites
in11 consumer files; form validation, submission/query semantics, permissions,
media access and publication remain local. No universal upload/editor/record engine,
new dependency or speculative extraction. Superseded inline/new-route create
presentation is removed from actual consumers; legacy unrouted management remains
honestly outside routed adoption. Existing repeated business contracts are not
merged solely for appearance. Representative rendered comparisons are separate
from this source ownership evidence; see existing status for exact proof limits.

### Visual follow-up beyond component reuse (10/10/2026)

Reuse alone does not establish usable grouping. The current local candidate also
extends actual owners for News occupied pinned columns, responsive document-reader
viewport/action stacking, RankingList comparison surface, public chronological year
groups, stacked tablet profile identity, compact divided GPA rows and44px category
tabs. These remain feature compositions with existing shared surface tokens, not
new universal wrappers. See the [responsible owners](web-ui-components.md#responsible-local-compositions-beyond-honors)
and42-page ledger for changed/inherited/purposeful variants. No new cross-feature
business contracts or dependencies are introduced.

Question Bank now composes existing CardHeader/Content/Footer, while the two exam
list variants share feature-local ExamListItem with Badge/Link/surface tokens.
This is equivalent list presentation only; frozen reader/release contracts remain
separate and no feature rules move into global UI.


## Document discovery supplement (10/10/2026)

On accepted62-path visual candidate1871e3d/basef7db010, three mounted document
thumbnail sites now share the feature-owned
[DocumentThumbnail](../../apps/web/src/features/documents/components/document-thumbnail.tsx):
[public card](../../apps/web/src/features/documents/components/document-card.tsx),
[public list row](../../apps/web/src/features/documents/components/document-list-item.tsx),
[management row](../../apps/web/src/features/documents/components/dashboard-document-list.tsx).
All three consume server thumbnailUrl; they share contained page sizing/load/error
fallback, not storage authorization or download callbacks. Previously cards and
management rows independently rendered img-or-icon, and list rows had no preview.
No source-wide count refresh is claimed from this bounded supplement; the42-page
ledger remains discoverable in the component reference. Unrouted legacy DocumentGrid
is intentionally excluded from mounted adoption, not counted as migrated.

Existing StorageService/CloudinaryStorageService already owned page1 URL generation.
This supplement constrains unsigned public document/PDF candidates and improves
presentation, rather than adding a PDF rendering/upload framework. Actual storage
cases and retained metadata limitations are in the
[component reference](web-ui-components.md#document-discovery-preview-storage-cases-10102026).
Card/list metadata presentation shares document-owned CSS; different list/grid
compositions and management permission/action semantics remain purposeful.


## News discovery supplement (10/10/2026)

The mounted public News discovery and reader extend existing feature compositions,
not a new universal card/filter/reader system. PublicNewsFeature retains SearchInput,
PageHeader, filter-panel, Button, native type Links, AppPagination and independent
query ownership; only arrangement/clear guidance changes. NewsList and the pinned
band still share PostListItem board presentation (two call sites); its related-card
variant remains purposefully different. NewsDetailFeature still uses the installed
ImageLightbox/Dialog and reader owners, with bounded measure/spacing and announced
TOC state. The public research maps directly to learner tasks in
[web-ui.md](web-ui.md#documents-and-news-catalogue--editorial-discovery-10102026).
DocumentThumbnail has three actual consumers; no shadow PDF transform/render owner
was introduced. These verified bounded changes supplement the prior42-page source
ledger and do not claim a new all-screen scan or all-screen live validation.
