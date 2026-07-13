// SEO output auditor. Run after `npm run build`:
//   node scripts/audit-seo.mjs
//
// Walks dist/ and asserts the prerendered output is launch-clean:
//   1. sitemap.xml is complete + exact (every URL has an index.html, and vice versa)
//   2. per-page head hygiene (one unique <title>, description length, one exact
//      canonical, lang/dir, real text content, valid JSON-LD)
//   3. site-lock marker (cf_unlocked) + hash-redirect script on every page
//   4. app-shell.html is an empty-root noindex shell; no dist/login|dashboard
//   5. llms.txt / llms-full.txt / robots.txt artifacts
//   6. no rendering garbage ("undefined</", "[object Object]", "NaN ")
//   7. internal links resolve to emitted routes or allowed SPA routes
//
// Exits 0 with "PASS" when clean; exits 1 and lists every failure otherwise.
// Plain node, no dependencies.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const ORIGIN = "https://www.clinic-flow.co.il";

// SPA routes that are intentionally NOT prerendered but are valid link targets
// (served by the vercel catch-all rewrite to app-shell.html). The spec names the
// three auth routes; /payment is included because it is a VERIFIED registered
// client-side route (src-2/app/routes.tsx path:"payment" → PaymentPage) used as
// the pricing-page purchase CTA (/payment?plan=…). It is the same class as
// /login: catch-all-served, robots-disallowed, excluded from prerender. A link to
// it resolves to a real page, so it is not a broken/dangling link.
const ALLOWED_SPA_ROUTES = new Set(["/login", "/signup", "/reset-password", "/payment"]);

const failures = [];
function fail(msg) {
  failures.push(msg);
}

