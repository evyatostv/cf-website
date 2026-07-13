import "@/instrument";

import { ViteReactSSG } from "vite-react-ssg";
import { createBrowserRouter } from "react-router-dom";
import { routes } from "@/app/routes";
import "@/styles/index.css";

// vite-react-ssg injects an async static-loader-data loader into EVERY route on
// the client. None of our routes define loaders, but the injected ones make the
// router start uninitialized, so at hydration RouterProvider renders a null
// HydrateFallback instead of the page: React "hydrates" an empty tree, the
// prerendered DOM is left behind unclaimed, and the real page gets appended
// next to it — every page rendered twice (double footer). Stripping the
// injected loaders lets the router initialize synchronously and hydration
// claim the server DOM.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripInjectedLoaders(rs: any[]): any[] {
  for (const r of rs) {
    delete r.loader;
    if (r.children) stripInjectedLoaders(r.children);
  }
  return rs;
}

// vite-react-ssg owns mounting (hydrate in browser, renderToString at build).
// The router tree lives in @/app/routes; providers wrap it via the root element.
export const createRoot = ViteReactSSG({
  routes,
  basename: import.meta.env.BASE_URL,
  customCreateRouter: (rs, opts) => createBrowserRouter(stripInjectedLoaders(rs), opts),
});

// Routes that must NEVER be prerendered — they stay pure client-side SPA (auth,
// payment, account). vite-react-ssg calls this to pick which paths to emit as
// static HTML; everything else (home, features, pricing, blog posts, content
// pages, legal) is prerendered. Dynamic (`:`/`*`) paths are dropped downstream.
const EXCLUDED = new Set([
  "/login",
  "/signup",
  "/dashboard",
  "/payment",
  "/thank-you",
  "/reset-password",
  "/update-password",
  "/complete-profile",
]);

export function includedRoutes(paths: string[]): string[] {
  return paths
    .map((p) => (p.startsWith("/") ? p : `/${p}`))
    .filter((p) => !EXCLUDED.has(p) && !p.includes(":") && !p.includes("*"));
}
