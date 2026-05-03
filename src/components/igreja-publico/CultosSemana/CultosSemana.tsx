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

type CultoItem = Horario & {
  diaFinal: string;
  horaFinal: string;
  tituloFinal: string;
  descricaoFinal: string;
  diaNumero: number;
  minutos: number;
  isHoje: boolean;
  isProximo: boolean;
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

function normalizarDia(dia?: string | null) {
  const clean = String(dia ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (clean.includes("domingo")) return 0;
  if (clean.includes("segunda")) return 1;
  if (clean.includes("terca")) return 2;
  if (clean.includes("quarta")) return 3;
  if (clean.includes("quinta")) return 4;
  if (clean.includes("sexta")) return 5;
  if (clean.includes("sabado")) return 6;

  return 99;
}

function horaParaMinutos(hora: string) {
  const [h, m] = hora.split(":").map(Number);

  if (!Number.isFinite(h) || !Number.isFinite(m)) return 9999;

  return h * 60 + m;
}

function getProximoIndex(itens: CultoItem[]) {
  const agora = new Date();
  const hoje = agora.getDay();
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

  const candidatos = itens
    .map((item, index) => {
      let distanciaDias = item.diaNumero - hoje;

      if (distanciaDias < 0) distanciaDias += 7;

      if (distanciaDias === 0 && item.minutos < minutosAgora) {
        distanciaDias = 7;
      }

      return {
        index,
        distancia: distanciaDias * 1440 + item.minutos,
      };
    })
    .sort((a, b) => a.distancia - b.distancia);

  return candidatos[0]?.index ?? -1;
}

export default function CultosSemana({ horarios }: Props) {
  const baseItens = (horarios ?? []).filter(
    (item) =>
      item.diaLabel?.trim() ||
      item.hora?.trim() ||
      item.tituloCard?.trim() ||
      item.descricaoCard?.trim() ||
      item.texto?.trim(),
  );

  if (!baseItens.length) return null;

  const hoje = new Date().getDay();

  const preparados: CultoItem[] = baseItens.map((item) => {
    const diaFinal = item.diaLabel?.trim() || "Culto";
    const horaFinal = item.hora?.trim() || extractHora(item.texto) || "--:--";
    const tituloFinal =
      item.tituloCard?.trim() || item.texto?.trim() || "Programação";
    const descricaoFinal =
      item.descricaoCard?.trim() ||
      item.texto?.trim() ||
      "Acompanhe nossa programação";

    const diaNumero = normalizarDia(diaFinal);
    const minutos = horaParaMinutos(horaFinal);

    return {
      ...item,
      diaFinal,
      horaFinal,
      tituloFinal,
      descricaoFinal,
      diaNumero,
      minutos,
      isHoje: diaNumero === hoje,
      isProximo: false,
    };
  });

  const proximoIndex = getProximoIndex(preparados);

  const itens = preparados.map((item, index) => ({
    ...item,
    isProximo: index === proximoIndex,
  }));

  const proximoCulto = itens.find((item) => item.isProximo);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Cultos da Semana</h2>

          {proximoCulto ? (
            <p className={styles.nextText}>
              Próximo culto:{" "}
              <strong>
                {proximoCulto.diaFinal} às {proximoCulto.horaFinal}
              </strong>
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.grid}>
        {itens.map((item, index) => {
          const variant = getVariant(index);
          const icon = getIcon(index);

          return (
            <article
              key={item.id || `${item.diaFinal}-${index}`}
              className={`${styles.card} ${styles[variant]} ${
                item.isProximo ? styles.proximoCard : ""
              }`}
            >
              <div className={styles.badgeRow}>
                {item.isHoje ? (
                  <span className={styles.todayBadge}>HOJE</span>
                ) : null}
                {item.isProximo ? (
                  <span className={styles.nextBadge}>PRÓXIMO CULTO</span>
                ) : null}
              </div>

              <div className={styles.cardTop}>
                <div className={styles.iconWrap}>{icon}</div>

                <div className={styles.dayBlock}>
                  <h3 className={styles.dayTitle}>{item.diaFinal}</h3>
                  <span className={styles.hour}>{item.horaFinal}</span>
                </div>
              </div>

              <div className={styles.cardBody}>
                <strong className={styles.desc}>{item.tituloFinal}</strong>
                <span className={styles.detail}>{item.descricaoFinal}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
