import { useEffect } from "react";

const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
const STORAGE_KEY = "clinicflow-attribution";

export function readStoredAttribution(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "string"))
      : {};
  } catch {
    return {};
  }
}

export function AttributionCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incoming = Object.fromEntries(KEYS.flatMap((key) => {
      const value = params.get(key);
      return value ? [[key, value]] : [];
    }));
    const current = readStoredAttribution();
    if (!current.landing_path) incoming.landing_path = window.location.pathname;
    if (Object.keys(incoming).length === 0) return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...incoming }));
  }, []);

  return null;
}
