// src/app/(private)/dashboard/permissoes/page.tsx

import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PermissionsManager from "@/components/permissoes/PermissoesManager";

export default async function PermissionsPage() {
  const user = await requireUser();

  if (user.role === "SUPERADMIN") {
    return (
      <div>
        <h1>Gerenciar Permissões</h1>
        <PermissionsManager
          currentUserId={user.id}
          currentUserRole={user.role}
        />
      </div>
    );
  }

  const permissao = await prisma.permissao.findUnique({
    where: {
      userId_recurso: {
        userId: user.id,
        recurso: "permissoes",
      },
    },
    select: {
      ler: true,
      editar: true,
    },
  });

  if (!permissao?.ler) {
    redirect("/sem-permissao");
  }

  return (
    <div>
      <h1>Gerenciar Permissões</h1>
      <PermissionsManager currentUserId={user.id} currentUserRole={user.role} />
    </div>
  );
}
