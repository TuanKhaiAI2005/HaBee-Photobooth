# Manual Test Checklist

Chạy checklist này trên môi trường local hoặc staging sau khi đã migrate và seed.

## Chuẩn bị

- [ ] `.env.local` có `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, Supabase URL và anon key.
- [ ] `npx prisma migrate deploy` chạy thành công.
- [ ] `npx prisma db seed` tạo admin.
- [ ] Supabase Realtime bật cho bảng `QueueEvent`.

## Smoke Test

- [ ] Admin đăng nhập tại `/admin/login`.
- [ ] Admin tạo phòng mới tại `/admin/rooms`.
- [ ] Admin tạo nhân viên tại `/admin/staff`.
- [ ] Nhân viên đăng nhập tại `/staff/login`.
- [ ] Admin mở trang QR phòng tại `/admin/rooms/[roomId]`.
- [ ] Khách mở link QR `/rooms/[publicToken]`.
- [ ] Khách đăng ký vé bằng tên và số điện thoại.
- [ ] Public room chỉ hiển thị tên/SĐT đã che.
- [ ] Staff chỉ thấy tên/SĐT đã che.
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

## Security Review

- [ ] Public route không trả tên/SĐT đầy đủ của vé khác.
- [ ] Staff route không trả tên/SĐT đầy đủ.
- [ ] Staff không gọi được admin mutation.
- [ ] Customer không hủy được ticket người khác nếu không có access token đúng.
- [ ] Access token không lưu plain text, chỉ lưu `customerAccessTokenHash`.
- [ ] Password không lưu plain text, chỉ lưu `passwordHash`.
- [ ] Không có secret trong client bundle ngoài biến `NEXT_PUBLIC_*` được phép public.
- [ ] Không commit `.env` hoặc secret production.
- [ ] Tất cả mutation dùng Zod/server-side validation.
- [ ] Endpoint QR/admin mutation có authentication phù hợp.
- [ ] Không có hai vé `IN_SERVICE` cùng một phòng.
- [ ] Không có active ticket trùng số điện thoại theo constraint database.

## Kết quả

Ghi lại môi trường, commit/phiên bản, người test, ngày test và lỗi còn lại nếu có.
