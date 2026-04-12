//src/app/(public)/historia/page.tsx

import { prisma } from "@/lib/prisma";
import HistoriaIgrejaPublica from "@/components/igreja-publico/historia/HistoriaIgrejaPublica/HistoriaIgrejaPublica";

export const dynamic = "force-dynamic";

export default async function HistoriaPage() {
  const igreja = await prisma.igreja.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      historia: {
        include: {
          marcos: {
            orderBy: { ordem: "asc" },
          },
        },
      },
    },
  });

  return (
    <HistoriaIgrejaPublica
      churchName={igreja?.nome ?? "Igreja Presbiteriana Renovada"}
      historia={igreja?.historia ?? null}
    />
  );
}
