# Web

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

Nền động trang chủ mặc định bật trên mọi kích thước, gồm iPhone. Desktop có nút “Nền động” cạnh nút giao diện; mobile đưa hai công tắc vào panel Menu mở từ dưới lên. Nền động nhớ lựa chọn qua localStorage; khi lưu bị chặn vẫn đổi được trong phiên hiện tại. Hai vùng ánh sáng xanh và đường cong mảnh trôi chậm 24–30 giây phía sau hero; video tắt tiếng, phát trong trang và dừng khi ra khỏi màn hình/tab ẩn. Trang chủ chỉ dùng nút bật/tắt thủ công, không tự tắt theo Giảm chuyển động của thiết bị. Tắt nền động dùng ảnh tĩnh; lần vào với nền tắt không tải video. Các cảnh khác giữ quy tắc giảm chuyển động. Autoplay bị chặn hoặc video lỗi giữ poster. Các component cũ còn tham chiếu `src/features/home/data/home-mock-data.ts` nhưng không được mount trong `HomePage`; không dùng các mẫu đó làm thông tin công bố chính thức.

Các màn học tập công khai:

- `/subjects` lấy danh mục từ `/documents/metadata`, tìm tên/mã môn và mở `/documents?subjectId=...`.
- `/news` dùng API posts, gồm bài ghim, bộ lọc loại bài, tìm kiếm và phân trang qua URL; `/news/:slug` mở chi tiết. Liên kết quay lại giữ URL danh sách và dùng điều hướng SPA; chi tiết phân biệt 404 với lỗi kết nối/server có nút thử lại. Bài quá hạn được ghi rõ; hiệu ứng chi tiết tôn trọng giảm chuyển động.
- `/toolkit?tool=rooms` là phòng học chung, yêu cầu đăng nhập để tạo hoặc tham gia. `/study-rooms/:roomId` mở phòng qua đường dẫn mời. API lưu lịch học/nghỉ, thành viên và hàng đợi nhạc; client đồng bộ mỗi 5 giây. Chủ phòng duyệt đề xuất YouTube và đặt quyền đề xuất theo thời gian học. Nhạc mặc định là livestream Lofi Girl; trình duyệt có thể yêu cầu bấm “Bật nhạc”. Xem [contract phòng học](../../docs/architecture/study-rooms.md).
- `/toolkit?tool=gpa` tính trung bình theo tín chỉ trên hệ 4 hoặc 10 và lập kế hoạch GPA mục tiêu từ GPA hiện tại, tín chỉ đã tính, tín chỉ còn lại. Màn báo điểm trung bình tối thiểu cần đạt hoặc mục tiêu vượt khả năng. Không tự quy đổi thang điểm hay áp dụng quy chế/học lại của trường. Bản nháp phép tính và kế hoạch lưu riêng vào localStorage, chưa đồng bộ tài khoản.

Phòng học cho chủ phòng chuyển quyền cho thành viên đang online qua hộp thoại xác nhận. Mạng trở lại hoặc tab hiện lại sẽ đồng bộ phòng; màn báo kết nối và thời gian server đã ghi nhận. Khoảng gián đoạn quá 30 giây không được cộng; lease hết hạn cần bấm tham gia lại.

Trang phòng có cảnh 2D với nhân vật SVG, avatar/tên tài khoản và bàn trống. Nhân vật vào/rời chỗ, viết bài hoặc nghỉ theo phase; mất kết nối sẽ dừng động tác. Bấm một bạn để xem thời gian đã ghi nhận. Chỗ ngồi giữ ổn định khi polling trong cùng màn; phòng đông chia tối đa 12 bàn mỗi nhóm. Hỗ trợ ảnh lỗi, bàn phím, mobile, theme và giảm chuyển động; animation không chứng minh người dùng đang thực sự học.

Chủ phòng bấm “Chỉnh giờ” để chọn phút học/nghỉ ngắn/nghỉ dài hoặc mẫu 25/5/15, 50/10/20, 90/15/30. “Bắt đầu nhịp mới” đặt lại đồng hồ chung, giữ thời gian đã ghi nhận và nhạc. Web cần API có Flyway V11. Mỗi người có “Bật chuông”, “Tắt chuông” và “Thử chuông” riêng; cần bấm bật âm thanh sau mỗi lần tải lại. Hết nhịp học/nghỉ hiện thông báo, tia màu và ánh sáng nhẹ, chỉ một lần mỗi ranh giới; không phát bù khi mất mạng/tab ẩn hoặc đặt lại nhịp. Giảm chuyển động giữ thông báo, bỏ hiệu ứng động. Chuông dùng Web Audio, không thêm tài nguyên hoặc thư viện.

Các màn tài khoản dùng video trên desktop. Dưới 1024px, giao diện dùng tông giấy/vở sáng hoặc tối, không mount video hay tải ảnh nền anime.

Tải tài liệu có thể hủy bằng nút Hủy tải, Escape hoặc đóng hộp thoại, kể cả khi đang lấy đường dẫn từ API. Request link dùng timeout API 15 giây; request file từ storage dùng timeout 2 phút và không gửi token/cookie. Lỗi có thử lại; hủy hoặc đổi tài liệu dọn request/timer cũ, không tự tải hay đóng tài liệu mở sau. Tiến độ chưa biết dung lượng không hiển thị phần trăm giả.

