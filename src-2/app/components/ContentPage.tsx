import { Link } from "react-router";
import { ArrowRight, ChevronDown, ExternalLink } from "lucide-react";
import { Seo, SITE_ORIGIN, SITE_NAME } from "@/app/components/Seo";
import type { ContentPageData } from "@/app/content/types";

const OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

// Renders a ContentPageData 1:1 in the site design language (RTL, Heebo,
// #0d47a1 / #1a2332 / #f5f7f9, rounded cards). Auto-emits Seo tags, WebPage or
// Article JSON-LD, FAQPage JSON-LD and a BreadcrumbList. Used by every route in
// the content registry (src-2/app/content/registry.ts).
export function ContentPage({ data }: { data: ContentPageData }) {
  const url = `${SITE_ORIGIN}${data.path}`;

  const mainSchema = {
    "@context": "https://schema.org",
    "@type": data.pageType === "article" ? "Article" : "WebPage",
    headline: data.h1,
    name: data.h1,
    description: data.metaDescription,
    inLanguage: "he-IL",
    datePublished: data.datePublished,
    dateModified: data.dateModified,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: OG_IMAGE,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_ORIGIN },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_ORIGIN,
      logo: { "@type": "ImageObject", url: OG_IMAGE },
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "בית", item: SITE_ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: data.h1, item: url },
    ],
  };

  const faqSchema =
    data.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: data.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  const jsonLd = [mainSchema, breadcrumb, ...(faqSchema ? [faqSchema] : [])];

  return (
    <div className="min-h-screen bg-[#f5f7f9]" dir="rtl" style={{ fontFamily: "Heebo, sans-serif" }}>
      <Seo
        title={data.metaTitle}
        description={data.metaDescription}
        canonicalPath={data.path}
        ogImage={OG_IMAGE}
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="bg-[#1a2332] pt-16 pb-0">
        <div className="mx-auto max-w-3xl px-6 pt-8 pb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[#7a9db8] text-sm hover:text-white transition-colors mb-4"
          >
            <ArrowRight size={14} />
            לעמוד הבית
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">{data.h1}</h1>
          <div
            className="blog-content mt-4 text-[#c3d3e0] text-base leading-relaxed [&_a]:text-white [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: data.intro }}
          />
          <p className="mt-4 text-xs text-[#7a9db8]">
            עודכן לאחרונה: {data.dateModified}
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-6 py-10">
        {/* Sections */}
        {data.sections.map((section, i) => (
          <section key={i} className="mb-6 bg-white rounded-2xl border border-[#e1e6ec] p-6 sm:p-8 shadow-sm">
            {section.heading && (
              <h2 className="text-xl font-bold text-[#1a2332] mb-4">{section.heading}</h2>
            )}
            <div className="blog-content" dangerouslySetInnerHTML={{ __html: section.html }} />
          </section>
        ))}

        {/* Comparison table */}
        {data.table && (
          <section className="mb-6 bg-white rounded-2xl border border-[#e1e6ec] p-6 sm:p-8 shadow-sm">
            {data.table.caption && (
              <h2 className="text-xl font-bold text-[#1a2332] mb-4">{data.table.caption}</h2>
            )}
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full min-w-[560px] text-sm border-collapse">
                <thead>
                  <tr>
                    {data.table.columns.map((col, i) => (
                      <th
                        key={i}
                        className="text-right font-bold text-white bg-[#0d47a1] px-4 py-3 first:rounded-r-lg last:rounded-l-lg"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.table.rows.map((row, ri) => (
                    <tr key={ri} className="odd:bg-[#f5f7f9] even:bg-white">
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-4 py-3 border-b border-[#e1e6ec] text-[#1a2332] align-top first:font-semibold"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* FAQ */}
        {data.faq.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-[#1a2332] mb-4">שאלות נפוצות</h2>
            <div className="flex flex-col gap-3">
              {data.faq.map((f, i) => (
                <details
                  key={i}
                  className="group bg-white rounded-xl border border-[#e1e6ec] shadow-sm [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 font-semibold text-[#1a2332]">
                    {f.q}
                    <ChevronDown
                      size={18}
                      className="flex-shrink-0 text-[#0d47a1] transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <div className="px-5 pb-5 text-[#4a5568] leading-relaxed">{f.a}</div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        {data.cta && (
          <section className="mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-[#0d47a1] to-[#00838f] p-8 text-center shadow-lg">
              <p className="text-white text-lg font-semibold mb-5">מוכנים להתחיל?</p>
              <Link
                to={data.cta.to}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-semibold text-[#0d47a1] shadow-xl transition-transform hover:scale-[1.02]"
              >
                {data.cta.label}
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        )}

        {/* Related links */}
        {data.related && data.related.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-bold text-[#1a2332] mb-3">קריאה נוספת</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.related.map((r, i) => (
                <Link
                  key={i}
                  to={r.to}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[#e1e6ec] bg-white px-4 py-3 text-sm font-semibold text-[#1a2332] shadow-sm transition-colors hover:text-[#0d47a1]"
                >
                  {r.label}
                  <ArrowRight size={16} className="flex-shrink-0 text-[#0d47a1]" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sources */}
        {data.sources && data.sources.length > 0 && (
          <section className="mt-8 border-t border-[#e1e6ec] pt-6">
            <h2 className="text-sm font-bold text-[#6b7c93] mb-3">מקורות</h2>
            <ul className="flex flex-col gap-2">
              {data.sources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1.5 text-sm text-[#0d47a1] hover:underline"
                  >
                    <ExternalLink size={13} />
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
