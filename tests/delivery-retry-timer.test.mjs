import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../supabase/functions/retry-deliveries/index.ts',import.meta.url),'utf8');
const code = ts.transpile(source,{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});
const request = () => new Request('https://test.invalid',{method:'POST',body:JSON.stringify({
  slot:'2026-11-25T22:00:00Z',proof:'00000000-0000-4000-a000-000000000001',dryRun:false,
})});
function fixture(mode,receiptStatus=200) {
  const calls=[];
  let handler;
  const env={SUPABASE_URL:'https://project.invalid',SUPABASE_ANON_KEY:'public',CRON_SECRET:'synthetic'};
  runInNewContext(code,{exports:{},require:()=>({createClient:()=>({rpc:async()=>({data:mode})})}),
    Deno:{serve:fn=>{handler=fn},env:{get:key=>env[key]}},AbortSignal,Response,
    fetch:async(url,init)=>{calls.push({url,init});return new Response(null,{status:url.includes('receipts')?receiptStatus:200})}});
  return {handler,calls};
}
test('invalid or replayed proof cannot dispatch either worker',async()=>{
  const f=fixture(null);
  assert.equal((await f.handler(request())).status,401);
  assert.equal(f.calls.length,0);
});
test('database dry run wins over supplied mode and both workers receive no-send instructions',async()=>{
  const f=fixture('DRY_RUN');
  assert.equal((await f.handler(request())).status,200);
  assert.match(f.calls[0].url,/notify-contact\?dryRun=true$/);
  assert.equal(f.calls[1].init.headers['x-receipt-dry-run'],'true');
  for(const call of f.calls) assert.equal(call.init.redirect,'error');
});
test('a partial failure is visible without disclosing provider data',async()=>{
  const f=fixture('DELIVER',503);
  const res=await f.handler(request());
  assert.equal(res.status,503);
  assert.deepEqual(await res.json(),{dryRun:false,contact:200,receipts:503});
});
