import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { AdminNav } from "@/app/admin/admin-nav";
import { createQrPngDataUrl, getRoomPublicUrl } from "@/lib/public/qr";
import { getRoomTodayHistory } from "@/lib/admin/history";
import { formatVietnamDateTime } from "@/lib/timezone";
import { ticketStatusLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

type AdminRoomQrPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function AdminRoomQrPage({ params }: AdminRoomQrPageProps) {
  await requireAdmin();
  const { roomId } = await params;
  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) {
    notFound();
  }

  const publicUrl = getRoomPublicUrl(room.publicToken);
  const qrPng = await createQrPngDataUrl(publicUrl);
  const todayHistory = await getRoomTodayHistory(prisma, room.id);

  return (
    <main className="mx-auto grid min-h-screen max-w-4xl gap-6 px-6 py-8">
      <AdminNav />
      <section className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <p className="text-sm font-semibold uppercase text-[var(--color-muted-text)]">QR phòng</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-navy)]">{room.name}</h1>
        <p className="mt-3 break-all text-sm text-[var(--color-muted-text)]">{publicUrl}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={`QR ${room.name}`} className="mt-5 h-64 w-64 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-3" src={qrPng} />
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="rounded border border-[var(--color-border)] px-4 py-2 text-sm font-medium" href={`/rooms/${room.publicToken}`}>
            Mở trang khách
          </Link>
          <Link className="rounded border border-[var(--color-border)] px-4 py-2 text-sm font-medium" href={`/admin/rooms/${room.id}/queue`}>
            Vận hành hàng đợi
          </Link>
          <a className="rounded border border-[var(--color-border)] px-4 py-2 text-sm font-medium" href={`/admin/rooms/${room.id}/qr.png`}>
            Tải PNG
          </a>
          <a className="rounded border border-[var(--color-border)] px-4 py-2 text-sm font-medium" href={`/admin/rooms/${room.id}/qr.svg`}>
            Tải SVG
          </a>
          <Link className="rounded bg-[var(--color-navy)] px-4 py-2 text-sm font-medium text-[var(--color-cream)]" href={`/admin/rooms/${room.id}/print`}>
            Trang in
          </Link>
        </div>
      </section>
      <section className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--color-muted-text)]">Hôm nay</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--color-navy)]">{todayHistory.completedCount} khách đã hoàn thành</h2>
          </div>
          <Link className="photo-button-secondary" href={`/admin/history?roomId=${room.id}`}>
            Xem đầy đủ
          </Link>
        </div>
        {todayHistory.tickets.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-muted-text)]">Hôm nay phòng chưa có khách hoàn thành.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {todayHistory.tickets.map((ticket) => (
              <article className="rounded-lg border border-[var(--color-border)] p-3" key={ticket.id}>
                <p className="font-bold">{ticket.customerName} - {ticket.ticketCode}</p>
                <p className="text-sm text-[var(--color-muted-text)]">
                  {formatVietnamDateTime(ticket.serviceStartedAt)} - {formatVietnamDateTime(ticket.completedAt)} - {ticket.duration} - {ticketStatusLabel(ticket.status)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}


