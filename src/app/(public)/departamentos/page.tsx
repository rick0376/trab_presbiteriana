//src/app/(public)/departamentos/page.tsx

import { prisma } from "@/lib/prisma";
import DepartamentosPaginaPublica from "@/components/igreja-publico/DepartamentosPaginaPublica/DepartamentosPaginaPublica";

export const dynamic = "force-dynamic";

export default async function DepartamentosPublicPage() {
  const igreja = await prisma.igreja.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      departamentos: {
        where: { ativo: true },
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
        },
        orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      },
    },
  });

  return (
    <DepartamentosPaginaPublica
      churchName={igreja?.nome ?? "Igreja Presbiteriana Renovada"}
      items={igreja?.departamentos ?? []}
    />
  );
}
