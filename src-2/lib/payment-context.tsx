import React, { createContext, useContext, useState } from 'react';

export interface PlanDetails {
  name: string;
  price: number;
  currency: string;
  features: string[];
}

interface PaymentContextType {
  selectedPlan: string | null;
  planDetails: PlanDetails | null;
  setPlan: (plan: string, details: PlanDetails) => void;
  processPayment: (planId: string, email: string, userId: string) => Promise<any>;
  isPaymentComplete: boolean;
  paymentId: string | null;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

const PLANS: Record<string, PlanDetails> = {
  forever: {
    name: 'ClinicFlow — רישיון לצמיתות',
    price: 1499,
    currency: 'ILS',
    features: [
      'ניהול מטופלים ותיעוד ביקורים',
      'יומן תורים וארכיון מסמכים',
      'דוחות, קבלות וחשבוניות',
      'עבודה אופליין בעמדה אחת',
    ],
  },
};

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const setPlan = (plan: string, details: PlanDetails) => {
    setSelectedPlan(plan);
    setPlanDetails(details);
  };

  // SECURITY: this stub previously fabricated a fake payment id and wrote a
  // `purchases` row client-side, granting a paid plan for free (WEB-002/BE-013).
  // Real payments now go through the AllPay edge function + verified webhook
  // (see PaymentPage.tsx). This client can NEVER self-grant access, so the
  // method is disabled — it throws instead of recording anything.
  const processPayment = async (
    _planId: string,
    _email: string,
    _userId: string,
  ): Promise<never> => {
    throw new Error(
      'Client-side payment processing is disabled. Payments are handled by the server (AllPay) and confirmed via a verified webhook.',
    );
  };

  return (
    <PaymentContext.Provider value={{ selectedPlan, planDetails, setPlan, processPayment, isPaymentComplete, paymentId }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
}

export function getPlanDetails(planId: string): PlanDetails | null {
  return PLANS[planId] || null;
}
