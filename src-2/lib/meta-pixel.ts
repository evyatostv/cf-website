// Public marketing measurement only. Never initialize on account/payment pages.
export const META_PIXEL_ID = '1060618490333688';
export const MARKETING_CONSENT_KEY = 'clinicflow_marketing_consent_v1';
export const COOKIE_SETTINGS_EVENT = 'clinicflow:cookie-settings';
const PUBLIC_PATHS = new Set(['/', '/features', '/pricing', '/about',
  '/clinic-software-for-private-doctors', '/clinic-software-no-subscription',
  '/clinic-management-software']);
type Pixel = ((...args: unknown[]) => void) & {
  queue: unknown[][]; loaded: boolean; version: string; push?: Pixel;
  callMethod?: (...args: unknown[]) => void;
};
declare global { interface Window { fbq?: Pixel; _fbq?: Pixel } }
let initialized = false;
let loading = false;
let scriptReady = false;
let lastPath: string | null = null;

export function hasMarketingConsent() {
  try { return localStorage.getItem(MARKETING_CONSENT_KEY) === 'accepted'; }
  catch { return false; }
}

export function hasSafeCampaignUrl(search: string, hash: string) {
  if (hash && !['#product-video', '#pricing', '#lead-form'].includes(hash)) return false;
  const permitted = new Set(['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id']);
  return [...new URLSearchParams(search)].every(([key, value]) =>
    permitted.has(key) && /^[a-zA-Z0-9_.~-]{1,500}$/.test(value));
}

export function syncMetaPixel() {
  if (typeof window === 'undefined') return;
  // Permit standard campaign IDs, but never arbitrary query fields or fragments.
  const allowed = hasMarketingConsent() && PUBLIC_PATHS.has(location.pathname)
    && hasSafeCampaignUrl(location.search, location.hash)
    && ['clinic-flow.co.il', 'www.clinic-flow.co.il'].includes(location.hostname);
  if (!allowed) {
    if (initialized) window.fbq?.('consent', 'revoke');
    lastPath = null;
    return;
  }
  if (!window.fbq) {
    const pixel: Pixel = Object.assign((...args: unknown[]) => {
      if (pixel.callMethod) pixel.callMethod(...args);
      else pixel.queue.push(args);
    }, { queue: [] as unknown[][], loaded: true, version: '2.0' });
    pixel.push = pixel;
    window.fbq = window._fbq = pixel;
  }
  if (!scriptReady && !loading) {
    loading = true;
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.async = true;
    script.onload = () => { loading = false; scriptReady = true; syncMetaPixel(); };
    script.onerror = () => { loading = false; script.remove(); };
    document.head.appendChild(script);
    return;
  }
  if (!scriptReady) return;
  if (!initialized) {
    window.fbq('set', 'autoConfig', false, META_PIXEL_ID);
    window.fbq('init', META_PIXEL_ID);
    initialized = true;
  }
  window.fbq('consent', 'grant');
  if (lastPath !== location.pathname) {
    window.fbq('trackSingle', META_PIXEL_ID, 'PageView');
    lastPath = location.pathname;
  }
}
