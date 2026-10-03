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

Logo gửi kèm chỉ nằm tại `apps/api/src/main/resources/mail/olympic-logo.png`: PNG 88×88 indexed với `tRNS`, trong suốt, 3.137 byte, SHA-256 `069ad936d9ac92e23950bf268714e2f52235798e75e6bc4911033709d403de4b`. Email hiển thị 44×44 CSS px qua CID `olympic-logo`, không phụ thuộc server web. Bản sao `apps/web/public/email-logo.png` đã bị xóa; không cần tạo lại. Nguồn hình lịch sử là `apps/web/public/icons.svg`; khi đổi logo, cập nhật file classpath và kiểm tra lại MIME/render. Tên ứng dụng vẫn là text khi ảnh bị chặn. PNG ở HEAD cũng đã trong suốt; nền trắng bị bỏ là CSS trên thẻ ảnh, không phải nền trong bitmap.

HTML dùng table, CSS inline, font hệ thống, media query cho mobile và dark mode. Không tải font/ảnh ngoài, không JavaScript hoặc ảnh nền. Tên người nhận, mã và URL được escape; URL hành động phải là HTTP(S) tuyệt đối, không chứa thông tin đăng nhập. Preheader không chứa OTP hoặc token.

## Chế độ sáng/tối

Mỗi thư chứa cả bảng màu sáng và tối, khai báo `color-scheme`/`supported-color-schemes` và dùng `@media (prefers-color-scheme:dark)`. Ứng dụng đọc mail hỗ trợ CSS này sẽ tự chọn bảng màu theo chế độ nó báo khi mở thư; bảng màu tối dùng cùng màu nền, card, chữ, border và hành động với `.dark` trong `apps/web/src/index.css`. OTP, nút và URL dự phòng đều có màu tương phản tương ứng. PNG logo giữ nền trong suốt; thẻ ảnh không đặt nền trắng, nên logo hòa vào card theo theme. Màu và byte ảnh gốc không đổi.

Backend không biết theme hệ điều hành của người nhận; lựa chọn theme trên web lưu trong trình duyệt và không truyền sang ứng dụng mail. Vì vậy đây là thích ứng với theme của client đọc mail, không phải đồng bộ lựa chọn sáng/tối thủ công trên website. Gmail/Outlook và các phiên bản khác nhau có thể bỏ qua media query hoặc tự đổi màu theo cách riêng; không đảm bảo tất cả client hiển thị cùng một bảng màu. Client không hỗ trợ CSS này vẫn có bảng màu sáng inline và bản chữ thuần dự phòng. Thư đã gửi trước khi cập nhật không đổi.

Mẫu đo bằng SMTP test sau khi thêm dark mode: HTML khoảng 4,7–5,3 KB, toàn bộ thư MIME khoảng 19,8–20,8 KB (gồm logo và bản chữ thuần; KB tính theo 1.000 byte). Không cần migration, cấu hình SMTP vẫn dùng các biến `MAIL_*` hiện có. Cập nhật API để mẫu mới được dùng khi gửi thư; thư đã gửi không đổi.

## Kiểm tra

### Checkpoint hiện tại — 03/10/2026

Lead ACCEPT candidate email cục bộ trên hash nguồn đã đóng băng: SMTP 9/9 không skip và 24/24 Chromium render (4 thư × sáng/tối × 320/390/900), dùng HTML SMTP thật với CID giải thành đúng byte PNG. Logo natural 88 px/display 44 px, alpha góc 0, bảng màu đúng, không tràn ngang. Đã xem screenshot OTP tối và reset sáng ở 390 px. Evidence: `/tmp/olympic-verification-8A1Txe/mail-render.mjs`, `mail-results.json`, `otp-dark.png`, `reset-light.png`; HTML/EML tại `/tmp/olympic-auth-mail-preview`. Nguồn không đổi. Dùng được cho bốn luồng tài khoản khi API được cập nhật; technical acceptance không cấp quyền deploy. Giới hạn: chưa chạy WebKit mới, render tên/URL cực dài và ảnh bị chặn chưa nằm trong matrix mới; không chứng minh Gmail/Outlook hay giao SMTP production. Những mục này thuộc checkpoint vận hành/client tương ứng, không phải permission blocker cho recognition.

