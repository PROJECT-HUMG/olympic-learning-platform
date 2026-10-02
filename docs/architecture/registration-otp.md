# Xác thực đăng ký bằng OTP

Đăng ký mới dùng OTP 6 chữ số qua email. User vẫn PENDING cho tới khi mã hợp lệ; không cấp access/refresh token trong bước này. Quên/đổi mật khẩu và lời mời quản trị giữ luồng riêng. Link xác thực đã gửi trước khi cập nhật vẫn được xử lý ở /verify-email và POST /api/v1/auth/verify-email, trừ khi đã hết hạn/dùng hoặc bị thay thế khi tiếp tục đăng ký bằng OTP.

## Contract

POST /api/v1/auth/register giữ payload email, username, fullName, password và message/messageKey trong response; thêm verification:

```text
verification:
  verificationSession: opaque secret, 64 ký tự base64url
  email: địa chỉ chuẩn hóa đang chờ xác thực
  expiresAt: thời hạn OTP
  resendAvailableAt: thời điểm được gửi lại
  sessionExpiresAt: thời hạn phiên đăng ký
```

Các endpoint dưới /api/v1/auth/registration cho phép gọi khi chưa đăng nhập, nhưng thao tác cần đúng secret phiên đăng ký hoặc mật khẩu:

| POST | Payload | Kết quả |
| --- | --- | --- |
| /verify | verificationSession, code (chuỗi 6 số, giữ số 0 đầu) | AuthMessageResponse; ACTIVE sau khi mã đúng; gọi lại cùng phiên đã xác thực trả thành công |
| /resend | verificationSession | RegistrationChallengeResponse; mã mới, hủy mã cũ |
| /email | verificationSession, email | RegistrationChallengeResponse; chỉ sửa tài khoản PENDING thuộc phiên; không đổi user ID/password/username |
| /resume | identifier (email hoặc username), password | RegistrationChallengeResponse; kiểm tra mật khẩu, tạo phiên/mã mới và hủy phiên cũ |

Register trả verification lồng trong response; resend/email/resume trả challenge trực tiếp. Response có secret dùng Cache-Control: no-store. Không đặt session, OTP hoặc mật khẩu vào URL/log.

Sửa sang địa chỉ khác được phép ngay để sửa lỗi nhập nhầm, nhưng chịu giới hạn gửi chung. Dùng cùng email chịu cooldown như resend. Email đã tồn tại trả 409 và giữ nguyên email/mã hiện có. Tài khoản ACTIVE/DISABLED hoặc đã xóa không thể sửa email bằng phiên đăng ký.

## Thời hạn và giới hạn

| Quy tắc | Giá trị |
| --- | --- |
| OTP | 10 phút, sinh bằng SecureRandom, dùng một lần |
| Phiên đăng ký | 1 giờ; resume bằng mật khẩu tạo phiên mới |
| Gửi lại/resume | Chờ 60 giây từ lần gửi trước |
| Sai OTP | Tối đa 5 lần mỗi mã; lần thứ 5 khóa mã, cần yêu cầu mã mới |
| Gửi theo user | 10 lần/giờ, gồm đăng ký/resend/sửa email/resume |
| Gửi theo IP | 30 lần/giờ |
| Đăng ký theo IP | 10 lần/giờ |
| Resume theo IP | 20 lần/giờ |
| Resume theo identifier | 10 lần/giờ, tính cả mật khẩu sai |
| Verify theo IP | 60 request/10 phút |

Đây là các hằng số trong service, chưa phải tùy chọn người dùng. Có thể cần điều chỉnh hạn mức IP cho lớp học dùng chung mạng; hạn mức theo user vẫn phải giữ. IP lấy từ servlet remoteAddr theo cấu hình proxy hiện có. Production dùng forward-headers-strategy=framework: Nginx web ghi lại X-Forwarded-* từ kết nối thực và xóa Forwarded do client tự gửi. Không công khai API trực tiếp sau khi bật tin cậy proxy. Nếu có proxy/CDN phía trước Nginx, chỉ cấu hình real_ip từ danh sách proxy đáng tin trước khi dùng địa chỉ đã khôi phục; không tin toàn bộ X-Forwarded-For của client.

Migration V13 tạo auth_registration_challenges và auth_registration_rate_limits. Database chỉ giữ SHA-256 của session và digest SHA-256(session + ":" + OTP); session ngẫu nhiên 48 byte không có trong database, nên không thể dò 6 số từ digest khi chỉ có bản sao DB. Không lưu OTP/session nguyên văn. Rate limit dùng UPSERT PostgreSQL nguyên tử trong transaction REQUIRES_NEW, chia sẻ giữa mọi instance và không mất khi request chính rollback. Bucket chỉ lưu key đã hash, dọn các bucket hết hạn hơn một ngày mỗi giờ.

Mọi thao tác phiên khóa user trước khi đọc challenge. Sai mã cập nhật failedAttempts rồi trả lỗi với noRollbackFor=ApiException; lỗi database vẫn rollback. Sửa email/resend/resume thay challenge và thu hồi email token cũ trong cùng transaction. Email chỉ được xếp gửi sau commit qua MailSendEventListener hiện có. SMTP gửi thất bại không được coi là user đã xác thực; người dùng có thể gửi lại sau cooldown, giới hạn vẫn áp dụng.

## Web

Màn /register hiển thị email rõ ràng, nhập/dán mã bằng một input có inputMode=numeric và autoComplete=one-time-code, giữ số 0 đầu. Có sửa email, gửi lại với đếm ngược và thông báo riêng cho mã sai/hết hạn/khóa/phiên không hợp lệ.

Challenge lưu trong sessionStorage để tải lại cùng tab; không lưu OTP hay mật khẩu. Khi storage bị chặn vẫn dùng state trong phiên hiện tại. Xác thực xong xóa session đã lưu. Sau đóng tab, mất hoặc hết hạn phiên, bấm “Đã đăng ký nhưng chưa xác thực?” rồi dùng email/username và mật khẩu đã tạo. Username giúp phục hồi khi email bị nhập nhầm. Màn đăng nhập PENDING và link xác thực cũ bị lỗi dẫn tới luồng này, giữ đích quay lại sau đăng nhập.

Đếm ngược phía client chỉ hướng dẫn giao diện; API quyết định thời hạn, cooldown và giới hạn. Đồng hồ thiết bị sai có thể làm số đếm lệch.

## Triển khai và kiểm tra

Triển khai API và web cùng đợt; API mới chạy Flyway V13 trước khi web gọi các endpoint mới. Không sửa migration đã áp dụng. Bảng mới không thay đổi token cũ. Khi rollback code về luồng link, người đã nhận OTP cần được xử lý lại bằng phiên bản hỗ trợ OTP; phiên bản cũ không có màn nhập mã/resume.

Không thêm dependency hoặc secret môi trường mới. Dùng cấu hình olympic.mail.enabled và MAIL_* hiện có. Có thể kiểm tra SMTP bằng Mailpit ở môi trường dev; bộ integration dưới kiểm tra persistence/transaction/event email với PostgreSQL, không chứng minh nhà cung cấp SMTP giao thư thật.

```bash
cd apps/api
./mvnw -Dtest=RegistrationOtpIntegrationTest,RegistrationOtpControllerTest,JwtTokenServiceImplTest test
cd ../web
pnpm build
pnpm lint
node --test --test-isolation=none tests/*.test.ts
```
