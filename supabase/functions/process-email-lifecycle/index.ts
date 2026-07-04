// process-email-lifecycle — Phase-2 lifecycle-email cron (trial + renewal).
//
// ┌─ HONEST-SCAFFOLDING NOTICE ────────────────────────────────────────────────┐
// │ This is Phase-2 SCAFFOLDING. It stays a SAFE NO-OP until ALL of these are   │
// │ true — until then it sends nothing:                                        │
// │   (i)   the migration 20260702000002_lifecycle.sql is applied              │
// │         (adds user_access.trial_started_at + updates_period_ends), and      │
// │   (ii)  a trial-activation flow actually sets trial_started_at + expires_at │
// │         + plan='trial' on real rows, and                                    │
// │   (iii) a renewal-payment flow actually sets updates_period_ends, and       │
// │   (iv)  the env flag LIFECYCLE_EMAILS_ENABLED=true is set on the function.  │
// │ With no such rows and the flag OFF (default), every section matches 0 rows  │
// │ and/or is skipped, so nothing misfires. See EMAIL-PHASE2-PREREQUISITES.md.  │
// └────────────────────────────────────────────────────────────────────────────┘
//
// Invoked DAILY by a scheduled GitHub Action (mirror .github/workflows/
// process-deletions.yml — NOT yet created; see the prereqs doc). Protected by
// the shared CRON_SECRET header, exactly like process-deletions. Uses the
// SERVICE ROLE key (bypasses RLS) to read user_access and stamp the email_log.
//
// Sections (each INDEPENDENTLY guarded — one failing section never kills the
// others, and a missing column / disabled feature NO-OPs with a clear log):
//   • trial-ending     plan='trial' AND expires_at in [now+1d, now+3d]
//   • trial-ended      plan='trial' AND is_active AND expires_at <= now
//                      → set is_active=false, send trial-ended
//   • win-back         plan='trial' AND NOT is_active AND expires_at < now-30d
//   • renewal-upcoming updates_period_ends in [now+30d, now+31d]
//   • updates-lapsed   updates_period_ends < now AND is_active
//
// Dedupe: each send goes through sendOnce with a DATE-STAMPED synthetic key
// (`<template>:<userId|email>:<yyyy-mm-dd>`) written to email_log's
// UNIQUE(payment_id, template) — so a section can't re-send the same mail on a
// later daily run within the same window.
//
// Required function env (set via `supabase secrets set`):
//   LIFECYCLE_EMAILS_ENABLED   "true" to arm; anything else = whole fn no-ops
//   CRON_SECRET                (must match the GitHub Actions secret)
//   SUPABASE_URL               (auto-injected by Supabase)
//   SUPABASE_SERVICE_ROLE_KEY  (auto-injected by Supabase)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendOnce } from "../_shared/email-once.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";
const LIFECYCLE_ENABLED = Deno.env.get("LIFECYCLE_EMAILS_ENABLED") === "true";

// deno-lint-ignore no-explicit-any
type SupabaseAdmin = any;
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

const MS_DAY = 24 * 60 * 60 * 1000;
const iso = (d: Date) => d.toISOString();
/** yyyy-mm-dd (UTC) stamp so a synthetic dedupe key rotates by day/window. */
const dayStamp = (d: Date) => d.toISOString().slice(0, 10);

/** Human-formatted Hebrew-locale date for email props, e.g. "2 ביולי 2026". */
function fmtDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

/** Best-effort display name from an email address. */
function nameFor(row: Row): string {
  const email = String(row.email ?? "");
  return email.includes("@") ? email.split("@")[0] : (email || "לקוח/ה");
}

const PRICING_URL = "https://clinic-flow.co.il/pricing";
const RENEW_URL = "https://clinic-flow.co.il/pricing";

interface SectionResult {
  matched: number;
  sent: number;
  skipped: number;
  failed: number;
  noop?: string; // set when the section short-circuited (feature off / no column)
}
const emptySection = (): SectionResult => ({
  matched: 0,
  sent: 0,
  skipped: 0,
  failed: 0,
});

/**
 * Detect the Postgres "column does not exist" error (migration not applied yet)
 * so a section can NO-OP with a clear log rather than crash. PostgREST returns
 * SQLSTATE 42703 for undefined_column.
 */
