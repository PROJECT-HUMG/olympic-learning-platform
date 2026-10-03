# Vinh danh, thành tích học thuật và bảng xếp hạng

## Hai loại dữ liệu độc lập

Vinh danh là một bài lưu kỷ niệm do admin biên tập: tiêu đề, nội dung, môn, phạm vi, năm, ảnh có thứ tự và danh sách người tham gia. Người tham gia có thể là tài khoản hoặc tên nhập tay. Bản nháp chỉ dành cho admin; chỉ bản đã công bố mới xuất hiện công khai. Vinh danh không cộng điểm và không tự tạo thành tích.

Thành tích học thuật là hồ sơ người dùng gửi kèm minh chứng, chờ admin xác nhận. Chỉ hồ sơ `APPROVED` được cộng điểm. Hồ sơ `PENDING`, `REJECTED` và `REVOKED` không góp vào tổng. Tổng tính từ hồ sơ hiện đang được duyệt, nên duyệt lại không nhân đôi điểm và thu hồi loại điểm khỏi tổng.

## Quy tắc điểm hiện có

| Nhóm | Nhất | Nhì | Ba | Khuyến khích | Tham gia |
| --- | ---: | ---: | ---: | ---: | ---: |
| Olympic toàn quốc (`OLYMPIC_NATIONAL`) | 10 | 9 | 8 | 7 | 6 |
| Olympic cấp trường (`OLYMPIC_SCHOOL`) | 5 | 4 | 3 | 2 | 2 |
| NCKH cấp Bộ (`RESEARCH_MINISTRY`) | 8 | 7 | 6 | 5 | Không áp dụng |
| NCKH cấp trường (`RESEARCH_SCHOOL`) | 6 | 5 | 4 | 3 | 3 |
| NCKH giải thưởng khác (`RESEARCH_OTHER`) | 6 | 5 | 4 | 3 | Không áp dụng |

Điểm giải thưởng và điểm tham gia được cộng nếu người gửi chọn tham gia, kể cả khi đã có giải. Ví dụ Olympic toàn quốc giải Nhất và tham gia được 16 điểm; chỉ tham gia được 6 điểm. Các hồ sơ cộng độc lập, không áp dụng chỉ lấy giải cao nhất hoặc trần 10 điểm. Lựa chọn tham gia ở nhóm chưa có mức điểm bị từ chối; hồ sơ phải có giải hoặc tham gia hợp lệ.

Điểm quốc tế chưa có quy tắc nên chưa hỗ trợ ở form thành tích. Phạm vi `INTERNATIONAL` của bài vinh danh vẫn có thể ghi nhận kỷ niệm và không cộng điểm. Các nhóm hoạt động khác ngoài học thuật được để lại cho đợt sau. Điểm trên nền tảng là tổng theo quy tắc này; không thay thế kết quả đánh giá rèn luyện chính thức của trường.

## Duyệt và quyền riêng tư

Người gửi xem hồ sơ của mình và sửa khi chưa được duyệt. Admin duyệt hoặc từ chối hồ sơ chờ; hồ sơ đã duyệt có thể bị thu hồi. Từ chối và thu hồi cần lý do. Request duyệt mang `expectedVersion`; thay đổi từ màn hình cũ phải trả xung đột thay vì ghi đè quyết định mới. Gửi lại quyết định đang có với phiên bản hiện tại giữ nguyên điểm.

Mỗi thành tích có lựa chọn hiển thị riêng. Hồ sơ đã duyệt nhưng riêng tư vẫn tính vào tổng cá nhân và tổng xếp hạng khi người dùng tham gia bảng; thông tin chi tiết không xuất hiện trên hồ sơ công khai. `publicPoints` của hồ sơ công khai chỉ tính hồ sơ đã duyệt và được bật hiển thị; `totalPoints` trên bảng xếp hạng tính mọi hồ sơ đã duyệt của người tham gia, kể cả riêng tư. Đổi lựa chọn hiển thị không đổi điểm đã xác nhận. Minh chứng luôn riêng tư, kể cả với thành tích hiển thị công khai: chỉ chủ hồ sơ và admin được tải; DTO công khai không chứa dữ liệu, đường dẫn hoặc tên minh chứng.

