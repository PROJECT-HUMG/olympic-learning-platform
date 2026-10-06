# Web

Turnstile for registration/reset-email uses `VITE_TURNSTILE_ENABLED` and
`VITE_TURNSTILE_SITE_KEY` at build time; backend verification is configured
separately. See [authentication setup](../../docs/architecture/authentication.md#turnstile--registration-and-reset-email-request).

SPA React 19 + TypeScript + Vite 8 của Olympic Learning Platform. Tailwind CSS 4 và các UI primitive trong `src/components/ui` tạo giao diện; React Router quản lý route; TanStack Query giữ server state; Zustand giữ một số trạng thái client.

## Chạy local

Yêu cầu Node.js tương thích Vite 8 và pnpm. Từ `apps/web`:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Mở `http://localhost:3000`. Vite proxy request `/api` tới `http://localhost:8080`; cần chạy API riêng nếu dùng các chức năng gọi server. `src/lib/axios.ts` dùng `VITE_API_BASE_URL` khi được khai báo, mặc định local là `http://localhost:8080/api/v1`. Bản Docker được build với `VITE_API_BASE_URL=/api/v1` và Nginx chuyển tiếp qua API. Biến Vite được nhúng lúc build; không đặt secret trong biến `VITE_*`.

## Cấu trúc và trạng thái nội dung

| Vị trí | Vai trò |
| --- | --- |
| `src/router` | Route, constants, auth và role guards |
| `src/pages`, `src/layouts` | Màn hình và khung public/auth/dashboard |
| `src/features` | Component, hooks, services, types theo nghiệp vụ |
| `src/components/ui` | Primitive và thành phần dùng chung |
| `src/lib/axios.ts` | API client, access token và refresh flow |
| `src/index.css` | Theme tokens toàn app |
| `src/layouts/navigation.ts` | Menu nhóm, mục theo vai trò và nhận diện route đang chọn |
| `src/app/startup-preloader.ts` | Tiến độ khởi động và hiệu ứng mở trang bằng GSAP |
| `src/components/ui/cinematic-media.ts` | Tải và dùng lại video theo theme |
| `src/lib/list-navigation.ts` | Kiểm tra số trang và giữ đường quay lại danh sách |

Trang chủ chia ba vùng: tìm tài liệu/cảnh anime; Bàn học của bạn có nền, tiêu đề và các tab Tài liệu/Thông báo/Tiện ích riêng; Bảng tin mới nhất. Liên kết phòng học/GPA nằm trực tiếp dưới tìm kiếm. Bảng tin mới nhất ghép NEWS và BLOG theo ngày đăng, lấy tối đa ba bài; thông báo nằm riêng trong bàn học. Nội dung lấy từ API, trang chủ dùng ba thẻ trên desktop/một cột mobile, ảnh nhỏ tùy chọn; Blog/Tin tức/Thông báo dùng nhãn trung tính chung. Feed bảng tin có thẻ bấm mở được toàn bộ, giữ bộ lọc/đường quay lại; ảnh lỗi được bỏ để không để khung rỗng. Footer public mở đủ nhóm trên desktop, thu/mở từng nhóm trên mobile.

Home motion now follows the OS/browser `prefers-reduced-motion` preference automatically, without a visible manual motion control. The former desktop HomeMotionToggle and compact-menu “Nền động” switch and unused local preference store are removed; theme settings remain. Existing hero assets/effects still pause out of view or in a hidden tab; reduced motion keeps the static scene. No new background effect or remote asset was added. Autoplay/asset failures retain the existing poster fallback.

Các màn học tập công khai:

- `/subjects` lấy danh mục từ `/documents/metadata`, tìm tên/mã môn và mở `/documents?subjectId=...`.
- `/news` dùng API posts, gồm bài ghim, bộ lọc loại bài, tìm kiếm và phân trang qua URL; `/news/:slug` mở chi tiết. Liên kết quay lại giữ URL danh sách và dùng điều hướng SPA; chi tiết phân biệt 404 với lỗi kết nối/server có nút thử lại. Bài quá hạn được ghi rõ; hiệu ứng chi tiết tôn trọng giảm chuyển động.
- `/toolkit?tool=rooms` là phòng học chung, yêu cầu đăng nhập để tạo hoặc tham gia. `/study-rooms/:roomId` mở phòng qua đường dẫn mời. API lưu lịch học/nghỉ, thành viên và hàng đợi nhạc; client đồng bộ mỗi 5 giây. Chủ phòng duyệt đề xuất YouTube và đặt quyền đề xuất theo thời gian học. Nhạc mặc định là livestream Lofi Girl; trình duyệt có thể yêu cầu bấm “Bật nhạc”. Xem [contract phòng học](../../docs/architecture/study-rooms.md).
- `/toolkit?tool=gpa` tính trung bình theo tín chỉ trên hệ 4 hoặc 10 và lập kế hoạch GPA mục tiêu từ GPA hiện tại, tín chỉ đã tính, tín chỉ còn lại. Màn báo điểm trung bình tối thiểu cần đạt hoặc mục tiêu vượt khả năng. Không tự quy đổi thang điểm hay áp dụng quy chế/học lại của trường. Bản nháp phép tính và kế hoạch lưu riêng vào localStorage, chưa đồng bộ tài khoản.

Phòng học cho chủ phòng chuyển quyền cho thành viên đang online qua hộp thoại xác nhận. Mạng trở lại hoặc tab hiện lại sẽ đồng bộ phòng; màn báo kết nối và thời gian server đã ghi nhận. Khoảng gián đoạn quá 30 giây không được cộng; lease hết hạn cần bấm tham gia lại.

The room scene is an original Three.js fantasy observatory with identity-derived scholar characters and a keyboard/touch participant surface using existing account names/avatars. Seats remain local presentation, not claimable reservations; rooms page at twelve desks. The timer and scene align on desktop; tablet/mobile lead with usable timer controls. Header Music, the in-room TV and now-playing control open a native modal with Escape/Close/opener focus return and explicit parent-control Tab wrapping. The player initializes on first open and remains mounted across close/reopen; selection and actual local playback states are separate. Rendering stops offscreen, in hidden tabs, behind Music/participant dialogs and under OS reduced motion. WebGL failure retains a usable list with explicit retry. No saved customization, new gestures/events, group-room model or backend change is included. Animation does not prove attention or task completion.

Chủ phòng bấm “Chỉnh giờ” để chọn phút học/nghỉ ngắn/nghỉ dài hoặc mẫu 25/5/15, 50/10/20, 90/15/30. “Bắt đầu nhịp mới” đặt lại đồng hồ chung, giữ thời gian đã ghi nhận và nhạc. Web cần API có Flyway V11. Mỗi người có “Bật chuông”, “Tắt chuông” và “Thử chuông” riêng; cần bấm bật âm thanh sau mỗi lần tải lại. Hết nhịp học/nghỉ hiện thông báo, tia màu và ánh sáng nhẹ, chỉ một lần mỗi ranh giới; không phát bù khi mất mạng/tab ẩn hoặc đặt lại nhịp. Giảm chuyển động giữ thông báo, bỏ hiệu ứng động. Chuông dùng Web Audio, không thêm tài nguyên hoặc thư viện.

Các màn tài khoản dùng video trên desktop. Dưới 1024px, giao diện dùng tông giấy/vở sáng hoặc tối, không mount video hay tải ảnh nền anime.

Tải tài liệu có thể hủy bằng nút Hủy tải, Escape hoặc đóng hộp thoại, kể cả khi đang lấy đường dẫn từ API. Request link dùng timeout API 15 giây; request file từ storage dùng timeout 2 phút và không gửi token/cookie. Lỗi có thử lại; hủy hoặc đổi tài liệu dọn request/timer cũ, không tự tải hay đóng tài liệu mở sau. Tiến độ chưa biết dung lượng không hiển thị phần trăm giả.

Nhãn `FormField` dùng trạng thái giá trị native của input để tránh đè dữ liệu sẵn, giá trị đặt bằng code/reset hoặc tự điền. Hồ sơ cho email/username dài xuống dòng trên mobile; lưu thành công reset form theo tên server trả về và vô hiệu hóa nút Lưu cho tới lần chỉnh sửa tiếp theo. Lưu lỗi giữ nội dung để thử lại.

Giao diện chức năng dùng chung `PageHeader`, `PageSection` và `.page-shell`: tiêu đề, chiều rộng, khoảng cách, màu, nút và input thống nhất giữa public và workspace. Hồ sơ có khối avatar/tên/vai trò, vùng thông tin và bảo mật; mobile thu gọn nhận diện và xếp một cột. Avatar lỗi dùng chữ cái tên. Chọn ảnh mới mở khung tròn có kéo vị trí, chỉnh độ phóng/đặt lại bằng chuột, cảm ứng hoặc bàn phím; chọn khung rồi xem trước/hủy hoặc lưu. File ảnh gốc giữ nguyên, chỉ gửi cùng avatarCrop (vị trí/độ phóng) khi bấm Lưu ảnh mới; có Chỉnh khung/Lưu khung ảnh để cập nhật metadata ở backend mà không upload lại. Các màn nhận avatarCrop để hiển thị nhất quán; avatar nav 44px lấp đầy vòng tròn. API cần migration V12. Xem [contract khung avatar](../../docs/architecture/avatar-framing.md). Đóng hộp thoại đổi mật khẩu xóa nội dung đã nhập và trả focus về nút mở. Dashboard hiển thị các lối vào theo vai trò. Bảng tin, môn học, toolkit, màn quản lý và trang chi tiết dùng cùng chuẩn chữ; trang chủ và cảnh phòng giữ phần hình ảnh riêng. Xem [quy chuẩn giao diện](../../docs/architecture/web-ui.md).

Các route luyện tập, kỳ thi và lịch sử hiện hiển thị hướng dẫn đến những tính năng có sẵn; chưa có toàn bộ luồng làm bài, chấm điểm và lưu kết quả.

## Vinh danh, thành tích và bảng xếp hạng

Vinh danh là nội dung kỷ niệm do admin công bố, có ảnh và danh sách người tham gia liên kết tài khoản hoặc nhập tay; bản nháp chỉ hiện trong quản lý. Thành tích học thuật là hồ sơ riêng: người dùng gửi Olympic/NCKH kèm minh chứng, admin duyệt/từ chối/thu hồi. Chỉ hồ sơ được duyệt góp điểm. Có lựa chọn hiển thị cho từng hồ sơ và tự bật tham gia bảng xếp hạng theo năm hoặc mọi năm. Minh chứng chỉ chủ hồ sơ/admin được tải, kể cả khi chi tiết thành tích công khai. Tổng công khai trên hồ sơ chỉ tính hồ sơ đã duyệt và bật hiển thị; tổng xếp hạng gồm cả hồ sơ đã duyệt riêng tư khi tài khoản tự tham gia. Web cần API có migration V14. Xem [quy tắc và giới hạn](../../docs/architecture/recognition.md). Các nhóm ngoài học thuật và mức điểm quốc tế được để lại cho đợt sau.

## Điều hướng và loading

- Public navigation uses an aligned sticky header (fixed only over the home hero). At >=1200px all existing primary discovery links are direct; at 768–1199px Môn học/Tài liệu/Bảng tin remain direct with account/sign-in and Menu; below 768px use the compact brand/account-or-sign-in/Menu header. Every existing destination remains in the shared role-aware left drawer. Destination groups appear first; theme and guest auth actions occupy the bottom. Active routes include details, toolkit queries and study-room aliases. Login retains its return path.
- Workspace navigation uses a readable, collapsible 264px task sidebar at >=1200px; an 88px labelled shortcut rail at 768–1199px; and a compact header/full drawer below 768px. Staff work comes before personal settings; public discovery is available via Khám phá rather than a permanently repeated directory. Account/theme actions stay top-right. The drawer traps focus, closes on Escape and returns to its actual opener; sidebar collapse hands focus to the corresponding expansion control. Existing Daily draft blockers and role guards are unchanged. User-triggered drawer/group/active/account/sidebar motion is expressive but immediately interactive; OS reduced motion disables it.
- Bộ lọc, số trang và kiểu xem tài liệu được giữ trong URL; mở chi tiết rồi quay lại giữ đường về danh sách. Đăng nhập giữ đích quay lại qua các màn tài khoản. Lỗi kiểm tra phiên trên server có trạng thái thử lại tại route đang mở.
- Refresh dùng chung một request có timeout 15 giây. Refresh trả 401/403 sẽ xóa token, cache dữ liệu và cập nhật người dùng về null để mở lại màn đăng nhập; lỗi mạng/timeout/server giữ phiên cho lần thử sau. Kết quả refresh cũ không ghi đè lần đăng nhập/đăng xuất mới hơn.
- Lần vào đầu hiển thị logo trường và tiến độ, giữ tối thiểu 1,5 giây. Loader đợi route đầu, các query lần đầu đang pending, font và video theme hiện tại rồi mới lên 100%; đây là tiến độ các bước chuẩn bị, không phải phần trăm byte của toàn website. Mạng chậm tiếp tục chờ và có hướng dẫn tải lại sau 12 giây. Request thất bại có fallback/trạng thái lỗi riêng.
- Khi đạt 100%, giữ 250ms rồi GSAP kéo hai lớp nền sang hai bên; mở tương tác sau khi hiệu ứng xong. Giảm chuyển động dùng fade ngắn. Chuyển route trong SPA dùng loading gọn theo trang, không phát lại startup loader; thay query/filter giữ trạng thái trang.
- Video theme đang dùng được tải một lần và dùng lại Blob URL trong vòng đời trang. Video lỗi hoặc autoplay bị chặn thì giữ poster; mobile auth không tải video; các cảnh ngoài trang chủ bỏ video khi giảm chuyển động. Logo loader dùng cùng nguồn `public/icons.svg`, căn bỏ khoảng trắng và không có nền sáng ở theme tối.

Kết quả và các luồng còn cần sửa được ghi trong [rà soát UI/UX](../../docs/reviews/ux-flow-audit.md). Các kiểm tra trình duyệt được ghi ở đó có dùng API mock; không thay thế kiểm chứng backend, email, storage và YouTube thực tế.

## Kiểm tra

Room presentation and playback local evidence (start Vite separately):

```bash
node tests/study-room-ux-browser-check.mjs
node tests/study-player-browser-check.mjs
```

Both use installed local Chromium, block external traffic, and create fresh `/tmp/study-room-after-*` or `/tmp/study-player-local-*` evidence with source hashes. The room runner renders actual Three.js through software WebGL (SwiftShader) with synthetic auth/API/YouTube. It covers lobby/preview/member/host, desktop/tablet/mobile/short, theme, canvas picking, participant/modal focus, persistent-player open/close, fallback/context loss, motion/render bounds and owner lifecycle/explicit Next. The player runner uses the actual component in StrictMode with two deterministic players, independent positions/audio controls, selection changes, initialization/retry and cleanup. Neither proves actual YouTube/audio, backend authorization, live multiuser or physical GPU performance. Timestamp-correction/automatic-ended criteria and `PLAYER_PHASE=before` are obsolete. `ROOM_WEB_URL`/`PLAYER_WEB_URL` and corresponding `*_CHROME_PATH` override local defaults; `ROOM_CHECK_SCOPE=layout` skips longer room-management flows. Daily has its own acceptance evidence in the existing audit; room acceptance does not establish Daily correctness.

On constrained software-WebGL hosts, run the room matrix sequentially in smaller scopes: `ROOM_CHECK_SCOPE=discovery`, `interactions`, `lifecycle`, or `layout`. Layout can use `ROOM_VIEWPORTS='[[1440,900],[1024,900],[768,1024]]'`, then a second run with `[[800,600],[390,844],[320,568],[320,360]]`. Each run records its own frozen manifest; compare application hashes, not screenshot filenames alone. Screenshot timeouts/terminated sessions remain failed or incomplete evidence, not passes.

Room music now shares only the room-selected track/video. Play/Pause, native seek and audio settings remain local; polling and `playback.startedAt` never force a position. Only the joined owner's explicit “Phát tiếp” advances the queue under the existing versioned API. A local ended event never changes the track for anyone else. Default-stream version-only updates still retain the iframe; selecting a new finite version/video loads it with each device's existing pause/mute/volume preferences. No backend/schema/API change is required.

Navigation-shell rendered evidence uses **synthetic auth/API**, not backend authorization proof:

```bash
# Local Vite must already be running. No live API/external service is used.
node tests/navigation-browser-check.mjs
```

Override `NAV_WEB_URL` or `NAV_CHROME_PATH` for a different local Vite/installed Chromium. The runner blocks external assets, writes screenshots/results and source manifests into a fresh `/tmp/navigation-after-*` directory, and exercises logged-out/authenticated public navigation, STUDENT/LECTURER/ADMIN workspaces, desktop/tablet/mobile/short viewports, light/dark, account/drawer focus, route visibility, Daily dirty navigation, breakpoints and OS reduced motion. `NAV_PHASE=before` is for capturing a pre-redesign baseline without candidate-only assertions; do not use it as acceptance evidence. Current disposition and visual limits are in the existing UI/UX audit.

Daily UI hierarchy: `/daily` opens today's editor using the existing UTC+7 civil-date contract; the entry date stays fixed during edits/refetches, including across midnight. Explicit `?date=YYYY-MM-DD` and intentional selections are retained; invalid explicit dates never silently become today. Saved-week history is at `/daily?view=history` (existing `?week=` links still work). Day/week/group/shared screens use one click-open calendar with arrow/Home/End/Page Up/Down navigation, a date jump, Today and contextual day/week/history access. Dirty, busy or conflicting edits block date/navigation changes; sharing and feedback offer explicit Stay/discard choices, never implicit discard.

Daily is a flat task-led work surface with no enclosing Home notebook frame, including after same-document Home navigation. Header/status/task headings share an edge; empty days omit zero/N/A progress while retaining Add, empty-plan Save, separate Submit and reflection. The shell uses Góc học tập context instead of repeating the primary page title. Group invitations distinguish pending/loading/error/empty without a large second empty panel. Save/Submit and first-submission status remain accessible; completion/title/priority stay direct and reorder/delete remain in the task menu.

Confirming “Thêm và lưu việc” immediately persists just that task through the versioned append endpoint. Cancel does not persist. Pending disables dismissal, failure retains the input/stable retry UUID, and unrelated local edits remain unsaved. Existing edits/deletions still use Save; Submit alone records first submission. Adding to an already-submitted plan preserves its original submission stamp. Each task has a unified completion/title/priority/menu/upload header and an associated evidence-card ribbon below, not a reserved right-hand column; evidence-free rows remain compact. Tablet/mobile wrap controls deliberately. File-only evidence uses a custom shadcn dialog, neutral GENERAL stage, two private raster previews plus +N and an all-items gallery. Other files have truthful file cards; legacy before/after records and links remain accessible, without offering new manual URL entry. Uploads do not save the plan or enable sharing. Private byte URLs are aborted/revoked on scope change/unmount; original authorized downloads remain available.

“Nhìn lại ngày” opens a custom shadcn dialog with the existing three questions and completed/pending task context from the current draft. Closing retains unsaved fields; its Save explicitly saves the whole current plan/reflection without submitting. Today's reflection countdown is **not implemented pending a product target**: existing rules specify only the 07:30 first-submission cutoff, not a reflection deadline. Past days have no misleading today countdown, and reflection remains open at any time. Changed Daily confirmations use shadcn AlertDialog; the browser-required tab-unload warning is retained. Group member summaries, on-demand calendar history, weekly reflection/statistics, identified feedback and explicit sharing consent/revocation remain. Motion follows OS preference. Technical acceptance is separate from product/design approval; see the current audit.

Current rendered checks with **synthetic API responses**, not backend/auth/privacy persistence acceptance:

```bash
# Start the local Vite server separately; no real API is used by this check.
node tests/daily-ux-browser-check.mjs

# Optional focused composition/route-history checks; default also runs existing flows.
DAILY_CHECK_SCOPE=layout node tests/daily-ux-browser-check.mjs
```

The runner uses installed Chromium (`DAILY_CHROME_PATH`, `DAILY_WEB_URL` override local defaults), writes screenshots/results and start/end source hashes to `/tmp/daily-ux-*`, intercepts API traffic and blocks external assets. It checks immediate Add pending/failure/retry/rebase, Save versus Submit, gallery/files/legacy links, reflection/custom confirmation/focus, compact date safety/history, and direct versus actual mounted-link Home→Daily composition. `DAILY_VIEWPORTS` can split the layout matrix. Synthetic responses do not prove persistence or backend authorization.

For actual local persistence/private bytes, explicitly start the opt-in **disposable** `AuthoringBrowserHarness` on loopback 8095, then:

```bash
DAILY_HTTP_HARNESS=disposable node tests/daily-persistence-http-browser-check.mjs
```

This uses production Daily/evidence services and disposable PostgreSQL, checks immediate Add without Save, unrelated drafts, full-reload persistence, original bytes and foreign-account denial. The harness uses fixture identities and adapts refresh requests to its fixture login endpoint; it does not prove production cookie/token/provider behavior. A fresh `DAILY_HTTP_DATE=YYYY-MM-DD` allows another run without clearing existing rows; the runner refuses an existing plan. No live API/account is authorized. Older HTTP screenshots do not validate the current layout.

```bash
pnpm build
pnpm lint
pnpm preview
```

`pnpm build` gồm kiểm tra TypeScript và bundle Vite. Xem [AGENTS.md](AGENTS.md) trước khi sửa web; giữ responsive, dark mode, keyboard focus và reduced motion khi chỉnh UI.

Kiểm thử GPA/mục tiêu, refresh phiên, thời hạn bài viết, đường dẫn sau đăng nhập và điều hướng danh sách bằng Node.js 24, không cần dependency kiểm thử bổ sung:

```bash
node --test --test-isolation=none tests/*.test.ts
```

## OTP đăng ký

Màn đăng ký nhập OTP 6 số, có sửa email/gửi lại/đếm ngược và phục hồi bằng email hoặc username cùng mật khẩu khi mất phiên. Challenge lưu trong sessionStorage để tải lại cùng tab; không lưu OTP/mật khẩu. Đăng nhập tài khoản PENDING dẫn tới bước tiếp tục xác thực. Cần API cùng phiên bản và migration V13. Xem [contract OTP](../../docs/architecture/registration-otp.md).
