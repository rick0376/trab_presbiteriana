//src/app/api/radio/programacao/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

type DiaSemana =
  | "SEGUNDA"
  | "TERCA"
  | "QUARTA"
  | "QUINTA"
  | "SEXTA"
  | "SABADO"
  | "DOMINGO";

const DIA_ORDEM: Record<DiaSemana, number> = {
  SEGUNDA: 1,
  TERCA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
  SABADO: 6,
  DOMINGO: 7,
};

export const dynamic = "force-dynamic";

export async function GET() {
  await requirePermission("radio_live", "ler");

  const items = await prisma.radioProgramacao.findMany();

  const sorted = items.sort((a, b) => {
    const diffDia =
      DIA_ORDEM[a.diaSemana as DiaSemana] - DIA_ORDEM[b.diaSemana as DiaSemana];
    if (diffDia !== 0) return diffDia;

    const diffHora = a.horaInicio.localeCompare(b.horaInicio);
    if (diffHora !== 0) return diffHora;

    return a.ordem - b.ordem;
  });

  return NextResponse.json({ items: sorted });
}

export async function POST(req: Request) {
  await requirePermission("radio_live", "editar");

  const body = await req.json().catch(() => ({}));

  const titulo = String(body?.titulo ?? "").trim();
  const diaSemana = String(body?.diaSemana ?? "").trim() as DiaSemana;
  const horaInicio = String(body?.horaInicio ?? "").trim();
  const horaFim = String(body?.horaFim ?? "").trim();

  if (!titulo || !diaSemana || !horaInicio || !horaFim) {
    return NextResponse.json(
      { error: "Preencha título, dia, hora inicial e hora final." },
      { status: 400 },
    );
  }

  const item = await prisma.radioProgramacao.create({
    data: {
      titulo,
      diaSemana,
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
