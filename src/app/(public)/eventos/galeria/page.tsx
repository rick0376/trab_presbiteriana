//src/app/(public)/eventos/galeria/page.tsx

import { prisma } from "@/lib/prisma";
import GaleriaEventosPublica from "@/components/igreja-publico/eventos/GaleriaEventosPublica/GaleriaEventosPublica";

export const dynamic = "force-dynamic";

export default async function EventosGaleriaPage() {
  const igreja = await prisma.igreja.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nome: true,
    },
  });

  if (!igreja) return null;

  const eventosDb = await prisma.evento.findMany({
    where: {
      igrejaId: igreja.id,
      imagens: {
        some: {},
      },
    },
    include: {
      imagens: {
        select: {
          id: true,
          imageUrl: true,
          ordem: true,
          createdAt: true,
        },
        orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
        take: 1,
      },
      _count: {
        select: {
          imagens: true,
        },
      },
    },
    orderBy: { data: "desc" },
  });

  const eventos = eventosDb.map((evento) => ({
    id: evento.id,
    titulo: evento.titulo,
    data: evento.data.toISOString(),
    imagemUrl: evento.imagemUrl ?? null,
    local: evento.local ?? null,
    descricao: evento.descricao ?? null,
    imagens: evento.imagens.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      ordem: img.ordem,
      createdAt: img.createdAt.toISOString(),
    })),
    _count: {
      imagens: evento._count.imagens,
    },
  }));

  return <GaleriaEventosPublica churchName={igreja.nome} items={eventos} />;
}
