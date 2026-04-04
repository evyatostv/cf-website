import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dmuwxydmuylcbhcoagri.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtdXd4eWRtdXlsY2JoY29hZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjAyMDYsImV4cCI6MjA4NDk5NjIwNn0.GETQeDKZk9FV41B7HCN95guPEkyWhJSQ8VYb_SNGfWY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserAccess = {
  id: string;
  user_id: string;
  email: string;
  plan: 'basic' | 'journal' | 'full' | 'premium' | 'trial';
  is_active: boolean;
  expires_at: string | null;
  notes: string | null;
  granted_at: string;
};

export const PLAN_LABELS: Record<string, string> = {
  basic: 'חבילה בסיסית',
  professional: 'חבילה מקצועית',
  full: 'חבילת ניהול מלאה',
  premium: 'חבילת פרימיום',
  trial: 'ניסיון חינם',
};

export async function getUserAccess(userId: string): Promise<UserAccess | null> {
  const { data, error } = await supabase
    .from('user_access')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch user access:', error);
    return null;
  }

  return data;
}

export type Purchase = {
  id: string;
  user_id: string;
  email: string;
  version: string;
  plan?: string;
  amount?: number;
  payment_id?: string;
  purchased_at: string;
  discount_eligible: boolean;
};

export async function getPurchaseHistory(userId: string): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId)
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch purchases:', error);
    return [];
  }

  return data || [];
}

export async function recordPurchase(
  userId: string,
  email: string,
  plan: string,
  amount?: number,
  paymentId?: string
): Promise<Purchase | null> {
  const { data, error } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      email,
      version: plan,
      plan,
      amount,
      payment_id: paymentId,
      discount_eligible: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to record purchase:', error);
    return null;
  }

  // The on_purchase_sync_access trigger handles user_access automatically
  return data;
}
