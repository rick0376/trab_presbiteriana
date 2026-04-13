//src/app/(private)/dashboard/publico/departamentos/page.tsx

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { requireUser } from "@/lib/auth";
import EditorDepartamentos from "@/components/igreja-publico/departamentos/EditorDepartamentos/EditorDepartamentos";

export const dynamic = "force-dynamic";

export default async function DepartamentosPage() {
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

  return <EditorDepartamentos igrejaId={igrejaId} canEdit={canEdit} />;
}
