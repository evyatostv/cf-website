// Postbuild SEO artifact generator. Runs after `vite-react-ssg build`.
//
// Driven entirely by the prerendered output in dist/ (no TS imports needed, so
// it stays perfectly in sync with what was actually rendered). It:
//   1. Dedupes <head>: when a page has helmet-managed tags (data-rh), strips the
//      leftover static index.html title/canonical/description/robots/OG/Twitter
//      so crawlers see exactly one of each.
//   2. Writes dist/sitemap.xml (all prerendered public routes, www URLs, lastmod).
//   3. Writes dist/llms.txt (site overview + annotated URL list).
//   4. Writes dist/llms-full.txt (full plain-text dump of every page).
//   5. Writes dist/app-shell.html (empty-root, noindex SPA shell for the
//      non-prerendered app routes served via the vercel catch-all rewrite).
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const ORIGIN = "https://www.clinic-flow.co.il";
const TODAY = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Canonical site one-liner (product-facts.md → fallback homepage description)
// ---------------------------------------------------------------------------
function canonicalOneLiner() {
  try {
    const facts = readFileSync("product-facts.md", "utf8");
    const idx = facts.indexOf("Canonical one-liner");
    if (idx !== -1) {
      const after = facts.slice(idx);
      const m = after.match(/>\s*(.+)/);
      if (m) return m[1].trim();
    }
  } catch {}
  // Fallback: homepage meta description from the built index.html.
  try {
    const home = readFileSync(join(DIST, "index.html"), "utf8");
    const m = home.match(/<meta name="description" content="([^"]+)"/);
    if (m) return m[1];
  } catch {}
  return "ClinicFlow — תוכנה לניהול קליניקה שעובדת אופליין, בתשלום חד־פעמי וללא מנוי.";
}

// ---------------------------------------------------------------------------
// Collect prerendered routes
// ---------------------------------------------------------------------------
function walkHtml(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkHtml(full, acc);
    else if (name === "index.html") acc.push(full);
  }
  return acc;
}

function routeForFile(file) {
  // dist/index.html -> "/", dist/pricing/index.html -> "/pricing"
  const rel = file.slice(DIST.length).replace(/\/index\.html$/, "");
  return rel === "" ? "/" : rel;
}

// ---------------------------------------------------------------------------
// Head dedup
// ---------------------------------------------------------------------------
function dedupeHead(html) {
  // Only touch pages that carry helmet-managed tags; otherwise the static
  // index.html tags are the ONLY head this page has — leave them alone.
  if (!/<title data-rh/.test(html)) return html;
  return (
    html
      // static (non data-rh) <title>
      .replace(/<title>[\s\S]*?<\/title>/, "")
      // static canonical (helmet's has data-rh first, so it is untouched)
      .replace(/<link rel="canonical"[^>]*>/g, "")
      .replace(/<meta name="description"[^>]*>/g, "")
      .replace(/<meta name="robots"[^>]*>/g, "")
      .replace(/<meta property="og:[^"]*"[^>]*>/g, "")
      .replace(/<meta name="twitter:[^"]*"[^>]*>/g, "")
  );
}

// ---------------------------------------------------------------------------
// Text extraction (for llms-full.txt)
// ---------------------------------------------------------------------------
function pageText(html) {
  let body = html;
  const rootStart = body.indexOf('<div id="root">');
  if (rootStart !== -1) body = body.slice(rootStart);
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html) {
  const m =
    html.match(/<title data-rh="true">([^<]*)<\/title>/) ||
    html.match(/<title>([^<]*)<\/title>/);
  return m ? m[1].trim() : "ClinicFlow";
}
function extractDescription(html) {
  const m =
    html.match(/<meta data-rh="true" name="description" content="([^"]*)"/) ||
    html.match(/<meta name="description" content="([^"]*)"/);
  return m ? m[1].trim() : "";
}
function extractLastmod(html) {
  const m = html.match(/"dateModified":"(\d{4}-\d{2}-\d{2})"/);
  return m ? m[1] : TODAY;
}

// Sitemap metadata by route bucket
function sitemapMeta(route) {
  if (route === "/") return { priority: "1.0", changefreq: "weekly" };
  if (route === "/blog") return { priority: "0.8", changefreq: "weekly" };
  if (route.startsWith("/blog/")) return { priority: "0.7", changefreq: "monthly" };
  if (["/terms", "/privacy", "/disclaimer", "/refund"].includes(route))
    return { priority: "0.3", changefreq: "yearly" };
  if (["/features", "/pricing", "/about", "/contact"].includes(route))
    return { priority: "0.9", changefreq: "monthly" };
  return { priority: "0.8", changefreq: "monthly" }; // content pages
}

