# Roadmap

## Sprint 1: Database, authentication và phân quyền

- Thiết kế schema nền cho user, room, ticket và history.
- Cấu hình Prisma migration với Supabase PostgreSQL.
- Thiết lập Auth.js Credentials cho admin và staff.
- Tạo lớp phân quyền server-side.

## Sprint 2: Admin quản lý phòng và nhân viên

- Admin CRUD phòng.
- Admin CRUD nhân viên.
- Validate mutation bằng Zod.
- Thêm test cho quyền admin/staff.

## Sprint 3: Public rooms, QR và đăng ký hàng đợi

- Trang public theo QR phòng.
- Tạo ticket bằng tên và số điện thoại.
- Access token bí mật cho customer.
- View customer để xem và hủy ticket của chính mình.

## Sprint 4: Vận hành hàng đợi, timer và Realtime

- Admin gọi khách, check-in, checkout, hủy và sắp xếp hàng đợi.
- Timer dựa trên `serviceStartedAt` và `expectedEndAt`.
- Supabase Realtime cho danh sách hàng đợi và trạng thái phòng.

## Sprint 5: Lịch sử, thông báo và hoàn thiện UI

- Lịch sử khách sử dụng phòng.
- Âm thanh, popup và rung best-effort khi trang đang mở.
- Hoàn thiện UI admin, staff và public.

## Sprint 6: Kiểm thử bảo mật, deploy và bàn giao

- Kiểm thử che dữ liệu public/staff.
- Kiểm thử chặn mutation của staff.
- Build production, deploy và tài liệu bàn giao.
