//src/components/hinarios/ProjetorMusica/ProjetorMusica.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Minimize, X } from "lucide-react";
import styles from "./styles.module.scss";

type Props = {
  musica: {
    id: string;
    titulo: string;
    letra: string;
    departamentoNome: string;
  };
};

function splitEstrofes(letra: string) {
  return letra
    .split(/\n\s*\n/g)
    .map((bloco) => bloco.trim())
    .filter(Boolean);
}

export default function ProjetorMusica({ musica }: Props) {
  const partes = useMemo(() => splitEstrofes(musica.letra), [musica.letra]);
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const atual = partes[index] ?? "";

  function prev() {
    setIndex((prev) => (prev <= 0 ? 0 : prev - 1));
  }

  function next() {
    setIndex((prev) =>
      prev >= partes.length - 1 ? partes.length - 1 : prev + 1,
    );
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch {}
  }

  function fecharJanela() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
          setFullscreen(false);
        } else {
          fecharJanela();
        }
      }
    }

    function handleFsChange() {
      setFullscreen(!!document.fullscreenElement);
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFsChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFsChange);
    };
  }, [partes.length]);

  return (
    <main className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <div className={styles.departamento}>{musica.departamentoNome}</div>
          <h1 className={styles.titulo}>{musica.titulo}</h1>
        </div>

        <div className={styles.topRight}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={toggleFullscreen}
          >
            {fullscreen ? <Minimize size={18} /> : <Expand size={18} />}
          </button>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={fecharJanela}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <button
          type="button"
          className={`${styles.navBtn} ${styles.navLeft}`}
          onClick={prev}
          disabled={index === 0}
        >
          <ChevronLeft size={34} />
        </button>

        <div className={styles.letraWrap}>
          <div className={styles.contador}>
            {index + 1} / {partes.length}
          </div>

          <div className={styles.letra}>
            {atual.split("\n").map((linha, i) => (
              <div key={i} className={styles.linha}>
                {linha || "\u00A0"}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`${styles.navBtn} ${styles.navRight}`}
          onClick={next}
          disabled={index >= partes.length - 1}
        >
          <ChevronRight size={34} />
        </button>
      </div>

      <div className={styles.bottomBar}>
        <button
          type="button"
          className={styles.bottomBtn}
          onClick={prev}
          disabled={index === 0}
        >
          <ChevronLeft size={18} />
          Anterior
        </button>

        <button
          type="button"
          className={styles.bottomBtn}
          onClick={next}
          disabled={index >= partes.length - 1}
        >
          Próximo
          <ChevronRight size={18} />
        </button>
      </div>
    </main>
  );
}
