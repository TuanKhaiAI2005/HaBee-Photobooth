import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaffOrAdmin } from "@/lib/auth/guards";
import { QueueRealtimeRefetch } from "@/app/components/queue-realtime-refetch";
import { QueueTimer } from "@/app/components/queue-timer";
import { getStaffRoomQueue, type StaffQueueTicket } from "@/lib/queue/read-models";
import { ticketStatusLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

type StaffRoomPageProps = {
  params: Promise<{ roomId: string }>;
};

function StaffTicketRow({ ticket }: { ticket: StaffQueueTicket }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-[var(--color-navy)] bg-[var(--color-surface)] p-3 text-sm shadow-[3px_3px_0_var(--color-navy)]">
      <span>
        #{ticket.queuePosition} {ticket.ticketCode} - {ticket.maskedName}
      </span>
      <span>{ticket.maskedPhone}</span>
      <span>{ticketStatusLabel(ticket.status)}</span>
    </li>
  );
}

export default async function StaffRoomPage({ params }: StaffRoomPageProps) {
  await requireStaffOrAdmin();
  const { roomId } = await params;
  const view = await getStaffRoomQueue(prisma, roomId);

  if (!view) {
    notFound();
  }

  return (
    <main className="photo-shell">
      <QueueRealtimeRefetch mode="staff" roomId={view.room.id} />
      <section className="photo-card">
        <p className="photo-badge">Phòng nhân viên</p>
        <h1 className="mt-3 text-4xl font-black text-[var(--color-navy)]">{view.room.name}</h1>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <div className="photo-stat">
            <dt className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Đang chờ</dt>
            <dd className="mt-1 text-2xl font-black">{view.waitingCount}</dd>
          </div>
          <div className="photo-stat bg-[var(--color-cream)]">
            <dt className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Ước tính chờ</dt>
            <dd className="mt-1 text-2xl font-black">{view.estimatedWaitingMinutes} phút</dd>
          </div>
          <div className="photo-stat bg-[var(--color-pink)] text-[var(--color-cream)] photo-on-highlight">
            <dt className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Đồng hồ</dt>
            <dd className="mt-1 text-2xl font-black">
              <QueueTimer expectedEndAt={view.inService?.expectedEndAt ?? null} serverNow={view.serverNow} />
            </dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="photo-card-soft">
          <h2 className="text-2xl font-black">Đang sử dụng</h2>
          {view.inService ? <ul className="mt-4"><StaffTicketRow ticket={view.inService} /></ul> : <p className="mt-3 text-sm text-[var(--color-muted-text)]">Phòng đang trống.</p>}
        </div>
        <div className="photo-card-soft">
          <h2 className="text-2xl font-black">Đã gọi</h2>
          {view.called ? <ul className="mt-4"><StaffTicketRow ticket={view.called} /></ul> : <p className="mt-3 text-sm text-[var(--color-muted-text)]">Chưa có khách được gọi.</p>}
        </div>
      </section>

      <section className="photo-card-soft">
        <h2 className="text-2xl font-black">Hàng đợi đã che</h2>
        {view.waiting.length === 0 ? <p className="mt-3 text-sm text-[var(--color-muted-text)]">Không có vé đang chờ.</p> : <ol className="mt-4 grid gap-2">{view.waiting.map((ticket) => <StaffTicketRow key={ticket.id} ticket={ticket} />)}</ol>}
      </section>
    </main>
  );
}




