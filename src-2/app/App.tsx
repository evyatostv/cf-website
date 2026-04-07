import { RouterProvider } from "react-router";
import { router } from "@/app/routes";
import { AuthProvider } from "@/lib/auth-context";
import { PaymentProvider } from "@/lib/payment-context";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

export default function App() {
  return (
    <AuthProvider>
      <PaymentProvider>
        <RouterProvider router={router} />
        <Analytics />
        <SpeedInsights />
      </PaymentProvider>
    </AuthProvider>
  );
}
