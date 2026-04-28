//src/app/(private)/radio/banners/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
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

type Permissao = {
  recurso: string;
  ler: boolean;
  criar: boolean;
  editar: boolean;
  deletar: boolean;
  compartilhar: boolean;
};

type MeResponse = {
  id: string;
  role: string;
};

type PosicaoOption = {
  value: "LATERAL" | "TOPO" | "INFERIOR";
  label: string;
  description: string;
  recommended: string;
};

const PERM_DEFAULT: Permissao = {
  recurso: "radio_banners",
  ler: false,
  criar: false,
  editar: false,
  deletar: false,
  compartilhar: false,
};

const POSICOES: PosicaoOption[] = [
  {
    value: "LATERAL",
    label: "Banner superior da página",
    description:
      "Aparece acima da rádio, no formato largo igual ao antigo banner de baixo.",
    recommended: "Recomendado: 728x90 ou banner largo horizontal",
  },
  {
    value: "TOPO",
    label: "Banner principal dentro da rádio",
    description: "Aparece dentro do card da rádio, acima do player.",
    recommended: "Recomendado: banner horizontal grande",
  },
  {
    value: "INFERIOR",
    label: "Banner inferior da rádio",
    description: "Aparece abaixo da lista de músicas.",
    recommended: "Recomendado: banner horizontal largo",
  },
];

function getPosicaoInfo(posicao: string) {
  return (
    POSICOES.find((item) => item.value === posicao) ?? {
      value: "TOPO",
      label: posicao,
      description: "Posição personalizada.",
      recommended: "Use uma imagem proporcional ao espaço.",
    }
  );
}

export default function RadioBannersPage() {
  const router = useRouter();

  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [perm, setPerm] = useState<Permissao | null>(null);
  const [loadingPerm, setLoadingPerm] = useState(true);

  const [editId, setEditId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [posicao, setPosicao] = useState<PosicaoOption["value"]>("LATERAL");
  const [linkUrl, setLinkUrl] = useState("");
  const [ordem, setOrdem] = useState("0");
  const [ativo, setAtivo] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const canView = !!perm?.ler;
  const canCreate = !!perm?.criar;
  const canEdit = !!perm?.editar;
  const canDelete = !!perm?.deletar;

  const isEditing = !!editId;
  const canSaveCurrent = isEditing ? canEdit : canCreate;

  const posicaoAtual = useMemo(() => getPosicaoInfo(posicao), [posicao]);

  async function loadPermissao() {
    try {
      const meRes = await fetch("/api/me", { cache: "no-store" });

      if (!meRes.ok) {
        setPerm(PERM_DEFAULT);
        return;
      }

      const me: MeResponse = await meRes.json();

      if (me.role === "SUPERADMIN") {
        setPerm({
          recurso: "radio_banners",
          ler: true,
          criar: true,
          editar: true,
          deletar: true,
          compartilhar: true,
        });
        return;
      }

      const permRes = await fetch(`/api/permissoes?userId=${me.id}`, {
        cache: "no-store",
      });

      if (!permRes.ok) {
        setPerm(PERM_DEFAULT);
        return;
      }

      const list: Permissao[] = await permRes.json();

      setPerm(list.find((p) => p.recurso === "radio_banners") ?? PERM_DEFAULT);
    } catch {
      setPerm(PERM_DEFAULT);
    } finally {
      setLoadingPerm(false);
    }
  }

  async function load() {
    setLoading(true);

    try {
      const r = await fetch("/api/radio/banners?admin=1", {
        cache: "no-store",
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        setItems([]);
        return;
      }

      setItems(Array.isArray(j?.banners) ? j.banners : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPermissao();
  }, []);

  useEffect(() => {
    if (perm?.ler) {
      load();
    }
  }, [perm]);

  function resetForm() {
    setEditId(null);
    setTitulo("");
    setPosicao("LATERAL");
    setLinkUrl("");
    setOrdem("0");
    setAtivo(true);
    setFile(null);
    setPreview("");
  }

  function handleFile(selected: File | null) {
    if (!canSaveCurrent) return;

    setFile(selected);

    if (!selected) {
      setPreview("");
      return;
    }

    setPreview(URL.createObjectURL(selected));
  }

  function startEdit(item: Banner) {
    if (!canEdit) return;

    setEditId(item.id);
    setTitulo(item.titulo);
    setPosicao(item.posicao as PosicaoOption["value"]);
    setLinkUrl(item.linkUrl ?? "");
    setOrdem(String(item.ordem ?? 0));
    setAtivo(item.ativo);
    setFile(null);
    setPreview(item.imageUrl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (saving) return;

    if (!canSaveCurrent) {
      alert("Você não tem permissão para salvar banners.");
      return;
    }

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
    if (!canDelete) {
      alert("Você não tem permissão para excluir banners.");
      return;
    }

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

  if (loadingPerm) {
    return (
      <main className={styles.container}>
        <div className={styles.card}>Carregando permissões...</div>
      </main>
    );
  }

  if (!canView) {
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

          <h1 className={styles.title}>Acesso negado</h1>
          <p className={styles.subtitle}>
            Você não tem permissão para visualizar os banners da rádio.
          </p>
        </div>
      </main>
    );
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
          Cadastre banners para aparecerem na página completa da rádio.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <div>
              <label className={styles.label}>Título</label>
              <input
                className={styles.input}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Culto de Curas e Libertação"
                disabled={!canSaveCurrent || saving}
              />
            </div>

            <div>
              <label className={styles.label}>Onde o banner vai aparecer</label>
              <select
                className={styles.input}
                value={posicao}
                onChange={(e) =>
                  setPosicao(e.target.value as PosicaoOption["value"])
                }
                disabled={!canSaveCurrent || saving}
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
                disabled={!canSaveCurrent || saving}
              />
            </div>

            <div>
              <label className={styles.label}>Ordem</label>
              <input
                className={styles.input}
                type="number"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                disabled={!canSaveCurrent || saving}
              />
            </div>
          </div>

          <div className={styles.empty}>
            <strong>{posicaoAtual.label}</strong>
            <br />
            {posicaoAtual.description}
            <br />
            <small>{posicaoAtual.recommended}</small>
          </div>

          <label className={styles.check}>
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              disabled={!canSaveCurrent || saving}
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
              disabled={!canSaveCurrent || saving}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            <label htmlFor="radioBannerFile" className={styles.fileButton}>
              📷 Escolher arquivo
            </label>

            <span className={styles.fileName}>
              {file ? file.name : "Nenhum arquivo escolhido"}
            </span>

            <p className={styles.fileHelp}>
              Para o banner superior que criamos, escolha{" "}
              <strong>Banner superior da página</strong>.
            </p>
          </div>

          {preview ? (
            <div className={styles.previewBox}>
              <img src={preview} alt="Preview" className={styles.preview} />
            </div>
          ) : null}

          <div className={styles.actions}>
            <button
              className={styles.save}
              type="submit"
              disabled={!canSaveCurrent || saving}
            >
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
              {items.map((item) => {
                const info = getPosicaoInfo(item.posicao);

                return (
                  <article key={item.id} className={styles.bannerCard}>
                    <img
                      src={item.imageUrl}
                      alt={item.titulo}
                      className={styles.bannerImg}
                    />

                    <div className={styles.bannerBody}>
                      <strong>{item.titulo}</strong>

                      <span>
                        {info.label} · ordem {item.ordem}
                      </span>

                      <span>{item.ativo ? "Ativo" : "Inativo"}</span>

                      {(canEdit || canDelete) && (
                        <div className={styles.bannerActions}>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                            >
                              Editar
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
