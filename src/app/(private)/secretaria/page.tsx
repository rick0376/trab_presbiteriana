import { requireUser } from "@/lib/auth";
import SecretariaDashboard from "@/components/secretaria/dashboard/SecretariaDashboard";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ igrejaId?: string }>;
}) {
  await requireUser();

  const sp = await searchParams;

  return <SecretariaDashboard selectedIgrejaId={sp.igrejaId ?? null} />;
}
