# Photobooth Queue Project Spec

Ứng dụng phục vụ một chi nhánh photobooth có khoảng 2-3 phòng. Hệ thống hỗ trợ quản trị, nhân viên và khách đăng ký hàng đợi theo từng phòng qua QR.

## Vai trò

### Quản trị

- Quản lý phòng và nhân viên.
- Xem dữ liệu khách đầy đủ.
- Gọi khách, xác nhận khách vào phòng, hoàn tất lượt.
- Hủy và sắp xếp hàng đợi.
- Xem lịch sử.
- Tạo, tải và in QR phòng.

### Nhân viên

- Đăng nhập bằng UID và PIN/mật khẩu.
- Chỉ xem phòng, đồng hồ, số người chờ và danh sách khách đã che dữ liệu.
- Không được mutation dữ liệu.

### Khách hàng

- Không cần tài khoản.
- Quét QR chung `/join` để chọn phòng hoặc quét QR riêng của phòng.
- Nhập tên và số điện thoại.
- Đăng ký, xem và hủy vé của chính mình.
- Xác nhận đã vào phòng khi được gọi.

## Trạng thái ticket

Enum trong database:

- `WAITING`: Đang chờ.
- `CALLED`: Đã gọi.
- `IN_SERVICE`: Đang sử dụng.
- `COMPLETED`: Hoàn thành.
- `CANCELLED`: Đã hủy.
- `NO_SHOW`: Không đến.

Luồng chính:

`WAITING -> CALLED -> IN_SERVICE -> COMPLETED`

## Quy tắc bảo mật

- Public và staff chỉ thấy tên và điện thoại đã che.
- Admin mới được xem dữ liệu khách đầy đủ.
- Customer chỉ quản lý ticket bằng access token bí mật.
- Không sử dụng số điện thoại làm token.
- Không gửi dữ liệu đầy đủ xuống client rồi mới che bằng CSS.
- Staff phải bị chặn mutation ở server.
- Mọi mutation phải validate ở server.
- Không đưa secret server-side vào client.
- Access token lưu bằng SHA-256 hash, không lưu plain text.
- Mật khẩu lưu bằng bcrypt hash, không lưu plain text.

## Timer

Chỉ lưu `serviceStartedAt` và `expectedEndAt`. UI tự tính thời gian còn lại từ hai mốc này và đồng hồ local. Không ghi database mỗi giây để chạy timer.

## Thông báo

Thông báo âm thanh, popup và rung chỉ hoạt động best-effort khi trang đang mở. Hệ thống không triển khai background Web Push, SMS, Zalo hoặc email notification.

## QR

- QR chung dẫn tới `/join`, nơi khách chỉ thấy các phòng đang `ACTIVE` và có thể nhận đăng ký.
- QR phòng dẫn trực tiếp tới `/rooms/[publicToken]`.
- URL QR lấy từ cấu hình server `APP_URL` hoặc `NEXT_PUBLIC_APP_URL`; production không được dùng localhost.
- QR không chứa access token, thông tin khách, QueueEvent payload hoặc dữ liệu nội bộ.

## Realtime và fallback

- Queue mutation cập nhật dữ liệu chính và tạo `QueueEvent`; client nhận event rồi refetch snapshot server.
- `QueueEvent` chỉ là tín hiệu invalidation, không phải dữ liệu UI.
- Trạng thái kết nối tối thiểu gồm `connecting`, `connected`, `syncing`, `degraded`, `offline`, `error`.
- Khi Realtime lỗi hoặc timeout, UI giữ snapshot cũ và bật polling fallback theo interval chung.
- Khi tab visible lại hoặc browser online lại, client refetch ngay và kiểm tra lại trạng thái đồng bộ.
- Staff dashboard ưu tiên vận hành nhiều phòng bằng card có trạng thái phòng, số khách chờ, vé đã gọi và timer.

## Lịch sử và múi giờ

Admin xem lịch sử đầy đủ tại `/admin/history`. Bộ lọc lịch sử chạy phía server/database và được phản ánh qua URL.

Timestamp trong database lưu UTC. UI và khái niệm "hôm nay" hiển thị theo `Asia/Ho_Chi_Minh`. Duration sử dụng phòng chỉ được tính khi có `serviceStartedAt` và `checkoutAt`, không dùng thời gian đăng ký hay thời gian chờ để thay thế.

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
- Analytics.
- Export Excel/CSV.
