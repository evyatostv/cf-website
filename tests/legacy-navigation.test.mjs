import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<!-- Legacy hash-router URLs[^>]*-->\s*<script>([\s\S]*?)<\/script>/)[1];
const origin = 'https://www.clinic-flow.co.il';
function resolve(hash, search = '') {
  let destination;
  const location = { origin, hash, search, replace: url => { destination = url; } };
  vm.runInNewContext(script, { window: { location }, URL, URLSearchParams });
  return destination;
}
test('installed app links reach the expected website page', () => {
  for (const path of ['/pricing', '/contact', '/dashboard']) {
    assert.equal(resolve('#'+path), origin+path);
  }
  assert.equal(resolve('#/pricing?plan=forever', '?ref=desktop'), origin+'/pricing?plan=forever&ref=desktop');
  assert.equal(resolve('#/pricing?plan=forever', '?plan=other'), origin+'/pricing?plan=forever');
  assert.equal(resolve('#/pricing', '?tag=a&tag=b'), origin+'/pricing?tag=a&tag=b');
  assert.equal(resolve('#features'), undefined);
});
