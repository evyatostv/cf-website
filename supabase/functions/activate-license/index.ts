// activate-license — device-reactivation endpoint (STUB / reference impl).
//
// ┌─ WHAT THIS IS ─────────────────────────────────────────────────────────────┐
// │ The eventual server endpoint the ClinicFlow DESKTOP APP will call when a    │
// │ user moves their license to a NEW machine. On a successful re-activation it │
// │ sends the `device-reactivation` security-confirmation email.               │
// │                                                                            │
// │ The email-send below is the clearly-marked REFERENCE IMPLEMENTATION: given  │
// │ an authenticated owner + a device name, it renders + sends the mail with    │
// │ {deviceName, date, maskedKey}. That part is real and correct.              │
// └────────────────────────────────────────────────────────────────────────────┘
//
// ┌─ PREREQUISITE / NOT BUILT ─────────────────────────────────────────────────┐
// │ The DESKTOP-APP side of this flow does NOT exist yet and is required before │
// │ this can be trusted as a real activation gate:                             │
// │   • device fingerprint generation + transmission from the Electron app,     │
// │   • an activation-slot table (e.g. license_activations: license_key,        │
// │     device_fingerprint, device_name, activated_at, released_at) that        │
// │     enforces the per-license device limit and records the move,            │
// │   • the actual "release old device / claim new device" state transition.    │
// │ Until those exist, this endpoint only (a) authenticates the caller,         │
// │ (b) confirms they OWN the license on user_access, and (c) sends the         │
// │ confirmation email. It performs NO real slot bookkeeping. See               │
// │ EMAIL-PHASE2-PREREQUISITES.md.                                             │
// └────────────────────────────────────────────────────────────────────────────┘
//
// Auth: verify_jwt = true in config.toml, AND we re-check via
// supabase.auth.getUser() on the forwarded Authorization header (same pattern
// as send-welcome / create-payment-intent). Ownership is enforced by matching
// the license against the CALLER's own user_access row — a user can only
// re-activate their own key.
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

/**
 * Mask a license key for the confirmation email, e.g.
 *   CF-FULL-7Q2M-4K9X-A1D3  →  CF-FULL-••••-••••-A1D3
 * Keeps the CF- prefix + plan + last group so the user recognizes the key
 * without the full secret travelling through email.
 */
function maskLicenseKey(key: string): string {
  const parts = key.split("-");
  if (parts.length < 4) return "CF-••••";
  const head = parts.slice(0, 2).join("-"); // "CF-FULL"
  const last = parts[parts.length - 1]; // "A1D3"
  const middle = parts.slice(2, -1).map(() => "••••").join("-");
  return `${head}-${middle}-${last}`;
}

/** Human-formatted Hebrew-locale date+time for the email, e.g. "2 ביולי 2026, 14:32". */
function fmtDateTime(d: Date): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, corsHeaders);
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

  // Request body: the key the desktop app is activating + a human device name.
  // (A future version also receives a device fingerprint — see header note.)
  let body: { licenseKey?: string; deviceName?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, corsHeaders);
  }
  const licenseKey = String(body.licenseKey ?? "").trim();
  const deviceName = String(body.deviceName ?? "").trim() || "מכשיר חדש";
  if (!licenseKey) {
    return json({ error: "licenseKey is required" }, 400, corsHeaders);
  }

  try {
    // ── Ownership check: the caller must own this license on THEIR row. ───────
    // (This anon client carries the caller's JWT, so RLS would already scope
    // reads to their row; the explicit user_id filter makes the intent clear.)
    const { data: access, error: readErr } = await supabase
      .from("user_access")
      .select("user_id, email, plan, license_key")
      .eq("user_id", user.id)
      .maybeSingle();
    if (readErr) {
      console.error("activate-license: read failed:", readErr.message ?? readErr);
      return json({ error: "Lookup failed" }, 500, corsHeaders);
    }
    if (!access || access.license_key !== licenseKey) {
      // Either no license on this account, or the key doesn't match the caller.
      return json({ error: "License not found for this account" }, 403, corsHeaders);
    }

    // ── NOT BUILT (prerequisite): real activation-slot bookkeeping goes here ──
    // e.g. verify device fingerprint, release the old slot, claim the new one,
    // enforce the per-license device limit. This stub performs NONE of that.

    // ── REFERENCE IMPLEMENTATION: send the security-confirmation email. ───────
    const name = String(
      user.user_metadata?.name ??
        user.user_metadata?.full_name ??
        (user.email.includes("@") ? user.email.split("@")[0] : user.email),
    );
    await sendTemplate(
      "device-reactivation",
      user.email,
      {
        name,
        deviceName,
        date: fmtDateTime(new Date()),
        licenseKey: maskLicenseKey(licenseKey),
      },
      // Idempotency key includes the day so an accidental double-submit on the
      // same day sends once; a genuine future re-activation still notifies.
      { idempotencyKey: `device-reactivation:${user.id}:${new Date().toISOString().slice(0, 10)}` },
    );

    return json(
      { ok: true, activated: true, note: "reference-impl: email sent; slot bookkeeping not built" },
      200,
      corsHeaders,
    );
  } catch (err) {
    console.error("activate-license error:", err);
    return json({ ok: false }, 500, corsHeaders);
  }
});
