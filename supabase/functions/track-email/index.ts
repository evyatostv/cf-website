import { createClient } from 'npm:@supabase/supabase-js@2';

const GIF = Uint8Array.from([
  71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 255, 255, 255,
  0, 0, 0, 33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1,
  0, 0, 2, 2, 68, 1, 0, 59,
]);

const PIXEL_HEADERS = {
  'Content-Type': 'image/gif',
  'Content-Length': String(GIF.length),
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
  'X-Content-Type-Options': 'nosniff',
};

function isLikelyProxy(userAgent: string) {
  return /GoogleImageProxy|AppleWebKit.*Mail|YahooMailProxy|Outlook-iOS|Microsoft Office/i.test(userAgent);
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const event = url.searchParams.get('event') === 'click' ? 'click' : 'open';
  const destination = url.searchParams.get('url');

  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return new Response(GIF, { status: 200, headers: PIXEL_HEADERS });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: contact } = await admin
    .from('email_campaign_contacts')
    .select('id')
    .eq('tracking_token', token)
    .maybeSingle();

  if (contact) {
    const userAgent = req.headers.get('user-agent') || '';
    await admin.from('email_campaign_events').insert({
      contact_id: contact.id,
      event_type: event,
      is_proxy: event === 'open' && isLikelyProxy(userAgent),
      user_agent: userAgent.slice(0, 500),
      referrer: (req.headers.get('referer') || '').slice(0, 500),
      metadata: event === 'click' && destination ? { destination } : {},
    });
  }

  if (event === 'click' && destination) {
    try {
      const target = new URL(destination);
      if (target.protocol === 'https:' && /(^|\.)clinic-flow\.co\.il$/i.test(target.hostname)) {
        return Response.redirect(target.toString(), 302);
      }
    } catch {
      // Invalid destinations fall through to the safe homepage.
    }
    return Response.redirect('https://www.clinic-flow.co.il/', 302);
  }

  return new Response(GIF, { status: 200, headers: PIXEL_HEADERS });
});
