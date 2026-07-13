import { Head } from "vite-react-ssg";

// Canonical origin for the whole site. Every canonical/OG URL is absolute and
// www-normalised so the prerendered HTML is unambiguous to crawlers.
export const SITE_ORIGIN = "https://www.clinic-flow.co.il";
export const SITE_NAME = "ClinicFlow";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

export interface SeoProps {
  /** Page title. " | ClinicFlow" is appended unless already present. */
  title: string;
  description: string;
  /** Path only (e.g. "/pricing") or absolute URL. Resolved against SITE_ORIGIN. */
  canonicalPath: string;
  /** Absolute or path-relative OG image. Defaults to the site OG image. */
  ogImage?: string;
  /** JSON-LD objects emitted as <script type="application/ld+json"> tags. */
  jsonLd?: object[];
  /** When true, emit robots noindex,nofollow. */
  noindex?: boolean;
}

function absolute(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_ORIGIN}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/**
 * Canonical build-time SEO component. Renders <title>, meta description,
 * canonical link, Open Graph + Twitter tags and any JSON-LD into the static
 * <head> via vite-react-ssg's <Head> (react-helmet-async under the hood).
 *
 * Usage:
 *   <Seo title="תמחור" description="..." canonicalPath="/pricing" />
 */
export function Seo({ title, description, canonicalPath, ogImage, jsonLd, noindex }: SeoProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonical = absolute(canonicalPath);
  const image = absolute(ogImage ?? DEFAULT_OG_IMAGE);

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="he_IL" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd?.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Head>
  );
}