Bảng xếp hạng yêu cầu chủ tài khoản tự bật tham gia; mặc định tắt. Chỉ tài khoản sinh viên đang hoạt động và đã bật mới được xếp. Có tổng mọi năm và lọc theo năm của ngày đạt thành tích, không theo ngày admin duyệt. Điểm bằng nhau có cùng hạng kiểu `1, 1, 3`; ID tài khoản giữ thứ tự ổn định trong nhóm bằng điểm. Tắt tham gia loại tài khoản khỏi bảng mà không xóa hồ sơ hoặc điểm đã xác nhận.

## Route và contract

Web công khai có `/honors`, `/honors/:id`, `/rankings` và `/achievements/:userId`. Người dùng quản lý gửi hồ sơ/lịch sử/quyền riêng tư/xếp hạng tại `/profile/achievements`; admin biên tập vinh danh, duyệt và gửi thay sinh viên tại `/admin/recognition`.

| API | Quyền và nội dung |
| --- | --- |
| `GET /api/v1/recognition/honors`, `GET /honors/{id}` | Chỉ bài đã công bố; có lọc `year`, `subject`, `page`, `size` |
| `GET /api/v1/recognition/honors/{id}/photos/{photoId}` | Chỉ ảnh thuộc bài đã công bố |
| `GET /api/v1/recognition/rankings` | Khách đọc bảng theo `year` tùy chọn; bỏ `year` để xem mọi năm |
| `GET /api/v1/recognition/profiles/{userId}` | Chỉ chi tiết đã duyệt và bật hiển thị, `publicPoints` không bao gồm hồ sơ riêng tư |
| `GET /api/v1/recognition/achievements/me` | Chủ tài khoản xem mọi trạng thái, cả hồ sơ riêng tư và metadata minh chứng |
| `POST /api/v1/recognition/achievements`, `PUT /achievements/{id}` | Sinh viên gửi/sửa hồ sơ qua multipart: part JSON `metadata`, các part file `evidence`; sửa cần nộp lại minh chứng |
| `PATCH /api/v1/recognition/achievements/{id}/visibility` | Chủ hồ sơ đổi `{publicVisible}` |
| `GET /api/v1/recognition/achievements/{id}/evidence/{attachmentId}` | Owner/admin đang hoạt động; file tải dạng attachment, `no-store`, `nosniff` |
| `GET`, `PATCH /api/v1/recognition/preferences/me` | Chủ tài khoản đọc/đổi `{rankingOptIn}` |
| `/api/v1/admin/recognition/honors` | Admin list/create; `/{id}` get/update/delete; cập nhật JSON có `expectedVersion` |
| `/api/v1/admin/recognition/honors/{id}/photos` | Admin thêm multipart part `files`; `/{photoId}` get/delete, gồm ảnh bản nháp |
| `/api/v1/admin/recognition/achievements` | Admin list theo `status`, `userId`, `page`, `size`; POST multipart có `metadata.userId` để gửi thay sinh viên, vẫn chờ duyệt |
| `POST /api/v1/admin/recognition/achievements/{id}/review` | Admin gửi `{status,note,expectedVersion}` |

Các đường rút gọn trong cùng ô dùng tiền tố `/api/v1/recognition` tương ứng. Danh sách phân trang có `content`; page bắt đầu từ 0, size 1–50. Lỗi dữ liệu/JSON/part thiếu/UUID không hợp lệ trả 400; chưa đăng nhập trả 401; quyền không đủ trả 403; phiên bản cũ hoặc claim đang hoạt động bị trùng trả 409. Public không đọc được bản nháp trả 404.

Thay minh chứng dù metadata giữ nguyên vẫn tăng phiên bản hồ sơ; admin phải tải lại trước khi duyệt bản mới. Thêm/xóa ảnh cũng tăng phiên bản vinh danh để editor đang mở không ghi đè gallery mới. Minh chứng và ảnh đều tải bằng endpoint có kiểm tra quyền/trạng thái, không dùng URL Cloudinary công khai.

