import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const functions = new URL('../supabase/functions/', import.meta.url);
const read = path => readFileSync(new URL(path, functions), 'utf8').replace(/^import .*;$/gm, '').replace(/^export /gm, '');
const orderId = '12345678-1234-4234-8234-123456789abc';
const env = {
  GROW_READBACK_PAGE_CODE: 'testpage',
  MAKE_PAYMENT_WEBHOOK_URL: 'https://hook.eu2.make.com/synthetic-start',
  MAKE_GROW_NOTIFY_URL: 'https://hook.eu2.make.com/synthetic-notify',
  MAKE_CALLBACK_SECRET: 'synthetic-callback',
  SUPABASE_URL: 'https://synthetic-project.example',
};
function load(path, db, env, fetch, extra = {}) {
  let handler;
  const source = read('_shared/grow-readback.ts') + (path.startsWith('create-') ? read('_shared/installers.ts') : '') + read(path + '/index.ts');
  vm.runInNewContext(stripTypeScriptTypes(source), {
    Deno: { env: { get: key => env[key] }, serve: callback => { handler = callback; } },
    githubMacInstaller: async () => null, createClient: () => db, inactivePaymentProvider: () => null, recordAuditEvent: async () => {},
    generateLicenseKey: () => 'synthetic-key', wakeGrowReceipts() {}, URL, Headers, Response, AbortSignal, console, fetch, crypto, TextEncoder, FormData, ...extra,
  });
  return handler;
}
function post(body, headers = {}) {
  return new Request('https://unit.example', {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
}
const checkout = { plan:'forever', os:'win', price:1, currency:'USD', contact:{ fullName:'Synthetic Buyer', phone:'0501111111' } };
const userHeaders = { Authorization:'Bearer synthetic' };
function database() {
  const state = { orders:0, url:null };
  const db = {
    auth:{ getUser:async () => ({data:{user:{id:'synthetic-buyer',email:'buyer@example.invalid'}}}) },
    storage:{ from:() => ({info:async () => ({data:{size:100}})}) },
    rpc:async (rpc, args) => {
      assert.equal(rpc,'open_grow_order'); assert.equal(args.p_amount,149900);
      if (state.orders) return {data:{result:'PENDING',id:orderId,payment_url:state.url,amount:149900,currency:'ILS'}};
      state.orders++;
      return {data:{result:'NEW',id:orderId,package_id:'forever',amount:149900}};
    },
    from:() => ({
      update(fields) { state.url=fields.payment_url; state.digest=fields.grow_link_digest;return this; },
      eq() {return this;},select() {return this;},maybeSingle:async () => ({data:{id:orderId,grow_link_digest:state.digest}}),
    }),
  };
  return {state,db};
}

test('server fixes checkout price, sends unique notification and return routes, and reuses pending link',async () => {
  const {db,state}=database();
  let outgoing;
  const main=load('create-grow-payment',db,env,async (_url,init)=>{
    assert.equal(outgoing,undefined); outgoing=JSON.parse(init.body);
    return Response.json({paymentUrl:'https://payment.example/synthetic',paymentLinkProcessId:'42',paymentLinkProcessToken:'syntheticLinkToken'});
  });
  assert.equal((await main(post(checkout,userHeaders))).status,200);
  assert.equal(outgoing.amount,149900); assert.equal(outgoing.price,1499);assert.equal(outgoing.currency,'ILS');
  assert.equal(outgoing.notifyUrl,env.MAKE_GROW_NOTIFY_URL);
  assert.equal(new URL(outgoing.successUrl).searchParams.get('order'),orderId);
  assert.equal(new URL(outgoing.cancelUrl).pathname,'/checkout/cancel');
  const pending=await (await main(post(checkout,userHeaders))).json();
  assert.equal(pending.paymentUrl,state.url); assert.equal(pending.amount,149900); assert.equal(pending.currency,'ILS');
  assert.equal(state.orders,1);
});

test('a request cannot purchase several seats with a single order',async ()=>{
  const {db,state}=database();
  const main=load('create-grow-payment',db,env,()=>assert.fail('Unexpected provider call'));
  for (const quantity of [0,2,'2',-1]) {
    assert.equal((await main(post({...checkout,quantity},userHeaders))).status,400);
  }
  assert.equal(state.orders,0);
});

test('subsequent seat sends the SQL price, ignoring caller supplied price and amount', async () => {
  const {db}=database();
  db.rpc=async (rpc,args)=>{
    assert.equal(rpc,'open_additional_grow_order');
    assert.equal(args.p_target_seat,2);
    assert.equal(Object.hasOwn(args,'p_amount'),false);
    return {data:{result:'NEW',id:orderId,package_id:'forever',amount:119900,currency:'ILS'}};
  };
  const handler=load('create-grow-payment',db,env,async (_url,request)=>{
    const body=JSON.parse(request.body);
    assert.equal(body.quantity,1);assert.equal(body.amount,119900);assert.equal(body.price,1199);assert.equal(body.currency,'ILS');
    return Response.json({paymentUrl:'https://payment.example/second',paymentLinkProcessId:'43',paymentLinkProcessToken:'secondSyntheticLinkToken'});
  });
  const response=await handler(post({...checkout,targetSeat:2,price:1,amount:100},userHeaders));
  assert.equal(response.status,200);assert.equal((await response.json()).amount,119900);
});

test('checkout requires both configured Make destinations and a callback credential before creating an order', async () => {
  for (const overrides of [
    { GROW_READBACK_PAGE_CODE: '' }, { MAKE_CALLBACK_SECRET: '' }, { MAKE_CALLBACK_SECRET: '  ' },
    { MAKE_PAYMENT_WEBHOOK_URL: undefined }, { MAKE_GROW_NOTIFY_URL: undefined },
    { MAKE_PAYMENT_WEBHOOK_URL: 'https://unrelated.example/payment' },
  ]) {
    const {db,state} = database();
    const handler = load('create-grow-payment', db, {...env,...overrides}, () => assert.fail('unexpected network'));
    const response = await handler(post(checkout,userHeaders));
    assert.equal(response.status,503);
    assert.equal((await response.json()).code,'PAYMENT_NOTIFICATION_UNAVAILABLE');
    assert.equal(state.orders,0);
  }
});

test('missing notification config creates no order; a lost response never creates a second link', async () => {
  const {db,state}=database();
  for (const suffix of ['', '?ref=notify', '#notification', '/']) {
    const misconfigured=load('create-grow-payment',db,{...env,MAKE_GROW_NOTIFY_URL:env.MAKE_PAYMENT_WEBHOOK_URL+suffix},()=>{throw Error();});
    assert.equal((await misconfigured(post(checkout,userHeaders))).status,503); assert.equal(state.orders,0);
  }
  let attempts=0;
  const main=load('create-grow-payment',db,env,async ()=>{attempts++;throw Error('timeout');});
  const first=await main(post(checkout,userHeaders));
  assert.equal(first.status,503);assert.equal((await first.json()).orderId,orderId);
  const retry=await main(post(checkout,userHeaders));
  assert.equal(retry.status,409);assert.equal((await retry.json()).code,'ORDER_LINK_PENDING');
  assert.equal(attempts,1);assert.equal(state.orders,1);
});

test('provider acknowledgments and unsigned callbacks never settle orders',async ()=>{
  const {createHash} = await import('node:crypto');
  const digest=createHash('sha256').update('42:syntheticLinkToken').digest('hex');
  let called=0;
  const db={rpc:async ()=>{called++;return {data:'PAID'};},from:()=>({
    select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{grow_link_digest:digest}})})};
  const tx={transactionId:'99',transactionToken:'syntheticCaptureToken',paymentLinkProcessId:'42',
    paymentLinkProcessToken:'syntheticLinkToken',statusCode:2,status:'שולם',sum:'1499.00'};
  let evidence=tx;
  const callback=load('grow-webhook',db,env,async (url,init)=>{
    assert.equal(url,'https://secure.meshulam.co.il/api/light/server/1.0/getTransactionInfo');
    assert.equal(init.body.get('pageCode'),env.GROW_READBACK_PAGE_CODE);
    assert.equal(init.redirect,'error');
    return Response.json({status:1,data:evidence});
  });
  const event={orderId,transactionId:'99',transactionToken:tx.transactionToken,currency:'ILS',amount:149900,status:'paid'};
  const auth={'x-make-callback-secret':env.MAKE_CALLBACK_SECRET};
  assert.equal((await callback(post(event))).status,401);
  for(const status of ['success','approved','completed','pending','refunded']){
    await callback(post({...event,status},auth));
  }
  for (const change of [{sum:'14.99'},{sum:'1499.001'},{currency:'USD'},{transactionId:'98'},
    {transactionToken:'differentToken'},{statusCode:11},{paymentLinkProcessId:'43'},
    {paymentLinkProcessToken:'otherLinkToken'},{customFields:{cField1:'another-order'}}]) {
    evidence={...tx,...change};assert.equal((await callback(post(event,auth))).status,409);
  }
  assert.equal(called,0);evidence=tx;
  assert.equal((await callback(post(event,auth))).status,200);assert.equal(called,1);
  evidence={...tx,sum:'1199.00'};
  assert.equal((await callback(post({...event,amount:119900},auth))).status,200);
  assert.equal((await callback(post({...event,amount:149900},auth))).status,409);
  assert.equal(called,2);
});
