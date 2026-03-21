//src/app/(private)/secretaria/escola-dominical/relatorio-periodo/page.tsx

import { requireUser } from "@/lib/auth";
import RelatorioPeriodoEbd from "@/components/secretaria/escola-dominical/relatorio-periodo/RelatorioPeriodoEbd";

export default async function RelatorioPeriodoEbdPage() {
  const user = await requireUser();

  return <RelatorioPeriodoEbd igrejaId={user.igrejaId ?? ""} />;
}
