// comnponents/igreja-publico/CronogramaAnual/ListaCronogramaAnual/ListaCronogramaAnual.tsx

"use client";

import { useState } from "react";
import styles from "./styles.module.scss";
import { PencilLine, Trash2 } from "lucide-react";

export type CronogramaAnualItem = {
  id: string;
  titulo: string;
  data: string; // ISO
};

type Props = {
  items: CronogramaAnualItem[];
  igrejaId: string;
  onChange: () => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
};

function isoToDateValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatBR(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function ListaCronogramaAnual({
  items,
  igrejaId,
  onChange,
  onDelete,
  canEdit,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState(""); // yyyy-mm-dd
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Função para destacar eventos importantes
  function isImportantEvent(it: CronogramaAnualItem) {
    const eventDate = new Date(it.data);
    const today = new Date();
    return eventDate.getDate() === today.getDate(); // Exemplo: destacar eventos do dia
  }

  function startEdit(it: CronogramaAnualItem) {
    setEditingId(it.id);
    setTitulo(it.titulo);
    setData(isoToDateValue(it.data));
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setTitulo("");
    setData("");
    setError("");
  }

  async function saveEdit(id: string) {
    if (!canEdit || saving) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch(
        `/api/cronograma-anual/${id}?igrejaId=${igrejaId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo: titulo.trim(), data }),
        },
      );

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error || "Falha ao salvar.");
        return;
      }

      cancelEdit();
      onChange();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setSaving(false);
    }
  }

  if (!items.length) {
    return <div className={styles.empty}>Nenhum item cadastrado ainda.</div>;
  }

  return (
    <div className={styles.list}>
      {error && <div className={styles.error}>{error}</div>}

      {items.map((it) => {
        const isEditing = editingId === it.id;

        return (
          <div
            key={it.id}
            className={`${styles.item} ${isImportantEvent(it) ? styles.important : ""}`}
          >
            {!isEditing ? (
              <>
                <div className={styles.left}>
                  <div className={styles.title}>{it.titulo}</div>
                  <div className={styles.date}>{formatBR(it.data)}</div>
                </div>

                {canEdit && (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => startEdit(it)}
                      disabled={saving}
                    >
                      <PencilLine size={18} />
                    </button>

                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => onDelete(it.id)}
                      disabled={saving}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.editGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Título</label>
                    <input
                      className={styles.input}
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Data</label>
                    <input
                      className={styles.input}
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => saveEdit(it.id)}
                    disabled={saving}
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>

                  <button
                    type="button"
                    className={styles.btnGhost}
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
