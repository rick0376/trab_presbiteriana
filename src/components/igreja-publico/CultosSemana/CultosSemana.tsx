//src/components/igreja-publico/CultosSemana/CultosSemana.tsx

"use client";

import { BookOpenText, Cross, HeartHandshake, Sparkles } from "lucide-react";
import styles from "./styles.module.scss";

type Horario = {
  id: string;
  texto: string;
  diaLabel?: string | null;
  hora?: string | null;
  tituloCard?: string | null;
  descricaoCard?: string | null;
  ordem: number;
};

type Props = {
  horarios: Horario[];
};

function getVariant(index: number) {
  const variants = ["blue", "gold", "wine", "blue"];
  return variants[index % variants.length];
}

function getIcon(index: number) {
  const icons = [
    <BookOpenText size={24} key="book" />,
    <HeartHandshake size={24} key="heart" />,
    <Cross size={24} key="cross" />,
    <Sparkles size={24} key="sparkles" />,
  ];

  return icons[index % icons.length];
}

function extractHora(texto?: string | null) {
  if (!texto) return "";
  const match = texto.match(/\b\d{1,2}:\d{2}\b/g);
  return match?.[0] ?? "";
}

export default function CultosSemana({ horarios }: Props) {
  const itens = (horarios ?? []).filter(
    (item) =>
      item.diaLabel?.trim() ||
      item.hora?.trim() ||
      item.tituloCard?.trim() ||
      item.descricaoCard?.trim() ||
      item.texto?.trim(),
  );

  if (!itens.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Cultos da Semana</h2>
      </div>

      <div className={styles.grid}>
        {itens.map((item, index) => {
          const dia = item.diaLabel?.trim() || "Culto";
          const hora = item.hora?.trim() || extractHora(item.texto) || "--:--";
          const titulo =
            item.tituloCard?.trim() || item.texto?.trim() || "Programação";
          const descricao =
            item.descricaoCard?.trim() ||
            item.texto?.trim() ||
            "Acompanhe nossa programação";

          const variant = getVariant(index);
          const icon = getIcon(index);

          return (
            <article
              key={item.id || `${dia}-${index}`}
              className={`${styles.card} ${styles[variant]}`}
            >
              <div className={styles.cardTop}>
                <div className={styles.iconWrap}>{icon}</div>

                <div className={styles.dayBlock}>
                  <h3 className={styles.dayTitle}>{dia}</h3>
                  <span className={styles.hour}>{hora}</span>
                </div>
              </div>

              <div className={styles.cardBody}>
                <strong className={styles.desc}>{titulo}</strong>
                <span className={styles.detail}>{descricao}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
