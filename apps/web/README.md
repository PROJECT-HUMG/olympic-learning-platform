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

Trang chủ có dữ liệu mẫu trong `src/features/home/data/home-mock-data.ts` (môn học nổi bật, kỳ thi, tài liệu và số liệu). Khối tin tức mới nhất dùng API posts. Đừng dùng dữ liệu mẫu làm thông tin công bố chính thức; khi nối API hãy thay tại feature tương ứng.

## Kiểm tra

```bash
pnpm build
pnpm lint
pnpm preview
```

`pnpm build` gồm kiểm tra TypeScript và bundle Vite. Xem [AGENTS.md](AGENTS.md) trước khi sửa web; giữ responsive, dark mode, keyboard focus và reduced motion khi chỉnh UI.
