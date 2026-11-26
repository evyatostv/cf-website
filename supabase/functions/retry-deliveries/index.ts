import { createClient } from 'npm:@supabase/supabase-js@2';

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
Deno.serve(async req => {
  if (req.method !== 'POST') return new Response(null, {status:405});
  const body = await req.json().catch(() => null);
  if (typeof body?.slot !== 'string' || body.slot.length > 40 || !Number.isFinite(Date.parse(body.slot)) ||
      typeof body.proof !== 'string' || !uuid.test(body.proof)) return new Response(null,{status:401});

  const origin = Deno.env.get('SUPABASE_URL')!;
  const cron = Deno.env.get('CRON_SECRET');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!cron || !anon) return new Response(null,{status:503});
  const db = createClient(origin, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {data:mode,error} = await db.rpc('redeem_delivery_retry',{p_slot:body.slot,p_proof:body.proof});
  if (error) return new Response(null,{status:503});
  if (mode !== 'DRY_RUN' && mode !== 'DELIVER') return new Response(null,{status:401});
  const dryRun = mode === 'DRY_RUN';
  async function dispatch(path:string, headers:Record<string,string>) {
    try {
      const response = await fetch(origin+'/functions/v1/'+path, {
        method:'POST', redirect:'error', signal:AbortSignal.timeout(110000),
        headers:{'x-cron-secret':cron!, ...headers}
      });
      await response.body?.cancel();
      return response.status;
    } catch {
      return 503;
    }
  }
  const [contact, receipts] = await Promise.all([
    dispatch('notify-contact?dryRun='+dryRun,{}),
    dispatch('process-grow-receipts',{'x-receipt-dry-run':String(dryRun),Authorization:'Bearer '+anon}),
  ]);
  return Response.json({dryRun,contact,receipts},{status:contact===200 && receipts===200 ? 200 : 503});
});
