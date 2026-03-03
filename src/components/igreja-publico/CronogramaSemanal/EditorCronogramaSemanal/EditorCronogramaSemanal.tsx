//src/components/igreja-publico/CronogramaSemanal/EditorCronogramaSemanal/EditorCronogramaSemanal.tsx

"use client";

import { useMemo, useState, useEffect } from "react";
import styles from "./styles.module.scss";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import { useToast } from "@/components/ui/Toast/useToast";
import { Trash2 } from "lucide-react";

type Dia =
  | "SEGUNDA"
  | "TERCA"
  | "QUARTA"
  | "QUINTA"
  | "SEXTA"
  | "SABADO"
  | "DOMINGO";

type Item = {
  dia: Dia;
  hora: string;
  titulo: string;
};

type Props = {
  igrejaId: string;
  initialItems: Item[];
};

type ConfirmState =
  | { open: false }
  | {
      open: true;
      title: string;
      message: string;
      onConfirm: () => void;
    };

export default function EditorCronogramaSemanal({
  igrejaId,
  initialItems,
}: Props) {
  const toast = useToast();
  const [items, setItems] = useState<Item[]>(initialItems ?? []);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  function askConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirm({ open: true, title, message, onConfirm });
  }

  function addItem() {
    setItems((prev) => [...prev, { dia: "DOMINGO", hora: "", titulo: "" }]);
    toast.success("Item adicionado ✅");
  }

  function removeItem(idx: number) {
    askConfirm(
      "Excluir item?",
      "A remoção só será persistida ao salvar.",
      () => {
        setItems((prev) => prev.filter((_, i) => i !== idx));
        setConfirm({ open: false });
        toast.success("Item removido ✅");
      },
    );
  }

  async function salvar() {
    setSaving(true);

    const payload = {
      cronograma: items.map((c, i) => ({
        dia: c.dia,
        hora: String(c.hora ?? "").trim(),
        titulo: String(c.titulo ?? "").trim(),
        ordem: i + 1,
      })),
    };

    try {
      const r = await fetch(`/api/admin/publico?igrejaId=${igrejaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        toast.error(j?.error || "Erro ao salvar");
        return;
      }

      toast.success("Cronograma salvo ✅");
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Cronograma semanal</h1>

        {items.map((c, i) => (
          <div key={i} className={styles.grid3}>
            <select
              className={styles.input}
              value={c.dia}
              onChange={(e) => {
                const copy = [...items];
                copy[i] = { ...copy[i], dia: e.target.value as Dia };
                setItems(copy);
              }}
            >
              <option value="SEGUNDA">Segunda-feira</option>
              <option value="TERCA">Terça-feira</option>
              <option value="QUARTA">Quarta-feira</option>
              <option value="QUINTA">Quinta-feira</option>
              <option value="SEXTA">Sexta-feira</option>
              <option value="SABADO">Sábado</option>
              <option value="DOMINGO">Domingo</option>
            </select>

            <input
              className={styles.input}
              placeholder="Hora"
              value={c.hora}
              onChange={(e) => {
                const copy = [...items];
                copy[i] = { ...copy[i], hora: e.target.value };
                setItems(copy);
              }}
            />

            <input
              className={styles.input}
              placeholder="Título"
              value={c.titulo}
              onChange={(e) => {
                const copy = [...items];
                copy[i] = { ...copy[i], titulo: e.target.value };
                setItems(copy);
              }}
            />

            <button
              className={styles.deleteButton}
              type="button"
              onClick={() => removeItem(i)}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        <button className={styles.btn} onClick={addItem}>
          + Adicionar item
        </button>

        <button className={styles.btnGreen} onClick={salvar} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
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
    </main>
  );
}
