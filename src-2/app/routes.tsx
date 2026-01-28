import { createHashRouter } from "react-router";
import { HomePage } from "@/app/pages/HomePage";
import { PricingPage } from "@/app/pages/PricingPage";
import { FeaturesPage } from "@/app/pages/FeaturesPage";
import { AboutPage } from "@/app/pages/AboutPage";
import { ContactPage } from "@/app/pages/ContactPage";
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
    ],
  },
]);
