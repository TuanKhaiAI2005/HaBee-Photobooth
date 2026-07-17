# Photobooth Queue

Ứng dụng quản lý hàng đợi cho một chi nhánh photobooth nhỏ. Admin quản lý phòng, nhân viên và vận hành hàng đợi; nhân viên chỉ xem dữ liệu đã che; khách lấy vé qua QR và theo dõi lượt bằng link bí mật.

## Cài đặt local

1. Cài dependency:

```bash
npm install
```

2. Tạo Supabase project và lấy chuỗi kết nối:

- `DATABASE_URL`: connection string pooled.
- `DIRECT_URL`: connection string direct dùng cho Prisma migration.
- Bật Realtime cho bảng `QueueEvent` trong Supabase để các trang đang mở tự refetch.

3. Tạo `.env.local` từ `.env.example` và điền giá trị thật:

```bash
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SEED_ADMIN_USERNAME=
SEED_ADMIN_PASSWORD=
```

Không commit secret thật.

4. Chạy Prisma:

```bash
npx prisma validate
npx prisma migrate deploy
npx prisma db seed
```

5. Chạy local:

```bash
npm run dev
```

## Kiểm tra

```bash
npx prisma validate
npm run lint
npm run typecheck
npm run test
npm run build
```

## Tài khoản và vận hành

- Admin đăng nhập tại `/admin/login` bằng `SEED_ADMIN_USERNAME` và `SEED_ADMIN_PASSWORD` sau khi seed.
- Admin tạo nhân viên tại `/admin/staff`.
- Admin tạo phòng tại `/admin/rooms`.
- Admin mở trang QR của phòng tại `/admin/rooms/[roomId]`, tải PNG/SVG hoặc mở trang in.
- Khách quét QR, đăng ký tên và số điện thoại, sau đó giữ trang vé để theo dõi lượt.
- Nhân viên đăng nhập tại `/staff/login` bằng UID và PIN/mật khẩu do admin tạo.

## Deploy Vercel

1. Tạo project Vercel từ repository.
2. Cấu hình production environment variables giống `.env.local`, dùng URL production cho `NEXT_PUBLIC_APP_URL`.
3. Trỏ `DATABASE_URL` và `DIRECT_URL` về Supabase production.
4. Chạy migration trước hoặc trong pipeline:

```bash
npx prisma migrate deploy
npx prisma db seed
```

5. Deploy bằng Vercel. Không tự deploy nếu chưa có quyền hoặc credential production.

Xem thêm [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), [docs/MANUAL_TEST_CHECKLIST.md](docs/MANUAL_TEST_CHECKLIST.md) và [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md).
