import { hasMarketingConsent, hasSafeCampaignUrl, hasSafeMarketingReferrer } from '@/lib/meta-pixel';
import { blogPosts } from '@/app/data/blog-posts';
import { contentPaths } from '@/app/content/registry';

const MEASUREMENT_ID = 'G-Z7RVT7WW97';
export const PUBLIC_MARKETING_PATHS = new Set(['/', '/start', '/start/thanks', '/features', '/pricing', '/about',
  '/contact', '/partners', '/blog', '/terms', '/privacy', '/disclaimer', '/refund',
  ...contentPaths, ...blogPosts.filter(post => post.content?.trim()).map(post => '/blog/' + post.slug)]);
let lastPath: string | null = null;

declare global {
  interface Window {
    'ga-disable-G-Z7RVT7WW97'?: boolean;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function syncGoogleAnalytics() {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  const allowed = hasMarketingConsent() && PUBLIC_MARKETING_PATHS.has(path) && hasSafeMarketingReferrer()
    && hasSafeCampaignUrl(window.location.search, window.location.hash)
    && ['clinic-flow.co.il', 'www.clinic-flow.co.il'].includes(window.location.hostname);
  window['ga-disable-G-Z7RVT7WW97'] = !allowed;
  if (!allowed) {
    lastPath = null;
    window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
    return;
  }
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => { window.dataLayer?.push(args); };
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, { send_page_view: false });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
  if (lastPath !== path) {
    window.gtag('event', 'page_view', { page_path: path, page_location: `${window.location.origin}${path}` });
    lastPath = path;
  }
}
