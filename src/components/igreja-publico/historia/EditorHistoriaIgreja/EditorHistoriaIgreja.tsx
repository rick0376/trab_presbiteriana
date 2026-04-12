//src/components/igreja-publico/historia/EditorHistoriaIgreja/EditorHistoriaIgreja.tsx

"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import { useToast } from "@/components/ui/Toast/useToast";
import styles from "./styles.module.scss";

type Props = {
  igrejaId: string;
  initialData: any;
  canEdit: boolean;
};

type Marco = {
  ano: string;
  titulo: string;
  descricao: string;
  ordem: number;
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

export default function EditorHistoriaIgreja({
  igrejaId,
  initialData,
  canEdit,
}: Props) {
  const toast = useToast();

  const [titulo, setTitulo] = useState(initialData?.titulo ?? "");
  const [subtitulo, setSubtitulo] = useState(initialData?.subtitulo ?? "");
  const [texto, setTexto] = useState(initialData?.texto ?? "");
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(
    initialData?.imagemCapaUrl ?? null,
  );
  const [removeImagem, setRemoveImagem] = useState(false);
  const [marcos, setMarcos] = useState<Marco[]>(
    initialData?.marcos?.map((m: any, i: number) => ({
      ano: m.ano ?? "",
      titulo: m.titulo ?? "",
      descricao: m.descricao ?? "",
      ordem: m.ordem ?? i + 1,
    })) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  useEffect(() => {
    return () => revokeIfBlob(imagemPreview);
  }, [imagemPreview]);

  function askConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirm({ open: true, title, message, onConfirm });
  }

  function addMarco() {
    setMarcos((prev) => [
      ...prev,
      {
        ano: "",
        titulo: "",
        descricao: "",
        ordem: prev.length + 1,
      },
    ]);
  }

  function removeMarco(index: number) {
    askConfirm("Excluir marco?", "Esse marco será removido ao salvar.", () => {
      setMarcos((prev) =>
        prev
          .filter((_, i) => i !== index)
          .map((item, idx) => ({ ...item, ordem: idx + 1 })),
      );
      setConfirm({ open: false });
    });
  }

  function updateMarco(index: number, field: keyof Marco, value: string) {
    setMarcos((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function selectImagem(file: File | null) {
    if (!file) return;

    revokeIfBlob(imagemPreview);
    setImagemFile(file);
    setImagemPreview(URL.createObjectURL(file));
    setRemoveImagem(false);
  }

  function handleRemoveImagem() {
    revokeIfBlob(imagemPreview);
    setImagemFile(null);
    setImagemPreview(null);
    setRemoveImagem(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    if (!canEdit || saving) return;

    if (!titulo.trim()) {
      toast.error("Informe o título da história.");
      return;
    }

    setSaving(true);

    try {
      const fd = new FormData();

      fd.append("titulo", titulo.trim());
      fd.append("subtitulo", subtitulo.trim());
      fd.append("texto", texto.trim());
      fd.append("removeImagem", removeImagem ? "true" : "false");
      fd.append(
        "marcos",
        JSON.stringify(
          marcos.map((item, i) => ({
            ano: item.ano.trim(),
            titulo: item.titulo.trim(),
            descricao: item.descricao.trim(),
            ordem: i + 1,
          })),
        ),
      );

      if (imagemFile) {
        fd.append("imagemCapa", imagemFile);
      }

      const res = await fetch(`/api/historia-igreja?igrejaId=${igrejaId}`, {
        method: "PUT",
        body: fd,
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(j?.error || "Erro ao salvar história.");
        return;
      }

      toast.success("História salva com sucesso ✅");

      if (j?.item?.imagemCapaUrl) {
        setImagemPreview(j.item.imagemCapaUrl);
        setImagemFile(null);
        setRemoveImagem(false);
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>História da Igreja</h1>
        <p className={styles.subtitle}>
          Cadastre a história institucional e os marcos importantes da igreja.
        </p>

        {!canEdit && (
          <div className={styles.msg}>🔒 Você está em modo visualização.</div>
        )}

        <form className={styles.form} onSubmit={salvar}>
          <div className={styles.block}>
            <div className={styles.blockTitle}>Conteúdo principal</div>

            <label className={styles.label}>Título</label>
            <input
              className={styles.input}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="Ex: Nossa História"
            />

            <label className={styles.label}>Subtítulo</label>
            <input
              className={styles.input}
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="Ex: Como Deus tem conduzido nossa caminhada"
            />

            <label className={styles.label}>Texto completo</label>
            <textarea
              className={styles.textareaLarge}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="Escreva aqui a história completa da igreja..."
            />

            <div className={styles.uploadCard}>
              <label className={styles.label}>Imagem de capa</label>

              {imagemPreview ? (
                <div className={styles.previewHeroBox}>
                  <img
                    src={imagemPreview}
                    alt="Preview capa"
                    className={styles.previewHeroImage}
                  />
                  {canEdit && (
                    <button
                      type="button"
                      className={styles.removePreviewBtn}
                      onClick={handleRemoveImagem}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.emptyPreview}>Sem imagem</div>
              )}

              <div className={styles.fileRow}>
                <input
                  id="historiaImagem"
                  className={styles.fileInput}
                  type="file"
                  accept="image/*"
                  disabled={!canEdit || saving}
                  onChange={(e) => selectImagem(e.target.files?.[0] ?? null)}
                />

                <label
                  htmlFor="historiaImagem"
                  className={`${styles.fileBtn} ${imagemFile ? styles.fileBtnSelected : ""}`}
                >
                  <ImagePlus size={16} />
                  <span>
                    {imagemFile
                      ? "Novo arquivo selecionado"
                      : "Escolher imagem"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.block}>
            <div className={styles.blockTitle}>Marcos importantes</div>

            {marcos.map((marco, index) => (
              <div key={index} className={styles.marcoCard}>
                <div className={styles.grid2}>
                  <div>
                    <label className={styles.label}>Ano</label>
                    <input
                      className={styles.input}
                      value={marco.ano}
                      onChange={(e) =>
                        updateMarco(index, "ano", e.target.value)
                      }
                      disabled={!canEdit || saving}
                      placeholder="Ex: 1998"
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Título do marco</label>
                    <input
                      className={styles.input}
                      value={marco.titulo}
                      onChange={(e) =>
                        updateMarco(index, "titulo", e.target.value)
                      }
                      disabled={!canEdit || saving}
                      placeholder="Ex: Fundação da igreja"
                    />
                  </div>
                </div>

                <label className={styles.label}>Descrição</label>
                <textarea
                  className={styles.textarea}
                  value={marco.descricao}
                  onChange={(e) =>
                    updateMarco(index, "descricao", e.target.value)
                  }
                  disabled={!canEdit || saving}
                  placeholder="Descrição do marco"
                />

                {canEdit && (
                  <button
                    className={styles.deleteButton}
                    type="button"
                    onClick={() => removeMarco(index)}
                  >
                    <Trash2 size={18} />
                    Remover marco
                  </button>
                )}
              </div>
            ))}

            {canEdit && (
              <button className={styles.btn} type="button" onClick={addMarco}>
                + Adicionar marco
              </button>
            )}
          </div>

          {canEdit && (
            <button className={styles.btnGreen} type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar história"}
            </button>
          )}
        </form>
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
