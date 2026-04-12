//src/components/radio/programacao/EditorProgramacaoRadio/EditorProgramacaoRadio.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { PencilLine, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast/useToast";
import styles from "./styles.module.scss";

type DiaSemana =
  | "SEGUNDA"
  | "TERCA"
  | "QUARTA"
  | "QUINTA"
  | "SEXTA"
  | "SABADO"
  | "DOMINGO";

type Item = {
  id: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  titulo: string;
  subtitulo?: string | null;
  responsavel?: string | null;
  ativo: boolean;
  ordem: number;
};

const DIA_LABEL: Record<DiaSemana, string> = {
  SEGUNDA: "Segunda-feira",
  TERCA: "Terça-feira",
  QUARTA: "Quarta-feira",
  QUINTA: "Quinta-feira",
  SEXTA: "Sexta-feira",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

const DIA_ORDEM: Record<DiaSemana, number> = {
  SEGUNDA: 1,
  TERCA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
  SABADO: 6,
  DOMINGO: 7,
};

const EMPTY_FORM = {
  diaSemana: "SEGUNDA" as DiaSemana,
  horaInicio: "",
  horaFim: "",
  titulo: "",
  subtitulo: "",
  responsavel: "",
  ativo: true,
  ordem: 1,
};

export default function EditorProgramacaoRadio() {
  const toast = useToast();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    try {
      setLoading(true);
      const r = await fetch("/api/radio/programacao", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        toast.error(j?.error || "Erro ao carregar programação.");
        setItems([]);
        return;
      }

      setItems(Array.isArray(j?.items) ? j.items : []);
    } catch {
      toast.error("Falha ao carregar programação.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function handleEdit(item: Item) {
    setEditingId(item.id);
    setForm({
      diaSemana: item.diaSemana,
      horaInicio: item.horaInicio,
      horaFim: item.horaFim,
      titulo: item.titulo,
      subtitulo: item.subtitulo ?? "",
      responsavel: item.responsavel ?? "",
      ativo: item.ativo,
      ordem: item.ordem,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Deseja excluir este item da programação?");
    if (!ok) return;

    try {
      const r = await fetch(`/api/radio/programacao/${id}`, {
        method: "DELETE",
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        toast.error(j?.error || "Erro ao excluir.");
        return;
      }

      toast.success("Item excluído ✅");
      await load();
    } catch {
      toast.error("Falha ao excluir.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.titulo.trim()) {
      toast.error("Digite o título do programa.");
      return;
    }

    if (!form.horaInicio.trim() || !form.horaFim.trim()) {
      toast.error("Preencha hora inicial e final.");
      return;
    }

    setSaving(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/radio/programacao/${editingId}`
        : "/api/radio/programacao";

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          titulo: form.titulo.trim(),
          subtitulo: form.subtitulo.trim(),
          responsavel: form.responsavel.trim(),
        }),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        toast.error(j?.error || "Erro ao salvar programação.");
        return;
      }

      toast.success(
        editingId ? "Programação atualizada ✅" : "Programação criada ✅",
      );
      resetForm();
      await load();
    } catch {
      toast.error("Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const grouped = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const diffDia = DIA_ORDEM[a.diaSemana] - DIA_ORDEM[b.diaSemana];
      if (diffDia !== 0) return diffDia;

      const diffHora = a.horaInicio.localeCompare(b.horaInicio);
      if (diffHora !== 0) return diffHora;

      return a.ordem - b.ordem;
    });

    return sorted.reduce<Record<string, Item[]>>((acc, item) => {
      if (!acc[item.diaSemana]) acc[item.diaSemana] = [];
      acc[item.diaSemana].push(item);
      return acc;
    }, {});
  }, [items]);

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Programação da Rádio</h1>
        <p className={styles.subtitle}>
          Cadastre a grade semanal da rádio sem mexer na transmissão atual.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.grid2}>
            <div>
              <label className={styles.label}>Dia da semana</label>
              <select
                className={styles.input}
                value={form.diaSemana}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    diaSemana: e.target.value as DiaSemana,
                  }))
                }
              >
                {Object.entries(DIA_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={styles.label}>Ordem</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={form.ordem}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    ordem: Number(e.target.value || 1),
                  }))
                }
              />
            </div>
          </div>

          <div className={styles.grid2}>
            <div>
              <label className={styles.label}>Hora inicial</label>
              <input
                className={styles.input}
                type="time"
                value={form.horaInicio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, horaInicio: e.target.value }))
                }
              />
            </div>

            <div>
              <label className={styles.label}>Hora final</label>
              <input
                className={styles.input}
                type="time"
                value={form.horaFim}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, horaFim: e.target.value }))
                }
              />
            </div>
          </div>

          <label className={styles.label}>Título do programa</label>
          <input
            className={styles.input}
            value={form.titulo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, titulo: e.target.value }))
            }
            placeholder="Ex: Culto de Oração ao Vivo"
          />

          <label className={styles.label}>Subtítulo</label>
          <input
            className={styles.input}
            value={form.subtitulo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, subtitulo: e.target.value }))
            }
            placeholder="Ex: Uma noite de oração e comunhão"
          />

          <label className={styles.label}>Responsável</label>
          <input
            className={styles.input}
            value={form.responsavel}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, responsavel: e.target.value }))
            }
            placeholder="Ex: Pr. Rafael"
          />

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ativo: e.target.checked }))
              }
            />
            <span>Programa ativo</span>
          </label>

          <div className={styles.actions}>
            <button
              className={styles.btnPrimary}
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Salvando..."
                : editingId
                  ? "Atualizar programação"
                  : "Adicionar programação"}
            </button>

            {editingId ? (
              <button
                className={styles.btnSecondary}
                type="button"
                onClick={resetForm}
              >
                Cancelar edição
              </button>
            ) : null}
          </div>
        </form>

        <div className={styles.listBox}>
          <h2 className={styles.listTitle}>Grade cadastrada</h2>

          {loading ? (
            <div className={styles.empty}>Carregando...</div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>Nenhum item cadastrado.</div>
          ) : (
            <div className={styles.days}>
              {Object.entries(grouped).map(([dia, dayItems]) => (
                <div key={dia} className={styles.dayCard}>
                  <h3 className={styles.dayTitle}>
                    {DIA_LABEL[dia as DiaSemana]}
                  </h3>

                  <div className={styles.dayItems}>
                    {dayItems.map((item) => (
                      <div key={item.id} className={styles.programCard}>
                        <div className={styles.programMain}>
                          <strong>
                            {item.horaInicio} - {item.horaFim}
                          </strong>
                          <span>{item.titulo}</span>
                          {item.subtitulo ? (
                            <small>{item.subtitulo}</small>
                          ) : null}
                          {item.responsavel ? (
                            <small>Responsável: {item.responsavel}</small>
                          ) : null}
                          <small>{item.ativo ? "Ativo" : "Inativo"}</small>
                        </div>

                        <div className={styles.programActions}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => handleEdit(item)}
                            title="Editar"
                          >
                            <PencilLine size={16} />
                          </button>

                          <button
                            type="button"
                            className={styles.iconBtnDanger}
                            onClick={() => handleDelete(item.id)}
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
