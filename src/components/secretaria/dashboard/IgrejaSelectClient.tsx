"use client";

import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";

type Igreja = { id: string; nome: string; slug: string };

export default function IgrejaSelectClient({
  igrejas,
  igrejaId,
}: {
  igrejas: Igreja[];
  igrejaId: string;
}) {
  const router = useRouter();

  return (
    <select
      className={styles.selectIgreja}
      value={igrejaId}
      onChange={(e) => {
        const id = e.target.value;
        router.replace(`/secretaria?igrejaId=${id}`);
      }}
    >
      {igrejas.map((i) => (
        <option key={i.id} value={i.id}>
          {i.nome} ({i.slug})
        </option>
      ))}
    </select>
  );
}
