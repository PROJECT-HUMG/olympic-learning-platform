# Rà soát luồng sử dụng và điều hướng

Ngày: 01/10/2026. Phạm vi: các màn hiện có, điều hướng theo quyền, tài khoản, kho tài liệu, quản lý bài viết/câu hỏi/người dùng. Không bổ sung hệ thống thi hoặc luyện tập trong đợt này.

Checkpoint trước khi sửa UX: `ecbfb14` — `feat: add study rooms and refresh student UI`. Các thay đổi bên dưới nằm sau checkpoint này.

## Các lỗi đã xử lý

| Luồng | Vấn đề trước đây | Hành vi sau sửa |
| --- | --- | --- |
| Mobile → điều hướng | Toàn bộ sidebar được đẩy xuống đáy, đặc biệt nhiều mục ở tài khoản admin | Bỏ thanh dưới; mở menu trên header, chia nhóm và cuộn riêng trong menu |
| Điều hướng theo quyền | Thiếu quản lý người dùng; chọn sai mục khi vào chi tiết/nhập câu hỏi | Menu chung có học tập, thông tin, cá nhân và nhóm quản lý theo quyền; ưu tiên đường dẫn khớp cụ thể nhất |
| Header tài khoản | Tên dài làm chật header; các nút giao diện/AI bị lặp | Header dùng avatar gọn; một nút đổi giao diện; gỡ trợ lý AI chưa hoạt động |
| Sidebar desktop | Rê chuột tự đổi chiều rộng; khởi tạo từ chiều rộng tự động gây nhảy bố cục | Thu/mở bằng nút; đặt chiều rộng ngay khi render; mục thu gọn có nhãn truy cập và tooltip |
| Menu → đổi trang/kích thước | Trạng thái menu có thể mở lại khi quay về URL cũ | Đóng khi chuyển route, dùng history hoặc đổi breakpoint; hỗ trợ Escape, focus trap và trả focus |
| Trang riêng → đăng nhập | Mất URL đang cần mở | Giữ pathname, query và hash qua đăng nhập, đăng ký, quên mật khẩu và liên kết quay lại |
| Kiểm tra phiên đăng nhập | Mất kết nối dễ bị hiểu thành chưa đăng nhập | Lỗi kết nối có màn thử lại tại URL hiện tại; tài khoản sai quyền về dashboard đúng vai trò |
| Tổng quan | Sinh viên có số liệu/hoạt động mẫu; giảng viên/admin chỉ có placeholder | Tổng quan dẫn tới những chức năng đang dùng được, theo vai trò; bỏ tiến độ và lịch sử giả |
| Trang chủ/footer | Các khối môn học/tài liệu/kỳ thi dùng mẫu; newsletter báo thành công dù không gửi | Trang chủ giữ bàn học và tin tức dùng API; gỡ các khối mẫu, newsletter giả, liên kết `#` và OAuth chưa hoàn chỉnh |
| Tài liệu → tìm/lọc | Debounce ghi đè URL khi Back; xóa tất cả bằng nhiều cập nhật rời rạc | Tìm bằng Enter/nút Tìm; URL giữ bộ lọc; xóa tất cả trong một cập nhật, giữ cách xem |
| Tài liệu → chi tiết → danh sách | Mất từ khóa, bộ lọc, trang và chế độ xem | Giữ URL danh sách; mở trực tiếp chi tiết vẫn có đường về kho tài liệu |
| Tải tài liệu trên mobile | Nút chỉ hiện khi hover và nằm trong liên kết chi tiết | Nút tải luôn hiện khi có hành động, vùng chạm 44px, độc lập với liên kết chi tiết |
| Xem trước tài liệu | Gọi endpoint tải xuống, làm tăng lượt tải chỉ vì mở chi tiết | Dùng `downloadUrl` sẵn có trong response chi tiết; chỉ hành động tải mới gọi endpoint tải xuống |
| Sửa tài liệu | Cache chi tiết dùng slug nhưng bị invalidation bằng ID | Làm mới nhóm query chi tiết và danh sách sau cập nhật |
| Ngân hàng câu hỏi | Chỉ thấy 20 câu; mất tìm kiếm khi quay lại; lỗi mutation có promise rejection | Phân trang thực; tìm kiếm/trang trong URL; quay lại danh sách ổn định; xử lý thành công/thất bại bằng toast |
| Quản lý tài liệu/bài viết | Loading/lỗi trông như danh sách trống; lỗi tải bài viết sửa khiến spinner chạy mãi | Phân biệt loading, empty, error; thử lại danh sách và nội dung chỉnh sửa |
| Bài viết nháp/lưu trữ | Tên bài mở trang công khai dù chưa được công bố | Chỉ bài đang công bố có liên kết công khai; bản nháp/lưu trữ chỉnh sửa trong màn quản lý |
| Người dùng → phân trang | UI nhận page 0 nhưng component phân trang cần page 1 | Chuyển đổi offset tại ranh giới UI/API |
| Người dùng → cấp/thu hồi quyền | Dialog giữ bản chụp người dùng cũ, dễ tiếp tục thao tác với trạng thái cũ | Dialog lấy người dùng theo ID từ query hiện tại; mutation chờ query cập nhật xong; quyền tải lỗi có thử lại |
| Phân trang/bộ lọc trên mobile | Nhiều nút nhỏ và dãy trang dài | Mobile dùng Trước, trang hiện tại/tổng, Sau; bộ lọc có nhãn và vùng chạm phù hợp |
| Luyện tập/lịch sử/kỳ thi | Màn khung dễ khiến người dùng tưởng đã có chức năng | Giữ route nhưng thông báo chưa mở, kèm liên kết đến tài liệu, bảng tin và phòng học |

## Những phần vẫn cần hoàn thiện

