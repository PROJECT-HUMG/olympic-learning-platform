# Functional Requirements và Non-Functional Requirements

## Website Olympic HUMG

## 1. Functional Requirements

### 1.1. Quản lý người dùng và phân quyền

Hệ thống phải cho phép người dùng đăng nhập và sử dụng các chức năng phù hợp với vai trò của mình.

Các vai trò chính bao gồm:

* Sinh viên.
* Giảng viên.
* Quản trị viên.

Hệ thống phải hỗ trợ phân quyền để:

* Sinh viên có thể xem tin tức, tài liệu, làm bài luyện tập, tham gia thi thử và xem kết quả cá nhân.
* Giảng viên có thể quản lý tài liệu, tin tức, ngân hàng câu hỏi, đề luyện tập, đề thi thử và theo dõi kết quả sinh viên.
* Quản trị viên có thể quản lý người dùng, phân quyền, nội dung website và cấu hình hệ thống.

### 1.2. Quản lý tin tức và thông báo

Hệ thống phải cho phép quản trị viên hoặc giảng viên tạo, chỉnh sửa, xoá và công khai tin tức, thông báo liên quan đến hoạt động Olympic.

Tin tức có thể bao gồm:

* Thông báo tuyển chọn đội tuyển.
* Lịch ôn luyện.
* Lịch thi.
* Kết quả thi.
* Hoạt động Olympic trong trường.
* Bài viết chia sẻ kinh nghiệm.

Người dùng phải có thể xem danh sách tin tức, xem chi tiết tin tức và tìm kiếm tin tức theo từ khóa hoặc danh mục.

### 1.3. Quản lý môn thi Olympic

Hệ thống phải cho phép quản trị viên hoặc giảng viên quản lý danh sách các môn thi Olympic.

Mỗi môn thi có thể bao gồm:

* Tên môn.
* Mô tả.
* Danh sách chủ đề liên quan.
* Tài liệu tham khảo.
* Bài luyện tập.
* Đề thi thử.
* Bảng xếp hạng.
* Danh sách sinh viên tham gia hoặc quan tâm.

### 1.4. Quản lý tài liệu học tập

Hệ thống phải cho phép giảng viên hoặc quản trị viên đăng tải và quản lý tài liệu học tập theo từng môn thi Olympic.

Tài liệu có thể bao gồm:

* File PDF, Word, PowerPoint hoặc các định dạng tài liệu phổ biến.
* Link tài liệu bên ngoài.
* Mô tả tài liệu.
* Môn học liên quan.
* Chủ đề liên quan.
* Trạng thái hiển thị.

Sinh viên phải có thể tìm kiếm, xem và tải tài liệu nếu tài liệu đó được phép công khai.

Hệ thống không bắt buộc phải theo dõi chi tiết việc sinh viên đã đọc hoặc hoàn thành từng tài liệu.

### 1.5. Quản lý ngân hàng câu hỏi

Hệ thống phải cho phép giảng viên tạo và quản lý ngân hàng câu hỏi theo môn thi, chủ đề, độ khó và dạng câu hỏi.

Một câu hỏi có thể bao gồm:

* Nội dung câu hỏi.
* Môn thi.
* Chủ đề.
* Độ khó.
* Loại câu hỏi.
* Đáp án.
* Lời giải hoặc giải thích.
* Điểm số.
* Trạng thái sử dụng.

Các dạng câu hỏi có thể hỗ trợ ở giai đoạn đầu:

* Trắc nghiệm một đáp án.
* Trắc nghiệm nhiều đáp án.
* Điền đáp án ngắn.
* Tự luận dạng text.
* Nộp bài dạng file.

### 1.6. Hệ thống luyện tập

Hệ thống phải cho phép sinh viên luyện tập thông qua các bộ câu hỏi hoặc bài luyện tập theo môn thi.

Sinh viên có thể:

* Chọn môn thi.
* Chọn chủ đề.
* Làm bài luyện tập.
* Nộp bài.
* Xem kết quả sau khi hoàn thành.
* Xem lại lịch sử luyện tập.

