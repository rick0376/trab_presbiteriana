"use client";

import { useMemo, useState } from "react";
import styles from "./styles.module.scss";

type Item = {
  id: string;
  nome: string;
  dataNascimentoISO: string; // "YYYY-MM-DD"
  idade: number;
};

export default function AniversariantesMesCard({
  total,
  mesLabel,
  items,
}: {
  total: number;
  mesLabel: string;
  items: Item[];
}) {
  const [open, setOpen] = useState(false);

  /*const sorted = useMemo(() => {
    return [...items].sort((a, b) =>
      a.dataNascimentoISO.localeCompare(b.dataNascimentoISO),
    );
  }, [items]);
*/

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const dayA = Number(a.dataNascimentoISO.slice(8, 10)); // DD
      const dayB = Number(b.dataNascimentoISO.slice(8, 10)); // DD

      if (dayA !== dayB) return dayA - dayB;

      // desempate: nome
      return (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR", {
        sensitivity: "base",
      });
    });
  }, [items]);

  return (
    <>
      <button
        type="button"
        className={styles.card}
        onClick={() => setOpen(true)}
        disabled={total === 0}
        title={total === 0 ? "Nenhum aniversariante neste mês" : "Ver lista"}
      >
        <div className={styles.header}>
          <h2>🎂 Aniversariantes do mês</h2>
          <div className={styles.badge}>{total}</div>
        </div>
        <p className={styles.sub}>{mesLabel} • clique para ver nomes</p>
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTop}>
              <h3>🎂 Aniversariantes de {mesLabel}</h3>
              <button
                className={styles.close}
                onClick={() => setOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            {sorted.length === 0 ? (
              <div className={styles.empty}>
                Nenhum aniversariante neste mês.
              </div>
            ) : (
              <div className={styles.list}>
                {sorted.map((m) => (
                  <div key={m.id} className={styles.row}>
                    <div className={styles.nome}>{m.nome}</div>
                    <div className={styles.meta}>
                      {formatDateBR(m.dataNascimentoISO)} • {m.idade} anos
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.footer}>
              <button
                className={styles.btn}
                type="button"
                onClick={() => setOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatDateBR(isoYmd: string) {
  if (!isoYmd) return "-";
  const [y, m, d] = isoYmd.split("-");
  return `${d}/${m}/${y}`;
}
