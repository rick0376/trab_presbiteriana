///api/radio/admin/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma, ensureRadioRow } from "@/lib/radioDb";
import { getCurrentUser } from "@/lib/auth";

// 🔒 Atualiza status da rádio
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { live, streamUrl } = body;

    await ensureRadioRow();

    const data: any = {
      live: !!live,
    };

    if (typeof streamUrl === "string") {
      const trimmed = streamUrl.trim();
      data.streamUrl = trimmed.length > 0 ? trimmed : null;
    }

    const row = await prisma.radioStatus.update({
      where: { id: "main" },
      data,
    });

    return NextResponse.json({
      ok: true,
      live: row.live,
      streamUrl: row.streamUrl,
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Erro ao atualizar rádio:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// 🔒 Retorna status da rádio (apenas logado)
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await ensureRadioRow();

    const row = await prisma.radioStatus.findUnique({
      where: { id: "main" },
    });

    return NextResponse.json({
      live: !!row?.live,
      streamUrl: row?.streamUrl ?? null,
      updatedAt: row?.updatedAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao buscar rádio:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