## Lưu trữ và vận hành

Flyway `V14` bổ sung dữ liệu vinh danh/người tham gia/ảnh, thành tích/minh chứng và tùy chọn công khai của tài khoản. Cập nhật API có migration trước hoặc cùng đợt với web; không sửa migration đã áp dụng. Tính năng dùng PostgreSQL hiện có, không yêu cầu khóa API hoặc dịch vụ ngoài mới.

Minh chứng được lưu dưới dạng dữ liệu riêng trong DB, tối đa ba file, mỗi file 5 MB và tổng 15 MB. Chỉ nhận JPEG, PNG, WebP hoặc PDF với kiểm tra chữ ký nội dung; không tin tên file hay MIME do trình duyệt gửi. Tên tải về được chuẩn hóa theo loại phát hiện: PNG mang tên `certificate.html` thành `certificate.html.png`; giữ đuôi hợp lệ, chấp nhận cả `.jpg`/`.jpeg`, và giới hạn tên sau chuẩn hóa tối đa 200 ký tự. Byte gốc không đổi. API tải riêng phải kiểm tra quyền theo hồ sơ và trả nội dung file thay vì URL công khai của Cloudinary.

Ảnh vinh danh nhận JPEG/PNG/WebP, tối đa 10 ảnh/bài và cùng giới hạn 5 MB/file, 15 MB/lần gửi; PDF chỉ dành cho minh chứng. Các thuộc tính `olympic.recognition.max-file-bytes`, `max-batch-bytes`, `max-evidence`, `max-photos` có mặc định tương ứng `5242880`, `15728640`, `3`, `10`. Có thể giảm giới hạn vận hành; tăng vượt các mức này bị từ chối vì schema và chính sách giới hạn cứng. Profile dev cho phép request multipart 25 MB để chứa đủ ba minh chứng và metadata. Mỗi sinh viên có tối đa 50 hồ sơ đang chờ duyệt, độc lập với tổng điểm không giới hạn.

Giữ `logging.level.org.hibernate.orm.jdbc.bind=OFF` khi vận hành tính năng; bind diagnostics có thể ghi nội dung minh chứng riêng tư từ cột `bytea`. Profile dev đã tắt mức log này. Log nghiệp vụ chỉ ghi ID/trạng thái/số lượng, không ghi nội dung hoặc byte minh chứng.

Trùng hồ sơ đang chờ hoặc đã duyệt được xác định theo tài khoản, tiêu đề không phân biệt hoa/thường, nhóm và ngày đạt; unique index trên PostgreSQL chặn cả gửi đồng thời. Hồ sơ bị từ chối/thu hồi vẫn lưu lịch sử; khi gửi lại hoặc sửa, không được trùng với hồ sơ đang chờ/đã duyệt khác. Điểm bằng nhau vẫn được cộng nếu các thành tích là hồ sơ riêng hợp lệ.

## Kiểm tra

### Visual polish — ACCEPT tại local, 03/10/2026

Phạm vi: dấu hạng số 1/2/3 theo rank server (giữ đồng hạng và ngữ cảnh bộ lọc), nhãn chỉ từ thành tích APPROVED và publicVisible, cùng dấu mốc theo năm. Vinh danh biên tập có nhãn riêng “Được vinh danh”; không đổi điểm, quyền riêng tư, opt-in hoặc API. Không suy huy hiệu từ tổng điểm xếp hạng. Không thêm tùy chỉnh tên, danh hiệu ngưỡng điểm hay thưởng.

Ownership đã đóng: Grok Peer `d4ebae09` tác giả các file mới ranking-presentation và test riêng; Grok Peer `27350bf8` tác giả các file mới achievement-presentation và test riêng. Lead áp dụng patch, sở hữu wiring/tích hợp, tài liệu, verification và technical acceptance. Types/scoring/service giữ nguyên; hai phạm vi không ghi chồng. Hai handoff đã đóng, không còn Peer pending.

