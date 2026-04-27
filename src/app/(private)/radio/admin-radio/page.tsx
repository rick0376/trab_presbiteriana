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

type RadioConfig = {
  status: "AO_VIVO" | "OFFLINE" | "MANUTENCAO" | "AGUARDANDO_PROGRAMACAO";
  title?: string | null;
  subtitle?: string | null;
  nextProgramAt?: string | null;
  allowPlay: boolean;
  badgeLabel?: string | null;
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

  const [radioConfig, setRadioConfig] = useState<RadioConfig>({
    status: "OFFLINE",
    title: "Rádio Offline",
    subtitle: "",
    nextProgramAt: "",
    allowPlay: false,
    badgeLabel: "Offline",
  });

  const [listeners, setListeners] = useState<{
    current: number;
    peak: number;
    max: number;
  } | null>(null);

  const [permRadioUrl, setPermRadioUrl] = useState<Permissao | null>(null);
  const [permRadioLive, setPermRadioLive] = useState<Permissao | null>(null);

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

  async function loadRadioConfig() {
    try {
      const r = await fetch("/api/radio/config", {
        cache: "no-store",
      });

      const j = await r.json();

      if (!r.ok) return;

      setRadioConfig({
        status: j.status ?? "OFFLINE",
        title: j.title ?? "Rádio Offline",
        subtitle: j.subtitle ?? "",
        nextProgramAt: j.nextProgramAt ?? "",
        allowPlay: !!j.allowPlay,
        badgeLabel: j.badgeLabel ?? "Offline",
      });
    } catch {}
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

      setMsg(
        live
          ? "Sinal da rádio ligado para teste ✅"
          : "Sinal da rádio desligado ✅",
      );
    } catch {
      setMsg("Falha de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function saveRadioConfig() {
    setLoading(true);
    setMsg("");

    try {
      const r = await fetch("/api/radio/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(radioConfig),
      });

      const j = await r.json();

      if (!r.ok) {
        setMsg(j?.error || "Erro ao salvar configuração");
        return;
      }

      setMsg("Configuração pública da rádio salva ✅");
    } catch {
      setMsg("Falha de conexão ao salvar configuração");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadRadioConfig();
  }, []);

  useEffect(() => {
    loadListeners();
    const interval = setInterval(loadListeners, 10000);
    return () => clearInterval(interval);
  }, []);

  const radioPainelStatus = !status?.live
    ? {
        label: "OFFLINE",
        className: styles.offline,
        description: "A rádio está desligada.",
      }
    : radioConfig.allowPlay
      ? {
          label: "AO VIVO PÚBLICO",
          className: styles.live,
          description: "A rádio está ligada e liberada para o público.",
        }
      : {
          label: "ONLINE EM TESTE",
          className: styles.testMode,
          description:
            "A rádio está ligada, mas ainda não foi liberada para o público.",
        };

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

        {canEditUrl && (
          <input
            className={styles.input}
            placeholder="URL do áudio da rádio"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            disabled={loading}
          />
        )}

        <div className={styles.row}>
          <button className={styles.btn} onClick={load} disabled={loading}>
            Atualizar status
          </button>

          {canToggleRadio && (
            <>
              <button
                className={styles.btnGreen}
                onClick={() => setLive(true)}
                disabled={loading || !streamUrl}
              >
                Ligar sinal
              </button>

              <button
                className={styles.btnRed}
                onClick={() => setLive(false)}
                disabled={loading}
              >
                Desligar sinal
              </button>
            </>
          )}
        </div>

        <div className={styles.status}>
          <span>Status da rádio:</span>{" "}
          <strong className={radioPainelStatus.className}>
            {radioPainelStatus.label}
          </strong>
          <p className={styles.statusDescription}>
            {radioPainelStatus.description}
          </p>
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

        <div className={styles.configBox}>
          <h2 className={styles.sectionTitle}>Configuração pública da rádio</h2>

          <select
            className={styles.input}
            value={radioConfig.status}
            onChange={(e) => {
              const nextStatus = e.target.value as RadioConfig["status"];

              const presets: Record<
                RadioConfig["status"],
                Partial<RadioConfig>
              > = {
                AO_VIVO: {
                  status: "AO_VIVO",
                  title: "Ouvir Rádio",
                  subtitle: "Transmitindo agora",
                  nextProgramAt: "",
                  allowPlay: true,
                  badgeLabel: "Ao vivo",
                },
                OFFLINE: {
                  status: "OFFLINE",
                  title: "Rádio Offline",
                  subtitle: "No momento estamos fora do ar",
                  nextProgramAt: "",
                  allowPlay: false,
                  badgeLabel: "Offline",
                },
                MANUTENCAO: {
                  status: "MANUTENCAO",
                  title: "Rádio em manutenção",
                  subtitle: "Estamos em manutenção e voltaremos em breve",
                  nextProgramAt: "Previsão de volta 19:00 hs",
                  allowPlay: false,
                  badgeLabel: "Manutenção",
                },
                AGUARDANDO_PROGRAMACAO: {
                  status: "AGUARDANDO_PROGRAMACAO",
                  title: "Aguardando programação",
                  subtitle: "Nossa programação ainda não começou",
                  nextProgramAt: "Ao ar a partir de 19:30",
                  allowPlay: false,
                  badgeLabel: "Programação",
                },
              };

              setRadioConfig((prev) => ({
                ...prev,
                ...presets[nextStatus],
                status: nextStatus,
              }));
            }}
            disabled={loading}
          >
            <option value="AO_VIVO">AO VIVO</option>
            <option value="OFFLINE">OFFLINE</option>
            <option value="MANUTENCAO">MANUTENÇÃO</option>
            <option value="AGUARDANDO_PROGRAMACAO">
              AGUARDANDO PROGRAMAÇÃO
            </option>
          </select>

          <input
            className={styles.input}
            placeholder="Título principal"
            value={radioConfig.title ?? ""}
            onChange={(e) =>
              setRadioConfig((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
            disabled={loading}
          />

          <input
            className={styles.input}
            placeholder="Subtítulo / mensagem adicional"
            value={radioConfig.subtitle ?? ""}
            onChange={(e) =>
              setRadioConfig((prev) => ({
                ...prev,
                subtitle: e.target.value,
              }))
            }
            disabled={loading}
          />

          <input
            className={styles.input}
            placeholder="Horário da próxima programação. Ex: 19:30"
            value={radioConfig.nextProgramAt ?? ""}
            onChange={(e) =>
              setRadioConfig((prev) => ({
                ...prev,
                nextProgramAt: e.target.value,
              }))
            }
            disabled={loading}
          />

          <input
            className={styles.input}
            placeholder="Texto do badge. Ex: Ao vivo"
            value={radioConfig.badgeLabel ?? ""}
            onChange={(e) =>
              setRadioConfig((prev) => ({
                ...prev,
                badgeLabel: e.target.value,
              }))
            }
            disabled={loading}
          />

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={radioConfig.allowPlay}
              onChange={(e) =>
                setRadioConfig((prev) => ({
                  ...prev,
                  allowPlay: e.target.checked,
                  status: e.target.checked ? "AO_VIVO" : prev.status,
                  badgeLabel: e.target.checked ? "Ao vivo" : prev.badgeLabel,
                }))
              }
              disabled={loading || !status?.live}
            />
            <span>Liberar rádio para o público ouvir no site</span>
          </label>

          {!status?.live && (
            <p className={styles.warningText}>
              Ligue o sinal da rádio antes de liberar para o público.
            </p>
          )}

          <div className={styles.row}>
            <button
              className={styles.btn}
              type="button"
              onClick={saveRadioConfig}
              disabled={loading}
            >
              Salvar configuração pública
            </button>
          </div>
        </div>

        {msg && <div className={styles.msg}>{msg}</div>}
      </div>
    </main>
  );
}
