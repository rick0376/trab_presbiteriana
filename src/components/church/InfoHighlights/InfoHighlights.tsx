import styles from "./styles.module.scss";

type Props = {
  items: { texto: string }[];
};

export default function InfoHighlights({ items }: Props) {
  return (
    <div className={styles.list}>
      {items.map((item, i) => (
        <div key={i} className={styles.infoItem}>
          <span className={styles.dot}></span>
          <p>{item.texto}</p>
        </div>
      ))}
    </div>
  );
}
