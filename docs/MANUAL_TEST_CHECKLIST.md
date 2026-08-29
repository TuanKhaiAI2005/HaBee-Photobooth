# Manual Test Checklist

Chạy checklist này trên môi trường local hoặc staging sau khi đã migrate và seed.

## Chuẩn bị

- [ ] `.env.local` có `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, Supabase URL và anon key.
- [ ] `npx prisma validate` chạy thành công.
- [ ] `npx prisma migrate deploy` chạy thành công.
- [ ] `npx prisma db seed` tạo admin.
- [ ] Supabase Realtime bật cho bảng `QueueEvent`.

## Smoke Test

- [ ] Admin đăng nhập tại `/admin/login`.
- [ ] Admin tạo phòng mới tại `/admin/rooms`.
- [ ] Admin tạo nhân viên tại `/admin/staff`.
- [ ] Nhân viên đăng nhập tại `/staff/login`.
- [ ] Nhân viên gọi khách, bắt đầu/hoàn tất lượt, hủy, đánh dấu vắng mặt và sắp xếp queue với tên khách đầy đủ, số điện thoại đã che.
- [ ] Admin mở trang QR phòng tại `/admin/rooms/[roomId]`.
- [ ] Khách mở link QR `/rooms/[publicToken]`.
- [ ] Khách đăng ký vé bằng tên và số điện thoại.
- [ ] Ticket mới hiển thị STT rõ ràng và STT không đổi sau các thao tác vận hành queue.
- [ ] Public room chỉ hiển thị tên/SĐT đã che.
- [ ] Staff thấy tên khách đầy đủ nhưng chỉ thấy SĐT đã che.
- [ ] Admin thấy tên/SĐT đầy đủ trong trang vận hành.
- [ ] Admin gọi khách tiếp theo.
- [ ] Trang ticket của khách hiển thị “Đã tới lượt của bạn”.
- [ ] Khách bấm “Tôi đã vào phòng”.
- [ ] Timer hiển thị và đếm dựa trên mốc server.
- [ ] Admin hoàn tất lượt.
- [ ] Nếu còn khách chờ, khách tiếp theo được gọi tự động.
- [ ] `/admin/history` ghi đúng lịch sử, duration và timezone Việt Nam.
- [ ] Khách tự hủy ticket đang chờ hoặc đã gọi.
- [ ] Admin sắp xếp vé đang chờ lên/xuống.

## STT, giới hạn và icon phòng

### Case 1 - Cùng phòng

- [ ] Đăng ký ba khách vào Phòng 1 và xác nhận STT lần lượt là 1, 2, 3.

### Case 2 - Khác phòng

- [ ] Đăng ký lần lượt vào Phòng 1, Phòng 2, Phòng 3 và Phòng 1; xác nhận STT là 1, 1, 1, 2.
- [ ] Xác nhận bộ đếm của mỗi phòng độc lập, đăng ký ở một phòng không làm tăng STT của phòng khác.

### Case 3 - Reset ngày Việt Nam

- [ ] Trước 00:00 `Asia/Ho_Chi_Minh`, cấp một số cho Phòng 1; sau 00:00, ticket đầu tiên của ngày mới nhận STT 1.
- [ ] Kiểm tra biên 16:59:59.999 UTC và 17:00:00 UTC để bảo đảm `businessDate` đổi đúng theo giờ Việt Nam, không theo ngày UTC.

### Case 4 - Giới hạn 50

- [ ] Sau khi Phòng 1 đã cấp STT 50, đăng ký tiếp theo bị từ chối bằng thông báo `Phòng 1 đã đủ 50 lượt trong ngày hôm nay.` và không tạo STT 51.
- [ ] Trong cùng thời điểm, Phòng 2 và Phòng 3 vẫn nhận đăng ký bình thường.

### Case 5 - Đăng ký đồng thời

- [ ] Gửi nhiều đăng ký gần như đồng thời vào cùng một phòng và xác nhận các STT trả về là duy nhất, liên tục, không có duplicate.
- [ ] Chạy đồng thời qua biên giới hạn và xác nhận tối đa 50 request thành công; các request còn lại nhận lỗi hết lượt, không có số lớn hơn 50.
- [ ] Truy vấn database để xác nhận unique `roomId + businessDate + queueNumber` và counter cuối cùng khớp số lớn nhất đã cấp.

### Case 6 - Không tái sử dụng

- [ ] Sau khi đã cấp STT 1-10, hủy ticket STT 10 rồi đăng ký khách mới; khách mới nhận STT 11.
- [ ] Chuyển ticket STT 10 sang trạng thái kết thúc, xóa dòng lịch sử rồi đăng ký khách mới; khách mới vẫn nhận STT 11.
- [ ] Sắp xếp ticket lên/xuống chỉ đổi `queuePosition`, không đổi `queueNumber`.

### Case 7 - Dữ liệu cũ

- [ ] Record có `queueNumber = NULL` và `businessDate = NULL` vẫn mở được ở public, ticket, staff, admin và history mà không có runtime/console error.
- [ ] UI hiển thị `STT —` cho record cũ và không tự gán một số giả.
- [ ] Sau migration, mọi registration mới đều có `businessDate` và STT hợp lệ 1-50.

### Case 8 - Icon và responsive

- [ ] Tất cả vị trí hiển thị Phòng 1 dùng icon hình tròn, Phòng 2 dùng trái tim và Phòng 3 dùng hình vuông.
- [ ] Kiểm tra `/join`, `/rooms`, `/rooms/[publicToken]`, `/ticket/[accessToken]`, staff dashboard/detail, admin rooms/detail/queue/history và trang in liên quan.
- [ ] Kiểm tra tối thiểu ở viewport 375x812, 768x1024 và 1440x900; icon/STT căn đúng, không bị cắt, chồng chữ hoặc tạo horizontal overflow.
- [ ] Kiểm tra keyboard/accessibility cơ bản và browser console không có error hoặc hydration warning.

## Security Review

- [ ] Public route không trả tên/SĐT đầy đủ của vé khác.
- [ ] Staff route trả tên khách đầy đủ nhưng không trả SĐT đầy đủ.
- [ ] Staff gọi được queue mutation nhưng không gọi được mutation quản trị phòng, tài khoản nhân viên hoặc lịch sử.
- [ ] `Account`, `Room`, `QueueTicket`, `QueueNumberCounter`, `_prisma_migrations` không có privilege hiệu lực cho `anon`/`authenticated`.
- [ ] `QueueEvent` chỉ có `SELECT` cho `anon`/`authenticated`; không có quyền ghi, truncate, trigger hoặc references.
- [ ] Customer không hủy được ticket người khác nếu không có access token đúng.
- [ ] Access token không lưu plain text, chỉ lưu `customerAccessTokenHash`.
- [ ] Password không lưu plain text, chỉ lưu `passwordHash`.
- [ ] Không có secret trong client bundle ngoài biến `NEXT_PUBLIC_*` được phép public.
- [ ] Không commit `.env` hoặc secret production.
- [ ] Tất cả mutation dùng Zod/server-side validation.
- [ ] Endpoint QR/admin mutation có authentication phù hợp.
- [ ] Không có hai vé `IN_SERVICE` cùng một phòng.
- [ ] Không có active ticket trùng số điện thoại theo constraint database.
- [ ] Không có hai ticket cùng `roomId + businessDate + queueNumber`; database từ chối STT ngoài khoảng 1-50 hoặc ticket chỉ có một trong hai field STT/ngày.

## Kết quả

Ghi lại môi trường, commit/phiên bản, người test, ngày test và lỗi còn lại nếu có.
