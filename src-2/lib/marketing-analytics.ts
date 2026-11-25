import { hasMarketingConsent } from '@/lib/meta-pixel';

type Event = 'pricing_viewed' | 'contact_submitted';
type Source = 'contact_form' | 'premium_contact_form';
declare global { interface Window { gtag?: (...args: unknown[]) => void } }

// Analytics SDKs attach the page URL and referrer automatically. Only send
// from known public pages when both locations contain no query or fragment.
const hosts = new Set(['clinic-flow.co.il', 'www.clinic-flow.co.il']);
const pages = new Set(['/', '/pricing', '/contact', '/features', '/about', '/demo', '/start']);
function publicUrl(url: URL) {
  return url.protocol === 'https:' && hosts.has(url.host) && pages.has(url.pathname)
    && !url.search && !url.hash && !url.username && !url.password;
}

export function trackMarketingEvent(event: Event, source?: Source) {
  try {
    if (!hasMarketingConsent() || !publicUrl(new URL(window.location.href))) return;
    if (document.referrer && !publicUrl(new URL(document.referrer))) return;
    const params = source === 'contact_form' || source === 'premium_contact_form' ? { source } : {};
    try { window.gtag?.('event', event, params); } catch { /* optional SDK */ }
    try { window.fbq?.('trackSingleCustom', '1060618490333688', event, params); } catch { /* optional SDK */ }
  } catch { /* Measurement must never interrupt a user action. */ }
}
