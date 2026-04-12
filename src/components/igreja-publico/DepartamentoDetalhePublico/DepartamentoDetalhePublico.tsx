//src/components/igreja-publico/DepartamentoDetalhePublico/DepartamentoDetalhePublico.tsx

import Link from "next/link";
import styles from "./styles.module.scss";

type Props = {
  churchName: string;
  whatsappUrl?: string | null;
  item: any;
};

function cloud(url?: string | null) {
  if (!url) return null;
  return url.replace("/upload/", "/upload/w_1400,q_auto,f_auto/");
}

function getResumo(texto?: string | null) {
  const clean = String(texto ?? "").trim();
  if (!clean) return "";

  if (clean.length <= 320) return clean;
  return `${clean.slice(0, 317)}...`;
}

export default function DepartamentoDetalhePublico({
  churchName,
  whatsappUrl,
  item,
}: Props) {
  const resumo = getResumo(item.descricao);

  return (
    <section className={styles.page}>
      <Link href="/departamentos" className={styles.backLink}>
        ← Voltar para departamentos
      </Link>

      <div className={styles.hero}>
        <div className={styles.heroText}>
          <div className={styles.kicker}>{churchName}</div>

          <h1 className={styles.title}>{item.nome}</h1>

          {resumo ? <p className={styles.resume}>{resumo}</p> : null}

          <div className={styles.pills}>
            <span>{item.diasFuncionamento || "Dias não informados"}</span>
            <span>{item.horarioFuncionamento || "Horário não informado"}</span>
          </div>

          <div className={styles.actions}>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.primaryButton}
              >
                Falar pelo WhatsApp
              </a>
            ) : null}

            <a
              href="#responsaveis-departamento"
              className={styles.secondaryButton}
            >
              Ver responsáveis
            </a>
          </div>

          {item.responsaveis?.length ? (
            <div className={styles.previewGrid}>
              {item.responsaveis.slice(0, 2).map((resp: any) => (
                <div key={resp.id} className={styles.previewCard}>
                  <div className={styles.previewRole}>{resp.cargoTitulo}</div>
                  <div className={styles.previewContent}>
                    <strong>{resp.membro?.nome || "Responsável"}</strong>
                    {resp.bio ? <span>{resp.bio}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.heroImageWrap}>
          <div className={styles.imageFrame}>
            {item.capaUrl ? (
              <img
                src={cloud(item.capaUrl) ?? ""}
                alt={item.nome}
                className={styles.heroImage}
              />
            ) : (
              <div className={styles.coverEmpty}>Sem imagem</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.contentCard}>
        <h2 className={styles.sectionTitle}>Sobre o departamento</h2>
        <div className={styles.textBlock}>
          <p>
            {item.descricao ||
              "Conheça mais sobre este departamento e sua importância na vida da igreja."}
          </p>
        </div>
      </div>

      <div id="responsaveis-departamento" className={styles.responsaveisCard}>
        <h2 className={styles.sectionTitle}>Responsáveis</h2>

        <div className={styles.grid}>
          {item.responsaveis?.length ? (
            item.responsaveis.map((resp: any) => (
              <article key={resp.id} className={styles.card}>
                <div className={styles.photoWrap}>
                  {resp.fotoUrl ? (
                    <img
                      src={cloud(resp.fotoUrl) ?? ""}
                      alt={resp.membro?.nome || "Responsável"}
                      className={styles.photo}
                    />
                  ) : (
                    <div className={styles.photoEmpty}>Sem foto</div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>
                    {resp.membro?.nome || "Responsável"}
                  </h3>
                  <div className={styles.role}>{resp.cargoTitulo}</div>
                  <p className={styles.bio}>
                    {resp.bio || "Sem descrição cadastrada."}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <div className={styles.emptyBox}>
              Nenhum responsável cadastrado para este departamento.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
