/**
 * ClinicFlow · sendTemplate — the render seam.
 *
 * ONE call sends any of the 21 React Email templates: look up the registry
 * definition (subject / from / unsubscribe), render the matching authoring
 * component in `../../../emails/<id>.tsx` to HTML + plaintext, and hand it to
 * Resend via `sendEmail`. This is the single choke-point the wiring functions
 * (Stripe webhooks, Supabase Auth hooks, contact form, lifecycle cron) call.
 *
 *   import { sendTemplate } from "../_shared/send-template.ts";
 *   await sendTemplate("license-delivery", user.email, {
 *     name, plan, licenseKey, downloadUrl,
 *   }, { idempotencyKey: `license:${orderId}` });
 *
 * Type safety: `sendTemplate<T>(id, to, props: PropsFor<T>)` forces the caller
 * to supply exactly the props the registry declares for that id.
 *
 * ── Single source of truth ──────────────────────────────────────────────────
 * The templates are imported DIRECTLY from cf-website/emails/*.tsx (the same
 * files the `npm run email:dev` preview server and Resend authoring use). They
 * are NOT duplicated into _shared/. Deno resolves their extensionless imports
 * (./_layout, ./theme, ./components/ui) via sloppy-imports and shares the
 * repo-root React 18 install — see ../deno.json for the full rationale.
 *
 * ── Registry ⇄ component prop drift ─────────────────────────────────────────
 * A handful of authoring components name a prop differently from the canonical
 * registry `EmailPropMap` (e.g. registry `pricingUrl` vs component `upgradeUrl`
 * on trial-ending). The registry is the contract the wiring code codes against,
 * so each COMPONENTS entry carries an optional `adapt(props)` that maps the
 * registry-shaped props onto the component's actual prop names. Templates are
 * left untouched; the mapping lives here in one place.
 */
import * as React from "react";
import { render } from "./render.ts";
import {
  DEFAULT_REPLY_TO,
  sendEmail,
  type SendEmailResult,
} from "./send-email.ts";
import {
  EMAILS,
  type EmailId,
  type PropsFor,
} from "./email-registry.ts";
import { brand } from "../../../emails/theme.ts";

// ── The 21 authoring templates (single source of truth) ─────────────────────
import { ConfirmEmail } from "../../../emails/confirm-email.tsx";
import { MagicLink } from "../../../emails/magic-link.tsx";
import { ResetPassword } from "../../../emails/reset-password.tsx";
import { ChangeEmail } from "../../../emails/change-email.tsx";
import { Welcome } from "../../../emails/welcome.tsx";
import { OrderConfirmation } from "../../../emails/order-confirmation.tsx";
import { LicenseDelivery } from "../../../emails/license-delivery.tsx";
import { UpgradeConfirmation } from "../../../emails/upgrade-confirmation.tsx";
import { PaymentFailed } from "../../../emails/payment-failed.tsx";
import { RefundConfirmation } from "../../../emails/refund-confirmation.tsx";
import { DeviceReactivation } from "../../../emails/device-reactivation.tsx";
import { TrialStarted } from "../../../emails/trial-started.tsx";
import { TrialEnding } from "../../../emails/trial-ending.tsx";
import { TrialEnded } from "../../../emails/trial-ended.tsx";
import { WinBack } from "../../../emails/win-back.tsx";
import { RenewalUpcoming } from "../../../emails/renewal-upcoming.tsx";
import { RenewalConfirmation } from "../../../emails/renewal-confirmation.tsx";
import { UpdatesLapsed } from "../../../emails/updates-lapsed.tsx";
import { ContactReceived } from "../../../emails/contact-received.tsx";
import { SalesResponse } from "../../../emails/sales-response.tsx";
import { PolicyUpdate } from "../../../emails/policy-update.tsx";

/**
 * A registered template: its React component plus an optional adapter that maps
 * the canonical registry props (`PropsFor<Id>`) onto the component's props.
 * When `adapt` is omitted the registry props are passed through verbatim.
 */
// deno-lint-ignore no-explicit-any
type Comp = (props: any) => React.ReactElement;
interface Registered<Id extends EmailId> {
  component: Comp;
  // deno-lint-ignore no-explicit-any
  adapt?: (props: PropsFor<Id>) => Record<string, any>;
}

/**
 * id → { component, adapt? }. The ONE place mapping template id to component.
 * Adapters exist only where the authoring component's prop name diverges from
 * the registry contract; everything else passes props straight through.
 */
