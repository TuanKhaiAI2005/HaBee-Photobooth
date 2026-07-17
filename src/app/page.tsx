import Link from "next/link";
import { BrandMark } from "@/app/components/brand-mark";

const highlights = [
  "QR nhận vé nhanh",
  "Realtime dịu mắt",
  "Phòng chụp rõ trạng thái",
  "Ticket cute, dễ theo dõi",
  "Dashboard cho quầy",
  "Thông báo khi tới lượt",
];

export default function Home() {
  return (
    <main className="photo-shell">
      <section className="photo-card habee-decor grid gap-8 md:grid-cols-[1.12fr_0.88fr] md:items-center">
        <div>
          <p className="photo-badge">Cute queue system</p>
          <div className="mt-4">
            <BrandMark />
          </div>
          <h1 className="mt-5 max-w-2xl text-3xl font-black text-[var(--color-ink)] sm:text-5xl">
            Hang doi photobooth mem mai, vui ve va de thuong hon.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted-text)]">
            Khach quet QR de lay ve, admin goi luot, staff theo doi phong va timer trong mot giao dien pastel co nhan dien rieng.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="photo-button" href="/join">
              Chon phong chup
            </Link>
            <Link className="photo-button-secondary" href="/admin">
              Vao admin
            </Link>
          </div>
        </div>
        <div className="film-strip">
          <div className="grid gap-3 bg-[var(--color-surface-gloss)] p-4">
            <div className="h-24 rounded-[1.5rem] border border-white bg-[linear-gradient(135deg,#ff9cc5,#ffd9e8)] shadow-[inset_0_2px_0_rgb(255_255_255_/_0.7)]" />
            <div className="h-24 rounded-[1.5rem] border border-white bg-[linear-gradient(135deg,#fff8eb,#bfeaf5)] shadow-[inset_0_2px_0_rgb(255_255_255_/_0.7)]" />
            <div className="h-24 rounded-[1.5rem] border border-white bg-[linear-gradient(135deg,#ffd56f,#fff8eb)] shadow-[inset_0_2px_0_rgb(255_255_255_/_0.7)]" />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((item) => (
          <div className="photo-card-soft text-sm font-black text-[var(--color-ink)]" key={item}>
            <span className="mr-2 text-[var(--color-primary)]">✦</span>
            {item}
          </div>
        ))}
      </section>
    </main>
  );
}
