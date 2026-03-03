import { requirePermission } from "@/lib/permissions";
import EditorCronogramaAnual from "@/components/igreja-publico/CronogramaAnual/EditorCronogramaAnual/EditorCronogramaAnual";

export const dynamic = "force-dynamic";

export default async function CronogramaAnualPage() {
  const user = await requirePermission("publico", "ler");

  if (!user.igrejaId) return null;

  return <EditorCronogramaAnual igrejaId={user.igrejaId} />;
}
