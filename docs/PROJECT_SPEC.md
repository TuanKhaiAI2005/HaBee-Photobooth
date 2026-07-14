# Photobooth Queue Project Spec

Ứng dụng phục vụ một chi nhánh photobooth có khoảng 2-3 phòng. Hệ thống hỗ trợ admin, nhân viên và khách đăng ký hàng đợi theo từng phòng qua QR.

## Vai trò

### Admin

- Quản lý phòng và nhân viên.
- Xem dữ liệu khách đầy đủ.
- Gọi khách, xác nhận vào phòng, checkout.
- Hủy và sắp xếp hàng đợi.
- Xem lịch sử.
- Tạo và in QR phòng.

### Staff

- Đăng nhập bằng UID và PIN/password.
- Chỉ xem phòng, timer, số người chờ và danh sách đã che.
- Không được mutation dữ liệu.

### Customer

- Không cần tài khoản.
- Quét QR phòng.
- Nhập tên và số điện thoại.
- Đăng ký, xem và hủy vé của chính mình.
- Xác nhận đã vào phòng khi được gọi.

## Trạng thái ticket

- `WAITING`
- `CALLED`
- `IN_SERVICE`
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`

Luồng chính:

`WAITING -> CALLED -> IN_SERVICE -> COMPLETED`

## Quy tắc bảo mật

- Public và staff chỉ thấy tên và điện thoại đã che.
- Admin mới được xem đầy đủ.
- Customer chỉ quản lý ticket bằng access token bí mật.
- Không sử dụng số điện thoại làm token.
- Không gửi dữ liệu đầy đủ xuống client rồi mới che bằng CSS.
- Staff phải bị chặn mutation ở server.
- Mọi mutation phải validate ở server.
- Không đưa secret vào client.

## Timer

Chỉ lưu `serviceStartedAt` và `expectedEndAt`. UI tự tính thời gian còn lại từ hai mốc này và đồng hồ local. Không ghi database mỗi giây để chạy timer.

## Thông báo MVP

MVP chỉ bảo đảm âm thanh, popup và rung best-effort khi trang đang mở. Background Web Push không thuộc MVP.

## Ngoài phạm vi

- Thanh toán.
- SMS.
- Zalo.
- Native mobile app.
- Camera.
- Nhiều chi nhánh.
- Đặt lịch.
- Chuyển ticket trực tiếp giữa phòng.
- Background push khi đóng trình duyệt.
