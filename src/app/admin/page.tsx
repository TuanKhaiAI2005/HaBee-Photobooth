import Link from "next/link";
import { AdminNav } from "@/app/admin/admin-nav";
import { BrandMark, HaBeeLogoText } from "@/app/components/brand-mark";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { todayVietnamUtcRange } from "@/lib/timezone";

const adminCards = [
  {
    href: "/admin/rooms",
    title: "Quản lý phòng",
    description: "Tạo phòng, in QR, xóa phòng mới và vào màn hình vận hành hàng đợi.",
  },
  {
    href: "/admin/staff",
    title: "Quản lý nhân viên",
    description: "Tạo UID, đặt lại PIN, khóa/mở khóa hoặc xóa tài khoản nhân viên.",
  },
  {
    href: "/admin/history",
    title: "Lịch sử sử dụng",
    description: "Tra cứu khách đã hoàn thành, thời gian sử dụng và trạng thái vé.",
  },
];

export default async function AdminPage() {
  const account = await requireAdmin();
  const { startUtc, endExclusiveUtc } = todayVietnamUtcRange();
  const [registeredToday, completedToday] = await Promise.all([
    prisma.queueTicket.count({
      where: {
        registeredAt: {
          gte: startUtc,
          lt: endExclusiveUtc,
        },
      },
    }),
    prisma.queueTicket.count({
      where: {
        status: "COMPLETED",
        checkoutAt: {
          gte: startUtc,
          lt: endExclusiveUtc,
        },
      },
    }),
  ]);

  return (
    <main className="photo-shell">
      <AdminNav />
      <section className="photo-card admin-overview-card habee-decor">
        <div className="admin-overview-brand">
          <BrandMark />
        </div>
        <div className="admin-overview-content">
          <span className="admin-status-pill">Sẵn sàng vận hành</span>
          <h1>Bảng điều khiển <HaBeeLogoText /></h1>
          <p>Đang đăng nhập: {account.fullName}.</p>
          <div className="admin-overview-actions" aria-label="Tác vụ nhanh">
            <Link className="photo-button" href="/admin/rooms">
              Quản lý phòng
            </Link>
            <Link className="photo-button-secondary" href="/admin/history">
              Xem lịch sử
            </Link>
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="photo-stat">
          <p className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Khách đăng ký hôm nay</p>
          <p className="mt-2 text-4xl font-black text-[var(--color-ink)]">{registeredToday}</p>
        </div>
        <div className="photo-stat">
          <p className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Khách hoàn thành hôm nay</p>
          <p className="mt-2 text-4xl font-black text-[var(--color-ink)]">{completedToday}</p>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        {adminCards.map((card) => (
          <Link className="photo-card-soft transition hover:-translate-y-0.5" href={card.href} key={card.href}>
            <p className="photo-badge">✦</p>
            <h2 className="mt-4 text-2xl font-black">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted-text)]">{card.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
