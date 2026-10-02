# Email tài khoản

Tất cả email hiện có dùng chung HTML tại `apps/api/src/main/resources/mail/auth-email.html`, được dựng bởi `common/mail/AuthMailTemplate`. Không thay đổi route, thời hạn token hoặc cơ chế xác thực.

| Luồng | Nội dung chính |
| --- | --- |
| Đăng ký mới | OTP 6 số, 10 phút, chỉ dùng một lần; không có link xác thực |
| Quên mật khẩu | Nút đặt lại mật khẩu và URL dự phòng |
| Quản trị viên tạo tài khoản | Nút thiết lập tài khoản và URL dự phòng |
| Xác thực email bằng link cũ | Nút xác thực và URL dự phòng; giữ tương thích luồng cũ |

## Định dạng và logo

Mail được gửi UTF-8 với `multipart/related`: nội dung `multipart/alternative` chứa bản chữ thuần và HTML, cùng PNG inline có Content-ID `olympic-logo`. Gắn ảnh sau khi đặt nội dung theo [hướng dẫn MimeMessageHelper của Spring](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/mail/javamail/MimeMessageHelper.html). Client không đọc HTML vẫn có mã hoặc URL trong bản chữ thuần.

Logo gốc là `apps/web/public/icons.svg`. Bản PNG 88×88, nền trong suốt, 9.384 byte được đặt tại `apps/web/public/email-logo.png` và sao chép nguyên byte vào `apps/api/src/main/resources/mail/olympic-logo.png`. Khi đổi logo, xuất lại PNG từ SVG và cập nhật cả hai bản. Email hiển thị ảnh 44×44; logo được nhúng vào thư, không phụ thuộc URL public hoặc server web. Tên ứng dụng vẫn là text khi ảnh bị chặn.

HTML dùng table, CSS inline, font hệ thống, một media query nhỏ cho mobile. Không tải font/ảnh ngoài, không JavaScript hoặc ảnh nền. Tên người nhận, mã và URL được escape; URL hành động phải là HTTP(S) tuyệt đối, không chứa thông tin đăng nhập. Preheader không chứa OTP hoặc token.

Mẫu đo bằng SMTP test: HTML khoảng 3,6–4,3 KB, toàn bộ thư MIME khoảng 18,7–19,7 KB (gồm logo và bản chữ thuần). Không cần migration, cấu hình SMTP vẫn dùng các biến `MAIL_*` hiện có. Cập nhật API để mẫu mới được dùng khi gửi thư; thư đã gửi không đổi.

## Kiểm tra

Tại `apps/api`, dùng Java 25:

```sh
./mvnw -Dtest=AuthMailDeliveryTest test
```

9 test kiểm tra cả 4 strategy qua SMTP loopback, UTF-8, text/HTML, CID và byte ảnh, giới hạn dung lượng, URL/tên không chèn HTML, chế độ tắt mail và tương thích message chữ thuần. Không gửi tới hộp thư thật. Bản HTML/EML xem thử được ghi vào `$TMPDIR/olympic-auth-mail-preview` (theo `java.io.tmpdir`).

Bố cục đã xem trên Chromium và WebKit ở 320, 390 và 900 px, thêm trường hợp ảnh bị chặn và tên/URL dài. Đây là kiểm tra render trình duyệt, chưa xác nhận trực tiếp với các app Gmail/Outlook hoặc SMTP production. Có thể gửi thử qua Mailpit bằng các luồng nghiệp vụ để kiểm tra client cụ thể. Xem [thiết kế](../design/auth-email-design.md).
