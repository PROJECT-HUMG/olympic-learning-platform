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
| PATCH | `/{id}/rhythm` | Chủ phòng đổi thời lượng và bắt đầu nhịp mới; payload `{focusMinutes, breakMinutes, longBreakMinutes, expectedVersion}` |
| POST | `/{id}/owner` | Chủ phòng chuyển quyền cho thành viên đang online; payload `{userId}` |
| POST | `/{id}/close` | Chủ phòng đóng phòng cho mọi thành viên |
| POST | `/{id}/tracks` | Gửi `{youtubeUrl, title}` vào hàng đợi |
| POST | `/{id}/tracks/{trackId}/approve` | Chủ phòng duyệt, chưa đổi bài đang phát |
| POST | `/{id}/tracks/{trackId}/reject` | Chủ phòng gỡ bài chờ hoặc đã duyệt |
| POST | `/{id}/playback/next` | Chủ phòng phát bài đã duyệt cũ nhất; payload `{expectedVersion}` |

Payload tạo phòng: `{name, focusMinutes, breakMinutes, longBreakMinutes, requestPolicy, minimumStudyMinutes}`. Mặc định client gửi 25/5/15 phút, `AFTER_FOCUS`, tối thiểu 15 phút. Tập trung 15–90 phút, nghỉ ngắn 3–30 phút, nghỉ dài 10–45 phút và ít nhất bằng nghỉ ngắn. Lịch bắt đầu khi tạo phòng, nghỉ dài sau mỗi 4 phiên; không reset khi người khác tham gia.

Chủ phòng đang tham gia có thể chỉnh giờ và bấm “Bắt đầu nhịp mới”: tất cả thành viên bắt đầu `FOCUS`, phiên 1 tại thời điểm server áp dụng. Nhạc, thành viên và thời gian đã ghi nhận được giữ nguyên. Server khóa phòng, kiểm tra `expectedVersion` bằng `rhythmVersion` rồi tăng phiên bản; yêu cầu trùng hoặc dùng phiên bản cũ trả 409. Hộp thoại đang mở phát hiện phiên bản mới và yêu cầu lấy lại thời lượng trước khi gửi. Payload thiếu/sai giới hạn hoặc nghỉ dài ngắn hơn nghỉ ngắn trả 400; không có quyền/chưa tham gia trả 403; phòng đóng trả 409.

Snapshot gồm cấu hình, `serverNow`, `phase`, `phaseEndsAt`, `sessionNumber`, `rhythmVersion`, `playback`, `members`, `me` (null khi chưa tham gia/hết lease) và `tracks`. `playback` gồm `videoId`, `title`, `startedAt`, `version`, `isDefault`. Phase là `FOCUS`, `BREAK`, `LONG_BREAK`; trạng thái track là `PENDING` hoặc `APPROVED`.

Mỗi phần tử `members` gồm `userId`, `displayName`, `avatarUrl`, `avatarCrop`, `focusSeconds`, `online`. `avatarUrl` được giải quyết từ file avatar tài khoản qua storage service, null khi không có avatar riêng. Snapshot lấy kèm user/avatar trong entity graph; không cần request hồ sơ riêng cho từng thành viên. Khung ảnh dùng metadata user từ migration V12. Web dùng chữ cái tên khi ảnh không có/tải lỗi, và vẫn hỗ trợ snapshot từ API cũ chưa có trường avatar.

Policy `OPEN` cho mọi thành viên gửi đề xuất; `AFTER_FOCUS` yêu cầu đủ phút tập trung tích lũy trong phòng; `HOST_ONLY` chỉ cho chủ phòng. Chủ phòng luôn được gửi và bài của chủ phòng được tự duyệt. Thành viên chỉ có một bài đang chờ, hàng đợi tối đa 50 bài. Phòng tối đa 50 membership còn lease; mỗi chủ phòng tối đa 3 phòng mở. Không có phòng riêng/password ở phiên bản này; mọi tài khoản hoạt động đều có thể xem và tham gia phòng mở.

Chuyển quyền yêu cầu chủ phòng hiện tại còn tham gia, phòng đang mở và người nhận là tài khoản hoạt động, đã tham gia và heartbeat trong 30 giây gần nhất. Không được tự chuyển cho mình hoặc chuyển cho người đang làm chủ 3 phòng mở. Chủ cũ vẫn là thành viên; lịch học, hàng đợi, nhạc và thời gian đã ghi nhận không bị reset. Không tự chuyển quyền khi chủ phòng mất kết nối. Payload thiếu/sai UUID trả 400; không có quyền hoặc chưa tham gia trả 403; xung đột trạng thái/giới hạn trả 409.

