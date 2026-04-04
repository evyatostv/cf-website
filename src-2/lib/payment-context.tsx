import React, { createContext, useContext, useState } from 'react';
import { supabase, recordPurchase } from './supabase';

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
  basic: {
    name: 'חבילה בסיסית',
    price: 3450,
    currency: 'ILS',
    features: [
      'הפקת סיכומי ביקור מעוצבים',
      'יצירת מסמכי PDF',
      'ניהול יומן פגישות',
      'ניהול חולים ורקע רפואי',
    ],
  },
  professional: {
    name: 'חבילה מקצועית',
    price: 4590,
    currency: 'ILS',
    features: [
      'כל מה שבחבילה הבסיסית',
      'דוח מעקב סטטיסטי',
      'גרפים וניתוח נתונים',
      'יומן אישי ותיוג רשומות',
      'חיפוש וסינון מתקדם',
    ],
  },
  full: {
    name: 'חבילת ניהול מלאה',
    price: 5890,
    currency: 'ILS',
    features: [
      'כל מה שבחבילת ניהול היומן',
      'דוח הכנסות ודוחות פיננסיים',
      'הנפקת קבלות וחשבוניות',
      'מעקב שיטות תשלום',
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

  const processPayment = async (planId: string, email: string, userId: string) => {
    // This is a placeholder - actual payment processing will happen when you provide the payment page
    // For now, this creates a fake payment record
    const plan = PLANS[planId];
    if (!plan) throw new Error('Invalid plan');

    // Generate a fake payment ID (in production, this comes from payment processor)
    const fakePaymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setPaymentId(fakePaymentId);

    // Record the purchase
    const purchase = await recordPurchase(userId, email, planId, plan.price, fakePaymentId);

    if (purchase) {
      setIsPaymentComplete(true);
      return { success: true, paymentId: fakePaymentId, purchase };
    } else {
      throw new Error('Failed to record purchase');
    }
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
