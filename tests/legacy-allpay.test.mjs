import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import fs from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../supabase/functions/allpay-webhook/index.ts',import.meta.url),'utf8');
const code=ts.transpile(source,{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});
const user='12345678-1234-4000-a000-000000000000';
const order='cf_12345678_full_1795500000000';
const unsigned={add_field_1:user,add_field_2:'full',amount:1299,currency:'ILS',order_id:order,status:1};
const key='synthetic-key';
const sha=value=>createHash('sha256').update(value).digest('hex');
const signed={...unsigned,sign:sha([user,'full','ILS',order,key].join(':'))};
function fixture(statusData, result='RECORDED'){
  let handler, queries=0;const grants=[];
  const db={rpc:async(_name,args)=>{grants.push(args);return {data:result}}};
  runInNewContext(code,{exports:{},require:()=>({createClient:()=>db}),Response,URLSearchParams,TextEncoder,
    crypto:webcrypto,AbortSignal,console:{warn(){},error(){}},
    Deno:{serve:fn=>handler=fn,env:{get:keyName=>({ALLPAY_KEY:key,ALLPAY_LOGIN:'synthetic-login'})[keyName]}},
    fetch:async(url,init)=>{
      assert.equal(url,'https://allpay.to/app/?show=paymentstatus&mode=api11');
      assert.equal(init.redirect,'error');
      assert.equal(JSON.parse(init.body).sign,sha(['synthetic-login',order,key].join(':')));
      queries++;return Response.json(statusData);
    }});
  return {send:obj=>handler(new Request('https://local.invalid',{method:'POST',body:JSON.stringify(obj)})),grants,queries:()=>queries};
}
test('signed account and fresh merchant payment details authorize only the verified account and cents',async()=>{
  const f=fixture({order_id:order,currency:'ILS',status:1,amount:'1299.00'});
  assert.equal((await f.send(signed)).status,200);
  assert.equal(f.grants.length,1);
  assert.equal(f.grants[0].p_user,user);assert.equal(f.grants[0].p_charged,129900);
});
test('invalid signature, dispute, test transaction and substituted full identity cannot request status',async()=>{
  for(const body of [{...signed,sign:''},{...signed,add_field_1:user.slice(0,-1)+'1'},{...signed,type:'chargeback'},{...signed,test_mode:1}]) {
    const f=fixture({});assert.notEqual((await f.send(body)).status,200);
    assert.equal(f.queries(),0);assert.equal(f.grants.length,0);
  }
});
test('paymentstatus order, decimal amount, currency, test and status are independently checked',async()=>{
  for(const changes of [{order_id:'wrong'},{amount:1298.99},{amount:'1299.001'},{currency:'USD'},{test_mode:1},{status:0},{status:true},{add_field_1:'other'}]){
    const f=fixture({...unsigned,...changes});assert.notEqual((await f.send(signed)).status,200);
    assert.equal(f.grants.length,0);
  }
});
test('a paid webhook whose order has been refunded only records a hold',async()=>{
  const f=fixture({...unsigned,status:3},'HELD');assert.equal((await f.send(signed)).status,200);
  assert.equal(f.grants[0].p_state,3);
});
