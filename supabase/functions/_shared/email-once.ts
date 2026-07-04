/**
 * ClinicFlow · sendOnce — transactional-email idempotency.
 *
 * Stripe and AllPay deliver webhooks AT LEAST once, so the same
 * payment_intent.succeeded / status===1 event may arrive several times. Every
 * receipt / license / upgrade / refund send therefore goes through sendOnce,
 * which uses the `email_log` UNIQUE(payment_id, template) constraint as a hard
 * dedupe: if a row already exists for (paymentId, template) we SKIP; otherwise
 * we send (also passing an Idempotency-Key to Resend as a second line of
 * defense) and record the send.
 *
 * This function never throws for a mail/DB failure — callers treat email as
 * best-effort and must not change the webhook's HTTP response over it. It only
 * surfaces failures via the returned shape + console.error.
 */
import { sendTemplate } from "./send-template.ts";
import type { EmailId, PropsFor } from "./email-registry.ts";

// deno-lint-ignore no-explicit-any
type SupabaseAdmin = any;

export interface SendOnceArgs<T extends EmailId> {
  paymentId: string;
  template: T;
  to: string;
  props: PropsFor<T>;
}

export interface SendOnceResult {
  /** True when a prior email_log row meant we did not re-send. */
  skipped: boolean;
  /** True when a send was attempted and succeeded. */
  sent?: boolean;
  /** Resend message id, when a send happened. */
  id?: string;
  /** Populated when the send/log failed (best-effort — not thrown). */
  error?: string;
}

/**
 * Send a template exactly once per (paymentId, template). Idempotent across
 * webhook retries. Best-effort: returns a result object; never throws.
 */
export async function sendOnce<T extends EmailId>(
  supabaseAdmin: SupabaseAdmin,
  { paymentId, template, to, props }: SendOnceArgs<T>,
): Promise<SendOnceResult> {
  try {
    // 1 · Already sent for this payment+template? Skip.
    const { data: existing } = await supabaseAdmin
      .from("email_log")
      .select("id")
      .eq("payment_id", paymentId)
      .eq("template", template)
      .maybeSingle();

    if (existing) {
      return { skipped: true };
    }

    // 2 · Send (Resend idempotency key is a belt-and-suspenders dedupe).
    const res = await sendTemplate(template, to, props, {
      idempotencyKey: `${paymentId}:${template}`,
    });

    // 3 · Record the send. A UNIQUE-violation here means a concurrent delivery
    //     already logged it — harmless; Resend's key prevented a double send.
    const { error: logError } = await supabaseAdmin.from("email_log").insert({
      payment_id: paymentId,
      template,
      recipient: to,
    });
    if (logError) {
      console.error(
        `sendOnce: sent ${template} for ${paymentId} but failed to log:`,
        logError.message ?? logError,
      );
    }

    return { skipped: false, sent: true, id: res.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`sendOnce: ${template} for ${paymentId} failed:`, msg);
    return { skipped: false, sent: false, error: msg };
  }
}
