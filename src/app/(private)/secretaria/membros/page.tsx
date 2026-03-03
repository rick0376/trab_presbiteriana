//src/app/(private)/secretaria/membros/page.tsx

import { requirePermission } from "@/lib/permissions";
import SecretariaPageClient from "@/components/secretaria/membros/SecretariaPageClient";

export default async function SecretariaPage() {
  await requirePermission("membros", "ler");
  return <SecretariaPageClient />;
}
