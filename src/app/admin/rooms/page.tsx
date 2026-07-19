import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { AdminNav } from "@/app/admin/admin-nav";
import { ConfirmForm } from "@/app/components/confirm-form";
import { QueueConnectionIndicator } from "@/app/components/connection-indicator";
import { createRoomAction, deleteRoomAction, pauseRoomAction, updateRoomAction } from "@/lib/admin/room-actions";
import { roomStatusLabel } from "@/lib/labels";
import { createQrPngDataUrl, getJoinPublicUrl } from "@/lib/public/qr";
import { CopyUrlButton } from "@/app/components/copy-url-button";

const roomStatuses = [
  ["ACTIVE", "Hoạt động"],
  ["PAUSED", "Tạm dừng"],
  ["MAINTENANCE", "Bảo trì"],
  ["INACTIVE", "Ngừng dùng"],
] as const;

export default async function AdminRoomsPage() {
  await requireAdmin();

  const rooms = await prisma.room.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      queueTickets: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });
  let joinUrl: string | null = null;
  let joinQr: string | null = null;
  let qrError: string | null = null;

  try {
    joinUrl = getJoinPublicUrl();
    joinQr = await createQrPngDataUrl(joinUrl);
  } catch (error) {
    qrError = error instanceof Error ? error.message : "Không thể tạo QR chung do cấu hình URL chưa hợp lệ.";
  }

  return (
    <main className="photo-shell">
      <AdminNav />
      <QueueConnectionIndicator mode="admin" />
      <section className="photo-card">
        <p className="photo-badge">Quản lý phòng</p>
        <h1 className="mt-3 text-4xl font-black text-[var(--color-navy)]">Phòng photobooth</h1>
        <p className="mt-2 text-[var(--color-muted-text)]">Tạo phòng, in QR và vào màn hình vận hành hàng đợi.</p>
      </section>

      <section className="photo-card-soft">
        <h2 className="text-2xl font-black">QR chung</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-text)]">Khách quét mã này để chọn phòng và lấy số thứ tự.</p>
        {qrError ? (
          <p className="mt-4 rounded border border-[var(--color-border)] bg-[var(--color-cream)] p-3 text-sm font-bold text-[var(--color-navy)]">{qrError}</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="QR chung PhotoBooth" className="h-56 w-56 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-3" src={joinQr ?? ""} />
            <div>
              <p className="break-all text-sm text-[var(--color-muted-text)]">{joinUrl}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link className="photo-button-secondary" href="/join">Mở trang chọn phòng</Link>
                {joinUrl ? <CopyUrlButton url={joinUrl} /> : null}
                <Link className="photo-button" href="/admin/rooms/print">In QR chung</Link>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="photo-card-soft">
        <h2 className="text-2xl font-black">Thêm phòng</h2>
        <ConfirmForm
          action={createRoomAction}
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
          confirmMessage="Xác nhận thêm phòng mới?"
          pendingLabel="Đang thêm..."
          submitLabel="Thêm phòng"
        >
          <label className="grid gap-2 text-sm font-medium">
            Tên phòng
            <input className="photo-input" name="name" required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Màu
            <input className="h-11 rounded-lg border-2 border-[var(--color-navy)] px-2" name="color" type="color" defaultValue="#001858" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Thời lượng phút
            <input className="photo-input" name="defaultDurationMinutes" type="number" min={5} max={240} defaultValue={30} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Thứ tự
            <input className="photo-input" name="sortOrder" type="number" min={0} max={999} defaultValue={0} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Trạng thái
            <select className="photo-input" name="status" defaultValue="ACTIVE">
              {roomStatuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </ConfirmForm>
      </section>

      <section className="grid gap-4">
        {rooms.length === 0 ? (
          <div className="photo-card-soft text-[var(--color-muted-text)]">
            Chưa có phòng nào.
          </div>
        ) : (
          rooms.map((room) => {
            const waitingCount = room.queueTickets.filter((ticket) => ticket.status === "WAITING").length;
            const isRoomIdle = !room.queueTickets.some((ticket) => ticket.status === "CALLED" || ticket.status === "IN_SERVICE");
            const needsOperation = isRoomIdle && waitingCount > 0;

            return (
            <article className="photo-card-soft" key={room.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black">{room.name}</h2>
                  <p className="mt-1 text-sm text-[var(--color-muted-text)]">Public token: {room.publicToken}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link className="photo-button-secondary" href={`/admin/rooms/${room.id}`}>
                      Xem QR
                    </Link>
                    <Link className={needsOperation ? "photo-button" : "photo-button-secondary"} href={`/admin/rooms/${room.id}/queue`}>
                      Vận hành hàng đợi
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {needsOperation ? <span className="photo-badge">Cần vận hành</span> : null}
                  <span className="photo-badge">{roomStatusLabel(room.status)}</span>
                </div>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="photo-stat">
                  <dt className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Đang chờ</dt>
                  <dd className="mt-1 text-2xl font-black">{waitingCount} khách</dd>
                </div>
                <div className="photo-stat">
                  <dt className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Trạng thái vận hành</dt>
                  <dd className="mt-1 text-lg font-black">{needsOperation ? "Phòng trống, cần gọi khách" : "Đang ổn"}</dd>
                </div>
              </dl>
              <ConfirmForm
                action={updateRoomAction}
                className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
                confirmMessage={`Xác nhận cập nhật ${room.name}? Public token sẽ được giữ nguyên.`}
                pendingLabel="Đang lưu..."
                submitLabel="Lưu thay đổi"
              >
                <input name="id" type="hidden" value={room.id} />
                <label className="grid gap-2 text-sm font-medium">
                  Tên phòng
                  <input className="photo-input" name="name" required defaultValue={room.name} />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Màu
                  <input className="h-11 rounded-lg border-2 border-[var(--color-navy)] px-2" name="color" type="color" defaultValue={room.color} />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Thời lượng phút
                  <input className="photo-input" name="defaultDurationMinutes" type="number" min={5} max={240} defaultValue={room.defaultDurationMinutes} />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Thứ tự
                  <input className="photo-input" name="sortOrder" type="number" min={0} max={999} defaultValue={room.sortOrder} />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Trạng thái
                  <select className="photo-input" name="status" defaultValue={room.status}>
                    {roomStatuses.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </ConfirmForm>
              <ConfirmForm
                action={pauseRoomAction}
                className="mt-3 flex flex-wrap items-center gap-3"
                confirmMessage={`Tạm dừng ${room.name}?`}
                pendingLabel="Đang tạm dừng..."
                submitLabel="Tạm dừng phòng"
              >
                <input name="id" type="hidden" value={room.id} />
              </ConfirmForm>
              <ConfirmForm
                action={deleteRoomAction}
                className="mt-3 flex flex-wrap items-center gap-3"
                confirmMessage={`Xóa vĩnh viễn ${room.name}? Chỉ xóa được khi phòng chưa có vé hoặc lịch sử hàng đợi.`}
                pendingLabel="Đang xóa..."
                submitLabel="Xóa phòng"
              >
                <input name="id" type="hidden" value={room.id} />
              </ConfirmForm>
            </article>
            );
          })
        )}
      </section>
    </main>
  );
}




