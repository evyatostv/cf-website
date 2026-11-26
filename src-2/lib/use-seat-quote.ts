import { useEffect, useState } from 'react';
import { supabase } from './supabase';

import { parseQuote, type SeatQuote } from './seat-quote';

export function useSeatQuote(userId: string | undefined, revision: number, quantity: number | null = 1) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ userId: string; revision: number; attempt: number; quantity: number; quote: SeatQuote | null } | null>(null);
  useEffect(() => {
    if (!userId || quantity === null) return;
    const count = quantity;
    const request = new AbortController();
    async function load() {
      let quote: SeatQuote | null = null;
      try {
        const query = count === 1 ? supabase.rpc('my_grow_price_quote') : supabase.rpc('my_grow_price_quote', { p_quantity: count });
        const { data, error } = await query.abortSignal(request.signal);
        if (!error) quote = parseQuote(data, count);
      } catch { /* Show the retry action on transport failure. */ }
      if (!request.signal.aborted && userId) setResult({ userId, revision, attempt, quantity: count, quote });
    }
    void load();
    return () => request.abort();
  }, [userId, revision, attempt, quantity]);
  const current = result?.userId === userId && result?.attempt === attempt && result?.revision === revision && result?.quantity === quantity ? result : null;
  return { quote: current?.quote, failed: current?.quote === null, retry: () => setAttempt(value => value + 1) };
}
