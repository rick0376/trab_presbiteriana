// src/components/igreja-publico/eventos/EditorEventos/EditorEventos.tsx

"use client";

import { useEffect, useState } from "react";
import ListaEventos from "../ListaEventos/ListaEventos";
import styles from "./styles.module.scss";
import { useToast } from "@/components/ui/Toast/useToast";

export type Evento = {
  id: string;
  titulo: string;
  data: string;
  imagemUrl?: string | null;
  tipo?: string | null;
  responsavel?: string | null;
  local?: string | null;
  descricao?: string | null;
};

export default function EditorEventos({
  igrejaId,
  canEdit = false,
}: {
  igrejaId: string;
  canEdit?: boolean;
}) {
  const toast = useToast();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [tipo, setTipo] = useState("Evento");
  const [responsavel, setResponsavel] = useState("");
  const [local, setLocal] = useState("Rua Rafael Popoaski, 130 - Ipê I - MC");
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/eventos?igrejaId=${igrejaId}`, {
        cache: "no-store",
      });
      const j = await r.json().catch(() => ({}));
      setEventos(Array.isArray(j?.eventos) ? j.eventos : []);
    } catch {
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [igrejaId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit || saving) return;

    if (!titulo.trim()) {
      toast.error("Digite o título.");
      return;
    }

    if (!data.trim()) {
      toast.error("Selecione a data e hora.");
      return;
    }

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

      const res = await fetch("/api/eventos", {
        method: "POST",
        body: fd,
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(j?.error || "Falha ao criar evento.");
        return;
      }

      // reset form
      setTitulo("");
      setData("");
      setTipo("Evento");
      setResponsavel("");
      setLocal("");
      setDescricao("");
      setImagem(null);
      setPreview(null); // Limpar o preview

      toast.success("Evento adicionado ✅");
      await load();
    } catch {
      toast.error("Falha de conexão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.h2}>📅 Eventos</h2>
            <p className={styles.sub}>
              Cadastre eventos que aparecerão no site público.
            </p>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.field}>
            <label className={styles.label}>Título</label>
            <input
              className={styles.input}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="Ex: Santa Ceia, Vigília..."
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Data e hora</label>
            <input
              className={styles.input}
              type="datetime-local"
              value={data}
              onChange={(e) => setData(e.target.value)}
              disabled={!canEdit || saving}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Tipo</label>
            <select
              className={styles.input}
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              disabled={!canEdit || saving}
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
              disabled={!canEdit || saving}
              placeholder="Ex: Pr. Carlos Lima"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Local</label>
            <input
              className={styles.input}
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="Ex: Rua X, 123 - Centro"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descrição</label>
            <textarea
              className={styles.input}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={!canEdit || saving}
              rows={4}
              placeholder="Detalhes do evento..."
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Imagem (opcional)</label>

            <div className={styles.fileRow}>
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className={styles.previewImg}
                />
              )}
              <input
                id="eventoImagem"
                className={styles.fileInput}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setImagem(file);

                  if (preview) URL.revokeObjectURL(preview);

                  if (file) {
                    setPreview(URL.createObjectURL(file));
                  } else {
                    setPreview(null);
                  }
                }}
                disabled={!canEdit || saving}
              />

              <label
                htmlFor="eventoImagem"
                className={`${styles.fileBtn} ${imagem ? styles.fileBtnSelected : ""}`}
              >
                {imagem ? "Arquivo selecionado" : "Escolher arquivo"}
              </label>

              <span
                className={`${styles.fileName} ${imagem ? styles.fileNameSelected : ""}`}
              >
                {imagem?.name || "Nenhum arquivo escolhido"}
              </span>
            </div>
          </div>

          <button className={styles.btn} disabled={saving || !canEdit}>
            {saving ? "Salvando..." : "Adicionar evento"}
          </button>
        </form>

        {loading ? (
          <div className={styles.loading}>Carregando eventos…</div>
        ) : (
          <ListaEventos
            eventos={eventos}
            igrejaId={igrejaId}
            onChange={load}
            canEdit={canEdit}
          />
        )}
      </div>
    </div>
  );
}
