# Phòng học chung

Phòng học thay đồng hồ Pomodoro cá nhân trong toolkit. Thành viên đăng nhập, vào cùng một phòng và nhận nhịp học/nghỉ, sự hiện diện và trạng thái nhạc từ server. GPA vẫn là tiện ích local riêng.

## Contract

Tất cả endpoint dưới `/api/v1/study-rooms` yêu cầu JWT. Service kiểm tra tài khoản đang hoạt động trên database; client dùng Axios và luồng refresh hiện có.

| Method | Path | Hành vi |
| --- | --- | --- |
| GET | `/` | 50 phòng mở gần nhất |
| POST | `/` | Tạo phòng, vào phòng mới và rời phòng cũ; trả 201 |
| GET | `/{id}` | Snapshot để xem trước, không vào phòng hoặc cộng thời gian |
| POST | `/{id}/join` | Vào lại hoặc chuyển phòng |
| POST | `/{id}/heartbeat` | Cộng thời gian tập trung hợp lệ, trả snapshot |
| POST | `/{id}/leave` | Rời phòng, giữ thời gian đã học; trả 204, idempotent |
| PATCH | `/{id}/settings` | Chủ phòng sửa quyền đề xuất và số phút tối thiểu |
| POST | `/{id}/close` | Chủ phòng đóng phòng cho mọi thành viên |
| POST | `/{id}/tracks` | Gửi `{youtubeUrl, title}` vào hàng đợi |
| POST | `/{id}/tracks/{trackId}/approve` | Chủ phòng duyệt, chưa đổi bài đang phát |
| POST | `/{id}/tracks/{trackId}/reject` | Chủ phòng gỡ bài chờ hoặc đã duyệt |
| POST | `/{id}/playback/next` | Chủ phòng phát bài đã duyệt cũ nhất; payload `{expectedVersion}` |

Payload tạo phòng: `{name, focusMinutes, breakMinutes, longBreakMinutes, requestPolicy, minimumStudyMinutes}`. Mặc định client gửi 25/5/15 phút, `AFTER_FOCUS`, tối thiểu 15 phút. Nghỉ dài phải ít nhất bằng nghỉ ngắn. Lịch bắt đầu khi tạo phòng, nghỉ dài sau mỗi 4 phiên; không reset khi người khác tham gia. Thời lượng cố định trong một phòng.

Snapshot gồm cấu hình, `serverNow`, `phase`, `phaseEndsAt`, `sessionNumber`, `playback`, `members`, `me` (null khi chưa tham gia/hết lease) và `tracks`. `playback` gồm `videoId`, `title`, `startedAt`, `version`, `isDefault`. Phase là `FOCUS`, `BREAK`, `LONG_BREAK`; trạng thái track là `PENDING` hoặc `APPROVED`.

Policy `OPEN` cho mọi thành viên gửi đề xuất; `AFTER_FOCUS` yêu cầu đủ phút tập trung tích lũy trong phòng; `HOST_ONLY` chỉ cho chủ phòng. Chủ phòng luôn được gửi và bài của chủ phòng được tự duyệt. Thành viên chỉ có một bài đang chờ, hàng đợi tối đa 50 bài. Phòng tối đa 50 membership còn lease; mỗi chủ phòng tối đa 3 phòng mở. Không có phòng riêng/password ở phiên bản này; mọi tài khoản hoạt động đều có thể xem và tham gia phòng mở.

## Polling và tính thời gian

Client poll phòng mỗi 5 giây, danh sách mỗi 15 giây. Khi chưa vào phòng chỉ GET; sau khi vào phòng dùng heartbeat. Sau lỗi 403/409 từ heartbeat, GET lại snapshot để xử lý chuyển phòng, lease hết hạn hoặc phòng đóng. Đóng phòng dừng polling và unmount trình phát. Không dùng WebSocket.

Server dùng `Clock`, không nhận thời gian học do client khai báo. Chỉ cộng giao của khoảng giữa hai heartbeat với phase tập trung, và chỉ khi khoảng đó không quá 30 giây. Không cộng khoảng mất kết nối dài hay giờ nghỉ. Sau 30 giây không heartbeat, thành viên hiện offline; sau 120 giây phải bấm tham gia lại. Trình duyệt có thể giảm tần suất timer khi tab chạy nền hoặc điện thoại khóa màn hình; thời gian đó có thể không được ghi nhận. Đây là thời gian kết nối trong phiên tập trung, không phải xác minh người dùng thực sự đang học.

Mutation khóa user trước rồi khóa phòng; chuyển phòng khóa các ID theo thứ tự cố định. Partial unique index đảm bảo một phòng được chọn trên mỗi user. Khóa phòng ngăn cộng trùng và đổi bài đồng thời; `expectedVersion` trả 409 cho lệnh đổi bài dùng phiên bản cũ. Rời rồi vào lại giữ thời gian đã tích lũy.

## Nhạc

YouTube IFrame API phát livestream Lofi Girl `jfKfPfyJRdk` mặc định; không seek livestream mặc định. Video theo yêu cầu đồng bộ vị trí dựa trên `startedAt` và offset đồng hồ server, kiểm tra mỗi 3 giây. Đồng bộ qua polling là gần đúng, không cùng mẫu âm thanh. Pause, mute và volume chỉ áp dụng trên thiết bị của người dùng.

Chủ phòng bấm “Phát tiếp” để rời livestream và phát hàng đợi. Khi video theo yêu cầu kết thúc, trình phát của chủ phòng gửi lệnh next; nếu chủ phòng offline hoặc pause, phải vào lại/bấm phát tiếp để tiếp tục hàng đợi. Hết hàng đợi trở về livestream mặc định. Video yêu cầu nên là video hữu hạn; các livestream khác không có bảo đảm đồng bộ vị trí. YouTube có thể chặn autoplay, embedding, giới hạn khu vực hoặc gỡ video; UI có bật nhạc, thử lại và mở trên YouTube. Không cần API key và server không tải URL người dùng nhập: chỉ phân tích HTTPS URL của host YouTube cho phép và video ID 11 ký tự.

## Migration và kiểm tra

`V10__create_study_rooms.sql` tạo `study_rooms`, `study_room_members`, `study_room_tracks` cùng foreign key/index. Flyway áp dụng khi API khởi động; Hibernate validate schema. Triển khai API có V10 trước web mới. Rollback ứng dụng có thể giữ các bảng mới; không sửa migration đã áp dụng. Nếu cần xóa dữ liệu/schema, sao lưu trước và dùng migration mới sau khi mọi instance/web đã rollback.

`StudyRoomRulesTest` kiểm tra timeline và URL; `StudyRoomIntegrationTest` dùng PostgreSQL Testcontainers để kiểm tra thời gian, quyền, chuyển phòng, expiry, đóng phòng và concurrency thật; `StudyRoomControllerTest` kiểm tra auth filter và HTTP validation. Browser kiểm tra hai tài khoản, polling, player lifecycle và responsive với API/YouTube giả lập; chưa thay thế thử nghiệm YouTube thật trên thiết bị.
