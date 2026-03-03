import Link from "next/link";
import styles from "./styles.module.scss";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import IgrejaSelectClient from "./IgrejaSelectClient";

export default async function SecretariaDashboard({
  selectedIgrejaId,
}: {
  selectedIgrejaId: string | null;
}) {
  const user = await requireUser();

  let igrejaId = user.igrejaId ?? null;

  let igrejas: { id: string; nome: string; slug: string }[] = [];

  if (user.role === "SUPERADMIN") {
    igrejas = await prisma.igreja.findMany({
      select: { id: true, nome: true, slug: true },
      orderBy: { createdAt: "asc" },
    });

    const firstId = igrejas[0]?.id ?? null;
    igrejaId = selectedIgrejaId ?? firstId;
  }

  if (!igrejaId && user.role !== "SUPERADMIN") {
    const igreja = await prisma.igreja.findFirst({
      where: { adminId: user.id },
      select: { id: true },
    });

    igrejaId = igreja?.id ?? null;
  }

  if (!igrejaId) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Secretaria</h1>

        <div className={styles.cards}>
          <div className={styles.card}>Igreja não encontrada.</div>
        </div>
      </div>
    );
  }

  const [totalMembros, totalCargos] = await Promise.all([
    prisma.membro.count({ where: { igrejaId } }),
    prisma.cargo.count({ where: { igrejaId } }),
  ]);

  const membrosPorCargo = await prisma.membro.groupBy({
    by: ["cargo"],
    where: { igrejaId },
    _count: { cargo: true },
    orderBy: { _count: { cargo: "desc" } },
  });

  const cargosCadastrados = await prisma.cargo.findMany({
    where: { igrejaId },
    orderBy: { nome: "asc" },
  });

  const qs = `?igrejaId=${igrejaId}`;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Secretaria</h1>

        {user.role === "SUPERADMIN" && igrejas.length > 0 && (
          <IgrejaSelectClient igrejas={igrejas} igrejaId={igrejaId} />
        )}
      </div>

      <div className={styles.cards}>
        <Link
          href={`/secretaria/membros${qs}`}
          className={`${styles.card} ${styles.card_membros}`}
        >
          <div className={styles.cardTop}>
            <div className={styles.cardTitle}>
              <span className={styles.cardIcon} aria-hidden>
                👥
              </span>
              Membros
            </div>

            <div className={styles.cardTotal}>
              Total: <b>{totalMembros}</b>
            </div>
          </div>

          {membrosPorCargo.length > 0 && (
            <div className={styles.cardList}>
              {membrosPorCargo.slice(0, 5).map((x) => (
                <div key={x.cargo} className={styles.cardRow}>
                  <span className={styles.cardKey} title={x.cargo}>
                    {x.cargo}
                  </span>
                  <b className={styles.cardVal}>{x._count.cargo}</b>
                </div>
              ))}
            </div>
          )}
        </Link>

        <Link
          href={`/secretaria/cargos${qs}`}
          className={`${styles.card} ${styles.card_cargos}`}
        >
          <div className={styles.cardTop}>
            <div className={styles.cardTitle}>
              <span className={styles.cardIcon} aria-hidden>
                🏷️
              </span>
              Cargos
            </div>

            <div className={styles.cardTotal}>
              Total: <b>{totalCargos}</b>
            </div>
          </div>

          {cargosCadastrados.length > 0 ? (
            <div className={styles.cardList}>
              {cargosCadastrados.slice(0, 5).map((cargo) => (
                <div key={cargo.id} className={styles.cardRow}>
                  <span className={styles.cardKey} title={cargo.nome}>
                    {cargo.nome}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.cardHint}>Nenhum cargo cadastrado.</div>
          )}
        </Link>

        <div
          className={`${styles.card} ${styles.card_financeiro} ${styles.cardDisabled}`}
        >
          <div className={styles.cardTop}>
            <div className={styles.cardTitle}>
              <span className={styles.cardIcon} aria-hidden>
                💰
              </span>
              Financeiro
            </div>

            <div className={styles.cardTotal}>Em breve</div>
          </div>

          <div className={styles.cardHint}>Módulo em desenvolvimento.</div>
        </div>
      </div>
    </div>
  );
} //rick
