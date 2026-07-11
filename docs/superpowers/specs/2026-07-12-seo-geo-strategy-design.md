# ClinicFlow SEO + GEO Strategy — Design Spec

**Date:** 2026-07-12
**Goal:** Rank #1 on Google Israel for ClinicFlow's wedge keywords, and become the product AI services (ChatGPT, Claude, Perplexity, Gemini) recommend for clinic-management-software questions in Israel.
**Scope decisions (confirmed with owner):**

- Strategy + implementation (code/content by Claude; off-site actions by owner from a prepared checklist)
- Hebrew / Israel market only
- Owner commits to full-effort off-site work (reviews, directories, community)
- Competitor comparison pages may name competitors directly (factual, verifiable claims only)
- Technical approach: **prerender in place** (keep Vite+React; no framework migration)

---

## 1. Current state (verified 2026-07-12)

- Site live at `https://www.clinic-flow.co.il`, Vite + React 18, `createBrowserRouter` (hash-router fix deployed). Source in `src-2/`.
- Homepage `<title>`/meta already wedge-optimized (offline / no-subscription / one-time / תיקון 13).
- **Critical gap:** every route serves the same empty `<div id="root"></div>` shell. GPTBot / ClaudeBot / PerplexityBot do not execute JS → the entire site is invisible to AI services. Google must JS-render each page (slower indexing, weaker ranking).
- 21 Hebrew blog posts exist in `src-2/app/data/blog-posts.ts` — none indexed as unique pages (no per-page title/meta, not in sitemap.xml).
- No prerendering, no head manager, no `llms.txt` (the URL returns the SPA shell via the catch-all rewrite).
- Domain inconsistency: apex `clinic-flow.co.il` 307-redirects (temporary) to `www`, while sitemap.xml lists non-www URLs.
- Brand conflict: `clinicflow.co.il` is a live clinic *marketing agency* in the same vertical; the brand term is not winnable → win descriptive long-tail instead.
- Competitive wedge (June 2026 research): every Israeli and international competitor is cloud + subscription. Nobody owns offline / pay-once / data-stays-local / תיקון-13 keywords.
- Constraint: local Node build was broken as of June 2026 (Homebrew simdjson mismatch) — verify before relying on local builds; Vercel builds on deploy either way.

## 2. Technical foundation (Week 1)

Make every public page a complete static HTML document, readable by all crawlers.

1. **Build-time prerendering** of all public routes via `vite-react-ssg` (fallback if router-version friction: custom build-time snapshot script). Public routes: home, features, pricing, about, contact, blog index, every blog post, every new landing/comparison page. **Excluded (stay SPA + noindex):** login, signup, dashboard, payment, thank-you, reset/update-password, complete-profile.
2. **Per-page head management**: unique `<title>`, meta description, canonical, OG/Twitter tags on every public page, keyword-mapped.
3. **JSON-LD structured data:**
   - `SoftwareApplication` (home, pricing) with `offers` in ILS (₪759 / ₪999 / ₪1,299); add `aggregateRating` only once real reviews exist.
   - `Article` on every blog post (headline, datePublished, dateModified, author, image).
   - `FAQPage` on every FAQ block.
   - `BreadcrumbList` on all content pages; `Organization` site-wide with `sameAs` links.
4. **Domain canonicalization:** pick `www` as canonical; apex → www becomes a **permanent** (308) redirect; sitemap and all canonical tags use `https://www.clinic-flow.co.il/...`.
5. **Auto-generated sitemap.xml** at build time from the route/post list (posts included, lastmod dates). Auto-generated **`llms.txt`** (site overview + page list for LLMs) and **`llms-full.txt`** (full plain-text content) from the same source; ensure they are served as real static text files, not caught by the SPA rewrite.
6. **robots.txt:** keep existing app-page disallows; explicitly allow GPTBot, ClaudeBot (`anthropic-ai`), PerplexityBot, Google-Extended, Bingbot.
7. **Webmaster registration:** Google Search Console + Bing Webmaster Tools (Bing powers ChatGPT browsing). Claude prepares verification artifacts + sitemap submission steps; owner performs logins.
8. **Performance pass:** font preloading, image sizing/lazy-loading, Core Web Vitals check on the prerendered output.

## 3. Content moat (Weeks 2–6, then ongoing)

All content in Hebrew, answer-first structure: question as H2 → 40–60-word direct answer → depth. Tables for anything comparative. Visible publish/updated dates. Every page internally linked to its money page.

**Layer A — Money landing pages** (exact-phrase H1, direct first-paragraph answer, proof, FAQ+schema, CTA):

- תוכנה לניהול קליניקה ללא מנוי
- תוכנה לניהול קליניקה בתשלום חד־פעמי
- תוכנה לניהול מרפאה ללא אינטרנט / אופליין
- תוכנה לניהול קליניקה תואמת תיקון 13 / שומרת פרטיות