Hệ thống phải lưu lại kết quả luyện tập của sinh viên để phục vụ thống kê, xếp hạng và đánh giá năng lực.

### 1.7. Hệ thống thi thử

Hệ thống phải cho phép giảng viên tạo và tổ chức các đợt thi thử online.

Một đợt thi thử có thể bao gồm:

* Tên kỳ thi.
* Môn thi.
* Thời gian bắt đầu.
* Thời gian kết thúc.
* Thời lượng làm bài.
* Danh sách câu hỏi.
* Cách tính điểm.
* Trạng thái kỳ thi.

Sinh viên phải có thể tham gia đợt thi thử nếu đủ điều kiện.

Hệ thống phải hỗ trợ:

* Bắt đầu làm bài.
* Lưu câu trả lời.
* Nộp bài.
* Tự động tính điểm với câu hỏi có đáp án cố định.
* Cho phép giảng viên chấm thủ công với câu tự luận hoặc bài nộp dạng file.
* Xem kết quả sau khi bài thi được chấm.

### 1.8. Quản lý kết quả luyện tập và thi thử

Hệ thống phải lưu trữ kết quả luyện tập và thi thử của sinh viên.

Kết quả có thể bao gồm:

* Sinh viên làm bài.
* Bài luyện tập hoặc đợt thi thử.
* Môn thi.
* Số câu đúng.
* Số câu sai.
* Điểm số.
* Thời gian làm bài.
* Thời điểm nộp bài.
* Trạng thái chấm điểm.

Sinh viên phải có thể xem kết quả cá nhân.

Giảng viên phải có thể xem kết quả của sinh viên theo môn, theo đợt thi hoặc theo bài luyện tập.

### 1.9. Dashboard giảng viên

Hệ thống phải cung cấp dashboard để giảng viên theo dõi hoạt động luyện tập và thi thử của sinh viên.

Dashboard có thể hiển thị:

* Số lượng sinh viên tham gia.
* Kết quả trung bình theo môn.
* Kết quả từng đợt thi thử.
* Top sinh viên có điểm cao.
* Sinh viên có mức độ tham gia tốt.
* Sinh viên có sự tiến bộ rõ rệt.
* Chủ đề có tỷ lệ sai cao.
* Danh sách sinh viên tiềm năng.

### 1.10. Bảng xếp hạng

Hệ thống phải hỗ trợ bảng xếp hạng để tạo động lực luyện tập và duy trì phong trào Olympic.

Bảng xếp hạng có thể được tính theo:

* Môn thi.
* Đợt thi thử.
* Điểm luyện tập.
* Điểm thi thử.
* Số lần tham gia.
* Thành tích trong một khoảng thời gian nhất định.

Sinh viên có thể xem thứ hạng cá nhân và thứ hạng tổng quan nếu được hệ thống cho phép.

### 1.11. Theo dõi năng lực và phát hiện sinh viên tiềm năng

Hệ thống phải hỗ trợ tổng hợp dữ liệu luyện tập và thi thử để giúp giảng viên phát hiện sinh viên tiềm năng.

Các chỉ số có thể bao gồm:

* Số bài luyện tập đã hoàn thành.
* Số đợt thi thử đã tham gia.
* Điểm trung bình.
* Điểm cao nhất.
* Tỷ lệ đúng theo môn hoặc chủ đề.
* Mức độ ổn định qua các lần thi.
* Sự tiến bộ qua từng giai đoạn.
* Thứ hạng theo môn hoặc theo đợt thi.

### 1.12. Lộ trình định hướng theo môn thi

Hệ thống có thể hỗ trợ lộ trình định hướng cho từng môn thi Olympic.

Lộ trình có thể bao gồm:

* Danh sách chủ đề cần ôn tập.
* Tài liệu tham khảo nếu có.
* Bài luyện tập liên quan.
* Đề thi thử liên quan.

Tính năng này chỉ đóng vai trò gợi ý học tập, không bắt buộc phải theo dõi chi tiết việc sinh viên đã đọc hoặc hoàn thành từng tài liệu.

