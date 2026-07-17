import Link from "next/link";
import { logout } from "@/lib/auth/actions";
import { requireStaffOrAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { QueueTimer } from "@/app/components/queue-timer";
import { listStaffRooms } from "@/lib/queue/read-models";
import { roomStatusLabel } from "@/lib/labels";
import { QueueConnectionIndicator } from "@/app/components/connection-indicator";
import { BrandMark } from "@/app/components/brand-mark";

export default async function StaffPage() {
  const account = await requireStaffOrAdmin();
  const queue = await listStaffRooms(prisma);

  return (
    <main className="photo-shell">
      <section className="photo-card">
        <BrandMark compact />
        <p className="photo-badge mt-4">Nhân viên</p>
        <h1 className="mt-3 text-4xl font-black text-[var(--color-navy)]">Màn hình nhân viên</h1>
        <p className="mt-3 text-[var(--color-muted-text)]">Đã đăng nhập với tên {account.fullName}.</p>
        <div className="mt-4">
          <QueueConnectionIndicator mode="staff" />
        </div>
      </section>
      <section className="photo-card-soft">
        <h2 className="text-2xl font-black">Phòng</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {queue.rooms.map((room) => (
            <Link className="grid min-h-56 gap-4 rounded-lg border-2 border-[var(--color-navy)] bg-[var(--color-surface)] p-4 shadow-[3px_3px_0_var(--color-navy)]" href={`/staff/rooms/${room.id}`} key={room.id}>
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-2xl font-black">{room.name}</span>
                  <span className="photo-badge mt-2">{roomStatusLabel(room.status)}</span>
                </span>
                <span className="h-11 w-11 shrink-0 rounded-lg border-2 border-[var(--color-navy)]" style={{ background: room.color }} />
              </span>
              <span className="grid grid-cols-2 gap-3 text-sm">
                <span className="photo-stat">
                  <span className="block text-xs font-bold uppercase text-[var(--color-muted-text)]">Đang chờ</span>
                  <span className="text-2xl font-black">{room.waitingCount}</span>
                </span>
                <span className="photo-stat bg-[var(--color-cream)]">
                  <span className="block text-xs font-bold uppercase text-[var(--color-muted-text)]">Đã gọi</span>
                  <span className="font-black">{room.hasCalled ? "Có khách" : "Chưa gọi"}</span>
                </span>
              </span>
              <span className="photo-stat bg-[var(--color-pink)] text-[var(--color-cream)] photo-on-highlight">
                <span className="block text-xs font-bold uppercase text-[var(--color-muted-text)]">Đồng hồ phòng</span>
                <span className="text-2xl font-black">
                  <QueueTimer expectedEndAt={room.inService?.expectedEndAt ?? null} serverNow={queue.serverNow} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <form action={logout}>
        <button className="photo-button-secondary" type="submit">
          Đăng xuất
        </button>
      </form>
    </main>
  );
}


