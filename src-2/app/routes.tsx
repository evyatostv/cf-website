import { createHashRouter } from "react-router";
import { HomePage } from "@/app/pages/HomePage";
import { PricingPage } from "@/app/pages/PricingPage";
import { FeaturesPage } from "@/app/pages/FeaturesPage";
import { AboutPage } from "@/app/pages/AboutPage";
import { ContactPage } from "@/app/pages/ContactPage";
import { LoginPage } from "@/app/pages/LoginPage";
import { SignupPage } from "@/app/pages/SignupPage";
import { DashboardPage } from "@/app/pages/DashboardPage";
import { PaymentPage } from "@/app/pages/PaymentPage";
import { ThankYouPage } from "@/app/pages/ThankYouPage";
import { CalendarPage } from "@/app/pages/CalendarPage";
import { TermsPage } from "@/app/pages/TermsPage";
import { PrivacyPage } from "@/app/pages/PrivacyPage";
import { DisclaimerPage } from "@/app/pages/DisclaimerPage";
import { RefundPage } from "@/app/pages/RefundPage";
import { BlogPage } from "@/app/pages/BlogPage";
import { BlogPostPage } from "@/app/pages/BlogPostPage";
import { Layout } from "@/app/components/Layout";

export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "pricing", element: <PricingPage /> },
      { path: "features", element: <FeaturesPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "payment", element: <PaymentPage /> },
      { path: "thank-you", element: <ThankYouPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "terms", element: <TermsPage /> },
      { path: "privacy", element: <PrivacyPage /> },
      { path: "disclaimer", element: <DisclaimerPage /> },
      { path: "refund", element: <RefundPage /> },
      { path: "blog", element: <BlogPage /> },
      { path: "blog/:slug", element: <BlogPostPage /> },
    ],
  },
]);
