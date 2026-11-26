import { PUBLIC_MARKETING_PATHS } from './google-analytics';
import { hasMarketingConsent, hasSafeMarketingReferrer } from './meta-pixel';

function publicPage(value: string) {
  try {
    const url = new URL(value);
    return url.origin === window.location.origin && url.protocol === 'https:'
      && ['www.clinic-flow.co.il', 'clinic-flow.co.il'].includes(url.host)
      && !url.username && !url.password && PUBLIC_MARKETING_PATHS.has(url.pathname) && !url.search && !url.hash;
  } catch { return false; }
}

// The SDKs can keep observers after navigation. Recheck consent and both URLs at delivery time.
export function allowHostedMetric<T extends { url: string }>(event: T): T | null {
  return hasMarketingConsent() && hasSafeMarketingReferrer()
    && publicPage(window.location.href) && publicPage(event.url) ? event : null;
}
