//src/components/igreja-publico/eventos/EditorEventoFotos/EditorEventoFotos.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import { useToast } from "@/components/ui/Toast/useToast";
import styles from "./styles.module.scss";

type Item = {
  id: string;
  imageUrl: string;
  publicId: string;
  ordem: number;
  titulo?: string | null;
  altText?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  igrejaId: string;
  eventoId: string;
  eventoTitulo: string;
  canEdit: boolean;
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

export default function EditorEventoFotos({
  igrejaId,
  eventoId,
  eventoTitulo,
  canEdit,
}: Props) {
  const toast = useToast();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [ordemInicial, setOrdemInicial] = useState("");

  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  async function load() {
    setLoading(true);

    try {
      const r = await fetch(
        `/api/eventos/${eventoId}/imagens?igrejaId=${igrejaId}`,
        {
          cache: "no-store",
        },
      );

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
  }, [eventoId, igrejaId]);

  useEffect(() => {
    return () => {
      revokeBlobUrls(previewUrls);
    };
  }, [previewUrls]);

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
        `/api/eventos/${eventoId}/imagens?igrejaId=${igrejaId}`,
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
      "Deseja realmente excluir esta foto do evento?",
      async () => {
        try {
          const res = await fetch(
            `/api/eventos/imagens/${item.id}?igrejaId=${igrejaId}`,
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
          <Link href="/dashboard/publico/eventos" className={styles.backButton}>
            <ArrowLeft size={16} />
            <span>Voltar para eventos</span>
          </Link>
        </div>

        <h1 className={styles.title}>Fotos do evento</h1>
        <p className={styles.subtitle}>{eventoTitulo}</p>

        {!canEdit && (
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
                id="eventoFotos"
                className={styles.fileInput}
                type="file"
                accept="image/*"
                multiple
                disabled={!canEdit || saving}
                onChange={(e) => handleSelectFiles(e.target.files)}
              />

              <label
                htmlFor="eventoFotos"
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
              Nenhuma foto cadastrada neste evento.
            </div>
          ) : (
            <div className={styles.galleryGrid}>
              {items.map((item) => (
                <article key={item.id} className={styles.imageCard}>
                  <div className={styles.imageWrap}>
                    <img
                      src={item.imageUrl}
                      alt={item.altText || item.titulo || "Foto do evento"}
                      className={styles.image}
                    />
                  </div>

                  <div className={styles.imageBody}>
                    <div className={styles.imageMeta}>
                      <span>Ordem: {item.ordem}</span>
                    </div>

                    {canEdit && (
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
                </article>
              ))}
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
