import { hasMarketingConsent, hasSafeCampaignUrl } from '@/lib/meta-pixel';

// Keep this list deliberately small: these events measure the public funnel and
// never carry names, email addresses, phone numbers, order IDs, or clinical data.
export type MarketingEvent =
  | 'pricing_viewed'
  | 'checkout_started'
  | 'checkout_redirected'
  | 'checkout_failed'
  | 'checkout_success'
  | 'download_blocked'
  | 'download_granted'
  | 'contact_cta_clicked';

type MarketingParams = Record<string, string | number | boolean | undefined>;

const ALLOWED_PARAMS = new Set(['plan', 'os', 'status', 'reason', 'source', 'intent']);
const PUBLIC_HOSTS = new Set(['clinic-flow.co.il', 'www.clinic-flow.co.il']);

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function safeParams(params: MarketingParams): Record<string, string | number | boolean> {
  const entries = Object.entries(params).filter((entry): entry is [string, string | number | boolean] => {
    const [key, value] = entry;
    return ALLOWED_PARAMS.has(key) && value !== undefined
      && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean');
  });
  return Object.fromEntries(entries);
}

export function trackMarketingEvent(event: MarketingEvent, params: MarketingParams = {}) {
  if (typeof window === 'undefined' || !hasMarketingConsent()) return;
  if (!PUBLIC_HOSTS.has(window.location.hostname) || !hasSafeCampaignUrl(window.location.search, window.location.hash)) return;
  const payload = safeParams(params);
  window.gtag?.('event', event, payload);
  // Meta custom events are only sent after the existing consent-gated pixel has
  // initialized. Unknown/unsupported events are never queued here.
  window.fbq?.('trackSingleCustom', '1060618490333688', event, payload);
}