1. **Luyện tập, thi và lịch sử:** API câu hỏi/nhập đề có sẵn nhưng chưa có toàn bộ luồng đề thi → lượt làm bài → chấm điểm → lưu kết quả. Đây là ưu tiên chức năng tiếp theo sau khi thống nhất UX.
2. **OAuth:** đã gỡ nút khỏi màn đăng nhập vì luồng callback/đăng nhập chưa hoàn chỉnh. Cần triển khai và kiểm tra backend trước khi mở lại.
3. **Chính sách và newsletter:** cần nội dung, endpoint và quy trình thực tế trước khi thêm lại các hành động này.
4. **Bảng tin chi tiết:** tiếp tục rà soát việc giữ bộ lọc/trang qua breadcrumb và cách xem trước bài chưa xuất bản. Đợt này chỉ chặn liên kết công khai sai từ màn quản lý.
5. **Import PDF, phân loại và form hồ sơ:** cần kiểm tra sâu hơn với dữ liệu/file thực, quyền thực và lỗi upload/worker. Kiểm tra bố cục hoặc menu không chứng minh toàn bộ nghiệp vụ của các màn này.
6. **Dịch vụ ngoài:** xác thực email/SMTP, file trên storage, YouTube và dữ liệu production cần kiểm tra trong môi trường triển khai. Browser mock chỉ chứng minh hành vi giao diện và hợp đồng request.
7. **Bundle:** Vite vẫn cảnh báo chunk chính lớn hơn 500 kB. Cần tối ưu tải thư viện theo route trong một đợt hiệu năng riêng.

## Kiểm chứng

- `cd apps/web` rồi `rtk pnpm build`, `rtk pnpm lint`.
- `rtk proxy node --test tests/*.test.ts`: 17 kiểm tra cho URL sau đăng nhập, phân trang/đường về danh sách và GPA.
- Trình duyệt Chromium/Playwright với API mock: guest/student/lecturer/admin; viewport 320, 390, 768 và 1440px; sáng/tối; tên người dùng dài; focus, Escape, đóng menu theo route/history/resize, sidebar và giảm chuyển động.
- Luồng tài liệu: tìm/lọc/Back/reset, cách xem, phân trang không hợp lệ, tải riêng khỏi liên kết chi tiết; xem trước không gọi endpoint tải.
- Luồng quản lý: phân trang/tìm/chi tiết câu hỏi, lỗi thao tác, loading/lỗi/thử lại tài liệu và bài viết, chỉnh sửa bài viết sau lỗi, phân trang và cấp/thu hồi quyền người dùng.
- Kiểm tra hồi quy phòng học: yêu cầu đăng nhập, tạo/tham gia, đề xuất/duyệt nhạc, polling, lỗi kết nối, đóng phòng; tài khoản mobile không tải video, desktop giữ cảnh khi đổi form, reduced motion.

Các kiểm tra trình duyệt dùng mock cho server và YouTube; không thay thế việc chạy thử với backend và các dịch vụ bên ngoài. Không sửa Java, migration hoặc hợp đồng API trong đợt UX này.

## Rà soát bổ sung: mạng chậm, video và luồng phục hồi

Ngày 01/10/2026, sau các thay đổi điều hướng ở trên. Đợt này chỉ rà soát và ghi nhận; chưa sửa các lỗi bên dưới. Dùng lại kết quả build/lint và các kiểm tra hồi quy đã chạy; bổ sung tình huống chưa được kiểm chứng thay vì chạy lại toàn bộ.

### Các vấn đề còn tồn tại

P1: ưu tiên xử lý trước khi coi luồng hoàn chỉnh. P2: cần sửa để trải nghiệm ổn định và có đường phục hồi.

| Ưu tiên | Luồng và bằng chứng | Vị trí sở hữu | Hướng xử lý |
| --- | --- | --- | --- |
| P1 | **Phiên hết hạn:** `/documents` trả 401, refresh trả 401; header vẫn hiện tài khoản cũ. Đi tới `/login` trong cùng SPA bị chuyển về `/admin/dashboard` thay vì cho đăng nhập lại. Đã tái hiện bằng browser mock. Backend vẫn kiểm tra quyền; đây là lỗi trạng thái phiên/UI, không phải bằng chứng vượt quyền. | `src/lib/axios.ts:82`, `features/auth/hooks/use-current-user.ts:14`, `router/guards/guest-route.tsx` | Khi phiên thực sự hết hạn, đồng bộ token và cache người dùng ở luồng xác thực; cho đăng nhập lại và giữ URL cần quay về. Phân biệt refresh 401 với lỗi mạng tạm thời. |
| P1 | **Upload PDF:** UI nhận và ghi tối đa 25 MB; nginx chặn request trên 10 MB, dev multipart cũng 10 MB. File 10–25 MB không đi qua được cấu hình này. Xác nhận từ cấu hình, chưa chạy upload thực qua nginx. | `pages/assessment-import-page.tsx:26`, `nginx.conf:12`, `apps/api/src/main/resources/application-dev.yaml:16` | Thống nhất giới hạn giữa UI, proxy, multipart và import service; request limit cần dư cho multipart overhead. Có thông báo 413 rõ ràng. |
| P1 | **Nhập đề mất đường phục hồi:** tạo job thành công rồi status trả 503; sau ba lần request, màn chỉ còn tiêu đề/mô tả, không có lỗi hay nút thử lại. Reload quay về form upload vì `importId` chỉ nằm trong state. Không có bằng chứng job backend bị mất; UI mất đường mở lại job. Đã tái hiện. | `pages/assessment-import-page.tsx:13`, `features/assessment/hooks/use-assessment-import.ts` | Giữ job ID trong URL, có trạng thái lỗi/thử lại cho status và drafts, cho tiếp tục đợt nhập sau reload. |
| P2 | **Tải tài liệu bị treo:** giữ request file chưa trả về; Escape không đóng dialog, nút Hủy bị vô hiệu hóa. File fetch dùng Axios độc lập, không có timeout hay AbortSignal. Đã tái hiện. | `features/documents/components/document-download-modal.tsx:87`, `features/documents/services/documents.service.ts:27` | Cho hủy request và đóng dialog, timeout phù hợp, có thử lại; dọn timer reset/autoclose để không tác động tài liệu mở sau đó. |
| P2 | **Bảng tin:** từ danh sách có `q/type/page` → bài viết → breadcrumb quay về `/news`, có một document reload và mất toàn bộ bộ lọc. Status 503 của chi tiết lại báo bài viết không tồn tại/đã xóa, không có retry. Đã tái hiện. | `features/post/components/post-list-item.tsx`, `features/post/components/news-detail-feature.tsx:177`, `:223` | Giữ đường về danh sách và dùng React Router Link; tách 404 khỏi lỗi mạng/server, cho thử lại. |
| P2 | **Loading khi tải mã trang:** chặn chunk toolkit khi mở trực tiếp `/toolkit?tool=gpa`: header/footer xuất hiện nhưng `main` rỗng, không có `aria-busy`. Khi chuyển trong SPA, trang trước được giữ lại trong lúc chờ nhưng URL đã đổi và không có chỉ báo tải. Đã tái hiện cả hai. | `router/routes.tsx` (`Suspense fallback={null}`) | Loading nhẹ theo route, giữ shell; có chỉ báo pending khi giữ nội dung cũ. Skeleton đăng nhập cần bỏ phần OAuth đã gỡ khỏi form thật. |
| P2 | **Nhãn form có dữ liệu sẵn:** ở hồ sơ, giá trị họ tên có ngay nhưng nhãn vẫn nằm trong input, đè lên chữ. `FormField` khởi tạo `hasValue=false`, chỉ cập nhật khi change/blur; ref không đồng bộ trạng thái có dữ liệu. Xác nhận bằng screenshot mobile và code. | `components/ui/form-field.tsx:65`, `:67`, `:95` | Sửa tại primitive dùng chung để nhận đúng giá trị khởi tạo, controlled value và cập nhật bằng form reset; kiểm tra cả autofill. |
| P2 | **Hồ sơ mobile và lưu dữ liệu:** tại 320px, username 48 ký tự và email dài làm các ô thông tin vượt card, bị cắt bởi layout. Lưu họ tên thành công vẫn để nút Lưu hoạt động vì dirty state không reset. Đã tái hiện. | `features/user/components/profile-form.tsx:29`, `:89`, `:138`, `features/user/hooks/use-update-profile.ts:14` | Cho grid/text co và xuống dòng; reset form theo dữ liệu server sau khi lưu thành công. |

