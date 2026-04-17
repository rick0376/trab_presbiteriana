//src/app/(private)/secretaria/hinarios/page.tsx

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HinariosPage() {
  await requirePermission("hinarios", "ler");
  const user = await requireUser();

  let igrejaId = user.igrejaId ?? null;

  if (!igrejaId && user.role !== "SUPERADMIN") {
    const igreja = await prisma.igreja.findFirst({
      where: { adminId: user.id },
      select: { id: true },
    });

    igrejaId = igreja?.id ?? null;
  }

  if (!igrejaId) {
    const igreja = await prisma.igreja.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    igrejaId = igreja?.id ?? null;
  }

  if (!igrejaId) {
    return <div style={{ padding: 24 }}>Igreja não encontrada.</div>;
  }

  const departamentos = await prisma.departamento.findMany({
    where: {
      igrejaId,
      ativo: true,
    },
    include: {
      _count: {
        select: {
          musicas: true,
        },
      },
    },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
  });

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Hinários dos Departamentos</h1>
      <p style={{ marginBottom: 24, color: "#64748b" }}>
        Escolha um departamento para gerenciar as músicas e letras.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {departamentos.map((dep) => (
          <div
            key={dep.id}
            style={{
              background: "#fff",
              border: "1px solid rgba(21,44,76,0.08)",
              borderRadius: 20,
              padding: 18,
              boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
            }}
          >
            <h2 style={{ margin: "0 0 10px", color: "#17375b" }}>{dep.nome}</h2>

            <p
              style={{ margin: "0 0 12px", color: "#64748b", lineHeight: 1.6 }}
            >
              {dep.descricao || "Sem descrição cadastrada."}
            </p>

            <div
              style={{ marginBottom: 14, color: "#334155", fontWeight: 700 }}
            >
              {dep._count.musicas} música(s)
            </div>

            <Link
              href={`/secretaria/hinarios/${dep.id}`}
              style={{
                minHeight: 44,
                padding: "0 16px",
                borderRadius: 14,
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
                background: "linear-gradient(180deg, #1b4d84 0%, #123a66 100%)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              Gerenciar hinário
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