Lead ACCEPT exact candidate sau source inspection và verification: focused Node 9/9; toàn bộ Node 59/59, 0 fail/cancel/skip; build exit 0 (chunk warning); lint exit 0 (29 cảnh báo hiện hữu). Chromium production-build fixture đạt 20 tổ hợp honors/list/detail, rankings theo năm/mọi năm, public profile × sáng/tối × 320/1440px, không tràn ngang hoặc runtime exception. Có đồng hạng 1/1/3, tên/title liền dài, điểm ranking chuyển hàng phụ ở 320px, hai nhãn trước mở rộng, eligibility loại private/pending, nhóm năm giảm dần, mô tả/breakdown giữ nguyên. Hồ sơ mở nhãn bằng phím Space và thu gọn bằng touch, focus hiện rõ và nút ít nhất 44px. Toàn ma trận dùng reduced motion; các component không thêm motion tự động. Lead xem ảnh ranking/profile mobile tối; rank text contrast tính local ít nhất 6:1 sáng, 9:1 tối, phần thành tích dùng token giao diện hiện có.

Evidence local tạm: `/tmp/recognition-polish-kp2C4C/check.mjs`, `recognition-ui-results.json`, `recognition-*.png`. Các lượt harness trước đã lỗi interception/timeout/định vị touch; chỉ lượt cuối exit 0 được tính pass. Fixture chặn request ngoài tài nguyên local, không ghi API thật, không phải live API E2E. Giới hạn production/UX cũ giữ nguyên; không push/deploy hoặc dịch vụ ngoài. Feature-scoped local commit được Human cho phép sau acceptance.

Handoff ranking `d4ebae09` đã đóng: Peer tác giả patch bốn file ranking-presentation model/TSX/CSS và test; Lead áp dụng bằng apply_patch do Peer không có công cụ này, tích hợp vào RankingsPage. Lead chạy focused Node test từ apps/web: 5 pass, 0 fail/cancel/skip. Peer đã relinquish ownership; Lead sở hữu bốn file. Handoff và toàn feature đã được chấp nhận như evidence phía trên, không còn runner ranking cần chờ.

Patch thành tích `27350bf8` và update patch đã được Lead áp dụng. REOPEN đã giải quyết: mô tả và breakdown điểm tham gia công khai giữ sau bộ lọc eligibility, ghi rõ điểm nền tảng, nút +N có accessible name. Lead ACCEPT handoff; Peer đã đóng và relinquish ownership. Lead tích hợp public profile/honors và ACCEPT toàn feature theo evidence phía trên.

### Checkpoint hiện tại — 03/10/2026

Lead đã thu completion exec 14982: Chromium đạt 20 tổ hợp public/admin × sáng/tối × 320/1440 px, không tràn ngang hoặc lỗi runtime. Editor vinh danh đã sửa → PUT → refetch → reload → mở lại, giữ tiêu đề mới và version 1. Lead đã xem ảnh admin mobile tối; evidence ở `/tmp/olympic-verification-8A1Txe/recognition-ui-results.json` và ảnh `recognition-*.png`. Đây là UI production build với API fixture cô lập, không phải live API E2E; không gửi request thay đổi tới API thật. Preview do Lead mở đã dừng sau kiểm tra.

Lead ACCEPT candidate recognition cục bộ: snapshot ba cây main/test/web `82f6465fdcd9321840d18f5d8a1e8f701089f348ee862f046d42d4b005304c97`, cùng integration V14 và route wiring hiện tại. Grok Peer `ee3692d2` hoàn tất read-only review, xác nhận manifest và không có contract blocker về submit/edit/review, version, quyền riêng tư hoặc opt-in. Lead chấp nhận kết luận này sau đối chiếu flow mutation; không yêu cầu sửa nguồn.

