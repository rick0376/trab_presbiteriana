import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import EditorCronogramaSemanal from "@/components/igreja-publico/CronogramaSemanal/EditorCronogramaSemanal/EditorCronogramaSemanal";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requirePermission("publico", "ler");

  if (!user.igrejaId) return null;

  const publico = await prisma.igrejaPublico.findUnique({
    where: { igrejaId: user.igrejaId },
    include: {
      cronograma: {
        orderBy: [{ dia: "asc" }, { ordem: "asc" }],
      },
    },
  });

  if (!publico) return null;

  return (
    <EditorCronogramaSemanal
      igrejaId={user.igrejaId}
      initialItems={publico.cronograma}
    />
  );
}
