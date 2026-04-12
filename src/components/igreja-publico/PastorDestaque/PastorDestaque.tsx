"use client";

import styles from "./styles.module.scss";

type Props = {
  pastorName: string;
  pastorTitle: string;
  mensagem: string;
  imageUrl: string;
  onLideranca: () => void;
};

export default function PastorDestaque({
  pastorName,
  pastorTitle,
  mensagem,
  imageUrl,
  onLideranca,
}: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.imageWrap}>
        <img src={imageUrl} alt={pastorName} className={styles.image} />
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>Nosso Pastor</h2>
        <h3 className={styles.name}>
          {pastorName} | {pastorTitle}
        </h3>

        <p className={styles.message}>{mensagem}</p>

        <button type="button" className={styles.button} onClick={onLideranca}>
          Ver liderança completa
        </button>
      </div>
    </section>
  );
}
