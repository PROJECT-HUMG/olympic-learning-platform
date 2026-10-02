# Giao diện chung

Màn học tập và quản lý dùng cùng hệ giao diện, phù hợp với nền tảng Olympic và giữ màu/font hiện có. Profile là màn tham chiếu cho bố cục thông tin và form.

## Màu và chữ

| Vai trò | Sáng | Tối |
| --- | --- | --- |
| Nền | `#f0f6f8` | `#002b42` |
| Bề mặt | `#ffffff` | `#11364a` |
| Chữ | `#102d42` | `#f1f7fa` |
| Thao tác | `#00387b` | `#97cde6` |
| Chữ phụ | `#526b7a` | `#adc3cf` |
| Đường phân cách | `#cddce3` | `#35586b` |

Dùng `--font-sans` cho các màn chức năng; tiêu đề trang 28–36px/600, tiêu đề vùng 16px/600, nội dung 14px với line-height 1.7–1.8. Chữ căn trái, mô tả giới hạn khoảng 65 ký tự một dòng. Trang chủ vẫn có cảnh và chữ riêng cho phần giới thiệu.

## Bố cục

`PageHeader` dùng chung tiêu đề, mô tả, hành động và đường phân cách. `PageSection` nhóm một nhiệm vụ cùng tiêu đề và nội dung; không lồng nhiều card chỉ để trang trí. `.page-shell` thống nhất chiều rộng 72rem và khoảng cách 32px; bản public có gutter riêng. Nút thao tác mặc định cao 44px, nút nhỏ 36px, input thường 44px. Giữ button nhỏ riêng cho bảng, icon và thành phần chuyên dụng.

Profile desktop có khối nhận diện 280px và vùng chỉnh sửa co giãn; mobile xếp một cột và thu gọn avatar bên cạnh tên để form xuất hiện sớm hơn. Avatar và tên tài khoản là điểm nhấn, các thông tin còn lại dùng hàng trong danh sách, không chia thành bốn thẻ nhỏ.

```text
Tiêu đề trang                                      Thao tác
──────────────────────────────────────────────────────────
Ảnh + tên + vai trò       Thông tin cá nhân
Chọn / lưu / hủy ảnh      Tên hiển thị, email, username
Hướng dẫn dung lượng     Lưu thay đổi
                         Bảo mật tài khoản
                         Email, đổi mật khẩu
```

Màn dashboard, quản lý tài liệu/bài viết/người dùng/danh mục/câu hỏi và các trang hướng dẫn dùng cùng nhịp tiêu đề/vùng nội dung. Danh mục môn, bảng tin và toolkit dùng cùng tiêu đề trang, màu và các điều khiển. Phòng học giữ cảnh 2D và animation theo nhịp vì đó là nội dung tương tác, đồng thời dùng các token chung.

## Nguyên tắc áp dụng

Ưu tiên nhận diện thật và các thao tác đã có; không thêm số liệu hoạt động, ngày đổi mật khẩu hoặc tính năng chưa có API. Border chia nhiệm vụ; không thêm gradient, shadow và icon trang trí trước mọi tiêu đề. Mobile, tên/email dài, bàn phím, theme và giảm chuyển động phải hoạt động. Các thay đổi về bố cục giữ query, phân trang, quyền và contract API hiện có. Ô nhập với nhãn nổi giữ chiều cao 52px để đủ chỗ cho notch và chữ; không ép về 44px như input thường. Trang chi tiết bài viết giới hạn chiều rộng phần đọc thay vì kéo văn bản dài hết chiều ngang.

Khi thêm màn mới, dùng lại `PageHeader`/`PageSection`, tokens và UI primitives. Không tự khai báo lại font/size tiêu đề hoặc tạo bảng màu riêng cho màn chức năng.

## Trang chủ

Giữ màu/font trong bảng token phía trên: Noto Serif cho lời mở đầu, Be Vietnam Pro cho tìm kiếm, tiện ích và bảng tin. Bố cục trái gồm lời chào/tìm tài liệu và các lối vào phòng học, GPA; cảnh anime ở phải, xuống dưới là bàn học rồi bảng tin. Trên mobile, giữ cảnh nhỏ và những thao tác trực tiếp.

