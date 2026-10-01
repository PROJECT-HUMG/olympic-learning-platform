# Olympic Learning Platform

Nền tảng học và quản lý nội dung Olympic HUMG. Repository gồm API Spring Boot và ứng dụng web React. Trang công khai có môn học, kho tài liệu, bảng tin và tiện ích GPA/phòng học chung; khu vực đăng nhập có bảng điều khiển, ngân hàng câu hỏi, nhập đề từ PDF và các màn hình quản trị theo vai trò. Trang chủ lấy tài liệu và tin tức từ API. Các màn luyện tập, kỳ thi và lịch sử còn là màn hướng dẫn, chưa có toàn bộ luồng làm bài/chấm/lưu kết quả; xem [README web](apps/web/README.md).

## Cấu trúc

| Đường dẫn | Vai trò |
| --- | --- |
| `apps/api` | REST API, xác thực, nghiệp vụ, Flyway migrations, PostgreSQL và Redis |
| `apps/web` | SPA React/Vite, trang công khai và khu vực theo vai trò |
| `docs/architecture` | Tài liệu kiến trúc và quyết định thiết kế; đối chiếu với code khi có khác biệt |
| `compose.yml` | Stack đầy đủ: PostgreSQL, Redis, API, web |
| `compose.dev.yml` | PostgreSQL, Redis và Mailpit để chạy app tại máy |

## Chạy tại máy

Yêu cầu: Java 25, Node.js tương thích Vite 8, pnpm, Docker Compose. Tạo biến môi trường cho từng dịch vụ; không commit secret. Cả hai file Compose cần `POSTGRES_PASSWORD`; `compose.yml` còn yêu cầu `JWT_SECRET_KEY`, `ENCRYPTION_KEY`, `ENCRYPTION_SALT` và các biến `OLYMPIC_ADMIN_*` bắt buộc được khai báo trong file. Các tích hợp OAuth, Gemini/DeepSeek, Cloudinary và SMTP cần cấu hình riêng khi sử dụng.

```bash
# Hạ tầng cho phát triển: PostgreSQL 5432, Redis 6379, Mailpit 8025
docker compose -f compose.dev.yml up -d

# Terminal 1: dùng DB_URL/DB_USERNAME/DB_PASSWORD khớp compose.dev.yml
cd apps/api && ./mvnw spring-boot:run

# Terminal 2
cd apps/web && pnpm install --frozen-lockfile && pnpm dev
```

Web chạy tại `http://localhost:3000`, API tại `http://localhost:8080`. Vite proxy `/api` sang API. Cấu hình chạy riêng và các lệnh kiểm tra nằm trong [README API](apps/api/README.md) và [README web](apps/web/README.md).

Để chạy toàn bộ bằng container, cấu hình `.env` theo biến trong `compose.yml`, sau đó chạy `docker compose up --build`. Cổng host mặc định là `3000` và `8080` trên `127.0.0.1`.

## Cách làm việc

Đọc [AGENTS.md](AGENTS.md) trước khi sửa code. Quy ước cụ thể của API và web nằm trong `apps/api/AGENTS.md` và `apps/web/AGENTS.md`. Giữ migration và API contract đồng bộ với client; kiểm tra phần bị ảnh hưởng trước khi gửi thay đổi. Không đưa secret hoặc dữ liệu thật vào tài liệu và commit.
