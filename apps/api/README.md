# API

Backend của Olympic Learning Platform: Spring Boot 4.0.7, Java 25 và Maven. REST API ở `/api/v1`; dữ liệu lưu trong PostgreSQL, migration qua Flyway, Redis hỗ trợ các luồng nền. Các module hiện có: auth/user/admin, document, post, topic/question, assessment import và storage.

## Chạy local

1. Chuẩn bị Java 25, Docker Compose và biến môi trường phù hợp.
2. Tại root, chạy `docker compose -f compose.dev.yml up -d` để có PostgreSQL, Redis và Mailpit. `compose.dev.yml` tạo database `olympic_platform`, user `olympic_platform`; đặt `POSTGRES_PASSWORD` khi khởi chạy.
3. Tại `apps/api`, chạy ví dụ sau với mật khẩu đúng của môi trường local:

```bash
DB_URL=jdbc:postgresql://localhost:5432/olympic_platform \
DB_USERNAME=olympic_platform \
DB_PASSWORD='<local-password>' \
./mvnw spring-boot:run
```

API mặc định ở `http://localhost:8080`. Profile mặc định là `dev`; profile `prod` yêu cầu cấu hình môi trường chặt hơn. Flyway chạy lúc khởi động và JPA kiểm tra schema bằng `ddl-auto: validate`. Swagger UI thường ở `/swagger-ui/index.html`, OpenAPI JSON ở `/v3/api-docs`, health ở `/actuator/health`.

## Cấu hình

`src/main/resources/application.yaml` chứa cấu hình chung; `application-dev.yaml` và `application-prod.yaml` chứa giá trị theo profile. Các biến chính: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `REDIS_HOST`, `REDIS_PORT`, `JWT_SECRET_KEY`, `ENCRYPTION_KEY`, `ENCRYPTION_SALT`, `OLYMPIC_ADMIN_*`. Tùy tính năng sử dụng thêm `CLOUDINARY_*`, `GOOGLE_CLIENT_*`, `GITHUB_CLIENT_*`, `GEMINI_*`, `DEEPSEEK_*`, `MAIL_*`. Xem file cấu hình và `compose.yml` để biết điều kiện cụ thể; không dùng default phát triển cho production.

## Phát triển và kiểm tra

```bash
./mvnw test
./mvnw -DskipTests package
```

Mã Java ở `src/main/java/me/nghlong3004/olympic`, test ở `src/test/java`, migrations ở `src/main/resources/db/migration`. Đọc [AGENTS.md](AGENTS.md) và skill backend được chỉ định trước khi sửa Java. Test tích hợp dùng Testcontainers có thể cần Docker. Contract API thay đổi cần cập nhật types và services ở web.
