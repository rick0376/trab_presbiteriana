//src/app/(private)/dashboard/publico/conteudo-publico/page.tsx

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { requireUser } from "@/lib/auth";
import EditorPublico from "@/components/igreja-publico/EditorPublico/EditorPublico";

export const dynamic = "force-dynamic";

type SearchParams = {
  igrejaId?: string;
};

export default async function ConteudoPublicoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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

  const params = await searchParams;
  let igrejaId = me.igrejaId ?? null;

  if (!igrejaId && me.role === "SUPERADMIN") {
    const selected = params?.igrejaId?.trim();
    if (!selected) return null;

    const exists = await prisma.igreja.findUnique({
      where: { id: selected },
      select: { id: true },
    });

    if (!exists) return null;

    igrejaId = selected;
  }

  if (!igrejaId) return null;

  const publico = await prisma.igrejaPublico.upsert({
    where: { igrejaId },
    update: {},
    create: {
      igrejaId,
      bannerSubtitle: "",
      heroSlogan: "",
      boasVindasTexto: "",
      pastorNome: "",
      pastorCargo: "",
      pastorSubtitle: "",
      pastorMensagem: "",
      pastorImageUrl: "",
      pastorImagePublicId: "",
      heroBackgroundImageUrl: "",
      heroBackgroundImagePublicId: "",
      whatsappUrl: "",
      instagramUrl: "",
      facebookUrl: "",
      endereco: "",
      telefonePublico: "",
      emailPublico: "",
      footerDescricao: "",
    },
    include: {
      igreja: {
        select: {
          nome: true,
        },
      },
      horarios: { orderBy: { ordem: "asc" } },
      cronograma: { orderBy: [{ dia: "asc" }, { ordem: "asc" }] },
    },
  });

  return <EditorPublico initialData={publico} canEdit={canEdit} />;
}
