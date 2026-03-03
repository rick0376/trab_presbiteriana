//src/app/(private)/dashboard/publico/eventos/page.tsx

import { requirePermission } from "@/lib/permissions";
import EditorEventos from "@/components/igreja-publico/eventos/EditorEventos/EditorEventos";

export const dynamic = "force-dynamic";

export default async function EventosPage() {
  const user = await requirePermission("publico", "ler");

  if (!user.igrejaId) return null;

  return <EditorEventos igrejaId={user.igrejaId} canEdit={true} />;
}