Ánh sáng xanh chỉ ở hero, opacity thấp, trôi chậm bằng transform; có nút Nền động cạnh sáng/tối, nhớ lựa chọn. Mặc định động trên mọi kích thước, gồm iPhone; trang chủ dùng lựa chọn bật/tắt thủ công, kể cả khi thiết bị bật Giảm chuyển động. Không thêm hạt bay, canvas hoặc video mới. Hiệu ứng dừng khi hero khuất/tab ẩn; phần đọc tin không có nền chuyển động.

Rà soát hướng thiết kế: tránh thêm bộ card tiện ích thứ hai vì bàn học đã chứa chúng; đưa hai liên kết gọn ngay dưới tìm kiếm. Thẻ không có thumbnail giữ nội dung và không tạo khung ảnh rỗng; giảm khoảng trống trước bảng tin. Footer mobile dùng các nhóm mở/thu, giữ đủ liên kết và thông tin liên hệ.

### Nav và phân vùng trang chủ

Theo yêu cầu mới, cảnh/ánh sáng trang chủ bỏ tự tắt theo thiết bị; nút Nền động vẫn tắt toàn bộ nền. Các màn khác giữ quy tắc giảm chuyển động. Dùng lại màu nền #f0f6f8/#002b42, bề mặt #ffffff/#11364a, primary #00387b/#97cde6 và font Noto Serif/Be Vietnam Pro.

Nav desktop có đủ Trang chủ/Môn học/Tài liệu/Bảng tin/Tiện ích, chọn mục bằng nền accent thay vì vạch tính theo chỉ số. Logo trái, menu giữa, nhóm giao diện/tài khoản phải; CTA rút thành Góc học tập/Quản lý/Đăng nhập. Mobile đưa tùy chọn hiển thị vào Menu mở từ dưới lên, cùng điều hướng chia nhóm và giữ route/quyền.

Trang chủ chia ba vùng theo nhiệm vụ: lời chào/tìm tài liệu + cảnh; Bàn học của bạn có tiêu đề/mô tả riêng và nền bề mặt nhẹ; Bảng tin mới nhất trên nền trang. Dùng chiều rộng/gutter thống nhất, đường phân cách và khoảng cách để chỉ ranh giới. Không đánh số các phần vì đây không phải quy trình, không thêm card tiện ích trùng nội dung.

~~~text
Logo          Trang chủ  Môn học  Tài liệu  Bảng tin  Tiện ích          Tài khoản
Lời chào + tìm tài liệu                                      Cảnh anime
──────────────────────────────────────────────────────────────────────
Bàn học của bạn
Tài liệu / Thông báo / Tiện ích
──────────────────────────────────────────────────────────────────────
Bảng tin mới nhất                                            Xem bảng tin
Các bài viết
~~~

Rà soát kế hoạch: giữ cảnh anime là điểm nhấn; tăng phân cấp bằng vùng nội dung và tiêu đề, không thêm hiệu ứng xuất hiện cho từng khối hay dãy card giống nhau. Nút hiển thị mobile gom lại vì hai tùy chọn được đổi ít hơn thao tác điều hướng.

Rà soát ảnh sau triển khai: mobile dùng logo đã căn bỏ khoảng trắng và hai nút khi đăng nhập (tài khoản, Menu); tiêu đề Bàn học và vùng nền riêng tạo ranh giới rõ trong cả hai theme. Giảm chiều cao tối thiểu bàn học mobile để tránh khoảng trắng khi chỉ có ít tài liệu. Menu điều hướng/hiển thị dùng lại primitives và token, không thêm blur hoặc chuyển động vào thanh nav.

### Nền chuyển động, menu mobile và thẻ tin

Theo phản hồi tiếp theo, chuyển động nền cần nhìn thấy rõ hơn: hai vùng ánh sáng xanh và các đường cong mảnh trôi chậm phía sau hero. Vẫn một màu primary #00387b/#97cde6, nền #f0f6f8/#002b42, thẻ #ffffff/#11364a; Noto Serif cho lời chào và Be Vietnam Pro cho điều khiển/tin. Không thêm video, canvas hoặc ảnh mới. Nút Nền động điều khiển và nhớ lựa chọn, dừng hiệu ứng khi khuất/tab ẩn.

Mobile dùng thanh nổi gọn: logo trái, avatar 44px và nút Menu phải. Tùy chọn sáng/tối/nền động đưa vào panel mở từ dưới lên, giữ điều hướng theo nhóm và quyền, focus/Escape/đích đăng nhập. Avatar public có cùng đường kính với các nút hiển thị desktop; các chỗ dùng UserDropdown khác giữ kích thước hiện có.

