//src/components/hinarios/EditorHinarioDepartamento/EditorHinarioDepartamento.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import { Eye, PencilLine, Printer, Trash2, X } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import { useToast } from "@/components/ui/Toast/useToast";

type Musica = {
  id: string;
  titulo: string;
  letra: string;
  ordem: number;
  ativo: boolean;
};

type Props = {
  departamentoId: string;
  departamentoNome: string;
};

type ConfirmState =
  | { open: false }
  | {
      open: true;
      title: string;
      message: string;
      onConfirm: () => void;
    };

export default function EditorHinarioDepartamento({
  departamentoId,
  departamentoNome,
}: Props) {
  const toast = useToast();

  const [items, setItems] = useState<Musica[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [letra, setLetra] = useState("");
  const [ordem, setOrdem] = useState("0");
  const [ativo, setAtivo] = useState(true);

  const [selected, setSelected] = useState<Musica | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/hinarios/${departamentoId}`, {
        cache: "no-store",
      });

      const j = await res.json().catch(() => ({}));
      setItems(Array.isArray(j?.items) ? j.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [departamentoId]);

  function resetForm() {
    setEditingId(null);
    setTitulo("");
    setLetra("");
    setOrdem("0");
    setAtivo(true);
  }

  function fillForm(item: Musica) {
    setEditingId(item.id);
    setTitulo(item.titulo ?? "");
    setLetra(item.letra ?? "");
    setOrdem(String(item.ordem ?? 0));
    setAtivo(item.ativo !== false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function askConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirm({ open: true, title, message, onConfirm });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    if (!titulo.trim()) {
      toast.error("Informe o título da música.");
      return;
    }

    if (!letra.trim()) {
      toast.error("Informe a letra da música.");
      return;
    }

    setSaving(true);

    try {
      const body = {
        titulo: titulo.trim(),
        letra: letra.trim(),
        ordem: Number(ordem || 0),
        ativo,
      };

      const res = await fetch(
        editingId
          ? `/api/hinarios/musica/${editingId}`
          : `/api/hinarios/${departamentoId}`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(j?.error || "Erro ao salvar música.");
        return;
      }

      toast.success(
        editingId ? "Música atualizada ✅" : "Música cadastrada ✅",
      );

      resetForm();
      await load();
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: Musica) {
    askConfirm(
      "Excluir música?",
      `Deseja realmente excluir "${item.titulo}"?`,
      async () => {
        try {
          const res = await fetch(`/api/hinarios/musica/${item.id}`, {
            method: "DELETE",
          });

          const j = await res.json().catch(() => ({}));

          if (!res.ok) {
            toast.error(j?.error || "Erro ao excluir música.");
            return;
          }

          toast.success("Música excluída ✅");
          setConfirm({ open: false });

          if (editingId === item.id) {
            resetForm();
          }

          if (selected?.id === item.id) {
            setSelected(null);
          }

          await load();
        } catch {
          toast.error("Erro de conexão.");
        }
      },
    );
  }

  function handlePrint(musica: Musica) {
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) return;

    popup.document.write(`
      <html>
        <head>
          <title>${musica.titulo}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 32px;
              color: #111827;
              line-height: 1.7;
            }
            h1 {
              margin: 0 0 18px;
              font-size: 28px;
            }
            .meta {
              margin-bottom: 24px;
              color: #475569;
              font-size: 14px;
            }
            .letra {
              white-space: pre-wrap;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <h1>${musica.titulo}</h1>
          <div class="meta">${departamentoNome}</div>
          <div class="letra">${musica.letra.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        </body>
      </html>
    `);

    popup.document.close();
    popup.focus();
    popup.print();
  }

  const ordered = useMemo(
    () =>
      [...items].sort(
        (a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo),
      ),
    [items],
  );

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Hinário - {departamentoNome}</h1>
        <p className={styles.subtitle}>
          Cadastre as músicas ensaiadas pelo departamento, organize a ordem e
          visualize a letra para leitura, ensaio e impressão.
        </p>

        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.block}>
            <div className={styles.blockTitle}>
              {editingId ? "Editar música" : "Nova música"}
            </div>

            <div className={styles.grid2}>
              <div>
                <label className={styles.label}>Título</label>
                <input
                  className={styles.input}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Autor da Minha Fé"
                  disabled={saving}
                />
              </div>

              <div>
                <label className={styles.label}>Ordem</label>
                <input
                  className={styles.input}
                  type="number"
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <label className={styles.label}>Letra</label>
            <textarea
              className={styles.textarea}
              value={letra}
              onChange={(e) => setLetra(e.target.value)}
              placeholder="Cole aqui a letra completa da música"
              disabled={saving}
            />

            <div className={styles.switchRow}>
              <label className={styles.switchLabel}>
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  disabled={saving}
                />
                <span>Música ativa</span>
              </label>
            </div>

            <div className={styles.actionRow}>
              <button
                className={styles.btnGreen}
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Salvando..."
                  : editingId
                    ? "Salvar alterações"
                    : "Cadastrar música"}
              </button>

              <button
                className={styles.btnSecondary}
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Limpar formulário
              </button>
            </div>
          </div>
        </form>

        <div className={styles.block}>
          <div className={styles.blockTitle}>Músicas cadastradas</div>

          {loading ? (
            <div className={styles.empty}>Carregando músicas...</div>
          ) : ordered.length ? (
            <div className={styles.list}>
              {ordered.map((item) => (
                <div key={item.id} className={styles.listCard}>
                  <div className={styles.listTop}>
                    <div>
                      <h3 className={styles.musicTitle}>{item.titulo}</h3>
                      <div className={styles.metaRow}>
                        <span>Ordem: {item.ordem}</span>
                        <span>{item.ativo ? "Ativa" : "Inativa"}</span>
                      </div>
                    </div>

                    <div className={styles.iconRow}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => setSelected(item)}
                        title="Visualizar"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => handlePrint(item)}
                        title="Imprimir"
                      >
                        <Printer size={16} />
                      </button>

                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => fillForm(item)}
                        title="Editar"
                      >
                        <PencilLine size={16} />
                      </button>

                      <button
                        type="button"
                        className={styles.iconBtnDanger}
                        onClick={() => handleDelete(item)}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className={styles.previewText}>
                    {item.letra.length > 180
                      ? `${item.letra.slice(0, 180)}...`
                      : item.letra}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>Nenhuma música cadastrada ainda.</div>
          )}
        </div>
      </div>

      {selected ? (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>{selected.titulo}</h3>
                <p className={styles.modalMeta}>{departamentoNome}</p>
              </div>

              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setSelected(null)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.letraBox}>{selected.letra}</div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => handlePrint(selected)}
                >
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
