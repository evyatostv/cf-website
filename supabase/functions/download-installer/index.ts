import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = Deno.env.get('INSTALLERS_BUCKET') || 'installers';
const SIGNED_URL_TTL = 300; // 5 minutes

const INSTALLER_PATHS: Record<string, string> = {
  win: 'ClinicFlow-Setup.exe',
  mac: 'ClinicFlow-Setup.dmg',
  linux: 'ClinicFlow-Setup.AppImage',
};

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
    const { os } = await req.json().catch(() => ({ os: 'win' }));
    const installerKey = INSTALLER_PATHS[os];
    if (!installerKey) {
      return new Response(
        JSON.stringify({ error: `Unsupported OS: "${os}"` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

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

    if (!access || !access.is_active) {
      return new Response(
        JSON.stringify({ error: 'No active license', code: 'NO_ACTIVE_LICENSE' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (access.plan === 'trial' && access.expires_at && new Date(access.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Trial expired', code: 'TRIAL_EXPIRED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Service-role client — needed to create signed URLs against a private bucket
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: signed, error: signError } = await adminClient
      .storage
      .from(BUCKET)
      .createSignedUrl(installerKey, SIGNED_URL_TTL);

    if (signError || !signed?.signedUrl) {
      console.error('createSignedUrl failed:', signError?.message);
      return new Response(
        JSON.stringify({ error: 'Failed to generate download link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Best-effort log — never block the download if logging fails
    adminClient
      .from('download_log')
      .insert({
        user_id: user.id,
        email: user.email,
        plan: access.plan,
        os,
        installer: installerKey,
      })
      .then(({ error }) => {
        if (error) console.warn('download_log insert failed:', error.message);
      });

    return new Response(
      JSON.stringify({
        downloadUrl: signed.signedUrl,
        expiresAt: new Date(Date.now() + SIGNED_URL_TTL * 1000).toISOString(),
        plan: access.plan,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('download-installer error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
