//src/components/system/VisitorCount.tsx

"use client";

import { useEffect, useState } from "react";

export default function VisitorCount() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/site-counter", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setTotal(data.total ?? 0))
      .catch(() => setTotal(0));
  }, []);

  return <span>{total === null ? "..." : `${total} acessos`}</span>;
}
