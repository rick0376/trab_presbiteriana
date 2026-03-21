//src/app/(private)/secretaria/escola-dominical/gestaoEbd/page.tsx

import { requireUser } from "@/lib/auth";
import EscolaDominicalPageClient from "@/components/secretaria/escola-dominical/page/EscolaDominicalPageClient";

export default async function GestaoEbdPage() {
  const user = await requireUser();

  return <EscolaDominicalPageClient igrejaId={user.igrejaId ?? ""} />;
}
