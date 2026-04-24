//src/components/radio/programacao/ProgramacaoRadioModal/ProgramacaoRadioModal.tsx

"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3, Radio, User2, X } from "lucide-react";
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

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrap}>
              <Radio size={20} />
            </div>

            <div>
              <h3 className={styles.title}>Programação da Rádio</h3>
              <p className={styles.subtitle}>
                Confira a grade semanal da transmissão.
              </p>
            </div>
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
              <div className={styles.sectionHead}>
                <div className={styles.sectionHeadLeft}>
                  <CalendarDays size={16} />
                  <h4 className={styles.blockTitle}>
                    Hoje — {data.todayLabel}
                  </h4>
                </div>

                <span className={styles.todayBadge}>Em destaque</span>
              </div>

              {data.todayItems.length ? (
                <div className={styles.programList}>
                  {data.todayItems.map((item) => (
                    <div key={item.id} className={styles.programItem}>
                      <div className={styles.programTime}>
                        <Clock3 size={14} />
                        <strong>
                          {item.horaInicio} - {item.horaFim}
                        </strong>
                      </div>

                      <div className={styles.programTitle}>{item.titulo}</div>

                      {item.subtitulo ? (
                        <div className={styles.programSubtitle}>
                          {item.subtitulo}
                        </div>
                      ) : null}

                      {item.responsavel ? (
                        <div className={styles.programResponsible}>
                          <User2 size={14} />
                          <span>Responsável: {item.responsavel}</span>
                        </div>
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
              <div className={styles.sectionHead}>
                <div className={styles.sectionHeadLeft}>
                  <CalendarDays size={16} />
                  <h4 className={styles.blockTitle}>Grade semanal</h4>
                </div>
              </div>

              <div className={styles.weekList}>
                {data.week.map((day) => (
                  <div
                    key={day.key}
                    className={`${styles.dayCard} ${
                      day.key === data.todayKey ? styles.dayCardToday : ""
                    }`}
                  >
                    <div className={styles.dayTitleRow}>
                      <div className={styles.dayTitle}>{day.label}</div>
                      {day.key === data.todayKey ? (
                        <span className={styles.dayNow}>Hoje</span>
                      ) : null}
                    </div>

                    {day.items.length ? (
                      <div className={styles.dayItems}>
                        {day.items.map((item) => (
                          <div key={item.id} className={styles.dayItem}>
                            <div className={styles.dayItemTime}>
                              {item.horaInicio} - {item.horaFim}
                            </div>
                            <div className={styles.dayItemTitle}>
                              {item.titulo}
                            </div>
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
