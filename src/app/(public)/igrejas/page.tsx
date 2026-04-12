//src/app/(public)/igrejas/page.tsx

import { prisma } from "@/lib/prisma";
import IgrejasPageClient from "@/components/igreja-publico/IgrejasPage/IgrejasPageClient";

export const dynamic = "force-dynamic";

export default async function IgrejasPage() {
  const igrejas = await prisma.igreja.findMany({
    select: { id: true, nome: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  const first = igrejas[0];

  const publico = first
    ? await prisma.igrejaPublico.findUnique({
        where: { igrejaId: first.id },
        include: {
          horarios: { orderBy: { ordem: "asc" } },
          cronograma: { orderBy: [{ dia: "asc" }, { ordem: "asc" }] },
        },
      })
    : null;

  return <IgrejasPageClient igrejas={igrejas} initialPublico={publico} />;
}
