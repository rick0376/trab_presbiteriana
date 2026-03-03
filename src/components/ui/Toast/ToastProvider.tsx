"use client";

import { useCallback, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import { ToastContext, ToastItem, ToastType } from "./useToast";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getIcon(type: ToastType) {
  if (type === "success") return <CheckCircle2 size={18} />;
  if (type === "error") return <XCircle size={18} />;
  return <Info size={18} />;
}

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = uid();
      const duration = toast.duration ?? 3200;

      const newToast: ToastItem = {
        id,
        type: toast.type,
        title: toast.title,
        message: toast.message,
        duration,
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 5));

      window.setTimeout(() => {
        remove(id);
      }, duration);
    },
    [remove],
  );

  const api = useMemo(() => {
    return {
      push,
      success: (message: string, title?: string) =>
        push({ type: "success", title, message }),
      error: (message: string, title?: string) =>
        push({ type: "error", title, message, duration: 4500 }),
      info: (message: string, title?: string) =>
        push({ type: "info", title, message }),
    };
  }, [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div className={styles.wrap}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[`toast_${t.type}`]}`}
          >
            <div className={styles.icon}>{getIcon(t.type)}</div>

            <div className={styles.content}>
              {t.title && <div className={styles.title}>{t.title}</div>}
              <div className={styles.message}>{t.message}</div>
            </div>

            <button
              className={styles.close}
              onClick={() => remove(t.id)}
              type="button"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
