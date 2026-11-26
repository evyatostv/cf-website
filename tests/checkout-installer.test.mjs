import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const read = (name) => readFileSync(new URL('../supabase/functions/' + name, import.meta.url), 'utf8');
const source = read('_shared/installers.ts').replace(/^export /gm, '') +
  read('create-grow-payment/index.ts').replace(/^import .*;$/gm, '');

for (const [label, os, size, status] of [
  ['missing Windows installer', 'win', undefined, 503],
  ['empty macOS installer', 'mac', 0, 503],
  ['unsupported platform', 'other', 42, 400],
  ['available Windows installer with pending link', 'win', 42, 200],
]) {
  test(label, async () => {
    let handler;
    const paths = [];
    let orders = 0;
    const db = {
      from:()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{grow_link_digest:'digest'}})}),
      auth: {getUser: async () => ({data: {user: {id: 'buyer'}}})},
      storage: {from: () => ({info: async path => {
        paths.push(path);
        return size === undefined ? {error: {}} : {data: {size}};
      }})},
      rpc: async () => {
        orders++;
        return {data: {result: 'PENDING', id:'order', payment_url: 'https://example.test/pay'}};
      },
    };
    vm.runInNewContext(stripTypeScriptTypes(source), {
      Deno: {env: {get: key => ({ GROW_READBACK_PAGE_CODE:'testpage', MAKE_PAYMENT_WEBHOOK_URL: 'https://hook.eu2.make.com/synthetic-start', MAKE_GROW_NOTIFY_URL: 'https://hook.eu2.make.com/synthetic-notify', MAKE_CALLBACK_SECRET: 'synthetic-secret' })[key]},
        serve: callback => {handler = callback;}},
      githubInstaller: async () => null, growReadbackConfig:()=>({kind:"direct"}),createClient: () => db, inactivePaymentProvider: () => null, recordAuditEvent: async () => {},
      URL, Response, Headers, console,
    });
    const result = await handler(new Request('https://example.test', {method:'POST',
      headers: {Authorization:'Bearer synthetic'}, body: JSON.stringify({
        os, plan:'forever', contact: {fullName:'Test Buyer', phone:'0500000000'},
      })}));
    assert.equal(result.status, status);
    assert.deepEqual(paths, os === 'win' ? ['ClinicFlow-Setup.exe'] : os === 'mac' ? ['ClinicFlow-Setup.dmg'] : []);
    assert.equal(orders, status === 200 ? 1 : 0);
    assert.equal(Boolean((await result.json()).paymentUrl), status === 200);
  });
}
