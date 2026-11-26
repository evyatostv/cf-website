import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import EmbeddedPostgres from 'embedded-postgres';

const root = fileURLToPath(new URL('../../', import.meta.url));
const setupOnly = process.argv.length === 3 && process.argv[2] === '--setup-only';
const fromStdin = process.argv.length === 3 && process.argv[2] === '--stdin';
let stage = 'input';
let status;
function expandSql(file) {
  return readFileSync(file,'utf8').split('\n').map(line => line.startsWith('\\ir ')
    ? expandSql(resolve(dirname(file),line.slice(4))) : line).join('\n');
}

let server, db, directory;
try {
  if (process.argv.length > 2 && !setupOnly && !fromStdin) throw Error();
  const inputs = fromStdin ? JSON.parse(readFileSync(0,'utf8')) : {};
  const key = inputs.apiKey ?? process.env.MAKE_GROW_READBACK_KEY;
  const url = inputs.readbackUrl ?? process.env.MAKE_GROW_READBACK_URL;
  const linkId = String(inputs.paymentLinkProcessId ?? process.env.GROW_SANDBOX_LINK_ID ?? '');
  const linkToken = inputs.paymentLinkProcessToken ?? process.env.GROW_SANDBOX_LINK_TOKEN;
  const transactionId = String(inputs.transactionId ?? process.env.GROW_SANDBOX_TRANSACTION_ID ?? '');
  const sourceOrder = inputs.orderId ?? process.env.GROW_SANDBOX_ORDER_ID;
  if (!setupOnly && (!key || !url || !/^[1-9]\d*$/.test(linkId) || !/^[a-zA-Z0-9]{12,128}$/.test(linkToken ?? '')
    || !/^[1-9]\d*$/.test(transactionId))) throw Error();

  stage = 'local database';
  directory = mkdtempSync(join(tmpdir(),'clinicflow-grow-qa-'));
  server = new EmbeddedPostgres({databaseDir:directory,user:'fixture',password:randomUUID(),
    port:54863,persistent:false,onLog(){},onError(){},postgresFlags:['-c','listen_addresses=127.0.0.1']});
  await server.initialise();
  await server.start();
  db = server.getPgClient('postgres','127.0.0.1');
  await db.connect();
  await db.query(expandSql(join(root,'tests/postgres/setup.sql')));
  const scalar = async (sql,args=[]) => Object.values((await db.query(sql,args)).rows[0])[0];
  const user = randomUUID();
  await db.query("insert into auth.users(id,email) values($1,'sandbox-fixture@example.invalid')",[user]);
  const order = await scalar('select public.open_grow_bulk_order($1,1,2)',[user]);
  assert.equal(order.amount,269800); assert.equal(order.quantity,2);
  assert.equal(await scalar('select public.grow_paid_seat_count($1)',[user]),0);
  if (setupOnly) {
    console.log('Local PostgreSQL fixture ready: 2 requested licenses, 269800 agorot, zero granted. Provider was not contacted.');
  } else {
    const orderId = sourceOrder ?? order.id;
    const digest = createHash('sha256').update(linkId+':'+linkToken).digest('hex');
    await db.query('update public.orders set id=$2,grow_link_digest=$3 where id=$1',[order.id,orderId,digest]);
    const localDatabase = {
      from(table) {
        assert.equal(table,'orders'); const filters = {};
        return {
          select(){return this;}, eq(k,v){filters[k]=v;return this;},
          async maybeSingle(){return {data:(await db.query('select grow_link_digest from public.orders where id=$1 and payment_provider=$2',[filters.id,filters.payment_provider])).rows[0]};}
        };
      },
      async rpc(name,args) {
        assert.equal(name,'fulfill_grow_order');
        return {data:await scalar('select public.fulfill_grow_order($1,$2,$3,$4,$5,$6,$7)',
          [args.p_order_id,args.p_transaction_id,args.p_status,args.p_amount,args.p_currency,args.p_payload,args.p_license_key])};
      }
    };
    const env = {MAKE_GROW_READBACK_URL:url,MAKE_GROW_READBACK_KEY:key,MAKE_CALLBACK_SECRET:randomUUID()};
    let handler,lookupCount=0;
    const read = file => readFileSync(join(root,'supabase/functions',file),'utf8').replace(/^import .*;$/gm,'').replace(/^export /gm,'');
    vm.runInNewContext(stripTypeScriptTypes(read('_shared/grow-readback.ts')+read('grow-webhook/index.ts')),{
      Deno:{env:{get:k=>env[k]},serve:fn=>{handler=fn;}},createClient:()=>localDatabase,
      generateLicenseKey:()=>randomUUID(), recordAuditEvent:async()=>{}, wakeGrowReceipts(){},
      URL,Response,TextEncoder,FormData,crypto,AbortSignal,console:{error(){}},
      fetch:async(destination,request)=>{
        assert.equal(destination,url); assert.equal(request.method,'POST'); assert.equal(request.redirect,'error');
        lookupCount++;
        const response=await fetch(destination,request); status=response.status; return response;
      },
    });
    const event = {orderId,transactionId,paymentLinkProcessId:linkId,paymentLinkProcessToken:linkToken,
      status:'paid',amount:269800,currency:'ILS'};
    const call=()=>handler(new Request('http://localhost/grow-webhook',{method:'POST',
      headers:{'x-make-callback-secret':env.MAKE_CALLBACK_SECRET}, body:JSON.stringify(event)}));
    stage='first merchant readback';
    const first=await call(); assert.equal(first.status,200); assert.equal((await first.json()).licenseActivated,true);
    stage='duplicate merchant readback';
    const replay=await call(); assert.equal(replay.status,200); assert.equal((await replay.json()).duplicate,true);
    stage='local entitlement counts';
    assert.equal(lookupCount,2);
    assert.equal(await scalar('select public.grow_paid_seat_count($1)',[user]),2);
    assert.equal(await scalar('select count(*)::int from public.purchases where user_id=$1',[user]),1);
    assert.equal(await scalar('select count(*)::int from public.claim_grow_receipts() where quantity=2 and amount=269800'),1);
    console.log('Verified two real Make readbacks of the sandbox charge: 269800 agorot, 2 local licenses, 1 purchase, 1 queued receipt. No email sent.');
  }
} catch {
  console.error('QA failed during '+stage+(status ? ' (last Make HTTP '+status+')' : '')+'. No provider response or credential was printed.');
  process.exitCode=1;
} finally {
  await db?.end().catch(()=>{});
  await server?.stop().catch(()=>{});
  if(directory) rmSync(directory,{recursive:true,force:true});
}
