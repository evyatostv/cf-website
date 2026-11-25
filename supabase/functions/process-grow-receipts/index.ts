import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendOnce } from '../_shared/email-once.ts';
import { formatAgorot } from '../_shared/receipt.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) return new Response(null, { status: 401 });
  if (!Deno.env.get('RESEND_API_KEY')) return new Response('Email transport unavailable', { status: 503 });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  if (req.headers.get('x-receipt-dry-run') === 'true') {
    const { data: pending, error } = await db.rpc('pending_grow_receipt_count');
    return Response.json({ dryRun: true, pending }, { status: error ? 503 : 200 });
  }
  const { data: batch, error } = await db.rpc('claim_grow_receipts');
  if (error) return new Response('Receipt queue unavailable', { status: 503 });
  let failed = 0;
  for (const item of batch) {
    const result = await sendOnce(db, {
      paymentId: item.order_id,
      template: 'order-confirmation',
      to: item.recipient,
      props: {
        name: '', plan: 'ClinicFlow Full — רישיון למחשב אחד', orderId: item.order_id,
        total: formatAgorot(item.amount),
        ordersUrl: 'https://www.clinic-flow.co.il/checkout/success?order=' + encodeURIComponent(item.order_id),
      },
    });
    if (result.error || (!result.sent && !result.skipped)) failed++;
  }
  const { data: review, error: reviewError } = await db.rpc('grow_receipts_requiring_review');
  return Response.json({ processed: batch.length, failed, review }, {
    status: failed || review || reviewError ? 503 : 200,
  });
});
