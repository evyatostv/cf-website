import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Do NOT hard-throw at import time — supabase.ts is imported eagerly (auth
  // provider), so throwing here white-screens the ENTIRE site. Warn instead and
  // fall back to a syntactically-valid placeholder so createClient() doesn't throw;
  // Supabase-backed features (login, lead form) then fail gracefully at call time
  // until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set in the host env.
  console.error(
    'Supabase env vars missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
    'Auth and the lead form will not work until they are configured in Vercel.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

export type UserAccess = {
  id: string;
  user_id: string;
  email: string;
  plan: 'basic' | 'professional' | 'full' | 'premium' | 'trial';
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