Các animation trong chi tiết bảng tin còn dùng Framer Motion mà chưa có xử lý giảm chuyển động tại component. Đây là phần cần kiểm tra tiếp khi sửa màn bảng tin, không phải kết quả đo hiệu năng thiết bị thật.

### Video: không cần chặn cả trang để preload

- Hai file cộng lại 5.004.792 byte: sáng 3.467.139 byte, tối 1.537.653 byte. Mỗi lượt vào chỉ chọn video theo theme, không tải cả hai ngay.
- Poster WebP sáng/tối lần lượt 55.144 và 89.838 byte. Browser mock xác nhận nội dung và menu dùng được khi video chưa trả về, và poster vẫn giữ khi video tải lỗi. Mobile auth không mount cảnh video và không request video.
- Cả hai MP4 có `moov` ở offset 32, trước `mdat`; có thể stream, không cần đợi tải hết file mới phát. Component chỉ hiện video sau sự kiện `playing`.
- Luồng nên giữ: **hiện shell/nội dung + ảnh poster → video tải nền → fade sang video khi phát được**. Lỗi/autoplay bị chặn/giảm chuyển động thì tiếp tục dùng poster. Không đặt màn phần trăm đợi video trước khi vào website.
- Tối ưu tiếp: cache media có cơ chế version khi đổi file (nginx hiện chỉ đặt cache lâu cho `/assets/`); ưu tiên poster đang dùng; hỗ trợ chế độ tiết kiệm dữ liệu; giảm dung lượng chunk chính. Loading thật thuộc route và request dữ liệu, không thuộc việc tải xong cảnh nền.

### Giới hạn kiểm chứng và thứ tự tiếp theo

Browser Chromium dùng bản preview tại `127.0.0.1:4173`, API được mock để ép 401/503 và request bị treo. Backend tại `localhost:8080` không chạy ở thời điểm review; chưa xác nhận lại SMTP/storage/YouTube và nghiệp vụ end-to-end thực tế trong lượt này. Các kiểm tra trước đó vẫn có giá trị trong phạm vi đã ghi, nhưng không đủ để tuyên bố mọi tính năng sẵn sàng production.

Thứ tự đề xuất: sửa P1 → phục hồi tải/chuyển trang/bảng tin → primitive form và hồ sơ mobile → kiểm tra với backend thật. Luyện tập, kỳ thi và lịch sử vẫn chưa có toàn bộ luồng làm bài/chấm/lưu kết quả.

Sau khi ổn định, ưu tiên một luồng học tập có ích: **lưu tài liệu + góc tài liệu đã lưu**, sau đó **luyện nhanh theo chủ đề → giải thích → ôn câu sai → lịch sử**, rồi **theo dõi môn học/thông báo mới**. Luyện tập cần API lượt làm bài và chấm điểm bảo vệ đáp án; không đưa thẳng API ngân hàng câu hỏi quản trị cho sinh viên.

## Cập nhật: màn chờ với logo trường

Đã xử lý phần loading mã trang trong bảng rà soát bổ sung; các lỗi phiên đăng nhập, nhập PDF, tải tài liệu, bảng tin và form vẫn chưa được sửa trong đợt này.

- `index.html` hiển thị logo trường, nét bút và tiến độ chuẩn bị. Theo yêu cầu mới, màn chờ giữ tối thiểu 1,5 giây, đợi route đầu, các query đang tải lần đầu, font và video đang dùng trước khi lên 100%; mạng chậm tiếp tục chờ, không có deadline tự bỏ qua. Tiến độ là các bước chuẩn bị, không phải phần trăm byte của toàn website.
- Khi lên 100%, giữ 250ms rồi dùng GSAP: logo/chữ lùi nhẹ, hai lớp nền kéo sang hai bên trong khoảng một giây để mở trang. Chỉ mở tương tác sau khi hiệu ứng kết thúc. Giảm chuyển động dùng fade 120ms. Không phát lại màn mở website toàn màn hình khi đổi route trong SPA.
- Theme được đọc trước khi React tải từ cùng khóa `olympic-theme` của store; mặc định theo thiết bị. Giữ font và assets hiện có. Thêm `gsap` theo yêu cầu; chunk chính hiện khoảng 846 kB, gzip 274 kB (GSAP tăng khoảng 27 kB gzip so với trước hiệu ứng).
- Logo nguồn `public/icons.svg` có canvas 1095 × 1095 nhưng phần hình đo bằng SVG `getBBox()` là x105, y188, khoảng 862 × 686. Chỉ căn bỏ khoảng trắng tại màn chờ, không sửa file gốc hoặc logo navigation. Phần hình hiển thị mobile 120 × 96px, desktop tối đa 148 × 118px; màn chờ route 96 × 76px. Theo yêu cầu mới, bỏ nền giấy sáng ở mode tối: logo nằm trực tiếp trên nền navy, tăng độ sáng nhẹ bằng CSS để còn rõ; giữ nguyên tỉ lệ và file nguồn.
- Các route lazy dùng chung `RouteSuspense` và `PageLoading`. Fallback tham gia trạng thái chuẩn bị của startup cho đến khi trang đầu được render. Chuyển pathname hiển thị trạng thái chờ của trang mới; thay query/filter giữ nguyên state trang.
- Chỉ video theme hiện tại được tải đầy đủ một lần, đo byte qua stream và dùng lại Blob URL khi phát hoặc mount lại cảnh. Video tải chậm giữ tiến độ dưới 100%; video tải lỗi dùng poster dự phòng và cho vào trang. Mobile auth và chế độ giảm chuyển động vẫn không tải video.
- Có chỉ dẫn tải lại sau 12 giây nếu chờ lâu; liên kết giữ nguyên URL/query, không tự nhảy qua loader. JavaScript bị tắt có hướng dẫn rõ.
- Build và lint qua (các cảnh báo cũ về Fast Refresh/hooks và chunk lớn vẫn còn). Browser production preview kiểm chứng 320/390/1440px, sáng/tối: 100% chỉ sau tối thiểu 1,5 giây; root còn khóa tại 100% và trong lúc GSAP mở nền, sau đó được mở tương tác. Ép video, chunk trang và query đầu chậm đều giữ loader; video dùng lại bản đã tải, không request lần hai; poster hoạt động khi video lỗi. Kiểm tra giảm chuyển động, mobile auth và development StrictMode qua; không có lỗi runtime trong các tình huống hoàn tất. Các kiểm tra bootstrap/bundle lỗi/JavaScript tắt ở lượt trước vẫn áp dụng cho markup ban đầu.

