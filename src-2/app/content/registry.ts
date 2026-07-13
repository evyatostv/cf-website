import type { ContentPageData } from "./types";

// Auto-collect every content page under ./pages/*.ts by its default export.
// Drop a new file in that folder and it is picked up here, routed in
// routes.tsx, and included in the prerender list + sitemap + llms files —
// no manual registration needed.
const modules = import.meta.glob<{ default: ContentPageData }>("./pages/*.ts", {
  eager: true,
});

export const contentPages: ContentPageData[] = Object.values(modules)
  .map((m) => m.default)
  .filter((p): p is ContentPageData => !!p && !!p.slug && !!p.path)
  .sort((a, b) => a.slug.localeCompare(b.slug));

export const contentSlugs: string[] = contentPages.map((p) => p.slug);
export const contentPaths: string[] = contentPages.map((p) => p.path);
