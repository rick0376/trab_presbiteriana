import EditarCargoClient from "@/components/secretaria/cargos/editar/EditarCargoClient";
import { requireUser } from "@/lib/auth";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  return <EditarCargoClient id={id} userRole={user.role} />;
}
