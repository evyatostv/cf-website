import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import test from 'node:test';

const src = readFileSync(new URL('../src-2/lib/marketing-analytics.ts', import.meta.url), 'utf8')
  .replace(/^import .*;$/m, '').replace('export function', 'function');
function measure(path, referrer = '', consent = true, broken = false) {
  const calls = [];
  const window = {location:{href: 'https://www.clinic-flow.co.il' + path},
    gtag() { if (broken) throw Error('unavailable'); },
    fbq: (...args) => calls.push(args)};
  const context = vm.createContext({window, document:{referrer}, hasMarketingConsent: () => consent, URL});
  vm.runInContext(stripTypeScriptTypes(src), context);
  context.trackMarketingEvent('contact_submitted', 'untrusted-value');
  return calls;
}
test('private routes, query strings, referrers and declined consent suppress events', () => {
  for (const p of ['/checkout/success?order=test','/dashboard','/contact?intent=free-text','/pricing#private']) {
    assert.equal(measure(p).length, 0);
  }
  assert.equal(measure('/contact','https://www.clinic-flow.co.il/dashboard').length, 0);
  assert.equal(measure('/contact','',false).length, 0);
});
test('one throwing SDK leaves the public form operational and drops untrusted values', () => {
  const calls = measure('/contact', '', true, true);
  assert.equal(calls.length, 1);
  assert.deepEqual(Object.keys(calls[0][3]), []);
});
