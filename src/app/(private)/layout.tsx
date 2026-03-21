//src/app/(private)/layout.tsx

import { requireUser } from "@/lib/auth";
import PrivateShell from "@/components/layout/PrivateShell";
import { prisma } from "@/lib/prisma";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  let igrejaNome = "";

  if (user.igrejaId) {
    const igreja = await prisma.igreja.findUnique({
      where: { id: user.igrejaId },
      select: { nome: true },
    });

    igrejaNome = igreja?.nome ?? "";
  }

  return (
    <PrivateShell
      userName={user.name ?? "Usuário"}
      userRole={user.role}
      igrejaNome={igrejaNome}
    >
      {children}
    </PrivateShell>
  );
}
