# Giao diện chung

For actual component APIs, route-by-route adoption, intentional exceptions and
remaining duplication, read the [shared UI owner reference](web-ui-components.md).
This authority defines the standard; that reference inventories current source
usage and does not claim all-screen rendered verification.

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
consumer counts and evidence are in the [owner reference](web-ui-components.md#three-cluster-consolidation-working-candidate-09102026).

Equivalent residual presentation/mechanics now have responsible owners: immutable
`replaceListParam` beside list-navigation; Toolkit decimal syntax; DailyReflectionField;
management row/actions and range footer; cached-refresh InlineRetryFeedback;
existing Button `destructive-solid` variant; UUID lexical predicate. Use their
[actual APIs/adoption](web-ui-reuse-audit.md#completed-residual-consolidation-09102026)
when the behavior fits. Keep submission, query/cache precedence, page clamping,
validation ranges, DTO adapters, permissions and editor/sync lifecycles local.
Solid-danger confirmation appearance is preserved; tinted destructive remains a
different existing treatment. Shared styling never implies shared business semantics.

## Current navigation-shell decision (05/10/2026)

This decision supersedes the older floating-header/bottom-sheet/manual-motion choices below; those paragraphs describe earlier iterations, not the mounted navigation contract. Navigation alone is being redesigned; unrelated page bodies, destinations and role guards remain unchanged. Use the same palette/type tokens. The public header is aligned with the functional page container; at >=1200px it shows primary discovery links, at 768–1199px it keeps Môn học/Tài liệu/Bảng tin direct, and below 768px it keeps brand/sign-in or account/Menu. A shared left drawer preserves every existing destination grouped by role, with destinations first and auth actions at the bottom. Theme switching stays in the mobile top navbar; tablet/desktop drawers retain their existing theme footer.

Workspace navigation separates personal/content/system tasks from public discovery. Staff have Overview, content/system management, then personal Daily/profile destinations. Students retain personal work destinations. At >=1200px use a collapsible readable sidebar; at 768–1199px use an 88px labelled shortcut rail with direct Overview/Daily/Groups and staff Questions; below 768px use the compact header and full drawer. Discovery is accessible from the sidebar/rail without permanently repeating the public directory. Account/theme actions occupy a consistent top-right position. Use one drawer scroll region, 44px targets, modal focus trapping/Escape/return and collapse focus handoff; no route or authorization changes.

Expressive user-triggered motion is allowed: a 360ms drawer reveal, staged group reveals, responsive sidebar width transition, account reveal and active-route markers. Do not delay links or add continuous navigation motion. OS prefers-reduced-motion suppresses these animations automatically. The visible “Nền động” control (HomeMotionToggle and PublicDisplaySettings switch) and its now-unused preference store are removed; the home-motion hook follows OS preference, preserving theme settings. This is not authority to override browser accessibility or add new background effects.

Rendered recheck: retain the visible Menu label on tablet/mobile; below 768px keep the school logo but omit the adjacent brand text to make room for sign-in/Menu. Compact workspace rails have one Menu trigger, not a second discovery trigger to the same drawer. Staff rail order is Overview, Documents, Questions, Daily, Daily groups; the expanded sidebar/full drawer retain every destination and the same role restrictions. Active rail entries use a text-weight/background/edge marker, not color alone. Existing account/theme, draft blocking and focus return stay intact.

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
rendered evidence are in the [component reference](web-ui-components.md).


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

## Trang chủ

Giữ màu/font trong bảng token phía trên: Noto Serif cho lời mở đầu, Be Vietnam Pro cho tìm kiếm, tiện ích và bảng tin. Bố cục trái gồm lời chào/tìm tài liệu và các lối vào phòng học, GPA; cảnh anime ở phải, xuống dưới là bàn học rồi bảng tin. Trên mobile, giữ cảnh nhỏ và những thao tác trực tiếp.

Ánh sáng xanh chỉ ở hero, opacity thấp, trôi chậm bằng transform; có nút Nền động cạnh sáng/tối, nhớ lựa chọn. Mặc định động trên mọi kích thước, gồm iPhone; trang chủ dùng lựa chọn bật/tắt thủ công, kể cả khi thiết bị bật Giảm chuyển động. Không thêm hạt bay, canvas hoặc video mới. Hiệu ứng dừng khi hero khuất/tab ẩn; phần đọc tin không có nền chuyển động.

Rà soát hướng thiết kế: tránh thêm bộ card tiện ích thứ hai vì bàn học đã chứa chúng; đưa hai liên kết gọn ngay dưới tìm kiếm. Thẻ không có thumbnail giữ nội dung và không tạo khung ảnh rỗng; giảm khoảng trống trước bảng tin. Footer mobile dùng các nhóm mở/thu, giữ đủ liên kết và thông tin liên hệ.

### Nav và phân vùng trang chủ

Theo yêu cầu mới, cảnh/ánh sáng trang chủ bỏ tự tắt theo thiết bị; nút Nền động vẫn tắt toàn bộ nền. Các màn khác giữ quy tắc giảm chuyển động. Dùng lại màu nền #f0f6f8/#002b42, bề mặt #ffffff/#11364a, primary #00387b/#97cde6 và font Noto Serif/Be Vietnam Pro.

Nav desktop có đủ Trang chủ/Môn học/Tài liệu/Bảng tin/Tiện ích, chọn mục bằng nền accent thay vì vạch tính theo chỉ số. Logo trái, menu giữa, nhóm giao diện/tài khoản phải; CTA rút thành Góc học tập/Quản lý/Đăng nhập. Mobile đưa tùy chọn hiển thị vào Menu mở từ dưới lên, cùng điều hướng chia nhóm và giữ route/quyền.

Trang chủ chia ba vùng theo nhiệm vụ: lời chào/tìm tài liệu + cảnh; Bàn học của bạn có tiêu đề/mô tả riêng và nền bề mặt nhẹ; Bảng tin mới nhất trên nền trang. Dùng chiều rộng/gutter thống nhất, đường phân cách và khoảng cách để chỉ ranh giới. Không đánh số các phần vì đây không phải quy trình, không thêm card tiện ích trùng nội dung.

~~~text
Logo          Trang chủ  Môn học  Tài liệu  Bảng tin  Tiện ích          Tài khoản
Lời chào + tìm tài liệu                                      Cảnh anime
──────────────────────────────────────────────────────────────────────
Bàn học của bạn
Tài liệu / Thông báo / Tiện ích
──────────────────────────────────────────────────────────────────────
Bảng tin mới nhất                                            Xem bảng tin
Các bài viết
~~~

Rà soát kế hoạch: giữ cảnh anime là điểm nhấn; tăng phân cấp bằng vùng nội dung và tiêu đề, không thêm hiệu ứng xuất hiện cho từng khối hay dãy card giống nhau. Nút hiển thị mobile gom lại vì hai tùy chọn được đổi ít hơn thao tác điều hướng.

Rà soát ảnh sau triển khai: mobile dùng logo đã căn bỏ khoảng trắng và hai nút khi đăng nhập (tài khoản, Menu); tiêu đề Bàn học và vùng nền riêng tạo ranh giới rõ trong cả hai theme. Giảm chiều cao tối thiểu bàn học mobile để tránh khoảng trắng khi chỉ có ít tài liệu. Menu điều hướng/hiển thị dùng lại primitives và token, không thêm blur hoặc chuyển động vào thanh nav.

### Nền chuyển động, menu mobile và thẻ tin

Theo phản hồi tiếp theo, chuyển động nền cần nhìn thấy rõ hơn: hai vùng ánh sáng xanh và các đường cong mảnh trôi chậm phía sau hero. Vẫn một màu primary #00387b/#97cde6, nền #f0f6f8/#002b42, thẻ #ffffff/#11364a; Noto Serif cho lời chào và Be Vietnam Pro cho điều khiển/tin. Không thêm video, canvas hoặc ảnh mới. Nút Nền động điều khiển và nhớ lựa chọn, dừng hiệu ứng khi khuất/tab ẩn.

Mobile dùng thanh nổi gọn: logo trái, avatar 44px và nút Menu phải. Tùy chọn sáng/tối/nền động đưa vào panel mở từ dưới lên, giữ điều hướng theo nhóm và quyền, focus/Escape/đích đăng nhập. Avatar public có cùng đường kính với các nút hiển thị desktop; các chỗ dùng UserDropdown khác giữ kích thước hiện có.

Trang chủ có ba thẻ tin trên desktop, xếp một cột trên mobile, ảnh nhỏ tùy chọn và cùng bề mặt/border. Loại bài dùng nhãn trung tính chung; phân biệt Blog/Tin tức/Thông báo bằng chữ. Feed bảng tin dùng thẻ cùng ngôn ngữ thị giác, ảnh lỗi bỏ ảnh và không tạo khung rỗng, giữ URL bộ lọc và đường quay lại.

~~~text
Logo                                                   Avatar  Menu
                                  Panel từ dưới:
                                  Hiển thị   [Tối] [Nền động]
                                  Học tập / Thông tin / Cá nhân

Bảng tin mới nhất
Thẻ bài viết               Thẻ bài viết               Thẻ bài viết
Nhãn + ngày                Nhãn + ngày                Nhãn + ngày
Tiêu đề, tóm tắt            Tiêu đề + ảnh nhỏ           Tiêu đề, tóm tắt
~~~

Rà soát kế hoạch: thanh mobile giảm còn hai thao tác thay vì thêm nút; panel có một vùng cuộn để dùng được ở màn thấp. Thẻ tin phục vụ nội dung bài viết theo yêu cầu, không mở rộng thành bộ card ở các vùng khác. Nền chuyển động có độ tương phản thấp và nằm dưới nội dung; bỏ dấu chấm màu theo từng loại bài để giảm nhiễu.

Rà soát ảnh triển khai: avatar cùng đường kính với nút, header mobile còn avatar/Menu và không có nút tùy chọn đứng riêng. Thẻ tin sáng/tối đã thống nhất nhãn, title/summary/ảnh nhỏ và khoảng cách. Làm nền ánh sáng tan nhẹ ở mép bằng mask để không tạo cảm giác một khung bo tròn khổng lồ phía sau hero; nav giữ một đường focus rõ thay vì chồng ring và outline.

### Khung ảnh đại diện

Avatar trên nav tiếp tục là vòng tròn 44px, ảnh lấp đầy khung để nhận diện rõ. Bỏ phần đệm giữ nguyên ảnh vì làm chủ thể quá nhỏ. Khi chọn ảnh trong hồ sơ, mở hộp thoại có khung tròn, kéo vị trí, thanh Độ phóng và Đặt lại; dùng ảnh đã chọn khung rồi mới bấm Lưu ảnh mới. Có thao tác bằng bàn phím và cảm ứng. Giữ nguyên ảnh gốc, gửi riêng vị trí/độ phóng khung tới backend; API trả avatarCrop để các nơi hiển thị cùng khung. Chỉnh khung ảnh đã lưu không upload lại.

Giữ nền #f0f6f8/#002b42, bề mặt #ffffff/#11364a và primary #00387b/#97cde6; toàn bộ hộp thoại dùng Be Vietnam Pro với tiêu đề/control cùng quy chuẩn hồ sơ. Khung ảnh căn giữa, lời hướng dẫn và nhãn căn trái, hành động cuối hộp thoại. Khung có lớp che bên ngoài hình tròn để người dùng thấy đúng phần xuất hiện trên nav; không thêm màu trang trí hay animation.

~~~text
Chỉnh ảnh đại diện                                   Đóng
Kéo ảnh để chọn phần bạn muốn hiển thị.
                 (khung tròn)
Độ phóng                                      1.0×
[───────────────────────────────────────────────]
Đặt lại
                              Hủy   Dùng ảnh này
~~~

Rà soát kế hoạch: trọng tâm là chọn chủ thể, không cố nhét cả ảnh vào icon. Giữ bước xem trước/hủy trước upload để không đổi ảnh tài khoản ngoài ý muốn. Chỉ upload ảnh gốc và metadata khi xác nhận Lưu ảnh mới; không thêm thư viện crop hoặc tự nhận diện khuôn mặt. Bản xem trước và chỉnh khung đều dùng ảnh gốc.

Rà soát ảnh triển khai ở 390px sáng và 1440px tối: phần bị che ngoài hình tròn giúp thấy chính xác chủ thể sẽ xuất hiện, giữ font/màu/nút cùng hồ sơ và không thu nhỏ avatar nav. Đặt lại căn trái, khung ảnh căn giữa. Rà soát thêm 320×360px phát hiện grid của hộp thoại có thể ép hàng làm khung che nút; đổi riêng hộp thoại này sang flex với các phần không co, nội dung cuộn đúng và các nút được kiểm tra bấm lại trên Chromium/WebKit.

## Mobile auth, navigation and private Recognition evidence (09/10/2026)

Password login alone puts the recovery link after the password field and its
inline error at the auth shell's ≤900px breakpoint. Keep the existing 52px
floating fields, 44px recovery/reveal targets, validation associations and login
Turnstile/token lifecycle. Desktop retains its compact above-field recovery link;
other auth forms are unchanged. Mobile navigation (<768px) keeps logo-only public
branding with its accessible home-link name. Both shells use the public-derived
MobileNavbar row: logo left, ThemeToggle → account/login → labelled Menu right.
Its 64px row has 1rem horizontal padding (12px below360px),8px control gaps,
44px targets, Menu divider and shared focus ring. Workspace page context stays
visible beneath the sticky row, wrapping independently of the controls.
Theme preference/persistence remains with ThemeToggle/useThemeStore in the navbar.
Mobile drawers omit the duplicate theme footer; tablet/desktop behavior remains.

EvidencePreviews/EvidenceViewer share Daily's two-thumbnail/+N and all-items
Dialog presentation, captions, native keyboard activation, close/return focus,
44px controls, short-viewport scrolling and optional 2× image zoom. Feature
adapters own access, freshly authorized metadata, bytes, downloads and operations.
Recognition evidence is private even on a public achievement: owner/admin only,
never mounted by public profiles, hidden during failed/pending revalidation with
abort/revoke on unmount or identity/resource change. Recognition stores API bytes,
not signed URLs; do not introduce external URLs to bypass authorization. Only
validated bounded raster bytes receive image previews; PDF/legacy links retain
honest non-image fallback and feature-owned download/open behavior.

Admin album creation remains Draft by default. The discoverable Công bố album
list action opens the existing editor with explicit publication intent; Lưu và
công bố uses existing validation, upload-before-publication, admin API and
expectedVersion rules. Failures retain fields/saved draft with inline feedback;
conflicts require reopening current metadata for explicit reconciliation. No
new publication/approval/visibility policy, API or media limits are introduced.
See the [component APIs and consumers](web-ui-components.md#mobile-and-recognition-evidence-owners-09102026).

Narrow anonymous public navigation also keeps the logo from shrinking into the
theme target: at <360px only horizontal navbar/button padding is compacted,
retaining44px height,8px target separation and complete login/Menu labels.


## Visual hierarchy and creation entry flows (10/10/2026, local candidate)

Extend the current academic blue/light and navy/dark palette; do not add a second
brand system. `--surface-border` and `--surface-shadow` in
[index.css](../../apps/web/src/index.css) give standalone content boundaries a
visible edge and restrained depth. [Card](../../apps/web/src/components/ui/card.tsx),
PageSection, `.page-table` and `.page-guidance` own panel treatment.
`.content-card` shares this CSS for semantic article/list elements; this is style
reuse, not a universal record component. Card headings have a muted band/divider,
16px mobile/24px desktop padding and wrapping actions. Toolbars inside an existing
panel stay flat; standalone `.filter-panel` bands use 12–16px padding and bounded
wrapping44px controls. Keep sections separated by the existing page rhythm.

Honors is the reference media card: one bounded16:10 image, contiguous16px mobile/
20px desktop body, editorial label/subject/year/title, participant names with
awards, and an explicit44px album action. Album imagery must not dominate the
metadata or become detached from it. Do not nest a retry button inside a link.
At narrow widths, the year occupies one filter row; Search and Tìm share the next.
Documents retain contained file thumbnails; News keeps its editorial image/body
variants. Tables and long readers are not turned into grids of decorative cards.
Home's cinematic hero, auth shell, Daily notebook/calendar and persistent room
scene keep their task-specific structure. Daily explicitly opts out of shared
panel shadow/header fill; its draft, native-dialog and autosync owners are unchanged.

[CreationDialog](../../apps/web/src/components/ui/creation-dialog.tsx) now owns the
common entity-creation frame. Use a controlled `open`, a useful title/description,
form-derived `dirty`/`busy`, and `children(close)`; Cancel calls that guarded close.
Busy prevents dismissal, dirty asks explicit discard, and success closes directly
through the form's existing callback. It does not validate, persist, upload,
publish, retry or decide permissions. Installed Radix owns focus trapping, Escape,
backdrop and scroll lock. Initial focus is the heading; external triggers regain
focus. Routed new forms specify a return-focus target and retain their URLs,
validated return paths and successful-save handoff to existing edit routes.
This does not add browser-history/unload draft persistence to editors that did not
already have it; explicit modal dismissal is guarded.

The frame is ≤68rem desktop, bounded to viewport height with a reachable header
and internally scrolling body; `.creation-dialog--compact` is ≤36rem for shorter
forms. At≤640px both use the full100dvh viewport with top-header/bottom-body safe-area padding; horizontal insets are not explicit. Do not constrain
long editors to a tiny overlay, duplicate their page title under the dialog title,
or shrink targets to make them fit. Nested installed choosers retain their own
focus and completion contracts; post image uploads report busy to the owning form.
All default Dialog Close targets are44px. Daily's existing native/custom dialogs
and room-track chooser remain their established modal owners; child option/part/
participant insertion stays within the parent editor, not a second entity-create
flow. See the [complete source/creation coverage ledger](web-ui-components.md#visual-and-creation-coverage-10102026)
for actual adoption, exceptions and representative proof limits.

### Broader page-family hierarchy follow-up (10/10/2026)

Use the same surface owners while matching each task's information structure.
News pinned posts use occupied responsive columns: one post fills the band rather
than reserving two empty slots; feed membership, separate priority retries and URL
submission remain unchanged. Rankings uses one `content-card` around the ordered
comparison list with a context band, divided rows and44px profile links, not an
album-card grid. Public milestones group the existing filtered chronology by year
with a muted year band and divided records inside the existing section; this
presentation does not mount private evidence or change scoring.

The document reader and its skeleton share `document-reader__viewport`: desktop
height `clamp(24rem,75svh,60rem)`, mobile≤640px `clamp(14rem,65svh,40rem)`. Keep
reading context reachable on short phones instead of forcing600px. Reader metadata,
preview and description use existing surfaces; edit/download actions stack on
phones so complete labels remain reachable. Profile identity uses its existing
compact two-column arrangement whenever the workspace stacks at≤1099px, preserving
the desktop portrait band. GPA keeps editable rows in one working surface with
row separators and tighter vertical rhythm; calculations/errors/local storage and
Add modal remain feature-owned. Category tabs retain their scrollable Radix strip
with44px triggers and color-only transitions. None of these require new tokens,
per-record decorative nesting, motion or a new framework.

Question Bank uses existing CardHeader/Content/Footer for metadata/status,
question body and wrapping actions; each callback and permission remains local.
Exam drafts and papers share the feature-local ExamListItem presentation: native
44px title link, version/points badges and a separate release/timezone row. Long
unbroken titles shrink/wrap inside the card. Frozen questions, release/solutions
and authenticated figure owners remain unchanged; readers are not list cards.


### Learner document discovery and first-page previews (10/10/2026)

Keep the search-first Documents layout. Ordinary keyword submission still searches
existing title/description data on Enter/Tìm; subject, kind and topic tags retain
existing query parameters and page-reset rules. Use visible field labels, compact
phone subject/kind columns and a full-width tag field; show removable active values
and Xóa tất cả without clearing view or unrelated URL parameters. No invented
sort, topic taxonomy or new metadata. Kind/subject/tags and distinguishing description
belong beside the title, not only inside the reader. The result header's error state
must match list feedback; view switches expose aria-pressed.

[DocumentCard](../../apps/web/src/features/documents/components/document-card.tsx)
uses a compact portrait preview beside context/title on phones, a bounded portrait
above content on wider screens, and an explicit44px Mở tài liệu action. Two tablet /
three desktop columns keep text readable rather than squeezing five catalogue
columns. [DocumentListItem](../../apps/web/src/features/documents/components/document-list-item.tsx)
keeps the same subject/kind/tag recognition cues with wrapping titles and a compact
preview. The existing owner-hover, list-return and download-modal contracts remain.
Created-at metadata is labelled Ngày đăng, not last modification.

[DocumentThumbnail](../../apps/web/src/features/documents/components/document-thumbnail.tsx)
is Document-owned presentation in public cards/list rows and management rows. It
consumes only the server thumbnailUrl, reserves a3:4 frame, contains the whole page
without cover cropping, and displays honest loading/loaded/unavailable states.
Failed/absent previews leave title/context/open actions usable; no PDF original is
fetched to manufacture a browser preview. Compact rows keep fallback copy accessible.
The [storage case reference](web-ui-components.md#document-discovery-preview-storage-cases-10102026)
explains actual eligibility and unknown live delivery. No private/signed URL
conversion, account-setting workaround, upload, backfill or migration is added.


### Documents and News: catalogue + editorial discovery (10/10/2026)

Research informed this bounded refinement; it is not a new theme or publication
policy. Public structures inspected10/10/2026:

| Observed reference pattern | Repository task and decision |
| --- | --- |
| [Open Textbook Library catalogue](https://open.umn.edu/opentextbooks/textbooks): search, subject browsing, format filters and linked title/description/read-more records. | Locate material and distinguish similarly titled files. Keep existing subject/kind/tag choices visible; group available description/context with the title and explicit open action, with a bounded portrait page preview. Do not import their license/review/format filters or sorting. |
| [Mathematics catalogue](https://open.umn.edu/opentextbooks/subjects/mathematics): subject context retained while descriptions distinguish linear-algebra/calculus books and editions. | Preserve subject/topic selections and list-return URLs; show actual kind and tags beside similarly named documents instead of relying on filename or image recognition. |
| [MIT News](https://news.mit.edu/) and [education topic listing](https://news.mit.edu/topic/education): news search/browse, linked titles and short context, distinct attention/recent-update sections. | Find school announcements and scan stories. Search/type controls precede existing pinned posts; the chronological feed remains title-led editorial rows with publication date, deadline and summary grouped. Separate priority feedback remains; no new featured scoring, topic/course taxonomy or membership policy. |

The reference inspection is public page-content/structure research, not measured
third-party responsive usability. OCW/OpenStax client-rendered pages and Cambridge
News could not be meaningfully inspected through the reader and were not used as
design evidence. No assets, copy or fonts were imported. Large full-width phone
story images and a universal image-card grid were rejected because they delay title
scanning; copying richer reference taxonomies or a marketing hero would invent
unsupported content. Current blue theme, serif heading and body tokens remain.

News discovery uses its existing `filter-panel`, SearchInput, native type Links and
Button owners. At320px, types deliberately form two columns; larger phones keep a
wrapping row. All choices retain44px targets. The redundant same-page Xem bài viết
header action is removed so discovery becomes reachable sooner. Active type/keyword
and reset remain visible; keyword guidance says **title** because the API matches
only title. Submit still trims on Enter/Tìm; type/search reset page, other parameters
survive those changes, and existing News clear-all reset behavior is retained.
Documents has a different existing reset contract that preserves view/unrelated
parameters; do not harmonize them by styling accident.

The actual News feed remains nine-item pages ordered publishedAt descending,
with pinned membership unchanged. News images are supporting64px squares beside
phone titles,160px16:10 media on wider rows, and absent/failed images yield usable
text rows. Pinned items remain text-led occupied columns. No giant image above
320px titles. Deadlines are separate from summary truncation, with existing urgent/
expired calculations. The reader keeps its ImageLightbox Dialog and reading tools;
body measure is bounded72ch, phone lead/section gaps compact, and the TOC toggle
announces expanded state. Purposeful document portrait previews and editorial
landscape cues stay feature-owned rather than one generic media framework.

See [actual owners and proof boundaries](web-ui-components.md#documentsnews-discovery-owners-and-task-evidence-10102026)
and the existing work status for accepted hashes, learner walks and synthetic/live
limits. The42-page broad ledger remains source coverage, not all-screen rendering.


### Admin record-finding and recovery refinements (10/10/2026)

Use compact management toolbars with labeled supported filters and the existing
SearchInput; keep submit/debounce and URL/page semantics with their feature owner.
Phone counters are compact informational context, never an unlabeled substitute
for a status selector. Record titles must disclose distinguishing file suffixes;
POST thumbnails support recognition without dominating the title and use an honest
failed-image fallback. Users use identity/action rows below768px and the existing
relational table at wider widths, with contextual action names and tablet scroll
guidance. This variant serves safe account selection, not a new global card shell.

Destructive confirmations retain the target/error while pending and on failure.
Required option metadata has loading/error/retry feedback separate from the main
record query. Private PDF review restoration validates the URL job identity and
revalidates access before media/actions, while recoverable errors preserve local
corrections. See [actual owners and adoption](web-ui-components.md#admin-recovery-and-discovery-owners-10102026)
and [fix disposition/evidence](../reviews/ux-flow-audit.md#admin-ui-audit-remedies-20261010).


### Mobile modal audit boundary (10/10/2026)

The original [modal owner/variant audit](web-ui-components.md#mobile-modal-frame-audit-8773df0)
against8773df0 remains historical before evidence. Its five issues are repaired
in the scoped mobile-modal UI change (commit/push authorized): Dialog has a shrinking grid column
and fully wrapping context; EvidenceViewer bounds controls and sticks only the
compact title/44px Close, with full record/privacy description scrolling normally;
Recognition downloads show “Tải tệp” with the full filename accessible; native
Daily group buttons are44px and the owner restores prior body overflow on native
close/unmount; the nested POST image chooser has upload-guarded bottom Cancel.
Creation frames retain fixed headers/scrolling bodies; ordinary Dialog scrolls
the whole frame. Phone landscape wider than640px uses centered CreationDialog.
Find responsible adapters/styles through the [interaction owner lookup](web-ui-components.md#interaction-owner-lookup)
and [repair proof/limits](web-ui-components.md#mobile-modal-repairs-10102026).
Safe-area/physical IME behavior remains bounded by Chromium evidence. Native
room persistence and Daily draft/autosync authority remain distinct.
