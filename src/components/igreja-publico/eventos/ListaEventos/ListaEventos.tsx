// comnponents/igreja-publico/eventos/ListaEventos/ListaEventos.tsx

"use client";

import { useState } from "react";
import styles from "./styles.module.scss";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import { useToast } from "@/components/ui/Toast/useToast";
import { Images, PencilLine, Trash2, X } from "lucide-react";
import Link from "next/link";

export type Evento = {
  id: string;
  titulo: string;
  data: string; // ISO
  imagemUrl?: string | null;
  tipo?: string | null;
  responsavel?: string | null;
  local?: string | null;
  descricao?: string | null;
};

type Props = {
  eventos: Evento[];
  igrejaId: string;
  onChange: () => void | Promise<void>;
  canEdit: boolean;
};

type ConfirmState =
  | { open: false }
  | { open: true; title: string; message: string; onConfirm: () => void };

export default function ListaEventos({
  eventos,
  igrejaId,
  onChange,
  canEdit,
}: Props) {
  const toast = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [tipo, setTipo] = useState("Evento");
  const [responsavel, setResponsavel] = useState("");
  const [local, setLocal] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });
  const [selected, setSelected] = useState<Evento | null>(null);

  function askConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirm({ open: true, title, message, onConfirm });
  }

  function isoToDatetimeLocal(iso: string) {
    // Remove o Z e os segundos, mantém apenas YYYY-MM-DDTHH:mm
    return iso.slice(0, 16);
  }

  function formatBR(iso: string) {
    const d = new Date(iso);

    if (Number.isNaN(d.getTime())) return "";

    return d.toLocaleString("pt-BR", {
      timeZone: "UTC",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function cloudCard(url?: string | null) {
    if (!url) return null;
    return url.replace("/upload/", "/upload/w_900,q_auto,f_auto/");
  }

  function cloudModal(url?: string | null) {
    if (!url) return null;
    return url.replace("/upload/", "/upload/w_1400,q_auto,f_auto/");
  }

  function clearPreview() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }

  function startEdit(ev: Evento) {
    if (!canEdit) return;
    clearPreview();
    setEditingId(ev.id);
    setTitulo(ev.titulo);
    setData(isoToDatetimeLocal(ev.data));
    setTipo(ev.tipo ?? "Evento");
    setResponsavel(ev.responsavel ?? "");
    setLocal(ev.local ?? "");
    setDescricao(ev.descricao ?? "");
    setImagem(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setTitulo("");
    setData("");
    setTipo("Evento");
    setResponsavel("");
    setLocal("");
    setDescricao("");
    setImagem(null);
    clearPreview();
  }

  function linkify(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        );
      }
      return part;
    });
  }

  async function saveEdit(id: string) {
    if (!canEdit || saving) return;

    if (!titulo.trim()) return toast.error("Digite o título.");
    if (!data.trim()) return toast.error("Selecione a data e hora.");

    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("igrejaId", igrejaId);
      fd.append("titulo", titulo.trim());
      fd.append("data", data);
      fd.append("tipo", tipo);
      fd.append("responsavel", responsavel.trim());
      fd.append("local", local.trim());
      fd.append("descricao", descricao.trim());

      if (imagem) fd.append("imagem", imagem);

      const res = await fetch(`/api/eventos/${id}`, {
        method: "PATCH",
        body: fd,
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(j?.error || "Falha ao salvar.");
        return;
      }

      cancelEdit();
      await Promise.resolve(onChange());
      toast.success("Evento atualizado ✅");
    } catch {
      toast.error("Falha de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!canEdit || saving) return;

    askConfirm(
      "Excluir evento?",
      "Esta ação não pode ser desfeita.",
      async () => {
        setConfirm({ open: false });
        setSaving(true);

        try {
          const res = await fetch(`/api/eventos/${id}`, { method: "DELETE" });
          const j = await res.json().catch(() => ({}));

          if (!res.ok) {
            toast.error(j?.error || "Falha ao excluir.");
            return;
          }

          if (editingId === id) cancelEdit();
          if (selected?.id === id) setSelected(null);

          await Promise.resolve(onChange());
          toast.success("Evento excluído ✅");
        } catch {
          toast.error("Falha de conexão.");
        } finally {
          setSaving(false);
        }
      },
    );
  }

  if (!eventos.length) {
    return <div className={styles.empty}>Nenhum evento cadastrado ainda.</div>;
  }

  return (
    <>
      <div className={styles.cards}>
        {eventos.map((ev) => {
          const isEditing = editingId === ev.id;
          const existingImg = ev.imagemUrl ? cloudModal(ev.imagemUrl) : null;

          // ✅ prioridade: preview (imagem nova escolhida) > imagem atual
          const editImgSrc = preview ?? existingImg;

          return (
            <div key={ev.id} className={styles.cardWrap}>
              {!isEditing ? (
                <div
                  className={styles.card}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(ev)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelected(ev);
                  }}
                >
                  <div className={styles.thumb}>
                    <img
                      className={styles.thumbImg}
                      src={
                        ev.imagemUrl
                          ? cloudCard(ev.imagemUrl)!
                          : "/images/pastor.png"
                      }
                      alt=""
                    />

                    <div className={styles.badges}>
                      {ev.tipo ? (
                        <span className={styles.badge}>{ev.tipo}</span>
                      ) : null}
                      <span className={styles.badge}>{formatBR(ev.data)}</span>
                    </div>
                  </div>

                  <div className={styles.body}>
                    <div className={styles.title}>{ev.titulo}</div>
                    <div className={styles.meta}>
                      {ev.local
                        ? ev.local
                        : ev.responsavel
                          ? ev.responsavel
                          : "—"}
                    </div>
                  </div>

                  {canEdit ? (
                    <div
                      className={styles.actions}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/dashboard/publico/eventos/${ev.id}/fotos`}
                        className={styles.iconBtnPhotos}
                        aria-label="Fotos"
                        title="Fotos do evento"
                      >
                        <Images size={18} />
                      </Link>

                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => startEdit(ev)}
                        disabled={saving}
                        aria-label="Editar"
                      >
                        <PencilLine size={18} />
                      </button>

                      <button
                        type="button"
                        className={styles.iconBtnDanger}
                        onClick={() => remove(ev.id)}
                        disabled={saving}
                        aria-label="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className={styles.editCard}>
                  <div className={styles.editLayout}>
                    <div className={styles.editMedia}>
                      {editImgSrc ? (
                        <img
                          className={styles.editImg}
                          src={editImgSrc}
                          alt=""
                        />
                      ) : (
                        <div className={styles.editImgPlaceholder}>
                          Sem imagem
                        </div>
                      )}

                      <div className={styles.field}>
                        <label className={styles.label}>
                          Trocar imagem (opcional)
                        </label>

                        <div className={styles.fileRow}>
                          <input
                            id={`eventoImagem-${ev.id}`}
                            className={styles.fileInput}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              setImagem(file);

                              // 🔥 atualiza preview sempre
                              clearPreview();
                              if (file) setPreview(URL.createObjectURL(file));
                            }}
                            disabled={saving}
                          />

                          <label
                            htmlFor={`eventoImagem-${ev.id}`}
                            className={`${styles.fileBtn} ${
                              imagem ? styles.fileBtnSelected : ""
                            }`}
                          >
                            {imagem
                              ? "Arquivo selecionado"
                              : "Escolher arquivo"}
                          </label>

                          <span
                            className={`${styles.fileName} ${
                              imagem ? styles.fileNameSelected : ""
                            }`}
                          >
                            {imagem?.name || "Nenhum arquivo escolhido"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.editFields}>
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
                          <label className={styles.label}>Data e hora</label>
                          <input
                            className={styles.input}
                            type="datetime-local"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                            disabled={saving}
                          />
                        </div>

                        <div className={styles.field}>
                          <label className={styles.label}>Tipo</label>
                          <select
                            className={styles.input}
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                            disabled={saving}
                          >
                            <option value="Evento">Evento</option>
                            <option value="Culto">Culto</option>
                            <option value="Pregação">Pregação</option>
                            <option value="Conferência">Conferência</option>
                            <option value="Seminário">Seminário</option>
                            <option value="Congresso">Congresso</option>
                            <option value="Ceia">Santa Ceia</option>
                          </select>
                        </div>

                        <div className={styles.field}>
                          <label className={styles.label}>Responsável</label>
                          <input
                            className={styles.input}
                            value={responsavel}
                            onChange={(e) => setResponsavel(e.target.value)}
                            disabled={saving}
                            placeholder="Ex: Pr. Carlos Lima"
                          />
                        </div>

                        <div className={styles.field}>
                          <label className={styles.label}>Local</label>
                          <input
                            className={styles.input}
                            value={local}
                            onChange={(e) => setLocal(e.target.value)}
                            disabled={saving}
                            placeholder="Ex: Rua X, 123 - Centro"
                          />
                        </div>

                        <div className={styles.field}>
                          <label className={styles.label}>Descrição</label>
                          <textarea
                            className={styles.input}
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            rows={4}
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <div className={styles.editActions}>
                        <button
                          type="button"
                          className={styles.btn}
                          onClick={() => saveEdit(ev.id)}
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected ? (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitle}>{selected.titulo}</div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setSelected(null)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalMedia}>
                <img
                  className={styles.modalMediaImg}
                  src={
                    selected.imagemUrl
                      ? cloudModal(selected.imagemUrl)!
                      : "/images/pastor.png"
                  }
                  alt=""
                />
              </div>

              <div className={styles.modalSide}>
                <div className={styles.modalMeta}>
                  <span>{selected.tipo ?? "Evento"}</span>
                  <span>•</span>
                  <span>{formatBR(selected.data)}</span>
                </div>

                {selected.responsavel ? (
                  <div className={styles.modalRow}>
                    <strong>Responsável:</strong> {selected.responsavel}
                  </div>
                ) : null}

                {selected.local ? (
                  <div className={styles.modalRow}>
                    <strong>Local:</strong> {selected.local}
                  </div>
                ) : null}

                <div className={styles.tabs}>
                  <div className={`${styles.tabBtn} ${styles.tabActive}`}>
                    Descrição
                  </div>
                </div>

                {selected.descricao ? (
                  <div className={styles.modalDesc}>
                    {linkify(selected.descricao)}
                  </div>
                ) : (
                  <div className={styles.modalDescMuted}>Sem descrição.</div>
                )}
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
    </>
  );
}
