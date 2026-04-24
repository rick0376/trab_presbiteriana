import { requirePermission } from "@/lib/permissions";
import AdminDashboard from "@/components/radio/AdminDashboard/AdminDashboard";

export default async function AdminPage() {
  await requirePermission("radio", "ler");

  return <AdminDashboard />;
}
