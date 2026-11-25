import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const functions = new URL('../supabase/functions/', import.meta.url);
const read = path => readFileSync(new URL(path, functions), 'utf8').replace(/^import .*;$/gm, '').replace(/^export /gm, '');
const orderId = '12345678-1234-4234-8234-123456789abc';
const env = {
  MAKE_PAYMENT_WEBHOOK_URL: 'https://hook.eu2.make.com/synthetic-start',
  MAKE_GROW_NOTIFY_URL: 'https://hook.eu2.make.com/synthetic-notify',
  MAKE_CALLBACK_SECRET: 'synthetic-callback',
  SUPABASE_URL: 'https://synthetic-project.example',
};
function load(path, db, env, fetch, extra = {}) {
  let handler;
  const source = (path.startsWith('create-') ? read('_shared/installers.ts') : '') + read(path + '/index.ts');
  vm.runInNewContext(stripTypeScriptTypes(source), {
    Deno: { env: { get: key => env[key] }, serve: callback => { handler = callback; } },
    createClient: () => db, inactivePaymentProvider: () => null, recordAuditEvent: async () => {},
    generateLicenseKey: () => 'synthetic-key', wakeGrowReceipts() {}, URL, Headers, Response, AbortSignal, console, fetch, ...extra,
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
      if (state.orders) return {data:{result:'PENDING',id:orderId,payment_url:state.url}};
      state.orders++;
      return {data:{result:'NEW',id:orderId,package_id:'forever',amount:149900}};
    },
    from:() => ({
      update(fields) { state.url=fields.payment_url;return this; },
      eq() {return this;},select() {return this;},maybeSingle:async () => ({data:{id:orderId}}),
    }),
  };
  return {state,db};
}

test('server fixes checkout price, sends unique notification and return routes, and reuses pending link',async () => {
  const {db,state}=database();
  let outgoing;
  const main=load('create-grow-payment',db,env,async (_url,init)=>{
    assert.equal(outgoing,undefined); outgoing=JSON.parse(init.body);
    return Response.json({paymentUrl:'https://payment.example/synthetic'});
  });
  assert.equal((await main(post(checkout,userHeaders))).status,200);
  assert.equal(outgoing.amount,149900); assert.equal(outgoing.price,1499);assert.equal(outgoing.currency,'ILS');
  assert.equal(outgoing.notifyUrl,env.MAKE_GROW_NOTIFY_URL);
  assert.equal(new URL(outgoing.successUrl).searchParams.get('order'),orderId);
  assert.equal(new URL(outgoing.cancelUrl).pathname,'/checkout/cancel');
  assert.equal((await (await main(post(checkout,userHeaders))).json()).paymentUrl,state.url);
  assert.equal(state.orders,1);
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
  let called=0;
  const callback=load('grow-webhook',{rpc:async ()=>{called++;return {data:'PAID'};}},env);
  const event={orderId,transactionId:'synthetic-capture',currency:'ILS',amount:149900,status:'paid'};
  assert.equal((await callback(post(event))).status,401);
  for(const status of ['success','approved','completed','pending']){
    await callback(post({...event,status},{'x-make-callback-secret':env.MAKE_CALLBACK_SECRET}));
  }
  assert.equal(called,0);
  assert.equal((await callback(post(event,{'x-make-callback-secret':env.MAKE_CALLBACK_SECRET}))).status,200);
  assert.equal(called,1);
});
