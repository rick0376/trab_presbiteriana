//src/app/api/publico/footer/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const igreja = await prisma.igreja.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      publico: {
        include: {
          horarios: {
            orderBy: { ordem: "asc" },
          },
        },
      },
    },
  });

  if (!igreja) {
    return NextResponse.json({
      churchName: "Igreja Presbiteriana Renovada",
      bannerSubtitle:
        "Uma comunidade de fé, comunhão e transformação de vidas pelo amor de Cristo.",
      footerDescricao:
        "Uma comunidade de fé, comunhão e transformação de vidas pelo amor de Cristo.",
      endereco: "Endereço não informado",
      whatsappUrl: null,
      telefonePublico: null,
      instagramUrl: null,
      facebookUrl: null,
      horarios: [],
      email: "lhpsystems0376@gmail.com",
    });
  }

  return NextResponse.json({
    churchName: igreja.nome,
    bannerSubtitle:
      igreja.publico?.bannerSubtitle ||
      "Uma comunidade de fé, comunhão e transformação de vidas pelo amor de Cristo.",
    footerDescricao:
      igreja.publico?.footerDescricao ||
      igreja.publico?.bannerSubtitle ||
      "Uma comunidade de fé, comunhão e transformação de vidas pelo amor de Cristo.",
    endereco: igreja.publico?.endereco || "Endereço não informado",
    whatsappUrl: igreja.publico?.whatsappUrl || null,
    telefonePublico: igreja.publico?.telefonePublico || null,
    instagramUrl: igreja.publico?.instagramUrl || null,
    facebookUrl: igreja.publico?.facebookUrl || null,
    horarios: igreja.publico?.horarios ?? [],
    email: igreja.publico?.emailPublico || "lhpsystems0376@gmail.com",
  });
}
