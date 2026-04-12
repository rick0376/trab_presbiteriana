//src/components/radio/programacao/ProgramacaoRadioModal/ProgramacaoRadioModal.tsx

"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import styles from "./styles.module.scss";

type WeekItem = {
  key: string;
  label: string;
  items: {
    id: string;
    horaInicio: string;
    horaFim: string;
    titulo: string;
    subtitulo?: string | null;
    responsavel?: string | null;
  }[];
};

type DataResponse = {
  todayKey: string;
  todayLabel: string;
  todayItems: WeekItem["items"];
  week: WeekItem[];
};

export default function ProgramacaoRadioModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function load() {
      try {
        setLoading(true);
        const r = await fetch("/api/radio/programacao/public", {
          cache: "no-store",
        });
        const j = await r.json().catch(() => null);
        if (r.ok) setData(j);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Programação da Rádio</h3>
            <p className={styles.subtitle}>Confira a grade semanal.</p>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className={styles.empty}>Carregando programação...</div>
        ) : !data ? (
          <div className={styles.empty}>
            Não foi possível carregar a programação.
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.todayBox}>
              <h4 className={styles.blockTitle}>Hoje — {data.todayLabel}</h4>

              {data.todayItems.length ? (
                <div className={styles.programList}>
                  {data.todayItems.map((item) => (
                    <div key={item.id} className={styles.programItem}>
                      <strong>
                        {item.horaInicio} - {item.horaFim}
                      </strong>
                      <span>{item.titulo}</span>
                      {item.subtitulo ? <small>{item.subtitulo}</small> : null}
                      {item.responsavel ? (
                        <small>Responsável: {item.responsavel}</small>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptySmall}>
                  Sem programação para hoje.
                </div>
              )}
            </div>

            <div className={styles.weekBox}>
              <h4 className={styles.blockTitle}>Grade semanal</h4>

              <div className={styles.weekList}>
                {data.week.map((day) => (
                  <div key={day.key} className={styles.dayCard}>
                    <div className={styles.dayTitle}>{day.label}</div>

                    {day.items.length ? (
                      <div className={styles.dayItems}>
                        {day.items.map((item) => (
                          <div key={item.id} className={styles.dayItem}>
                            <strong>
                              {item.horaInicio} - {item.horaFim}
                            </strong>
                            <span>{item.titulo}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptySmall}>Sem programação</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
