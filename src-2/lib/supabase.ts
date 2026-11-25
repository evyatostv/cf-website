import { createClient } from '@supabase/supabase-js';

// Public anon credentials — safe in the browser (protected by row-level security).
// Hardcoded as a fallback so the site works even when the host env isn't configured;
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY still override these when present.
const FALLBACK_SUPABASE_URL = 'https://dmuwxydmuylcbhcoagri.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtdXd4eWRtdXlsY2JoY29hZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjAyMDYsImV4cCI6MjA4NDk5NjIwNn0.GETQeDKZk9FV41B7HCN95guPEkyWhJSQ8VYb_SNGfWY';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

export type UserAccess = {
  user_id: string;
  plan: 'forever' | 'basic' | 'professional' | 'full' | 'premium' | 'trial';
  is_active: boolean;
  expires_at: string | null;
};

export const PLAN_LABELS: Record<string, string> = {
  forever: 'ClinicFlow — רישיון לצמיתות',
  basic: 'חבילה בסיסית',
  professional: 'חבילה מקצועית',
  full: 'חבילת ניהול מלאה',
  premium: 'חבילת פרימיום',
  trial: 'ניסיון חינם',
};

export async function getPaidUserAccess(userId: string): Promise<UserAccess | null> {
  const { data, error } = await supabase
    .from('user_access')
    .select('user_id,plan,is_active,expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.is_active || (data.expires_at && Date.parse(data.expires_at) <= Date.now()) || !['forever', 'basic', 'professional', 'full', 'premium'].includes(data.plan)) return null;

  const { data: hasPurchase, error: purchaseError } = await supabase.rpc('my_verified_desktop_purchase', { p_plan: data.plan });
  if (purchaseError) throw purchaseError;
  if (hasPurchase !== true) return null;
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

export async function logPolicyAcceptance(
  userId: string,
  userEmail: string,
  plan: string,
  policyVersion: string = '2026-04-07'
): Promise<void> {
  const { error } = await supabase.from('policy_acceptances').insert({
    user_id: userId,
    user_email: userEmail,
    plan,
    policy_version: policyVersion,
    user_agent: navigator.userAgent,
    accepted_at: new Date().toISOString(),
  });
  if (error) console.error('Failed to log policy acceptance:', error);
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
