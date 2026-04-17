//src/app/(private)/secretaria/hinarios/projetor/[musicaId]/page.tsx

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import ProjetorMusica from "@/components/hinarios/ProjetorMusica/ProjetorMusica";

export const dynamic = "force-dynamic";

export default async function ProjetorMusicaPage({
  params,
}: {
  params: Promise<{ musicaId: string }>;
}) {
  await requirePermission("hinarios", "ler");

  const { musicaId } = await params;

  const musica = await prisma.departamentoMusica.findUnique({
    where: { id: musicaId },
    include: {
      departamento: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  if (!musica) notFound();

  return (
    <ProjetorMusica
      musica={{
        id: musica.id,
        titulo: musica.titulo,
        letra: musica.letra,
        departamentoNome: musica.departamento.nome,
      }}
    />
  );
}