Giới hạn giữ nguyên: thêm ảnh lưu DRAFT trước upload, kể cả album đang public; lỗi upload có thể giữ album ở bản nháp tới khi retry/publish thành công. Retry trong editor giữ id/version và file; đóng editor mất file chưa upload, lỗi ngoài 409 đợi fetch tiếp theo để cập nhật danh sách. Đây là giới hạn UX đã biết, không phải ghi đè dữ liệu hay lộ minh chứng. Lead sở hữu nếu cần mở lại cải tiến này; chỉ mở khi yêu cầu thay đổi hành vi hoặc có lỗi tái hiện vi phạm contract. Live API UI E2E chưa chạy; fixture UI không thay thế bằng chứng DB. Email đã ACCEPT cục bộ độc lập. Không có runner hay quyết định Human pending; không cấp quyền commit/deploy.

Checkpoint đã xử lý: exec 33274 kết thúc exit 0, BUILD SUCCESS, 39 test tổng (recognition: 6 policy + 16 PostgreSQL integration + 8 controller; mail: 9), không failure/error/skip. Maven không còn chạy. Đây là lượt mới trên JDK 25.0.3 và PostgreSQL 16/Testcontainers; V14 được áp dụng trên DB test cô lập. Web mới: build exit 0 (cảnh báo chunk lớn), lint exit 0 (29 cảnh báo), Node 47/47 không skip. Mail HTML/EML đã sinh tại `/tmp/olympic-auth-mail-preview`. Completion, UI/save-reopen và review đã đóng như disposition phía trên.

Cập nhật launch (lịch sử, đã giải quyết): runner `d1c2a15a` đã đóng, chưa cung cấp fresh test. Lead trực tiếp chạy suite; lỗi JAVA_HOME/PATH được giải quyết bằng JDK 25 có sẵn riêng cho lệnh, không đổi cấu hình hệ thống. Exec 33274 đã kết thúc thành công như kết quả phía trên; không còn pending runner.

Các phiên `70622da7` và `d1c2a15a` đã đóng; không còn quyền runner hoặc write scope. Lead đã thực hiện kiểm chứng mới và đóng checkpoint khôi phục. Các kết quả lịch sử phía dưới không thay thế kiểm chứng hiện tại.

Chạy các kiểm tra tập trung từ `apps/api`:

```bash
./mvnw -Dtest=RecognitionPointsPolicyTest,RecognitionIntegrationTest,RecognitionControllerTest test
```

Integration test dùng PostgreSQL 16 qua Testcontainers và có thể bỏ qua nếu Docker không sẵn. Khi đó kết quả unit/controller không chứng minh migration, truy vấn xếp hạng, khóa duyệt đồng thời hoặc quyền riêng tư trên DB; cần chạy lại integration khi có Docker. Web cần `pnpm build` và `pnpm lint`, cùng kiểm tra các màn hình người gửi, admin và khách.

Kiểm tra trọng tâm: bảng điểm và cộng tham gia; nhiều giải không bị trần; chỉ điểm đã duyệt; quyền admin/owner; minh chứng không public; thành tích riêng tư có tổng nhưng không chi tiết; opt-in/opt-out; đồng hạng và năm; duyệt lại/thu hồi/xung đột; bản nháp vinh danh; người tham gia liên kết tài khoản hoặc nhập tay. Không coi các lệnh trên là đã chạy chỉ vì được ghi trong tài liệu.

Đã kiểm tra ngày 02/10/2026: 29 test recognition pass (6 policy, 8 controller với security thực, 15 integration với PostgreSQL 16/Testcontainers thật; không có test bị bỏ qua). Integration chạy migration V14 và xác nhận quyền, tổng điểm, truy vấn lọc/xếp hạng, đồng thời duyệt/gửi trùng và rollback file. Kiểm tra tên file theo MIME được bổ sung sau lượt suite này và cần chạy lại trường hợp `evidenceLimitsAndRealContentAreValidatedBeforeAnyRecordIsStored` sau cập nhật chuẩn hóa tên.

Web đã pass build và 47/47 Node test; lint có 0 lỗi, 29 cảnh báo hiện hữu. Chromium đã kiểm tra 24 tổ hợp fixture (6 màn hình × sáng/tối × 320/1440 px) và các tương tác. Kiểm tra trình duyệt dùng dữ liệu fixture, không thay thế kiểm tra end-to-end trên tài khoản và dữ liệu production.
