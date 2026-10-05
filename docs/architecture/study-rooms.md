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

## Three.js room presentation (06/10/2026)

The scene is an original procedural fantasy observatory: timber floor, woven rug, stone outlook, mountain silhouettes, bookshelves, lanterns and seated scholar characters. Three.js is lazy-loaded separately from the DOM controls. No remote art, copied characters, saved appearance, event system or backend contract is introduced. Appearance presets remain identity-derived; account avatar/name and recorded focus duration come from the existing snapshot.

Seats retain **local presentation meaning only**, stable across reordered polling snapshots. At least four desks are shown; larger rooms page at twelve desks, covering the existing fifty-member limit. Empty desks are not claimable. Character raycasts open the same details as keyboard/touch participant buttons, with avatar failure fallback and opener focus return. Presence/phase labels distinguish focus, rest, offline and stale data; posture is not verified attention or task completion.

Desktop >=1200px aligns timer and scene edges with a 320px timer rail. Tablet uses a two-column timer/control band above the scene; mobile is timer-first. The participant surface replaces the duplicate lower roster. Shared rhythm, accounting, requests, moderation and lifecycle controls retain their hooks/endpoints.

Rendering uses shared primitives/material batching, one shadow-casting light, a 1024px shadow map, 1.5 pixel-ratio cap and at most 24 render frames/s. Continuous frames stop offscreen, in a hidden document, behind Music/participant dialogs, with stale data/no online participants, or under OS reduced motion. Resize/state updates render on demand; reduced motion does not prohibit a necessary single redraw. The scheduling boundary also checks the preference and restores a neutral pose, without waiting for a media-change event. Pagehide/pageshow suspend and resume scheduling. Geometry, materials, textures, observers, listeners and context are disposed on unmount. Initialization/context loss exposes a compact participant-list fallback with retry, without blocking timer/music/room actions. SwiftShader evidence does not establish physical-device FPS, battery use or thermal behavior.

Music opens a persistent native modal from the header, DOM now-playing control or in-room screen. Native semantics provide background inertness, Escape and explicit Close; parent DOM controls also wrap Tab/Shift+Tab at their boundaries, and focus returns to the actual opener. Cross-origin YouTube controls retain their native keyboard behavior. The player initializes on first deliberate open and remains mounted through close/reopen. Leaving/losing membership, closure, navigation, selection identity change or explicit Retry retains established cleanup/reinitialization. Room-selected title and local unloaded/loading/playing/paused/buffering/blocked/ended/error states are distinct. Browser/YouTube behavior for hidden embeds and cross-origin focus remains an external verification limit.

Mutation khóa user trước rồi khóa phòng; chuyển phòng khóa các ID theo thứ tự cố định. Partial unique index đảm bảo một phòng được chọn trên mỗi user. Khóa phòng ngăn cộng trùng và đổi bài đồng thời; `expectedVersion` trả 409 cho lệnh đổi bài dùng phiên bản cũ. Rời rồi vào lại giữ thời gian đã tích lũy.

Chuyển quyền khóa hai user theo thứ tự UUID trước khi khóa phòng, kiểm tra chủ hiện tại sau khi lấy khóa và kiểm tra giới hạn phòng của người nhận trong cùng transaction. Hai yêu cầu chuyển quyền từ chủ cũ đồng thời chỉ có một yêu cầu được chấp nhận. Dùng cột owner hiện có, không cần migration mới.

## Nhạc

Current product decision (05/10/2026): the room selects a shared video/track; playback position belongs to each device. YouTube IFrame API still plays the default Lofi Girl stream `jfKfPfyJRdk`. Finite videos initialize without a room-derived start timestamp. The app never reads or corrects local position, seeks to room time, or tries to align listeners. Native seek, Play/Pause, mute and volume are local. The three-second audio-preference mirror only reflects native volume/mute controls; it is not a synchronization timer. Room polling still refreshes selection, membership and study rhythm, not playback position. `playback.startedAt` remains in the unchanged API response as selection metadata and is not consumed by the player.

The earlier drift-tolerance/settlement/cooldown correction is superseded, not a current acceptance criterion. Removing timestamp coupling removes that seek-feedback mechanism altogether. Buffering/error/autoplay feedback, explicit retry, stale-callback cleanup and independent local audio preferences remain. Retry may reload the same selected video locally; it does not select a different room track or promise restoration of a local position across iframe reloads.

The default livestream iframe is retained when an empty-queue advance changes only playback version. A different video or finite playback version still replaces the player once, retaining each device's pause/mute/volume and clearing old timers/callbacks. YouTube error 153 feedback, retry/open-on-YouTube, embed origin and strict-origin-when-cross-origin policy remain. No backend/schema/API or dependency changes are required. Deterministic two-player fixtures demonstrate independent positions and local controls, not actual YouTube playback quality or live multiuser proof.

Only the joined owner's explicit “Phát tiếp” (Next track) action advances the room selection through the existing `POST /{id}/playback/next` with `expectedVersion`. It selects the oldest approved queued track or returns to the default stream when none remain. A local ENDED event—including seeking to the end—never advances the shared selection, regardless of role. An ended listener can replay locally while others continue. Room freshness/membership guards still gate owner mutations; the backend still validates the active account, joined owner, open room and version under its existing lock. Automatic advancement formerly driven by the owner's local ended event is removed by the confirmed product decision; no server scheduler or new control rights replace it. YouTube may still block autoplay/embedding or restrict/remove videos. No API key is needed; the server still only parses allowed HTTPS YouTube hosts/video IDs and never downloads submitted URLs.

## Migration và kiểm tra

`V10__create_study_rooms.sql` tạo `study_rooms`, `study_room_members`, `study_room_tracks` cùng foreign key/index. Flyway áp dụng khi API khởi động; Hibernate validate schema. Triển khai API có V10 trước web mới. Rollback ứng dụng có thể giữ các bảng mới; không sửa migration đã áp dụng. Nếu cần xóa dữ liệu/schema, sao lưu trước và dùng migration mới sau khi mọi instance/web đã rollback.

`V11__add_study_room_timeline.sql` thêm `timeline_started_at` (backfill từ `created_at`) và `rhythm_version` mặc định 0. Triển khai API có V11 trên mọi instance trước web hỗ trợ chỉnh giờ; không trộn instance tính lịch theo `created_at` với instance dùng mốc mới khi cho phép đổi giờ. Rollback về API cũ sau khi đổi nhịp sẽ tính lịch theo thời điểm tạo, nên cần điều phối rollback; không xóa/sửa migration đã áp dụng.

`StudyRoomRulesTest` kiểm tra timeline và URL; `StudyRoomIntegrationTest` dùng PostgreSQL Testcontainers để kiểm tra thời gian, quyền, chuyển phòng, expiry, đóng phòng và concurrency thật; `StudyRoomControllerTest` kiểm tra auth filter và HTTP validation. Browser kiểm tra hai tài khoản, polling, player lifecycle và responsive với API/YouTube giả lập; chưa thay thế thử nghiệm YouTube thật trên thiết bị.

Snapshot member trả thêm avatarCrop nullable (x/y căn ảnh 0–1, zoom 1–3), dùng cùng avatarUrl gốc. Null dùng cover ở giữa, zoom 1. Xem [khung avatar](avatar-framing.md).
