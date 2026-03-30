// src/components/system/SiteAccessTracker.tsx

"use client";

import { useEffect } from "react";

export default function SiteAccessTracker() {
  useEffect(() => {
    const sessionKey = "site-access-counted";

    if (sessionStorage.getItem(sessionKey)) return;

    fetch("/api/site-counter", {
      method: "POST",
      cache: "no-store",
    })
      .catch(() => null)
      .finally(() => {
        sessionStorage.setItem(sessionKey, "1");
      });
  }, []);

  return null;
}
