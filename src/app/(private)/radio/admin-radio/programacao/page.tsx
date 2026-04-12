//src/app/(private)/radio/admin-radio/programacao/page.tsx

import { requirePermission } from "@/lib/permissions";
import EditorProgramacaoRadio from "@/components/radio/programacao/EditorProgramacaoRadio/EditorProgramacaoRadio";

export const dynamic = "force-dynamic";

export default async function ProgramacaoRadioPage() {
  await requirePermission("radio_live", "ler");
  return <EditorProgramacaoRadio />;
}
