//src/app/api/radio/stats/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/radioDb";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const row = await prisma.radioStatsHistory.create({
      data: {
        current: Number(body.current ?? 0),
        peak: Number(body.peak ?? 0),
        max: Number(body.max ?? 0),
        online: !!body.online,
        uptime: typeof body.uptime === "number" ? body.uptime : null,
      },
    });

    return NextResponse.json({
      ok: true,
      id: row.id,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Erro ao salvar histórico da rádio:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
