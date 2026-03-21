//src/app/(private)/secretaria/escola-dominical/editar/[id]/page.tsx

import { requireUser } from "@/lib/auth";
import FormEscolaDominical from "@/components/secretaria/escola-dominical/form/FormEscolaDominical";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarTurmaEbdPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  return (
    <FormEscolaDominical
      modo="editar"
      turmaId={id}
      igrejaId={user.igrejaId ?? ""}
    />
  );
}
