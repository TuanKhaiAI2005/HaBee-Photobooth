import Link from "next/link";
import { AdminNav } from "@/app/admin/admin-nav";
import { BrandMark } from "@/app/components/brand-mark";
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
      <section className="photo-card habee-decor">
        <p className="photo-badge">Admin studio</p>
        <div className="mt-4">
          <BrandMark />
        </div>
        <h1 className="mt-5 text-4xl font-black text-[var(--color-ink)]">Bang dieu khien HaBee</h1>
        <p className="mt-3 text-[var(--color-muted-text)]">Dang dang nhap: {account.fullName}.</p>
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
