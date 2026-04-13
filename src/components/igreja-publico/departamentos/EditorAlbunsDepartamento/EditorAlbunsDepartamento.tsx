//src/components/igreja-publico/departamentos/EditorAlbunsDepartamento/EditorAlbunsDepartamento.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ImagePlus, PencilLine, Trash2, X } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import { useToast } from "@/components/ui/Toast/useToast";
import styles from "./styles.module.scss";

type DepartamentoOption = {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
};

type AlbumItem = {
  id: string;
  departamentoId: string;
  titulo: string;
  descricao?: string | null;
  dataEvento?: string | null;
  capaUrl?: string | null;
  capaPublicId?: string | null;
  ordem: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  departamento?: {
    id: string;
    nome: string;
    slug: string;
  } | null;
  imagens?: {
    id: string;
    imageUrl: string;
    ordem: number;
    createdAt: string;
  }[];
  _count?: {
    imagens: number;
  };
};

type Props = {
  igrejaId: string;
  canEdit: boolean;
  departamentos: DepartamentoOption[];
};

type ConfirmState =
  | { open: false }
  | {
      open: true;
      title: string;
      message: string;
      onConfirm: () => void;
    };

function revokeIfBlob(url?: string | null) {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function formatDateInput(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatDateBR(value?: string | null) {
  if (!value) return "Sem data";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Sem data";
  return d.toLocaleDateString("pt-BR");
}

function getAlbumCover(item: AlbumItem) {
  return item.capaUrl || item.imagens?.[0]?.imageUrl || null;
}

export default function EditorAlbunsDepartamento({
  igrejaId,
  canEdit,
  departamentos,
}: Props) {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<AlbumItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [departamentoId, setDepartamentoId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [ordem, setOrdem] = useState("0");
  const [ativo, setAtivo] = useState(true);

  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(null);
  const [removeCapa, setRemoveCapa] = useState(false);

  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  const departamentosAtivos = useMemo(
    () => departamentos.filter((item) => item.ativo),
    [departamentos],
  );

  async function load() {
    setLoading(true);

    try {
      const r = await fetch(`/api/departamentos/albuns?igrejaId=${igrejaId}`, {
        cache: "no-store",
      });

      const j = await r.json().catch(() => ({}));
      setItems(Array.isArray(j?.items) ? j.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [igrejaId]);

  useEffect(() => {
    return () => {
      revokeIfBlob(capaPreview);
    };
  }, [capaPreview]);

  function askConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirm({ open: true, title, message, onConfirm });
  }

  function resetForm() {
    revokeIfBlob(capaPreview);

    setEditingId(null);
    setDepartamentoId("");
    setTitulo("");
    setDescricao("");
    setDataEvento("");
    setOrdem("0");
    setAtivo(true);
    setCapaFile(null);
    setCapaPreview(null);
    setRemoveCapa(false);
  }

  function selectCapa(file: File | null) {
    if (!file) return;

    revokeIfBlob(capaPreview);

    setCapaFile(file);
    setCapaPreview(URL.createObjectURL(file));
    setRemoveCapa(false);
  }

  function removeCapaAtual() {
    revokeIfBlob(capaPreview);
    setCapaFile(null);
    setCapaPreview(null);
    setRemoveCapa(true);
  }

  function fillForm(item: AlbumItem) {
    resetForm();

    setEditingId(item.id);
    setDepartamentoId(item.departamentoId);
    setTitulo(item.titulo ?? "");
    setDescricao(item.descricao ?? "");
    setDataEvento(formatDateInput(item.dataEvento));
    setOrdem(String(item.ordem ?? 0));
    setAtivo(item.ativo !== false);
    setCapaPreview(item.capaUrl ?? null);
    setRemoveCapa(false);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!canEdit || saving) return;

    if (!departamentoId) {
      toast.error("Selecione o departamento.");
      return;
    }

    if (!titulo.trim()) {
      toast.error("Informe o título do álbum.");
      return;
    }

    setSaving(true);

    try {
      const fd = new FormData();

      fd.append("departamentoId", departamentoId);
      fd.append("titulo", titulo.trim());
      fd.append("descricao", descricao.trim());
      fd.append("dataEvento", dataEvento.trim());
      fd.append("ordem", String(Number(ordem || 0)));
      fd.append("ativo", ativo ? "true" : "false");
      fd.append("removeCapa", removeCapa ? "true" : "false");

      if (capaFile) {
        fd.append("capa", capaFile);
      }

      const url = editingId
        ? `/api/departamentos/albuns/${editingId}?igrejaId=${igrejaId}`
        : `/api/departamentos/albuns?igrejaId=${igrejaId}`;

      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: fd,
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(j?.error || "Erro ao salvar álbum.");
        return;
      }

      toast.success(editingId ? "Álbum atualizado ✅" : "Álbum criado ✅");
      resetForm();
      await load();
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: AlbumItem) {
    askConfirm(
      "Excluir álbum?",
      `Deseja realmente excluir "${item.titulo}"?`,
      async () => {
        try {
          const res = await fetch(
            `/api/departamentos/albuns/${item.id}?igrejaId=${igrejaId}`,
            {
              method: "DELETE",
            },
          );

          const j = await res.json().catch(() => ({}));

          if (!res.ok) {
            toast.error(j?.error || "Erro ao excluir álbum.");
            return;
          }

          toast.success("Álbum excluído ✅");
          setConfirm({ open: false });

          if (editingId === item.id) {
            resetForm();
          }

          await load();
        } catch {
          toast.error("Erro de conexão.");
        }
      },
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Álbuns dos departamentos</h1>
        <p className={styles.subtitle}>
          Cadastre os eventos e galerias de cada departamento.
        </p>

        {!canEdit && (
          <div className={styles.msg}>🔒 Você está em modo visualização.</div>
        )}

        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.block}>
            <div className={styles.blockTitle}>
              {editingId ? "Editar álbum" : "Novo álbum"}
            </div>

            <div className={styles.grid2}>
              <div>
                <label className={styles.label}>Departamento</label>
                <select
                  className={styles.input}
                  value={departamentoId}
                  onChange={(e) => setDepartamentoId(e.target.value)}
                  disabled={!canEdit || saving}
                >
                  <option value="">Selecione</option>
                  {departamentosAtivos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={styles.label}>Ordem</label>
                <input
                  className={styles.input}
                  type="number"
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value)}
                  disabled={!canEdit || saving}
                />
              </div>
            </div>

            <label className={styles.label}>Título do álbum</label>
            <input
              className={styles.input}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="Ex: Culto das Mulheres — Abril 2026"
            />

            <label className={styles.label}>Descrição</label>
            <textarea
              className={styles.textarea}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="Descrição curta do evento"
            />

            <div className={styles.grid2}>
              <div>
                <label className={styles.label}>Data do evento</label>
                <input
                  className={styles.input}
                  type="date"
                  value={dataEvento}
                  onChange={(e) => setDataEvento(e.target.value)}
                  disabled={!canEdit || saving}
                />
              </div>

              <div className={styles.switchWrap}>
                <label className={styles.switchLabel}>
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    disabled={!canEdit || saving}
                  />
                  <span>Álbum ativo</span>
                </label>
              </div>
            </div>

            <div className={styles.uploadCard}>
              <label className={styles.label}>Capa do álbum</label>

              {capaPreview ? (
                <div className={styles.previewHeroBox}>
                  <img
                    src={capaPreview}
                    alt="Preview capa"
                    className={styles.previewHeroImage}
                  />
                  {canEdit && (
                    <button
                      type="button"
                      className={styles.removePreviewBtn}
                      onClick={removeCapaAtual}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.emptyPreview}>Sem capa manual</div>
              )}

              <div className={styles.fileRow}>
                <input
                  id="albumCapa"
                  className={styles.fileInput}
                  type="file"
                  accept="image/*"
                  disabled={!canEdit || saving}
                  onChange={(e) => selectCapa(e.target.files?.[0] ?? null)}
                />

                <label
                  htmlFor="albumCapa"
                  className={`${styles.fileBtn} ${capaFile ? styles.fileBtnSelected : ""}`}
                >
                  <ImagePlus size={16} />
                  <span>
                    {capaFile ? "Novo arquivo selecionado" : "Escolher capa"}
                  </span>
                </label>
              </div>
            </div>

            {canEdit && (
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
                      : "Cadastrar álbum"}
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
            )}
          </div>
        </form>

        <div className={styles.block}>
          <div className={styles.blockTitle}>Álbuns cadastrados</div>

          {loading ? (
            <div className={styles.empty}>Carregando álbuns...</div>
          ) : !items.length ? (
            <div className={styles.empty}>Nenhum álbum cadastrado.</div>
          ) : (
            <div className={styles.list}>
              {items.map((item) => {
                const cover = getAlbumCover(item);
                const totalFotos = item._count?.imagens ?? 0;
                const usaCapaAutomatica =
                  !item.capaUrl && !!item.imagens?.length;

                return (
                  <article key={item.id} className={styles.itemCard}>
                    <div className={styles.itemCover}>
                      {cover ? (
                        <img
                          src={cover}
                          alt={item.titulo}
                          className={styles.itemCoverImage}
                        />
                      ) : (
                        <div className={styles.itemCoverEmpty}>Sem capa</div>
                      )}
                    </div>

                    <div className={styles.itemBody}>
                      <div className={styles.itemTop}>
                        <h3 className={styles.itemTitle}>{item.titulo}</h3>

                        <div className={styles.badges}>
                          <span className={styles.badge}>
                            {item.departamento?.nome || "Departamento"}
                          </span>

                          <span
                            className={`${styles.badge} ${
                              item.ativo ? styles.badgeGreen : styles.badgeGray
                            }`}
                          >
                            {item.ativo ? "Ativo" : "Inativo"}
                          </span>

                          <span className={styles.badge}>
                            {totalFotos} foto(s)
                          </span>

                          {usaCapaAutomatica ? (
                            <span className={styles.badgeAuto}>
                              Capa automática
                            </span>
                          ) : item.capaUrl ? (
                            <span className={styles.badgeManual}>
                              Capa manual
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {item.descricao ? (
                        <p className={styles.itemDesc}>{item.descricao}</p>
                      ) : null}

                      <div className={styles.metaRow}>
                        <span>Data: {formatDateBR(item.dataEvento)}</span>
                        <span>Ordem: {item.ordem}</span>
                      </div>

                      <div className={styles.cardActions}>
                        <Link
                          href={`/dashboard/publico/departamentos/albuns/${item.id}/fotos`}
                          className={styles.photosButton}
                        >
                          Fotos ({totalFotos})
                        </Link>

                        {canEdit && (
                          <>
                            <button
                              type="button"
                              className={styles.editButton}
                              onClick={() => fillForm(item)}
                            >
                              <PencilLine size={16} />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              className={styles.deleteButton}
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 size={16} />
                              <span>Excluir</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
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
