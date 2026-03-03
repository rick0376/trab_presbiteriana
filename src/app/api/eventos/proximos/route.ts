// api/eventos/proximos/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();

  if (!slug) return NextResponse.json({ eventos: [] });

  const igreja = await prisma.igreja.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!igreja) return NextResponse.json({ eventos: [] });

  /* Caso precise de ocultar antes do início descomente isto e comente o Tolerância
  //Tolerância oculta antes do início.
  const advanceMinutes = 60;
  const localNow = new Date();
  localNow.setMinutes(localNow.getMinutes() + advanceMinutes);
*/

  // tolerância após horário inicial
  const toleranceMinutes = 90;

  const now = new Date();
  now.setHours(now.getHours() - 3); // força Brasil
  now.setMinutes(now.getMinutes() - toleranceMinutes);

  const eventos = await prisma.evento.findMany({
    where: { igrejaId: igreja.id, data: { gte: now } },
    select: {
      id: true,
      titulo: true,
      data: true,
      imagemUrl: true,
      tipo: true,
      responsavel: true,
      local: true,
      descricao: true,
    },
    orderBy: { data: "asc" },
    take: 4,
  });

  return NextResponse.json({
    eventos: eventos.map((e) => ({
      id: e.id,
      titulo: e.titulo,
      data: e.data.toJSON(),
      imagemUrl: e.imagemUrl,
      tipo: e.tipo,
      responsavel: e.responsavel,
      local: e.local,
      descricao: e.descricao,
    })),
  });
}
