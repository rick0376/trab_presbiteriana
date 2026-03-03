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

  // DEBUG VISUAL — confirma se está renderizando e recebendo slug
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
        <h2 className={styles.title}>📆 Cronograma anual</h2>
        <div className={styles.loading}>Carregando...</div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className={styles.wrap}>
        <h2 className={styles.title}>📆 Cronograma anual</h2>
        <div style={{ padding: 10 }}>Nenhum item encontrado</div>
      </section>
    );
  }

  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>📆 Cronograma anual</h2>

      <div className={styles.list}>
        {items.map((it) => (
          <div key={it.id} className={styles.item}>
            <div className={styles.itemTitle}>{it.titulo}</div>
            <div className={styles.itemDate}>
              {new Date(it.data).toLocaleDateString("pt-BR")}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