### 1.13. Công cụ tính GPA

Hệ thống có thể cung cấp công cụ giúp sinh viên mô phỏng GPA.

Sinh viên có thể nhập:

* Số tín chỉ đã hoàn thành.
* GPA hiện tại.
* Thang điểm.
* GPA mục tiêu.
* Số tín chỉ còn lại.

Hệ thống sẽ ước tính mức điểm trung bình cần đạt ở các học phần còn lại để đạt mục tiêu GPA.

Đây là tính năng mở rộng, không thuộc phạm vi cốt lõi của hệ thống Olympic.

### 1.14. Chatbot hỗ trợ sinh viên

Hệ thống có thể tích hợp chatbot để hỗ trợ sinh viên tra cứu thông tin nhanh.

Chatbot có thể trả lời dựa trên:

* Tin tức.
* Thông báo.
* FAQ.
* Tài liệu công khai.
* Quy định thi.
* Lịch ôn luyện.
* Lịch thi.

Tính năng này nên được phát triển sau khi hệ thống đã có dữ liệu ổn định và được kiểm duyệt.

### 1.15. Không gian vinh danh và chia sẻ kinh nghiệm

Hệ thống có thể có khu vực vinh danh các sinh viên từng đạt thành tích tốt trong các kỳ thi Olympic.

Khu vực này có thể bao gồm:

* Hồ sơ sinh viên nổi bật.
* Thành tích đạt được.
* Năm tham gia.
* Môn thi.
* Bài viết chia sẻ kinh nghiệm.
* Blog hoặc bài viết hướng dẫn ôn luyện.

## 2. Non-Functional Requirements

### 2.1. Hiệu năng

Hệ thống phải có thời gian phản hồi đủ nhanh để người dùng có trải nghiệm ổn định khi truy cập website, tìm kiếm tài liệu, làm bài luyện tập và xem kết quả.

Các yêu cầu đề xuất:

* Các trang public thông thường nên phản hồi trong khoảng 1 đến 2 giây trong điều kiện tải bình thường.
* Các API đọc dữ liệu phổ biến nên phản hồi dưới 1 giây trong điều kiện tải bình thường.
* Các thao tác tìm kiếm, lọc, phân trang cần được tối ưu để không bị chậm khi dữ liệu tăng.
* Các báo cáo, dashboard hoặc thống kê nặng có thể xử lý riêng, cache hoặc tính toán định kỳ.

### 2.2. Khả năng mở rộng

Hệ thống cần được thiết kế để có thể mở rộng thêm môn thi, tài liệu, câu hỏi, đề thi, sinh viên và giảng viên mà không phải thay đổi lớn kiến trúc.

Hệ thống nên hỗ trợ mở rộng theo các hướng:

* Thêm môn Olympic mới.
* Thêm dạng câu hỏi mới.
* Thêm cách tính điểm mới.
* Thêm loại bảng xếp hạng mới.
* Thêm tính năng chatbot, GPA, blog hoặc vinh danh sau này.

### 2.3. Bảo mật

Hệ thống phải bảo vệ tài khoản người dùng, dữ liệu sinh viên, kết quả thi và nội dung quản trị.

Các yêu cầu bảo mật bao gồm:

* Mật khẩu người dùng phải được mã hóa bằng thuật toán hash an toàn.
* Người dùng chỉ được truy cập chức năng phù hợp với vai trò của mình.
* API quản trị phải được bảo vệ bằng cơ chế xác thực và phân quyền.
* File upload phải được kiểm tra định dạng và giới hạn dung lượng.
* Dữ liệu đầu vào từ người dùng phải được validate để tránh lỗi bảo mật phổ biến.
* Không để lộ thông tin nhạy cảm trong log hoặc response.
* Các thao tác quan trọng nên có audit log.

### 2.4. Tính toàn vẹn dữ liệu

Hệ thống phải đảm bảo dữ liệu kết quả luyện tập, kết quả thi thử, bài làm và bảng điểm không bị sai lệch.

Các yêu cầu bao gồm:

