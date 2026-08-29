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
- Xem phòng, đồng hồ, số người chờ và danh sách khách với tên đầy đủ, số điện thoại đã che.
- Được vận hành queue: gọi khách, xác nhận bắt đầu/hoàn tất lượt, hủy, đánh dấu vắng mặt và sắp xếp vé.
- Không được gọi mutation quản trị phòng, tài khoản nhân viên hoặc lịch sử.

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

## STT theo phòng và ngày

- Mỗi ticket mới được cấp một `queueNumber` bất biến trong khoảng 1-50.
- Bộ số được tính độc lập theo `Room + businessDate`; cùng một ngày, Phòng 1, Phòng 2 và Phòng 3 đều có thể có STT 1.
- `businessDate` là ngày lịch tại `Asia/Ho_Chi_Minh`, không lấy trực tiếp phần ngày UTC. Mốc đổi ngày là 00:00 giờ Việt Nam, tương ứng 17:00 UTC của ngày trước.
- Sang `businessDate` mới, mỗi phòng bắt đầu lại từ STT 1 theo key mới; không có cron job reset hoặc cập nhật hàng loạt ticket cũ.
- `QueueNumberCounter` giữ số cuối đã cấp theo khóa `roomId + businessDate`. Việc tăng counter và tạo ticket nằm trong cùng transaction; câu lệnh atomic chỉ tăng khi số hiện tại nhỏ hơn 50.
- Database bảo vệ tính đúng bằng primary key của counter, unique constraint `roomId + businessDate + queueNumber`, và check constraint giới hạn STT 1-50.
- Khi một phòng đã cấp đủ STT 50 trong ngày, đăng ký tiếp theo của phòng đó bị từ chối bằng thông báo rõ ràng; phòng khác không bị ảnh hưởng.
- STT không đổi và không được tái sử dụng sau khi ticket bị hủy, hoàn tất, đánh dấu vắng, sắp xếp lại hoặc bị xóa khỏi lịch sử. `queuePosition` là thứ tự vận hành riêng và vẫn có thể thay đổi khi reorder.
- Các ticket cũ có `queueNumber` và `businessDate` nullable. UI hiển thị `STT —` thay vì suy đoán hoặc backfill dữ liệu không đáng tin cậy; mọi đăng ký mới phải có đủ cả hai giá trị.
- Tại các màn hình liên quan, STT được hiển thị nổi bật cạnh khách. Nhãn phòng dùng hình tròn cho Phòng 1, trái tim cho Phòng 2 và hình vuông cho Phòng 3; icon có cùng kích thước và không làm vỡ layout mobile.

## Quy tắc bảo mật

- Public chỉ thấy tên và điện thoại đã che.
- Staff được xem tên khách đầy đủ nhưng chỉ thấy số điện thoại đã che.
- Admin được xem dữ liệu khách đầy đủ.
- Customer chỉ quản lý ticket bằng access token bí mật.
- Không sử dụng số điện thoại làm token.
- Không gửi dữ liệu đầy đủ xuống client rồi mới che bằng CSS.
- Staff chỉ được gọi queue mutation đã validate; mọi mutation quản trị phòng, tài khoản nhân viên và lịch sử phải bị chặn ở server.
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
- `Account`, `Room`, `QueueTicket`, `QueueNumberCounter` và `_prisma_migrations` chỉ được truy cập qua Next.js/Prisma phía server.
- Supabase browser client chỉ dùng `QueueEvent` cho Realtime và chỉ có quyền `SELECT`; không có quyền ghi trực tiếp bất kỳ bảng nghiệp vụ nào.
- Trạng thái kết nối tối thiểu gồm `connecting`, `connected`, `syncing`, `degraded`, `offline`, `error`.
- Khi Realtime lỗi hoặc timeout, UI giữ snapshot cũ và bật polling fallback theo interval chung.
- Khi tab visible lại hoặc browser online lại, client refetch ngay và kiểm tra lại trạng thái đồng bộ.
- Staff dashboard ưu tiên vận hành nhiều phòng bằng card có trạng thái phòng, số khách chờ, vé đã gọi và timer.

## Lịch sử và múi giờ

Admin xem lịch sử đầy đủ tại `/admin/history`. Bộ lọc lịch sử chạy phía server/database và được phản ánh qua URL.

Timestamp trong database lưu UTC. UI và khái niệm "hôm nay" hiển thị theo `Asia/Ho_Chi_Minh`; `businessDate` của STT cũng dùng chính timezone này. Duration sử dụng phòng chỉ được tính khi có `serviceStartedAt` và `checkoutAt`, không dùng thời gian đăng ký hay thời gian chờ để thay thế.

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
