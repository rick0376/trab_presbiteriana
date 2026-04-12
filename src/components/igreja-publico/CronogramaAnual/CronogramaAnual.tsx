// components/igreja-publico/CronogramaAnual/CronogramaAnual.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CalendarDays, Sparkles } from "lucide-react";
import styles from "./styles.module.scss";

type Item = {
  id: string;
  titulo: string;
  data: string;
};

function formatDataCompleta(data: string) {
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "--/--/----";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function formatDiaMes(data: string) {
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) {
    return { dia: "--", mes: "---" };
  }

  const dia = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    timeZone: "UTC",
  }).format(d);

  const mes = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    timeZone: "UTC",
  })
    .format(d)
    .replace(".", "")
    .toUpperCase();

  return { dia, mes };
}

export default function CronogramaAnual({ slug }: { slug: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setItems([]);
      setLoading(false);
      return;
    }

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

  const ordenados = useMemo(() => {
    return [...items].sort((a, b) => {
      return new Date(a.data).getTime() - new Date(b.data).getTime();
    });
  }, [items]);

  if (loading) {
    return (
      <section className={styles.wrap}>
        <div className={styles.header}>
          <div className={styles.kicker}>Agenda do ano</div>
          <h2 className={styles.title}>Cronograma anual</h2>
          <p className={styles.subtitle}>
            Acompanhe os principais eventos e datas do ano.
          </p>
        </div>

        <div className={styles.stateBox}>
          <CalendarClock size={18} />
          <span>Carregando programação anual...</span>
        </div>
      </section>
    );
  }

  if (!ordenados.length) {
    return (
      <section className={styles.wrap}>
        <div className={styles.header}>
          <div className={styles.kicker}>Agenda do ano</div>
          <h2 className={styles.title}>Cronograma anual</h2>
          <p className={styles.subtitle}>
            Acompanhe os principais eventos e datas do ano.
          </p>
        </div>

        <div className={styles.stateBox}>
          <Sparkles size={18} />
          <span>Nenhum item encontrado no cronograma anual.</span>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.kicker}>Agenda do ano</div>
        <h2 className={styles.title}>Cronograma anual</h2>
        <p className={styles.subtitle}>
          Acompanhe os principais eventos e datas do ano.
        </p>
      </div>

      <div className={styles.list}>
        {ordenados.map((it, index) => {
          const { dia, mes } = formatDiaMes(it.data);

          return (
            <article key={it.id} className={styles.item}>
              <div className={styles.left}>
                <div className={styles.dateCard}>
                  <span className={styles.dateDay}>{dia}</span>
                  <span className={styles.dateMonth}>{mes}</span>
                </div>

                <div className={styles.info}>
                  <div className={styles.itemTitle}>{it.titulo}</div>

                  <div className={styles.itemMeta}>
                    <span className={styles.metaIcon}>
                      <CalendarDays size={14} />
                    </span>
                    <span>{formatDataCompleta(it.data)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.right}>
                <span className={styles.indexBadge}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
