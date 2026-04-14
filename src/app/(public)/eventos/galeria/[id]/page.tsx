//src/app/(public)/eventos/galeria/[id]/page.tsx

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EventoGaleriaDetalhePublico from "@/components/igreja-publico/eventos/EventoGaleriaDetalhePublico/EventoGaleriaDetalhePublico";

export const dynamic = "force-dynamic";

export default async function EventoGaleriaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const evento = await prisma.evento.findFirst({
    where: { id },
    include: {
      imagens: {
        orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
      },
      igreja: {
        select: {
          nome: true,
        },
      },
    },
  });

  if (!evento) notFound();

  return <EventoGaleriaDetalhePublico item={evento} />;
}
