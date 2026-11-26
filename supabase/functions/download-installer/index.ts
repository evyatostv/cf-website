import { createClient } from 'npm:@supabase/supabase-js@2';
import { recordAuditEvent } from '../_shared/audit.ts';

import { BUCKET, INSTALLER_PATHS } from '../_shared/installers.ts';

const SIGNED_URL_TTL = 300;

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://cf-website-flame.vercel.app',
  'https://clinic-flow.co.il',
  'https://www.clinic-flow.co.il',
  Deno.env.get('SITE_URL'),
].filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]!;
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // User-scoped client — verifies the JWT
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // BE-019: validate `os` explicitly. A malformed/empty body must be a 400,
    // not a silent default to Windows (which could hand a Mac/Linux user the
    // wrong installer). Parse defensively, then require a known OS key.
    let os: unknown;
    try {
      const parsed = await req.json();
      os = parsed?.os;
    } catch {
      os = undefined;
    }
    if (typeof os !== 'string' || !Object.prototype.hasOwnProperty.call(INSTALLER_PATHS, os)) {
      return new Response(
        JSON.stringify({ error: 'מערכת הפעלה לא נתמכת. בחר/י Windows, macOS או Linux.', code: 'UNSUPPORTED_OS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const installerKey = INSTALLER_PATHS[os];

    // Check the user has an active license
    const { data: access, error: accessError } = await userClient
      .from('user_access')
      .select('plan, is_active, expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (accessError) {
      console.error('user_access lookup failed:', accessError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to verify license' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!access || !access.is_active || (access.expires_at && Date.parse(access.expires_at) <= Date.now())) {
      const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await recordAuditEvent(adminClient, { eventType: 'download_attempt', outcome: 'blocked', userId: user.id, metadata: { reason: 'no_active_license', os } });
      return new Response(
        JSON.stringify({ error: 'No active license', code: 'NO_ACTIVE_LICENSE' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    if (!['forever', 'basic', 'professional', 'full', 'premium'].includes(access.plan)) {
      await recordAuditEvent(adminClient, {eventType: 'download_attempt', outcome: 'blocked', userId: user.id, metadata: {reason: 'paid_plan_required', os}});
      return new Response(JSON.stringify({ error: 'נדרש תשלום מאושר', code: 'PAYMENT_REQUIRED' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    const { data: hasPurchase, error: purchaseError } = await adminClient.rpc('has_verified_desktop_purchase', {
      p_customer_id: user.id, p_plan: access.plan,
    });
    if (purchaseError || hasPurchase !== true) {
      await recordAuditEvent(adminClient, {eventType: 'download_attempt', outcome: purchaseError ? 'failure' : 'blocked',
        userId: user.id, metadata: {reason: purchaseError ? 'purchase_lookup_failed' : 'purchase_required', os}});
      return new Response(JSON.stringify({ code: purchaseError ? 'PAYMENT_LOOKUP_FAILED' : 'PAYMENT_REQUIRED' }), {
        status: purchaseError ? 503 : 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: signed, error: signError } = await adminClient
      .storage
      .from(BUCKET)
      .createSignedUrl(installerKey, SIGNED_URL_TTL);

    if (signError || !signed?.signedUrl) {
      await recordAuditEvent(adminClient, {eventType: 'download_attempt', outcome: 'failure', userId: user.id,
        metadata: {reason: 'link_signing_failed', os}});
      return new Response(
        JSON.stringify({ error: 'Failed to generate download link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Both records describe issuing a link. The file transfer happens later in Storage.
    const logLink = async () => {
      try {
        const { error } = await adminClient.from('download_log').insert({
          user_id: user.id, email: user.email, plan: access.plan, os, installer: installerKey,
        });
        if (error) console.warn('Download link log unavailable');
      } catch {
        console.warn('Download link log unavailable');
      }
    };
    await Promise.all([
      logLink(),
      recordAuditEvent(adminClient, { eventType: 'download_attempt', outcome: 'success', userId: user.id, metadata: { os, installer: installerKey } }),
    ]);

    return new Response(
      JSON.stringify({
        downloadUrl: signed.signedUrl,
        expiresAt: new Date(Date.now() + SIGNED_URL_TTL * 1000).toISOString(),
        plan: access.plan,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    // BE-004: never leak internal error text to the client — log with a
    // correlation id, return a generic Hebrew message.
    const correlationId = crypto.randomUUID();
    console.error(`download-installer error [${correlationId}]:`, err);
    return new Response(
      JSON.stringify({
        error: 'אירעה שגיאה ביצירת קישור ההורדה. נסה/י שוב או פנה/י לתמיכה עם מזהה השגיאה.',
        correlationId,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
