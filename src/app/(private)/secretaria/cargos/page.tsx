//src/app/(private)/secretaria/cargos/page.tsx

import { requirePermission } from "@/lib/permissions";
import CargosPageClient from "@/components/secretaria/cargos/CargosPageClient";

export default async function Page() {
  const user = await requirePermission("cargos", "ler");
  return <CargosPageClient userRole={user.role} />;
}
