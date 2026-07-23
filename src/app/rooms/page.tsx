import { prisma } from "@/lib/prisma";
import { listPublicRooms } from "@/lib/public/tickets";
import { QueueConnectionIndicator } from "@/app/components/connection-indicator";
import { BrandMark } from "@/app/components/brand-mark";
import { PublicRoomList } from "@/app/rooms/public-room-list";

export const dynamic = "force-dynamic";

export default async function PublicRoomsPage() {
  const rooms = await listPublicRooms(prisma);

  return (
    <main className="photo-shell">
      <QueueConnectionIndicator mode="public" />
      <section className="photo-card habee-decor">
        <div>
          <div className="public-room-brand-row">
            <BrandMark compact />
            <p className="photo-badge public-room-brand-badge">Photobooth</p>
          </div>
          <h1 className="mt-3 text-3xl font-black text-[var(--color-navy)] sm:text-4xl">
            Chọn phòng để lấy vé hàng đợi
          </h1>
          <p className="mt-2 text-[var(--color-muted-text)]">
            Quét QR chung, nhập thông tin khách, chọn phòng bạn muốn chụp, lấy mã vé và theo dõi lượt của mình trên điện thoại.
          </p>
        </div>
      </section>

      <PublicRoomList rooms={rooms} />
    </main>
  );
}
