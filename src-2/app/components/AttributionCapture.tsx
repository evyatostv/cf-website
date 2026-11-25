import { useEffect } from "react";

const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
const STORAGE_KEY = "clinicflow-attribution";

export function readStoredAttribution(storageKey = STORAGE_KEY): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "string"))
      : {};
  } catch {
    return {};
  }
}

export function captureAttribution(params: URLSearchParams, storageKey = STORAGE_KEY) {
  const incoming = Object.fromEntries(KEYS.flatMap((key) => {
    const value = params.get(key);
    return value ? [[key, value]] : [];
  }));
  const current = readStoredAttribution(storageKey);
  if (!current.landing_path) incoming.landing_path = window.location.pathname;
  const next = { ...current, ...incoming };
  if (Object.keys(incoming).length) {
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Browsers can disable storage or exhaust its quota. This page can still use next.
    }
  }
  return next;
}

export function AttributionCapture() {
  useEffect(() => {
    captureAttribution(new URLSearchParams(window.location.search));
  }, []);

  return null;
}
