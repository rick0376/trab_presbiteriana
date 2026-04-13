//src/app/(private)/dashboard/publico/departamentos/albuns/[albumId]/fotos/page.tsx

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { requireUser } from "@/lib/auth";
import EditorAlbumFotos from "@/components/igreja-publico/departamentos/EditorAlbumFotos/EditorAlbumFotos";

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

export default async function DepartamentoAlbumFotosPage({
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

  const album = await prisma.departamentoAlbum.findFirst({
    where: {
      id,
      departamento: {
        igrejaId,
      },
    },
    include: {
      departamento: {
        select: {
          id: true,
          nome: true,
          slug: true,
        },
      },
    },
  });

  if (!album) return null;

  return (
    <EditorAlbumFotos
      igrejaId={igrejaId}
      albumId={album.id}
      albumTitulo={album.titulo}
      departamentoNome={album.departamento.nome}
      canEdit={canEdit}
    />
  );
}