Toàn suite Lead đã kết thúc exit 0, 39/39 không skip, bao gồm SMTP 9/9. HTML/EML mới tại `/tmp/olympic-auth-mail-preview`; PNG/HTML nguồn vẫn khớp hash handoff. Không còn runner đang chạy. Frontier: render HTML SMTP thật và đối chiếu candidate trước ACCEPT; không cần thêm quyết định Human cho kiểm chứng cục bộ, chưa có quyền gửi thư thật/deploy.

Fresh evidence từ suite Lead: `AuthMailDeliveryTest` chạy 9 test, 0 failure/error/skip trên PNG 3.137 byte. HTML 4.663–5.290 byte; MIME 11.230–12.185 byte cho bốn biến thể. Đây là SMTP loopback, không phải giao thư production. Recognition integration trong cùng tiến trình đang chuẩn bị Testcontainers; kết quả toàn suite pending. Render vẫn unknown và candidate chưa ACCEPT.

Cập nhật launch: runner `d1c2a15a` đã đóng mà chưa có fresh test; Lead sở hữu duy nhất runner. Suite kết hợp recognition + SMTP loopback đã khởi chạy với JDK 25 có sẵn sau khi xác định JAVA_HOME/PATH sai (exec session 33274). Kết quả pending, không coi thông báo finished là pass. Bàn giao tài liệu email đã áp dụng độc lập; nguồn vẫn đóng băng. Lead nhận event kết thúc/lỗi rồi kiểm tra báo cáo và HTML/EML mới; chưa ACCEPT candidate.

Lead ACCEPT bàn giao nguồn đóng băng và tiếp nhận quyền sửa tài liệu từ peer `7ce0a7c6`; chưa ACCEPT candidate email. Hash HTML `578154053d0a4cbc8c3ab92d22e85459c23ce6169e3fb2445522c570aad18bad` và PNG ở trên đã được Lead đối chiếu. Peer không sửa nguồn. Các số đo/test/render ghi bên dưới là lịch sử, chưa chứng minh candidate PNG 3.137 byte hiện tại; byte ảnh không giữ nguyên HEAD, và 88 px là kích thước bitmap, không phải ô hiển thị 44 CSS px.

Runner cũ `70622da7` đã đóng sau lỗi runtime, không có fresh test. Grok Peer `d1c2a15a` sở hữu duy nhất Maven runner và kiểm tra recognition + SMTP loopback trên nguồn đóng băng; không sở hữu sửa nguồn. Lead sở hữu tài liệu và checkpoint khôi phục: nhận kết quả fresh suite hoặc lỗi cụ thể, kiểm tra evidence rồi quyết định tiếp. Render mới còn unknown; dùng HTML phát ra từ SMTP test để kiểm tra, không dựng lại bản sao Java. Gmail/Outlook và SMTP production chưa được xác minh. Không commit/push/deploy hoặc gửi mail thật.

Tại `apps/api`, dùng Java 25:

```sh
./mvnw -Dtest=AuthMailDeliveryTest test
```

9 test kiểm tra cả 4 strategy qua SMTP loopback, UTF-8, text/HTML, CID và byte ảnh, giới hạn dung lượng, URL/tên không chèn HTML, chế độ tắt mail và tương thích message chữ thuần. Không gửi tới hộp thư thật. Bản HTML/EML xem thử được ghi vào `$TMPDIR/olympic-auth-mail-preview` (theo `java.io.tmpdir`).

Bản cập nhật dark mode đã chạy lại 9 test SMTP ở trên và 48 tổ hợp render: 4 biến thể × 2 theme × 3 chiều rộng (320, 390, 900 px) × Chromium/WebKit. Màu nền/chữ được kiểm tra theo theme và không có tràn ngang; Chromium kiểm tra thêm màu card, OTP và nút. Đã xem ảnh OTP tối, reset sáng trên Chromium và reset tối trên WebKit ở 390 px. Kiểm tra ảnh bị chặn và tên/URL dài thuộc lần dựng ban đầu, chưa chạy lại trong lần cập nhật dark mode. Đây là kiểm tra render trình duyệt, chưa xác nhận trực tiếp với các app Gmail/Outlook hoặc SMTP production. Có thể gửi thử qua Mailpit bằng các luồng nghiệp vụ để kiểm tra client cụ thể. Xem [thiết kế](../design/auth-email-design.md).

Sau khi bỏ nền trắng của logo, 9 test SMTP đạt khi chạy lại; 4 ca Chromium/WebKit × sáng/tối ở 390 px xác nhận ảnh tải đúng (88 px), nền ảnh trong suốt và không tràn ngang.
