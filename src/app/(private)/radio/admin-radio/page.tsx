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
  role: string;
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

  const [permRadioUrl, setPermRadioUrl] = useState<Permissao | null>(null);
  const [permRadioLive, setPermRadioLive] = useState<Permissao | null>(null);

  // =========================
  // 🔐 Buscar permissões
  // =========================
  useEffect(() => {
    const fetchPerms = async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });

        if (!r.ok) {
          setPermRadioUrl(PERM_DEFAULT);
          setPermRadioLive(PERM_DEFAULT);
          return;
        }

        const meData: MeResponse = await r.json();

        // SUPERADMIN = total
        if (meData.role === "SUPERADMIN") {
          const full = {
            recurso: "",
            ler: true,
            criar: true,
            editar: true,
            deletar: true,
            compartilhar: true,
          };

          setPermRadioUrl({ ...full, recurso: "radio_url" });
          setPermRadioLive({ ...full, recurso: "radio_live" });
          return;
        }

        const p = await fetch(`/api/permissoes?userId=${meData.id}`, {
          cache: "no-store",
        });

        if (!p.ok) {
          setPermRadioUrl(PERM_DEFAULT);
          setPermRadioLive(PERM_DEFAULT);
          return;
        }

        const list: Permissao[] = await p.json();

        setPermRadioUrl(
          list.find((x) => x.recurso === "radio_url") ?? PERM_DEFAULT,
        );

        setPermRadioLive(
          list.find((x) => x.recurso === "radio_live") ?? PERM_DEFAULT,
        );
      } catch {
        setPermRadioUrl(PERM_DEFAULT);
        setPermRadioLive(PERM_DEFAULT);
      }
    };

    fetchPerms();
  }, []);

  const canEditUrl = !!permRadioUrl?.editar;
  const canToggleRadio = !!permRadioLive?.editar;

  // =========================
  // 🔄 Carrega status
  // =========================
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
    } catch {}
  }

  // 🔴 Liga / Desliga
  async function setLive(live: boolean) {
    if (!canToggleRadio) return;

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

      setStatus(j);
      setMsg(live ? "Rádio ligada ✅" : "Rádio desligada ✅");
    } catch {
      setMsg("Falha de conexão");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadListeners();
    const interval = setInterval(loadListeners, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!permRadioUrl || !permRadioLive) {
    return (
      <main className={styles.container}>
        <div className={styles.card}>Carregando permissões...</div>
      </main>
    );
  }

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

        {/* 🔐 URL */}
        {canEditUrl && (
          <input
            className={styles.input}
            placeholder="URL do áudio (stream)"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            disabled={loading}
          />
        )}

        <div className={styles.row}>
          <button className={styles.btn} onClick={load} disabled={loading}>
            Ver status
          </button>

          {/* 🔐 Ligar/Desligar */}
          {canToggleRadio && (
            <>
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
            </>
          )}
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