const COMPONENTS: { [Id in EmailId]: Registered<Id> } = {
  // ── A · Auth ──
  "confirm-email": { component: ConfirmEmail },
  "magic-link": { component: MagicLink },
  "reset-password": { component: ResetPassword },
  "change-email": { component: ChangeEmail },
  "welcome": { component: Welcome },

  // ── B · Purchase & licensing ──
  "order-confirmation": {
    component: OrderConfirmation,
    // registry `ordersUrl` → component `invoiceUrl`
    adapt: (p) => ({ ...p, invoiceUrl: p.ordersUrl }),
  },
  "license-delivery": { component: LicenseDelivery },
  "upgrade-confirmation": {
    component: UpgradeConfirmation,
    // registry has `whatsNewUrl`; the component hardcodes its CTA, so we only
    // forward the shared fields (extra registry keys are harmless).
    adapt: (p) => ({ ...p }),
  },
  "payment-failed": { component: PaymentFailed },
  "refund-confirmation": { component: RefundConfirmation },
  "device-reactivation": { component: DeviceReactivation },

  // ── C · Trial lifecycle ──
  "trial-started": { component: TrialStarted },
  "trial-ending": {
    component: TrialEnding,
    // registry `pricingUrl` → component `upgradeUrl`
    adapt: (p) => ({ ...p, upgradeUrl: p.pricingUrl }),
  },
  "trial-ended": {
    component: TrialEnded,
    // registry `pricingUrl` → component `buyUrl`
    adapt: (p) => ({ ...p, buyUrl: p.pricingUrl }),
  },
  "win-back": {
    component: WinBack,
    // registry `pricingUrl` → component `resumeUrl`
    adapt: (p) => ({ ...p, resumeUrl: p.pricingUrl }),
  },

  // ── D · Maintenance & renewal ──
  "renewal-upcoming": { component: RenewalUpcoming },
  "renewal-confirmation": { component: RenewalConfirmation },
  "updates-lapsed": { component: UpdatesLapsed },

  // ── E · Support & sales ──
  "contact-received": { component: ContactReceived },
  "sales-response": { component: SalesResponse },
  "policy-update": { component: PolicyUpdate },
};

/** Options for a single send. */
export interface SendTemplateOptions {
  /** Override sender (defaults to the registry `from`). */
  from?: string;
  /** Override reply-to (defaults to DEFAULT_REPLY_TO). */
  replyTo?: string;
  /**
   * Idempotency key forwarded to Resend — dedupes webhook retries. Highly
   * recommended for anything Stripe/Supabase can deliver more than once,
   * e.g. `order:${orderId}` / `license:${orderId}`.
   */
  idempotencyKey?: string;
  /** Hosted unsubscribe URL used for lifecycle mail (defaults to /unsubscribe). */
  unsubscribeUrl?: string;
  /** Extra Resend tags, merged with the automatic `template` tag. */
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Render + send one of the 21 templates.
 *
 * @param id     Registry template id (drives subject / from / unsubscribe).
 * @param to     Recipient email address (or addresses).
 * @param props  Registry-typed props for the template (`PropsFor<id>`).
 * @param opts   Optional overrides (idempotencyKey, from, replyTo, tags…).
 * @returns      `{ id }` — the Resend message id.
 */
export async function sendTemplate<T extends EmailId>(
  id: T,
  to: string | string[],
  props: PropsFor<T>,
  opts: SendTemplateOptions = {},
): Promise<SendEmailResult> {
  const def = EMAILS[id];
  if (!def) throw new Error(`sendTemplate: unknown template id "${id}"`);

  const registered = COMPONENTS[id];
  if (!registered) {
    throw new Error(`sendTemplate: no component registered for "${id}"`);
  }

  const componentProps = registered.adapt
    ? registered.adapt(props)
    : (props as Record<string, unknown>);

  const element = React.createElement(registered.component, componentProps);

  // Render HTML (email-client safe) and a plaintext fallback from the same tree.
  const [html, text] = await Promise.all([
    render(element, { pretty: false }),
    render(element, { plainText: true }),
  ]);

  const unsubscribeUrl = opts.unsubscribeUrl ?? `${brand.siteUrl}/unsubscribe`;

  return await sendEmail({
    to,
    subject: def.subject,
    html,
    text,
    from: opts.from ?? def.from,
    replyTo: opts.replyTo ?? DEFAULT_REPLY_TO,
    idempotencyKey: opts.idempotencyKey,
    // §4 legal: only lifecycle/marketing templates carry an unsubscribe.
    listUnsubscribe: def.unsubscribe ? `<${unsubscribeUrl}>` : undefined,
    tags: [
      { name: "template", value: id },
      ...(opts.tags ?? []),
    ],
  });
}

/** The registered template ids (for tests / introspection). */
export const REGISTERED_TEMPLATE_IDS = Object.keys(COMPONENTS) as EmailId[];

/** Internal accessor the render-all test uses to render without sending. */
export function __renderForTest<T extends EmailId>(
  id: T,
  props: PropsFor<T>,
  options?: { plainText?: boolean },
): Promise<string> {
  const registered = COMPONENTS[id];
  const componentProps = registered.adapt
    ? registered.adapt(props)
    : (props as Record<string, unknown>);
  return render(React.createElement(registered.component, componentProps), {
    pretty: false,
    plainText: options?.plainText ?? false,
  });
}
