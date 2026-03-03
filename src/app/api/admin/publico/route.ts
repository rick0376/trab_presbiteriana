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

  // ✅ Detecta o que realmente veio no body
  const hasBannerSubtitle = body?.bannerSubtitle !== undefined;
  const hasWhatsappUrl = body?.whatsappUrl !== undefined;
  const hasHorarios = Array.isArray(body?.horarios);
  const hasCronograma = Array.isArray(body?.cronograma);

  const bannerSubtitle = hasBannerSubtitle
    ? String(body.bannerSubtitle ?? "")
    : undefined;
  const whatsappUrl = hasWhatsappUrl
    ? String(body.whatsappUrl ?? "")
    : undefined;

  const horarios = hasHorarios ? body.horarios : undefined;
  const cronograma = hasCronograma ? body.cronograma : undefined;

  const result = await prisma.igrejaPublico.upsert({
    where: { igrejaId },
    create: {
      igrejaId,
      // no create: se não veio, cria com vazio/undefined
      bannerSubtitle: bannerSubtitle ?? "",
      whatsappUrl: whatsappUrl ?? "",

      ...(hasHorarios
        ? {
            horarios: {
              create: horarios.map((h: any) => ({
                texto: String(h.texto ?? ""),
                ordem: Number(h.ordem ?? 0),
              })),
            },
          }
        : {}),

      ...(hasCronograma
        ? {
            cronograma: {
              create: cronograma.map((c: any) => ({
                dia: c.dia,
                hora: String(c.hora ?? ""),
                titulo: String(c.titulo ?? ""),
                ordem: Number(c.ordem ?? 0),
              })),
            },
          }
        : {}),
    },
    update: {
      ...(hasBannerSubtitle ? { bannerSubtitle } : {}),
      ...(hasWhatsappUrl ? { whatsappUrl } : {}),

      ...(hasHorarios
        ? {
            horarios: {
              deleteMany: {},
              create: horarios.map((h: any) => ({
                texto: String(h.texto ?? ""),
                ordem: Number(h.ordem ?? 0),
              })),
            },
          }
        : {}),

      ...(hasCronograma
        ? {
            cronograma: {
              deleteMany: {},
              create: cronograma.map((c: any) => ({
                dia: c.dia,
                hora: String(c.hora ?? ""),
                titulo: String(c.titulo ?? ""),
                ordem: Number(c.ordem ?? 0),
              })),
            },
          }
        : {}),
    },
  });

  return NextResponse.json({ ok: true, id: result.id });
}
