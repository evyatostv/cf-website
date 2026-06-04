// process-deletions — performs account data erasure for due requests.
//
// Invoked DAILY by a scheduled GitHub Action (see .github/workflows/
// process-deletions.yml). Protected by a shared secret (CRON_SECRET) so only
// the cron can run it. Uses the SERVICE ROLE key (bypasses RLS) to delete data
// and the auth user.
//
// Scope (matches product decision "delete personal data, keep purchase records"):
//   DELETE     : user_access, contact_messages, the auth login
//   ANONYMIZE  : purchases, download_log, policy_acceptances (kept for
//                accounting / legal proof-of-consent, with PII stripped)
//
// Required function env (set via `supabase secrets set`):
//   CRON_SECRET                (must match the GitHub Actions secret)
//   SUPABASE_URL               (auto-injected by Supabase)
//   SUPABASE_SERVICE_ROLE_KEY  (auto-injected by Supabase)
//
// NOTE: column assumptions (user_id / email on purchases, download_log,
// policy_acceptances) are documented inline — verify against your schema.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";
const REDACTED = "deleted@redacted.invalid";

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // Only the scheduled cron (holding the shared secret) may invoke this.
  const provided = req.headers.get("x-cron-secret") || "";
  if (!CRON_SECRET || provided !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  const { data: due, error } = await admin
    .from("deletion_requests")
    .select("id, user_id, user_email, requested_at")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results: Array<Record<string, unknown>> = [];
  for (const r of due || []) {
    const uid = r.user_id as string;
    const email = r.user_email as string;
    try {
      // 1) Delete personal / account data.
      await admin.from("user_access").delete().eq("user_id", uid);
      await admin.from("contact_messages").delete().eq("email", email);

      // 2) Anonymize records we must retain (accounting / consent / logs).
      //    Done BEFORE deleting the auth user to avoid FK violations.
      await admin.from("purchases").update({ user_id: null, email: REDACTED }).eq("user_id", uid);
      await admin.from("download_log").update({ user_id: null, email: REDACTED }).eq("user_id", uid);
      await admin.from("policy_acceptances").update({ user_email: REDACTED }).eq("user_id", uid);

      // 3) Append to the immutable audit log (one-way hash only).
      await admin.from("deletion_log").insert({
        user_email_hash: await sha256Hex(email),
        requested_at: r.requested_at,
        completed_at: new Date().toISOString(),
      });

      // 4) Mark complete, then delete the auth login. Deleting the user cascades
      //    the deletion_requests row and SET NULLs policy_acceptances.user_id.
      await admin.from("deletion_requests").update({
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", r.id);
      const { error: delErr } = await admin.auth.admin.deleteUser(uid);
      if (delErr) throw delErr;

      results.push({ id: r.id, ok: true });
    } catch (e) {
      results.push({ id: r.id, ok: false, error: String((e as Error)?.message || e) });
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
