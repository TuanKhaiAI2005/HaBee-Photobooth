import Link from "next/link";
import { AdminNav } from "@/app/admin/admin-nav";
import { requireAdmin } from "@/lib/auth/guards";
import { listHistory } from "@/lib/admin/history";
import { prisma } from "@/lib/prisma";
import { formatVietnamDateTime } from "@/lib/timezone";
import { ticketStatusLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

type HistoryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(page: number, searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    const item = first(value);
    if (item && key !== "page") {
      params.set(key, item);
    }
  }
  params.set("page", String(page));
  return `/admin/history?${params.toString()}`;
}

export default async function AdminHistoryPage({ searchParams }: HistoryPageProps) {
  await requireAdmin();
  const rawSearchParams = await searchParams;
  const data = await listHistory(prisma, rawSearchParams);

  return (
    <main className="photo-shell">
      <AdminNav />
      <section className="photo-card">
        <p className="photo-badge">Lịch sử</p>
        <h1 className="mt-3 text-4xl font-black text-[var(--color-navy)]">Lịch sử sử dụng phòng</h1>
        <p className="mt-2 text-sm text-[var(--color-muted-text)]">Thời gian hiển thị theo Asia/Ho_Chi_Minh.</p>
      </section>

      <form className="photo-card-soft grid gap-3 md:grid-cols-4" action="/admin/history">
        <input className="photo-input" defaultValue={data.filters.from ?? ""} name="from" type="date" />
        <input className="photo-input" defaultValue={data.filters.to ?? ""} name="to" type="date" />
        <select className="photo-input" defaultValue={data.filters.roomId ?? ""} name="roomId">
          <option value="">Tất cả phòng</option>
          {data.rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
        </select>
        <select className="photo-input" defaultValue={data.filters.status ?? ""} name="status">
          <option value="">Tất cả trạng thái</option>
          {["WAITING", "CALLED", "IN_SERVICE", "COMPLETED", "CANCELLED", "NO_SHOW"].map((status) => <option key={status} value={status}>{ticketStatusLabel(status)}</option>)}
        </select>
        <input className="photo-input" defaultValue={data.filters.customerName ?? ""} name="customerName" placeholder="Tên khách" />
        <input className="photo-input" defaultValue={data.filters.phone ?? ""} name="phone" placeholder="Số điện thoại" />
        <button className="photo-button" type="submit">Áp dụng bộ lọc</button>
        <Link className="photo-button-secondary" href="/admin/history">Xóa bộ lọc</Link>
      </form>

      <section className="photo-card-soft">
        {data.tickets.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-text)]">Không có lịch sử phù hợp bộ lọc.</p>
        ) : (
          <div className="grid gap-3">
            {data.tickets.map((ticket) => (
              <article className="rounded-lg border-2 border-[var(--color-navy)] bg-[var(--color-surface)] p-4" key={ticket.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black">{ticket.ticketCode} - {ticket.customerName}</p>
                    <p className="break-words text-sm text-[var(--color-muted-text)]">{ticket.normalizedPhone}</p>
                  </div>
                  <span className="rounded border border-[var(--color-navy)] px-2 py-1 text-xs font-bold" style={{ backgroundColor: ticket.roomColor }}>
                    {ticket.roomName}
                  </span>
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <div><dt className="font-bold">Đăng ký</dt><dd>{formatVietnamDateTime(ticket.registeredAt)}</dd></div>
                  <div><dt className="font-bold">Được gọi</dt><dd>{formatVietnamDateTime(ticket.calledAt)}</dd></div>
                  <div><dt className="font-bold">Bắt đầu</dt><dd>{formatVietnamDateTime(ticket.serviceStartedAt)}</dd></div>
                  <div><dt className="font-bold">Kết thúc</dt><dd>{formatVietnamDateTime(ticket.completedAt)}</dd></div>
                  <div><dt className="font-bold">Thời lượng</dt><dd>{ticket.duration}</dd></div>
                  <div><dt className="font-bold">Trạng thái cuối</dt><dd>{ticketStatusLabel(ticket.status)}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-muted-text)]">Trang {data.page}/{data.pageCount} - {data.total} dòng</p>
          <div className="flex gap-2">
            {data.page > 1 ? <Link className="photo-button-secondary" href={pageHref(data.page - 1, rawSearchParams)}>Trước</Link> : null}
            {data.page < data.pageCount ? <Link className="photo-button-secondary" href={pageHref(data.page + 1, rawSearchParams)}>Sau</Link> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
