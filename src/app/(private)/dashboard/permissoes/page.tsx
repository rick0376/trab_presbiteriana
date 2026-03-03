// src/app/(private)/dashboard/permissoes/page.tsx

import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import PermissionsManager from "@/components/permissoes/PermissoesManager";

export default async function PermissionsPage() {
  const user = await requireUser();

  // Apenas SUPERADMIN pode gerenciar permissões
  if (user.role !== "SUPERADMIN") {
    redirect("/sem-permissao");
  }

  return (
    <div>
      <h1>Gerenciar Permissões</h1>
      <PermissionsManager currentUserId={user.id} currentUserRole={user.role} />
    </div>
  );
}