Trang chủ có ba thẻ tin trên desktop, xếp một cột trên mobile, ảnh nhỏ tùy chọn và cùng bề mặt/border. Loại bài dùng nhãn trung tính chung; phân biệt Blog/Tin tức/Thông báo bằng chữ. Feed bảng tin dùng thẻ cùng ngôn ngữ thị giác, ảnh lỗi bỏ ảnh và không tạo khung rỗng, giữ URL bộ lọc và đường quay lại.

~~~text
Logo                                                   Avatar  Menu
                                  Panel từ dưới:
                                  Hiển thị   [Tối] [Nền động]
                                  Học tập / Thông tin / Cá nhân

Bảng tin mới nhất
Thẻ bài viết               Thẻ bài viết               Thẻ bài viết
Nhãn + ngày                Nhãn + ngày                Nhãn + ngày
Tiêu đề, tóm tắt            Tiêu đề + ảnh nhỏ           Tiêu đề, tóm tắt
~~~

Rà soát kế hoạch: thanh mobile giảm còn hai thao tác thay vì thêm nút; panel có một vùng cuộn để dùng được ở màn thấp. Thẻ tin phục vụ nội dung bài viết theo yêu cầu, không mở rộng thành bộ card ở các vùng khác. Nền chuyển động có độ tương phản thấp và nằm dưới nội dung; bỏ dấu chấm màu theo từng loại bài để giảm nhiễu.

Rà soát ảnh triển khai: avatar cùng đường kính với nút, header mobile còn avatar/Menu và không có nút tùy chọn đứng riêng. Thẻ tin sáng/tối đã thống nhất nhãn, title/summary/ảnh nhỏ và khoảng cách. Làm nền ánh sáng tan nhẹ ở mép bằng mask để không tạo cảm giác một khung bo tròn khổng lồ phía sau hero; nav giữ một đường focus rõ thay vì chồng ring và outline.

### Khung ảnh đại diện

Avatar trên nav tiếp tục là vòng tròn 44px, ảnh lấp đầy khung để nhận diện rõ. Bỏ phần đệm giữ nguyên ảnh vì làm chủ thể quá nhỏ. Khi chọn ảnh trong hồ sơ, mở hộp thoại có khung tròn, kéo vị trí, thanh Độ phóng và Đặt lại; dùng ảnh đã chọn khung rồi mới bấm Lưu ảnh mới. Có thao tác bằng bàn phím và cảm ứng. Giữ nguyên ảnh gốc, gửi riêng vị trí/độ phóng khung tới backend; API trả avatarCrop để các nơi hiển thị cùng khung. Chỉnh khung ảnh đã lưu không upload lại.

Giữ nền #f0f6f8/#002b42, bề mặt #ffffff/#11364a và primary #00387b/#97cde6; toàn bộ hộp thoại dùng Be Vietnam Pro với tiêu đề/control cùng quy chuẩn hồ sơ. Khung ảnh căn giữa, lời hướng dẫn và nhãn căn trái, hành động cuối hộp thoại. Khung có lớp che bên ngoài hình tròn để người dùng thấy đúng phần xuất hiện trên nav; không thêm màu trang trí hay animation.

~~~text
Chỉnh ảnh đại diện                                   Đóng
Kéo ảnh để chọn phần bạn muốn hiển thị.
                 (khung tròn)
Độ phóng                                      1.0×
[───────────────────────────────────────────────]
Đặt lại
                              Hủy   Dùng ảnh này
~~~

Rà soát kế hoạch: trọng tâm là chọn chủ thể, không cố nhét cả ảnh vào icon. Giữ bước xem trước/hủy trước upload để không đổi ảnh tài khoản ngoài ý muốn. Chỉ upload ảnh gốc và metadata khi xác nhận Lưu ảnh mới; không thêm thư viện crop hoặc tự nhận diện khuôn mặt. Bản xem trước và chỉnh khung đều dùng ảnh gốc.

Rà soát ảnh triển khai ở 390px sáng và 1440px tối: phần bị che ngoài hình tròn giúp thấy chính xác chủ thể sẽ xuất hiện, giữ font/màu/nút cùng hồ sơ và không thu nhỏ avatar nav. Đặt lại căn trái, khung ảnh căn giữa. Rà soát thêm 320×360px phát hiện grid của hộp thoại có thể ép hàng làm khung che nút; đổi riêng hộp thoại này sang flex với các phần không co, nội dung cuộn đúng và các nút được kiểm tra bấm lại trên Chromium/WebKit.
