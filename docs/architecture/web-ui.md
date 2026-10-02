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

Ánh sáng xanh chỉ ở hero, opacity thấp, trôi chậm bằng transform; có nút Nền động cạnh sáng/tối, nhớ lựa chọn. Mặc định động trên mọi kích thước, gồm iPhone; giảm chuyển động giữ ảnh tĩnh. Không thêm hạt bay, canvas hoặc video mới. Hiệu ứng dừng khi hero khuất/tab ẩn; phần đọc tin không có nền chuyển động.

Rà soát hướng thiết kế: tránh thêm bộ card tiện ích thứ hai vì bàn học đã chứa chúng; đưa hai liên kết gọn ngay dưới tìm kiếm. Thay thumbnail rỗng bằng bài dạng văn bản và giảm khoảng trống trước bảng tin. Footer mobile dùng các nhóm mở/thu, giữ đủ liên kết và thông tin liên hệ.
