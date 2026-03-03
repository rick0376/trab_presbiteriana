// api/backup/restaurar-upload/route.ts

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { restoreTenantBackup } from "@/lib/backup/restoreTenantBackup";

export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "SUPERADMIN") {
    const perm = await prisma.permissao.findUnique({
      where: { userId_recurso: { userId: user.id, recurso: "backup" } },
    });

    if (!perm?.editar) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
    }

    if (!file.name.endsWith(".json")) {
      return NextResponse.json(
        { error: "Apenas arquivos .json são permitidos" },
        { status: 400 },
      );
    }

    const text = await file.text();
    const parsed = JSON.parse(text);

    await restoreTenantBackup(parsed, {
      role: user.role,
      igrejaId: user.igrejaId,
    });

    return NextResponse.json({
      success: true,
      message:
        "Restauração via upload concluída com sucesso. Os usuários da igreja serão deslogados.",
    });
  } catch (error: any) {
    console.error("Erro ao restaurar backup via upload:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao restaurar backup via upload" },
      { status: 500 },
    );
  }
}
