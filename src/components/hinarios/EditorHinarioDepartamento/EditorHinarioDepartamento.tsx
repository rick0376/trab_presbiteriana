//src/components/hinarios/EditorHinarioDepartamento/EditorHinarioDepartamento.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  MonitorPlay,
  PencilLine,
  Printer,
  Trash2,
  X,
} from "lucide-react";
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

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [cultoIndex, setCultoIndex] = useState<number | null>(null);
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
            setSelectedIndex(null);
          }

          if (selectedCulto?.id === item.id) {
            setCultoIndex(null);
          }

          await load();
        } catch {
          toast.error("Erro de conexão.");
        }
      },
    );
  }

  function handlePrint(musica: Musica) {
    const popup = window.open("", "_blank", "width=1100,height=850");
    if (!popup) return;

    const letraFormatada = musica.letra
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .split("\n\n")
      .map((bloco) => `<p>${bloco.replace(/\n/g, "<br/>")}</p>`)
      .join("");

    popup.document.write(`
    <html>
      <head>
        <title>${musica.titulo}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 12mm 12mm 12mm;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #1e293b;
            font-family: Arial, Helvetica, sans-serif;
          }

          body {
            padding: 0;
          }

          .sheet {
            padding: 0;
          }

          .header {
            margin-bottom: 14px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 10px;
          }

          .title {
            margin: 0;
            font-size: 28px;
            line-height: 1.1;
            font-weight: 800;
            color: #e85d04;
          }

          .subtitle {
            margin: 6px 0 0;
            font-size: 16px;
            font-weight: 700;
            color: #9ca300;
          }

          .meta {
            margin-top: 8px;
            font-size: 12px;
            color: #64748b;
          }

          .lyrics {
            column-count: 2;
            column-gap: 26px;
            column-fill: auto;
            font-size: 15px;
            line-height: 1.48;
          }

          .lyrics p {
            margin: 0 0 12px;
            break-inside: avoid;
          }

          .footer {
            margin-top: 14px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #94a3b8;
          }

          @media print {
            html, body {
              width: auto;
              height: auto;
              overflow: visible;
            }

            .sheet {
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <h1 class="title">${musica.titulo}</h1>
            <div class="subtitle">${departamentoNome}</div>
            <div class="meta">Hinário do departamento • Igreja Presbiteriana Renovada</div>
          </div>

          <div class="lyrics">
            ${letraFormatada}
          </div>
        </div>
      </body>
    </html>
  `);

    popup.document.close();
    popup.focus();
    popup.print();
  }

  function handlePdf(musica: Musica) {
    const popup = window.open("", "_blank", "width=1100,height=850");
    if (!popup) return;

    const letraFormatada = musica.letra
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .split("\n\n")
      .map((bloco) => `<p>${bloco.replace(/\n/g, "<br/>")}</p>`)
      .join("");

    popup.document.write(`
    <html>
      <head>
        <title>${musica.titulo} - PDF</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 12mm 12mm 12mm;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #1e293b;
            font-family: Arial, Helvetica, sans-serif;
          }

          body {
            padding: 0;
          }

          .sheet {
            padding: 0;
          }

          .header {
            margin-bottom: 14px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 10px;
          }

          .title {
            margin: 0;
            font-size: 28px;
            line-height: 1.1;
            font-weight: 800;
            color: #e85d04;
          }

          .subtitle {
            margin: 6px 0 0;
            font-size: 16px;
            font-weight: 700;
            color: #9ca300;
          }

          .meta {
            margin-top: 8px;
            font-size: 12px;
            color: #64748b;
          }

          .lyrics {
            column-count: 2;
            column-gap: 26px;
            column-fill: auto;
            font-size: 15px;
            line-height: 1.48;
          }

          .lyrics p {
            margin: 0 0 12px;
            break-inside: avoid;
          }

          .footer {
            margin-top: 14px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #94a3b8;
          }

          @media print {
            html, body {
              width: auto;
              height: auto;
              overflow: visible;
            }

            .sheet {
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
          <h1 class="title">${musica.titulo}</h1>
          <div class="subtitle">${departamentoNome}</div>
          <div class="meta">Hinário do departamento • Igreja Presbiteriana Renovada</div>
        </div>

        <div class="lyrics">
          ${letraFormatada}
        </div>
        </div>

        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

    popup.document.close();
    popup.focus();
  }

  const ordered = useMemo(
    () =>
      [...items].sort(
        (a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo),
      ),
    [items],
  );

  const selected =
    selectedIndex !== null && ordered[selectedIndex]
      ? ordered[selectedIndex]
      : null;

  const selectedCulto =
    cultoIndex !== null && ordered[cultoIndex] ? ordered[cultoIndex] : null;

  function openMusic(index: number) {
    setSelectedIndex(index);
  }

  function closeMusic() {
    setSelectedIndex(null);
  }

  function prevMusic() {
    if (!ordered.length || selectedIndex === null) return;
    setSelectedIndex((prev) => {
      if (prev === null) return 0;
      return prev === 0 ? ordered.length - 1 : prev - 1;
    });
  }

  function nextMusic() {
    if (!ordered.length || selectedIndex === null) return;
    setSelectedIndex((prev) => {
      if (prev === null) return 0;
      return prev === ordered.length - 1 ? 0 : prev + 1;
    });
  }

  function openCulto(index: number) {
    setCultoIndex(index);
  }

  function closeCulto() {
    setCultoIndex(null);
  }

  function prevCulto() {
    if (!ordered.length || cultoIndex === null) return;
    setCultoIndex((prev) => {
      if (prev === null) return 0;
      return prev === 0 ? ordered.length - 1 : prev - 1;
    });
  }

  function nextCulto() {
    if (!ordered.length || cultoIndex === null) return;
    setCultoIndex((prev) => {
      if (prev === null) return 0;
      return prev === ordered.length - 1 ? 0 : prev + 1;
    });
  }

  useEffect(() => {
    if (selectedIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMusic();
      if (e.key === "ArrowLeft") prevMusic();
      if (e.key === "ArrowRight") nextMusic();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, ordered.length]);

  useEffect(() => {
    if (cultoIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeCulto();
      if (e.key === "ArrowLeft") prevCulto();
      if (e.key === "ArrowRight") nextCulto();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cultoIndex, ordered.length]);

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
              {ordered.map((item, index) => (
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
                        onClick={() => openMusic(index)}
                        title="Visualizar"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => openCulto(index)}
                        title="Modo culto"
                      >
                        <MonitorPlay size={16} />
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
                        onClick={() => handlePdf(item)}
                        title="PDF"
                      >
                        <FileText size={16} />
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
        <div className={styles.modalOverlay} onClick={closeMusic}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>{selected.titulo}</h3>
                <p className={styles.modalMeta}>
                  {departamentoNome} • {selectedIndex! + 1} / {ordered.length}
                </p>
              </div>

              <button
                type="button"
                className={styles.modalClose}
                onClick={closeMusic}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {ordered.length > 1 ? (
                <div className={styles.navRow}>
                  <button
                    type="button"
                    className={styles.navBtn}
                    onClick={prevMusic}
                  >
                    <ChevronLeft size={18} />
                    Anterior
                  </button>

                  <button
                    type="button"
                    className={styles.navBtn}
                    onClick={nextMusic}
                  >
                    Próxima
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : null}

              <div className={styles.letraBox}>{selected.letra}</div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => handlePrint(selected)}
                >
                  Imprimir
                </button>

                <button
                  type="button"
                  className={styles.btnGreen}
                  onClick={() => handlePdf(selected)}
                >
                  Gerar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedCulto ? (
        <div className={styles.cultoOverlay} onClick={closeCulto}>
          <div
            className={styles.cultoModal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.cultoClose}
              onClick={closeCulto}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            {ordered.length > 1 ? (
              <>
                <button
                  type="button"
                  className={`${styles.cultoNavBtn} ${styles.cultoNavBtnLeft}`}
                  onClick={prevCulto}
                >
                  <ChevronLeft size={26} />
                </button>

                <button
                  type="button"
                  className={`${styles.cultoNavBtn} ${styles.cultoNavBtnRight}`}
                  onClick={nextCulto}
                >
                  <ChevronRight size={26} />
                </button>
              </>
            ) : null}

            <div className={styles.cultoHeader}>
              <div className={styles.cultoDepartamento}>{departamentoNome}</div>
              <h2 className={styles.cultoTitulo}>{selectedCulto.titulo}</h2>
              <div className={styles.cultoCounter}>
                {cultoIndex! + 1} / {ordered.length}
              </div>
            </div>

            <div className={styles.cultoLetra}>{selectedCulto.letra}</div>
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
