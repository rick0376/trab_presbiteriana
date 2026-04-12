//src/app/(private)/dashboard/publico/historia/page.tsx

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { requireUser } from "@/lib/auth";
import EditorHistoriaIgreja from "@/components/igreja-publico/historia/EditorHistoriaIgreja/EditorHistoriaIgreja";

export const dynamic = "force-dynamic";

export default async function HistoriaIgrejaPage() {
  await requirePermission("publico", "ler");

  const me = await requireUser();

  const canEdit =
    me.role === "SUPERADMIN"
      ? true
      : !!(
          await prisma.permissao.findUnique({
            where: { userId_recurso: { userId: me.id, recurso: "publico" } },
            select: { editar: true },
          })
        )?.editar;

  let igrejaId = me.igrejaId ?? null;

  if (!igrejaId && me.role === "SUPERADMIN") {
    return null;
  }

  if (!igrejaId) return null;

  const historia = await prisma.historiaIgreja.upsert({
    where: { igrejaId },
    update: {},
    create: {
      igrejaId,
      titulo: "Nossa História",
      subtitulo: "",
      texto: "",
    },
    include: {
      marcos: {
        orderBy: { ordem: "asc" },
      },
    },
  });

  return (
    <EditorHistoriaIgreja
      igrejaId={igrejaId}
      initialData={historia}
      canEdit={canEdit}
    />
  );
}
