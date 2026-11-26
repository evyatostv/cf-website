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
  ['verified purchase with logging outage', 'forever', true, 200],
  ['payment lookup unavailable', 'forever', null, 503],
]) {
  test(scenario, async () => {
    let handler, signed = 0;
    const filters = {};
    const user = { auth: { getUser: async () => ({data: {user: {id: 'buyer'}}}) },
      from: () => ({select() { return this; }, eq() { return this; },
        maybeSingle: () => ({data: {plan, is_active: true}})}) };
    let logFinished = false;
    const admin = { from: () => ({insert: async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      logFinished = true;
      if (scenario.endsWith('logging outage')) throw new Error('synthetic logging interruption');
      return {};
    }}),
    rpc: (name, params) => {
      assert.equal(name, 'has_verified_desktop_purchase');
      Object.assign(filters, params);
      return {data: purchase, error: purchase === null};
    },
    storage: {from: () => ({createSignedUrl: () => {signed++; return {data: {signedUrl: 'https://example.test'}};}})} };
    vm.runInNewContext(stripTypeScriptTypes(source.replace(/^import .*;$/gm, '')), {
      Deno: {env: {get: k => k}, serve: fn => {handler = fn;}},
      createClient: (_, key) => key === 'SUPABASE_ANON_KEY' ? user : admin,
      githubMacInstaller: async () => null, BUCKET: 'installers', INSTALLER_PATHS: {win:'ClinicFlow-Setup.exe'},
      recordAuditEvent: async () => {}, Response, console, crypto,
    });
    const response = await handler(new Request('https://example.test', {
      method: 'POST', headers: {Authorization: 'Bearer synthetic'}, body: JSON.stringify({os:'win'}),
    }));
    assert.equal(response.status, expected);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(logFinished, expected === 200);
    assert.equal(signed, expected === 200 ? 1 : 0);
    if (plan !== 'trial') assert.deepEqual(filters, {p_customer_id:'buyer', p_plan:plan});
  });
}
