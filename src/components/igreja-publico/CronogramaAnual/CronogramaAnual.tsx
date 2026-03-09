// components/igreja-publico/CronogramaAnual/CronogramaAnual.tsx

"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.scss";

type Item = {
  id: string;
  titulo: string;
  data: string;
};

export default function CronogramaAnual({ slug }: { slug: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  if (!slug) {
    return <div style={{ color: "red" }}>Slug NÃO recebido</div>;
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/igreja-publico/${slug}/cronograma-anual`, {
          cache: "no-store",
        });

        if (!r.ok) {
          setItems([]);
          return;
        }

        const j = await r.json();
        setItems(Array.isArray(j?.items) ? j.items : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  if (loading) {
    return (
      <section className={styles.wrap}>
        <div className={styles.header}>
          <h2 className={styles.title}>📆 Cronograma anual</h2>
          <p className={styles.subtitle}>
            Acompanhe os principais eventos e datas do ano.
          </p>
        </div>
        <div className={styles.loading}>Carregando...</div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className={styles.wrap}>
        <div className={styles.header}>
          <h2 className={styles.title}>📆 Cronograma anual</h2>
          <p className={styles.subtitle}>
            Acompanhe os principais eventos e datas do ano.
          </p>
        </div>
        <div className={styles.empty}>Nenhum item encontrado</div>
      </section>
    );
  }

  return (
    <section className={styles.wrap}>
      <div className={styles.header}>
        <h2 className={styles.title}>📆 Cronograma anual</h2>
        <p className={styles.subtitle}>
          Acompanhe os principais eventos e datas do ano.
        </p>
      </div>

      <div className={styles.list}>
        {items.map((it) => (
          <div key={it.id} className={styles.item}>
            <div className={styles.left}>
              <div className={styles.itemTitle}>{it.titulo}</div>
            </div>

            <div className={styles.right}>
              <div className={styles.itemDate}>
                {new Date(it.data).toLocaleDateString("pt-BR")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
