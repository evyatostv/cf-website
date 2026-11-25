import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../supabase/functions/notify-contact/index.ts', import.meta.url), 'utf8');
const code = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
const id = '00000000-0000-4000-a000-000000000001';
function fixture({ saved = true, failReply = false } = {}) {
  let handler;
  const sent = [], completed = [], lookups = [];
  const contact = { id, name:'Saved name', message:'Private text from saved inquiry', email:'fixture@example.invalid' };
  const db = {
    rpc: async (_fn, args) => ({ data: args.p_contact === id && saved
      ? ['internal','reply'].map(channel => ({contact_id:id, channel, lease_id:'lease'})) : [] }),
    from(table) {
      if (table === 'contact_messages') return { select: () => ({eq: (_key,value) => {
        lookups.push(value); return {maybeSingle: async () => ({data:contact})};
      }}) };
      const query = {eq(key,value) { if (key === 'channel') completed.push(value); return query; }};
      return {update: () => query};
    },
  };
  const imports = {
    'https://deno.land/std@0.168.0/http/server.ts':{serve(fn){handler=fn;}},
    'npm:@supabase/supabase-js@2':{createClient:()=>db},
    '../_shared/send-email.ts':{sendEmail:async mail=>{
      sent.push(mail);
      if (failReply && mail.to === contact.email) throw Error('mock mail unavailable');
      return {id:'fixture-receipt'};
    }},
  };
  runInNewContext(code, {exports:{}, require:key=>imports[key], Response, console:{error(){}},
    Deno:{env:{get:key=>({NOTIFY_CONTACT_SECRET:'test-secret'})[key]}},
    fetch(){throw Error('Unexpected network request');}});
  const request = (secret = '') => new Request('https://example.invalid', { method:'POST',
    headers:{origin:'https://www.clinic-flow.co.il','x-notify-secret':secret},
    body:JSON.stringify({schema:'public',table:'contact_messages',type:'INSERT',
      record:{id,name:'Injected display name',email:'wrong@example.invalid'}}) });
  return {handler,request,sent,lookups,completed};
}

test('the public site origin and unsaved contact cannot trigger dispatch', async () => {
  const f = fixture({saved:false});
  assert.equal((await f.handler(f.request())).status,401);
  assert.equal((await f.handler(f.request('test-secret'))).status,200);
  assert.deepEqual(f.sent,[]);
});

test('verified notifications use only the stored row and stable independent keys', async () => {
  const f = fixture();
  assert.equal((await f.handler(f.request('test-secret'))).status,200);
  assert.deepEqual(f.lookups,[id,id]);
  assert.deepEqual(f.completed,['internal','reply']);
  assert.deepEqual(f.sent.map(mail=>mail.idempotencyKey),['contact-internal:'+id,'contact-reply:'+id]);
  assert.match(f.sent[0].html,/Private text from saved inquiry/);
  assert.equal(f.sent[1].to,'fixture@example.invalid');
  assert.doesNotMatch(f.sent[1].html,/Private text from saved inquiry/);
  assert.doesNotMatch(JSON.stringify(f.sent),/Injected display name|wrong@example.invalid/);
});

test('failed acknowledgement stays retryable without losing the internal completion', async () => {
  const f = fixture({failReply:true});
  assert.equal((await f.handler(f.request('test-secret'))).status,503);
  assert.deepEqual(f.completed,['internal']);
});
