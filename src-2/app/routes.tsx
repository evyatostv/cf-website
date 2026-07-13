import * as Sentry from "@sentry/react";
import type { RouteRecord } from "vite-react-ssg";
import { Layout } from "@/app/components/Layout";
import { RequireAuth } from "@/app/components/RequireAuth";
import { AuthProvider } from "@/lib/auth-context";
import { PaymentProvider } from "@/lib/payment-context";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ContentPage } from "@/app/components/ContentPage";
import { contentPages } from "@/app/content/registry";
import { blogPosts } from "@/app/data/blog-posts";

// Root element for every route: the app-wide providers + error boundary wrap
// the visual <Layout /> (which itself renders <Navigation/>, <Outlet/>,
// <Footer/>). This replaces the old App.tsx <RouterProvider> tree so that
// vite-react-ssg owns the router while our providers still wrap it.
function RootProviders() {
  return (
    <Sentry.ErrorBoundary
      fallback={
        <div dir="rtl" style={{ padding: 24, textAlign: "center" }}>
          <p style={{ marginBottom: 12 }}>אירעה תקלה — רעננו את העמוד.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: "#0d47a1",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            רענון העמוד
          </button>
        </div>
      }
    >
      <AuthProvider>
        <PaymentProvider>
          <Layout />
          <Analytics />
          <SpeedInsights />
        </PaymentProvider>
      </AuthProvider>
    </Sentry.ErrorBoundary>
  );
}

// Content-page routes are auto-collected from the registry (see
// src-2/app/content/registry.ts). Each renders <ContentPage data={...} />
// with the site chrome (they are children of the Layout root).
const contentRoutes: RouteRecord[] = contentPages.map((page) => ({
  path: page.path.replace(/^\//, ""),
  element: <ContentPage data={page} />,
  entry: "src-2/app/components/ContentPage.tsx",
}));

export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <RootProviders />,
    children: [
      {
        index: true,
        lazy: () => import("@/app/pages/HomePage").then((m) => ({ Component: m.HomePage })),
      },
      {
        path: "pricing",
        lazy: () => import("@/app/pages/PricingPage").then((m) => ({ Component: m.PricingPage })),
      },
      {
        path: "features",
        lazy: () => import("@/app/pages/FeaturesPage").then((m) => ({ Component: m.FeaturesPage })),
      },
      {
        path: "about",
        lazy: () => import("@/app/pages/AboutPage").then((m) => ({ Component: m.AboutPage })),
      },
      {
        path: "contact",
        lazy: () => import("@/app/pages/ContactPage").then((m) => ({ Component: m.ContactPage })),
      },
      {
        path: "terms",
        lazy: () => import("@/app/pages/TermsPage").then((m) => ({ Component: m.TermsPage })),
      },
      {
        path: "privacy",
        lazy: () => import("@/app/pages/PrivacyPage").then((m) => ({ Component: m.PrivacyPage })),
      },
      {
        path: "disclaimer",
        lazy: () => import("@/app/pages/DisclaimerPage").then((m) => ({ Component: m.DisclaimerPage })),
      },
      {
        path: "refund",
        lazy: () => import("@/app/pages/RefundPage").then((m) => ({ Component: m.RefundPage })),
      },
      {
        path: "blog",
        lazy: () => import("@/app/pages/BlogPage").then((m) => ({ Component: m.BlogPage })),
      },
      {
        path: "blog/:slug",
        lazy: () => import("@/app/pages/BlogPostPage").then((m) => ({ Component: m.BlogPostPage })),
        // Prerender one static page per blog post that has real content.
        getStaticPaths: () =>
          blogPosts
            .filter((p) => !!p.content?.trim())
            .map((p) => `/blog/${p.slug}`),
      },
      ...contentRoutes,

      // --- Excluded from prerender (stay SPA). Kept in the router so client-side
      //     navigation still works; filtered out by `includedRoutes` in main.tsx. ---
      {
        path: "login",
        lazy: () => import("@/app/pages/LoginPage").then((m) => ({ Component: m.LoginPage })),
      },
      {
        path: "signup",
        lazy: () => import("@/app/pages/SignupPage").then((m) => ({ Component: m.SignupPage })),
      },
      {
        path: "dashboard",
        element: (
          <RequireAuth requireOnboarded requireMfa>
            <DashboardLazy />
          </RequireAuth>
        ),
      },
      {
        path: "payment",
        element: (
          <RequireAuth requireOnboarded requireMfa>
            <PaymentLazy />
          </RequireAuth>
        ),
      },
      {
        path: "thank-you",
        element: (
          <RequireAuth>
            <ThankYouLazy />
          </RequireAuth>
        ),
      },
      {
        path: "reset-password",
        lazy: () => import("@/app/pages/ResetPasswordPage").then((m) => ({ Component: m.ResetPasswordPage })),
      },
      {
        path: "update-password",
        lazy: () => import("@/app/pages/UpdatePasswordPage").then((m) => ({ Component: m.UpdatePasswordPage })),
      },
      {
        path: "complete-profile",
        element: (
          <RequireAuth>
            <CompleteProfileLazy />
          </RequireAuth>
        ),
      },
      {
        path: "*",
        lazy: () => import("@/app/pages/NotFoundPage").then((m) => ({ Component: m.NotFoundPage })),
      },
    ],
  },
];

// Excluded routes that need a wrapper (RequireAuth) can't use route.lazy on the
// same node, so lazy-load their page component with React.lazy + Suspense. These
// paths are never prerendered, so the SSG-vs-Suspense caveat does not apply.
import { lazy, Suspense } from "react";

const SpaFallback = () => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 32, height: 32, border: "3px solid #e1e6ec", borderTopColor: "#1a56db", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const DashboardPage = lazy(() => import("@/app/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const PaymentPage = lazy(() => import("@/app/pages/PaymentPage").then((m) => ({ default: m.PaymentPage })));
const ThankYouPage = lazy(() => import("@/app/pages/ThankYouPage").then((m) => ({ default: m.ThankYouPage })));
const CompleteProfilePage = lazy(() => import("@/app/pages/CompleteProfilePage").then((m) => ({ default: m.CompleteProfilePage })));

function DashboardLazy() {
  return <Suspense fallback={<SpaFallback />}><DashboardPage /></Suspense>;
}
function PaymentLazy() {
  return <Suspense fallback={<SpaFallback />}><PaymentPage /></Suspense>;
}
function ThankYouLazy() {
  return <Suspense fallback={<SpaFallback />}><ThankYouPage /></Suspense>;
}
function CompleteProfileLazy() {
  return <Suspense fallback={<SpaFallback />}><CompleteProfilePage /></Suspense>;
}