function isMissingColumn(err: unknown): boolean {
  // deno-lint-ignore no-explicit-any
  const e = err as any;
  const code = e?.code ?? "";
  const msg = String(e?.message ?? e ?? "").toLowerCase();
  return code === "42703" ||
    msg.includes("does not exist") ||
    msg.includes("column");
}

/**
 * Run one section under its own try/catch. If the underlying query hit a
 * missing-column error (feature's DB half not migrated yet), record a NO-OP
 * instead of a failure. Any other throw is contained to this section.
 */
async function runSection(
  name: string,
  fn: () => Promise<SectionResult>,
): Promise<SectionResult> {
  try {
    return await fn();
  } catch (err) {
    if (isMissingColumn(err)) {
      console.log(
        `process-email-lifecycle: [${name}] NO-OP — required column missing ` +
          `(migration not applied yet).`,
      );
      return { ...emptySection(), noop: "missing-column" };
    }
    console.error(
      `process-email-lifecycle: [${name}] section error (contained):`,
      String((err as Error)?.message ?? err),
    );
    return { ...emptySection(), noop: "error" };
  }
}

Deno.serve(async (req) => {
  // Only the scheduled cron (holding the shared secret) may invoke this.
  const provided = req.headers.get("x-cron-secret") || "";
  if (!CRON_SECRET || provided !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Whole-function kill switch. Default OFF so this can't fire until the product
  // owner explicitly arms it (after the trial/renewal flows exist).
  if (!LIFECYCLE_ENABLED) {
    console.log(
      "process-email-lifecycle: LIFECYCLE_EMAILS_ENABLED != 'true' — no-op " +
        "(Phase-2 scaffolding disarmed).",
    );
    return new Response(
      JSON.stringify({ ok: true, enabled: false, reason: "disabled" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  const admin: SupabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const now = new Date();
  const nowIso = iso(now);
  const today = dayStamp(now);
  const summary: Record<string, SectionResult> = {};

  // ── 1 · trial-ending — plan='trial' AND expires_at in [now+1d, now+3d] ──────
  summary["trial-ending"] = await runSection("trial-ending", async () => {
    const res = emptySection();
    const lo = iso(new Date(now.getTime() + 1 * MS_DAY));
    const hi = iso(new Date(now.getTime() + 3 * MS_DAY));
    const { data, error } = await admin
      .from("user_access")
      .select("user_id, email, plan, expires_at")
      .eq("plan", "trial")
      .gte("expires_at", lo)
      .lte("expires_at", hi);
    if (error) throw error;

    for (const row of (data ?? []) as Row[]) {
      if (!row.email) continue;
      res.matched++;
      const daysLeft = Math.max(
        1,
        Math.ceil(
          (new Date(row.expires_at).getTime() - now.getTime()) / MS_DAY,
        ),
      );
      const key = `trial-ending:${row.user_id ?? row.email}:${today}`;
      const r = await sendOnce(admin, {
        paymentId: key,
        template: "trial-ending",
        to: row.email,
        props: {
          name: nameFor(row),
          daysLeft,
          endDate: fmtDate(row.expires_at),
          pricingUrl: PRICING_URL,
        },
      });
      if (r.skipped) res.skipped++;
      else if (r.sent) res.sent++;
      else res.failed++;
    }
    return res;
  });

  // ── 2 · trial-ended — plan='trial' AND is_active AND expires_at <= now ──────
  //     Also flips is_active=false (read-only mode) for each matched row.
  summary["trial-ended"] = await runSection("trial-ended", async () => {
    const res = emptySection();
    const { data, error } = await admin
      .from("user_access")
      .select("id, user_id, email, plan, expires_at, is_active")
      .eq("plan", "trial")
      .eq("is_active", true)
      .lte("expires_at", nowIso);
    if (error) throw error;

    for (const row of (data ?? []) as Row[]) {
      if (!row.email) continue;
      res.matched++;

      // Deactivate first (read-only mode). Guarded so a failed flip doesn't
      // block the mail; the next run retries the flip and dedupe skips the mail.
      // BE-010: update by primary-key `id` ONLY — updating by email would flip
      // is_active=false on EVERY row sharing that email (see BE-001 duplicate
      // rows), which could deactivate a paying user who reused the same address.
      const { error: upErr } = await admin
        .from("user_access")
        .update({ is_active: false })
        .eq("id", row.id);
      if (upErr) {
        console.error(
          "process-email-lifecycle: [trial-ended] deactivate failed for",
          row.user_id ?? row.email,
          upErr.message ?? upErr,
        );
      }

      const key = `trial-ended:${row.user_id ?? row.email}:${
        dayStamp(new Date(row.expires_at))
      }`;
      const r = await sendOnce(admin, {
        paymentId: key,
        template: "trial-ended",
        to: row.email,
        props: { name: nameFor(row), pricingUrl: PRICING_URL },
      });
      if (r.skipped) res.skipped++;
      else if (r.sent) res.sent++;
      else res.failed++;
    }
    return res;
  });

  // ── 3 · win-back — plan='trial' AND NOT is_active AND expires_at < now-30d ──
  summary["win-back"] = await runSection("win-back", async () => {
    const res = emptySection();
    const cutoff = iso(new Date(now.getTime() - 30 * MS_DAY));
    const { data, error } = await admin
      .from("user_access")
      .select("user_id, email, plan, expires_at, is_active")
      .eq("plan", "trial")
      .eq("is_active", false)
      .lt("expires_at", cutoff);
    if (error) throw error;

    for (const row of (data ?? []) as Row[]) {
      if (!row.email) continue;
      res.matched++;
      // Non-date-stamped key: win-back is a ONE-TIME send per lapsed trial, so a
      // stable key (no day suffix) means it can never repeat on later runs.
      const key = `win-back:${row.user_id ?? row.email}`;
      const r = await sendOnce(admin, {
        paymentId: key,
        template: "win-back",
        to: row.email,
        props: { name: nameFor(row), pricingUrl: PRICING_URL },
      });
      if (r.skipped) res.skipped++;
      else if (r.sent) res.sent++;
      else res.failed++;
    }
    return res;
  });

  // ── 4 · renewal-upcoming — updates_period_ends in [now+30d, now+31d] ────────
  summary["renewal-upcoming"] = await runSection("renewal-upcoming", async () => {
    const res = emptySection();
    const lo = iso(new Date(now.getTime() + 30 * MS_DAY));
    const hi = iso(new Date(now.getTime() + 31 * MS_DAY));
    const { data, error } = await admin
      .from("user_access")
      .select("user_id, email, plan, updates_period_ends")
      .gte("updates_period_ends", lo)
      .lte("updates_period_ends", hi);
    if (error) throw error;

    for (const row of (data ?? []) as Row[]) {
      if (!row.email) continue;
      res.matched++;
      const key = `renewal-upcoming:${row.user_id ?? row.email}:${
        dayStamp(new Date(row.updates_period_ends))
      }`;
      const r = await sendOnce(admin, {
        paymentId: key,
        template: "renewal-upcoming",
        to: row.email,
        props: {
          name: nameFor(row),
          plan: String(row.plan ?? ""),
          renewDate: fmtDate(row.updates_period_ends),
          // Amount is unknown here (no renewal-pricing source in this fn). Empty
          // string keeps the template render honest until a pricing source is
          // wired; the future renewal flow supplies the real figure at pay time.
          amount: "",
          renewUrl: RENEW_URL,
        },
      });
      if (r.skipped) res.skipped++;
      else if (r.sent) res.sent++;
      else res.failed++;
    }
    return res;
  });

  // ── 5 · updates-lapsed — updates_period_ends < now AND is_active ────────────
  summary["updates-lapsed"] = await runSection("updates-lapsed", async () => {
    const res = emptySection();
    const { data, error } = await admin
      .from("user_access")
      .select("user_id, email, plan, updates_period_ends, is_active")
      .lt("updates_period_ends", nowIso)
      .eq("is_active", true);
    if (error) throw error;

    for (const row of (data ?? []) as Row[]) {
      if (!row.email) continue;
      res.matched++;
      const key = `updates-lapsed:${row.user_id ?? row.email}:${
        dayStamp(new Date(row.updates_period_ends))
      }`;
      const r = await sendOnce(admin, {
        paymentId: key,
        template: "updates-lapsed",
        to: row.email,
        props: {
          name: nameFor(row),
          plan: String(row.plan ?? ""),
          renewUrl: RENEW_URL,
        },
      });
      if (r.skipped) res.skipped++;
      else if (r.sent) res.sent++;
      else res.failed++;
    }
    return res;
  });

  return new Response(
    JSON.stringify({ ok: true, enabled: true, ranAt: nowIso, sections: summary }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
