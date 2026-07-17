import { NextResponse, type NextRequest } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { createQrSvg, getRoomPublicUrl } from "@/lib/public/qr";

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

  const svg = await createQrSvg(getRoomPublicUrl(room.publicToken));

  return new NextResponse(svg, {
    headers: {
      "Content-Disposition": `attachment; filename="${room.publicToken}.svg"`,
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
