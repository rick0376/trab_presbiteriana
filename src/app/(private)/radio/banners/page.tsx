//src/app/(private)/radio/banners/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";

type Banner = {
  id: string;
  titulo: string;
  posicao: string;
  imageUrl: string;
  publicId: string;
  linkUrl?: string | null;
  ativo: boolean;
  ordem: number;
};

const POSICOES = [
  { value: "TOPO", label: "Topo da rádio" },
  { value: "LATERAL", label: "Lateral da rádio" },
  { value: "INFERIOR", label: "Inferior da rádio" },
];

export default function RadioBannersPage() {
  const router = useRouter();

  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [posicao, setPosicao] = useState("TOPO");
  const [linkUrl, setLinkUrl] = useState("");
  const [ordem, setOrdem] = useState("0");
  const [ativo, setAtivo] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  async function load() {
    setLoading(true);

    try {
      const r = await fetch("/api/radio/banners", { cache: "no-store" });
      const j = await r.json();
      setItems(Array.isArray(j?.banners) ? j.banners : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setEditId(null);
    setTitulo("");
    setPosicao("TOPO");
    setLinkUrl("");
    setOrdem("0");
    setAtivo(true);
    setFile(null);
    setPreview("");
  }

  function handleFile(selected: File | null) {
    setFile(selected);

    if (!selected) {
      setPreview("");
      return;
    }

    setPreview(URL.createObjectURL(selected));
  }

  function startEdit(item: Banner) {
    setEditId(item.id);
    setTitulo(item.titulo);
    setPosicao(item.posicao);
    setLinkUrl(item.linkUrl ?? "");
    setOrdem(String(item.ordem ?? 0));
    setAtivo(item.ativo);
    setFile(null);
    setPreview(item.imageUrl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (saving) return;

    if (!titulo.trim()) {
      alert("Informe o título.");
      return;
    }

    if (!editId && !file) {
      alert("Selecione uma imagem.");
      return;
    }

    setSaving(true);

    try {
      const fd = new FormData();

      fd.append("titulo", titulo);
      fd.append("posicao", posicao);
      fd.append("linkUrl", linkUrl);
      fd.append("ordem", ordem);
      fd.append("ativo", String(ativo));

      if (file) {
        fd.append("imagem", file);
      }

      const url = editId
        ? `/api/radio/banners/${editId}`
        : "/api/radio/banners";
      const method = editId ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        body: fd,
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        alert(j?.error || "Erro ao salvar banner.");
        return;
      }

      resetForm();
      await load();
    } catch {
      alert("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: Banner) {
    const ok = confirm(`Excluir o banner "${item.titulo}"?`);

    if (!ok) return;

    try {
      const r = await fetch(`/api/radio/banners/${item.id}`, {
        method: "DELETE",
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        alert(j?.error || "Erro ao excluir banner.");
        return;
      }

      await load();

      if (editId === item.id) {
        resetForm();
      }
    } catch {
      alert("Erro de conexão.");
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <button
          type="button"
          className={styles.back}
          onClick={() => router.back()}
        >
          ← Voltar
        </button>

        <h1 className={styles.title}>Banners da Rádio</h1>
        <p className={styles.subtitle}>
          Cadastre propagandas para aparecerem na página completa da rádio.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <div>
              <label className={styles.label}>Título</label>
              <input
                className={styles.input}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Oferta especial"
              />
            </div>

            <div>
              <label className={styles.label}>Posição</label>
              <select
                className={styles.input}
                value={posicao}
                onChange={(e) => setPosicao(e.target.value)}
              >
                {POSICOES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={styles.label}>Link ao clicar</label>
              <input
                className={styles.input}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className={styles.label}>Ordem</label>
              <input
                className={styles.input}
                type="number"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
              />
            </div>
          </div>

          <label className={styles.check}>
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
            />
            <span>Banner ativo</span>
          </label>

          <div>
            <label className={styles.label}>Imagem / Banner</label>
            <input
              id="radioBannerFile"
              className={styles.fileInput}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            <label htmlFor="radioBannerFile" className={styles.fileButton}>
              📷 Escolher arquivo
            </label>

            <span className={styles.fileName}>
              {file ? file.name : "Nenhum arquivo escolhido"}
            </span>

            <p className={styles.fileHelp}>
              Formatos: JPG, PNG ou WEBP. Tamanho recomendado conforme a posição
              do banner.
            </p>
          </div>

          {preview ? (
            <div className={styles.previewBox}>
              <img src={preview} alt="Preview" className={styles.preview} />
            </div>
          ) : null}

          <div className={styles.actions}>
            <button className={styles.save} type="submit" disabled={saving}>
              {saving
                ? "Salvando..."
                : editId
                  ? "Salvar edição"
                  : "Cadastrar banner"}
            </button>

            {editId ? (
              <button
                className={styles.cancel}
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancelar edição
              </button>
            ) : null}
          </div>
        </form>

        <section className={styles.list}>
          <h2 className={styles.sectionTitle}>Banners cadastrados</h2>

          {loading ? (
            <div className={styles.empty}>Carregando banners...</div>
          ) : !items.length ? (
            <div className={styles.empty}>Nenhum banner cadastrado.</div>
          ) : (
            <div className={styles.bannerGrid}>
              {items.map((item) => (
                <article key={item.id} className={styles.bannerCard}>
                  <img
                    src={item.imageUrl}
                    alt={item.titulo}
                    className={styles.bannerImg}
                  />

                  <div className={styles.bannerBody}>
                    <strong>{item.titulo}</strong>
                    <span>
                      {item.posicao} · ordem {item.ordem}
                    </span>
                    <span>{item.ativo ? "Ativo" : "Inativo"}</span>

                    <div className={styles.bannerActions}>
                      <button type="button" onClick={() => startEdit(item)}>
                        Editar
                      </button>

                      <button type="button" onClick={() => handleDelete(item)}>
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