## Cập nhật: icon tài khoản và nav desktop

- Đăng nhập/đăng ký vốn không có icon trang trí trước tiêu đề. Đã bỏ icon chìa khóa ở form quên mật khẩu và icon ổ khóa ở form đặt lại mật khẩu để bốn form cùng cách trình bày. Giữ icon ở thông báo đã gửi email, xác thực thành công/lỗi và liên kết đặt lại không hợp lệ vì chúng biểu thị trạng thái.
- Browser với API mock kiểm chứng 320/390/1440px, sáng/tối: đi qua các form, không có icon trang trí trước tiêu đề, gửi khôi phục vẫn tới trạng thái kiểm tra hộp thư có icon, không tràn ngang. Logo preload tối không còn pseudo-element tạo nền sáng. Build/lint qua, không có lỗi runtime trong kiểm tra này.
- Đã áp dụng nav nổi trên các trang công khai ở desktop từ 1280px: tối đa 1200px, cách mép trên 16px, cao 60px và thu nhẹ còn 56px khi cuộn. Ba cột giữ menu ở đúng tâm viewport, độc lập với độ rộng nhóm thao tác tài khoản. Dùng màu theme hiện có, nền kính nhẹ và logo trường được căn bỏ khoảng trắng ở riêng header; giữ font và nguồn logo.
- Menu gồm Môn học/Tài liệu/Bảng tin/Tiện ích; logo dẫn về trang chủ. Vạch chọn trượt theo route, nhận cả trang chi tiết và phòng học; trang không thuộc bốn nhóm thì ẩn vạch. Giảm chuyển động tắt hiệu ứng. CTA duy nhất “Vào góc học tập” mở đăng nhập và giữ đường quay lại gồm query/hash; người đã đăng nhập mở dashboard theo vai trò, giảng viên/admin dùng nhãn “Không gian quản lý” và vẫn có menu avatar.
- Các trang công khai ngoài trang chủ chừa khoảng phía trên cho nav cố định; hero đã có khoảng chừa riêng. Dưới 1280px giữ header/menu nhóm và hai nút đăng nhập/đăng ký trong sheet như trước.
- Kiểm chứng bằng Chromium trên production preview, API mock: guest 1280/1440/1920px và student/lecturer/admin 1440px đều qua ở sáng/tối; đo tâm menu, kích thước nav, khoảng chừa nội dung và không chồng nhóm thao tác. Kiểm tra cuộn, route chi tiết/alias phòng học, history, CTA theo vai trò, đường quay lại có query/hash, keyboard và giảm chuyển động đều qua. Mobile/tablet 320/390/1024/1279px qua menu nhóm, focus/Escape, chuyển route, đổi breakpoint và không tràn ngang. Không có lỗi runtime; build/lint qua với các cảnh báo cũ về chunk lớn, Fast Refresh và dependency hook. Chưa kiểm chứng backend thật trong lượt này.

## Cập nhật 02/10/2026: phiên đăng nhập, bảng tin, phòng học và GPA

Theo phạm vi đã thống nhất, không sửa phục hồi nhập PDF hoặc giới hạn upload PDF trong đợt này. Các mục PDF vẫn ngoài phạm vi; hủy tải tài liệu và hồ sơ/form được xử lý trong cập nhật cuối bên dưới.

- Phiên đăng nhập: refresh dùng chung request, timeout 15 giây. Refresh 401/403 xóa token và dữ liệu cache, cập nhật người dùng về null để tránh vòng chuyển từ đăng nhập về dashboard. Lỗi mạng/timeout/server giữ phiên và cho thử lại. Kết quả refresh cũ không khôi phục lần đã đăng xuất hoặc ghi đè lần đăng nhập mới. Query đang có observer được xóa dữ liệu và chuyển sang lỗi tại chỗ, tránh màn danh sách chờ mãi do xóa query khi đang tải. Đường quay lại sau đăng nhập tiếp tục dùng cơ chế hiện có.
- Bảng tin: các liên kết bài viết giữ URL danh sách gồm từ khóa, loại bài, trang và hash. Breadcrumb/liên kết quay lại dùng React Router, không tải lại document. Chi tiết phân biệt 404 với lỗi kết nối/server có nút thử lại; bài quá hạn ghi “Đã hết hạn”. Hiệu ứng chi tiết và mục lục tôn trọng giảm chuyển động.
- Phòng học: thêm chuyển quyền cho thành viên đang online, có chọn người nhận và xác nhận rõ quyền quản lý. Chủ cũ vẫn học trong phòng; không reset nhạc, lịch hoặc thời gian. API kiểm tra quyền dưới khóa, tài khoản hoạt động và giới hạn 3 phòng của người nhận. Mạng trở lại/tab hiện lại sẽ đồng bộ; trạng thái chưa đồng bộ tạm ngừng đếm ngược và thao tác quản lý. Màn phân biệt thời gian đã ghi nhận với gián đoạn; lease hết hạn cần tham gia lại.
- GPA: thêm kế hoạch mục tiêu trên hệ 4/10, tính trung bình tối thiểu cần đạt từ GPA hiện tại và tín chỉ đã tính/còn lại, báo mục tiêu không khả thi và GPA tối đa. Chấp nhận dấu phẩy/dấu chấm; kiểm tra giá trị và giới hạn số, xử lý không còn tín chỉ. Bản nháp lưu riêng trên trình duyệt; không tự áp dụng quy định học lại/quy đổi của trường.

