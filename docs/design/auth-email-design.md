# Email tài khoản Olympic HUMG

Áp dụng cùng bố cục cho OTP đăng ký, đặt lại mật khẩu, lời mời quản trị và xác thực link cũ. OTP chỉ hiện mã; các luồng dùng link hiện đúng nút hành động và URL dự phòng.

Palette: nền thư #f1f6fa, giấy #ffffff, chữ navy #0b3150, hành động #07549c, chữ phụ #617585, đường phân cách #dce6ec. Màu tập trung ở logo và vùng hành động, không thêm gradient/ảnh nền.

Dark mode tự động khi client hỗ trợ `prefers-color-scheme`: nền #002b42, card #11364a, chữ #f1f7fa, chữ phụ #adc3cf, đường phân cách #35586b, OTP #153e53, hành động/link #97cde6 và chữ nút #002b42. Các màu này khớp token `.dark` của web; logo PNG trong suốt hòa vào card, không có ô nền trắng và không đổi màu ảnh gốc. Inline CSS vẫn là bảng màu sáng dự phòng. Theme thủ công lưu trên web không được đồng bộ sang ứng dụng mail; client có thể bỏ qua CSS tối hoặc tự đổi màu.

Chữ: Arial/Helvetica cho nội dung, Courier New chỉ cho mã số cần sao chép. Không tải font ngoài. Tiêu đề 26px, nội dung 15px/24px, OTP 36px; canh trái nội dung, canh giữa riêng vùng mã.

Bố cục một cột, rộng tối đa 560px, dùng table và inline CSS. Logo hiển thị 44×44 CSS px; bitmap classpath 88×88 indexed, trong suốt, 3.137 byte, nhúng MIME CID. Bản PNG public đã bị xóa; không tạo lại. Nguồn hình lịch sử là icons.svg trong web. Text brand vẫn đọc được khi ảnh bị ẩn. Nền trắng bị bỏ là CSS của thẻ ảnh; PNG ở HEAD đã trong suốt và byte PNG hiện tại khác HEAD.

```text
Logo + Olympic HUMG
────────────────────
Tiêu đề theo nghiệp vụ
Chào người nhận, nội dung ngắn
[Mã OTP lớn / nút mở đúng luồng]
Thời hạn / URL dự phòng nếu có
────────────────────
Bỏ qua nếu không yêu cầu; gửi tự động
```

Rà soát trước khi dựng: không dùng banner, nền ảnh, nhiều thẻ con hoặc chữ tiếp thị. Điểm nổi bật duy nhất là hành động cần thực hiện; logo và màu bám giao diện hiện có. Không đặt OTP hoặc token vào preheader.

Tiêu chí kiểm tra: MIME chứa plain text + HTML và ảnh inline, HTML không gọi tài nguyên ngoài; tên/link escape an toàn; mobile 320px không tràn; vẫn rõ khi ảnh bị tắt; HTML dưới 10KB, PNG dưới 10KB.

## Rà soát sau khi dựng

Fresh 03/10/2026: Lead đã xem OTP tối/reset sáng 390 px, kiểm tra 24 ca Chromium từ HTML SMTP thật, logo CID đúng và không tràn ở 320/390/900 px, hai theme. Candidate email được ACCEPT cục bộ; giới hạn WebKit/client thật/long input ghi tại account-email.md. Evidence `/tmp/olympic-verification-8A1Txe/mail-results.json`. Các đoạn bên dưới giữ lịch sử, không thay thế kết quả mới này.

Checkpoint 03/10/2026: Lead tiếp nhận doc handoff từ peer `7ce0a7c6`. Các kết quả phía dưới là lịch sử với asset cũ, không phải fresh evidence của PNG 3.137 byte hiện tại. SMTP/render mới chưa xác minh; không giữ tuyên bố byte/màu ảnh nguyên vẹn. Runner `d1c2a15a` kiểm tra SMTP loopback; Lead nhận kết quả và nghiệm thu. Xem trạng thái hiện tại tại [account-email.md](../architecture/account-email.md).

Lần dựng ban đầu đã xem cả 4 biến thể trên Chromium/WebKit ở 320, 390 và 900px, thêm ảnh bị chặn và tên/URL dài: không tràn ngang. Ở 320px, tiêu đề OTP xuống hai dòng; mã giữ một dòng để dễ sao chép. Logo giữ toàn bộ hình gốc, brand bằng text vẫn đọc được khi ảnh không tải. Vùng hành động là điểm nổi bật; khoảng cách và màu dùng chung giữa các thư.

Bản dark mode đã kiểm tra 48 tổ hợp trên Chromium/WebKit: 4 biến thể × sáng/tối × 320/390/900px × 2 engine. Màu nền và chữ đúng bảng màu tương ứng, không tràn ngang; Chromium kiểm tra thêm card, mã OTP và nút. Ảnh OTP tối và reset sáng trên Chromium, reset tối trên WebKit ở 390px đã được xem trực tiếp. Trường hợp ảnh bị chặn/tên dài chưa được chạy lại trong lần cập nhật này.

Bản sửa bỏ nền trắng của logo đã chạy lại 9 test SMTP và 4 ca Chromium/WebKit × sáng/tối ở 390px: logo tải đúng, nền ảnh trong suốt và không tràn ngang. Logo trên nền tối đã được xem; chữ thương hiệu bên cạnh vẫn rõ.

Sau khi thêm dark mode, HTML 4,7–5,3KB, PNG 9.384 byte, MIME 19,8–20,8KB trong fixture SMTP (KB tính theo 1.000 byte). 9 kiểm tra MIME/SMTP đạt. Kết quả web build/lint của lần dựng ban đầu: build đạt, lint 0 lỗi (29 cảnh báo có sẵn). Chưa xem trực tiếp trong app Gmail/Outlook.
