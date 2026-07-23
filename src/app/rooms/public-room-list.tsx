"use client";

import Link from "next/link";
import { CustomerInfoGate } from "@/app/rooms/customer-info-gate";
import { roomStatusLabel } from "@/lib/labels";
import type { PublicRoomSummary } from "@/lib/public/tickets";

type PublicRoomListProps = {
  rooms: PublicRoomSummary[];
};

export function PublicRoomList({ rooms }: PublicRoomListProps) {
  return (
    <CustomerInfoGate>
      {(customerInfo, changeInfoButton) => (
        <>
          <section className="photo-card-soft flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold text-[var(--color-navy)]">
              Khách hàng: {customerInfo.customerName} - {customerInfo.phone}
            </p>
            {changeInfoButton}
          </section>

          {rooms.length === 0 ? (
            <div className="photo-card-soft text-[var(--color-muted-text)]">
              Hiện chưa có phòng nào đang nhận khách. Vui lòng quay lại sau ít phút.
            </div>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2">
              {rooms.map((room) => (
                <article className="photo-card" key={room.id}>
                  <div>
                    <h2 className="text-2xl font-black">{room.name}</h2>
                    <p className="photo-badge mt-2">{roomStatusLabel(room.status)}</p>
                  </div>
                  <dl className="mt-5 grid gap-3 text-sm text-[var(--color-navy)]">
                    <div className="photo-stat flex justify-between gap-3">
                      <dt>Thời lượng</dt>
                      <dd className="font-black">{room.defaultDurationMinutes} phút</dd>
                    </div>
                    <div className="photo-stat flex justify-between gap-3">
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
        </>
      )}
    </CustomerInfoGate>
  );
}
