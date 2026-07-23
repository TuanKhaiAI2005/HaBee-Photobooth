import Link from "next/link";
import { BrandMark } from "@/app/components/brand-mark";

const highlights = [
  "Khách quét QR để lấy số thứ tự",
  "Quản lý lượt gọi và thời gian chụp",
  "Staff xem trạng thái phòng theo thời gian thực",
];

const steps = [
  { label: "01", text: "Khách chọn phòng và nhận vé" },
  { label: "02", text: "Quản lý gọi khách khi đến lượt" },
  { label: "03", text: "Phòng chụp cập nhật đang chờ, đang chụp, hoàn tất" },
];

export default function Home() {
  return (
    <main className="photo-shell photo-home-shell">
      <section className="photo-card photo-home-card grid gap-8 md:grid-cols-[1.08fr_0.92fr] md:items-center">
        <div>
          <BrandMark />
          <p className="mt-6 max-w-xl text-base font-bold leading-7 text-[var(--color-muted-text)]">
            Khách lấy vé nhanh, quầy gọi lượt gọn gàng, staff theo dõi trạng thái
            phòng chụp theo thời gian thực.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="photo-button" href="/join">
              Lấy vé chờ
            </Link>
            <Link className="photo-button-secondary" href="/admin">
              Quản lý
            </Link>
            <Link className="photo-button-secondary" href="/staff">
              Nhân viên
            </Link>
          </div>
        </div>

        <div className="photo-home-panel">
          <p className="text-sm font-black uppercase text-[var(--color-primary-deep)]">
            Quy trình đơn giản
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
