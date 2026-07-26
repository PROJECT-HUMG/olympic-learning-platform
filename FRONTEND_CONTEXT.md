# 🎯 NGUYÊN TẮC VÀ NGỮ CẢNH FRONTEND (Frontend Context)

File này tóm tắt lại toàn bộ kiến trúc, luồng đi (flow), cách tổ chức code và tình trạng hiện tại của dự án Frontend để bạn (hoặc AI agent khác) có thể nắm bắt ngay lập tức khi mở project lên code tiếp.

---

## 1. 🏗 KIẾN TRÚC & TECH STACK (Architecture)
- **Framework:** React + TypeScript + Vite.
- **Styling:** Tailwind CSS v4 + UI Components từ `shadcn/ui` & `Radix UI` (Tất cả icon dùng `Lucide`).
- **State Management:** 
  - **Server State** (Data từ API): Dùng `TanStack Query` (React Query).
  - **Client State** (Trạng thái UI cục bộ): Dùng `Zustand`.
- **Form & Validation:** `react-hook-form` kết hợp `zod`.
- **Routing:** `react-router-dom` (Tách Route theo Layout và Lazy loading).

### Luồng gọi dữ liệu chuẩn (Data Flow)
`Browser (Event)` ➔ `Component / Hook (TanStack Query)` ➔ `Service (Axios)` ➔ `Spring Boot API`.

---

## 2. 📁 CÁCH TỔ CHỨC CODE (Feature-Sliced Design)
Dự án được phân chia theo module (Feature-first). Mọi logic nghiệp vụ không được vứt bừa bãi vào `components` chung, mà phải được gói gọn trong folder `features/`.

Ví dụ như module **Auth** hiện tại (`apps/web/src/features/auth`):
- `services/auth.service.ts`: Chứa các hàm gọi Axios thuần túy (VD: `login`, `me`).
- `hooks/use-auth.ts`: Custom hook bọc `auth.service` kết hợp với React Query (`useMutation`, `useQuery`).
- `types/auth.types.ts`: Chứa interface request/response.
- `components/login-form.tsx`: UI Component chuyên biệt cho Auth (gọi hook ở đây).

**File cần tham chiếu khi code Feature mới:**
👉 Đọc `docs/architecture/frontend-architecture.md`
👉 Đọc `docs/architecture/frontend-conventions.md`

---

## 3. 🚦 ROUTING VÀ LAYOUTS
Hệ thống Route được cấu hình tập trung tại `apps/web/src/router/routes.tsx`.
Website được chia làm 3 cụm chính tương ứng với 3 Layout:

1. **Public Portal (`PublicLayout`):** Các trang ngoài (Home, Kỳ thi, Môn học...). Dùng chung `PublicHeader` và `PublicFooter`.
2. **Auth Area (`AuthCardLayout`):** Các trang Login, Register, Forgot Password... Được bọc bởi `GuestRoute` (đã đăng nhập thì tự đá về Dashboard).
3. **Private Workspace (`DashboardLayout`):** Các trang yêu cầu đăng nhập. Bọc bởi `RoleGuard` (Kiểm tra quyền).

**Tình trạng hiện tại:** 
Toàn bộ các trang Public (`subjects-page.tsx`, `competitions-page.tsx`, `toolkit-page.tsx`...) vừa được chuẩn hóa giao diện: 
- Tất cả đều được bọc trong Glassmorphism Panel (Khung mờ) để nổi bật nội dung.
- Dùng chung Component `PublicPageHeader` đơn giản, lệch trái.
- Footer đã được refactor cực chuẩn theo chuẩn *Fat Footer* (Chia 4 cột, lấy Favicon thật cho mạng xã hội).

**File cần tham chiếu khi sửa Route/Layout:**
👉 Đọc `docs/architecture/routing.md`

---

## 4. 🔑 LUỒNG AUTHENTICATION HIỆN TẠI ĐANG CHẠY NHƯ NÀO?
1. Người dùng vào form Đăng nhập (`login-form.tsx`).
2. Submit form ➔ Gọi hàm `loginMutation` từ `use-auth.ts`.
3. Nhận được Token (JWT) từ API ➔ Đẩy vào Store hoặc Axios Interceptors (tùy cài đặt).
4. Hệ thống chạy hook `useCurrentUser()` (tại `apps/web/src/features/auth/hooks/use-current-user.ts`) để fetch `/api/auth/me`.
5. Dữ liệu User được lấy ra thành công ➔ Render vào `user-dropdown.tsx` (Menu góc phải trên cùng của Header).
6. State quản lý Session hoàn toàn dựa vào bộ cache của `React Query` và `Zustand`.

**File cần tham chiếu khi sửa Auth:**
👉 Đọc `docs/architecture/authentication.md`
👉 Tham khảo `apps/web/src/features/auth/hooks/use-current-user.ts`

---

## 5. 🎯 BƯỚC TIẾP THEO (What's Next?)
- Layout giao diện chung, Navbar, Footer, Trang chủ và khung xương của các trang con cơ bản đã **Hoàn thiện 95% về mặt thẩm mỹ**.
- Khung sườn của Auth (Login, User hook) đã được dựng.
- **Tiếp theo:** Nên bắt đầu code vào các trang Dashboard (Private Workspace) của sinh viên hoặc tiếp tục ghép các luồng API cho trang môn học, kỳ thi.
