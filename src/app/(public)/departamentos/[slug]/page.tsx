//src/app/(public)/departamentos/[slug]/page.tsx

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DepartamentoDetalhePublico from "@/components/igreja-publico/DepartamentoDetalhePublico/DepartamentoDetalhePublico";

export const dynamic = "force-dynamic";

export default async function DepartamentoDetalhePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const igreja = await prisma.igreja.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nome: true,
      slug: true,
      publico: {
        select: {
          whatsappUrl: true,
        },
      },
    },
  });

  if (!igreja) notFound();

  const item = await prisma.departamento.findFirst({
    where: {
      igrejaId: igreja.id,
      slug,
      ativo: true,
    },
    include: {
      responsaveis: {
        where: { ativo: true },
        include: {
          membro: {
            select: {
              id: true,
              nome: true,
              cargo: true,
              numeroSequencial: true,
            },
          },
        },
        orderBy: { ordem: "asc" },
      },
      albuns: {
        where: { ativo: true },
        include: {
          imagens: {
            orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: [
          { ordem: "asc" },
          { dataEvento: "desc" },
          { createdAt: "desc" },
        ],
      },
    },
  });

  if (!item) notFound();

  return (
    <DepartamentoDetalhePublico
      churchName={igreja.nome}
      whatsappUrl={igreja.publico?.whatsappUrl ?? null}
      item={item}
    />
  );
}
