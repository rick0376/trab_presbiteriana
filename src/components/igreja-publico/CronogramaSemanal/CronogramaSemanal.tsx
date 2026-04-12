//components/igreja-publico/CronogramaSemanal/CronogramaSemanal.tsx

import {
  BookOpenText,
  CalendarDays,
  Church,
  Clock3,
  HandHeart,
  Sparkles,
  Users,
} from "lucide-react";
import styles from "./styles.module.scss";

type Item = {
  id: string;
  dia:
    | "SEGUNDA"
    | "TERCA"
    | "QUARTA"
    | "QUINTA"
    | "SEXTA"
    | "SABADO"
    | "DOMINGO";
  hora: string;
  titulo: string;
};

const DIA_LABEL: Record<Item["dia"], string> = {
  SEGUNDA: "Segunda-feira",
  TERCA: "Terça-feira",
  QUARTA: "Quarta-feira",
  QUINTA: "Quinta-feira",
  SEXTA: "Sexta-feira",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

const DIA_ORDEM: Record<Item["dia"], number> = {
  SEGUNDA: 1,
  TERCA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
  SABADO: 6,
  DOMINGO: 7,
};

function getIcon(dia: Item["dia"]) {
  switch (dia) {
    case "SEGUNDA":
      return <CalendarDays size={18} />;
    case "TERCA":
      return <Users size={18} />;
    case "QUARTA":
      return <BookOpenText size={18} />;
    case "QUINTA":
      return <HandHeart size={18} />;
    case "SEXTA":
      return <Sparkles size={18} />;
    case "SABADO":
      return <Church size={18} />;
    case "DOMINGO":
      return <Church size={18} />;
    default:
      return <CalendarDays size={18} />;
  }
}

export default function CronogramaSemanal({ items }: { items: Item[] }) {
  if (!items?.length) return null;

  const ordenados = [...items].sort((a, b) => {
    const diaCompare = DIA_ORDEM[a.dia] - DIA_ORDEM[b.dia];
    if (diaCompare !== 0) return diaCompare;
    return a.hora.localeCompare(b.hora);
  });

  return (
    <section id="cronograma" className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.kicker}>Programação da igreja</div>
        <h2 className={styles.title}>Cronograma semanal</h2>
        <p className={styles.subtitle}>
          Acompanhe os encontros, cultos e atividades ao longo da semana.
        </p>
      </div>

      <div className={styles.list}>
        {ordenados.map((it, index) => (
          <article
            key={it.id}
            className={`${styles.item} ${
              it.dia === "DOMINGO" ? styles.highlight : ""
            }`}
          >
            <div className={styles.left}>
              <div className={styles.iconBox}>{getIcon(it.dia)}</div>

              <div className={styles.dayInfo}>
                <div className={styles.dia}>{DIA_LABEL[it.dia]}</div>
                <div className={styles.horaRow}>
                  <span className={styles.horaIcon}>
                    <Clock3 size={14} />
                  </span>
                  <span className={styles.horaBadge}>{it.hora}</span>
                </div>
              </div>
            </div>

            <div className={styles.center}>
              <div className={styles.titulo}>{it.titulo}</div>
            </div>

            <div className={styles.right}>
              <span className={styles.indexBadge}>
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
