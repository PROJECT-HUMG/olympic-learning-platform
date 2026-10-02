# Email tài khoản Olympic HUMG

Áp dụng cùng bố cục cho OTP đăng ký, đặt lại mật khẩu, lời mời quản trị và xác thực link cũ. OTP chỉ hiện mã; các luồng dùng link hiện đúng nút hành động và URL dự phòng.

Palette: nền thư #f1f6fa, giấy #ffffff, chữ navy #0b3150, hành động #07549c, chữ phụ #617585, đường phân cách #dce6ec. Màu tập trung ở logo và vùng hành động, không thêm gradient/ảnh nền.

Chữ: Arial/Helvetica cho nội dung, Courier New chỉ cho mã số cần sao chép. Không tải font ngoài. Tiêu đề 26px, nội dung 15px/24px, OTP 36px; canh trái nội dung, canh giữa riêng vùng mã.

Bố cục một cột, rộng tối đa 560px, dùng table và inline CSS. Logo 44px lấy từ icons.svg trong web, xuất PNG 88px có khoảng trắng gọn, nhúng MIME CID. Text brand vẫn đọc được khi ảnh bị ẩn.

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

Đã xem cả 4 biến thể trên Chromium/WebKit ở 320, 390 và 900px, thêm ảnh bị chặn và tên/URL dài: không tràn ngang. Ở 320px, tiêu đề OTP xuống hai dòng; mã giữ một dòng để dễ sao chép. Logo giữ toàn bộ hình gốc, brand bằng text vẫn đọc được khi ảnh không tải. Vùng hành động là điểm nổi bật; khoảng cách và màu dùng chung giữa các thư.

HTML 3,6–4,3KB, PNG 9.384 byte, MIME dưới 20KB trong fixture SMTP. 9 kiểm tra MIME/SMTP đạt; web build đạt, lint 0 lỗi (29 cảnh báo có sẵn). Chưa xem trực tiếp trong app Gmail/Outlook.
