# Roadmap

## Sprint 1: Database, authentication và phân quyền - Hoàn thành

- Prisma schema có `Account`, `Room`, `QueueTicket`, `QueueEvent`.
- Seed admin đọc từ `SEED_ADMIN_USERNAME` và `SEED_ADMIN_PASSWORD`.
- Auth.js Credentials hỗ trợ quản trị đăng nhập bằng tên đăng nhập/mật khẩu và nhân viên đăng nhập bằng UID/PIN.
- Route `/admin` và `/staff` được bảo vệ bằng server-side role guard.
- Helper `getCurrentAccount()`, `requireAdmin()`, `requireStaffOrAdmin()` đã sẵn sàng.

## Sprint 2: Admin quản lý phòng và nhân viên - Hoàn thành

- Admin xem, thêm, sửa và tạm dừng phòng tại `/admin/rooms`.
- Admin xem, tạo, reset PIN/mật khẩu, khóa/mở khóa nhân viên tại `/admin/staff`.
- Public token phòng được tạo ổn định và không đổi khi sửa tên.
- Mutation dùng server actions, `requireAdmin()` và Zod validation.
- Staff gọi mutation admin trực tiếp bị chặn bởi server-side role guard.

## Sprint 3: Public rooms, QR và đăng ký hàng đợi - Hoàn thành

- Public route `/rooms` và `/rooms/[publicToken]` cho phòng đang hoạt động/tạm dừng.
- Khách đăng ký hàng đợi bằng tên và số điện thoại đã normalize.
- Access token bí mật chỉ trả qua redirect, database chỉ lưu SHA-256 hash.
- View `/ticket/[accessToken]` dùng `no-store`, `noindex`, `nofollow`.
- Khách hủy vé của chính mình bằng access token, không truyền ticket id.
- QueueEvent được tạo khi đăng ký và khi khách hủy.
- Thời gian chờ ước tính theo số ticket active phía trước và duration phòng.
- Admin xem/tải/in QR tại `/admin/rooms/[roomId]`.
- Constraint database chặn duplicate active phone và duplicate queue position.

## Sprint 4: Vận hành hàng đợi, timer và Realtime - Hoàn thành

- Admin gọi khách, xác nhận vào phòng, hoàn tất lượt, hủy và sắp xếp hàng đợi.
- Timer dựa trên `serviceStartedAt` và `expectedEndAt`, không ghi database mỗi giây.
- Supabase Realtime dùng `QueueEvent` làm tín hiệu để refetch.

## Sprint 5: Lịch sử, thông báo và hoàn thiện UI - Hoàn thành

- Route `/admin/history` chỉ dành cho admin, có filter URL, pagination và query server-side.
- Lịch sử hiển thị dữ liệu đầy đủ cho admin, duration thực tế dựa trên `serviceStartedAt` + `checkoutAt`.
- Admin room detail hiển thị số khách đã hoàn thành trong hôm nay và lịch sử hôm nay của phòng.
- Thời gian UI hiển thị theo `Asia/Ho_Chi_Minh`; database vẫn lưu UTC.
- Admin và customer notification hoạt động best-effort khi trang đang mở, dựa trên dữ liệu đã refetch từ server.
- Notification chống lặp bằng cặp `ticketId + calledAt`.
- Âm thanh tuân thủ autoplay policy; vibration có feature detection.
- Không triển khai background Web Push, service worker push, SMS hay email.

## Sprint 6: Kiểm thử, bảo mật, deploy và bàn giao - Hoàn thành

- Đã rà soát route, server actions, schema, migrations và các luồng PII chính.
- UI hiển thị trạng thái/phòng/tác vụ bằng tiếng Việt cho admin, nhân viên và khách hàng.
- README, deployment guide, manual test checklist và known limitations đã được cập nhật.
- Verification local đã chạy: Prisma validate, lint, typecheck, unit tests, production build.
- Không tự deploy và không commit vì cần credential/quyền production của người dùng.

## Sprint 7: Realtime reliability, QR chung và vận hành - Hoàn thành

- QR chung dùng route `/join`, tái sử dụng trang chọn phòng hiện có và dẫn tiếp sang flow đăng ký `/rooms/[publicToken]`.
- QR riêng từng phòng tiếp tục dùng public token ổn định tại `/rooms/[publicToken]`; QR không chứa access token hay dữ liệu khách.
- URL QR lấy từ `APP_URL` hoặc `NEXT_PUBLIC_APP_URL`; production không âm thầm tạo QR localhost.
- Realtime vẫn là cơ chế chính: client subscribe bảng `QueueEvent` và chỉ dùng event làm tín hiệu refetch snapshot server.
- Polling chỉ là fallback khi Realtime lỗi, timeout, đóng ngoài ý muốn, thiếu Supabase client, hoặc browser online lại nhưng subscription chưa phục hồi.
- Connection indicator có các trạng thái connecting, connected, syncing, degraded, offline và error cho admin/staff/customer/public.
- Refetch được coalesce nhẹ, chống request song song và có recovery khi tab visible lại hoặc mạng online lại.
- Customer notification vẫn best-effort khi trang đang mở; không có background Web Push, service worker push, SMS hoặc email.
- Staff dashboard được tối ưu dạng card cho tablet/quầy vận hành nhiều phòng, vẫn dùng dữ liệu đã mask và không có quyền mutation.
- Supabase production cần thao tác thủ công: bật Realtime cho `QueueEvent`, kiểm tra RLS/SELECT phù hợp, và test hai thiết bị theo `docs/DEPLOYMENT.md`.
