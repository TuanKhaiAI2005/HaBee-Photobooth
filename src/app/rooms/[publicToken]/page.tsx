import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPublicRoomDetail } from "@/lib/public/tickets";
import { createTicketAction } from "@/lib/public/actions";
import { ConfirmForm } from "@/app/components/confirm-form";
import { QueueRealtimeRefetch } from "@/app/components/queue-realtime-refetch";
import { roomStatusLabel, ticketStatusLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

type PublicRoomDetailPageProps = {
  params: Promise<{ publicToken: string }>;
};

export default async function PublicRoomDetailPage({ params }: PublicRoomDetailPageProps) {
  const { publicToken } = await params;
  const detail = await getPublicRoomDetail(prisma, publicToken);

  if (!detail) {
    notFound();
  }

  return (
    <main className="photo-shell">
      <QueueRealtimeRefetch mode="public" roomId={detail.room.id} />
      <section className="photo-card grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="photo-badge">Đăng ký hàng đợi</p>
          <h1 className="mt-3 text-4xl font-black text-[var(--color-navy)]">{detail.room.name}</h1>
          <p className="mt-2 text-[var(--color-muted-text)]">Trạng thái phòng: {roomStatusLabel(detail.room.status)}</p>
        </div>
        <span className="h-16 w-16 rounded-lg border-2 border-[var(--color-navy)] shadow-[4px_4px_0_var(--color-navy)]" style={{ background: detail.room.color }} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="photo-stat">
          <p className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Thời lượng</p>
          <p className="mt-1 text-2xl font-black">{detail.room.defaultDurationMinutes} phút</p>
        </div>
        <div className="photo-stat bg-[var(--color-pink)] text-[var(--color-cream)] photo-on-highlight">
          <p className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Đang chờ</p>
          <p className="mt-1 text-2xl font-black">{detail.room.waitingCount} vé</p>
        </div>
        <div className="photo-stat bg-[var(--color-cream)]">
          <p className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Ước tính</p>
          <p className="mt-1 text-2xl font-black">{detail.room.estimatedWaitingMinutes} phút</p>
        </div>
      </section>

      <section className="photo-card-soft">
        <h2 className="text-2xl font-black">Hàng đợi hiện tại</h2>
        {detail.queue.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted-text)]">Chưa có ai trong hàng đợi.</p>
        ) : (
          <ol className="mt-4 grid gap-3">
            {detail.queue.map((ticket) => (
              <li className="rounded-lg border-2 border-[var(--color-navy)] bg-[var(--color-surface)] p-3 shadow-[3px_3px_0_var(--color-navy)]" key={ticket.ticketCode}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Mã vé</p>
                    <p className="text-lg font-black">{ticket.ticketCode}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted-text)]">#{ticket.queuePosition} - {ticket.maskedName}</p>
                  </div>
                  <div className="text-right text-sm font-bold text-[var(--color-navy)]">
                    <p>{ticket.maskedPhone}</p>
                    <p className="photo-badge mt-2">{ticketStatusLabel(ticket.status)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="photo-card">
        <h2 className="text-2xl font-black">Lấy vé của bạn</h2>
        {detail.canRegister ? (
          <ConfirmForm
            action={createTicketAction}
            className="mt-4 grid gap-4 sm:grid-cols-2"
            confirmMessage="Xác nhận đăng ký vào hàng đợi?"
            pendingLabel="Đang đăng ký..."
            submitLabel="Đăng ký"
          >
            <input name="publicToken" type="hidden" value={detail.room.publicToken} />
            <label className="grid gap-2 text-sm font-bold">
              Họ tên
              <input className="photo-input" name="customerName" required />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Số điện thoại
              <input className="photo-input" name="phone" required inputMode="tel" />
            </label>
          </ConfirmForm>
        ) : (
          <p className="mt-3 text-sm text-[var(--color-muted-text)]">Phòng đang tạm dừng, hiện không nhận đăng ký mới.</p>
        )}
      </section>
    </main>
  );
}




