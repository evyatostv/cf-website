import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../supabase/functions/notify-contact/index.ts', import.meta.url), 'utf8');
const code = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
const id = '00000000-0000-4000-a000-000000000001';
function fixture({ saved = true, failReply = false, staleLease = false, proofMode = null } = {}) {
  let handler;
  const sent = [], completed = [], lookups = [], claimIds = [];
  const contact = { id, name:'Saved name', message:'Private text from saved inquiry', email:'fixture@example.invalid' };
  const db = {
    rpc: async (fn, args) => {
      if (fn === 'redeem_contact_wake') return {data:proofMode};
      claimIds.push(args.p_contact);
      return {data: args.p_contact === id && saved
        ? ['internal','reply'].map(channel => ({contact_id:id, channel, lease_id:'lease'})) : [] };
    },
    from(table) {
      if (table === 'contact_messages') return { select: () => ({eq: (_key,value) => {
        lookups.push(value); return {maybeSingle: async () => ({data:contact})};
      }}) };
      let channel;
      const query = {eq(key,value) { if (key === 'channel') channel=value; return query; },
        is(){return query;},select(){return query;},async maybeSingle(){
          if (staleLease) return {data:null}; completed.push(channel); return {data:{contact_id:id}};
        }};
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
  return {handler,request,sent,lookups,completed,claimIds};
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

test('the optional spreadsheet receiver verifies its secret and deduplicates the stored UUID', () => {
  const appScript = readFileSync(new URL('../integrations/contact-sheet.gs',import.meta.url),'utf8');
  const rows = [];
  let locked = false;
  const numberFormats = [];
  const sheet = {
    getLastRow:()=>rows.length,
    appendRow:row=>{ assert.ok(locked); rows.push(Array.from(row)); },
    getRange(row,col) {
      return { setNumberFormat:fmt=>numberFormats.push([row,col,fmt]),
        setValues:values=>{assert.ok(locked);rows[row-1]=Array.from(values[0]);},
        getValue:()=>rows[row-1]?.[col-1], createTextFinder:value=>({
        matchEntireCell:()=>({findNext:()=>rows.slice(1).some(cells=>cells[0]===value)}),
      }) };
    },
  };
  const context = {
    PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==='CONTACT_SHEET_SECRET'?'shared-test':'sheet'})},
    SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush(){}},
    LockService:{getScriptLock:()=>({waitLock(){locked=true;},releaseLock(){locked=false;}})},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:body=>({setMimeType:()=>JSON.parse(body)})},
  };
  runInNewContext(appScript,context);
  const payload = secret=>({postData:{contents:JSON.stringify({secret,contact:{id,name:'=synthetic formula',phone:'0500000000'}})}});
  assert.throws(()=>context.doPost(payload('wrong')),/Invalid request/);
  assert.equal(rows.length,0);
  assert.equal(context.doPost(payload('shared-test')).storedId,id);
  assert.equal(context.doPost(payload('shared-test')).storedId,id);
  assert.equal(rows.length,2);
  assert.deepEqual(numberFormats,[[2,5,'@']]);
  assert.equal(rows[1][4],'0500000000');
  assert.equal(rows[1][2],"'=synthetic formula");
});

test('expired lease acknowledgement never reports accepted work as complete', async () => {
  const f = fixture({staleLease:true});
  assert.equal((await f.handler(f.request('test-secret'))).status,503);
  assert.deepEqual(f.completed,[]);
});

test('one-time proof restricts delivery to one row and dry runs cannot claim work', async () => {
  for (const mode of [null,'DRY_RUN','DELIVER']) {
    const f = fixture({proofMode:mode});
    const response = await f.handler(new Request('https://example.invalid',{
      method:'POST',body:JSON.stringify({contactId:id,proof:'00000000-0000-4000-a000-000000000002'}),
    }));
    assert.equal(response.status, mode ? 200 : 401);
    assert.deepEqual(f.claimIds,mode==='DELIVER' ? [id] : []);
    if(mode==='DRY_RUN') { assert.equal(f.sent.length,0); assert.deepEqual(await response.json(),{dryRun:true}); }
  }
});