// Stable ordering: home, marketing, blog, content, legal
function routeRank(route) {
  const order = ["/", "/features", "/pricing", "/about", "/contact", "/blog"];
  const i = order.indexOf(route);
  if (i !== -1) return i;
  if (route.startsWith("/blog/")) return 100;
  if (["/terms", "/privacy", "/disclaimer", "/refund"].includes(route)) return 300;
  return 200; // content pages
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const files = walkHtml(DIST).filter((f) => !f.endsWith("app-shell.html"));
const pages = files
  .map((file) => {
    const html = readFileSync(file, "utf8");
    return { file, route: routeForFile(file), html };
  })
  .sort((a, b) => routeRank(a.route) - routeRank(b.route) || a.route.localeCompare(b.route));

// 1. Dedupe heads in place
for (const p of pages) {
  const cleaned = dedupeHead(p.html);
  if (cleaned !== p.html) {
    writeFileSync(p.file, cleaned);
    p.html = cleaned;
  }
}

// 2. sitemap.xml
const urls = pages
  .map((p) => {
    const { priority, changefreq } = sitemapMeta(p.route);
    const loc = `${ORIGIN}${p.route === "/" ? "/" : p.route}`;
    return [
      "  <url>",
      `    <loc>${loc}</loc>`,
      `    <lastmod>${extractLastmod(p.html)}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      "  </url>",
    ].join("\n");
  })
  .join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
writeFileSync(join(DIST, "sitemap.xml"), sitemap);

// 3. llms.txt
const oneLiner = canonicalOneLiner();
const llmsLines = [
  "# ClinicFlow",
  "",
  `> ${oneLiner}`,
  "",
  "ClinicFlow היא תוכנה לניהול קליניקה ומרפאה פרטית בישראל שעובדת אופליין על המחשב, בתשלום חד־פעמי וללא מנוי חודשי. הנתונים נשמרים מקומית ומוצפנים אצל בעל המרפאה, בהתאם לתיקון 13 לחוק הגנת הפרטיות.",
  "",
  "## עמודים",
  "",
];
for (const p of pages) {
  const title = extractTitle(p.html);
  const desc = extractDescription(p.html);
  const loc = `${ORIGIN}${p.route === "/" ? "/" : p.route}`;
  llmsLines.push(`- [${title}](${loc})${desc ? `: ${desc}` : ""}`);
}
llmsLines.push("");
writeFileSync(join(DIST, "llms.txt"), llmsLines.join("\n"));

// 4. llms-full.txt
const fullParts = [
  "# ClinicFlow — Full Content Dump",
  "",
  `> ${oneLiner}`,
  "",
];
for (const p of pages) {
  const loc = `${ORIGIN}${p.route === "/" ? "/" : p.route}`;
  const title = extractTitle(p.html);
  const text = pageText(p.html);
  fullParts.push("", "---", "", `URL: ${loc}`, `TITLE: ${title}`, "", text);
}
writeFileSync(join(DIST, "llms-full.txt"), fullParts.join("\n") + "\n");

// 5. app-shell.html (empty root, noindex, generic title)
{
  let shell = readFileSync(join(DIST, "index.html"), "utf8");
  // Empty the root div. The built root tag carries attributes
  // (e.g. data-server-rendered), so match it with a regex, then drop everything
  // up to the last </div> before the module script.
  const openMatch = shell.match(/<div id="root"[^>]*>/);
  if (openMatch) {
    // Root content ends at the last </div> before the SSG hash script (which
    // vite-react-ssg emits right after the root div), or </body> as a fallback.
    const marker = shell.indexOf("__VITE_REACT_SSG_HASH__");
    const searchEnd = marker !== -1 ? marker : shell.indexOf("</body>");
    const closeIdx = shell.lastIndexOf("</div>", searchEnd);
    if (closeIdx > openMatch.index) {
      shell =
        shell.slice(0, openMatch.index) +
        '<div id="root"></div>' +
        shell.slice(closeIdx + "</div>".length);
    }
  }
  // Generic title.
  shell = shell.replace(/<title[^>]*>[\s\S]*?<\/title>/, "<title>ClinicFlow</title>");
  // noindex.
  if (/<meta name="robots"[^>]*>/.test(shell)) {
    shell = shell.replace(/<meta name="robots"[^>]*>/g, '<meta name="robots" content="noindex, nofollow">');
  } else {
    shell = shell.replace(/<\/title>/, '</title>\n    <meta name="robots" content="noindex, nofollow">');
  }
  // Drop homepage-identity tags so the shell asserts nothing.
  shell = shell
    .replace(/<link rel="canonical"[^>]*>/g, "")
    .replace(/<meta property="og:[^"]*"[^>]*>/g, "")
    .replace(/<meta name="twitter:[^"]*"[^>]*>/g, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  writeFileSync(join(DIST, "app-shell.html"), shell);
}

console.log(
  `[postbuild-seo] ${pages.length} routes → sitemap.xml, llms.txt, llms-full.txt, app-shell.html`
);
