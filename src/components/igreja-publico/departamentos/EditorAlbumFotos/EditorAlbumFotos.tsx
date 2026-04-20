//src/components/igreja-publico/departamentos/EditorAlbumFotos/EditorAlbumFotos.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  PencilLine,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import { useToast } from "@/components/ui/Toast/useToast";
import styles from "./styles.module.scss";

type Item = {
  id: string;
  titulo?: string | null;
  altText?: string | null;
  imageUrl: string;
  publicId: string;
  ordem: number;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  igrejaId: string;
  albumId: string;
  albumTitulo: string;
  departamentoNome: string;
  canEdit: boolean;
  canDelete: boolean;
};

type ConfirmState =
  | { open: false }
  | {
      open: true;
      title: string;
      message: string;
      onConfirm: () => void;
    };

function revokeBlobUrls(urls: string[]) {
  urls.forEach((url) => {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  });
}

type EditState = {
  [id: string]: {
    ordem: string;
    file: File | null;
    previewUrl: string | null;
    saving: boolean;
  };
};

export default function EditorAlbumFotos({
  igrejaId,
  albumId,
  albumTitulo,
  departamentoNome,
  canEdit,
  canDelete,
}: Props) {
  const toast = useToast();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [ordemInicial, setOrdemInicial] = useState("");

  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });
  const [editMap, setEditMap] = useState<EditState>({});

  async function load() {
    setLoading(true);

    try {
      const r = await fetch(
        `/api/departamentos/albuns/${albumId}/imagens?igrejaId=${igrejaId}`,
        {
          cache: "no-store",
        },
      );

      const j = await r.json().catch(() => ({}));
      const nextItems = Array.isArray(j?.items) ? j.items : [];
      setItems(nextItems);

      setEditMap((prev) => {
        const next: EditState = {};

        nextItems.forEach((item: Item) => {
          next[item.id] = {
            ordem: prev[item.id]?.ordem ?? String(item.ordem ?? 1),
            file: null,
            previewUrl: null,
            saving: false,
          };
        });

        Object.values(prev).forEach((state) => {
          if (state.previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(state.previewUrl);
          }
        });

        return next;
      });
    } catch {
      setItems([]);
      setEditMap({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [albumId, igrejaId]);

  useEffect(() => {
    return () => {
      revokeBlobUrls(previewUrls);

      Object.values(editMap).forEach((state) => {
        if (state.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(state.previewUrl);
        }
      });
    };
  }, [previewUrls, editMap]);

  const proximaOrdem = useMemo(() => {
    if (!items.length) return 1;
    return Math.max(...items.map((item) => item.ordem || 0)) + 1;
  }, [items]);

  function askConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirm({ open: true, title, message, onConfirm });
  }

  function resetUpload() {
    revokeBlobUrls(previewUrls);
    setFiles([]);
    setPreviewUrls([]);
    setOrdemInicial("");
  }

  function handleSelectFiles(list: FileList | null) {
    if (!list?.length) return;

    revokeBlobUrls(previewUrls);

    const nextFiles = Array.from(list);
    const nextPreviews = nextFiles.map((file) => URL.createObjectURL(file));

    setFiles(nextFiles);
    setPreviewUrls(nextPreviews);
  }

  function updateEditOrdem(id: string, value: string) {
    setEditMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ordem: value,
      },
    }));
  }

  function updateEditFile(id: string, file: File | null) {
    setEditMap((prev) => {
      const current = prev[id];

      if (current?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return {
        ...prev,
        [id]: {
          ...current,
          file,
          previewUrl: file ? URL.createObjectURL(file) : null,
        },
      };
    });
  }

  async function handleSaveFoto(item: Item) {
    if (!canEdit) return;

    const state = editMap[item.id];
    if (!state || state.saving) return;

    setEditMap((prev) => ({
      ...prev,
      [item.id]: {
        ...prev[item.id],
        saving: true,
      },
    }));

    try {
      const fd = new FormData();
      fd.append("ordem", String(Number(state.ordem || item.ordem || 1)));

      if (state.file) {
        fd.append("imagem", state.file);
      }

      const res = await fetch(
        `/api/departamentos/albuns/imagens/${item.id}?igrejaId=${igrejaId}`,
        {
          method: "PATCH",
          body: fd,
        },
      );

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(j?.error || "Erro ao salvar foto.");
        setEditMap((prev) => ({
          ...prev,
          [item.id]: {
            ...prev[item.id],
            saving: false,
          },
        }));
        return;
      }

      toast.success("Foto atualizada ✅");
      await load();
    } catch {
      toast.error("Erro de conexão.");
      setEditMap((prev) => ({
        ...prev,
        [item.id]: {
          ...prev[item.id],
          saving: false,
        },
      }));
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!canEdit || saving) return;

    if (!files.length) {
      toast.error("Selecione pelo menos uma imagem.");
      return;
    }

    setSaving(true);

    try {
      const fd = new FormData();

      fd.append(
        "ordemInicial",
        String(Number(ordemInicial || proximaOrdem || 1)),
      );

      files.forEach((file) => {
        fd.append("imagens", file);
      });

      const res = await fetch(
        `/api/departamentos/albuns/${albumId}/imagens?igrejaId=${igrejaId}`,
        {
          method: "POST",
          body: fd,
        },
      );

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(j?.error || "Erro ao enviar imagens.");
        return;
      }

      toast.success("Fotos enviadas ✅");
      resetUpload();
      await load();
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: Item) {
    askConfirm(
      "Excluir foto?",
      "Deseja realmente excluir esta foto do álbum?",
      async () => {
        try {
          const res = await fetch(
            `/api/departamentos/albuns/imagens/${item.id}?igrejaId=${igrejaId}`,
            {
              method: "DELETE",
            },
          );

          const j = await res.json().catch(() => ({}));

          if (!res.ok) {
            toast.error(j?.error || "Erro ao excluir foto.");
            return;
          }

          toast.success("Foto excluída ✅");
          setConfirm({ open: false });
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
        <div className={styles.topBar}>
          <Link
            href="/dashboard/publico/departamentos/albuns"
            className={styles.backButton}
          >
            <ArrowLeft size={16} />
            <span>Voltar para álbuns</span>
          </Link>
        </div>

        <h1 className={styles.title}>Fotos do álbum</h1>
        <p className={styles.subtitle}>
          <strong>{albumTitulo}</strong> — {departamentoNome}
        </p>

        {!canEdit && !canDelete && (
          <div className={styles.msg}>🔒 Você está em modo visualização.</div>
        )}

        <form className={styles.block} onSubmit={handleUpload}>
          <div className={styles.blockTitle}>Enviar novas fotos</div>

          <div className={styles.grid2}>
            <div>
              <label className={styles.label}>Ordem inicial</label>
              <input
                className={styles.input}
                type="number"
                value={ordemInicial}
                onChange={(e) => setOrdemInicial(e.target.value)}
                disabled={!canEdit || saving}
                placeholder={String(proximaOrdem)}
              />
            </div>

            <div>
              <label className={styles.label}>Arquivos</label>
              <input
                id="albumFotos"
                className={styles.fileInput}
                type="file"
                accept="image/*"
                multiple
                disabled={!canEdit || saving}
                onChange={(e) => handleSelectFiles(e.target.files)}
              />

              <label
                htmlFor="albumFotos"
                className={`${styles.fileBtn} ${files.length ? styles.fileBtnSelected : ""}`}
              >
                <ImagePlus size={16} />
                <span>
                  {files.length
                    ? `${files.length} arquivo(s) selecionado(s)`
                    : "Escolher fotos"}
                </span>
              </label>
            </div>
          </div>

          {previewUrls.length ? (
            <div className={styles.previewGrid}>
              {previewUrls.map((url, index) => (
                <div key={index} className={styles.previewCard}>
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className={styles.previewImage}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>Nenhuma foto selecionada.</div>
          )}

          {canEdit && (
            <div className={styles.actionRow}>
              <button
                className={styles.btnGreen}
                type="submit"
                disabled={saving}
              >
                {saving ? "Enviando..." : "Enviar fotos"}
              </button>

              <button
                className={styles.btnSecondary}
                type="button"
                onClick={resetUpload}
                disabled={saving}
              >
                Limpar seleção
              </button>
            </div>
          )}
        </form>

        <div className={styles.block}>
          <div className={styles.blockTitle}>Fotos cadastradas</div>

          {loading ? (
            <div className={styles.empty}>Carregando fotos...</div>
          ) : !items.length ? (
            <div className={styles.empty}>
              Nenhuma foto cadastrada neste álbum.
            </div>
          ) : (
            <div className={styles.galleryGrid}>
              {items.map((item) => {
                const state = editMap[item.id];

                return (
                  <article key={item.id} className={styles.imageCard}>
                    <div className={styles.imageWrap}>
                      <img
                        src={state?.previewUrl || item.imageUrl}
                        alt={item.altText || item.titulo || "Foto do álbum"}
                        className={styles.image}
                      />
                    </div>

                    <div className={styles.imageBody}>
                      <div className={styles.imageMeta}>
                        <label className={styles.smallLabel}>Ordem</label>
                        <input
                          type="number"
                          className={styles.smallInput}
                          value={state?.ordem ?? String(item.ordem)}
                          onChange={(e) =>
                            updateEditOrdem(item.id, e.target.value)
                          }
                          disabled={!canEdit || state?.saving}
                        />
                      </div>

                      {canEdit && (
                        <div className={styles.fileRow}>
                          <input
                            id={`trocar-foto-${item.id}`}
                            className={styles.fileInput}
                            type="file"
                            accept="image/*"
                            disabled={state?.saving}
                            onChange={(e) =>
                              updateEditFile(
                                item.id,
                                e.target.files?.[0] ?? null,
                              )
                            }
                          />

                          <label
                            htmlFor={`trocar-foto-${item.id}`}
                            className={styles.fileBtn}
                          >
                            <ImagePlus size={16} />
                            <span>Trocar foto</span>
                          </label>
                        </div>
                      )}

                      <div className={styles.imageActions}>
                        {canEdit && (
                          <button
                            type="button"
                            className={styles.editButton}
                            onClick={() => handleSaveFoto(item)}
                            disabled={state?.saving}
                          >
                            <Save size={16} />
                            <span>
                              {state?.saving ? "Salvando..." : "Salvar"}
                            </span>
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 size={16} />
                            <span>Excluir</span>
                          </button>
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
