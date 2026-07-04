/**
 * ClinicFlow · realistic mock props for all 21 templates.
 *
 * Each fixture is typed as the CANONICAL registry shape (`PropsFor<id>`) so it
 * doubles as a compile-time check that the registry contract is satisfiable,
 * and as the input the render-all test feeds through `sendTemplate`'s adapters.
 * Hebrew copy mirrors the authoring templates + DESIGN-SOURCE sample data.
 */
import type { EmailId, EmailPropMap } from "../email-registry.ts";

/** id → registry-shaped sample props for every template. */
export const FIXTURES: { [Id in EmailId]: EmailPropMap[Id] } = {
  // ── A · Account & authentication ──
  "confirm-email": {
    confirmationUrl: "https://clinic-flow.co.il/auth/confirm?token=eyJhbGci-demo",
  },
  "magic-link": {
    token: "429-8153",
    confirmationUrl: "https://clinic-flow.co.il/auth/magic?token=eyJhbGci-demo",
  },
  "reset-password": {
    confirmationUrl: "https://clinic-flow.co.il/auth/reset?token=eyJhbGci-demo",
  },
  "change-email": {
    confirmationUrl: "https://clinic-flow.co.il/auth/change?token=eyJhbGci-demo",
    newEmail: "sharon.clinic@gmail.com",
  },
  "welcome": {
    name: "ד״ר שרון לוי",
    downloadUrl: "https://clinic-flow.co.il/download",
  },

  // ── B · Purchase & licensing ──
  "order-confirmation": {
    name: "ד״ר שרון לוי",
    plan: "ClinicFlow Full",
    orderId: "CF-10428",
    amount: "₪1,196",
    vat: "₪215",
    total: "₪1,411",
    ordersUrl: "https://clinic-flow.co.il/account/orders",
  },
  "license-delivery": {
    name: "ד״ר שרון לוי",
    plan: "ClinicFlow Full",
    licenseKey: "CF-FULL-7Q2M-4K9X-A1D3",
    downloadUrl: "https://clinic-flow.co.il/download",
  },
  "upgrade-confirmation": {
    name: "ד״ר שרון לוי",
    fromPlan: "ClinicFlow Pro",
    toPlan: "ClinicFlow Full",
    credit: "−₪690",
    difference: "₪721",
    whatsNewUrl: "https://clinic-flow.co.il/whats-new",
  },
  "payment-failed": {
    name: "ד״ר שרון לוי",
    plan: "ClinicFlow Full",
    amount: "₪1,411",
    retryUrl: "https://clinic-flow.co.il/checkout/retry?session=cs_test_a1b2",
  },
  "refund-confirmation": {
    name: "ד״ר שרון לוי",
    plan: "ClinicFlow Full",
    refundId: "RF-20915",
    amount: "₪1,411",
  },
  "device-reactivation": {
    name: "ד״ר שרון לוי",
    deviceName: "MacBook Pro · שרון",
    date: "2 ביולי 2026, 14:32",
    licenseKey: "CF-FULL-••••-A1D3",
  },

  // ── C · Trial lifecycle ──
  "trial-started": {
    name: "ד״ר שרון לוי",
    daysTotal: 14,
    endDate: "16 ביולי 2026",
    downloadUrl: "https://clinic-flow.co.il/download",
  },
  "trial-ending": {
    name: "ד״ר שרון לוי",
    daysLeft: 3,
    endDate: "16 ביולי 2026",
    pricingUrl: "https://clinic-flow.co.il/pricing",
  },
  "trial-ended": {
    name: "ד״ר שרון לוי",
    pricingUrl: "https://clinic-flow.co.il/pricing",
  },
  "win-back": {
    name: "ד״ר שרון לוי",
    pricingUrl: "https://clinic-flow.co.il/pricing?ref=winback",
  },

  // ── D · Maintenance & renewal ──
  "renewal-upcoming": {
    name: "ד״ר שרון לוי",
    plan: "ClinicFlow Full",
    renewDate: "1 באוגוסט 2026",
    amount: "₪149",
    renewUrl: "https://clinic-flow.co.il/account/renew",
  },
  "renewal-confirmation": {
    name: "ד״ר שרון לוי",
    plan: "ClinicFlow Full",
    newPeriodEnd: "1 באוגוסט 2027",
    amount: "₪149",
  },
  "updates-lapsed": {
    name: "ד״ר שרון לוי",
    plan: "ClinicFlow Full",
    renewUrl: "https://clinic-flow.co.il/account/renew",
  },

  // ── E · Support & sales ──
  "contact-received": {
    name: "ד״ר שרון לוי",
    ticketId: "SUP-4471",
    messagePreview:
      "״שלום, אשמח לדעת אם אפשר לייבא רשומות מטופלים מתוכנה קיימת…״",
  },
  "sales-response": {
    name: "ד״ר שרון לוי",
    agentName: "יעל",
    ctaUrl: "https://clinic-flow.co.il/premium",
  },
  "policy-update": {
    effectiveDate: "1 באוגוסט 2026",
    termsUrl: "https://clinic-flow.co.il/terms",
    privacyUrl: "https://clinic-flow.co.il/privacy",
    name: "ד״ר שרון לוי",
  },
};

/** Convenience typed getter. */
export function fixtureFor<Id extends EmailId>(id: Id): EmailPropMap[Id] {
  return FIXTURES[id];
}
