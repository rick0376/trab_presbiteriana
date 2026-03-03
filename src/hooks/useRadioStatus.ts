"use client";

import { useEffect, useState } from "react";

export type RadioStatus = {
  live: boolean;
  title?: string;
  streamUrl?: string | null;
};

type UseRadioStatusOptions = {
  intervalMs?: number;
};

export function useRadioStatus(options: UseRadioStatusOptions = {}) {
  const { intervalMs = 15000 } = options;

  const [status, setStatus] = useState<RadioStatus | null>(null);

  async function loadStatus() {
    try {
      const r = await fetch("/api/radio/status", { cache: "no-store" });
      if (!r.ok) throw new Error("Falha ao buscar status da rádio");

      const j = (await r.json()) as RadioStatus;

      setStatus((prev) => {
        if (!prev) return j;

        // evita re-render desnecessário se nada mudou
        if (
          prev.live === j.live &&
          prev.title === j.title &&
          prev.streamUrl === j.streamUrl
        ) {
          return prev;
        }

        return j;
      });
    } catch {
      setStatus((prev) => prev ?? { live: false });
    }
  }

  useEffect(() => {
    loadStatus();

    const id = setInterval(loadStatus, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return {
    status,
    isLive: !!status?.live,
    reloadRadioStatus: loadStatus,
  };
}
