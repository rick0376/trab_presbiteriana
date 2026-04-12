// /api/igreja-publico/[slug]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const igreja = await prisma.igreja.findUnique({
    where: { slug },
    include: {
      publico: {
        include: {
          horarios: {
            orderBy: { ordem: "asc" },
          },
          cronograma: {
            orderBy: [{ dia: "asc" }, { ordem: "asc" }],
          },
        },
      },
    },
  });

  if (!igreja) {
    return NextResponse.json(
      { error: "Igreja não encontrada" },
      { status: 404 },
    );
  }

  if (!igreja.publico) {
    return NextResponse.json({
      bannerSubtitle: null,
      heroSlogan: null,
      boasVindasTexto: null,
      pastorNome: null,
      pastorCargo: null,
      pastorSubtitle: null,
      pastorMensagem: null,
      pastorImageUrl: null,
      heroBackgroundImageUrl: null,
      whatsappUrl: null,
      instagramUrl: null,
      facebookUrl: null,
      telefonePublico: null,
      emailPublico: null,
      footerDescricao: null,
      endereco: null,
      horarios: [],
      cronograma: [],
    });
  }

  return NextResponse.json({
    bannerSubtitle: igreja.publico.bannerSubtitle,
    heroSlogan: igreja.publico.heroSlogan,
    boasVindasTexto: igreja.publico.boasVindasTexto,
    pastorNome: igreja.publico.pastorNome,
    pastorCargo: igreja.publico.pastorCargo,
    pastorSubtitle: igreja.publico.pastorSubtitle,
    pastorMensagem: igreja.publico.pastorMensagem,
    pastorImageUrl: igreja.publico.pastorImageUrl,
    heroBackgroundImageUrl: igreja.publico.heroBackgroundImageUrl,
    whatsappUrl: igreja.publico.whatsappUrl,
    instagramUrl: igreja.publico.instagramUrl,
    facebookUrl: igreja.publico.facebookUrl,
    telefonePublico: igreja.publico.telefonePublico,
    emailPublico: igreja.publico.emailPublico,
    footerDescricao: igreja.publico.footerDescricao,
    endereco: igreja.publico.endereco,
    horarios: igreja.publico.horarios.map((h) => ({
      id: h.id,
      texto: h.texto,
      diaLabel: h.diaLabel,
      hora: h.hora,
      tituloCard: h.tituloCard,
      descricaoCard: h.descricaoCard,
      ordem: h.ordem,
    })),
    cronograma: igreja.publico.cronograma,
  });
}