Kiểm chứng: 31 kiểm thử web đạt; build đạt, lint 0 lỗi/29 cảnh báo cũ; 18 kiểm thử API phòng học đạt với PostgreSQL Testcontainers, gồm chuyển quyền đồng thời, kiểm tra quyền/online/tài khoản và giới hạn phòng. Bộ API toàn repository ở baseline còn hai lỗi khởi tạo context do thiếu Google OAuth client ID; không chạy lại hoặc sửa cấu hình OAuth trong đợt này.

Chromium dùng production preview tại `127.0.0.1:4175`, API và YouTube giả lập: GPA 320/390/1440px sáng/tối giữ bản nháp và không tràn ngang; bảng tin giữ URL mà không reload, lỗi 503 thử lại được và 404 hiển thị đúng; refresh hết hạn mở được đăng nhập, lỗi tạm thời giữ tài khoản, thành công dùng token mới. Phòng học kiểm tra chuyển quyền/hộp thoại Escape, mất mạng rồi kết nối lại, lease hết hạn cần bấm tham gia, và đồng bộ khi tab hiện lại. Kiểm tra giao diện phòng ở 320/1440px sáng/tối và bảng tin mobile tối với giảm chuyển động. Không có lỗi runtime trong các tình huống hoàn tất. Đây chưa phải xác nhận end-to-end với backend/YouTube thật trên điện thoại khóa màn hình.

## Cập nhật 02/10/2026: cảnh phòng học 2D

- Trang phòng thêm cảnh SVG gồm cửa sổ, kệ sách, bàn/ghế và nhân vật có avatar/tên phía trên. Các mẫu nhân vật có màu áo/tóc ổn định theo user ID; tên/avatar lấy từ thành viên thật trong snapshot. API bổ sung `members[].avatarUrl` qua storage service và fetch user/avatar cùng truy vấn; ảnh chưa có hoặc lỗi dùng chữ cái tên.
- Nhân vật có chuyển động xuất hiện/rời chỗ, viết/đọc khi tập trung và vươn vai khi nghỉ. Offline hoặc chưa đồng bộ dừng động tác, đổi nhãn; animation biểu thị nhịp phòng, không xác minh hoạt động học của từng người. Chỗ ngồi không đổi khi snapshot đổi thứ tự; người mới dùng ghế trống hoặc thêm bàn. Cảnh chia tối đa 12 bàn mỗi nhóm, hỗ trợ 50 thành viên và hai cột trên mobile.
- Bấm nhân vật mở tên, vai trò, trạng thái và phút server đã ghi nhận. Escape đóng hộp thoại, trả focus về đúng chỗ; tên dài xuống dòng trong chi tiết. Giảm chuyển động tắt cả động tác lặp và hiệu ứng vào/rời. Không thêm thư viện hoặc tải sprite/video.

Kiểm chứng: 34 test web đạt, build đạt, lint 0 lỗi/29 cảnh báo cũ; 19 test API phòng học đạt, gồm test mới cho URL avatar riêng và null khi không có avatar. Browser Chromium production preview với API/YouTube giả lập kiểm tra 320/390/1440px sáng/tối, avatar ảnh hợp lệ/ảnh lỗi, ghế ổn định qua reorder, hộp thoại và trả focus, giảm chuyển động; kiểm tra thêm vào/rời chỗ, đổi phase, offline, phòng trống, 50 người và tên dài trên mobile. Không tràn ngang hoặc có lỗi runtime trong các tình huống này. Avatar API được kiểm chứng bằng PostgreSQL Testcontainers và URI storage giả lập; chưa chạy luồng avatar/YouTube end-to-end với dịch vụ thật.

## Cập nhật 02/10/2026: chỉnh giờ, chuông và hiệu ứng chuyển nhịp

- Chủ phòng chỉnh phút tập trung/nghỉ ngắn/nghỉ dài, có ba mẫu và giới hạn trùng API. Hộp thoại báo rõ đồng hồ chung bắt đầu lại; nút “Bắt đầu nhịp mới” áp dụng cho cả phòng, giữ thời gian đã ghi nhận, thành viên và nhạc. Phiên bản nhịp chống lệnh trùng/đồng thời; hộp thoại cũ yêu cầu lấy lại thời lượng.
- API thêm PATCH rhythm và Flyway V11 cho mốc timeline/phiên bản. Chốt phần tập trung hợp lệ trước đổi giờ, không gia hạn presence/lease của thành viên khác, không cộng cho người offline hoặc cộng trùng qua heartbeat sau đổi. Lịch phòng hiện có giữ nguyên khi migration; cần cập nhật mọi instance API trước web mới.
- Chuông ba nốt dùng Web Audio, bật/tắt/thử riêng từng thiết bị. Chỉ phát sau thao tác bật âm thanh, cần bật lại sau reload. Hết nhịp học/nghỉ hiện thông báo 7 giây có nút đóng, tia màu và ánh sáng nhẹ. Khử trùng countdown/polling, không coi đặt lại nhịp là hoàn thành, không phát bù khi offline/tab ẩn hoặc quá muộn. Giảm chuyển động giữ thông báo tĩnh.

Kiểm chứng: 39 test web đạt; build đạt, lint 0 lỗi/29 cảnh báo cũ. 25 test API phòng học đạt với PostgreSQL Testcontainers, gồm quyền, HTTP validation, giữ nhạc/thời gian, lease offline và reset đồng thời/trùng phiên bản. Chromium trên production preview với API/YouTube giả lập kiểm tra 320/390/1440px sáng/tối, chỉnh giờ/cancel/giới hạn, hai tài khoản nhận nhịp mới và hộp thoại stale. Web Audio thật tạo ba nốt khi bật/thử và đúng một lần mỗi ranh giới, polling không phát trùng, tắt chuông vẫn giữ hiệu ứng; offline rồi kết nối lại không reo bù, reload cần thao tác âm thanh mới. Mobile tối giảm chuyển động giữ thông báo, không animation/tràn ngang. Không có lỗi runtime trong các tình huống hoàn tất. Chưa kiểm chứng end-to-end với API/YouTube thật hoặc âm thanh trên điện thoại khóa màn hình.

