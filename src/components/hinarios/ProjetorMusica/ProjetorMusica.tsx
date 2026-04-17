//src/components/hinarios/ProjetorMusica/ProjetorMusica.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Minimize,
  Type,
  X,
} from "lucide-react";
import styles from "./styles.module.scss";

type Props = {
  musica: {
    id: string;
    titulo: string;
    letra: string;
    departamentoNome: string;
  };
};

type ParteProjetor = {
  texto: string;
  isRefrao: boolean;
};

function splitBlocos(letra: string) {
  return letra
    .split(/\n\s*\n/g)
    .map((bloco) => bloco.trim())
    .filter(Boolean);
}

function detectarRefrao(bloco: string) {
  const normalizado = bloco.toLowerCase();
  return (
    normalizado.includes("refrão") ||
    normalizado.includes("refrao") ||
    normalizado.includes("coro") ||
    normalizado.includes("chorus")
  );
}

function limparMarcadorRefrao(bloco: string) {
  return bloco
    .replace(/^refrão\s*:?\s*/i, "")
    .replace(/^refrao\s*:?\s*/i, "")
    .replace(/^coro\s*:?\s*/i, "")
    .replace(/^chorus\s*:?\s*/i, "")
    .trim();
}

function quebrarBlocoEmPartes(
  bloco: string,
  linhasPorParte = 4,
): ParteProjetor[] {
  const isRefrao = detectarRefrao(bloco);

  const blocoLimpo = limparMarcadorRefrao(bloco);

  const linhas = blocoLimpo
    .split("\n")
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0);

  if (!linhas.length) return [];

  const partes: ParteProjetor[] = [];

  for (let i = 0; i < linhas.length; i += linhasPorParte) {
    partes.push({
      texto: linhas.slice(i, i + linhasPorParte).join("\n"),
      isRefrao,
    });
  }

  return partes;
}

function gerarPaginasProjetor(letra: string, linhasPorParte = 4) {
  const blocos = splitBlocos(letra);
  return blocos.flatMap((bloco) => quebrarBlocoEmPartes(bloco, linhasPorParte));
}

export default function ProjetorMusica({ musica }: Props) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [linhasPorParte, setLinhasPorParte] = useState(4);

  const partes = useMemo(
    () => gerarPaginasProjetor(musica.letra, linhasPorParte),
    [musica.letra, linhasPorParte],
  );

  const atual = partes[index] ?? { texto: "", isRefrao: false };

  function prev() {
    setIndex((prevIndex) => (prevIndex <= 0 ? 0 : prevIndex - 1));
  }

  function next() {
    setIndex((prevIndex) =>
      prevIndex >= partes.length - 1 ? partes.length - 1 : prevIndex + 1,
    );
  }

  function increaseFont() {
    setFontScale((prevValue) => Math.min(prevValue + 0.1, 2));
  }

  function decreaseFont() {
    setFontScale((prevValue) => Math.max(prevValue - 0.1, 0.7));
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
    setIndex(0);
  }, [linhasPorParte, musica.id]);

  useEffect(() => {
    if (index > partes.length - 1) {
      setIndex(Math.max(0, partes.length - 1));
    }
  }, [index, partes.length]);

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

      if (e.key === "+") increaseFont();
      if (e.key === "-") decreaseFont();

      if (e.key === "1") setLinhasPorParte(2);
      if (e.key === "2") setLinhasPorParte(3);
      if (e.key === "3") setLinhasPorParte(4);
      if (e.key === "4") setLinhasPorParte(5);
      if (e.key === "5") setLinhasPorParte(6);
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
            onClick={decreaseFont}
            title="Diminuir fonte"
          >
            <Type size={16} />
            <span className={styles.iconBtnText}>-</span>
          </button>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={increaseFont}
            title="Aumentar fonte"
          >
            <Type size={16} />
            <span className={styles.iconBtnText}>+</span>
          </button>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={toggleFullscreen}
            title="Tela cheia"
          >
            {fullscreen ? <Minimize size={18} /> : <Expand size={18} />}
          </button>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={fecharJanela}
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className={styles.controlBar}>
        <div className={styles.controlInfo}>
          <span>
            Parte {index + 1} / {partes.length}
          </span>
          <span>Fonte: {Math.round(fontScale * 100)}%</span>
          <span>{linhasPorParte} linhas</span>
        </div>

        <div className={styles.modeBox}>
          <span className={styles.modeLabel}>Quebra:</span>

          {[2, 3, 4, 5, 6].map((qtd) => (
            <button
              key={qtd}
              type="button"
              className={`${styles.modeBtn} ${linhasPorParte === qtd ? styles.modeBtnActive : ""}`}
              onClick={() => setLinhasPorParte(qtd)}
            >
              {qtd} linhas
            </button>
          ))}
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

          {atual.isRefrao ? (
            <div className={styles.refraoTag}>Refrão</div>
          ) : null}

          <div
            className={`${styles.letra} ${atual.isRefrao ? styles.letraRefrao : ""}`}
            style={{
              fontSize: `calc(clamp(28px, 3vw, 50px) * ${fontScale})`,
            }}
          >
            {atual.texto.split("\n").map((linha, linhaIndex) => (
              <div key={linhaIndex} className={styles.linha}>
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
