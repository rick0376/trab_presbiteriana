import { requireUser } from "@/lib/auth";
import NovoMembroClient from "@/components/secretaria/membros/novo/NovoMembroClient";

export default async function Page() {
  const user = await requireUser();
  return <NovoMembroClient userRole={user.role} />;
}
