export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma, ensureRadioRow } from "@/lib/radioDb";
import { getCurrentUser } from "@/lib/auth";

type RadioConfigBody = {
  status?: "AO_VIVO" | "OFFLINE" | "MANUTENCAO" | "AGUARDANDO_PROGRAMACAO";
  title?: string | null;
  subtitle?: string | null;
  nextProgramAt?: string | null;
  allowPlay?: boolean;
  badgeLabel?: string | null;
};

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

export async function GET() {
  try {
    await ensureRadioRow();

    const row = await prisma.radioStatus.findUnique({
      where: { id: "main" },
    });

    return NextResponse.json({
      status: row?.status ?? "OFFLINE",
      title: row?.title ?? "Rádio Offline",
      subtitle: row?.subtitle ?? "",
      nextProgramAt: row?.nextProgramAt ?? "",
      allowPlay: !!row?.allowPlay,
      badgeLabel: row?.badgeLabel ?? "Offline",
    });
  } catch (error) {
    console.error("Erro ao buscar config da rádio:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (user.role !== "SUPERADMIN") {
      const podeEditar = await checkPermission(user.id, "radio_live", "editar");

      if (!podeEditar) {
        return NextResponse.json(
          { error: "Sem permissão para configurar a rádio" },
          { status: 403 },
        );
      }
    }

    const body = (await req.json()) as RadioConfigBody;

    await ensureRadioRow();

    const row = await prisma.radioStatus.update({
      where: { id: "main" },
      data: {
        status: body.status ?? "OFFLINE",
        title: (body.title ?? "").trim() || "Rádio Offline",
        subtitle: (body.subtitle ?? "").trim() || "",
        nextProgramAt: (body.nextProgramAt ?? "").trim() || "",
        allowPlay: !!body.allowPlay,
        badgeLabel: (body.badgeLabel ?? "").trim() || "Offline",
      },
    });

    return NextResponse.json({
      ok: true,
      status: row.status,
      title: row.title,
      subtitle: row.subtitle,
      nextProgramAt: row.nextProgramAt,
      allowPlay: row.allowPlay,
      badgeLabel: row.badgeLabel,
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Erro ao salvar config da rádio:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
