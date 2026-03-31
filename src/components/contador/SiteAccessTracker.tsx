//src/components/contador/SiteAccessTracker.tsx

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_ID_KEY = "site-access-visitor-id";
const LAST_TRACKED_AT_KEY = "site-access-last-tracked-at";
const SESSION_WINDOW_MS = 30 * 60 * 1000;

function generateId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function SiteAccessTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const now = Date.now();

    const lastTrackedAtRaw = localStorage.getItem(LAST_TRACKED_AT_KEY);
    const lastTrackedAt = lastTrackedAtRaw ? Number(lastTrackedAtRaw) : 0;

    if (lastTrackedAt && now - lastTrackedAt < SESSION_WINDOW_MS) {
      return;
    }

    let visitorId = localStorage.getItem(VISITOR_ID_KEY);

    if (!visitorId) {
      visitorId = generateId();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    fetch("/api/contador/acesso", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        path: pathname || window.location.pathname,
        referrer: document.referrer || null,
        visitorId,
      }),
    })
      .catch(() => null)
      .finally(() => {
        localStorage.setItem(LAST_TRACKED_AT_KEY, String(now));
      });
  }, [pathname]);

  return null;
}
