//src/components/igreja-publico/BoasVindasPublica/BoasVindasPublica.tsx

"use client";

import styles from "./styles.module.scss";

type Props = {
  churchName: string;
  texto: string;
  tags: string[];
  pastorName: string;
  pastorTitle: string;
  pastorSubtitle: string;
  imageUrl: string;
  onHistoria: () => void;
};

export default function BoasVindasPublica({
  churchName,
  texto,
  tags,
  pastorName,
  pastorTitle,
  pastorSubtitle,
  imageUrl,
  onHistoria,
}: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.left}>
        <h2 className={styles.title}>Seja Bem-vindo!</h2>

        <p className={styles.texto}>
          {texto ||
            `Somos a ${churchName}, uma comunidade de fé comprometida em
          compartilhar o evangelho de Jesus Cristo e transformar vidas para a glória de Deus.`}
        </p>

        <div className={styles.tags}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        <button type="button" className={styles.button} onClick={onHistoria}>
          Conheça nossa história
        </button>
      </div>

      <div className={styles.right}>
        <img src={imageUrl} alt={pastorName} className={styles.image} />

        <div className={styles.overlayCard}>
          <h3 className={styles.overlayTitle}>
            {pastorName} | {pastorTitle}
          </h3>
          <p className={styles.overlaySubtitle}>{pastorSubtitle}</p>
        </div>
      </div>
    </section>
  );
}
