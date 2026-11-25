import { sendOnce } from './email-once.ts';
import { assert, assertEquals } from 'jsr:@std/assert@1';

Deno.test('Grow confirmation sends one transactional message per order and logs accepted deliveries', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = Deno.env.get('RESEND_API_KEY');
  Deno.env.set('RESEND_API_KEY', 'synthetic-test-token');
  const accepted = new Set<string>();
  const logs = new Set<string>();
  let failLog = true;
  let lookupFails = false;
  const store = {
    from: () => {
      let payment = '';
      const chain = {
        select: () => chain,
        eq: (column: string, value: string) => { if (column === 'payment_id') payment = value; return chain; },
        maybeSingle: () => ({ data: logs.has(payment) ? {id:'row'} : null, error: lookupFails ? {} : null }),
        insert: ({payment_id}: {payment_id: string}) => {
          if (failLog) { failLog = false; return { error: {code:'test'} }; }
          logs.add(payment_id);
          return { error: null };
        },
      };
      return chain;
    },
  };
  globalThis.fetch = async (url, options) => {
    assertEquals(String(url), 'https://api.resend.com/emails');
    const key = new Headers(options?.headers).get('Idempotency-Key')!;
    const body = JSON.parse(String(options?.body));
    assertEquals(body.to, ['receipt@example.test']);
    assert(body.text.includes('1,499'));
    assert(!body.text.includes('מע״מ') && !body.text.includes('מע"מ'));
    assert(!body.headers?.['List-Unsubscribe']);
    assert(body.text.includes('/checkout/success?order='));
    accepted.add(key);
    return Response.json({id:key});
  };
  const deliver = (orderId: string) => sendOnce(store, {
    paymentId: orderId, to:'receipt@example.test', template:'order-confirmation',
    props: {name:'',plan:'ClinicFlow Full',orderId,total:'₪1,499',
      ordersUrl:'https://www.clinic-flow.co.il/checkout/success?order='+orderId},
  });
  try {
    lookupFails = true;
    assert((await deliver('order-1')).error);
    assertEquals(accepted.size,0);
    lookupFails = false;
    assert((await deliver('order-1')).error);
    assert((await deliver('order-1')).sent);
    assert((await deliver('order-1')).skipped);
    assert((await deliver('order-2')).sent);
    assertEquals([...accepted],['order-1:order-confirmation','order-2:order-confirmation']);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) Deno.env.delete('RESEND_API_KEY');
    else Deno.env.set('RESEND_API_KEY', originalKey);
  }
});
