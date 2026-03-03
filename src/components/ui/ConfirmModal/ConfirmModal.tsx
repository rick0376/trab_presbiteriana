"use client";

import styles from "./styles.module.scss";

export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onCancel} type="button">
            Cancelar
          </button>
          <button className={styles.confirm} onClick={onConfirm} type="button">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
