// /api/admin/publico/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export async function PUT(req: Request) {
  const user = await requirePermission("publico", "editar");

  const { searchParams } = new URL(req.url);
  const igrejaIdParam = searchParams.get("igrejaId");

  const igrejaId =
    user.role === "SUPERADMIN"
      ? (igrejaIdParam ?? undefined)
      : (user.igrejaId ?? undefined);

  if (!igrejaId) {
    return NextResponse.json({ error: "Igreja não definida" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  const bannerSubtitle = String(body?.bannerSubtitle ?? "");
  const whatsappUrl = String(body?.whatsappUrl ?? "");

  const horarios = Array.isArray(body?.horarios) ? body.horarios : [];
  const cronograma = Array.isArray(body?.cronograma) ? body.cronograma : [];

  const result = await prisma.igrejaPublico.upsert({
    where: { igrejaId },
    create: {
      igrejaId,
      bannerSubtitle,
      whatsappUrl,
      horarios: {
        create: horarios.map((h: any) => ({
          texto: String(h.texto ?? ""),
          ordem: Number(h.ordem ?? 0),
        })),
      },
      cronograma: {
        create: cronograma.map((c: any) => ({
          dia: c.dia,
          hora: String(c.hora ?? ""),
          titulo: String(c.titulo ?? ""),
          ordem: Number(c.ordem ?? 0),
        })),
      },
    },
    update: {
      bannerSubtitle,
      whatsappUrl,
      horarios: {
        deleteMany: {},
        create: horarios.map((h: any) => ({
          texto: String(h.texto ?? ""),
          ordem: Number(h.ordem ?? 0),
        })),
      },
      cronograma: {
        deleteMany: {},
        create: cronograma.map((c: any) => ({
          dia: c.dia,
          hora: String(c.hora ?? ""),
          titulo: String(c.titulo ?? ""),
          ordem: Number(c.ordem ?? 0),
        })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: result.id });
}
