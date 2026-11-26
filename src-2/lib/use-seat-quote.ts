import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface SeatQuote {
  amount: number;
  currency: 'ILS';
  paidSeats: number;
  targetSeat: number;
}

export function formatSeatPrice(amount: number) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 }).format(amount / 100);
}

function isQuote(data: unknown): data is SeatQuote {
  if (!data || typeof data !== 'object') return false;
  const row = data as Record<string, unknown>;
  return row.currency === 'ILS' && typeof row.amount === 'number' && Number.isSafeInteger(row.amount) && row.amount > 0 &&
    typeof row.paidSeats === 'number' && Number.isSafeInteger(row.paidSeats) && row.paidSeats >= 0 &&
    row.targetSeat === row.paidSeats + 1;
}

export function useSeatQuote(userId: string | undefined, revision: number) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ userId: string; revision: number; attempt: number; quote: SeatQuote | null } | null>(null);
  useEffect(() => {
    if (!userId) return;
    const request = new AbortController();
    async function load() {
      let quote: SeatQuote | null = null;
      try {
        const { data, error } = await supabase.rpc('my_grow_price_quote').abortSignal(request.signal);
        if (!error && isQuote(data)) quote = data;
      } catch { /* Show the retry action on transport failure. */ }
      if (!request.signal.aborted && userId) setResult({ userId, revision, attempt, quote });
    }
    void load();
    return () => request.abort();
  }, [userId, revision, attempt]);
  const current = result?.userId === userId && result?.attempt === attempt && result?.revision === revision ? result : null;
  return { quote: current?.quote, failed: current?.quote === null, retry: () => setAttempt(value => value + 1) };
}