Nhãn `FormField` dùng trạng thái giá trị native của input để tránh đè dữ liệu sẵn, giá trị đặt bằng code/reset hoặc tự điền. Hồ sơ cho email/username dài xuống dòng trên mobile; lưu thành công reset form theo tên server trả về và vô hiệu hóa nút Lưu cho tới lần chỉnh sửa tiếp theo. Lưu lỗi giữ nội dung để thử lại.

Giao diện chức năng dùng chung `PageHeader`, `PageSection` và `.page-shell`: tiêu đề, chiều rộng, khoảng cách, màu, nút và input thống nhất giữa public và workspace. Hồ sơ có khối avatar/tên/vai trò, vùng thông tin và bảo mật; mobile thu gọn nhận diện và xếp một cột. Avatar lỗi dùng chữ cái tên. Chọn ảnh mới mở khung tròn có kéo vị trí, chỉnh độ phóng/đặt lại bằng chuột, cảm ứng hoặc bàn phím; chọn khung rồi xem trước/hủy hoặc lưu. File ảnh gốc giữ nguyên, chỉ gửi cùng avatarCrop (vị trí/độ phóng) khi bấm Lưu ảnh mới; có Chỉnh khung/Lưu khung ảnh để cập nhật metadata ở backend mà không upload lại. Các màn nhận avatarCrop để hiển thị nhất quán; avatar nav 44px lấp đầy vòng tròn. API cần migration V12. Xem [contract khung avatar](../../docs/architecture/avatar-framing.md). Đóng hộp thoại đổi mật khẩu xóa nội dung đã nhập và trả focus về nút mở. Dashboard hiển thị các lối vào theo vai trò. Bảng tin, môn học, toolkit, màn quản lý và trang chi tiết dùng cùng chuẩn chữ; trang chủ và cảnh phòng giữ phần hình ảnh riêng. Xem [quy chuẩn giao diện](../../docs/architecture/web-ui.md).

Các route luyện tập, kỳ thi và lịch sử hiện hiển thị hướng dẫn đến những tính năng có sẵn; chưa có toàn bộ luồng làm bài, chấm điểm và lưu kết quả.

## Điều hướng và loading

- Từ 1280px, nav công khai nổi cách mép trên 16px, rộng tối đa 1200px, cao 60px, giữ kích thước khi cuộn để tránh dịch các nút. Logo trường dẫn về trang chủ; năm mục Trang chủ/Môn học/Tài liệu/Bảng tin/Tiện ích nằm giữa. Mục đang mở có nền accent, nhận cả route chi tiết và phòng học. CTA Đăng nhập/Góc học tập/Quản lý mở route theo trạng thái và vai trò; menu avatar giữ các thao tác tài khoản.
- Dưới 1280px, thanh trên nổi gọn với logo, avatar 44px khi đăng nhập và nút Menu. Menu mở từ dưới lên, có công tắc sáng/tối/nền động trang chủ, nhóm điều hướng theo vai trò và vùng cuộn; không có thanh dưới. Avatar trên nav public có đường kính bằng các nút hiển thị desktop. Dashboard có sidebar theo vai trò, thu/mở bằng nút; không tự đổi kích thước khi hover.
- Bộ lọc, số trang và kiểu xem tài liệu được giữ trong URL; mở chi tiết rồi quay lại giữ đường về danh sách. Đăng nhập giữ đích quay lại qua các màn tài khoản. Lỗi kiểm tra phiên trên server có trạng thái thử lại tại route đang mở.
- Refresh dùng chung một request có timeout 15 giây. Refresh trả 401/403 sẽ xóa token, cache dữ liệu và cập nhật người dùng về null để mở lại màn đăng nhập; lỗi mạng/timeout/server giữ phiên cho lần thử sau. Kết quả refresh cũ không ghi đè lần đăng nhập/đăng xuất mới hơn.
- Lần vào đầu hiển thị logo trường và tiến độ, giữ tối thiểu 1,5 giây. Loader đợi route đầu, các query lần đầu đang pending, font và video theme hiện tại rồi mới lên 100%; đây là tiến độ các bước chuẩn bị, không phải phần trăm byte của toàn website. Mạng chậm tiếp tục chờ và có hướng dẫn tải lại sau 12 giây. Request thất bại có fallback/trạng thái lỗi riêng.
- Khi đạt 100%, giữ 250ms rồi GSAP kéo hai lớp nền sang hai bên; mở tương tác sau khi hiệu ứng xong. Giảm chuyển động dùng fade ngắn. Chuyển route trong SPA dùng loading gọn theo trang, không phát lại startup loader; thay query/filter giữ trạng thái trang.
- Video theme đang dùng được tải một lần và dùng lại Blob URL trong vòng đời trang. Video lỗi hoặc autoplay bị chặn thì giữ poster; mobile auth không tải video; các cảnh ngoài trang chủ bỏ video khi giảm chuyển động. Logo loader dùng cùng nguồn `public/icons.svg`, căn bỏ khoảng trắng và không có nền sáng ở theme tối.

Kết quả và các luồng còn cần sửa được ghi trong [rà soát UI/UX](../../docs/reviews/ux-flow-audit.md). Các kiểm tra trình duyệt được ghi ở đó có dùng API mock; không thay thế kiểm chứng backend, email, storage và YouTube thực tế.

## Kiểm tra

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
