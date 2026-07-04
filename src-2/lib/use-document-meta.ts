import { useEffect } from 'react';

// Tiny per-route SEO hook — no external dependency (no react-helmet).
// Sets <title>, <meta name="description">, <meta property="og:*"> and the
// canonical <link> for the current route, then restores nothing (the next
// route overwrites them). This fixes every SPA route otherwise inheriting the
// homepage title/description/canonical from index.html.

const SITE_NAME = 'ClinicFlow';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export interface DocumentMeta {
  title: string;
  description?: string;
  /** Absolute or path-only canonical URL. Path is resolved against origin. */
  canonicalPath?: string;
  image?: string;
}

export function useDocumentMeta({ title, description, canonicalPath, image }: DocumentMeta) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    const canonical =
      canonicalPath && /^https?:\/\//.test(canonicalPath)
        ? canonicalPath
        : `${window.location.origin}${canonicalPath ?? window.location.pathname}`;

    upsertCanonical(canonical);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:type', 'website');

    if (description) {
      upsertMeta('name', 'description', description);
      upsertMeta('property', 'og:description', description);
    }
    if (image) {
      upsertMeta('property', 'og:image', image);
    }
  }, [title, description, canonicalPath, image]);
}
