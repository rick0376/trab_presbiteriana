//src/app/api/radio/admin/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma, ensureRadioRow } from "@/lib/radioDb";
import { getCurrentUser } from "@/lib/auth";

// 🔎 Verifica permissão pelo índice composto @@unique([userId, recurso])
async function checkPermission(
  userId: string,
  recurso: string,
  campo: "ler" | "criar" | "editar" | "deletar" | "compartilhar",
) {
  const perm = await prisma.permissao.findUnique({
    where: {
      userId_recurso: {
        userId,
        recurso,
      },
    },
  });

  return !!perm?.[campo];
}

// 🔴 POST - Atualiza rádio
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { live, streamUrl } = body;

    await ensureRadioRow();

    // 🔐 SUPERADMIN ignora permissões
    if (user.role !== "SUPERADMIN") {
      // 🔒 Permissão para ligar/desligar
      if (typeof live !== "undefined") {
        const podeLive = await checkPermission(user.id, "radio_live", "editar");

        if (!podeLive) {
          return NextResponse.json(
            { error: "Sem permissão para ligar/desligar rádio" },
            { status: 403 },
          );
        }
      }

      // 🔒 Permissão para editar URL
      if (typeof streamUrl === "string") {
        const podeUrl = await checkPermission(user.id, "radio_url", "editar");

        if (!podeUrl) {
          return NextResponse.json(
            { error: "Sem permissão para editar URL" },
            { status: 403 },
          );
        }
      }
    }

    const data: any = {};

    if (typeof live !== "undefined") {
      data.live = !!live;
    }

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

// 🔵 GET - Apenas precisa estar logado
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