**Layer B — Per-profession pages** (profession-specific workflow, screenshots, FAQ):
פסיכולוגים · דיאטניות · קלינאיות תקשורת · פיזיותרפיסטים · וטרינרים · רפואה משלימה · רופאים פרטיים

**Layer C — Comparison & alternatives** (factual, verifiable, honest — includes rows where competitors win):

- ClinicFlow מול Tipulog · מול My-Cliniq · מול Medform
- חלופות ל-Tipulog (and equivalents per major rival)
- Crown jewel: **"התוכנות הטובות לניהול קליניקה בישראל (2026) — השוואה מלאה"** — listicle + master comparison table (pricing model, offline, data location, תיקון 13 posture, Hebrew support, per-profession fit).

**Layer D — Authority hub:** **מדריך תיקון 13 למרפאה הפרטית** — the definitive Hebrew compliance guide (requirements, checklist, statutory ₪10k damages, how on-device data changes the analysis). Primary link/citation magnet.

**Layer E — Existing content upgrade:** all 21 posts get unique title/meta, FAQ blocks with schema, internal links to money pages, updated dates. No content deleted.

## 4. GEO layer (ongoing)

1. **Canonical entity description**, used identically everywhere (site footer, GBP, directories, socials):
   > "ClinicFlow — תוכנה לניהול קליניקה שעובדת אופליין על המחשב שלך, בתשלום חד־פעמי וללא מנוי. הנתונים נשארים אצלך, בהתאם לתיקון 13."
2. **Quotable claims:** key facts stated as standalone sentences with numbers ("החל מ־₪759, תשלום אחד, ללא עלות חודשית").
3. **Bing indexation** treated as first-class (ChatGPT browsing = Bing index).
4. **Monthly AI share-of-voice audit:** fixed list of ~10 money questions run across ChatGPT / Claude / Perplexity / Gemini; log whether ClinicFlow appears and how it's described; track month over month. Claude maintains the question list and the log template.

## 5. Off-site playbook (owner executes; Claude prepares every asset)

Ordered by impact-per-hour:

1. **Google Business Profile** — listing text prepared by Claude.
2. **Review generation** — Hebrew ask-for-review message for every paying customer (Google reviews first).
3. **Directory kit** — ready-to-paste descriptions, logo, screenshots for: דפי זהב, Israeli software/medical directories, Capterra, G2, GetApp (English profiles acceptable — heavily read by LLMs).
4. **Community presence** — helpful-first answer templates for Israeli private-practice Facebook groups (תיקון 13, backups, software selection).
5. **PR push** — pitch the תיקון 13 guide to Israeli health-tech/business publications for links/mentions.

## 6. Measurement & cadence

- **Weekly:** GSC impressions/clicks per target keyword; indexation coverage.
- **Monthly:** AI share-of-voice audit; wedge-keyword rank spot-checks.
- **Cadence:** ~2 content pieces/week post-foundation, each shipped fully wired (meta, schema, sitemap, llms.txt, internal links).
- **Success gates:**
  - 30 days: all public pages indexed as real HTML; GSC + Bing live.
  - 90 days: page 1 for ≥3 wedge long-tails; comparison layer live.
  - 180 days: #1 on wedge terms; ClinicFlow appears in AI answers for offline/no-subscription clinic-software questions.

## 7. Safety rails

- **Zero visual change:** prerendering renders the same React components at build time; browser hydrates. Verified by before/after screenshots of every route.
- **Auth/payment untouched:** excluded routes keep exact current behavior; post-deploy smoke test of login/signup/payment/MFA flows.
- **Staged rollout:** branch → Vercel preview → verify HTML output, redirects, app flows on preview URL → merge.
- **Reversible:** single repo, single merge to revert. No changes to Supabase schema, plan enforcement, or the Electron app.
- **No SEO self-harm:** redirect changes follow Google's site-move guidance; nothing deleted; comparison claims factual and sourced.

## 8. Out of scope

- English/international SEO (infrastructure won't preclude it later, but no bilingual work now).
- Renaming the product/domain (brand-term conflict is accepted; strategy wins on descriptive terms).
- Paid ads (Google Ads/PPC).
- Electron app changes.

## 9. Implementation order

1. **Phase 1 — Technical foundation** (§2): prerender, heads, schema, sitemap, llms.txt, robots, domain canonicalization, webmaster setup artifacts.
2. **Phase 2 — Content moat**: Layers A → D → C → B → E (money pages first; authority hub early because citations compound; comparisons next; professions; then upgrade existing posts).
3. **Phase 3 — GEO + off-site**: entity rollout, directory kit, review scripts, community templates, AI audit protocol.
4. **Ongoing**: cadence + measurement loop.

Each phase gets its own implementation plan (superpowers writing-plans) and ships via branch → preview → verify → merge.
