//src/app/(private)/radio/admin-radio/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";

type Status = {
  live: boolean;
  streamUrl?: string | null;
  updatedAt?: string;
};

type Permissao = {
  id?: string;
  recurso: string;
  ler: boolean;
  criar: boolean;
  editar: boolean;
  deletar: boolean;
  compartilhar: boolean;
};

type MeResponse = {
  id: string;
  role: "SUPERADMIN" | "ADMIN" | "PASTOR" | "USER";
};

const PERM_DEFAULT: Permissao = {
  recurso: "",
  ler: false,
  criar: false,
  editar: false,
  deletar: false,
  compartilhar: false,
};

export default function AdminRadioPage() {
  const router = useRouter();

  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [streamUrl, setStreamUrl] = useState("");

  const [listeners, setListeners] = useState<{
    current: number;
    peak: number;
    max: number;
  } | null>(null);

  // 🔄 Carrega status atual
  async function load() {
    setLoading(true);
    setMsg("");

    try {
      const r = await fetch("/api/radio/admin", {
        cache: "no-store",
      });

      const j = await r.json();

      if (!r.ok) {
        setMsg(j?.error || "Erro ao carregar");
        setStatus(null);
        return;
      }

      setStatus(j);
      setStreamUrl(j.streamUrl ?? "");
    } catch {
      setMsg("Falha de conexão");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadListeners() {
    try {
      const r = await fetch("/api/radio/listeners", {
        cache: "no-store",
      });

      if (!r.ok) return;

      const j = await r.json();
      setListeners(j);
    } catch {
      // ignora erro silenciosamente
    }
  }

  // 🔴 Liga / Desliga rádio
  async function setLive(live: boolean) {
    setLoading(true);
    setMsg("");

    try {
      const r = await fetch("/api/radio/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          live,
          streamUrl,
        }),
      });

      const j = await r.json();

      if (!r.ok) {
        setMsg(j?.error || "Não autorizado");
        return;
      }

      setStatus({
        live: j.live,
        streamUrl: j.streamUrl,
        updatedAt: j.updatedAt,
      });

      setMsg(live ? "Rádio ligada ✅" : "Rádio desligada ✅");
    } catch {
      setMsg("Falha de conexão");
    } finally {
      setLoading(false);
    }
  }

  // 🚀 Carrega ao abrir página
  useEffect(() => {
    load();
  }, []);

  // 🔒 Remove scroll da página
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  useEffect(() => {
    loadListeners();

    const interval = setInterval(() => {
      loadListeners();
    }, 10000); // atualiza a cada 10s

    return () => clearInterval(interval);
  }, []);

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.top}>
          <button
            className={styles.back}
            type="button"
            onClick={() => router.back()}
          >
            ← Voltar
          </button>
        </div>

        <h1 className={styles.title}>Admin Rádio</h1>

        <input
          className={styles.input}
          placeholder="URL do áudio (stream)"
          value={streamUrl}
          onChange={(e) => setStreamUrl(e.target.value)}
          disabled={loading}
        />

        <div className={styles.row}>
          <button className={styles.btn} onClick={load} disabled={loading}>
            Ver status
          </button>

          <button
            className={styles.btnGreen}
            onClick={() => setLive(true)}
            disabled={loading || !streamUrl}
          >
            Ligar
          </button>

          <button
            className={styles.btnRed}
            onClick={() => setLive(false)}
            disabled={loading}
          >
            Desligar
          </button>
        </div>

        <div className={styles.status}>
          <span>Status:</span>{" "}
          <strong className={status?.live ? styles.live : styles.offline}>
            {status ? (status.live ? "AO VIVO" : "OFFLINE") : "—"}
          </strong>
          {listeners && (
            <div className={styles.listeners}>
              <div>
                👥 Ouvindo agora: <strong>{listeners.current}</strong>
              </div>
              <div>
                📈 Pico: <strong>{listeners.peak}</strong>
              </div>
              <div>
                🎯 Máximo permitido: <strong>{listeners.max}</strong>
              </div>
            </div>
          )}
        </div>

        {msg && <div className={styles.msg}>{msg}</div>}
      </div>
    </main>
  );
}
