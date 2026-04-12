//src/components/igreja-publico/DepartamentosDestaque/DepartamentosDestaque.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./styles.module.scss";

type Responsavel = {
  id: string;
  cargoTitulo: string;
  fotoUrl?: string | null;
  membro?: {
    nome: string;
  } | null;
};

type Departamento = {
  id: string;
  nome: string;
  slug: string;
  descricao?: string | null;
  capaUrl?: string | null;
  diasFuncionamento?: string | null;
  horarioFuncionamento?: string | null;
  responsaveis: Responsavel[];
};

type Props = {
  igrejaSlug: string;
};

function cloud(url?: string | null) {
  if (!url) return null;
  return url.replace("/upload/", "/upload/w_1000,q_auto,f_auto/");
}

export default function DepartamentosDestaque({ igrejaSlug }: Props) {
  const [items, setItems] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!igrejaSlug) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const r = await fetch(`/api/igreja-publico/${igrejaSlug}/departamentos`, {
        cache: "no-store",
      });

      const j = await r.json().catch(() => ({}));

      setItems(Array.isArray(j?.items) ? j.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [igrejaSlug]);

  if (loading) {
    return (
      <section id="departamentos" className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>Departamentos</h2>
          <p className={styles.subtitle}>Carregando departamentos...</p>
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section id="departamentos" className={styles.section}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Departamentos</h2>
          <p className={styles.subtitle}>
            Conheça os ministérios e áreas de atuação da igreja.
          </p>
        </div>

        <Link href="/departamentos" className={styles.allButton}>
          Ver todos os departamentos
        </Link>
      </div>

      <div className={styles.grid}>
        {items.slice(0, 6).map((item) => {
          const primeiroResponsavel = item.responsaveis?.[0];

          return (
            <article key={item.id} className={styles.card}>
              <div className={styles.imageWrap}>
                {item.capaUrl ? (
                  <img
                    src={cloud(item.capaUrl) ?? ""}
                    alt={item.nome}
                    className={styles.image}
                  />
                ) : (
                  <div className={styles.imageFallback}>Sem imagem</div>
                )}

                <div className={styles.overlay} />
              </div>

              <div className={styles.body}>
                <h3 className={styles.cardTitle}>{item.nome}</h3>

                <div className={styles.leader}>
                  {primeiroResponsavel?.membro?.nome ||
                    "Responsável não informado"}
                </div>

                <div className={styles.meta}>
                  {item.diasFuncionamento || "Dias não informados"}
                </div>

                <Link
                  href={`/departamentos/${item.slug}`}
                  className={styles.button}
                >
                  Saiba mais
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
