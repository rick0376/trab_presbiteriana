//src/components/igreja-publico/DepartamentosDestaque/DepartamentosDestaque.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import styles from "./styles.module.scss";

type Responsavel = {
  id: string;
  cargoTitulo: string;
  fotoUrl?: string | null;
  membro?: {
    nome: string;
  } | null;
};

type MusicaResumo = {
  id: string;
  titulo: string;
  ordem: number;
};

type MusicaPublica = {
  id: string;
  titulo: string;
  letra: string;
  playbackUrl?: string | null;
  ordem: number;
};

type Departamento = {
  id: string;
  nome: string;
  slug: string;
  descricao?: string | null;
  capaUrl?: string | null;
  diasFuncionamento?: string | null;
  horarioFuncionamento?: string | null;
  responsaveis: Responsavel[];
  musicas: MusicaResumo[];
};

type Props = {
  igrejaSlug: string;
};

function cloud(url?: string | null) {
  if (!url) return null;
  return url.replace("/upload/", "/upload/w_1000,q_auto,f_auto/");
}

export default function DepartamentosDestaque({ igrejaSlug }: Props) {
  const [items, setItems] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);

  const [musicasCache, setMusicasCache] = useState<
    Record<string, MusicaPublica[]>
  >({});

  const [openHinarioSlug, setOpenHinarioSlug] = useState<string | null>(null);

  const [selectedDepartamento, setSelectedDepartamento] = useState<{
    slug: string;
    nome: string;
  } | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const carouselRef = useRef<HTMLDivElement | null>(null);

  function scrollCarousel(direction: "left" | "right") {
    const el = carouselRef.current;
    if (!el) return;

    const amount = Math.min(360, el.clientWidth * 0.8);

    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  async function load() {
    if (!igrejaSlug) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const r = await fetch(
        `/api/igreja-publico/${igrejaSlug}/departamentos-com-musicas`,
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
  }, [igrejaSlug]);

  const modalItems = useMemo(() => {
    if (!selectedDepartamento) return [];
    return musicasCache[selectedDepartamento.slug] ?? [];
  }, [selectedDepartamento, musicasCache]);

  const selected =
    selectedIndex !== null && modalItems[selectedIndex]
      ? modalItems[selectedIndex]
      : null;

  async function openMusic(departamento: Departamento, musicaId: string) {
    setSelectedDepartamento({
      slug: departamento.slug,
      nome: departamento.nome,
    });
    setModalError("");

    const cached = musicasCache[departamento.slug];

    if (cached?.length) {
      const idx = cached.findIndex((item) => item.id === musicaId);
      setSelectedIndex(idx >= 0 ? idx : 0);
      return;
    }

    setSelectedIndex(0);
    setModalLoading(true);

    try {
      const r = await fetch(
        `/api/igreja-publico/${igrejaSlug}/departamentos/${departamento.slug}/musicas`,
        {
          cache: "no-store",
        },
      );

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        setModalError(j?.error || "Não foi possível carregar as músicas.");
        return;
      }

      const musicas = Array.isArray(j?.items) ? j.items : [];

      setMusicasCache((prev) => ({
        ...prev,
        [departamento.slug]: musicas,
      }));

      const idx = musicas.findIndex(
        (item: MusicaPublica) => item.id === musicaId,
      );
      setSelectedIndex(idx >= 0 ? idx : 0);
    } catch {
      setModalError("Não foi possível carregar as músicas.");
    } finally {
      setModalLoading(false);
    }
  }

  function toggleHinario(departamentoSlug: string) {
    setOpenHinarioSlug((prev) =>
      prev === departamentoSlug ? null : departamentoSlug,
    );
  }

  function closeMusic() {
    setSelectedDepartamento(null);
    setSelectedIndex(null);
    setModalLoading(false);
    setModalError("");
  }

  function prevMusic() {
    if (!modalItems.length || selectedIndex === null) return;

    setSelectedIndex((prev) => {
      if (prev === null) return 0;
      return prev === 0 ? modalItems.length - 1 : prev - 1;
    });
  }

  function nextMusic() {
    if (!modalItems.length || selectedIndex === null) return;

    setSelectedIndex((prev) => {
      if (prev === null) return 0;
      return prev === modalItems.length - 1 ? 0 : prev + 1;
    });
  }

  useEffect(() => {
    if (!selectedDepartamento) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMusic();
      if (e.key === "ArrowLeft") prevMusic();
      if (e.key === "ArrowRight") nextMusic();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDepartamento, selectedIndex, modalItems.length]);

  if (loading) {
    return (
      <section id="departamentos" className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>Departamentos</h2>
          <p className={styles.subtitle}>Carregando departamentos...</p>
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  function showToastMessage(message: string) {
    const el = document.createElement("div");

    el.textContent = message;
    el.style.position = "fixed";
    el.style.right = "20px";
    el.style.bottom = "20px";
    el.style.zIndex = "99999";
    el.style.padding = "14px 18px";
    el.style.borderRadius = "14px";
    el.style.background = "#123a66";
    el.style.color = "#fff";
    el.style.fontWeight = "800";
    el.style.boxShadow = "0 18px 40px rgba(0,0,0,0.25)";
    el.style.transition = "opacity .25s ease, transform .25s ease";

    document.body.appendChild(el);

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
    }, 1800);

    setTimeout(() => {
      el.remove();
    }, 2200);
  }

  async function copiarPlayback(url?: string | null) {
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      showToastMessage("Link do playback copiado!");
    } catch {
      showToastMessage("Não foi possível copiar o link.");
    }
  }

  async function compartilharPlayback(url?: string | null, titulo?: string) {
    if (!url) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: titulo || "Playback",
          url,
        });
        return;
      } catch {
        return;
      }
    }

    await copiarPlayback(url);
  }

  return (
    <>
      <section id="departamentos" className={styles.section}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>Departamentos</h2>
            <p className={styles.subtitle}>
              Conheça os ministérios e áreas de atuação da igreja.
            </p>
          </div>

          <Link href="/departamentos" className={styles.allButton}>
            Ver todos os departamentos
          </Link>
        </div>

        <div className={styles.carouselWrap}>
          <button
            type="button"
            className={`${styles.carouselBtn} ${styles.carouselBtnLeft}`}
            onClick={() => scrollCarousel("left")}
            aria-label="Voltar departamentos"
          >
            ‹
          </button>

          <div className={styles.grid} ref={carouselRef}>
            {items.slice(0, 6).map((item) => {
              const primeiroResponsavel = item.responsaveis?.[0];

              return (
                <article key={item.id} className={styles.card}>
                  <div
                    className={styles.imageWrap}
                    style={
                      item.capaUrl
                        ? {
                            ["--dept-bg" as any]: `url(${cloud(item.capaUrl)})`,
                          }
                        : undefined
                    }
                  >
                    {item.capaUrl ? (
                      <img
                        src={cloud(item.capaUrl) ?? ""}
                        alt={item.nome}
                        className={styles.image}
                      />
                    ) : (
                      <div className={styles.imageFallback}>Sem imagem</div>
                    )}

                    <div className={styles.overlay} />
                  </div>

                  <div className={styles.body}>
                    <h3 className={styles.cardTitle}>{item.nome}</h3>

                    <div className={styles.leader}>
                      {primeiroResponsavel?.membro?.nome ||
                        "Responsável não informado"}
                    </div>

                    {primeiroResponsavel?.cargoTitulo ? (
                      <div className={styles.role}>
                        {primeiroResponsavel.cargoTitulo}
                      </div>
                    ) : null}

                    <div className={styles.meta}>
                      {item.diasFuncionamento || "Dias não informados"}
                    </div>

                    {item.musicas?.length ? (
                      <div className={styles.hinarioWrap}>
                        <button
                          type="button"
                          className={styles.hinarioTrigger}
                          onClick={() => toggleHinario(item.slug)}
                        >
                          {openHinarioSlug === item.slug
                            ? `Ocultar músicas (${item.musicas.length})`
                            : `Hinos / Louvores (${item.musicas.length})`}
                        </button>

                        {openHinarioSlug === item.slug ? (
                          <div className={styles.hinarioBox}>
                            <div className={styles.hinarioTitle}>
                              Selecione uma música
                            </div>

                            <div className={styles.musicasList}>
                              {item.musicas.map((musica) => (
                                <button
                                  key={musica.id}
                                  type="button"
                                  className={styles.musicaBtn}
                                  onClick={() => openMusic(item, musica.id)}
                                  title={musica.titulo}
                                >
                                  {musica.titulo}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <Link
                      href={`/departamentos/${item.slug}`}
                      className={styles.button}
                    >
                      Saiba mais
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            className={`${styles.carouselBtn} ${styles.carouselBtnRight}`}
            onClick={() => scrollCarousel("right")}
            aria-label="Avançar departamentos"
          >
            ›
          </button>
        </div>
      </section>

      {selectedDepartamento ? (
        <div className={styles.modalOverlay} onClick={closeMusic}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  {selected?.titulo || "Hinário do departamento"}
                </h3>

                <p className={styles.modalMeta}>
                  {selectedDepartamento.nome}
                  {!modalLoading && !modalError && modalItems.length
                    ? ` • ${(selectedIndex ?? 0) + 1} / ${modalItems.length}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                className={styles.modalClose}
                onClick={closeMusic}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {modalLoading ? (
                <div className={styles.modalLoading}>Carregando letra...</div>
              ) : modalError ? (
                <div className={styles.modalEmpty}>{modalError}</div>
              ) : selected ? (
                <>
                  {modalItems.length > 1 ? (
                    <div className={styles.navRow}>
                      <button
                        type="button"
                        className={styles.navBtn}
                        onClick={prevMusic}
                      >
                        <ChevronLeft size={18} />
                        Anterior
                      </button>

                      <button
                        type="button"
                        className={styles.navBtn}
                        onClick={nextMusic}
                      >
                        Próxima
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  ) : null}

                  {selected.playbackUrl ? (
                    <div className={styles.playbackBox}>
                      <a
                        href={selected.playbackUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.playbackBtn}
                      >
                        ▶ Abrir playback
                      </a>

                      <button
                        type="button"
                        className={styles.playbackBtnGhost}
                        onClick={() => copiarPlayback(selected.playbackUrl)}
                      >
                        Copiar link
                      </button>

                      <button
                        type="button"
                        className={styles.playbackBtnGhost}
                        onClick={() =>
                          compartilharPlayback(
                            selected.playbackUrl,
                            selected.titulo,
                          )
                        }
                      >
                        Compartilhar
                      </button>
                    </div>
                  ) : null}

                  <div className={styles.letraBox}>{selected.letra}</div>
                </>
              ) : (
                <div className={styles.modalEmpty}>
                  Nenhuma música ativa encontrada.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
