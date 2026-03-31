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

function getDisplayMode() {
  if (typeof window === "undefined") return "unknown";

  const nav = window.navigator as Navigator & { standalone?: boolean };

  if (window.matchMedia?.("(display-mode: standalone)")?.matches) {
    return "standalone";
  }

  if (window.matchMedia?.("(display-mode: fullscreen)")?.matches) {
    return "fullscreen";
  }

  if (window.matchMedia?.("(display-mode: minimal-ui)")?.matches) {
    return "minimal-ui";
  }

  if (window.matchMedia?.("(display-mode: browser)")?.matches) {
    return "browser";
  }

  if (nav.standalone === true) {
    return "ios-standalone";
  }

  return "unknown";
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

    const url = new URL(window.location.href);

    const utmSource = url.searchParams.get("utm_source");
    const utmMedium = url.searchParams.get("utm_medium");
    const utmCampaign = url.searchParams.get("utm_campaign");
    const utmContent = url.searchParams.get("utm_content");
    const utmTerm = url.searchParams.get("utm_term");

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
        displayMode: getDisplayMode(),
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
      }),
    })
      .catch(() => null)
      .finally(() => {
        localStorage.setItem(LAST_TRACKED_AT_KEY, String(now));
      });
  }, [pathname]);

  return null;
}
