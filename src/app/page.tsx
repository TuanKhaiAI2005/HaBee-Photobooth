import Link from "next/link";
import { BrandMark } from "@/app/components/brand-mark";

const highlights = [
  "Khach quet QR de lay so thu tu",
  "Quan ly luot goi va thoi gian chup",
  "Staff xem trang thai phong theo thoi gian thuc",
];

const steps = [
  { label: "01", text: "Khach chon phong va nhan ve" },
  { label: "02", text: "Quan ly goi khach khi den luot" },
  { label: "03", text: "Phong chup cap nhat dang cho, dang chup, hoan tat" },
];

export default function Home() {
  return (
    <main className="photo-shell photo-home-shell">
      <section className="photo-card photo-home-card grid gap-8 md:grid-cols-[1.08fr_0.92fr] md:items-center">
        <div>
          <BrandMark />
          <h1 className="mt-6 max-w-2xl text-3xl font-black leading-tight text-[var(--color-ink)] sm:text-5xl">
            He thong xep hang cho photobooth HaBee
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--color-muted-text)]">
            Mot noi gon gang de khach lay ve, quan ly goi luot va staff theo doi
            trang thai phong chup.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="photo-button" href="/join">
              Lay ve cho
            </Link>
            <Link className="photo-button-secondary" href="/admin">
              Quan ly
            </Link>
          </div>
        </div>

        <div className="photo-home-panel">
          <p className="text-sm font-black uppercase text-[var(--color-primary-deep)]">
            Quy trinh don gian
          </p>
          <div className="mt-5 grid gap-3">
            {steps.map((step) => (
              <div className="photo-step" key={step.label}>
                <span>{step.label}</span>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {highlights.map((item) => (
          <div className="photo-home-note text-sm font-bold text-[var(--color-ink)]" key={item}>
            {item}
          </div>
        ))}
      </section>
    </main>
  );
}
