# API

Backend của Olympic Learning Platform: Spring Boot 4.0.7, Java 25 và Maven. REST API ở `/api/v1`; dữ liệu lưu trong PostgreSQL, migration qua Flyway, Redis hỗ trợ các luồng nền. Các module hiện có: auth/user/admin, document, post, topic/question, assessment import, storage, studyroom và recognition.

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

Phòng học chung dùng `/api/v1/study-rooms`, yêu cầu JWT và tài khoản đang hoạt động. Chủ phòng chuyển quyền qua `POST /{id}/owner` với `{userId}`; người nhận phải đang online trong phòng và chưa làm chủ 3 phòng mở. Chủ phòng chỉnh thời lượng qua `PATCH /{id}/rhythm` với `{focusMinutes, breakMinutes, longBreakMinutes, expectedVersion}`; bắt đầu phiên tập trung mới, giữ thời gian đã ghi nhận và nhạc. Snapshot trả `rhythmVersion`; phiên bản cũ trả 409. Flyway `V10` tạo ba bảng phòng/thành viên/hàng đợi; `V11` thêm mốc timeline và phiên bản nhịp, giữ lịch của phòng hiện có khi migration. Cập nhật mọi instance API trước web chỉnh giờ. Không cần biến môi trường hay YouTube API key mới. Xem [contract, polling và vận hành](../../docs/architecture/study-rooms.md). Kiểm tra module (Docker cần chạy cho PostgreSQL integration):

```bash
./mvnw -Dtest=StudyRoomRulesTest,StudyRoomIntegrationTest,StudyRoomControllerTest test
```

## Khung avatar và ảnh gốc

Ảnh gốc giữ nguyên trong storage; vị trí/độ phóng lưu riêng ở user qua migration V12. Upload avatar nhận thêm part JSON crop tùy chọn; PATCH /api/v1/users/me/avatar/crop chỉnh lại khung mà không upload ảnh. API trả avatarCrop cùng avatarUrl cho frontend. Xem [contract khung avatar](../../docs/architecture/avatar-framing.md).

## Vinh danh và thành tích học thuật

Module recognition tách bài vinh danh công khai/bản nháp khỏi hồ sơ thành tích có minh chứng riêng tư. Điểm chỉ đến từ hồ sơ Olympic/NCKH đã được admin duyệt; tổng mọi năm/theo năm không áp dụng trần hoặc chỉ lấy giải cao nhất, và cộng điểm tham gia khi nhóm có quy tắc. Chủ tài khoản tự bật xếp hạng và chọn hiển thị từng hồ sơ. Flyway V14 bổ sung dữ liệu; cập nhật cùng web, không cần biến môi trường mới. Minh chứng lưu trong PostgreSQL, tối đa 3 file × 5 MB; request cần cho phép đủ 15 MB dữ liệu cùng metadata. Xem [contract, quyền riêng tư và kiểm tra](../../docs/architecture/recognition.md).

```bash
./mvnw -Dtest=RecognitionPointsPolicyTest,RecognitionIntegrationTest,RecognitionControllerTest test
```

Integration test cần Docker/PostgreSQL Testcontainers; nếu bị bỏ qua thì chưa xác nhận migration và xử lý đồng thời. Quốc tế chưa có mức điểm, nhóm ngoài học thuật chưa triển khai.

## OTP đăng ký

Đăng ký mới dùng OTP 6 số, sống 10 phút; sửa email/resend/resume có phiên đăng ký riêng, cooldown và giới hạn theo user/IP. API cần Flyway V13 và cập nhật cùng đợt với web. Link xác thực cũ vẫn được hỗ trợ tới khi dùng/hết hạn/bị thay thế. Xem [contract và vận hành OTP](../../docs/architecture/registration-otp.md).

## Email tài khoản

OTP, đặt lại mật khẩu, lời mời tài khoản và xác thực link cũ dùng chung mẫu HTML nhẹ, bản chữ thuần dự phòng và logo PNG nhúng inline lấy từ web. Cấu hình SMTP không đổi. Xem [định dạng và kiểm tra email](../../docs/architecture/account-email.md).
