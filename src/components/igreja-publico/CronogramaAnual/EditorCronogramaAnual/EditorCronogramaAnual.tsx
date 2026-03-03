"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import ListaCronogramaAnual, {
  CronogramaAnualItem,
} from "../ListaCronogramaAnual/ListaCronogramaAnual";

import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import { useToast } from "@/components/ui/Toast/useToast";

type Permissao = { recurso: string; ler: boolean; editar: boolean };
type MeResponse = {
  id: string;
  role: "SUPERADMIN" | "ADMIN" | "PASTOR" | "USER";
};

type ConfirmState =
  | { open: false }
  | {
      open: true;
      title: string;
      message: string;
      onConfirm: () => void;
    };

export default function EditorCronogramaAnual({
  igrejaId,
}: {
  igrejaId: string;
}) {
  const toast = useToast();

  const [items, setItems] = useState<CronogramaAnualItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");

  const [me, setMe] = useState<MeResponse | null>(null);
  const [perms, setPerms] = useState<Permissao[]>([]);
  const [loadedPerms, setLoadedPerms] = useState(false);

  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  function askConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirm({ open: true, title, message, onConfirm });
  }

  const canEdit = useMemo(() => {
    const isSuper = me?.role === "SUPERADMIN";
    const p = perms.find((x) => x.recurso === "cronograma_anual");
    return !!(isSuper || p?.editar);
  }, [me, perms]);

  const canView = useMemo(() => {
    const isSuper = me?.role === "SUPERADMIN";
    const p = perms.find((x) => x.recurso === "cronograma_anual");
    return !!(isSuper || p?.ler);
  }, [me, perms]);

  useEffect(() => {
    const run = async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        if (!r.ok) return setLoadedPerms(true);

        const meData: MeResponse = await r.json();
        setMe(meData);

        if (meData.role === "SUPERADMIN") {
          setPerms([{ recurso: "cronograma_anual", ler: true, editar: true }]);
          return setLoadedPerms(true);
        }

        const p = await fetch(`/api/permissoes?userId=${meData.id}`, {
          cache: "no-store",
        });

        if (!p.ok) return setLoadedPerms(true);

        const list = await p.json();
        setPerms(Array.isArray(list) ? list : []);
      } catch {
      } finally {
        setLoadedPerms(true);
      }
    };
    run();
  }, []);

  async function load() {
    if (!igrejaId) return;

    if (!canView && loadedPerms) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const r = await fetch(`/api/cronograma-anual?igrejaId=${igrejaId}`, {
        cache: "no-store",
      });

      const j = await r.json().catch(() => ({}));
      setItems(Array.isArray(j?.items) ? j.items : []);
    } catch {
      toast.error("Erro ao carregar cronograma.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!loadedPerms) return;
    load();
    // eslint-disable-next-line
  }, [igrejaId, loadedPerms, canView]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit || saving) return;

    if (!titulo.trim()) {
      toast.error("Digite o título.");
      return;
    }

    if (!data.trim()) {
      toast.error("Selecione a data.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/cronograma-anual?igrejaId=${igrejaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: titulo.trim(), data }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j?.error || "Falha ao criar item.");
        return;
      }

      toast.success("Item criado com sucesso ✅");

      setTitulo("");
      setData("");
      await load();
    } catch {
      toast.error("Falha de conexão.");
    } finally {
      setSaving(false);
    }
  }

  // 🔥 Exclusão com modal + toast
  async function handleDelete(id: string) {
    if (!canEdit) return;

    askConfirm(
      "Excluir item do cronograma?",
      "Essa ação não pode ser desfeita.",
      async () => {
        try {
          const res = await fetch(
            `/api/cronograma-anual/${id}?igrejaId=${igrejaId}`,
            { method: "DELETE" },
          );

          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            toast.error(j?.error || "Erro ao excluir.");
            return;
          }

          toast.success("Item removido ✅");
          await load();
        } catch {
          toast.error("Erro de conexão.");
        } finally {
          setConfirm({ open: false });
        }
      },
    );
  }

  if (!loadedPerms) return null;
  if (!canView) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.h2}>📆 Cronograma anual</h2>
            <p className={styles.sub}>Cadastre datas importantes do ano.</p>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.field}>
            <label className={styles.label}>Título</label>
            <input
              className={styles.input}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={!canEdit || saving}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Data</label>
            <input
              className={styles.input}
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              disabled={!canEdit || saving}
            />
          </div>

          {canEdit && (
            <button className={styles.btn} disabled={saving}>
              {saving ? "Salvando..." : "Adicionar"}
            </button>
          )}
        </form>

        {loading ? (
          <div className={styles.loading}>Carregando…</div>
        ) : (
          <ListaCronogramaAnual
            items={items}
            igrejaId={igrejaId}
            onChange={load}
            onDelete={handleDelete}
            canEdit={canEdit}
          />
        )}
      </div>

      <ConfirmModal
        open={confirm.open}
        title={confirm.open ? confirm.title : ""}
        message={confirm.open ? confirm.message : ""}
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (!confirm.open) return;
          confirm.onConfirm();
        }}
      />
    </div>
  );
}
