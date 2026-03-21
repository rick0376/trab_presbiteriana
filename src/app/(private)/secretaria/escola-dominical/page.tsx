//src/app/(private)/secretaria/escola-dominical/page.tsx

import { requireUser } from "@/lib/auth";
import DashboardEscolaDominical from "@/components/secretaria/escola-dominical/dashboard/DashboardEscolaDominical";

export default async function EscolaDominicalPage() {
  const user = await requireUser();

  return <DashboardEscolaDominical igrejaId={user.igrejaId ?? ""} />;
}
