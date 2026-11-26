import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../supabase/functions/stripe-webhook/index.ts',import.meta.url),'utf8');
const code=ts.transpile(source,{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true});
const user='12345678-1234-4000-a000-000000000000';
const baseIntent={id:'pi_Synthetic',livemode:true,status:'succeeded',currency:'ils',amount:129900,amount_received:129900,created:1700000000,metadata:{userId:user,plan:'full'}};
const baseCharge={id:'ch_Synthetic',payment_intent:baseIntent.id,currency:'ils',amount_captured:129900,amount_refunded:0,refunded:false,paid:true,captured:true,livemode:true};
const baseSession={id:'cs_live_Synthetic',payment_intent:baseIntent.id,currency:'ils',amount_total:129900,mode:'payment',payment_status:'paid',livemode:true,metadata:baseIntent.metadata};
function fixture({type='payment_intent.succeeded',object={id:baseIntent.id},intent={},charge={},session=null,live=true}={}){
  let handler,lookups=0;const calls=[],logs=[];
  class Stripe {
    webhooks={constructEventAsync:async(_body,header)=>{if(header!=='valid')throw Error('sensitive provider detail');return {type,livemode:live,data:{object}}}};
    paymentIntents={retrieve:async()=>{lookups++;return {...baseIntent,...intent,latest_charge:{...baseCharge,...charge}}}};
    checkout={sessions:{list:async()=>({data:session?[session]:[],has_more:false}),listLineItems:async()=>({data:[{quantity:1,price:{id:'sku',currency:'ils',unit_amount:129900}}],has_more:false})}};
    disputes={retrieve:async()=>({livemode:true,charge:baseCharge.id,payment_intent:baseIntent.id,status:'lost',amount:129900})};
  }
  const require=name=>name.startsWith('npm:stripe')?Stripe:{createClient:()=>({rpc:async(_fn,args)=>{calls.push(args);return {data:'RECORDED'}}})};
  runInNewContext(code,{exports:{},require,Response,
    console:{warn:(...args)=>logs.push(args),error:(...args)=>logs.push(args)},
    Deno:{serve:fn=>handler=fn, env:{get:n=>n.startsWith('STRIPE_PRICE_')?'sku':'synthetic'}}});
  return {calls,lookups:()=>lookups,logs,send:(header='valid')=>handler(new Request('https://local.invalid',{method:'POST',headers:{'stripe-signature':header},body:'fixture'}))};
}
test('invalid signatures and test-mode events do not read or grant',async()=>{
  const bad=fixture();const res=await bad.send('invalid');assert.equal(res.status,400);assert.equal(await res.text(),'');assert.deepEqual(bad.logs,[]);
  const fake=fixture({live:false});assert.equal((await fake.send()).status,200);assert.equal(fake.lookups(),0);
});
test('unpaid checkout completion never grants a seat',async()=>{
  const f=fixture({type:'checkout.session.completed',object:{...baseSession,payment_status:'unpaid'}});
  assert.equal((await f.send()).status,200);assert.equal(f.lookups(),0);assert.equal(f.calls.length,0);
});
test('checkout and payment-intent events resolve to the same purchase and session reference',async()=>{
  for(const [type,object] of [['checkout.session.completed',baseSession],['payment_intent.succeeded',{id:baseIntent.id}]]){
    const f=fixture({type,object,session:baseSession,intent:{metadata:{}}});
    assert.equal((await f.send()).status,200);
    assert.equal(f.calls[0].p_intent,baseIntent.id);assert.equal(f.calls[0].p_session,baseSession.id);assert.equal(f.calls[0].p_user,user);
  }
});
test('fresh capture identity, amount and currency bind the grant',async()=>{
  for(const opts of [{intent:{amount_received:500}},{charge:{captured:false}},{charge:{currency:'usd'}},{session:{...baseSession,metadata:{...baseSession.metadata,userId:'87654321-1234-4000-a000-000000000001'}}}]){
    const f=fixture(opts);assert.equal((await f.send()).status,409);assert.equal(f.calls.length,0);
  }
});
test('a refund notification with no corresponding fresh refund cannot authorize payment',async()=>{
  const f=fixture({type:'charge.refunded',object:{id:baseCharge.id,payment_intent:baseIntent.id}});
  assert.equal((await f.send()).status,409);assert.equal(f.calls.length,0);
});
test('fresh full refunds and lost disputes can never follow the paid branch; partial is held for review',async()=>{
  for(const [options,state] of [
    [{charge:{refunded:true,amount_refunded:129900}},'refunded'],
    [{charge:{amount_refunded:5000}},'review'],
    [{type:'charge.dispute.closed',object:{id:'dp_Synthetic',payment_intent:baseIntent.id}},'refunded']
  ]){
    const f=fixture(options);assert.equal((await f.send()).status,200);assert.equal(f.calls[0].p_state,state);
  }
});
