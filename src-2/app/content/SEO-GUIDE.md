# SEO/GEO authoring guide (for agents & writers)

This site is **statically prerendered** at build time via `vite-react-ssg`. Every
public route becomes a real HTML file (`dist/<route>/index.html`) with a full
`<head>` and rendered content, so Google and AI crawlers (GPTBot, ClaudeBot,
PerplexityBot…) see the page without running JavaScript.

Two things make a page rank/GEO-ready: **(1) a `<Seo>` head** and **(2) real
answer-first content**. Here is how to add each.

---

## 1. Put a `<Seo>` on every new page

`src-2/app/components/Seo.tsx` renders the canonical `<title>`, meta description,
canonical link, OpenGraph/Twitter tags and JSON-LD into the **static** HTML.
Drop it anywhere in the page's JSX:

```tsx
import { Seo } from "@/app/components/Seo";

<Seo title="מחירים — ClinicFlow" description="…120–160 תווים…" canonicalPath="/pricing" />
```

Props: `title`, `description`, `canonicalPath` (path like `/pricing`), and
optional `ogImage`, `jsonLd` (array of schema.org objects), `noindex`.

- **Title rule:** `primary phrase | ClinicFlow`, max ~60 chars. ` | ClinicFlow`
  is auto-appended if you omit it.
- **Description rule:** 120–160 chars, answer-first, includes the target phrase.
- **Canonical:** always a path (`/foo`); it is resolved to
  `https://www.clinic-flow.co.il/foo` automatically.
- The old client-only hook `src-2/lib/use-document-meta.ts` still works where it
  is already used, but **`<Seo>` is the canonical way** — it is the only one that
  writes into the prerendered HTML.

> The postbuild step dedupes heads: when a page has a `<Seo>` (helmet) head, the
> generic tags inherited from `index.html` are stripped, so you never get a
> duplicate `<title>`/canonical. You do not need to think about this.

---

## 2. Content pages (money/comparison/profession/authority pages)

Do **not** hand-build a React page. Add **one data file** and everything (route,
prerender, `<Seo>`, JSON-LD, sitemap, `llms.txt`) is wired automatically.

1. Create `src-2/app/content/pages/<slug>.ts` that default-exports a
   `ContentPageData` (see `src-2/app/content/types.ts`).
2. That's it. `registry.ts` (`import.meta.glob("./pages/*.ts")`) auto-collects it,
   `routes.tsx` maps it to a top-level route rendered by
   `src-2/app/components/ContentPage.tsx`, and the build includes it in the
   prerender list, sitemap and llms files.

### `ContentPageData` contract (full type in `types.ts`)

| field             | required | notes                                                        |
| ----------------- | -------- | ------------------------------------------------------------ |
| `slug`            | ✅       | no slashes, e.g. `clinic-software-no-subscription`           |
| `path`            | ✅       | full route, e.g. `/clinic-software-no-subscription`          |
| `pageType`        | ✅       | `"landing"` → WebPage schema · `"article"` → Article schema  |
| `metaTitle`       | ✅       | `primary phrase | ClinicFlow`, ~60 chars                     |
| `metaDescription` | ✅       | 120–160 chars                                                |
| `h1`              | ✅       | exact target phrase                                          |
| `intro`           | ✅       | HTML; **answer-first** (40–60 word direct answer)            |
| `sections`        | ✅       | `[{ heading?, html }]` — phrase headings as the question     |
| `table`           | ⬜       | `{ caption?, columns[], rows[][] }` — comparison table       |
| `faq`             | ✅       | `[{ q, a }]` — renders accordion + emits FAQPage schema      |
| `cta`             | ⬜       | `{ label, to }` — link to the money page (usually `/pricing`)|
| `related`         | ⬜       | `[{ label, to }]` internal links                             |
| `sources`         | ⬜       | `[{ label, url }]` outbound citations                        |
| `datePublished`   | ✅       | ISO date                                                     |
| `dateModified`    | ✅       | ISO date (used as sitemap `lastmod`)                         |

`ContentPage` auto-emits: WebPage **or** Article JSON-LD (by `pageType`),
`FAQPage` from `faq`, `BreadcrumbList`, and the `<Seo>` head from
`metaTitle`/`metaDescription`/`path`. Design is 1:1 with the site (RTL, Heebo,
`#0d47a1` / `#1a2332` / `#f5f7f9`, rounded cards).

See `pages/clinic-software-no-subscription.ts` for a minimal working example.

---

## 3. Blog posts

Add/edit entries in `src-2/app/data/blog-posts.ts`. A post is prerendered only if
`content` is non-empty. Optional fields:

- `updatedAt?: string` — ISO; falls back to `createdAt` for schema/sitemap.
- `faq?: { q; a }[]` — renders a styled FAQ section and emits `FAQPage` JSON-LD.

`BlogPostPage` already emits Article + BreadcrumbList (+ FAQPage) JSON-LD and the
`<Seo>` head per post — you only edit data.

---

## 4. Excluded (never prerendered) routes

`login`, `signup`, `dashboard`, `payment`, `thank-you`, `reset-password`,
`update-password`, `complete-profile` stay pure SPA (served via `app-shell.html`).
Do not add SEO content there.
