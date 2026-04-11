import { lazy, Suspense } from "react";
import { createHashRouter } from "react-router";
import { Layout } from "@/app/components/Layout";

const HomePage = lazy(() => import("@/app/pages/HomePage").then(m => ({ default: m.HomePage })));
const PricingPage = lazy(() => import("@/app/pages/PricingPage").then(m => ({ default: m.PricingPage })));
const FeaturesPage = lazy(() => import("@/app/pages/FeaturesPage").then(m => ({ default: m.FeaturesPage })));
const AboutPage = lazy(() => import("@/app/pages/AboutPage").then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import("@/app/pages/ContactPage").then(m => ({ default: m.ContactPage })));
const LoginPage = lazy(() => import("@/app/pages/LoginPage").then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import("@/app/pages/SignupPage").then(m => ({ default: m.SignupPage })));
const DashboardPage = lazy(() => import("@/app/pages/DashboardPage").then(m => ({ default: m.DashboardPage })));
const PaymentPage = lazy(() => import("@/app/pages/PaymentPage").then(m => ({ default: m.PaymentPage })));
const ThankYouPage = lazy(() => import("@/app/pages/ThankYouPage").then(m => ({ default: m.ThankYouPage })));
const CalendarPage = lazy(() => import("@/app/pages/CalendarPage").then(m => ({ default: m.CalendarPage })));
const TermsPage = lazy(() => import("@/app/pages/TermsPage").then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import("@/app/pages/PrivacyPage").then(m => ({ default: m.PrivacyPage })));
const DisclaimerPage = lazy(() => import("@/app/pages/DisclaimerPage").then(m => ({ default: m.DisclaimerPage })));
const RefundPage = lazy(() => import("@/app/pages/RefundPage").then(m => ({ default: m.RefundPage })));
const BlogPage = lazy(() => import("@/app/pages/BlogPage").then(m => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() => import("@/app/pages/BlogPostPage").then(m => ({ default: m.BlogPostPage })));
const ResetPasswordPage = lazy(() => import("@/app/pages/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));

const PageLoader = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 32, height: 32, border: '3px solid #e1e6ec', borderTopColor: '#1a56db', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><HomePage /></Suspense> },
      { path: "pricing", element: <Suspense fallback={<PageLoader />}><PricingPage /></Suspense> },
      { path: "features", element: <Suspense fallback={<PageLoader />}><FeaturesPage /></Suspense> },
      { path: "about", element: <Suspense fallback={<PageLoader />}><AboutPage /></Suspense> },
      { path: "contact", element: <Suspense fallback={<PageLoader />}><ContactPage /></Suspense> },
      { path: "login", element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense> },
      { path: "signup", element: <Suspense fallback={<PageLoader />}><SignupPage /></Suspense> },
      { path: "dashboard", element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense> },
      { path: "payment", element: <Suspense fallback={<PageLoader />}><PaymentPage /></Suspense> },
      { path: "thank-you", element: <Suspense fallback={<PageLoader />}><ThankYouPage /></Suspense> },
      { path: "calendar", element: <Suspense fallback={<PageLoader />}><CalendarPage /></Suspense> },
      { path: "terms", element: <Suspense fallback={<PageLoader />}><TermsPage /></Suspense> },
      { path: "privacy", element: <Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense> },
      { path: "disclaimer", element: <Suspense fallback={<PageLoader />}><DisclaimerPage /></Suspense> },
      { path: "refund", element: <Suspense fallback={<PageLoader />}><RefundPage /></Suspense> },
      { path: "blog", element: <Suspense fallback={<PageLoader />}><BlogPage /></Suspense> },
      { path: "blog/:slug", element: <Suspense fallback={<PageLoader />}><BlogPostPage /></Suspense> },
      { path: "reset-password", element: <Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense> },
    ],
  },
]);
