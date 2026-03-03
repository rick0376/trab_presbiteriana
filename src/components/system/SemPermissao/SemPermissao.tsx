//src/components/systems/SemPermissao/SemPermissao.tsx

"use client";

import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";

export default function SemPermissao() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>🚫 Acesso Negado</h1>

        <p>Você não possui permissão para acessar esta área do sistema.</p>

        <button onClick={() => router.back()}>Voltar</button>
      </div>
    </div>
  );
}