## Cập nhật 02/10/2026: hủy tải tài liệu, nhãn form và hồ sơ mobile

Đã xử lý ba mục P2 tương ứng trong bảng rà soát. Phần phục hồi nhập PDF và giới hạn upload tiếp tục ngoài phạm vi.

- Tải tài liệu: AbortSignal đi qua cả request lấy link với shared API client và request blob không có credentials tới storage. Timeout link giữ 15 giây, file 2 phút; có trạng thái lỗi và Thử tải lại. Nút Hủy tải, Escape/đóng hoặc unmount đều hủy request; tài liệu khác có vòng đời riêng. Dọn timer tự đóng sau thành công, bỏ timer reset trễ và chặn progress/success đến sau khi hủy. Trả focus về nút mở. Không hiện phần trăm khi chưa biết tổng byte; truyền giá trị thực xuống primitive Progress để accessibility nhận đúng tiến độ.
- Nhãn form: CSS dùng `:placeholder-shown`/`:has` trên giá trị native, không phụ thuộc change/blur hoặc state đồng bộ từ ref. Nhận dữ liệu ban đầu, setValue/reset, giá trị đổi không phát event và trạng thái tự điền; giữ label association, ref RHF, màu focus/lỗi, nút xem mật khẩu và giảm chuyển động. Không thêm polling/listener toàn trang.
- Hồ sơ: ô email/username có cột co được và ngắt chuỗi dài; thêm khoảng nội dung phù hợp ở 320px. Lưu thành công lấy tên server trả về làm giá trị/default mới, reset dirty state; khóa ô tên trong lúc lưu. Lưu thất bại giữ bản sửa và nút thử lại.

Kiểm chứng: 39 test web hồi quy đạt, build đạt, lint 0 lỗi/29 cảnh báo cũ. Chromium production preview tại `127.0.0.1:4175`, API/storage giả lập nhưng dùng Axios/XHR và download thật của trình duyệt: hồ sơ 320/390/1440px sáng/tối với username 48 ký tự/email dài, nhãn dữ liệu sẵn, tên server chuẩn hóa và baseline dirty sau lưu; lưu lỗi/thử lại. Form danh mục kiểm tra reset từ dữ liệu có sẵn sang rỗng và mã tự sinh bằng setValue; đổi giá trị native không có event, ô rỗng, màu nhãn focus/lỗi và xem mật khẩu đăng nhập đều qua. Hủy cả request link/file ghi nhận requestfailed, phản hồi cũ không tải file hoặc đổi dialog mới; thành công giữ tên file/tiến độ 100% và timer không đóng dialog kế tiếp. Ép XHR timeout bằng rút ngắn riêng timeout trong fixture, xác nhận cấu hình file vẫn 120.000ms; kiểm tra 503 link/file, retry, tự đóng sau thành công, focus và mobile tối. Không tràn ngang hoặc có lỗi runtime trong các tình huống hoàn tất. Chưa kiểm chứng storage/backend thật trong lượt này; không thay đổi API contract hoặc thêm dependency.

## Cập nhật 02/10/2026: profile và giao diện chung

Dùng hướng thiết kế trong [quy chuẩn giao diện](../architecture/web-ui.md): giữ bảng màu xanh và font Be Vietnam Pro hiện có, tiêu đề chức năng thống nhất, bỏ các khung kính/shadow không phục vụ nội dung. Profile là màn tham chiếu; dữ liệu vẫn lấy từ tài khoản/API.

- Profile desktop có avatar/tên/vai trò ở trái, form thông tin và bảo mật ở phải. Mobile thu gọn avatar cạnh tên, xếp một cột. Email/username dài xuống dòng; ảnh lỗi có chữ cái thay thế. Giữ xem trước/lưu/hủy/xóa ảnh và reset tên theo phản hồi server. Hộp thoại mật khẩu xóa nội dung khi đóng, gợi ý autofill đúng, khóa input khi gửi và trả focus về nút mở.
- Dùng chung PageHeader, PageSection, page-shell và tokens cho dashboard theo vai trò, màn quản lý tài liệu/bài viết/người dùng/danh mục/câu hỏi, môn học, bảng tin, toolkit và trang hướng dẫn. Trang chi tiết dùng chuẩn chữ chung và giữ vùng đọc phù hợp. Nút chính dùng màu primary, nút mặc định/input thường 44px; các kích thước nhỏ và ô nhãn nổi giữ vai trò riêng.
- Auth dùng cùng chuẩn chữ và màu thao tác, giữ cảnh desktop và vở mobile. Phòng giữ nhân vật SVG, nhịp/chuông/nhạc; tiêu đề và điều khiển thống nhất với toolkit. Trang giới thiệu dẫn tới các công cụ đang có. Ô chọn PDF ẩn dùng native input để tránh tràn ngang; không sửa luồng phục hồi/import hoặc giới hạn upload.

Kiểm chứng: production build đạt; 39 test web hồi quy đạt; lint 0 lỗi/29 cảnh báo cũ; diff check sạch. Chromium với API/storage giả lập kiểm tra 21 màn ở 320/1440px sáng/tối, 5 route auth ở cả hai kích thước/theme và dashboard/profile cho student/lecturer ở 1024px. Tiêu đề chức năng cùng font/weight/scale, không tràn viewport; giảm chuyển động bật trong các lượt quét, kiểm tra thêm desktop với motion bình thường. Screenshot được xem lại; từ đó thu gọn avatar mobile và sửa input ẩn.

Kiểm tra hành vi: hồ sơ với dữ liệu dài ở 320/390/1440px, lưu chuẩn hóa/lỗi/thử lại; avatar xem trước/hủy/upload multipart/xóa/hủy xóa và ảnh lỗi; đổi mật khẩu validation/lỗi/thử lại, Escape xóa nội dung và trả focus. Kiểm tra thêm home/404, điều hướng môn tới bộ lọc tài liệu, GPA, URL tab, hộp thoại chỉnh giờ ở 390/1024/1440px. Luồng hủy/tải/timeout/retry tài liệu, nhãn native/reset/mã tự sinh và xem mật khẩu đăng nhập vẫn qua. Không có lỗi runtime trong các tình huống hoàn tất. Chưa kiểm chứng backend, storage hoặc YouTube thật trong lượt thiết kế này; API contract và dependency web giữ nguyên.

