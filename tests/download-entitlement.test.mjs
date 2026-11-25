import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../supabase/functions/download-installer/index.ts', import.meta.url), 'utf8');
for (const [scenario, plan, purchase, expected] of [
  ['trial', 'trial', true, 403],
  ['active but unpaid', 'forever', false, 403],
  ['verified purchase', 'forever', true, 200],
  ['payment lookup unavailable', 'forever', null, 503],
]) {
  test(scenario, async () => {
    let handler, signed = 0;
    const filters = {};
    const user = { auth: { getUser: async () => ({data: {user: {id: 'buyer'}}}) },
      from: () => ({select() { return this; }, eq() { return this; },
        maybeSingle: () => ({data: {plan, is_active: true}})}) };
    const admin = { from: table => table === 'purchases' ? {
      select() {return this;}, eq(k,v) {filters[k] = v; return this;},
      gt() {return this;}, not() {return this;}, neq() {return this;},
      limit: () => ({data: purchase ? [{payment_id: 'test'}] : [], error: purchase === null}),
    } : {insert: async () => ({})},
    storage: {from: () => ({createSignedUrl: () => {signed++; return {data: {signedUrl: 'https://example.test'}};}})} };
    vm.runInNewContext(stripTypeScriptTypes(source.replace(/^import .*;$/gm, '')), {
      Deno: {env: {get: k => k}, serve: fn => {handler = fn;}},
      createClient: (_, key) => key === 'SUPABASE_ANON_KEY' ? user : admin,
      BUCKET: 'installers', INSTALLER_PATHS: {win:'ClinicFlow-Setup.exe'},
      recordAuditEvent: async () => {}, Response, console, crypto,
    });
    const response = await handler(new Request('https://example.test', {
      method: 'POST', headers: {Authorization: 'Bearer synthetic'}, body: JSON.stringify({os:'win'}),
    }));
    assert.equal(response.status, expected);
    assert.equal(signed, expected === 200 ? 1 : 0);
    if (plan !== 'trial') assert.deepEqual(filters, {user_id:'buyer', plan});
  });
}
