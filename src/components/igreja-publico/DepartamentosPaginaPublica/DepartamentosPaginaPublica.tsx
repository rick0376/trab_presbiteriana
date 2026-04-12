//src/components/igreja-publico/DepartamentosPaginaPublica/DepartamentosPaginaPublica.tsx

import Link from "next/link";
import styles from "./styles.module.scss";

type Props = {
  churchName: string;
  items: any[];
};

function cloud(url?: string | null) {
  if (!url) return null;
  return url.replace("/upload/", "/upload/w_1200,q_auto,f_auto/");
}

export default function DepartamentosPaginaPublica({
  churchName,
  items,
}: Props) {
  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.kicker}>Ministérios da igreja</div>
        <h1 className={styles.title}>Departamentos</h1>
        <p className={styles.subtitle}>
          Conheça os departamentos da {churchName} e descubra onde servir,
          aprender e crescer em comunhão.
        </p>
      </div>

      <div className={styles.grid}>
        {items.map((item) => {
          const lider = item.responsaveis?.[0];

          return (
            <article key={item.id} className={styles.card}>
              <div className={styles.cover}>
                {item.capaUrl ? (
                  <img
                    src={cloud(item.capaUrl) ?? ""}
                    alt={item.nome}
                    className={styles.coverImg}
                  />
                ) : (
                  <div className={styles.coverEmpty}>Sem capa</div>
                )}
              </div>

              <div className={styles.body}>
                <h2 className={styles.cardTitle}>{item.nome}</h2>

                <p className={styles.desc}>
                  {item.descricao || "Conheça mais sobre este departamento."}
                </p>

                <div className={styles.infoRow}>
                  <span>{item.diasFuncionamento || "Dias não informados"}</span>
                  <span>
                    {item.horarioFuncionamento || "Horário não informado"}
                  </span>
                </div>

                <div className={styles.lider}>
                  Líder: {lider?.membro?.nome || "Não informado"}
                </div>

                <Link
                  href={`/departamentos/${item.slug}`}
                  className={styles.button}
                >
                  Ver detalhes
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
