# Deployment

Tài liệu này mô tả deploy thủ công lên Vercel + Supabase. Không tự deploy nếu chưa có credential và quyền production.

## Supabase

1. Tạo Supabase project.
2. Lấy connection string pooled cho `DATABASE_URL`.
3. Lấy connection string direct cho `DIRECT_URL`.
4. Áp dụng Prisma migration bằng đúng database owner trong `DIRECT_URL`; migration sẽ bật RLS và khóa quyền browser roles.
5. Bật publication Realtime cho bảng `QueueEvent` theo `docs/SUPABASE_REALTIME.sql`.
6. Lấy `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
7. Kiểm tra browser chỉ dùng anon key; không đưa service role key vào biến `NEXT_PUBLIC_*`.
8. Kiểm tra quyền SELECT/RLS cho `QueueEvent` không làm lộ PII. Bảng này chỉ nên chứa roomId, ticketId, eventType và timestamp.

`Account`, `Room`, `QueueTicket`, `QueueNumberCounter` và `_prisma_migrations` chỉ được truy cập qua Next.js/Prisma phía server. Supabase client trong browser chỉ dùng `QueueEvent` cho Realtime và chỉ có quyền `SELECT`. Staff được phép thực hiện các thao tác vận hành queue qua server actions đã xác thực/validate; Staff không có quyền quản trị phòng, tài khoản, nhân viên hoặc lịch sử.

## Environment Variables

Cấu hình ở Vercel Project Settings:

```bash
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
APP_URL=https://your-domain.example
NEXT_PUBLIC_APP_URL=https://your-domain.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SEED_ADMIN_USERNAME=
SEED_ADMIN_PASSWORD=
```

`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `SEED_ADMIN_PASSWORD` là secret server-side. Không đưa các biến này vào client code. `APP_URL` hoặc `NEXT_PUBLIC_APP_URL` phải trỏ tới production domain thật để QR chung và QR phòng không tạo URL localhost.

## Database Migration

Trước khi production traffic dùng app, xác nhận `DIRECT_URL` kết nối bằng role sở hữu cả sáu bảng Prisma (`Account`, `Room`, `QueueTicket`, `QueueEvent`, `QueueNumberCounter`, `_prisma_migrations`) và `DATABASE_URL` dùng cùng database role qua pooled connection. Migration bảo mật sẽ chủ động dừng trước khi thay đổi nếu role chạy migration không phải owner của một trong các bảng:

```bash
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -c "SELECT current_user; SELECT c.relname, pg_get_userbyid(c.relowner) AS owner FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname IN ('Account', 'Room', 'QueueTicket', 'QueueEvent', 'QueueNumberCounter', '_prisma_migrations') ORDER BY c.relname;"
```

Sau đó validate và áp dụng migration:

```bash
npx prisma validate
npx prisma migrate deploy
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f prisma/checks/verify_supabase_rls_grants.sql
```

Script kiểm tra chạy trong transaction và `ROLLBACK` ở cuối. Nó kiểm tra RLS, effective privileges, policy Realtime, default privileges và giả lập role `anon`; script không giữ lại thay đổi dữ liệu hay quyền.

Migration STT thêm hai field nullable `queueNumber` và `businessDate` cho dữ liệu tương thích ngược, cùng bảng `QueueNumberCounter` server-only. Không backfill STT cho lịch sử cũ nếu không có đủ thông tin; sau migration cần xác nhận record cũ hiển thị `STT —`, còn mọi đăng ký mới đều có STT 1-50 và `businessDate` theo `Asia/Ho_Chi_Minh`.

Chỉ chạy `npx prisma db seed` khi cần tạo/upsert admin đầu tiên. Seed hash mật khẩu bằng bcrypt.

## Vercel

1. Import repository vào Vercel.
2. Chọn framework Next.js.
3. Thêm environment variables production.
4. Deploy.
5. Sau deploy, truy cập `/admin/login` để đăng nhập admin.

## Sau Deploy

1. Tạo nhân viên tại `/admin/staff`.
2. Tạo phòng tại `/admin/rooms`.
3. Mở QR chung tại `/admin/rooms` và kiểm tra URL `/join`.
4. Mở QR phòng tại `/admin/rooms/[roomId]`.
5. In QR hoặc tải PNG/SVG.
6. Kiểm tra QR production bằng điện thoại, bảo đảm URL không phải localhost hoặc preview URL ngoài ý muốn.
7. Mở Admin ở một trình duyệt và Staff/Customer ở trình duyệt hoặc thiết bị khác.
8. Thực hiện mutation như đăng ký vé, gọi khách, xác nhận vào phòng và checkout; thiết bị còn lại cần cập nhật trong khoảng 1-2 giây khi Realtime khỏe.
9. Tạm làm lỗi Realtime hoặc tắt publication `QueueEvent` để kiểm tra indicator chuyển sang trạng thái không ổn định và polling fallback cập nhật theo interval.
10. Khôi phục Realtime và kiểm tra polling dừng khi subscription `SUBSCRIBED` lại.
11. Kiểm tra offline/online: tắt mạng, bảo đảm UI giữ snapshot cũ; bật mạng lại, UI refetch và reconnect.
12. Trên iOS/Android, xác nhận thao tác `Đăng ký` không phát chuông. Giữ nguyên trang ticket, gọi vé và xác nhận chuông tự phát liên tục đủ 20 giây mà không có nút bật âm thanh thủ công.
13. Kiểm tra STT theo từng phòng: ba phòng đều bắt đầu từ 1, cùng phòng tăng tuần tự và reorder không đổi STT.
14. Kiểm tra giới hạn 50, reset lúc 00:00 `Asia/Ho_Chi_Minh`, không tái sử dụng sau hủy/xóa và nhiều đăng ký đồng thời không tạo duplicate.
15. Kiểm tra mobile/tablet/desktop cho `/join`, danh sách và chi tiết phòng, ticket page, staff dashboard/detail, admin queue/history và trang in; xác nhận đúng icon tròn/trái tim/vuông, không overflow và console không có error.
16. Kiểm tra ít nhất một record legacy hiển thị `STT —` mà không crash.
17. Chạy checklist trong `docs/MANUAL_TEST_CHECKLIST.md`.
18. Chạy lại `prisma/checks/verify_supabase_rls_grants.sql` bằng direct connection và yêu cầu toàn bộ assertion pass, bao gồm `QueueNumberCounter` không có browser privilege.

## Rollback

Vercel có thể rollback deployment. Database migration không tự rollback; nếu cần rollback database phải chuẩn bị migration ngược riêng và kiểm tra dữ liệu trước.
