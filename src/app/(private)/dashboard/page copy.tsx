import styles from "./styles.module.scss";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import AniversariantesMesCard from "@/components/dashboard/AniversariantesMesCard/AniversariantesMesCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  const isSuperAdmin = user.role === "SUPERADMIN";
  const igrejaId = user.igrejaId ?? null;

  // ======================================================
  // SUPERADMIN
  // ======================================================
  if (isSuperAdmin) {
    const hoje = new Date();

    const [totalIgrejas, totalMembros, totalEventos, totalCronogramas] =
      await Promise.all([
        prisma.igreja.count(),
        prisma.membro.count(),
        prisma.evento.count(),
        prisma.cronogramaAnual.count(),
      ]);

    const mediaPorIgreja =
      totalIgrejas > 0 ? Math.round(totalMembros / totalIgrejas) : 0;

    return (
      <div className={styles.container}>
        <div className={styles.top}>
          <div>
            <h1 className={styles.h1}>Dashboard</h1>
            <p className={styles.sub}>Visão geral do sistema (SUPERADMIN)</p>
          </div>
          <div className={styles.badgeRole}>SUPERADMIN</div>
        </div>

        <section className={styles.gridStats}>
          <div className={styles.statCardM}>
            <div className={styles.statLabel}>Igrejas</div>
            <div className={styles.statValue}>{totalIgrejas}</div>
          </div>

          <div className={styles.statCardMM}>
            <div className={styles.statLabel}>Membros</div>
            <div className={styles.statValue}>{totalMembros}</div>
          </div>

          <div className={styles.statCardE}>
            <div className={styles.statLabel}>Média por igreja</div>
            <div className={styles.statValue}>{mediaPorIgreja}</div>
          </div>

          <div className={styles.statCardCA}>
            <div className={styles.statLabel}>Cronogramas</div>
            <div className={styles.statValue}>{totalCronogramas}</div>
          </div>
        </section>
      </div>
    );
  }

  // ======================================================
  // USUÁRIO NORMAL
  // ======================================================
  if (!igrejaId) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>⚠️ Nenhuma igreja vinculada</h2>
          <p className={styles.empty}>
            Seu usuário não possui uma igreja associada.
          </p>
        </div>
      </div>
    );
  }

  // ======================================================
  // DATAS (DECLARADAS ANTES DO PROMISE.ALL)
  // ======================================================
  const hoje = new Date();

  const primeiroDiaMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    1,
    0,
    0,
    0,
  );

  const ultimoDiaMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  const primeiroDiaAno = new Date(hoje.getFullYear(), 0, 1, 0, 0, 0);
  const ultimoDiaAno = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59);

  // ======================================================
  // CONSULTAS
  // ======================================================
  const [
    igreja,
    membrosCount,
    eventosCount,
    proximosEventos,
    ultimosMembros,
    membrosComNascimento,
    novosMembrosMes,
    cronogramaAnual,
    cronogramaSemanal,
  ] = await Promise.all([
    prisma.igreja.findUnique({
      where: { id: igrejaId },
      select: {
        nome: true,
        slug: true,
        plano: true,
        membros: true,
      },
    }),

    prisma.membro.count({
      where: { igrejaId },
    }),

    prisma.evento.count({
      where: { igrejaId },
    }),

    prisma.evento.findMany({
      where: {
        igrejaId,
        data: { gte: hoje },
      },
      orderBy: { data: "asc" },
      take: 6,
    }),

    prisma.membro.findMany({
      where: { igrejaId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        nome: true,
        cargo: true,
        createdAt: true,
      },
    }),

    prisma.membro.findMany({
      where: {
        igrejaId,
        NOT: { dataNascimento: null },
      },
      select: {
        id: true,
        nome: true,
        dataNascimento: true,
      },
    }),

    prisma.membro.count({
      where: {
        igrejaId,
        createdAt: {
          gte: primeiroDiaMes,
          lte: ultimoDiaMes,
        },
      },
    }),

    prisma.cronogramaAnual.count({
      where: {
        igrejaId,
        data: {
          gte: primeiroDiaAno,
          lte: ultimoDiaAno,
        },
      },
    }),

    prisma.cronogramaItem.count({
      where: {
        igrejaPublico: {
          igrejaId: igrejaId,
        },
      },
    }),
  ]);

  // ======================================================
  // ANIVERSARIANTES DE HOJE
  // ======================================================

  const aniversariantesDoDia = membrosComNascimento.filter((m) => {
    if (!m.dataNascimento) return false;

    const nascimento = new Date(m.dataNascimento);

    const diaNascimento = nascimento.getUTCDate();
    const mesNascimento = nascimento.getUTCMonth();

    const diaHoje = hoje.getUTCDate();
    const mesHoje = hoje.getUTCMonth();

    return diaNascimento === diaHoje && mesNascimento === mesHoje;
  });

  // ======================================================
  // ANIVERSARIANTES DO MÊS (com idade)
  // ======================================================

  const mesHoje = hoje.getUTCMonth();
  const anoHoje = hoje.getUTCFullYear();

  const aniversariantesDoMes = membrosComNascimento
    .filter((m) => {
      if (!m.dataNascimento) return false;
      const nasc = new Date(m.dataNascimento);
      return nasc.getUTCMonth() === mesHoje;
    })
    .map((m) => {
      const nasc = new Date(m.dataNascimento as any);
      const y = nasc.getUTCFullYear();
      const mth = nasc.getUTCMonth();
      const d = nasc.getUTCDate();

      // idade atual (considerando mês/dia)
      let idade = anoHoje - y;
      const jaFezAniversarioEsteAno =
        mesHoje > mth || (mesHoje === mth && hoje.getUTCDate() >= d);
      if (!jaFezAniversarioEsteAno) idade -= 1;

      const ymd = `${y}-${String(mth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      return {
        id: m.id,
        nome: m.nome,
        dataNascimentoISO: ymd,
        idade,
      };
    });

  const mesLabel = hoje.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.h1}>Dashboard</h1>
          <p className={styles.sub}>{igreja?.nome ?? "Minha igreja"}</p>
        </div>
        <div className={styles.badgeRole}>{user.name}</div>
      </div>

      <section className={styles.gridStats}>
        <div className={styles.statCardM}>
          <div className={styles.statLabel}>Membros</div>
          <div className={styles.statValue}>{membrosCount}</div>
        </div>

        <div className={styles.statCardMM}>
          <div className={styles.statLabel}>Novos Membros</div>
          <div className={styles.statValue}>{novosMembrosMes}</div>
        </div>

        <div className={styles.statCardE}>
          <div className={styles.statLabel}>Eventos</div>
          <div className={styles.statValue}>{eventosCount}</div>
        </div>

        <div className={styles.statCardCS}>
          <div className={styles.statLabel}>Cronograma Semanal</div>
          <div className={styles.statValue}>{cronogramaSemanal}</div>
        </div>

        <div className={styles.statCardCA}>
          <div className={styles.statLabel}>Cronograma Anual</div>
          <div className={styles.statValue}>{cronogramaAnual}</div>
        </div>
      </section>

      <section className={styles.grid2}>
        {/* 🎉 Aniversariantes */}
        <div className={styles.cardNiver}>
          <div className={styles.cardHeaderNiver}>
            <h2>🎉 Aniversariantes do dia</h2>
            <div className={styles.spanNiver}>
              {aniversariantesDoDia.length}
            </div>
          </div>

          {aniversariantesDoDia.length === 0 ? (
            <p className={styles.empty}>Nenhum aniversariante hoje.</p>
          ) : (
            <ul className={styles.list}>
              {aniversariantesDoDia.map((m) => (
                <li key={m.id} className={styles.listItemNiver}>
                  {m.nome}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 🎂 Aniversariantes do mês (card + modal) */}
        <AniversariantesMesCard
          total={aniversariantesDoMes.length}
          mesLabel={mesLabel}
          items={aniversariantesDoMes}
        />

        {/* 📅 Próximos Eventos */}
        <div className={`${styles.card} ${styles.cardEventos}`}>
          <div className={styles.cardHeader}>
            <h2>📅 Próximos eventos</h2>
            <div className={styles.spanCard}>{proximosEventos.length}</div>
          </div>

          {proximosEventos.length === 0 ? (
            <p className={styles.empty}>Nenhum evento futuro.</p>
          ) : (
            <ul className={styles.list}>
              {proximosEventos.map((e) => (
                <li key={e.id} className={styles.listItem}>
                  <div>
                    <div className={styles.listTitle}>{e.titulo}</div>
                    <div className={styles.listSub}>
                      {new Date(e.data).toLocaleString("pt-BR")}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 👥 Últimos membros */}
        <div className={`${styles.card} ${styles.cardUltimos}`}>
          <div className={styles.cardHeader}>
            <h2>👥 Últimos membros</h2>
            <div className={styles.spanCard}>{ultimosMembros.length}</div>
          </div>

          {ultimosMembros.length === 0 ? (
            <p className={styles.empty}>Nenhum membro ainda.</p>
          ) : (
            <ul className={styles.list}>
              {ultimosMembros.map((m) => (
                <li key={m.id} className={styles.listItem}>
                  <div>
                    <div className={styles.listTitle}>{m.nome}</div>
                    <div className={styles.listSub}>
                      {m.cargo} •{" "}
                      {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
