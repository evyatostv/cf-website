import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL('../supabase/functions/'+path,import.meta.url),'utf8');
const source = read('_shared/wake-grow-receipts.ts').replace('export function','function') +
  read('grow-webhook/index.ts').replace(/^import .*;$/gm,'');

for (const [status, settled, expected] of [
  ['paid','PAID',1], ['paid','DUPLICATE',1], ['refunded','DUPLICATE',0],
  ['paid','MANUAL_REVIEW',0], ['pending',null,0],
]) {
  test('receipt wake after '+status+' / '+settled, async () => {
    let handler;
    const sent=[];
    const tasks=[];
    const env={SUPABASE_URL:'https://internal.example.test',SUPABASE_ANON_KEY:'synthetic',CRON_SECRET:'internal',MAKE_CALLBACK_SECRET:'callback'};
    vm.runInNewContext(stripTypeScriptTypes(source),{
      Deno:{env:{get:k=>env[k]},serve:fn=>{handler=fn;}},
      EdgeRuntime:{waitUntil:task=>{tasks.push(task);}},
      createClient:()=>({rpc:async()=>({data:settled})}),generateLicenseKey:()=> 'synthetic',
      recordAuditEvent:async()=>{},Response,URL,AbortSignal,console:{error(){}},
      fetch:async (url,request)=>{sent.push([url.href,request.headers['x-cron-secret']]);throw new Error('mail transport unavailable');},
    });
    const res=await handler(new Request('https://example.test',{method:'POST',headers:{'x-make-callback-secret':'callback'},
      body:JSON.stringify({orderId:'10000000-0000-4000-8000-000000000001',transactionId:'synthetic',amount:149900,currency:'ILS',status})}));
    await Promise.all(tasks);
    assert.equal(res.status,200);
    assert.equal(sent.length,expected);
    if(expected)assert.deepEqual(sent[0],['https://internal.example.test/functions/v1/process-grow-receipts','internal']);
  });
}
