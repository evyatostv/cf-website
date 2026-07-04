/**
 * ClinicFlow · send-renewal-confirmation — TRANSACTIONAL renewal receipt.
 *
 * ┌─ WHY THIS IS A HELPER, NOT WIRED ANYWHERE YET ────────────────────────────┐
 * │ `renewal-confirmation` fires when a renewal (an updates/Amendment-13 patch │
 * │ period) is PAID — it is transactional, like the order/license/refund       │
 * │ receipts, NOT a cron nudge. There is NO renewal-payment flow in this repo  │
 * │ today (the payment webhooks handle first purchase + upgrade only), so this │
 * │ helper is intentionally NOT imported by any webhook. It exports the exact  │
 * │ call the FUTURE renewal-payment flow will make once it exists.             │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * Prerequisite to go live (see EMAIL-PHASE2-PREREQUISITES.md):
 *   1. A renewal-payment flow (Stripe/AllPay line item for "updates renewal")
 *      that, on success, extends user_access.updates_period_ends, and
 *   2. that flow calls this helper with the paymentId of the renewal charge.
 *
 * Idempotency: reuses sendOnce over email_log's UNIQUE(payment_id, template),
 * keyed on the REAL renewal paymentId (a renewal charge id) — so a webhook
 * retry never re-sends the receipt. This mirrors how the other receipts dedupe.
 */
import { sendOnce, type SendOnceResult } from "./email-once.ts";
import type { PropsFor } from "./email-registry.ts";

// deno-lint-ignore no-explicit-any
type SupabaseAdmin = any;

export interface RenewalConfirmationArgs {
  /** Supabase service-role client (bypasses RLS to write email_log). */
  admin: SupabaseAdmin;
  /** The renewal CHARGE id (Stripe payment_intent / AllPay tx). Real, not synthetic. */
  paymentId: string;
  /** Recipient email. */
  to: string;
  /** Exact registry props for `renewal-confirmation`. */
  props: PropsFor<"renewal-confirmation">; // { name, plan, newPeriodEnd, amount }
}

/**
 * Send the renewal-confirmation receipt exactly once per renewal payment.
 * Best-effort (never throws — returns a result object), matching sendOnce.
 *
 * Example (for the FUTURE renewal-payment webhook):
 *   await sendRenewalConfirmation({
 *     admin,
 *     paymentId: charge.id,
 *     to: user.email,
 *     props: { name, plan, newPeriodEnd: fmt(newEnd), amount: "₪690" },
 *   });
 */
export function sendRenewalConfirmation(
  { admin, paymentId, to, props }: RenewalConfirmationArgs,
): Promise<SendOnceResult> {
  return sendOnce(admin, {
    paymentId,
    template: "renewal-confirmation",
    to,
    props,
  });
}