* Không cho phép sinh viên sửa bài sau khi đã nộp, trừ khi hệ thống có cơ chế mở lại bài hợp lệ.
* Kết quả thi cần gắn với đúng sinh viên, đúng đề thi và đúng thời điểm nộp bài.
* Câu hỏi trong một bài thi đã diễn ra nên được giữ ổn định để tránh ảnh hưởng đến kết quả cũ.
* Các thay đổi quan trọng như sửa điểm, chấm lại bài hoặc xoá kết quả cần được ghi nhận.

### 2.5. Khả dụng và ổn định

Hệ thống cần vận hành ổn định trong các thời điểm có nhiều sinh viên truy cập, đặc biệt là khi có đợt thi thử hoặc thông báo quan trọng.

Các yêu cầu đề xuất:

* Website không bị lỗi toàn hệ thống khi một chức năng phụ gặp sự cố.
* Hệ thống cần có cơ chế xử lý lỗi rõ ràng.
* Cần có log để phục vụ kiểm tra và xử lý sự cố.
* Dữ liệu quan trọng cần được backup định kỳ.
* Các file tài liệu và bài nộp cần có cơ chế lưu trữ an toàn.

### 2.6. Dễ sử dụng

Giao diện hệ thống cần đơn giản, rõ ràng và phù hợp với sinh viên, giảng viên, quản trị viên.

Các yêu cầu bao gồm:

* Sinh viên dễ tìm tài liệu, làm bài luyện tập và xem kết quả.
* Giảng viên dễ tạo câu hỏi, tạo bài luyện tập, tạo đề thi và xem dashboard.
* Quản trị viên dễ quản lý user, phân quyền và nội dung.
* Các chức năng quan trọng cần có hướng dẫn hoặc mô tả ngắn.
* Giao diện cần hỗ trợ tốt trên desktop và mobile.

### 2.7. Khả năng bảo trì

Hệ thống cần được thiết kế để dễ sửa đổi, mở rộng và bảo trì trong tương lai.

Các yêu cầu bao gồm:

* Codebase cần có cấu trúc rõ ràng theo module hoặc domain.
* Business logic nên được tách khỏi tầng giao diện và tầng truy cập dữ liệu.
* Các chức năng lớn như exam, grading, leaderboard, analytics nên được tách biệt tương đối rõ.
* API cần có convention thống nhất.
* Cần có tài liệu setup, chạy local, deploy và mô tả kiến trúc.
* Các chức năng quan trọng cần có test ở mức phù hợp.

### 2.8. Khả năng tìm kiếm

Hệ thống cần hỗ trợ tìm kiếm tài liệu, tin tức, môn thi, câu hỏi hoặc đề thi một cách thuận tiện.

Các yêu cầu bao gồm:

* Có thể tìm kiếm theo từ khóa.
* Có thể lọc theo môn thi, chủ đề, danh mục hoặc loại nội dung.
* Kết quả tìm kiếm cần có phân trang.
* Dữ liệu lớn hơn có thể cần tối ưu bằng full-text search hoặc search engine riêng ở giai đoạn sau.

### 2.9. Khả năng audit và truy vết

Hệ thống cần ghi nhận các thao tác quan trọng để phục vụ quản trị, kiểm tra lỗi và đảm bảo minh bạch dữ liệu.

Các thao tác nên được ghi nhận bao gồm:

* Đăng nhập.
* Tạo, sửa, xoá tài liệu.
* Tạo, sửa, xoá câu hỏi.
* Tạo, sửa, xoá đề thi.
* Sinh viên nộp bài.
* Giảng viên chấm bài hoặc sửa điểm.
* Quản trị viên thay đổi quyền người dùng.

### 2.10. Khả năng triển khai

Hệ thống cần có khả năng triển khai ổn định trên môi trường server thực tế.

Các yêu cầu bao gồm:

* Có file cấu hình môi trường rõ ràng.
* Có hướng dẫn deploy.
* Có cơ chế migrate database.
* Có cơ chế backup dữ liệu.
* Có cấu hình reverse proxy nếu cần.
* Có thể chạy local để phát triển và kiểm thử.

