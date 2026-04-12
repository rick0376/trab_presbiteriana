//src/components/igreja-publico/historia/HistoriaIgrejaPublica/HistoriaIgrejaPublica.tsx

"use client";

import styles from "./styles.module.scss";

type Props = {
  churchName: string;
  historia: any;
};

function cloud(url?: string | null) {
  if (!url) return null;
  return url.replace("/upload/", "/upload/w_1200,q_auto,f_auto/");
}

function getResumo(texto?: string | null) {
  const clean = String(texto ?? "").trim();
  if (!clean) return "";

  const firstParagraph = clean
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)[0];

  if (!firstParagraph) return "";

  if (firstParagraph.length <= 320) return firstParagraph;
  return `${firstParagraph.slice(0, 317)}...`;
}

export default function HistoriaIgrejaPublica({ churchName, historia }: Props) {
  if (!historia) {
    return (
      <section className={styles.page}>
        <div className={styles.emptyCard}>
          A história da igreja ainda não foi cadastrada.
        </div>
      </section>
    );
  }

  const resumo = getResumo(historia.texto);
  const previewMarcos = Array.isArray(historia.marcos)
    ? historia.marcos.slice(0, 2)
    : [];

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <div className={styles.kicker}>{churchName}</div>

          <h1 className={styles.title}>{historia.titulo}</h1>

          {historia.subtitulo ? (
            <p className={styles.subtitle}>{historia.subtitulo}</p>
          ) : null}

          {resumo ? <p className={styles.resume}>{resumo}</p> : null}

          <div className={styles.actions}>
            <a href="#conteudo-historia" className={styles.primaryButton}>
              Ler nossa história
            </a>

            {historia.marcos?.length ? (
              <a href="#marcos-historia" className={styles.secondaryButton}>
                Ver marcos importantes
              </a>
            ) : null}
          </div>

          {previewMarcos.length ? (
            <div className={styles.previewGrid}>
              {previewMarcos.map((marco: any) => (
                <div key={marco.id} className={styles.previewCard}>
                  <div className={styles.previewYear}>{marco.ano}</div>
                  <div className={styles.previewContent}>
                    <strong>{marco.titulo}</strong>
                    {marco.descricao ? <span>{marco.descricao}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {historia.imagemCapaUrl ? (
          <div className={styles.heroImageWrap}>
            <div className={styles.imageFrame}>
              <img
                src={cloud(historia.imagemCapaUrl) ?? ""}
                alt={historia.titulo}
                className={styles.heroImage}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div id="conteudo-historia" className={styles.contentCard}>
        <h2 className={styles.sectionTitle}>Nossa caminhada</h2>

        <div className={styles.textBlock}>
          {String(historia.texto ?? "")
            .split("\n")
            .map((p: string) => p.trim())
            .filter(Boolean)
            .map((p: string, i: number) => (
              <p key={i}>{p}</p>
            ))}
        </div>
      </div>

      {historia.marcos?.length ? (
        <div id="marcos-historia" className={styles.timelineCard}>
          <h2 className={styles.sectionTitle}>Marcos importantes</h2>

          <div className={styles.timeline}>
            {historia.marcos.map((marco: any) => (
              <div key={marco.id} className={styles.timelineItem}>
                <div className={styles.timelineYear}>{marco.ano}</div>

                <div className={styles.timelineBody}>
                  <h3>{marco.titulo}</h3>
                  {marco.descricao ? <p>{marco.descricao}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
