import { NextResponse, type NextRequest } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { createQrPngDataUrl, getRoomPublicUrl } from "@/lib/public/qr";

type QrRouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function GET(_request: NextRequest, { params }: QrRouteContext) {
  await requireAdmin();
  const { roomId } = await params;
  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) {
    notFound();
  }

  const dataUrl = await createQrPngDataUrl(getRoomPublicUrl(room.publicToken));
  const base64 = dataUrl.split(",")[1];

  return new NextResponse(Buffer.from(base64, "base64"), {
    headers: {
      "Content-Disposition": `attachment; filename="${room.publicToken}.png"`,
      "Content-Type": "image/png",
    },
  });
}
