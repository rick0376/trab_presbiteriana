"use client";

import { useSearchParams } from "next/navigation";
import ChamadaRapidaEbd from "@/components/secretaria/escola-dominical/frequencia/chamada-rapida/ChamadaRapidaEbd";

export default function PageChamadaRapidaEbd() {
  const searchParams = useSearchParams();

  const turmaId = searchParams.get("turmaId") || "";
  const igrejaId = searchParams.get("igrejaId") || "";
  const igrejaNome = searchParams.get("igrejaNome") || "";
  const mesInicial = Number(searchParams.get("mes")) || undefined;
  const anoInicial = Number(searchParams.get("ano")) || undefined;

  if (!turmaId || !igrejaId) {
    return (
      <div style={{ padding: 16 }}>Dados inválidos para chamada rápida.</div>
    );
  }

  return (
    <ChamadaRapidaEbd
      turmaId={turmaId}
      igrejaId={igrejaId}
      igrejaNome={igrejaNome}
      mesInicial={mesInicial}
      anoInicial={anoInicial}
    />
  );
}
