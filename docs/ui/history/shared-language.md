# Shared language decisions and automatic list search

> Preserved checkpoint record: `7a70002` (14/10/2026). Dated claims, counts, pending/publication states and temporary evidence paths below describe their original checkpoints; they are not current release or live-proof claims.

## Bounded shared-owner consolidation (09/10/2026, uncommitted)

Ordinary POST file-pick actions use the existing native Button, not click-only
containers or custom Enter/Space handlers. POST-owned validatePostImage alone
owns the existing image-MIME/5MiB client feedback rule; existing storageService
and separate thumbnail-ID/editor-URL completions remain. Keep disabled/busy gates,
same-file retry, visible keyboard focus and44px preview actions.

Compact document/post management and Question Bank error alerts use RetryFeedback
beside ListFeedback. Share presentation only; feature-owned state precedence,
request/retry gate and callbacks stay local. Public illustrated feedback/private
revalidation have different purposes. Daily's identical explicit-zone timestamp
validation belongs beside platform-calendar, reused by plan/evidence adapters
without merging DTO contracts or changing editor/auto-sync policy. Actual APIs,
consumer counts and evidence are in the [owner reference](component-adoption-20261009-10.md#three-cluster-consolidation-working-candidate-09102026).

Equivalent residual presentation/mechanics now have responsible owners: immutable
`replaceListParam` beside list-navigation; Toolkit decimal syntax; DailyReflectionField;
management row/actions and range footer; cached-refresh InlineRetryFeedback;
existing Button `destructive-solid` variant; UUID lexical predicate. Use their
[actual APIs/adoption](reuse-audit-20261009-10.md#completed-residual-consolidation-09102026)
when the behavior fits. Keep submission, query/cache precedence, page clamping,
validation ranges, DTO adapters, permissions and editor/sync lifecycles local.
Solid-danger confirmation appearance is preserved; tinted destructive remains a
different existing treatment. Shared styling never implies shared business semantics.

## Current navigation-shell decision (05/10/2026)

This decision supersedes the older floating-header/bottom-sheet/manual-motion choices below; those paragraphs describe earlier iterations, not the mounted navigation contract. Navigation alone is being redesigned; unrelated page bodies, destinations and role guards remain unchanged. Use the same palette/type tokens. The public header is aligned with the functional page container; at >=1200px it shows primary discovery links, at 768–1199px it keeps Môn học/Tài liệu/Bảng tin direct, and below 768px it keeps brand/sign-in or account/Menu. A shared left drawer preserves every existing destination grouped by role, with destinations first and auth actions at the bottom. Theme switching stays in the mobile top navbar; tablet/desktop drawers retain their existing theme footer.

Workspace navigation separates personal/content/system tasks from public discovery. Staff have Overview, content/system management, then personal Daily/profile destinations. Students retain personal work destinations. At >=1200px use a collapsible readable sidebar; at 768–1199px use an 88px labelled shortcut rail with direct Overview/Daily/Groups and staff Questions; below 768px use the compact header and full drawer. Discovery is accessible from the sidebar/rail without permanently repeating the public directory. Account/theme actions occupy a consistent top-right position. Use one drawer scroll region, 44px targets, modal focus trapping/Escape/return and collapse focus handoff; no route or authorization changes.

Expressive user-triggered motion is allowed: a 360ms drawer reveal, staged group reveals, responsive sidebar width transition, shared floating-control account reveal and active-route markers. Do not delay links or add continuous navigation motion. OS prefers-reduced-motion suppresses these animations automatically. The visible “Nền động” control (HomeMotionToggle and PublicDisplaySettings switch) and its now-unused preference store are removed; the home-motion hook follows OS preference, preserving theme settings. This is not authority to override browser accessibility or add new background effects.

Historical rendered recheck (superseded by the14/10/2026 icon-only top-menu refinement): retain the visible Menu label on tablet/mobile; below 768px keep the school logo but omit the adjacent brand text to make room for sign-in/Menu. Compact workspace rails have one Menu trigger, not a second discovery trigger to the same drawer. Staff rail order is Overview, Documents, Questions, Daily, Daily groups; the expanded sidebar/full drawer retain every destination and the same role restrictions. Active rail entries use a text-weight/background/edge marker, not color alone. Existing account/theme, draft blocking and focus return stay intact.

Study-room presentation (06/10/2026): `/toolkit?tool=rooms` retains flat discovery; creation now uses CreationDialog (10/10 update below). GPA calculation rules remain unchanged. `/study-rooms/:roomId` keeps explicit preview/Join. The joined room is listening-first: real selected title and local controls, original Three.js observatory, then a compact rhythm/accounting band with the same aligned edges. Desktop >=1200px pairs the stage with a 19rem Queue/People companion; tablet/mobile move those tabs below it. Below 768px Play/Player/Volume form one deliberate control row and volume uses a bounded popover. Rounded stone/oak, an orbital window, smoother seated characters and daylight/evening lighting replace the prior dense timber/mountain scene; retain platform tokens and Be Vietnam Pro for DOM content, with no fabricated artwork or metadata. Character/DOM identity interactions remain accessible and fallback does not block controls. Music/TV use one persistent player modal; Add uses a focused shadcn dialog respecting the existing one-outstanding-track rule. Management/Leave occupy the compact More menu. Bell/phase feedback, OS reduced motion, keyboard/focus, routes/API/access remain. This supersedes the timer-first 320px rail, not room semantics; no group-room links, authoritative seats or saved customization.

Room music copy distinguishes shared track selection from personal playback: playback/seek/audio controls affect only this device; local ended offers replay and never advances the queue. Only explicit owner Next changes the shared selection. This supersedes timestamp-aligned playback/automatic-ended guidance; no new settings panel or layout redesign is required.

Daily alignment correction (06/10/2026): Home owns `.home-study-notebook`; its border/radius must never apply to the Daily `.study-notebook` root after SPA navigation. Daily uses flat work regions and one shared content axis for page headers, status and task headings; do not add root padding to mask a cross-feature selector leak. Keep one primary page title; Daily-only shell context is Góc học tập, with local Cá nhân/Nhóm links retaining full accessible names and unchanged destinations. Empty days omit redundant zero/N/A progress but still allow saving/submitting an empty plan. Group invitation pending/loading/error states are direct above the list, while the empty invitation status is compact below it. Accept/decline never implicitly enables sharing. Verify route history as well as direct entry; source manifests and populated screenshots alone are insufficient.

Daily interaction decision (06/10/2026) supersedes earlier add-to-draft/inline-reflection/before-after evidence presentation: Add confirms immediate task-only persistence. Routine task/title/priority/completion/order and day/week reflection edits now auto-sync in debounced versioned batches; no manual draft Save is required. Submission remains explicit. Task removal requires an explicit warning/confirmation before automatic persistence deletes the task and associated evidence records. One task header groups completion/title, priority/menu and upload; associated evidence cards form a compact ribbon immediately below, aligned with the title on desktop. Do not reserve a disconnected right-hand evidence column or empty evidence region. Bound the editable title measure; wrap controls deliberately on tablet/mobile. Use two image previews/+N with an accessible all-items viewer and honest non-image file cards. Upload accepts files only with neutral GENERAL metadata; retain legacy records/links/private authorization. Reflection is an explicit shadcn dialog with current task context and the three existing questions; closing retains edits and synchronization continues. Feature dialogs have reachable Close, short-viewport internal scrolling and OS reduced motion. Today's unsaved-reflection countdown still requires a product target; 07:30 is a submission cutoff, not a reflection deadline. Do not invent a lock or deadline.

Daily auto-sync contract: wait 800 ms after edits and serialize a single PUT at a time. Routine fields remain editable during that PUT. If a newer edit exists, acknowledge only identity/version/submission metadata, keep the newer local values and send another batch; background fetches never replace dirty/conflicting editors. Invalid intermediate values stay local and resume once corrected. Network/unknown-outcome failures stop automatic retries and expose an explicit retry; a 409 pauses for explicit, confirmed server reload rather than silently adopting a newer version and overwriting another device. Navigation/unload guards remain while unsynchronized/busy/conflicting, and release once synchronized. Add pauses batching while its entry dialog is open and appends independently with the existing idempotent UUID. Visiting an empty day creates no server plan; explicitly submitting it saves an empty plan then invokes the separate Submit endpoint. Auto-sync never calls Submit or changes sharing consent. Sharing settings, identified group feedback publication and evidence upload/removal remain explicit operations.

Màn học tập và quản lý dùng cùng hệ giao diện, phù hợp với nền tảng Olympic và giữ màu/font hiện có. Profile là màn tham chiếu cho bố cục thông tin và form.

### Bounded header / Daily completion polish (06/10/2026)

Header account and theme controls share a visible 44px circular frame, identical
border/card background, centered content and the existing compact action gap.
Account images fill the 42px interior without a second border; the theme glyph is
20px. Scope this treatment to the public/workspace shell, not all account or theme
controls. Keep current responsive visibility and account/theme actions unchanged.

Daily task completion uses the shadcn-style Checkbox backed by the already-installed
`radix-ui` package. The 20px box and 14px tick sit inside the existing 44px label
target, centered beside the editable title. Use one focus outline around that
target, not competing inner/shell outlines. Preserve TODO/COMPLETED, Space handling,
explicit-operation disabled state and editable completion during automatic batches.
No dependency, persistence, Submit, sharing or room contract changes are required.
`olympic-context` and `frontend-design` guided scope isolation, the shared circular
silhouette and restrained checklist styling; this is not a broader page redesign.

## Shared search, filters and page layout (09/10/2026)

Functional pages keep the existing Olympic palette, Be Vietnam Pro and shared
heading scale. Use `PageHeader`, `.page-shell` (72rem maximum, 32px section rhythm;
16px at ≤640px) and existing public/workspace gutters. A reader, authoring workspace,
Daily notebook, cinematic home or persistent room player may keep its purposeful
layout; consistency does not require identical cards or page entrances. `PageHeader` descriptions accept text or block React content in a div, retaining the shared description style and valid HTML.

Search is owned by `SearchInput` for ordinary list searches: 44px input, leading
decorative icon, contextual accessible name and flexible minimum width. Visible
labels remain where already useful. Feature owners retain draft/apply behavior,
debounce, URL filters, pagination reset and query/error handling. Native search
semantics must not introduce duplicate clear buttons when a feature already owns
an explicit clear action. Home's prominent search and 52px floating form fields
are deliberate exceptions.

Use `NativeSelect` for existing small enumerations, installed Radix Select for
existing rich selects, and the shared `Combobox` for searchable option lists.
Do not exchange owners merely for appearance. Ordinary controls are 44px;
36px NativeSelect / 32px Radix compact controls remain intentional dense-toolbar
exceptions. Every control has an associated label or contextual accessible name,
visible focus, disabled/invalid semantics and the current value available.
Combobox Arrow keys/Enter/Escape must retain input focus; Tab follows native
navigation. Option popups must stay reachable within the viewport and outside
clipping panels; long Vietnamese options wrap without shrinking their targets.
Native dropdowns follow the selected light/dark color scheme. Rich Select uses installed popper collision handling, a trigger-sized popup with a bounded minimum reading width, and 44px wrapped options.

Filter rows use the existing `.page-toolbar` wrapping rhythm. Search and filters
can shrink to available space; at narrow widths they stack or wrap deliberately
with at least 8px gaps, without page-level horizontal scrolling or hidden actions.
Scrollable data tables remain bounded in their own region. Long labels and page
actions wrap, and 320px layouts keep all existing actions reachable. Preserve
keyboard/form submission, editor DOM identity, permission/loading/error/empty
states and feature-specific draft/media continuity. No new motion or policy is
part of this standard.
Documents deliberately remains visually search-first; its accessible h1 identifies
the route without restoring the previously removed visible title. Profile headers
retain generic context while data is pending/unavailable, and private data keeps
its existing gate. Flat recognition reviews and exam lists do not require another
card. Existing server-backed user search is not an in-memory Combobox. A 52px
floating field may coexist with stacked fields; preserve its owner and association.

Adoption follow-up (09/10/2026): Honors ordinary subject search uses SearchInput
under its existing label/form/URL contract. News ImageLightbox uses the shared
Dialog for modal focus, scroll locking and close/return; the native button trigger
supports Enter/Space. ListFeedback owns equivalent Documents/News empty/error
presentation and EmptyState delegates its empty variant. Features keep pending
precedence, skeletons and explicit retry/reset callbacks; domain/private/conflict
feedback is not converted into a universal query wrapper. See the linked component
reference for actual consumers and retained exceptions.


### Compact mobile page headers (09/10/2026)

At ≤640px, page titles use the existing `--page-title-size` token at 24px with
1.25 line height. PageHeader copy occupies its own row; retain the complete title
and description, balanced/wrapping text, 8px description spacing and 1.6 description
line height. Use 12px between copy/actions and before the divider, 8px action gaps
and 16px page-section rhythm. Header buttons may wrap long labels and grow taller,
with a 44px minimum target. Do not truncate context, hide actions or shrink inputs.
Public page and workspace content start with 16px top inset; global navigation
height, drawers, focus and destinations remain unchanged. Above 640px retain the
existing tablet/desktop title scale, spacing and action composition.

Daily keeps its flat notebook, domain status/date controls and 16px mobile rhythm;
its mobile title override now reads the shared token. Room headers retain their
bounded title scale and deliberate action grid. Auth headings already read the same
token; floating fields, verification context, form gates and cinematic shell remain.
News/Document readers retain local metadata, thumbnail/download and reading layouts,
with bounded mobile-only reductions to header padding/gaps. Home's cinematic hero
and prominent search, search-first Documents' sr-only h1, fallback/404 presentation,
calendars and persistent player remain intentional exceptions. No shared header has
fixed height or clamped title/description content. Actual route adoption and bounded
rendered evidence are in the [component reference](../../architecture/web-ui-components.md).

### Modern Layout & Rich Design Refresh (11/10/2026)

1. **Workspace Topbar Breadcrumbs**: Integrated `<Breadcrumb>` into `.workspace-topbar__identity` alongside user role badge and active page title. Enhances navigation hierarchy across workspace views.
2. **2-Column Asymmetric Dashboard Layout**: Replaced the previous single-column layout on `/dashboard` with an 8-col main learning section (`DashboardContinueLearning`, `DashboardRecentActivities`, shortcuts) and a 4-col side rail (`DashboardQuickActions`, `DashboardUpcomingContests`).
3. **Public Sub-Hero Banner (`PublicPageHeader`)**: Introduced a rich sub-hero banner for discovery portal pages (`/documents`, `/subjects`, `/rankings`, `/honors`). Features ambient radial glow, category pill badge, breadcrumbs trail, prominent typography, and action buttons slot.
4. **Sticky Action Bar (`.sticky-form-actions`)**: Long forms (`DocumentForm`, `PostForm`, `ExamEditor`) provide sticky action bars at the bottom with frosted glass backdrop (`backdrop-filter: blur(12px)`), upward shadow, and responsive button layout so critical submission/draft actions remain immediately reachable during lengthy edits.


## Màu và chữ

Native scrolling and application questions (06/10/2026): keep platform-native wheel,
keyboard, touch and scrollbar dimensions. Theme scroll thumbs using the existing
muted-foreground token with transparent tracks across page, panel, modal and gallery
scrollers; older WebKit uses a rounded 12px fallback. Do not replace scroll physics,
hide tracks globally or add a scroll library. Forced-colors retains browser colors.
Existing deliberately thin navigation scrollers keep their dimensions.

The mounted post editor's link entry uses a labelled shadcn Dialog rather than
window.prompt. Capture the existing editor selection, validate using the current
Tiptap URI policy, and apply only on explicit insertion. Cancel/Escape leaves text
unchanged and returns focus to the toolbar; the portal form must not submit its
owning PostForm. Shared Dialog/AlertDialog retain short-viewport scrolling, subtle
150ms open/close presence and an explicit OS reduced-motion override that outranks
open-state utilities. Alert actions pass class overrides through Button's merge so
destructive intent is not accidentally replaced by the default primary treatment.
Existing custom Daily/management confirmations are retained, not replaced twice.
Styled HTML room/group dialogs are already application-owned; preserve the room's
persistent player lifecycle. Native tab-unload protection and file/permission/security
UI remain browser/OS responsibilities. No reflection countdown target is inferred.

| Vai trò | Sáng | Tối |
| --- | --- | --- |
| Nền | `#f0f6f8` | `#002b42` |
| Bề mặt | `#ffffff` | `#11364a` |
| Chữ | `#102d42` | `#f1f7fa` |
| Thao tác | `#00387b` | `#97cde6` |
| Chữ phụ | `#526b7a` | `#adc3cf` |
| Đường phân cách | `#cddce3` | `#35586b` |

Dùng `--font-sans` cho các màn chức năng; tiêu đề trang 28–36px/600, tiêu đề vùng 16px/600, nội dung 14px với line-height 1.7–1.8. Chữ căn trái, mô tả giới hạn khoảng 65 ký tự một dòng. Trang chủ vẫn có cảnh và chữ riêng cho phần giới thiệu.

## Bố cục

`PageHeader` dùng chung tiêu đề, mô tả, hành động và đường phân cách. `PageSection` nhóm một nhiệm vụ cùng tiêu đề và nội dung; không lồng nhiều card chỉ để trang trí. `.page-shell` thống nhất chiều rộng 72rem và khoảng cách 32px; bản public có gutter riêng. Nút thao tác mặc định cao 44px, nút nhỏ 36px, input thường 44px. Giữ button nhỏ riêng cho bảng, icon và thành phần chuyên dụng.

Profile desktop có khối nhận diện 280px và vùng chỉnh sửa co giãn; mobile xếp một cột và thu gọn avatar bên cạnh tên để form xuất hiện sớm hơn. Avatar và tên tài khoản là điểm nhấn, các thông tin còn lại dùng hàng trong danh sách, không chia thành bốn thẻ nhỏ.

```text
Tiêu đề trang                                      Thao tác
──────────────────────────────────────────────────────────
Ảnh + tên + vai trò       Thông tin cá nhân
Chọn / lưu / hủy ảnh      Tên hiển thị, email, username
Hướng dẫn dung lượng     Lưu thay đổi
                         Bảo mật tài khoản
                         Email, đổi mật khẩu
```

Màn dashboard, quản lý tài liệu/bài viết/người dùng/danh mục/câu hỏi và các trang hướng dẫn dùng cùng nhịp tiêu đề/vùng nội dung. Danh mục môn, bảng tin và toolkit dùng cùng tiêu đề trang, màu và các điều khiển. Phòng học giữ cảnh Three.js và các điều khiển DOM vì đó là nội dung tương tác, đồng thời dùng các token chung.

## Nguyên tắc áp dụng

Shared control contracts (07/10/2026): `NativeSelect` keeps native values, options,
events and form semantics; its default height is 44px and `controlSize="sm"` is
36px. Radix `SelectTrigger` defaults to 44px/full width; `size="sm"` retains a
32px compact toolbar control. Floating `FormField` keeps its 52px notch geometry.
`Combobox.className` styles layout; `inputClassName` styles the visible input.
`Button.loading` adds the shared spinner/`aria-busy` and always disables the
native button while retaining any caller-owned disabled condition. Pagination
uses explicit `type="button"`, stays one-based, and offers the existing numbered
layout or a compact previous/status/next layout; zero-based API adapters belong
to features. Use existing RHF `FormLabel`/`FormControl`/`FormMessage` for associated
field labels/errors. Shared search/empty presentation does not own query state;
feature retries, content-shaped skeletons and specialized layouts remain local.

Loading contracts (07/10/2026): `Skeleton` is decorative by default and stops
pulsing with reduced motion. Each composition owns one meaningful pending text
or name, `role="status"` and `aria-busy`; do not create a live region per cell.
Protected/role auth pending uses the neutral `SessionLoading`, with authorized
children withheld until guards resolve. Query-fetch retry stays distinct from
restarting a failed import job. Preserve cached content where the feature's
permission/lifecycle rules allow it; private Daily revalidation hiding remains
intentional. Profile editors stay mounted on ordinary same-account refresh
errors, reset on user ID changes, and are hidden on 401/403/404/expiry. Login cancels
the previous current-user query before publishing the new account identity.
Document skeletons follow the card's 160px image, body and footer; optional text
and actions mean final card height is content-dependent.

Ưu tiên nhận diện thật và các thao tác đã có; không thêm số liệu hoạt động, ngày đổi mật khẩu hoặc tính năng chưa có API. Border chia nhiệm vụ; không thêm gradient, shadow và icon trang trí trước mọi tiêu đề. Mobile, tên/email dài, bàn phím, theme và giảm chuyển động phải hoạt động. Các thay đổi về bố cục giữ query, phân trang, quyền và contract API hiện có. Ô nhập với nhãn nổi giữ chiều cao 52px để đủ chỗ cho notch và chữ; không ép về 44px như input thường. Trang chi tiết bài viết giới hạn chiều rộng phần đọc thay vì kéo văn bản dài hết chiều ngang.

Khi thêm màn mới, dùng lại `PageHeader`/`PageSection`, tokens và UI primitives. Không tự khai báo lại font/size tiêu đề hoặc tạo bảng màu riêng cho màn chức năng.


## Shared foundation adoption — 13/10/2026

Shared page/layout contracts live in [page-layout.css](../../../apps/web/src/components/ui/page-layout.css), consumed by PageHeader/PublicPageHeader/PageSection and existing page-shell/content-card/filter-panel/page-table classes. Heading actions wrap below copy on phones; contextual strings can wrap without widening the shell. Toolbars align labeled controls at their bottom edge. Card header/body/footer remain distinct slots with matching padding. Shared ListFeedback/EmptyState is compact, left aligned and contextual; consumers retain loading/error/empty precedence and recovery callbacks. Button semantic variants supply clear action affordances without converting prose links. No page entrance transforms are added, preserving fixed dialog geometry.

Source adoption ledger:401 frontend TS/TSX/CSS files and43 route-page files scanned;139 files directly reference these owners/patterns. Thin route wrappers delegate to features and are not missing adoption. Complete path-level direct matches/hashes are in the local candidate coverage artifact; this table records semantic disposition, not universal rendered proof.

| Family / direct matching files | Adoption and purposeful variant | Render coverage for this pass |
| --- | --- | --- |
| Public Documents/subjects, News/readers;10 documents,1 subjects,11 post files | Shared public heading, surfaces, filters and actions; existing document recognition/list and editorial News compositions retained | Documents listing and News reader; subject directory source-inspected |
| Recognition;8 files | Honors gallery and54rem Rankings rows refined locally on shared foundations; profile/private/admin forms retain their existing owners | Honors/Rankings0/1/many,long names,filters/profile; public profile destination interactions |
| Dashboard;3 files | Welcome uses PageHeader, removes unsupported68% progress and uses real role-specific document destination; shortcut sections inherit layout | ADMIN dashboard; student companion/demo widgets unverified |
| Management/categories/users;2 category files plus route consumers | Existing tables/filters/dialogs inherit readable headers and controls; horizontal data scrolling remains intentional | Documents management and Users table; categories source-inspected |
| Questions/exams/import/assessment;3 questions,3 exams,3 assessment files | Shared headers/sections/Card/controls; frozen question readers and specialist editors retain compositions and gates | Source-inspected; no new full exam/import runtime matrix |
| Long create/edit forms | Existing CreationDialog body scroll and sticky actions retained; shared Button sizes checked in actual Post/Document forms | Populated validation/error forms with opening/actions and focus lifecycle |
| Toolkit/GPA;2 files | Shared page/action/modal contracts; calculator row density retained | Source-inspected |
| Auth;9 files | Shared controls inherit variants/targets; split layouts,Turnstile/session fields retained | Source-inspected; no real authentication proof |
| Daily;12 files | Shared section/controls inherit styling; notebook/native dialogs/autosync/private draft contracts remain distinct | Source-inspected; pending recovery bytes preserved |
| Rooms;10 files | Existing workspace/media/chat layout,dialog and room lifecycle retained | Source-inspected; continuity not re-exercised |
| User;7 files / shells4 / home4 / AI1 | Profile/access and shell owners retained; home cinematic composition is deliberately separate; AI retains its task UI | Profile interaction destination; no new home/AI runtime claim |
| Shared26 / direct route pages20 | Responsible primitives are changed once; no per-route CSS clones or new wrapper system | Representative families above only |

Query/submission/pagination/permissions/consent/visibility/upload/draft policies are unchanged by presentation. News independent edits and all pre-entry theme/navigation/task work remain separate pending scope. Source-wide adoption does not establish all-screen live or physical-device usability.

Rendered critique added two bounded common-owner refinements: compact UserIdentity links use quiet resting surfaces and two-line visible names while retaining full accessible names/preview/detail; unavailable nonlinks keep full attribution. RichTextViewer owns actual heading/paragraph/list/media/code/table reading styles because typography-plugin prose utilities were inert. Reader measure,content conversion and editor layouts stay unchanged; no plugin dependency is added.


## Full-app product layout and automatic list search — 13/10/2026

The current product direction supersedes manual “Tìm” submission for mounted result lists and cinematic/puffy task presentation. Use the [mature HUMG design rules](../../architecture/design-system.md#mature-humg-product-language--13102026) and [family/search owner ledger](../owners/layout-and-discovery.md#full-application-owner-and-search-lookup--13102026). Ordinary PageHeader22–30px/600,20px page rhythm,8px surfaces and6px controls share existing72rem container/gutters; filters use one unframed band, not nested rounded containers. Source adoption and actual render coverage remain separate.

SearchInput stays a labelled44px presentation owner. List features use350ms `useUrlListSearch`/`useListSearch`, retain raw text during typing, pause composition, settle trimmed values, clear immediately and replace URL history. Discrete filters apply immediately; page resets on changed filtering; unknown params/deep links/POP are retained. The hook cancels departing-route writes even while lazy navigation leads React. Query keys keep stale responses isolated; supported query owners consume cancellation signals. Enter in an embedded chooser never submits its editor. Do not convert save/auth/OTP/publish/upload forms into automatic submission.

Home is a navigation entry with no mounted results, so “Mở kho tài liệu” remains explicit. Combobox local typeahead and native OS select remain immediate. Unmounted legacy PostManagement is not an active route; do not reuse its obsolete request cast or route links.

Honors YEAR recommendation: retain a compact “Năm” secondary select beside subject discovery. Album year is a genuine backend predicate and helps retrieve an older event/cohort when titles overlap. Do not replace it with an invented “recent” policy or remove old years. The existing1900–current options remain because no year-facet API exists; future shortening should use real available-year metadata. Search no longer needs a separate action, and year selection applies immediately.

Public News and slug reader use explicitly public minimal query keys/metadata. A delayed anonymous refresh401 must preserve those public records while clearing private queries; management and by-ID editor queries remain private. This does not change direct-slug expiry/publication authorization or asset URL policy.

The final URL/focus concurrency details and actual Dashboard destinations are recorded in the [owner lookup](../owners/layout-and-discovery.md#full-application-owner-and-search-lookup--13102026); these are navigation/presentation changes,not new upload or practice workflows.


### Current ranking/mobile and source-coverage disposition — 14/10/2026

The latest [ranking composition/motion rules](../../architecture/design-system.md#ranking-composition-and-purposeful-gsap--14102026) supersede earlier ranking medal colors, stacked metrics and two-line linked-name truncation. Real rank, identity and score stay horizontally associated at320px; approved count is secondary. Profile anchors remain44px minimum with full accessible names, hover/focus preview and click/touch detail. Native timeframe/result/busy/retry context stays near the list; no unsupported ranking keyword search is introduced.

The current full-app source ledger records all402 TS/TSX/CSS sources, direct shared owners/styles and59 router path definitions/component owners. Parametrized staff exam routes expand for both roles; alias/redirect coverage is explicitly distinct from rendered routes. Common foundations and local composition adoption cover the public,profile,auth,Daily,admin/management,assessment/readers,toolkit and room families in the owner table above. Scientific editors/frozen readers,native Daily and joined room/player remain intentional task variants. No claim that every route/role/private state was rendered.

Representative before/after proof includes320/390/mobile-short/landscape/tablet/desktop/light-dark, public listings,authenticated dashboard,admin records,auth/profile,scientific reader/exam editor,Daily/group and Toolkit/lobby plus populated Post/Document creation/error/dirty frames. Joined-room/live media,Daily sync/private authorization,physical IME,Turnstile and live CDN are preserved/source-inspected or covered by inherited checks,not newly live-exercised. Failed fixtures and intermediate visual captures remain rejected/superseded. Current comparison gallery and manifest hold exact adoption,proof and preservation hashes.
