import { NextResponse } from "next/server";
import { prisma } from "@/lib/radioDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const r = await fetch("http://usa16.fastcast4u.com:22843/stats?json=1", {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!r.ok) {
        return NextResponse.json(
          { error: "Falha ao consultar servidor da rádio" },
          { status: 502 },
        );
      }

      const j = await r.json();

      const row = await prisma.radioStatsHistory.create({
        data: {
          current: Number(j.currentlisteners ?? 0),
          peak: Number(j.peaklisteners ?? 0),
          max: Number(j.maxlisteners ?? 0),
          uptime: Number(j.streamuptime ?? 0),
          online: Number(j.streamstatus ?? 0) === 1,
        },
      });

      return NextResponse.json({
        ok: true,
        savedAt: row.createdAt.toISOString(),
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("Erro no cron da rádio:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
