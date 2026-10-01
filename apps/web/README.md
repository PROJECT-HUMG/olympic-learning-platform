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

Trang chủ hiện có hero tìm tài liệu, bàn học với các tab tài liệu/thông báo/toolkit và tin tức mới nhất. Tài liệu, thông báo và tin tức lấy từ API. Các component cũ còn tham chiếu `src/features/home/data/home-mock-data.ts` nhưng không được mount trong `HomePage`; không dùng các mẫu đó làm thông tin công bố chính thức.

Các màn học tập công khai:

- `/subjects` lấy danh mục từ `/documents/metadata`, tìm tên/mã môn và mở `/documents?subjectId=...`.
- `/news` dùng API posts, gồm bài ghim, bộ lọc loại bài, tìm kiếm và phân trang qua URL; `/news/:slug` mở chi tiết.
- `/toolkit?tool=rooms` là phòng học chung, yêu cầu đăng nhập để tạo hoặc tham gia. `/study-rooms/:roomId` mở phòng qua đường dẫn mời. API lưu lịch học/nghỉ, thành viên và hàng đợi nhạc; client đồng bộ mỗi 5 giây. Chủ phòng duyệt đề xuất YouTube và đặt quyền đề xuất theo thời gian học. Nhạc mặc định là livestream Lofi Girl; trình duyệt có thể yêu cầu bấm “Bật nhạc”. Xem [contract phòng học](../../docs/architecture/study-rooms.md).
- `/toolkit?tool=gpa` tính trung bình theo tín chỉ trên hệ 4 hoặc 10, không tự quy đổi thang điểm hay áp dụng quy chế của trường. Bản nháp lưu vào localStorage, chưa đồng bộ tài khoản.

Các màn tài khoản dùng video trên desktop. Dưới 1024px, giao diện dùng tông giấy/vở sáng hoặc tối, không mount video hay tải ảnh nền anime.

Các route luyện tập, kỳ thi và lịch sử hiện hiển thị hướng dẫn đến những tính năng có sẵn; chưa có toàn bộ luồng làm bài, chấm điểm và lưu kết quả.

## Điều hướng và loading

- Từ 1280px, nav công khai nổi cách mép trên 16px, rộng tối đa 1200px, cao 60px và thu còn 56px khi cuộn. Logo trường dẫn về trang chủ; bốn mục Môn học/Tài liệu/Bảng tin/Tiện ích nằm giữa. Vạch chọn nhận cả route chi tiết và phòng học. Một CTA mở đăng nhập hoặc dashboard theo vai trò; menu avatar giữ các thao tác tài khoản.
- Dưới 1280px, điều hướng nằm trong menu nhóm trên header, không có thanh dưới. Dashboard có sidebar theo vai trò, thu/mở bằng nút; không tự đổi kích thước khi hover.
- Bộ lọc, số trang và kiểu xem tài liệu được giữ trong URL; mở chi tiết rồi quay lại giữ đường về danh sách. Đăng nhập giữ đích quay lại qua các màn tài khoản. Lỗi kiểm tra phiên trên server có trạng thái thử lại tại route đang mở.
- Lần vào đầu hiển thị logo trường và tiến độ, giữ tối thiểu 1,5 giây. Loader đợi route đầu, các query lần đầu đang pending, font và video theme hiện tại rồi mới lên 100%; đây là tiến độ các bước chuẩn bị, không phải phần trăm byte của toàn website. Mạng chậm tiếp tục chờ và có hướng dẫn tải lại sau 12 giây. Request thất bại có fallback/trạng thái lỗi riêng.
- Khi đạt 100%, giữ 250ms rồi GSAP kéo hai lớp nền sang hai bên; mở tương tác sau khi hiệu ứng xong. Giảm chuyển động dùng fade ngắn. Chuyển route trong SPA dùng loading gọn theo trang, không phát lại startup loader; thay query/filter giữ trạng thái trang.
- Video theme đang dùng được tải một lần và dùng lại Blob URL trong vòng đời trang. Video lỗi hoặc autoplay bị chặn thì giữ poster; mobile auth và giảm chuyển động không tải video. Logo loader dùng cùng nguồn `public/icons.svg`, căn bỏ khoảng trắng và không có nền sáng ở theme tối.

Kết quả và các luồng còn cần sửa được ghi trong [rà soát UI/UX](../../docs/reviews/ux-flow-audit.md). Các kiểm tra trình duyệt được ghi ở đó có dùng API mock; không thay thế kiểm chứng backend, email, storage và YouTube thực tế.

## Kiểm tra

```bash
pnpm build
pnpm lint
pnpm preview
```

`pnpm build` gồm kiểm tra TypeScript và bundle Vite. Xem [AGENTS.md](AGENTS.md) trước khi sửa web; giữ responsive, dark mode, keyboard focus và reduced motion khi chỉnh UI.

Kiểm thử phép tính GPA, đường dẫn sau đăng nhập và điều hướng danh sách bằng Node.js 24, không cần dependency kiểm thử bổ sung:

```bash
node --test --test-isolation=none tests/*.test.ts
```
