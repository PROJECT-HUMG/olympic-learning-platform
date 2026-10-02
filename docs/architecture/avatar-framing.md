# Khung ảnh đại diện

File ảnh gốc được upload và giữ nguyên trong storage. Chọn khung chỉ lưu metadata riêng trên user; frontend dùng cùng metadata để hiển thị avatar ở nav, hồ sơ, người dùng/tác giả và phòng học. Không tạo hoặc upload bản ảnh đã cắt.

## Contract

- `PUT /api/v1/users/me/avatar`: multipart có `avatar` là file gốc JPG/PNG/WebP tối đa 5 MB; `crop` là part JSON (`application/json`), tùy chọn để tương thích client cũ.
- `PATCH /api/v1/users/me/avatar/crop`: body JSON `{ "x": 0.5, "y": 0.5, "zoom": 1 }`. Chỉ cập nhật metadata, giữ file và URL hiện tại, không gọi upload/delete storage.
- Hai thao tác đều trả profile gồm `avatarUrl` và `avatarCrop`. `avatarCrop` cũng xuất hiện trong `/users/me`, profile công khai, login/current user, admin users và member của snapshot phòng học.
- `DELETE /api/v1/users/me/avatar` xóa ảnh và metadata, trở về ảnh mặc định.

`x`, `y` là tỉ lệ căn ảnh theo phần dư: 0 là trái/trên, 0.5 giữa, 1 phải/dưới; không phải tọa độ pixel. `zoom` từ 1 đến 3, lấy mức cover vừa khung làm cơ sở. Backend từ chối thiếu trường, giá trị ngoài khoảng và số không hữu hạn. Các route chỉ thao tác trên tài khoản đã xác thực hiện tại.

```json
{
  "avatarUrl": "https://images.example/original.jpg",
  "avatarCrop": { "x": 0.2, "y": 0.8, "zoom": 1.5 }
}
```

Frontend đặt ảnh trong vùng tròn có overflow hidden, `object-fit: cover`, `object-position: x*100% y*100%`, `transform: scale(zoom)` và `transform-origin` bằng `object-position`. Cùng một khung dùng được ở mọi kích thước icon. Bộ chỉnh khung đổi ngược vị trí/độ phóng sang vùng kéo, nên mở lại vẫn đúng phần đã lưu; người dùng có thể đặt lại và chọn vùng khác từ ảnh gốc. Thanh phóng giữ tâm vùng ảnh đã chọn trong giới hạn biên ảnh.

## Lưu trữ và tương thích

Flyway V12 thêm ba cột nullable `avatar_crop_x`, `avatar_crop_y`, `avatar_crop_zoom` và CHECK cho cả bộ thông số. Không đổi ảnh hay backfill vùng chọn của dữ liệu cũ. `avatarCrop: null` hoặc thiếu trường dùng cover ở giữa, zoom 1. Upload từ client cũ không có part crop cũng dùng mặc định này.

Chạy API có V12 trước frontend dùng contract mới. Vị trí/độ phóng được lưu ở backend; bản xem trước chỉ ở client cho tới khi bấm Lưu ảnh mới/Lưu khung ảnh. Hủy hoặc lỗi lưu giữ ảnh đã lưu trước đó. Lưu/xóa ảnh hoặc khung cập nhật current user và invalidate cache posts/documents/admin users/study room để các nơi hiển thị lấy lại avatar. Chỉnh khung hiện tại không cần tải ảnh về bằng fetch hay xử lý canvas, nên vẫn dùng được URL ảnh từ storage khác origin.

Rollback frontend có thể bỏ qua trường mới và dùng avatar ở giữa. Giữ V12 đã áp dụng; không sửa migration hoặc xóa metadata chỉ để quay lại giao diện cũ.
