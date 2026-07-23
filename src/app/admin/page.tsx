import Link from "next/link";
import { AdminNav } from "@/app/admin/admin-nav";
import { BrandMark, HaBeeLogoText } from "@/app/components/brand-mark";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { todayVietnamUtcRange } from "@/lib/timezone";

const adminCards = [
  {
    href: "/admin/rooms",
    title: "Quan ly phong",
    description: "Tao phong, in QR, xoa phong moi va vao man hinh van hanh hang doi.",
  },
  {
    href: "/admin/staff",
    title: "Quan ly nhan vien",
    description: "Tao UID, reset PIN, khoa/mo khoa hoac xoa tai khoan nhan vien.",
  },
  {
    href: "/admin/history",
    title: "Lich su su dung",
    description: "Tra cuu khach da hoan thanh, thoi gian su dung va trang thai ve.",
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
          <span className="admin-status-pill">San sang van hanh</span>
          <h1>Bang dieu khien <HaBeeLogoText /></h1>
          <p>Dang dang nhap: {account.fullName}.</p>
          <div className="admin-overview-actions" aria-label="Tac vu nhanh">
            <Link className="photo-button" href="/admin/rooms">
              Quan ly phong
            </Link>
            <Link className="photo-button-secondary" href="/admin/history">
              Xem lich su
            </Link>
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="photo-stat">
          <p className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Khach dang ky hom nay</p>
          <p className="mt-2 text-4xl font-black text-[var(--color-ink)]">{registeredToday}</p>
        </div>
        <div className="photo-stat">
          <p className="text-xs font-bold uppercase text-[var(--color-muted-text)]">Khach hoan thanh hom nay</p>
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
