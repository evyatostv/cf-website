// One database transaction per due request preserves the account if archival fails.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (req.method !== "POST") return Response.json({ error: "method" }, { status: 405 });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: due, error } = await admin.from("deletion_requests").select("id")
    .eq("status", "pending").lte("scheduled_for", new Date().toISOString()).order("scheduled_for");
  if (error) return Response.json({ error: "lookup_failed" }, { status: 503 });
  let completed = 0;
  let failed = 0;
  for (const { id } of due) {
    const { data: result, error: archiveError } = await admin.rpc("archive_due_account", { p_request_id: id });
    if (archiveError || result === "STORAGE_REVIEW") {
      console.error("account_archive_failed", { requestId: id, code: archiveError?.code || result });
      failed++;
    } else if (result === "COMPLETED") completed++;
  }
  return Response.json({ completed, failed }, { status: failed ? 503 : 200 });
});
