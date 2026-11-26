import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const code = readFileSync(new URL('../src-2/lib/hosted-metrics.ts',import.meta.url),'utf8')
  .replace(/^import .*;$/gm,'').replace('export function','function');
test('hosted metrics require consent at send time and safe current, event and referring pages', () => {
  const base = 'https://www.clinic-flow.co.il';
  const location = new URL('/pricing',base);
  let consent=true, referrer=true;
  const allow = vm.runInNewContext(stripTypeScriptTypes(code)+'\nallowHostedMetric',{
    URL, window:{location}, PUBLIC_MARKETING_PATHS:new Set(['/pricing']),
    hasMarketingConsent:()=>consent, hasSafeMarketingReferrer:()=>referrer,
  });
  const event = {type:'pageview',url:location.href};
  assert.equal(allow(event),event);
  for (const url of ['/login','/pricing?order=fixture','/pricing#private','https://external.example/pricing','https://user@www.clinic-flow.co.il/pricing']) {
    assert.equal(allow({...event,url:new URL(url,base).href}),null);
  }
  location.pathname='/dashboard'; assert.equal(allow(event),null);
  location.pathname='/pricing'; referrer=false; assert.equal(allow(event),null);
  referrer=true; consent=false; assert.equal(allow(event),null);
});
