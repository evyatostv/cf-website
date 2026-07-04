import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Cloudflare Turnstile CAPTCHA for Supabase auth (bot protection).
// GRACEFUL: with no VITE_TURNSTILE_SITE_KEY set it renders nothing and yields an
// empty token, so auth keeps working before/without CAPTCHA being configured.
// Once the key is set AND CAPTCHA is enabled in Supabase, the token is required.
//
// Setup: create a Turnstile widget at Cloudflare → put the SITE key in
// .env.local as VITE_TURNSTILE_SITE_KEY, and the SECRET key in Supabase
// (Auth → Attack Protection → CAPTCHA → Turnstile).

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

declare global {
  interface Window { turnstile?: any }
}

let scriptPromise: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export type CaptchaHandle = { reset: () => void };

export const CAPTCHA_CONFIGURED = !!SITE_KEY;

export const Captcha = forwardRef<CaptchaHandle, { onVerify: (token: string) => void }>(
  function Captcha({ onVerify }, ref) {
    const el = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        try {
          if (window.turnstile && widgetId.current != null) {
            window.turnstile.reset(widgetId.current);
          }
        } catch {}
        onVerify('');
      },
    }));

    useEffect(() => {
      if (!SITE_KEY) return; // Not configured → no-op.
      let cancelled = false;
      loadTurnstile()
        .then(() => {
          if (cancelled || !el.current || !window.turnstile) return;
          widgetId.current = window.turnstile.render(el.current, {
            sitekey: SITE_KEY,
            callback: (token: string) => onVerify(token),
            'expired-callback': () => onVerify(''),
            'error-callback': () => onVerify(''),
          });
        })
        .catch(() => {});
      return () => {
        cancelled = true;
        try {
          if (window.turnstile && widgetId.current != null) window.turnstile.remove(widgetId.current);
        } catch {}
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!SITE_KEY) return null;
    return <div ref={el} className="my-4 flex justify-center" />;
  },
);
