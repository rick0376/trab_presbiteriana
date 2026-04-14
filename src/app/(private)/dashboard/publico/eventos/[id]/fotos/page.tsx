//src/app/(private)/dashboard/publico/eventos/[id]/fotos/page.tsx

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { requireUser } from "@/lib/auth";
import EditorEventoFotos from "@/components/igreja-publico/eventos/EditorEventoFotos/EditorEventoFotos";

export const dynamic = "force-dynamic";

async function resolveIgrejaId(user: {
  id: string;
  role: string;
  igrejaId?: string | null;
}) {
  if (user.igrejaId) return user.igrejaId;

  const igreja = await prisma.igreja.findFirst({
    where: { adminId: user.id },
    select: { id: true },
  });

  return igreja?.id ?? null;
}

export default async function EventoFotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("publico", "ler");

  const me = await requireUser();
  const igrejaId = await resolveIgrejaId(me);

  if (!igrejaId) return null;

  const canEdit =
    me.role === "SUPERADMIN"
      ? true
      : !!(
          await prisma.permissao.findUnique({
            where: { userId_recurso: { userId: me.id, recurso: "publico" } },
            select: { editar: true },
          })
        )?.editar;

  const { id } = await params;

  const evento = await prisma.evento.findFirst({
    where: {
      id,
      igrejaId,
    },
    select: {
      id: true,
      titulo: true,
    },
  });

  if (!evento) return null;

  return (
    <EditorEventoFotos
      igrejaId={igrejaId}
      eventoId={evento.id}
      eventoTitulo={evento.titulo}
      canEdit={canEdit}
    />
  );
}