## Cập nhật 02/10/2026: trang chủ và nền động

- Thêm lối vào phòng học chung/GPA dưới tìm kiếm, đổi tab Toolkit thành Tiện ích. Bảng tin mới nhất ghép ba NEWS/BLOG theo ngày đăng, thông báo nằm riêng trong bàn học. Bài không có thumbnail dùng hàng văn bản; ảnh lỗi thu lại thành hàng không ảnh. Thu khoảng trống trước bảng tin. Footer public mở đủ nhóm trên desktop và thu/mở bằng details trên mobile, hỗ trợ bàn phím.
- Nền động mặc định bật cả mobile/iPhone; nút cạnh giao diện nhớ lựa chọn. Ánh sáng xanh chỉ trong hero, trôi chậm 32 giây bằng transform, dừng khi khuất hoặc tab ẩn. Tắt nền/giảm chuyển động giữ poster và không tải video ở lần vào đó. Video dùng cơ chế muted/playsInline/fallback sẵn có; lựa chọn trang chủ không thay đổi cảnh auth. Nếu trình duyệt chặn localStorage, nút vẫn đổi được trong phiên.
- Rà soát screenshot sáng/tối ở 390/1440px: giữ tìm kiếm làm thao tác chính, ánh sáng nhẹ sau phần giới thiệu; bảng tin cùng nhịp chữ/màu chung, không có khung ảnh rỗng. Footer mobile thu gọn, không kéo dài trang bằng các nhóm luôn mở.

Kiểm chứng: build đạt; 39 test web hồi quy đạt; lint 0 lỗi/29 cảnh báo cũ; diff check sạch. Chromium production preview với API giả lập và MP4 thật kiểm tra 320/390/1024/1280/1440px sáng/tối: mặc định động, bật/tắt/reload, video thực sự phát/dừng khi cuộn, giảm chuyển động cập nhật trực tiếp, không tải video khi bắt đầu tĩnh; liên kết phòng/GPA/tìm kiếm; thứ tự và loại bài, tab thông báo, lỗi một phần giữ bài còn lại/thử lại và bảng tin rỗng. Kiểm tra thêm footer trên môn học/bảng tin/tài liệu/toolkit, bàn phím và storage bị chặn ở 390/1440px. Không tràn ngang hoặc có lỗi runtime trong các tình huống hoàn tất.

WebKit Linux giả lập iPhone 390px và desktop 1440px qua mặc định động, bật/tắt/reload, ambient dừng khi cuộn, footer mobile/bàn phím/các route public, giảm chuyển động cập nhật trực tiếp và storage bị chặn. Autoplay bị chặn giữ poster đã giải mã. Engine kiểm thử báo lỗi giải mã MP4, nên chỉ xác nhận fallback ảnh tĩnh trên WebKit, không xác nhận phát video trên Safari/iPhone thật. Chromium đã phát/dừng MP4 thật. Chưa kiểm chứng backend thật hoặc thiết bị iPhone trong lượt này.

## Cập nhật 02/10/2026: nav rõ trạng thái và ba vùng trang chủ

- Theo yêu cầu mới, nền động trang chủ bỏ tự tắt theo Giảm chuyển động của thiết bị. Mặc định bật, nút thủ công giữ quyền tắt và nhớ lựa chọn. CinematicScene có tùy chọn respectReducedMotion, mặc định true; chỉ home truyền false để các màn auth tiếp tục tôn trọng thiết bị. CSS giảm chuyển động của cảnh cũng dùng đúng phạm vi. Video/ambient vẫn dừng khi khuất hoặc tab ẩn.
- Nav desktop có đủ năm mục, gồm Trang chủ, đánh dấu trang đang mở bằng nền accent và giữ khớp route chi tiết/alias. Giữ chiều cao khi cuộn, bỏ blur, rút CTA thành Đăng nhập/Góc học tập/Quản lý và căn logo/menu/thao tác không chồng nhau. Mobile gom giao diện tối/nền động vào Tùy chọn hiển thị, còn hai nút cho khách hoặc ba nút khi đăng nhập; menu điều hướng giữ nhóm/quyền/đích đăng nhập.
- Tách bàn học khỏi hero thành section có tiêu đề Bàn học của bạn, mô tả, nền và đường ranh riêng. Ba vùng tìm tài liệu/cảnh, bàn học và bảng tin dùng cùng gutter. Cấp tiêu đề trong tab thành h3 dưới tiêu đề vùng h2. Thu chiều cao tối thiểu notebook mobile; dữ liệu API, tab và liên kết công cụ giữ nguyên.

Kiểm chứng: build đạt, 39 test web hồi quy đạt, lint 0 lỗi/29 cảnh báo cũ và diff check sạch. Chromium production preview với API giả lập và MP4 thật kiểm tra 320/390/768/1024/1279/1280/1440/1920px sáng/tối: nền vẫn phát khi OS báo reduce, CSS video hiện và ánh sáng chạy, bật/tắt/reload không tải video khi đã tắt, đổi media preference không ghi đè lựa chọn. Kiểm tra ranh giới/nền các vùng, tab, nav căn giữa/không chồng/tràn, mở sheet và đổi route/active, đổi theme trong menu và Escape trả focus; khách, student, lecturer/admin và CTA đúng ở 1280px. Auth desktop khi reduce không tải video, chuyển lại no-preference phát bình thường. Các screenshot 390/1440px sáng/tối được xem lại, giữ ranh giới rõ và cảnh làm điểm nhấn.

WebKit Linux giả lập iPhone 390px và desktop 1440px sáng/tối qua manual motion dù OS reduce, nút/menu/theme/reload, ranh vùng, nav, GPA route và poster khi giải mã video lỗi. Auth vẫn không tải video với reduce. Không có lỗi runtime trong các lượt hoàn tất. Đây chưa phải kiểm chứng phát MP4 trên Safari/iPhone thật; engine WebKit Linux vẫn có lỗi giải mã như lượt trước. Không đổi API/dependency hoặc luồng PDF.

## Cập nhật 02/10/2026: nền chuyển động, menu mobile và thẻ tin đồng bộ

