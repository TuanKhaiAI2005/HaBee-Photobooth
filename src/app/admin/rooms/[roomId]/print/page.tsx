import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { createQrPngDataUrl, getRoomPublicUrl } from "@/lib/public/qr";

export const dynamic = "force-dynamic";

type PrintQrPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function PrintQrPage({ params }: PrintQrPageProps) {
  await requireAdmin();
  const { roomId } = await params;
  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) {
    notFound();
  }

  const publicUrl = getRoomPublicUrl(room.publicToken);
  const qrPng = await createQrPngDataUrl(publicUrl);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-8 py-10 text-center print:min-h-0">
      <h1 className="text-4xl font-bold text-[var(--color-navy)]">{room.name}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={`QR ${room.name}`} className="h-96 w-96 bg-[var(--color-surface)] p-4" src={qrPng} />
      <p className="text-2xl font-semibold">Quét QR để đăng ký hàng đợi</p>
      <p className="break-all text-sm text-[var(--color-muted-text)]">{publicUrl}</p>
      <p className="text-sm text-[var(--color-muted-text)] print:hidden">Dùng Ctrl+P hoặc chức năng in của trình duyệt.</p>
    </main>
  );
}



