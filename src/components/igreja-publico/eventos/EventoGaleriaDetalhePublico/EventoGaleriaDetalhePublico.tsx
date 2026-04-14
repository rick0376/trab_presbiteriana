//src/components/igreja-publico/eventos/EventoGaleriaDetalhePublico/EventoGaleriaDetalhePublico.tsx

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import styles from "./styles.module.scss";

type Props = {
  item: any;
};

function cloud(url?: string | null) {
  if (!url) return null;
  return url.replace("/upload/", "/upload/w_1600,q_auto,f_auto/");
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

export default function EventoGaleriaDetalhePublico({ item }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const imagens = useMemo(() => item.imagens ?? [], [item.imagens]);

  const capa = item.imagemUrl || imagens?.[0]?.imageUrl || null;

  const selected =
    selectedIndex !== null && imagens[selectedIndex]
      ? imagens[selectedIndex]
      : null;

  function closeModal() {
    setSelectedIndex(null);
  }

  function prevImage() {
    if (!imagens.length || selectedIndex === null) return;
    setSelectedIndex((prev) => {
      if (prev === null) return 0;
      return prev === 0 ? imagens.length - 1 : prev - 1;
    });
  }

  function nextImage() {
    if (!imagens.length || selectedIndex === null) return;
    setSelectedIndex((prev) => {
      if (prev === null) return 0;
      return prev === imagens.length - 1 ? 0 : prev + 1;
    });
  }

  useEffect(() => {
    if (selectedIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, imagens.length]);

  return (
    <section className={styles.page}>
      <Link href="/eventos/galeria" className={styles.backLink}>
        ← Voltar para galeria
      </Link>

      <div className={styles.hero}>
        <div className={styles.heroText}>
          <div className={styles.kicker}>{item.igreja?.nome}</div>
          <h1 className={styles.title}>{item.titulo}</h1>

          <div className={styles.meta}>
            <span>{formatBR(item.data)}</span>
            {item.local ? <span>{item.local}</span> : null}
            {item.tipo ? <span>{item.tipo}</span> : null}
          </div>

          {item.descricao ? (
            <p className={styles.desc}>{item.descricao}</p>
          ) : null}
        </div>

        <div className={styles.heroMedia}>
          {capa ? (
            <img
              src={cloud(capa) ?? ""}
              alt={item.titulo}
              className={styles.heroImage}
            />
          ) : (
            <div className={styles.heroEmpty}>Sem imagem</div>
          )}
        </div>
      </div>

      <div className={styles.galleryCard}>
        <h2 className={styles.sectionTitle}>Fotos do evento</h2>

        {imagens.length ? (
          <div className={styles.grid}>
            {imagens.map((img: any, index: number) => (
              <button
                key={img.id}
                type="button"
                className={styles.photoBtn}
                onClick={() => setSelectedIndex(index)}
              >
                <img
                  src={cloud(img.imageUrl) ?? ""}
                  alt={item.titulo}
                  className={styles.photo}
                />
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>Nenhuma foto cadastrada.</div>
        )}
      </div>

      {selected ? (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={closeModal}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            {imagens.length > 1 ? (
              <>
                <button
                  type="button"
                  className={`${styles.navBtn} ${styles.navBtnLeft}`}
                  onClick={prevImage}
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft size={28} />
                </button>

                <button
                  type="button"
                  className={`${styles.navBtn} ${styles.navBtnRight}`}
                  onClick={nextImage}
                  aria-label="Próxima imagem"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            ) : null}

            <img
              src={cloud(selected.imageUrl) ?? ""}
              alt={item.titulo}
              className={styles.modalImage}
            />

            {imagens.length > 1 ? (
              <div className={styles.modalCounter}>
                {selectedIndex! + 1} / {imagens.length}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
