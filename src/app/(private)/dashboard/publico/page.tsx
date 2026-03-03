import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { requireUser } from "@/lib/auth";
import EditorPublico from "@/components/igreja-publico/EditorPublico/EditorPublico";
import EditorEventos from "@/components/igreja-publico/eventos/EditorEventos/EditorEventos";
import EditorCronogramaAnual from "@/components/igreja-publico/CronogramaAnual/EditorCronogramaAnual/EditorCronogramaAnual";
import styles from "./styles.module.scss";

export const dynamic = "force-dynamic";

type SearchParams = {
  igrejaId?: string;
};

export default async function PublicoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // ✅ 1) precisa ter permissão pra ver a página
  await requirePermission("publico", "ler");

  // ✅ 2) pega usuário atual (pra descobrir igreja e canEdit)
  const me = await requireUser();

  // ✅ 3) canEdit: SUPERADMIN ou publico.editar no banco
  const canEdit =
    me.role === "SUPERADMIN" ||
    !!(
      await prisma.permissao.findUnique({
        where: { userId_recurso: { userId: me.id, recurso: "publico" } },
        select: { editar: true },
      })
    )?.editar;

  const params = await searchParams;
  let igrejaId = me.igrejaId ?? null;

  if (!igrejaId && me.role === "SUPERADMIN") {
    const igrejas = await prisma.igreja.findMany({
      select: { id: true, nome: true, slug: true },
      orderBy: { nome: "asc" },
    });

    const selected = params?.igrejaId?.trim();

    function SelectUI(msgTitle: string, msgSub?: string) {
      return (
        <div className={styles.wrap}>
          <div className={styles.card}>
            <h1 className={styles.title}>{msgTitle}</h1>
            {msgSub && <p className={styles.sub}>{msgSub}</p>}

            <form
              action="/dashboard/publico"
              method="GET"
              className={styles.form}
            >
              <select
                name="igrejaId"
                defaultValue=""
                required
                className={styles.select}
              >
                <option value="" disabled>
                  -- Escolha --
                </option>

                {igrejas.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome} ({i.slug})
                  </option>
                ))}
              </select>

              <button type="submit" className={styles.btn}>
                Abrir
              </button>
            </form>
          </div>

          <div className={styles.hintCard}>
            Dica: depois de abrir, você vai editar <strong>horários</strong>,{" "}
            <strong>cronograma</strong>, <strong>WhatsApp</strong>,{" "}
            <strong>redes sociais</strong> e <strong>eventos</strong>.
          </div>
        </div>
      );
    }

    if (!selected) {
      return SelectUI(
        "Selecione a igreja",
        "Como SUPERADMIN, escolha qual igreja deseja abrir.",
      );
    }

    const exists = await prisma.igreja.findUnique({
      where: { id: selected },
      select: { id: true },
    });

    if (!exists) {
      return SelectUI(
        "Igreja inválida",
        "Selecione novamente uma igreja válida.",
      );
    }

    igrejaId = selected;
  }

  if (!igrejaId) return null;

  const publico = await prisma.igrejaPublico.upsert({
    where: { igrejaId },
    update: {},
    create: {
      igrejaId,
      bannerSubtitle: "",
      whatsappUrl: "",
      instagramUrl: "",
      facebookUrl: "",
    },
    include: {
      horarios: { orderBy: { ordem: "asc" } },
      cronograma: { orderBy: [{ dia: "asc" }, { ordem: "asc" }] },
    },
  });

  return (
    <div className={styles.page}>
      <EditorPublico initialData={publico} canEdit={canEdit} />
      <EditorEventos igrejaId={igrejaId} canEdit={canEdit} />
      <EditorCronogramaAnual igrejaId={igrejaId} />
    </div>
  );
}
