import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BackupManager from "@/components/backup/BackupManager/BackupManager";

export default async function BackupPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  // SUPERADMIN pode tudo
  if (user.role !== "SUPERADMIN") {
    const perm = await prisma.permissao.findUnique({
      where: {
        userId_recurso: {
          userId: user.id,
          recurso: "backup",
        },
      },
    });

    if (!perm?.ler) {
      redirect("/sem-permissao");
    }
  }

  return <BackupManager />;
}
