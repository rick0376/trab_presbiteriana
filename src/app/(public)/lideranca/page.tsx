//src/app/(public)/lideranca/page.tsx

import { prisma } from "@/lib/prisma";
import LiderancaPaginaPublica from "@/components/igreja-publico/LiderancaPaginaPublica/LiderancaPaginaPublica";

export const dynamic = "force-dynamic";

export default async function LiderancaPage() {
  const igreja = await prisma.igreja.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      nome: true,
      publico: {
        select: {
          pastorNome: true,
          pastorCargo: true,
          pastorSubtitle: true,
          pastorMensagem: true,
          pastorImageUrl: true,
          whatsappUrl: true,
        },
      },
      departamentos: {
        where: { ativo: true },
        orderBy: [{ ordem: "asc" }, { nome: "asc" }],
        select: {
          id: true,
          nome: true,
          slug: true,
          responsaveis: {
            where: { ativo: true },
            orderBy: { ordem: "asc" },
            select: {
              id: true,
              cargoTitulo: true,
              bio: true,
              fotoUrl: true,
              membro: {
                select: {
                  nome: true,
                  cargo: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!igreja) return null;

  return (
    <LiderancaPaginaPublica
      churchName={igreja.nome}
      pastor={{
        nome: igreja.publico?.pastorNome ?? "Pastor Presidente",
        cargo: igreja.publico?.pastorCargo ?? "Pastor",
        subtitle:
          igreja.publico?.pastorSubtitle ??
          "Servindo com amor, cuidado pastoral e compromisso com a Palavra.",
        mensagem:
          igreja.publico?.pastorMensagem ??
          "Seja bem-vindo à nossa igreja. É uma alegria ter você conosco.",
        imagem: igreja.publico?.pastorImageUrl ?? "/images/pastor.png",
      }}
      whatsappUrl={igreja.publico?.whatsappUrl ?? null}
      departamentos={igreja.departamentos ?? []}
    />
  );
}
