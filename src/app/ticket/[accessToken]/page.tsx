import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTicketByAccessToken } from "@/lib/public/tickets";
import { accessTokenSchema } from "@/lib/public/ticket-schemas";
import { cancelTicketAction, confirmArrivedAction } from "@/lib/public/actions";
import { ConfirmForm } from "@/app/components/confirm-form";
import { QueueTimer } from "@/app/components/queue-timer";
import { QueueRealtimeRefetch } from "@/app/components/queue-realtime-refetch";
import { CalledNotification } from "@/app/components/called-notification";
import { ticketStatusLabel } from "@/lib/labels";
import { BrandMark } from "@/app/components/brand-mark";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type TicketPageProps = {
  params: Promise<{ accessToken: string }>;
};

export default async function TicketPage({ params }: TicketPageProps) {
  noStore();
  const { accessToken } = await params;

  if (!accessTokenSchema.safeParse(accessToken).success) {
    notFound();
  }

  const ticket = await getTicketByAccessToken(prisma, accessToken);

  if (!ticket) {
    notFound();
  }

  return (
    <main className="photo-shell max-w-3xl">
      <QueueRealtimeRefetch mode="customer" roomId={ticket.roomId} />
      <CalledNotification
        mode="customer"
        ticket={ticket.status === "CALLED" && ticket.calledAt ? {
          id: ticket.id,
          ticketCode: ticket.ticketCode,
          roomId: ticket.roomId,
          roomName: ticket.roomName,
          calledAt: ticket.calledAt,
        } : null}
      />
      <section className="photo-card">
        <BrandMark compact />
        <p className="photo-badge mt-4">Vé hàng đợi của bạn</p>
        <h1 className="mt-4 break-words text-4xl font-black text-[var(--color-navy)]">{ticket.ticketCode}</h1>
        <p className="mt-2 text-[var(--color-muted-text)]">Giữ trang này để theo dõi lượt và xác nhận khi được gọi.</p>
        <dl className="mt-6 grid gap-3 text-sm text-[var(--color-navy)] sm:grid-cols-2">
          <div className="photo-stat">
            <dt className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Phòng</dt>
            <dd className="mt-1 text-xl font-black">{ticket.roomName}</dd>
          </div>
          <div className="photo-stat bg-[var(--color-pink)] text-[var(--color-cream)] photo-on-highlight">
            <dt className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Trạng thái</dt>
            <dd className="mt-1 text-xl font-black">{ticketStatusLabel(ticket.status)}</dd>
          </div>
          <div className="photo-stat bg-[var(--color-cream)]">
            <dt className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Đồng hồ</dt>
            <dd className="mt-1 text-xl font-black">
              <QueueTimer expectedEndAt={ticket.expectedEndAt} serverNow={ticket.serverNow} />
            </dd>
          </div>
          <div className="photo-stat bg-[var(--color-cream)]">
            <dt className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Người phía trước</dt>
            <dd className="mt-1 text-xl font-black">{ticket.peopleAhead}</dd>
          </div>
          <div className="photo-stat sm:col-span-2">
            <dt className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Ước tính chờ</dt>
            <dd className="mt-1 text-xl font-black">{ticket.estimatedWaitingMinutes} phút</dd>
          </div>
        </dl>
        <Link className="photo-button-secondary mt-5" href={`/rooms/${ticket.roomPublicToken}`}>
          Xem phòng
        </Link>
      </section>

      {ticket.canConfirmArrival ? (
        <section className="photo-card bg-[var(--color-pink)] text-[var(--color-cream)] photo-on-highlight">
          <h2 className="text-3xl font-black">Đã tới lượt của bạn</h2>
          <p className="mt-2 text-sm text-[var(--color-muted-text)]">
            Vé {ticket.ticketCode} được gọi vào phòng {ticket.roomName}. Vui lòng đi vào đúng phòng và bấm xác nhận khi bạn đã vào phòng chụp.
          </p>
          <ConfirmForm
            action={confirmArrivedAction}
            className="mt-4 grid gap-3"
            confirmMessage="Xác nhận bạn đã vào phòng?"
            pendingLabel="Đang xác nhận..."
            submitLabel="Tôi đã vào phòng"
          >
            <input name="accessToken" type="hidden" value={accessToken} />
          </ConfirmForm>
        </section>
      ) : null}

      {ticket.canCancel ? (
        <section className="photo-card-soft">
          <h2 className="text-2xl font-black">Hủy vé</h2>
          <ConfirmForm
            action={cancelTicketAction}
            className="mt-4 grid gap-3"
            confirmMessage="Xác nhận hủy vé của bạn?"
            pendingLabel="Đang hủy..."
            submitLabel="Hủy vé"
          >
            <input name="accessToken" type="hidden" value={accessToken} />
          </ConfirmForm>
        </section>
      ) : null}
    </main>
  );
}




