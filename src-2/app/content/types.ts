// Data contract for programmatic SEO/GEO content pages (money landing pages,
// per-profession pages, comparison pages, authority guides). One file per page
// under ./pages/*.ts, default-exporting a ContentPageData; the registry
// auto-collects them and routes.tsx maps each to a top-level route rendered by
// <ContentPage />. See SEO-GUIDE.md for authoring rules.

export interface ContentSection {
  /** Optional H2 heading (answer-first: phrase the heading as the question). */
  heading?: string;
  /** Section body as trusted, in-repo HTML. */
  html: string;
}

export interface ContentTable {
  caption?: string;
  columns: string[];
  rows: string[][];
}

export interface ContentFaq {
  q: string;
  a: string;
}

export interface ContentLink {
  label: string;
  to: string;
}

export interface ContentSource {
  label: string;
  url: string;
}

export interface ContentPageData {
  /** URL slug (no slashes), e.g. "clinic-software-no-subscription". */
  slug: string;
  /** Full route path, e.g. "/clinic-software-no-subscription". */
  path: string;
  /** "landing" → Article-lite WebPage; "article" → Article JSON-LD. */
  pageType: "landing" | "article";
  /** <title> content (primary phrase | ClinicFlow, ~60 chars). */
  metaTitle: string;
  /** Meta description, 120–160 chars. */
  metaDescription: string;
  /** Visible H1 (exact target phrase). */
  h1: string;
  /** Answer-first intro paragraph(s) as HTML. */
  intro: string;
  /** Body sections in order. */
  sections: ContentSection[];
  /** Optional comparison table. */
  table?: ContentTable;
  /** FAQ entries → rendered accordion + FAQPage JSON-LD. */
  faq: ContentFaq[];
  /** Primary call-to-action. */
  cta?: ContentLink;
  /** Related internal links. */
  related?: ContentLink[];
  /** Outbound sources/citations. */
  sources?: ContentSource[];
  /** ISO date first published. */
  datePublished: string;
  /** ISO date last modified. */
  dateModified: string;
}
