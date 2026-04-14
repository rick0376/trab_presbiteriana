// src/components/igreja-publico/eventos/EventosPublicos/EventosPublicos.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import { Images, X } from "lucide-react";

type Evento = {
  id: string;
  titulo: string;
  data: string; // ISO
  imagemUrl?: string | null;
  tipo?: string | null;
  responsavel?: string | null;
  local?: string | null;
  descricao?: string | null;
};

export default function EventosPublicos({ slug }: { slug: string }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Evento | null>(null);

  async function load() {
    if (!slug) {
      setEventos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const r = await fetch(
        `/api/eventos/proximos?slug=${encodeURIComponent(slug)}`,
        { cache: "no-store" },
      );

      const j = (await r.json()) as { eventos?: Evento[] };
      setEventos(Array.isArray(j.eventos) ? j.eventos : []);
    } catch {
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [slug]);

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

  function cloudCard(url?: string | null) {
    if (!url) return null;
    return url.replace("/upload/", "/upload/w_900,q_auto,f_auto/");
  }

  function cloudModal(url?: string | null) {
    if (!url) return null;
    return url.replace("/upload/", "/upload/w_1400,q_auto,f_auto/");
  }

  return (
    <section id="eventos" className={styles.wrap}>
      <header className={styles.head}>
        <div className={styles.headTop}>
          <h2 className={styles.title}>📅 Próximos Eventos</h2>

          <Link href="/eventos/galeria" className={styles.galleryButton}>
            <Images size={16} />
            <span>Galeria de eventos</span>
          </Link>
        </div>

        <p className={styles.sub}>
          Acompanhe os próximos encontros e programações.
        </p>
      </header>

      {loading ? (
        <div className={styles.skeletonGrid}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ) : eventos.length ? (
        <div className={styles.grid}>
          {eventos.map((e) => (
            <article
              key={e.id}
              className={styles.card}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(e)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") setSelected(e);
              }}
            >
              <div className={styles.thumb}>
                {e.imagemUrl ? (
                  <img
                    className={styles.thumbImg}
                    src={cloudCard(e.imagemUrl) ?? ""}
                    alt=""
                  />
                ) : (
                  <img
                    className={styles.thumbImg}
                    src={
                      e.imagemUrl
                        ? cloudCard(e.imagemUrl)!
                        : "/images/pastor.png"
                    }
                    alt=""
                  />
                )}

                <div className={styles.badges}>
                  {e.tipo ? (
                    <span className={styles.badge}>{e.tipo}</span>
                  ) : null}
                  <span className={styles.badge}>{formatBR(e.data)}</span>
                </div>
              </div>

              <div className={styles.body}>
                <h3 className={styles.cardTitle}>{e.titulo}</h3>
                <div className={styles.meta}>
                  {e.local ? e.local : e.responsavel ? e.responsavel : "—"}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>Nenhum evento programado no momento.</div>
      )}

      {/* Modal público (sem editar) */}
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
    </section>
  );
}
