//components/igreja-publico/CronogramaSemanal/CronogramaSemanal.tsx

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

export default function CronogramaSemanal({ items }: { items: Item[] }) {
  if (!items?.length) return null;

  return (
    <section id="cronograma" className={styles.wrap}>
      <div className={styles.header}>
        <h2 className={styles.title}>📝 Cronograma semanal</h2>
        <p className={styles.subtitle}>
          Acompanhe os encontros e programações da semana.
        </p>
      </div>

      <div className={styles.grid}>
        {items.map((it) => (
          <div
            key={it.id}
            className={`${styles.item} ${
              it.dia === "DOMINGO" ? styles.highlight : ""
            }`}
          >
            <div className={styles.left}>
              <div className={styles.dia}>{DIA_LABEL[it.dia]}</div>
              <div className={styles.horaBadge}>{it.hora}</div>
            </div>

            <div className={styles.right}>
              <div className={styles.titulo}>{it.titulo}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
