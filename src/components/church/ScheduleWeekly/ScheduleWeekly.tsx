import styles from "./styles.module.scss";

type Item = {
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

type Props = {
  items: Item[];
};

const DIA_LABEL: Record<Item["dia"], string> = {
  SEGUNDA: "SEGUNDA",
  TERCA: "TERÇA",
  QUARTA: "QUARTA",
  QUINTA: "QUINTA",
  SEXTA: "SEXTA",
  SABADO: "SÁBADO",
  DOMINGO: "DOMINGO",
};

const ORDEM_DIA: Record<Item["dia"], number> = {
  SEGUNDA: 1,
  TERCA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
  SABADO: 6,
  DOMINGO: 7,
};

export default function ScheduleWeekly({ items }: Props) {
  const ordered = [...items].sort((a, b) => {
    const da = ORDEM_DIA[a.dia] - ORDEM_DIA[b.dia];
    if (da !== 0) return da;
    return a.hora.localeCompare(b.hora);
  });

  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>Agenda de Cultos Semanais</h2>

      <div className={styles.list}>
        {ordered.map((item, i) => (
          <div key={i} className={styles.row}>
            <div className={styles.left}>
              <div className={styles.day}>{DIA_LABEL[item.dia]}</div>
              <div className={styles.hour}>{item.hora}</div>
            </div>

            <div className={styles.text}>{item.titulo}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
