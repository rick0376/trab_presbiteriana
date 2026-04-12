//src/app/api/radio/programacao/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requirePermission("radio_live", "editar");

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const titulo = String(body?.titulo ?? "").trim();
  const diaSemana = String(body?.diaSemana ?? "").trim();
  const horaInicio = String(body?.horaInicio ?? "").trim();
  const horaFim = String(body?.horaFim ?? "").trim();

  if (!titulo || !diaSemana || !horaInicio || !horaFim) {
    return NextResponse.json(
      { error: "Preencha título, dia, hora inicial e hora final." },
      { status: 400 },
    );
  }

  const item = await prisma.radioProgramacao.update({
    where: { id },
    data: {
      titulo,
      diaSemana: diaSemana as any,
      horaInicio,
      horaFim,
      subtitulo: String(body?.subtitulo ?? "").trim() || null,
      responsavel: String(body?.responsavel ?? "").trim() || null,
      ativo: !!body?.ativo,
      ordem: Number(body?.ordem ?? 1),
    },
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requirePermission("radio_live", "editar");

  const { id } = await params;

  await prisma.radioProgramacao.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
