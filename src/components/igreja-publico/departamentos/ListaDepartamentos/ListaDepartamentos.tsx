//src/components/igeja-publico/departamentos/ListaDepartamentos/ListaDepartamentos.tsx

"use client";

import styles from "./styles.module.scss";
import { PencilLine, Trash2, Users } from "lucide-react";

type Props = {
  items: any[];
  canEdit: boolean;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
};

export default function ListaDepartamentos({
  items,
  canEdit,
  onEdit,
  onDelete,
}: Props) {
  if (!items.length) {
    return (
      <div className={styles.empty}>Nenhum departamento cadastrado ainda.</div>
    );
  }

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <div key={item.id} className={styles.card}>
          <div className={styles.coverWrap}>
            {item.capaUrl ? (
              <img
                src={item.capaUrl}
                alt={item.nome}
                className={styles.coverImage}
              />
            ) : (
              <div className={styles.coverEmpty}>Sem capa</div>
            )}
          </div>

          <div className={styles.body}>
            <div className={styles.topRow}>
              <h3 className={styles.title}>{item.nome}</h3>
              <span className={item.ativo ? styles.badgeOn : styles.badgeOff}>
                {item.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>

            <p className={styles.desc}>{item.descricao || "Sem descrição."}</p>

            <div className={styles.meta}>
              <span>{item.diasFuncionamento || "Dias não informados"}</span>
              <span>
                {item.horarioFuncionamento || "Horário não informado"}
              </span>
            </div>

            <div className={styles.responsaveis}>
              <div className={styles.respTitle}>
                <Users size={15} />
                <span>Responsáveis</span>
              </div>

              {item.responsaveis?.length ? (
                <div className={styles.respList}>
                  {item.responsaveis.map((resp: any) => (
                    <div key={resp.id} className={styles.respItem}>
                      <strong>{resp.membro?.nome}</strong>
                      <span>{resp.cargoTitulo}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.respEmpty}>
                  Nenhum responsável vinculado.
                </div>
              )}
            </div>

            {canEdit && (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => onEdit(item)}
                >
                  <PencilLine size={16} />
                  Editar
                </button>

                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => onDelete(item)}
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
