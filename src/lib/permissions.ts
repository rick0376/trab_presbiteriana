// src/lib/permissions.ts

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type TipoPermissao = "ler" | "criar" | "editar" | "deletar" | "compartilhar";

export async function requirePermission(recurso: string, tipo: TipoPermissao) {
  const user = await requireUser();

  // ✅ SUPERADMIN tem acesso total sempre
  if (user.role === "SUPERADMIN") return user;

  // ❌ qualquer outro role precisa ter permissão no banco
  const perm = await prisma.permissao.findUnique({
    where: {
      userId_recurso: {
        userId: user.id,
        recurso,
      },
    },
    select: {
      ler: true,
      criar: true,
      editar: true,
      deletar: true,
      compartilhar: true,
    },
  });

  // se não existe linha de permissão -> bloqueia
  if (!perm) redirect("/sem-permissao");

  // se o tipo está false -> bloqueia
  if (!perm[tipo]) redirect("/sem-permissao");

  return user;
}
