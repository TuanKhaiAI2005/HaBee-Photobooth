import { requireAdmin } from "@/lib/auth/guards";
import { createQrPngDataUrl, getJoinPublicUrl } from "@/lib/public/qr";

export default async function AdminGlobalQrPrintPage() {
  await requireAdmin();
  const publicUrl = getJoinPublicUrl();
  const qrPng = await createQrPngDataUrl(publicUrl);

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-cream)] p-8 text-center text-[var(--color-navy)]">
      <section className="grid gap-5">
        <p className="text-sm font-black uppercase">PhotoBooth</p>
        <h1 className="text-4xl font-black">Quét mã để chọn phòng và lấy số thứ tự</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="QR chung PhotoBooth" className="mx-auto h-96 w-96 bg-[var(--color-surface)] p-4" src={qrPng} />
        <p className="break-all text-lg font-bold">{publicUrl}</p>
      </section>
    </main>
  );
}
