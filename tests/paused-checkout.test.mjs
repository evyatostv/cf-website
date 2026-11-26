import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../supabase/functions/_shared/payment-provider.ts', import.meta.url), 'utf8');
function check(setting, provider) {
  return vm.runInNewContext(stripTypeScriptTypes(source.replace(/^export /gm, '')) + '\ninactivePaymentProvider(provider, {})', {
    provider, Deno: {env: {get: () => setting}}, Response,
  });
}
test('paused checkout disables every new payment route, independently of installer readiness', async () => {
  for (const provider of ['grow', 'stripe', 'allpay']) {
    const response = check('disabled', provider);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'CHECKOUT_PAUSED');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal(check('grow','grow'),null);
  assert.equal(check('grow','stripe').status,410);
});
