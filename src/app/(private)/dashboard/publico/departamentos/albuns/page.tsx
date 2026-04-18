//src/app/(private)/dashboard/publico/departamentos/albuns/page.tsx

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { requireUser } from "@/lib/auth";
import EditorAlbunsDepartamento from "@/components/igreja-publico/departamentos/EditorAlbunsDepartamento/EditorAlbunsDepartamento";

export const dynamic = "force-dynamic";

export default async function DepartamentosAlbunsPage() {
  await requirePermission("departamentos_albuns", "ler");

  const me = await requireUser();

  const canEdit =
    me.role === "SUPERADMIN"
      ? true
      : !!(
          await prisma.permissao.findUnique({
            where: {
              userId_recurso: {
                userId: me.id,
                recurso: "departamentos_albuns",
              },
            },
            select: { editar: true },
          })
        )?.editar;

  const igrejaId = me.igrejaId ?? null;

  if (!igrejaId) return null;

  const departamentos = await prisma.departamento.findMany({
    where: { igrejaId },
    select: {
      id: true,
      nome: true,
      slug: true,
      ativo: true,
    },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
  });

  return (
    <EditorAlbunsDepartamento
      igrejaId={igrejaId}
      canEdit={canEdit}
      departamentos={departamentos}
    />
  );
}
