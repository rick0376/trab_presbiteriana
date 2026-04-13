//src/components/igreja-publico/AlbunsDepartamentoPublico/AlbunsDepartamentoPublico.tsx

"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import styles from "./styles.module.scss";

type AlbumImage = {
  id: string;
  imageUrl: string;
  ordem: number;
};

type Album = {
  id: string;
  titulo: string;
  descricao?: string | null;
  dataEvento?: string | null;
  capaUrl?: string | null;
  imagens: AlbumImage[];
};

type Props = {
  items: Album[];
};

function cloud(url?: string | null) {
  if (!url) return null;
  return url.replace("/upload/", "/upload/w_1400,q_auto,f_auto/");
}

function formatDateBR(value?: string | null) {
  if (!value) return "Sem data";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Sem data";
  return d.toLocaleDateString("pt-BR");
}

export default function AlbunsDepartamentoPublico({ items }: Props) {
  const [selected, setSelected] = useState<Album | null>(null);

  const ordered = useMemo(() => {
    return [...items].sort((a, b) => {
      const ad = a.dataEvento ? new Date(a.dataEvento).getTime() : 0;
      const bd = b.dataEvento ? new Date(b.dataEvento).getTime() : 0;
      return bd - ad;
    });
  }, [items]);

  if (!ordered.length) return null;

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Galeria do departamento</h2>

        <div className={styles.grid}>
          {ordered.map((album) => {
            const cover = album.capaUrl || album.imagens?.[0]?.imageUrl || null;

            return (
              <article key={album.id} className={styles.card}>
                <div className={styles.coverWrap}>
                  {cover ? (
                    <img
                      src={cloud(cover) ?? ""}
                      alt={album.titulo}
                      className={styles.cover}
                    />
                  ) : (
                    <div className={styles.coverEmpty}>Sem capa</div>
                  )}
                </div>

                <div className={styles.body}>
                  <h3 className={styles.title}>{album.titulo}</h3>
                  <div className={styles.meta}>
                    <span>{formatDateBR(album.dataEvento)}</span>
                    <span>{album.imagens?.length ?? 0} foto(s)</span>
                  </div>

                  {album.descricao ? (
                    <p className={styles.desc}>{album.descricao}</p>
                  ) : null}

                  <button
                    type="button"
                    className={styles.button}
                    onClick={() => setSelected(album)}
                  >
                    Ver fotos
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selected ? (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>{selected.titulo}</h3>
                <p className={styles.modalMeta}>
                  {formatDateBR(selected.dataEvento)} •{" "}
                  {selected.imagens?.length ?? 0} foto(s)
                </p>
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

            <div className={styles.modalGrid}>
              {selected.imagens?.length ? (
                selected.imagens.map((img) => (
                  <div key={img.id} className={styles.modalImageWrap}>
                    <img
                      src={cloud(img.imageUrl) ?? ""}
                      alt={selected.titulo}
                      className={styles.modalImage}
                    />
                  </div>
                ))
              ) : (
                <div className={styles.empty}>Nenhuma foto neste álbum.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