- Nền hero có hai vùng sáng mềm và ba đường cong trôi chậm 24–30 giây bằng transform, dùng mask để mép hòa vào nền. Mặc định bật, công tắc thủ công nhớ lựa chọn; home vẫn theo lựa chọn riêng dù OS báo reduce. Video và ba animation dừng khi cuộn khỏi vùng hoặc tab ẩn. Không thêm video, canvas, ảnh hay dependency.
- Avatar public dùng khung 44px ngang các nút thao tác; không đổi avatar sidebar. Mobile dùng thanh nổi logo/avatar/Menu, bỏ nút hiển thị riêng. Menu mở từ dưới lên, công tắc giao diện tối/nền động nằm trên các nhóm điều hướng theo quyền. Nội dung dài cuộn bên trong, nút đóng và footer đăng nhập luôn truy cập được; hỗ trợ safe area.
- Blog/Tin tức/Thông báo dùng cùng màu chữ/nền/viền, phân biệt bằng nhãn. Trang chủ có ba thẻ ngang desktop và một cột mobile; bảng tin dùng thẻ có metadata, tiêu đề, tóm tắt và ảnh gọn khi có. Cả phần đệm thẻ mở chi tiết, giữ đường quay lại gồm bộ lọc/trang/hash. Ảnh lỗi được bỏ; URL ảnh mới vẫn có thể hiển thị.
- Rà soát ảnh 390px sáng và 1440px tối cùng menu mobile: avatar cân với thao tác, menu giảm số nút trên thanh, thẻ tin cùng nhịp và tông màu. Sau rà soát đã làm mềm mép ambient và bỏ vòng focus kép của header.

Kiểm chứng: pnpm build đạt; pnpm lint 0 lỗi/29 cảnh báo cũ; diff check sạch. Chromium và WebKit production preview với API giả lập kiểm tra 320/390/1024/1280/1440px sáng/tối, OS reduce: chuyển động thực sự đổi transform, bật/tắt/reload, không tải MP4 khi đã tắt, dừng/resume khi cuộn hoặc mô phỏng tab ẩn. Kiểm tra avatar ảnh thật/khung 44px, menu/công tắc/theme/Escape trả focus, menu khách 320×360px và menu quản trị dài, nhãn bài cùng computed color/background/border, bố cục thẻ, ảnh lỗi, điều hướng/quay lại và lỗi một phần/thử lại. Kiểm tra riêng bấm vùng đệm thẻ ở 390/1440px trên cả hai engine sau build cuối. Không tràn ngang hoặc có lỗi runtime trong các tình huống hoàn tất.

WebKit Linux vẫn lỗi giải mã MP4 và đã xác nhận fallback poster; chuyển động nền CSS chạy được ở cả hai engine. Chromium phát MP4 thật. Chưa kiểm chứng Safari/iPhone thật hoặc backend thật. Không đổi API, dependency, luồng PDF.

## Cập nhật 02/10/2026: khung avatar lưu ở backend, ảnh gốc giữ nguyên

- Avatar nav trở lại cover lấp đầy vòng tròn 44px, bỏ phần đệm làm ảnh nhỏ. Hồ sơ có Chỉnh ảnh đại diện: kéo chuột/cảm ứng, phím mũi tên/Shift, Độ phóng 1–3× và Đặt lại, xem trước/hủy trước khi lưu. Hộp thoại dùng token/font hồ sơ; màn thấp dùng flex không co các phần và cuộn để ảnh không che nút.
- Theo yêu cầu, không tạo ảnh đã cắt: file gốc, tên, định dạng và bytes được giữ nguyên. Upload multipart gửi file cùng part JSON crop. Backend lưu x/y căn ảnh 0–1 và zoom 1–3 qua embeddable user/migration V12, trả avatarCrop cùng URL gốc. PATCH /users/me/avatar/crop chỉnh lại riêng khung, không upload/delete storage hoặc đổi file/URL. Xóa avatar xóa metadata.
- Frontend dùng AvatarImage chung để áp dụng object-position/scale/transform-origin trong vùng tròn. Nav, hồ sơ, hover card, admin, người đăng tài liệu/bài viết và thành viên phòng học nhận cùng metadata. Chỉnh lại dùng ảnh gốc và khung đã lưu; không cần fetch ảnh khác origin hoặc canvas. Client cũ/null metadata dùng cover giữa, zoom 1; upload cũ không gửi crop vẫn được.
- Hủy hoặc lỗi upload/crop giữ ảnh đã lưu; bản xem trước còn để thử lại. Object URL được dọn. Upload storage mới thất bại không xóa file cũ; lựa chọn ảnh hỏng/định dạng/dung lượng vẫn được kiểm tra.

Kiểm chứng: pnpm build đạt; pnpm lint 0 lỗi/29 cảnh báo cũ; toàn bộ 43 test web đạt, gồm 4 test hình học/round trip metadata và công thức CSS. Backend: 7 test service/controller đạt (gửi nguyên file, crop độc lập, upload lỗi, xóa metadata, mapper auth, multipart tương thích/validation), 2 integration test avatar PostgreSQL/Flyway/JPA đạt với reload metadata/legacy/xóa và 16 test phòng học đạt với metadata thành viên. Testcontainers thực sự chạy, không skip. V12 còn được kiểm tra trên bảng tạm PostgreSQL, cả null/giá trị hợp lệ/partial/out-of-range/NaN, rollback toàn bộ và không áp dụng vào DB dev.

Chromium/WebKit production preview với API giả lập: 390px sáng/tối và 1440px tối, so bytes/name/type file upload với file đã chọn, JSON metadata riêng, preview trùng vùng chọn qua pixel screenshot, chỉnh lại/đặt lại từ ảnh gốc, lưu/reload giữ khung, PATCH chỉ đổi metadata và nav hiển thị cùng vùng ảnh. 320px kiểm tra ảnh dọc, drag chuột (Chromium thêm touch event), upload/crop lỗi/thử lại, màn 320×360px bấm được xác nhận, hủy preview không gửi request và ảnh hỏng không lưu được. Kiểm tra thêm cả hai engine: bài viết đã cache refetch avatar tác giả sau khi sửa khung trong hồ sơ, không upload lại; slider phóng/thu giữ tâm vùng ảnh đã chọn và lưu lại đúng metadata ban đầu. Không tràn ngang hoặc lỗi runtime trong các lượt hoàn tất. Screenshot ảnh thật, sáng/tối và màn thấp đã được xem lại.

API cần chạy migration V12 trước frontend mới. Storage Cloudinary và iPhone thật chưa được kiểm chứng trực tiếp; browser dùng storage/API giả lập, backend dùng PostgreSQL thật trong container và mock storage. Không đổi dependency hoặc luồng PDF.
