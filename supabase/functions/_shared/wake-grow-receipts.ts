// The committed paid order remains the source of delivery work. The scheduled
// worker can recover it even when this immediate notification fails.
export function wakeGrowReceipts() {
  const runtime = (globalThis as typeof globalThis & {EdgeRuntime?: {waitUntil: (task: Promise<void>) => void}}).EdgeRuntime;
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const secret = Deno.env.get('CRON_SECRET');
  if (!runtime || !url || !anon || !secret) return;
  try {
    runtime.waitUntil(fetch(new URL('/functions/v1/process-grow-receipts', url), {
      method:'POST', headers: {Authorization: 'Bearer ' + anon, 'x-cron-secret':secret},
      signal: AbortSignal.timeout(30_000),
    }).then(async response => {
      await response.body?.cancel();
      if (!response.ok) console.error('Grow receipt worker wakeup failed', response.status);
    }).catch(() => {console.error('Grow receipt worker wakeup unavailable');}));
  } catch {
    console.error('Grow receipt worker will run on schedule');
  }
}
