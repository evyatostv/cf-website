import { createClient } from 'npm:@supabase/supabase-js@2';

type Payload = Record<string, unknown>;
const orderPattern = /^cf_([0-9a-f]{8})_(basic|professional|full|forever)_([0-9]{13})$/;
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const statusEndpoint = 'https://allpay.to/app/?show=paymentstatus&mode=api11';

// v11's Node signature example hashes nonblank string values in key order.
// Numeric amounts/status therefore require a separate authenticated status lookup.
async function signature(payload: Payload, key: string) {
  const values: string[] = [];
  const append = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) values.push(value);
  };
  for (const field of Object.keys(payload).sort()) {
    if (field === 'sign') continue;
    const value = payload[field];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object')
          for (const name of Object.keys(item).sort()) append(item[name]);
      }
    } else append(value);
  }
  const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(values.join(':')+':'+key));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2,'0')).join('');
}

function agorot(value: unknown) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const parts = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!parts) return null;
  return Number(parts[1])*100 + Number((parts[2] || '').padEnd(2,'0'));
}

Deno.serve(async req => {
  if (req.method !== 'POST') return new Response(null,{status:405});
  const key = Deno.env.get('ALLPAY_KEY');
  const login = Deno.env.get('ALLPAY_LOGIN');
  if (!key || !login) return new Response(null,{status:503});
  try {
    let body;
    if (req.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
      const fields = new URLSearchParams(await req.text());
      body = Object.fromEntries(fields);
      if (Object.keys(body).length !== fields.size) return new Response(null,{status:400});
    } else body = await req.json().catch(()=>null);
    // Later Allpay versions also send dispute/token events to legacy URLs.
    // They cannot authorize a purchase.
    if (body?.type || body?.allpay_token || body?.subscription_create ||
        (body?.test_mode !== undefined && ![0,'0',false].includes(body.test_mode))) {
      return new Response(null,{status:409});
    }
    const order = typeof body?.order_id === 'string' && orderPattern.exec(body.order_id);
    if (!order || typeof body.add_field_1 !== 'string' || !uuid.test(body.add_field_1) ||
        !body.add_field_1.startsWith(order[1]) || body.add_field_2 !== order[2] ||
        typeof body.sign !== 'string' || !/^[a-f0-9]{64}$/.test(body.sign) ||
        (await signature(body,key)) !== body.sign) return new Response(null,{status:403});

    const lookup = {login,order_id:body.order_id};
    const response = await fetch(statusEndpoint,{method:'POST',redirect:'error',
      signal:AbortSignal.timeout(10000), headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...lookup,sign:await signature(lookup,key)})});
    if (!response.ok) return new Response(null,{status:503});
    const status = await response.json();
    if ((status.test_mode !== undefined && ![0,'0',false].includes(status.test_mode)) ||
        status.order_id !== body.order_id || status.currency !== 'ILS' || body.currency !== 'ILS' ||
        (status.add_field_1 !== undefined && status.add_field_1 !== body.add_field_1) ||
        (status.add_field_2 !== undefined && status.add_field_2 !== body.add_field_2) ||
        ![1,3,4].includes(Number(status.status))) return new Response(null,{status:409});
    const charged = agorot(status.amount);
    if (Number(status.status) === 1 && (Number(body.status) !== 1 || !charged || agorot(body.amount) !== charged))
      return new Response(null,{status:409});

    const db = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {data,error} = await db.rpc('record_verified_allpay_order',{
      p_order:body.order_id,p_user:body.add_field_1,p_charged:charged,p_state:Number(status.status),
    });
    if (error) return new Response(null,{status:503});
    if (data !== 'RECORDED' && data !== 'DUPLICATE' && data !== 'HELD') {
      console.warn('AllPay verified transaction requires reconciliation');
      return new Response(null,{status:409});
    }
    return Response.json({received:true});
  } catch {
    console.error('AllPay verification unavailable');
    return new Response(null,{status:503});
  }
});
