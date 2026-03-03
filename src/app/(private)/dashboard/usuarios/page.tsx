//src/app/(private)/dashboard/usuarios/page.tsx

import { requirePermission } from "@/lib/permissions";
import UsuariosPageClient from "@/components/dashboard/usuarios/UsuariosPageClient";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const user = await requirePermission("usuarios", "ler");

  return <UsuariosPageClient userRole={user.role} igrejaId={user.igrejaId} />;
}
