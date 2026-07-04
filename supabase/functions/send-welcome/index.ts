/**
 * ClinicFlow · send-welcome — the app-triggered welcome email.
 *
 * WHY THIS EXISTS: GoTrue (Supabase Auth) has NO "welcome" email slot — it only
 * ships confirm-signup / magic-link / recovery / email-change. So the welcome
 * mail (registry id `welcome`) is triggered by the app, not by Auth.
 *
 * ── Trigger (two supported options) ─────────────────────────────────────────
 *  A) Client-side (recommended, simplest): right after the user's FIRST
 *     confirmed login (i.e. `user.email_confirmed_at` is set), the SPA calls:
 *
 *       await supabase.functions.invoke('send-welcome')   // sends the JWT
 *       // or:
 *       fetch(`${SUPABASE_URL}/functions/v1/send-welcome`, {
 *         method: 'POST',
 *         headers: { Authorization: `Bearer ${session.access_token}` },
 *       })
 *
 *     This function is idempotent (see dedupe below), so the client may call it
 *     on every login without risk of a second email.
 *
 *  B) Supabase Auth Hook: configure a "Send Email" / post-confirmation hook (or
 *     a database webhook on `auth.users` UPDATE where email_confirmed_at goes
 *     non-null) that POSTs to this function with a service-role/JWT auth header.
 *     Same dedupe applies. Option A is preferred because it needs no extra infra.
 *
 * ── Dedupe (send EXACTLY ONCE per user) ─────────────────────────────────────
 * We stamp `user_access.welcome_sent_at` (added in
 * migrations/20260702000000_welcome_sent.sql). On each call we read that column;
 * if it is already set we no-op. Otherwise we send, then set it. There is a
 * benign race if two calls land simultaneously before either stamps — mitigated
 * by a Resend idempotencyKey keyed on the user id, so at most one mail is sent.
 *
 * ── Contract ────────────────────────────────────────────────────────────────
 * Requires an authenticated user (verify_jwt = true in config.toml, plus we
 * re-check via supabase.auth.getUser() using the forwarded Authorization header,
 * exactly like create-payment-intent). Best-effort: never throws to the client;
 * always returns a clean JSON response.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendTemplate } from "../_shared/send-template.ts";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://cf-website-flame.vercel.app",
  "https://clinic-flow.co.il",
  "https://www.clinic-flow.co.il",
  Deno.env.get("SITE_URL"),
].filter(Boolean) as string[];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]!;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized" }, 401, corsHeaders);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || !user.email) {
    return json({ error: "Unauthorized" }, 401, corsHeaders);
  }

  try {
    // ── Dedupe: has this user already received the welcome mail? ─────────────
    const { data: access } = await supabase
      .from("user_access")
      .select("welcome_sent_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (access?.welcome_sent_at) {
      return json({ ok: true, sent: false, reason: "already_sent" }, 200, corsHeaders);
    }

    const name = String(
      user.user_metadata?.name ??
        user.user_metadata?.full_name ??
        user.email.split("@")[0],
    );

    await sendTemplate(
      "welcome",
      user.email,
      { name },
      { idempotencyKey: `welcome:${user.id}` },
    );

    // Stamp the marker so subsequent calls no-op. Only fill the timestamp when
    // it's still null to avoid clobbering an earlier stamp on a race.
    const { error: updateError } = await supabase
      .from("user_access")
      .update({ welcome_sent_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("welcome_sent_at", null);

    if (updateError) {
      // Mail was sent; failing to stamp only risks a possible duplicate later,
      // which the Resend idempotencyKey guards against. Log, don't fail.
      console.error("send-welcome: failed to stamp welcome_sent_at:", updateError);
    }

    return json({ ok: true, sent: true }, 200, corsHeaders);
  } catch (err) {
    // Best-effort: never throw to the client beyond a clean JSON response.
    console.error("send-welcome error (non-fatal):", err);
    return json({ ok: false, sent: false }, 200, corsHeaders);
  }
});