## Polling và tính thời gian

Client poll phòng mỗi 5 giây, danh sách mỗi 15 giây. Khi chưa vào phòng chỉ GET; sau khi vào phòng dùng heartbeat. Sau lỗi 403/409 từ heartbeat, GET lại snapshot để xử lý chuyển phòng, lease hết hạn hoặc phòng đóng. Đóng phòng dừng polling và unmount trình phát. Không dùng WebSocket.

Client đồng bộ lại khi mạng trở lại hoặc tab hiện lại sau khi chạy nền. Khi offline, đang kết nối lại, request lỗi hoặc snapshot quá 30 giây, màn hiển thị trạng thái kết nối và thời gian đã ghi nhận gần nhất, tạm ngừng hiển thị đếm ngược và thao tác quản lý. Lease hết hạn cần bấm tham gia lại; không tự cộng thời gian gián đoạn. Trình duyệt vẫn có thể giới hạn tác vụ khi điện thoại khóa màn hình.

Server dùng `Clock`, không nhận thời gian học do client khai báo. Chỉ cộng giao của khoảng giữa hai heartbeat với phase tập trung, và chỉ khi khoảng đó không quá 30 giây. Không cộng khoảng mất kết nối dài hay giờ nghỉ. Sau 30 giây không heartbeat, thành viên hiện offline; sau 120 giây phải bấm tham gia lại. Trình duyệt có thể giảm tần suất timer khi tab chạy nền hoặc điện thoại khóa màn hình; thời gian đó có thể không được ghi nhận. Đây là thời gian kết nối trong phiên tập trung, không phải xác minh người dùng thực sự đang học.

Timeline dùng `timeline_started_at`, ban đầu bằng `created_at`; đổi giờ chỉ đặt lại timeline, không thay thời điểm tạo phòng. Trước khi đổi, server chốt phần tập trung theo lịch cũ cho thành viên đang online. Không cập nhật heartbeat/lease của người khác hoặc cộng cho thành viên offline. Timeline mới giới hạn khoảng tính từ mốc mới để heartbeat tiếp theo hoặc lần đổi giờ tiếp theo không cộng trùng phần đã chốt.

## Chuông và hiệu ứng chuyển nhịp

Mỗi thiết bị tự bật/tắt hoặc thử chuông; không đổi nhạc hay tùy chọn của người khác. Web Audio phát ba nốt ngắn, không tải file âm thanh. Cần thao tác “Bật chuông” để trình duyệt cho phát; lưu lựa chọn local nhưng sau tải lại phải bấm bật lại âm thanh. Nếu trình duyệt chặn âm thanh, thông báo cho thử lại và hiệu ứng vẫn hoạt động.

Khi hết một nhịp học hoặc nghỉ, client hiện thông báo 7 giây có nút đóng, tia màu quanh đồng hồ và ánh sáng nhẹ ở đồng hồ/cảnh phòng. Ranh giới nhận từ countdown local và polling được khử trùng để chuông/hiệu ứng chỉ chạy một lần. Không phát khi mới mở phòng, chủ phòng đặt lại nhịp, chưa tham gia, tab ẩn, offline hoặc snapshot chưa đồng bộ; không phát bù các ranh giới quá 10 giây. Tab hiện lại đặt lại mốc theo dõi. Giảm chuyển động giữ thông báo nhưng bỏ tia màu, chuyển động và ánh sáng nhấp nháy. Chuông không được bảo đảm khi thiết bị khóa màn hình/tab chạy nền.

## Cảnh phòng học 2D

Trang phòng có cảnh SVG với bàn/ghế, nhân vật và nhãn avatar/tên từ snapshot thật. Nhân vật giữ cùng chỗ ngồi trong vòng đời màn phòng dù dữ liệu polling đổi thứ tự; người mới lấp chỗ trống hoặc thêm bàn. Ghế còn lại sau khi thành viên rời để animation rời chỗ có thể kết thúc. Chỗ ngồi chỉ là bố cục local, không phải tính năng đặt chỗ hay dữ liệu được đồng bộ giữa các thiết bị.

Nhân vật viết/đọc trong `FOCUS`, vươn vai trong giờ nghỉ; chuyển động chỉ mô tả phase chung. Offline hoặc chưa đồng bộ thì dừng động tác và đổi nhãn trạng thái. Không suy ra người dùng thực sự đang học từ animation. Bấm nhân vật mở tên, vai trò, trạng thái kết nối và thời gian server đã ghi nhận; hỗ trợ bàn phím/Escape và trả focus về chỗ đã chọn. Ảnh lỗi có chữ cái tên dự phòng.

