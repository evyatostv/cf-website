import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendEmail } from '../_shared/send-email.ts';

// Coming-soon waitlist signup: stores the email in `waitlist` (service role) and
// emails the owner on each NEW signup. Public (verify_jwt=false) — anyone on the
// /soon page can submit. Duplicates are a silent no-op (unique email + dedupe).

const NOTIFY_EMAIL =
  Deno.env.get('WAITLIST_NOTIFY_EMAIL') ||
  Deno.env.get('NOTIFY_EMAIL') ||
  'evyatar.druyan@gmail.com';

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
function isValidEmail(v: string): boolean {
  const s = (v || '').trim();
  if (s.length < 5 || s.length > 254) return false; // too short / RFC max length
  if (/\s/.test(s)) return false;                    // no spaces
  if (s.includes('..')) return false;                // no consecutive dots
  if (s.startsWith('.') || s.includes('.@')) return false; // no leading/pre-@ dot
  return EMAIL_RE.test(s);                            // @ + domain + real TLD (2+ letters)
}

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'https://clinic-flow.co.il',
  'https://www.clinic-flow.co.il',
  Deno.env.get('SITE_URL'),
].filter(Boolean);

function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]!;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function esc(v: unknown): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405, cors);

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? '').trim().toLowerCase();
    if (!isValidEmail(email)) return json({ error: 'invalid email' }, 400, cors);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await supabase.from('waitlist').insert({ email, source: 'soon' });
    if (error) {
      // 23505 = unique violation → already signed up. Success, but don't re-notify.
      if (error.code === '23505') return json({ ok: true, duplicate: true }, 200, cors);
      console.error('waitlist insert failed:', error.message);
      return json({ error: 'failed' }, 500, cors);
    }

    // New signup → notify the owner. Best-effort: never fail the signup on email.
    try {
      const when = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
      await sendEmail({
        to: NOTIFY_EMAIL,
        subject: '🎉 הרשמה חדשה לרשימת ההמתנה — ClinicFlow',
        html:
          `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;color:#1a2332">` +
          `<h2 style="margin:0 0 12px">הרשמה חדשה לרשימת ההמתנה 🎉</h2>` +
          `<p style="margin:4px 0"><b>אימייל:</b> ${esc(email)}</p>` +
          `<p style="margin:4px 0"><b>מתי:</b> ${esc(when)}</p>` +
          `<p style="margin:4px 0"><b>מקור:</b> דף ה-Coming Soon</p></div>`,
        text: `הרשמה חדשה לרשימת ההמתנה: ${email} (${when})`,
        replyTo: email, // reply goes straight to the signup
        tags: [{ name: 'type', value: 'waitlist-signup' }],
      });
    } catch (e) {
      console.error('waitlist notify email failed:', e);
    }

    return json({ ok: true }, 200, cors);
  } catch (e) {
    console.error('waitlist-signup error:', e);
    return json({ error: 'failed' }, 500, cors);
  }
});
