//src/app/(private)/secretaria/escola-dominical/page.tsx

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardEscolaDominical from "@/components/secretaria/escola-dominical/dashboard/DashboardEscolaDominical";

export default async function EscolaDominicalPage() {
  const user = await requireUser();
  const igrejaId = user.igrejaId ?? "";

  let igrejaNome = "";

  if (igrejaId) {
    const igreja = await prisma.igreja.findUnique({
      where: { id: igrejaId },
      select: { nome: true },
    });

    igrejaNome = igreja?.nome ?? "";
  }

  return (
    <DashboardEscolaDominical igrejaId={igrejaId} igrejaNome={igrejaNome} />
  );
}
