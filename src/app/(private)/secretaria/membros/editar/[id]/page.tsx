import { requireUser } from "@/lib/auth";
import EditarMembroClient from "@/components/secretaria/membros/editar/EditarMembroClient";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await props.params;
  return <EditarMembroClient id={id} />;
}
