//src/components/igreja-publico/LiderancaPaginaPublica/LiderancaPaginaPublica.tsx

import Link from "next/link";
import styles from "./styles.module.scss";

type Props = {
  churchName: string;
  pastor: {
    nome: string;
    cargo: string;
    subtitle: string;
    mensagem: string;
    imagem: string;
  };
  whatsappUrl?: string | null;
  departamentos: any[];
};

function cloud(url?: string | null) {
  if (!url) return null;
  return url.replace("/upload/", "/upload/w_1200,q_auto,f_auto/");
}

export default function LiderancaPaginaPublica({
  churchName,
  pastor,
  whatsappUrl,
  departamentos,
}: Props) {
  return (
    <section className={styles.page}>
      <Link href="/igrejas" className={styles.backLink}>
        ← Voltar para início
      </Link>

      <div className={styles.hero}>
        <div className={styles.heroText}>
          <div className={styles.kicker}>{churchName}</div>
          <h1 className={styles.title}>Liderança</h1>
          <p className={styles.subtitle}>
            Conheça a liderança pastoral e os responsáveis pelos ministérios da
            igreja.
          </p>

          <div className={styles.pastorBox}>
            <h2 className={styles.pastorName}>{pastor.nome}</h2>
            <div className={styles.pastorRole}>{pastor.cargo}</div>
            <p className={styles.pastorMini}>{pastor.subtitle}</p>
            <p className={styles.pastorText}>{pastor.mensagem}</p>

            <div className={styles.actions}>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.primaryButton}
                >
                  Falar com a igreja
                </a>
              ) : null}

              <Link href="/departamentos" className={styles.secondaryButton}>
                Ver departamentos
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.heroImageWrap}>
          <div className={styles.imageFrame}>
            <img
              src={cloud(pastor.imagem) ?? pastor.imagem}
              alt={pastor.nome}
              className={styles.heroImage}
            />
          </div>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Liderança dos departamentos</h2>

        <div className={styles.departamentosGrid}>
          {departamentos.length ? (
            departamentos.map((departamento) => (
              <div key={departamento.id} className={styles.departamentoCard}>
                <div className={styles.departamentoHeader}>
                  <h3 className={styles.departamentoTitle}>
                    {departamento.nome}
                  </h3>

                  <Link
                    href={`/departamentos/${departamento.slug}`}
                    className={styles.departamentoLink}
                  >
                    Ver departamento
                  </Link>
                </div>

                {departamento.responsaveis?.length ? (
                  <div className={styles.responsaveisGrid}>
                    {departamento.responsaveis.map((resp: any) => (
                      <article key={resp.id} className={styles.responsavelCard}>
                        <div className={styles.responsavelFotoWrap}>
                          {resp.fotoUrl ? (
                            <img
                              src={cloud(resp.fotoUrl) ?? ""}
                              alt={resp.membro?.nome || "Responsável"}
                              className={styles.responsavelFoto}
                            />
                          ) : (
                            <div className={styles.responsavelFotoEmpty}>
                              Sem foto
                            </div>
                          )}
                        </div>

                        <div className={styles.responsavelBody}>
                          <h4 className={styles.responsavelNome}>
                            {resp.membro?.nome || "Responsável"}
                          </h4>
                          <div className={styles.responsavelCargo}>
                            {resp.cargoTitulo}
                          </div>
                          <p className={styles.responsavelBio}>
                            {resp.bio || "Sem descrição cadastrada."}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyBox}>
                    Nenhum responsável cadastrado para este departamento.
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.emptyBox}>
              Nenhum departamento ativo encontrado.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
