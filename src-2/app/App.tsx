import { RouterProvider } from "react-router";
import { router } from "@/app/routes";
import { AuthProvider } from "@/lib/auth-context";
import { PaymentProvider } from "@/lib/payment-context";

export default function App() {
  return (
    <AuthProvider>
      <PaymentProvider>
        <RouterProvider router={router} />
      </PaymentProvider>
    </AuthProvider>
  );
}
