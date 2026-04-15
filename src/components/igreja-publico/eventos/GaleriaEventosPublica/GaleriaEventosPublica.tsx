//src/components/igreja-publico/eventos/GaleriaEventosPublica/GaleriaEventosPublica.tsx

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./styles.module.scss";

type Item = {
  id: string;
  titulo: string;
  data: string;
  imagemUrl?: string | null;
  tipo?: string | null;
  local?: string | null;
  descricao?: string | null;
  imagens?: {
    id: string;
    imageUrl: string;
    ordem: number;
    createdAt: string;
  }[];
  _count?: {
    imagens: number;
  };
};

type Props = {
  churchName: string;
  items: Item[];
};

function cloud(url?: string | null) {
  if (!url) return null;
  return url.replace("/upload/", "/upload/w_1200,q_auto,f_auto/");
}

function formatBR(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function normalizarTipo(tipo?: string | null) {
  const valor = String(tipo ?? "").trim();
  return valor || "Sem tipo";
}

export default function GaleriaEventosPublica({ churchName, items }: Props) {
  const [busca, setBusca] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState("Todos");

  const tiposDisponiveis = useMemo(() => {
    const tipos = Array.from(
      new Set(items.map((item) => normalizarTipo(item.tipo))),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));

    return ["Todos", ...tipos];
  }, [items]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();

    return items.filter((item) => {
      const tipoAtual = normalizarTipo(item.tipo);

      const passouTipo =
        tipoSelecionado === "Todos" || tipoAtual === tipoSelecionado;

      const passouBusca =
        !q ||
        item.titulo.toLowerCase().includes(q) ||
        String(item.local ?? "")
          .toLowerCase()
          .includes(q) ||
        String(item.descricao ?? "")
          .toLowerCase()
          .includes(q) ||
        tipoAtual.toLowerCase().includes(q);

      return passouTipo && passouBusca;
    });
  }, [items, busca, tipoSelecionado]);

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.kicker}>{churchName}</div>
        <h1 className={styles.title}>Galeria de Eventos</h1>
        <p className={styles.sub}>
          Procure um evento realizado e filtre por tipo.
        </p>

        <div className={styles.filters}>
          <input
            className={styles.input}
            placeholder="Buscar evento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <div className={styles.typesWrap}>
            {tiposDisponiveis.map((tipo) => (
              <button
                key={tipo}
                type="button"
                className={`${styles.typeBtn} ${
                  tipoSelecionado === tipo ? styles.typeBtnActive : ""
                }`}
                onClick={() => setTipoSelecionado(tipo)}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtrados.length ? (
        <div className={styles.grid}>
          {filtrados.map((item) => {
            const cover = item.imagemUrl || item.imagens?.[0]?.imageUrl || null;
            const tipoLabel = normalizarTipo(item.tipo);

            return (
              <article key={item.id} className={styles.card}>
                <div className={styles.thumb}>
                  {cover ? (
                    <img
                      src={cloud(cover) ?? ""}
                      alt={item.titulo}
                      className={styles.thumbImg}
                    />
                  ) : (
                    <div className={styles.thumbEmpty}>Sem imagem</div>
                  )}

                  <div className={styles.badges}>
                    <span className={styles.badge}>{tipoLabel}</span>
                  </div>
                </div>

                <div className={styles.body}>
                  <h3 className={styles.cardTitle}>{item.titulo}</h3>

                  <div className={styles.meta}>
                    <span>{formatBR(item.data)}</span>
                    <span>{item._count?.imagens ?? 0} foto(s)</span>
                  </div>

                  {item.local ? (
                    <div className={styles.local}>{item.local}</div>
                  ) : null}

                  <Link
                    href={`/eventos/galeria/${item.id}`}
                    className={styles.button}
                  >
                    Ver fotos
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>Nenhum evento encontrado.</div>
      )}
    </section>
  );
}
