"use client";

import ToastProvider from "@/components/ui/Toast/ToastProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
