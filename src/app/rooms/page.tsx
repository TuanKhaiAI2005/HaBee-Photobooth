import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listPublicRooms } from "@/lib/public/tickets";
import { roomStatusLabel } from "@/lib/labels";
import { QueueConnectionIndicator } from "@/app/components/connection-indicator";
import { BrandMark } from "@/app/components/brand-mark";

export const dynamic = "force-dynamic";

export default async function PublicRoomsPage() {
  const rooms = await listPublicRooms(prisma);

  return (
    <main className="photo-shell">
      <QueueConnectionIndicator mode="public" />
      <section className="photo-card habee-decor grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <BrandMark compact />
          <p className="photo-badge mt-4">HaBee Photobooth</p>
          <h1 className="mt-3 text-3xl font-black text-[var(--color-navy)] sm:text-4xl">
            Chọn phòng để lấy vé hàng đợi
          </h1>
          <p className="mt-2 text-[var(--color-muted-text)]">
            Quét QR chung, chọn phòng bạn muốn chụp, lấy mã vé và theo dõi lượt của mình trên điện thoại.
          </p>
        </div>
        <div className="film-strip w-full md:w-44">
          <div className="grid grid-cols-3 gap-2 bg-[var(--color-surface)] p-3 md:grid-cols-1">
            <span className="h-12 rounded-lg border-2 border-[var(--color-navy)] bg-[var(--color-pink)]" />
            <span className="h-12 rounded-lg border-2 border-[var(--color-navy)] bg-[var(--color-cream)]" />
            <span className="h-12 rounded-lg border-2 border-[var(--color-navy)] bg-[var(--color-cream)]" />
          </div>
        </div>
      </section>

      {rooms.length === 0 ? (
        <div className="photo-card-soft text-[var(--color-muted-text)]">Hiện chưa có phòng nào đang nhận khách. Vui lòng quay lại sau ít phút.</div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {rooms.map((room) => (
            <article className="photo-card" key={room.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black">{room.name}</h2>
                  <p className="photo-badge mt-2">{roomStatusLabel(room.status)}</p>
                </div>
                <span className="h-10 w-10 rounded-lg border-2 border-[var(--color-navy)]" style={{ background: room.color }} />
              </div>
              <dl className="mt-5 grid gap-3 text-sm text-[var(--color-navy)]">
                <div className="photo-stat flex justify-between gap-3">
                  <dt>Thời lượng</dt>
                  <dd className="font-black">{room.defaultDurationMinutes} phút</dd>
                </div>
                <div className="photo-stat flex justify-between gap-3 bg-[var(--color-pink)] text-[var(--color-cream)] photo-on-highlight">
                  <dt>Đang chờ</dt>
                  <dd className="font-black">{room.waitingCount} vé</dd>
                </div>
                <div className="photo-stat flex justify-between gap-3 bg-[var(--color-cream)]">
                  <dt>Ước tính chờ</dt>
                  <dd className="font-black">{room.estimatedWaitingMinutes} phút</dd>
                </div>
              </dl>
              <Link className="photo-button mt-5" href={`/rooms/${room.publicToken}`}>
                Chọn phòng này
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
