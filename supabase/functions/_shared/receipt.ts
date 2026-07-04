/**
 * ClinicFlow · receipt / money helpers (pure, unit-tested).
 *
 * All webhook money arrives in agorot (1 ₪ = 100 agorot). These helpers turn a
 * charged agorot total into the pre-formatted, VAT-broken-down strings the
 * order-confirmation / upgrade-confirmation / payment-failed / refund templates
 * expect (the registry stores amounts as already-formatted strings like
 * "₪1,411").
 *
 * VAT: Israeli VAT is 18% and the charged total is VAT-INCLUSIVE, so we work
 * BACKWARDS from the total:
 *   total  = charged
 *   preVat = round(total / 1.18)
 *   vat    = total - preVat
 */

export const VAT_RATE = 0.18;

/** Plan slug → English display label used in receipts/emails. */
const PLAN_LABELS: Record<string, string> = {
  basic: "ClinicFlow Basic",
  professional: "ClinicFlow Professional",
  full: "ClinicFlow Full",
};

/** Map a plan slug to its display label; unknown slugs fall back gracefully. */
export function planLabel(plan: string): string {
  if (PLAN_LABELS[plan]) return PLAN_LABELS[plan];
  const cleaned = (plan || "").trim();
  if (!cleaned) return "ClinicFlow";
  return `ClinicFlow ${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
}

/** agorot → whole shekels (rounded). */
export function agorotToShekels(agorot: number): number {
  return Math.round((agorot || 0) / 100);
}

/** Format a whole-shekel amount as "₪1,411" (thousands separators, ₪ sign). */
export function formatShekels(shekels: number): string {
  const rounded = Math.round(shekels || 0);
  const sign = rounded < 0 ? "−" : "";
  const abs = Math.abs(rounded);
  return `${sign}₪${abs.toLocaleString("en-US")}`;
}

/** Format an agorot amount directly as "₪1,411". */
export function formatAgorot(agorot: number): string {
  return formatShekels(agorotToShekels(agorot));
}

export interface VatBreakdown {
  /** Pre-VAT amount, formatted (e.g. "₪1,196"). */
  amount: string;
  /** VAT portion, formatted (e.g. "₪215"). */
  vat: string;
  /** VAT-inclusive total, formatted (e.g. "₪1,411"). */
  total: string;
}

/**
 * Compute the VAT breakdown from a VAT-INCLUSIVE agorot total.
 * Works in shekels to match the whole-shekel receipt figures.
 */
export function vatBreakdown(chargedAgorot: number): VatBreakdown {
  const total = agorotToShekels(chargedAgorot);
  const preVat = Math.round(total / (1 + VAT_RATE));
  const vat = total - preVat;
  return {
    amount: formatShekels(preVat),
    vat: formatShekels(vat),
    total: formatShekels(total),
  };
}