if (!existsSync(DIST)) {
  console.error(`FATAL: dist/ not found at ${DIST} — run npm run build first`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Collect prerendered pages
// ---------------------------------------------------------------------------
function walkHtml(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkHtml(full, acc);
    else if (name === "index.html") acc.push(full);
  }
  return acc;
}

function routeForFile(file) {
  const rel = file.slice(DIST.length).replace(/\\/g, "/").replace(/\/index\.html$/, "");
  return rel === "" ? "/" : rel;
}

const pageFiles = walkHtml(DIST);
const pages = pageFiles.map((file) => ({
  file,
  route: routeForFile(file),
  rel: file.slice(DIST.length + 1).replace(/\\/g, "/"),
  html: readFileSync(file, "utf8"),
}));
const emittedRoutes = new Set(pages.map((p) => p.route));

// ---------------------------------------------------------------------------
// 1. sitemap.xml completeness + exactness
// ---------------------------------------------------------------------------
{
  const sitemapPath = join(DIST, "sitemap.xml");
  if (!existsSync(sitemapPath)) {
    fail("sitemap.xml: missing from dist/");
  } else {
    const xml = readFileSync(sitemapPath, "utf8");
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    if (locs.length === 0) fail("sitemap.xml: contains no <loc> entries");

    const sitemapRoutes = new Set();
    for (const loc of locs) {
      if (!loc.startsWith(ORIGIN)) {
        fail(`sitemap.xml: <loc> not on canonical origin: ${loc}`);
        continue;
      }
      let route = loc.slice(ORIGIN.length);
      if (route === "" || route === "/") route = "/";
      else route = route.replace(/\/$/, "");
      if (sitemapRoutes.has(route)) fail(`sitemap.xml: duplicate entry for ${route}`);
      sitemapRoutes.add(route);
      if (!emittedRoutes.has(route))
        fail(`sitemap.xml: lists ${loc} but dist${route === "/" ? "" : route}/index.html was not emitted`);
    }
    for (const route of emittedRoutes) {
      if (!sitemapRoutes.has(route))
        fail(`sitemap.xml: prerendered route ${route} is missing from the sitemap`);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers for per-page checks
// ---------------------------------------------------------------------------
function stripped(html) {
  // Remove scripts/styles so marker/garbage checks look at markup+text only
  // where appropriate; title/meta checks use the raw html.
  return html;
}

function countMatches(html, re) {
  return (html.match(re) || []).length;
}

function rootText(html) {
  const openMatch = html.match(/<div id="root"[^>]*>/);
  if (!openMatch) return null;
  const start = openMatch.index + openMatch[0].length;
  // Root content ends at the SSG hash script marker (emitted right after the
  // root div) or </body> as fallback — mirror postbuild-seo.mjs logic.
  const marker = html.indexOf("__VITE_REACT_SSG_HASH__", start);
  const searchEnd = marker !== -1 ? marker : html.indexOf("</body>", start);
  const closeIdx = html.lastIndexOf("</div>", searchEnd === -1 ? html.length : searchEnd);
  const inner = closeIdx > start ? html.slice(start, closeIdx) : "";
  return inner
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// 2 + 3 + 6 + 7. Per-page checks
// ---------------------------------------------------------------------------
const titlesSeen = new Map(); // title -> first route

for (const p of pages) {
  const { rel, route, html } = p;

  // --- exactly one <title>, unique site-wide ---
  const titleMatches = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/g)];
  if (titleMatches.length !== 1) {
    fail(`${rel}: expected exactly one <title>, found ${titleMatches.length}`);
  } else {
    const title = titleMatches[0][1].replace(/\s+/g, " ").trim();
    if (!title) fail(`${rel}: <title> is empty`);
    if (titlesSeen.has(title))
      fail(`${rel}: duplicate <title> "${title}" (also on ${titlesSeen.get(title)})`);
    else titlesSeen.set(title, route);
  }

  // --- meta description 50-170 chars, exactly one ---
  const descMatches = [
    ...html.matchAll(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/g),
    ...html.matchAll(/<meta[^>]*content="([^"]*)"[^>]*name="description"[^>]*>/g),
  ];
  if (descMatches.length === 0) {
    fail(`${rel}: missing meta description`);
  } else if (descMatches.length > 1) {
    fail(`${rel}: ${descMatches.length} meta descriptions (expected 1)`);
  } else {
    const desc = descMatches[0][1].trim();
    if (desc.length < 50 || desc.length > 170)
      fail(`${rel}: meta description length ${desc.length} outside 50-170 chars`);
  }

  // --- exactly one canonical, exact match for its path ---
  const canonMatches = [
    ...html.matchAll(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"[^>]*>/g),
    ...html.matchAll(/<link[^>]*href="([^"]*)"[^>]*rel="canonical"[^>]*>/g),
  ];
  if (canonMatches.length !== 1) {
    fail(`${rel}: expected exactly one canonical, found ${canonMatches.length}`);
  } else {
    const href = canonMatches[0][1];
    if (!href.startsWith(ORIGIN)) {
      fail(`${rel}: canonical does not start with ${ORIGIN}: ${href}`);
    } else {
      const expected = route === "/" ? [`${ORIGIN}/`, ORIGIN] : [`${ORIGIN}${route}`];
      if (!expected.includes(href))
        fail(`${rel}: canonical ${href} does not match route ${route} (expected ${expected[0]})`);
    }
  }

  // --- lang="he" dir="rtl" on <html> ---
  const htmlTag = (html.match(/<html[^>]*>/) || [""])[0];
  if (!/lang="he"/.test(htmlTag)) fail(`${rel}: <html> missing lang="he"`);
  if (!/dir="rtl"/.test(htmlTag)) fail(`${rel}: <html> missing dir="rtl"`);

  // --- >500 chars of text inside the root div ---
  const text = rootText(html);
  if (text === null) fail(`${rel}: no <div id="root"> found`);
  else if (text.length <= 500)
    fail(`${rel}: only ${text.length} chars of text inside root div (need >500)`);

  // --- every JSON-LD block parses ---
  const ldBlocks = [
    ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ];
  for (let i = 0; i < ldBlocks.length; i++) {
    try {
      JSON.parse(ldBlocks[i][1]);
    } catch (e) {
      fail(`${rel}: JSON-LD block #${i + 1} does not parse: ${e.message}`);
    }
  }

  // --- site-lock marker + hash-redirect script ---
  if (!html.includes("cf_unlocked")) fail(`${rel}: missing site-lock marker cf_unlocked`);
  if (!(html.includes("location.hash") && html.includes('indexOf("#/")')))
    fail(`${rel}: missing hash-redirect script`);

  // --- rendering garbage ---
  for (const needle of ["undefined</", "[object Object]", "NaN "]) {
    if (html.includes(needle)) {
      const idx = html.indexOf(needle);
      const ctx = html.slice(Math.max(0, idx - 60), idx + 60).replace(/\s+/g, " ");
      fail(`${rel}: contains "${needle}" (…${ctx}…)`);
    }
  }

  // --- internal links resolve ---
  const hrefs = [...html.matchAll(/<a[^>]*\shref="(\/[^"#?]*)[^"]*"/g)].map((m) => m[1]);
  const badTargets = new Set();
  for (const raw of hrefs) {
    let target = raw.replace(/\/+$/, "");
    if (target === "") target = "/";
    // Skip static assets (files with extensions) — only route-shaped links.
    if (/\.[a-z0-9]+$/i.test(target)) continue;
    if (!emittedRoutes.has(target) && !ALLOWED_SPA_ROUTES.has(target)) badTargets.add(target);
  }
  for (const t of badTargets)
    fail(`${rel}: internal link to ${t} — not an emitted route or allowed SPA route`);
}

// ---------------------------------------------------------------------------
// 4. app-shell.html + forbidden app-route directories
// ---------------------------------------------------------------------------
{
  const shellPath = join(DIST, "app-shell.html");
  if (!existsSync(shellPath)) {
    fail("app-shell.html: missing from dist/");
  } else {
    const shell = readFileSync(shellPath, "utf8");
    if (!/<div id="root"[^>]*>\s*<\/div>/.test(shell))
      fail("app-shell.html: root div is not empty");
    const robots = shell.match(/<meta[^>]*name="robots"[^>]*content="([^"]*)"/);
    if (!robots || !/noindex/.test(robots[1]))
      fail("app-shell.html: missing robots noindex meta");
  }
  for (const dir of ["login", "dashboard"]) {
    if (existsSync(join(DIST, dir)))
      fail(`dist/${dir}: app route directory must not be emitted`);
  }
}

// ---------------------------------------------------------------------------
// 5. llms.txt / llms-full.txt / robots.txt
// ---------------------------------------------------------------------------
{
  if (!existsSync(join(DIST, "llms.txt"))) fail("llms.txt: missing from dist/");
  const fullPath = join(DIST, "llms-full.txt");
  if (!existsSync(fullPath)) {
    fail("llms-full.txt: missing from dist/");
  } else {
    const len = readFileSync(fullPath, "utf8").length;
    if (len <= 15000) fail(`llms-full.txt: only ${len} chars (need >15000)`);
  }
  const robotsPath = join(DIST, "robots.txt");
  if (!existsSync(robotsPath)) {
    fail("robots.txt: missing from dist/");
  } else {
    const robots = readFileSync(robotsPath, "utf8");
    if (!robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`))
      fail(`robots.txt: missing "Sitemap: ${ORIGIN}/sitemap.xml"`);
    if (!robots.includes("GPTBot")) fail("robots.txt: missing GPTBot directive");
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log(`[audit-seo] ${pages.length} prerendered pages checked`);
if (failures.length === 0) {
  console.log("PASS: all SEO output checks passed");
  process.exit(0);
} else {
  console.error(`FAIL: ${failures.length} issue(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