Cảnh có ít nhất 4 bàn; từ 13 bàn chia thành các nhóm tối đa 12 để tránh một cảnh quá lớn. Mobile dùng hai cột, desktop bốn cột; hỗ trợ toàn bộ tối đa 50 thành viên. SVG/CSS dùng theme hiện có, không tải sprite/video hay thêm thư viện. `prefers-reduced-motion` tắt các chuyển động vào/rời và động tác lặp.

Mutation khóa user trước rồi khóa phòng; chuyển phòng khóa các ID theo thứ tự cố định. Partial unique index đảm bảo một phòng được chọn trên mỗi user. Khóa phòng ngăn cộng trùng và đổi bài đồng thời; `expectedVersion` trả 409 cho lệnh đổi bài dùng phiên bản cũ. Rời rồi vào lại giữ thời gian đã tích lũy.

Chuyển quyền khóa hai user theo thứ tự UUID trước khi khóa phòng, kiểm tra chủ hiện tại sau khi lấy khóa và kiểm tra giới hạn phòng của người nhận trong cùng transaction. Hai yêu cầu chuyển quyền từ chủ cũ đồng thời chỉ có một yêu cầu được chấp nhận. Dùng cột owner hiện có, không cần migration mới.

## Nhạc

YouTube IFrame API phát livestream Lofi Girl `jfKfPfyJRdk` mặc định; không seek livestream mặc định. Video theo yêu cầu đồng bộ vị trí dựa trên `startedAt` và offset đồng hồ server, kiểm tra mỗi 3 giây. Đồng bộ qua polling là gần đúng, không cùng mẫu âm thanh. Pause, mute và volume chỉ áp dụng trên thiết bị của người dùng.

Chủ phòng bấm “Phát tiếp” để rời livestream và phát hàng đợi. Khi video theo yêu cầu kết thúc, trình phát của chủ phòng gửi lệnh next; nếu chủ phòng offline hoặc pause, phải vào lại/bấm phát tiếp để tiếp tục hàng đợi. Hết hàng đợi trở về livestream mặc định. Video yêu cầu nên là video hữu hạn; các livestream khác không có bảo đảm đồng bộ vị trí. YouTube có thể chặn autoplay, embedding, giới hạn khu vực hoặc gỡ video; UI có bật nhạc, thử lại và mở trên YouTube. Không cần API key và server không tải URL người dùng nhập: chỉ phân tích HTTPS URL của host YouTube cho phép và video ID 11 ký tự.

## Migration và kiểm tra

`V10__create_study_rooms.sql` tạo `study_rooms`, `study_room_members`, `study_room_tracks` cùng foreign key/index. Flyway áp dụng khi API khởi động; Hibernate validate schema. Triển khai API có V10 trước web mới. Rollback ứng dụng có thể giữ các bảng mới; không sửa migration đã áp dụng. Nếu cần xóa dữ liệu/schema, sao lưu trước và dùng migration mới sau khi mọi instance/web đã rollback.

`V11__add_study_room_timeline.sql` thêm `timeline_started_at` (backfill từ `created_at`) và `rhythm_version` mặc định 0. Triển khai API có V11 trên mọi instance trước web hỗ trợ chỉnh giờ; không trộn instance tính lịch theo `created_at` với instance dùng mốc mới khi cho phép đổi giờ. Rollback về API cũ sau khi đổi nhịp sẽ tính lịch theo thời điểm tạo, nên cần điều phối rollback; không xóa/sửa migration đã áp dụng.

`StudyRoomRulesTest` kiểm tra timeline và URL; `StudyRoomIntegrationTest` dùng PostgreSQL Testcontainers để kiểm tra thời gian, quyền, chuyển phòng, expiry, đóng phòng và concurrency thật; `StudyRoomControllerTest` kiểm tra auth filter và HTTP validation. Browser kiểm tra hai tài khoản, polling, player lifecycle và responsive với API/YouTube giả lập; chưa thay thế thử nghiệm YouTube thật trên thiết bị.

Snapshot member trả thêm avatarCrop nullable (x/y căn ảnh 0–1, zoom 1–3), dùng cùng avatarUrl gốc. Null dùng cover ở giữa, zoom 1. Xem [khung avatar](avatar-framing.md).
