import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaffOrAdmin } from "@/lib/auth/guards";
import { ConfirmForm } from "@/app/components/confirm-form";
import { AutoCallWatcher } from "@/app/components/auto-call-watcher";
import { QueueRealtimeRefetch } from "@/app/components/queue-realtime-refetch";
import { QueueTimer } from "@/app/components/queue-timer";
import { getStaffRoomQueue, type StaffQueueTicket } from "@/lib/queue/read-models";
import { roomStatusLabel, ticketStatusLabel } from "@/lib/labels";
import {
  callNextTicketAction,
  cancelTicketAction,
  checkoutTicketAction,
  noShowTicketAction,
  reorderWaitingTicketAction,
  startServiceAction,
} from "@/lib/admin/queue-actions";

export const dynamic = "force-dynamic";

type StaffRoomPageProps = {
  params: Promise<{ roomId: string }>;
};

function StaffTicketRow({ ticket }: { ticket: StaffQueueTicket }) {
  return (
    <div>
      <p className="font-semibold text-[var(--color-navy)]">{ticket.ticketCode}</p>
      <p className="text-sm text-[var(--color-muted-text)]">
        {ticket.maskedName} - {ticket.maskedPhone}
      </p>
      <p className="text-xs text-[var(--color-muted-text)]">Vị trí #{ticket.queuePosition}</p>
      <p className="text-xs text-[var(--color-muted-text)]">Trạng thái vé: {ticketStatusLabel(ticket.status)}</p>
    </div>
  );
}

function CallNextForm({ roomId }: { roomId: string }) {
  return (
    <ConfirmForm
      action={callNextTicketAction}
      className="grid gap-3"
      confirmMessage="Gọi khách tiếp theo?"
      pendingLabel="Đang gọi..."
      submitLabel="Gọi khách tiếp theo"
    >
      <input name="roomId" type="hidden" value={roomId} />
    </ConfirmForm>
  );
}

function WaitingTicketItem({ ticket }: { ticket: StaffQueueTicket }) {
  return (
    <li className="grid gap-3 rounded-lg border-2 border-[var(--color-navy)] bg-[var(--color-surface)] p-3 shadow-[3px_3px_0_var(--color-navy)] md:grid-cols-[1fr_auto]">
      <StaffTicketRow ticket={ticket} />
      <div className="grid gap-2 sm:grid-cols-3">
        <ConfirmForm action={cancelTicketAction} className="grid gap-2" confirmMessage="Hủy vé này?" submitLabel="Hủy">
          <input name="ticketId" type="hidden" value={ticket.id} />
        </ConfirmForm>
        <ConfirmForm action={reorderWaitingTicketAction} className="grid gap-2" confirmMessage="Đưa vé này lên?" submitLabel="Lên">
          <input name="ticketId" type="hidden" value={ticket.id} />
          <input name="direction" type="hidden" value="up" />
        </ConfirmForm>
        <ConfirmForm action={reorderWaitingTicketAction} className="grid gap-2" confirmMessage="Đưa vé này xuống?" submitLabel="Xuống">
          <input name="ticketId" type="hidden" value={ticket.id} />
          <input name="direction" type="hidden" value="down" />
        </ConfirmForm>
      </div>
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
      <AutoCallWatcher roomIds={[view.room.id]} />
      <section className="photo-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="photo-badge">Phòng nhân viên</p>
            <h1 className="mt-3 text-4xl font-black text-[var(--color-navy)]">{view.room.name}</h1>
            <p className="mt-2 text-sm text-[var(--color-muted-text)]">
              Trạng thái {roomStatusLabel(view.room.status)} - {view.room.defaultDurationMinutes} phút/lượt
            </p>
          </div>
          <Link className="photo-button-secondary" href="/staff">
            Xem các phòng
          </Link>
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <div className="photo-stat">
            <dt className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Đang chờ</dt>
            <dd className="mt-1 text-2xl font-black">{view.waitingCount}</dd>
          </div>
          <div className="photo-stat bg-[var(--color-cream)]">
            <dt className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Ước tính chờ</dt>
            <dd className="mt-1 text-2xl font-black">{view.estimatedWaitingMinutes} phút</dd>
          </div>
          <div className="photo-stat bg-[var(--color-cream)]">
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
          {view.inService ? (
            <div className="mt-4 grid gap-4">
              <StaffTicketRow ticket={view.inService} />
              <ConfirmForm
                action={checkoutTicketAction}
                className="grid gap-3"
                confirmMessage="Xác nhận hoàn tất lượt này?"
                pendingLabel="Đang hoàn tất..."
                submitLabel="Hoàn tất lượt"
              >
                <input name="ticketId" type="hidden" value={view.inService.id} />
              </ConfirmForm>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-muted-text)]">Phòng đang trống.</p>
          )}
        </div>
        <div className="photo-card-soft">
          <h2 className="text-2xl font-black">Đã gọi</h2>
          {view.called ? (
            <div className="mt-4 grid gap-4">
              <StaffTicketRow ticket={view.called} />
              <div className="grid gap-3 sm:grid-cols-3">
                <ConfirmForm action={startServiceAction} className="grid gap-2" confirmMessage="Xác nhận khách vào phòng?" submitLabel="Vào phòng">
                  <input name="ticketId" type="hidden" value={view.called.id} />
                </ConfirmForm>
                <ConfirmForm action={cancelTicketAction} className="grid gap-2" confirmMessage="Hủy vé này?" submitLabel="Hủy vé">
                  <input name="ticketId" type="hidden" value={view.called.id} />
                </ConfirmForm>
                <ConfirmForm action={noShowTicketAction} className="grid gap-2" confirmMessage="Đánh dấu khách không đến?" submitLabel="Không đến">
                  <input name="ticketId" type="hidden" value={view.called.id} />
                </ConfirmForm>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              <p className="text-sm text-[var(--color-muted-text)]">Chưa có khách được gọi.</p>
              <CallNextForm roomId={view.room.id} />
            </div>
          )}
        </div>
      </section>

      <section className="photo-card-soft">
        <h2 className="text-2xl font-black">Hàng đợi đã che</h2>
        {view.waiting.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted-text)]">Không có vé đang chờ.</p>
        ) : (
          <ol className="mt-4 grid gap-3">
            {view.waiting.map((ticket) => <WaitingTicketItem key={ticket.id} ticket={ticket} />)}
          </ol>
        )}
      </section>
    </main>
  );
}




