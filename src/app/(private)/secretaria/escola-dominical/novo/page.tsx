//src/app/(private)/secretaria/escola-dominical/novo/page.tsx

import { requireUser } from "@/lib/auth";
import FormEscolaDominical from "@/components/secretaria/escola-dominical/form/FormEscolaDominical";

export default async function NovaTurmaEbdPage() {
  const user = await requireUser();

  return <FormEscolaDominical modo="novo" igrejaId={user.igrejaId ?? ""} />;
}
