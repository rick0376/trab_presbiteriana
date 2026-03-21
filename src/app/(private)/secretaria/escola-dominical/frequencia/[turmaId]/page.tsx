//src/app/(private)/secretaria/escola-dominical/frequencia/[turmaId]/page.tsx

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FrequenciaEbd from "@/components/secretaria/escola-dominical/frequencia/FrequenciaEbd";

type PageProps = {
  params: Promise<{
    turmaId: string;
  }>;
};

export default async function FrequenciaEbdPage({ params }: PageProps) {
  const user = await requireUser();
  const { turmaId } = await params;

  let igrejaNome = "";

  if (user.igrejaId) {
    const igreja = await prisma.igreja.findUnique({
      where: { id: user.igrejaId },
      select: { nome: true },
    });

    igrejaNome = igreja?.nome ?? "";
  }

  return (
    <FrequenciaEbd
      turmaId={turmaId}
      igrejaId={user.igrejaId ?? ""}
      igrejaNome={igrejaNome}
    />
  );
}
