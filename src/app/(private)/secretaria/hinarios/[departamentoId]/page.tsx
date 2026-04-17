//src/app/(private)/secretaria/hinarios/[departamentoId]/page.tsx

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import EditorHinarioDepartamento from "@/components/hinarios/EditorHinarioDepartamento/EditorHinarioDepartamento";

export const dynamic = "force-dynamic";

export default async function HinarioDepartamentoPage({
  params,
}: {
  params: Promise<{ departamentoId: string }>;
}) {
  await requirePermission("hinarios", "ler");

  const { departamentoId } = await params;

  const departamento = await prisma.departamento.findUnique({
    where: { id: departamentoId },
    select: {
      id: true,
      nome: true,
    },
  });

  if (!departamento) notFound();

  return (
    <EditorHinarioDepartamento
      departamentoId={departamento.id}
      departamentoNome={departamento.nome}
    />
  );
}
