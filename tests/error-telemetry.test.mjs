import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

test('browser exceptions omit request, customer and credential data', () => {
  const source = readFileSync(new URL('../src-2/instrument.ts', import.meta.url), 'utf8')
    .replace('import.meta.env.MODE', '"production"').replace('import.meta.env.MODE', '"production"');
  const js = ts.transpile(source, { module: ts.ModuleKind.CommonJS });
  let options;
  const fakeSdk = {
    init(value) { options = value; },
    globalHandlersIntegration() { return 'global'; },
    eventFiltersIntegration() { return 'filters'; },
  };
  runInNewContext(js, {
    window: {}, URL, location: { origin: 'https://example.invalid' }, exports: {}, require: () => fakeSdk,
  });
  assert.equal(options.sendDefaultPii, false);
  assert.equal(options.defaultIntegrations, false);
  assert.deepEqual(Array.from(options.integrations), ['global', 'filters']);
  const secret = 'synthetic-private-value';
  const cleaned = options.beforeSend({
    request: { url: secret }, user: { email: secret }, breadcrumbs: [{ message: secret }],
    contexts: { customer: secret }, extra: { checkout: secret }, transaction: secret,
    exception: { values: [{ type: 'TypeError', value: secret, stacktrace: { frames: [
      { filename: 'https://example.invalid/assets/site-12345678.js?token=' + secret, lineno: 91, colno: 3, vars: { secret } },
      { filename: 'https://other.invalid/' + secret },
    ] } }] },
  });
  assert.ok(!JSON.stringify(cleaned).includes(secret));
  assert.equal(cleaned.exception.values[0].stacktrace.frames.length, 1);
  assert.equal(cleaned.exception.values[0].stacktrace.frames[0].lineno, 91);
  assert.equal(options.beforeSend({ message: secret }), null);
});
