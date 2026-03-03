//components/igreja-publico/EditorPublico/EditorPublico.tsx

"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import { useToast } from "@/components/ui/Toast/useToast";
import { Trash2 } from "lucide-react";

type Props = {
  initialData: any;
  canEdit: boolean; // ✅ vem do server
};

type ConfirmState =
  | { open: false }
  | {
      open: true;
      title: string;
      message: string;
      onConfirm: () => void;
    };

export default function EditorPublico({ initialData, canEdit }: Props) {
  const toast = useToast();

  const [bannerSubtitle, setBannerSubtitle] = useState(
    initialData?.bannerSubtitle ?? "",
  );

  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [horarios, setHorarios] = useState<string[]>(
    initialData?.horarios?.map((h: any) => h.texto) ?? [],
  );

  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  useEffect(() => {
    if (initialData?.whatsappUrl) {
      const onlyNumbers = initialData.whatsappUrl.replace(/\D/g, "");
      const withoutCountry = onlyNumbers.startsWith("55")
        ? onlyNumbers.slice(2)
        : onlyNumbers;

      setWhatsappNumber(withoutCountry);
    }
  }, [initialData]);

  function askConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirm({ open: true, title, message, onConfirm });
  }

  function addHorario() {
    if (!canEdit) return;
    setHorarios((prev) => [...prev, ""]);
    toast.success("Horário adicionado ✅");
  }

  function removeHorario(idx: number) {
    if (!canEdit) return;

    askConfirm(
      "Excluir horário?",
      "Isso remove o item da lista. Só vai para o banco quando você clicar em Salvar.",
      () => {
        setHorarios((prev) => prev.filter((_, i) => i !== idx));
        setConfirm({ open: false });
        toast.success("Horário removido ✅");
      },
    );
  }

  async function salvar() {
    if (!canEdit) return;

    setSaving(true);

    if (whatsappNumber && whatsappNumber.length < 10) {
      toast.error("Digite um número válido com DDD.");
      setSaving(false);
      return;
    }

    const payload = {
      bannerSubtitle: bannerSubtitle.trim(),
      whatsappUrl: whatsappNumber ? `https://wa.me/55${whatsappNumber}` : "",
      horarios: horarios.map((t, i) => ({
        texto: String(t ?? "").trim(),
        ordem: i + 1,
      })),
    };

    try {
      const r = await fetch(
        `/api/admin/publico?igrejaId=${initialData.igrejaId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(j?.error || "Erro ao salvar");
        return;
      }

      toast.success("Salvo com sucesso ✅");
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  }

  function formatPhone(value: string) {
    const v = value.replace(/\D/g, "");

    if (v.length <= 2) return `(${v}`;
    if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length <= 11)
      return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;

    return v;
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Conteúdo público</h1>

        {!canEdit && (
          <div className={styles.msg}>
            🔒 Você está em modo visualização (sem permissão de editar).
          </div>
        )}

        <label className={styles.label}>Texto abaixo do título</label>
        <input
          className={styles.input}
          value={bannerSubtitle}
          onChange={(e) => setBannerSubtitle(e.target.value)}
          disabled={!canEdit}
        />

        <label className={styles.label}>WhatsApp</label>
        <input
          className={styles.input}
          placeholder="(11) 99999-9999"
          value={formatPhone(whatsappNumber)}
          disabled={!canEdit}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setWhatsappNumber(digits);
          }}
        />

        <div className={styles.block}>
          <div className={styles.blockTitle}>Horários</div>

          {horarios.map((t, i) => (
            <div key={i} className={styles.row}>
              <input
                className={styles.input}
                value={t}
                disabled={!canEdit}
                onChange={(e) => {
                  const copy = [...horarios];
                  copy[i] = e.target.value;
                  setHorarios(copy);
                }}
              />

              {canEdit && (
                <button
                  className={styles.deleteButton}
                  type="button"
                  title="Excluir"
                  onClick={() => removeHorario(i)}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}

          {canEdit && (
            <button className={styles.btn} type="button" onClick={addHorario}>
              + Adicionar horário
            </button>
          )}

          {canEdit && (
            <button
              className={styles.btnGreen}
              type="button"
              onClick={salvar}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          )}
        </div>
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
