import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../src-2/lib/checkout-status.ts', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture({ online = true, hidden = false } = {}) {
  const timers = new Map();
  const seen = [];
  let seq = 0;
  const watch = vm.runInNewContext(stripTypeScriptTypes(source.replace(/^export /gm, '')) + '\nwatchOrderStatus', {
    navigator: { onLine: online }, document: { hidden },
    window: {
      setTimeout: (run, delay) => { timers.set(++seq, { run, delay }); return seq; },
      clearTimeout: id => timers.delete(id),
    },
  });
  return { timers, seen, start: read => watch(read, value => seen.push(value)) };
}

test('interrupted payment lookup retries, pending backs off, paid stops', async () => {
  const f = fixture();
  const responses = [() => { throw Error('offline'); }, () => ({error: {}}),
    () => ({data: {status: 'PENDING'}}), () => ({data: {status: 'PAID'}})];
  f.start(() => responses.shift()());
  await tick();
  for (const delay of [4000, 8000, 16000]) {
    const [{run, delay: actual}] = f.timers.values();
    assert.equal(actual, delay);
    f.timers.clear();
    await run();
  }
  assert.deepEqual(f.seen, ['connection','connection','pending','paid']);
  assert.equal(f.timers.size, 0);
});

test('offline and hidden tabs avoid repeated lookups; abandoned requests cannot update a different order', async () => {
  for (const [options, expected] of [[{online:false}, ['connection']], [{hidden:true}, []]]) {
    const f = fixture(options);
    let reads = 0;
    f.start(() => { reads++; });
    await tick();
    assert.equal(reads, 0);
    assert.deepEqual(f.seen, expected);
    assert.equal(f.timers.size, 0);
  }
  const f = fixture();
  let finish;
  const stop = f.start(() => new Promise(resolve => { finish = resolve; }));
  stop();
  finish({data:{status:'PAID'}});
  await tick();
  assert.deepEqual(f.seen, []);
});

test('missing, reviewed, reversed and unsuccessful orders are terminal', async () => {
  for (const [value, expected] of [[null,'unavailable'], ['MANUAL_REVIEW','review'],
    ['REFUNDED','reversed'], ['CHARGED_BACK','reversed'], ['CANCELLED','failed'], ['FAILED','failed']]) {
    const f = fixture();
    f.start(() => ({data:value ? {status:value} : null}));
    await tick();
    assert.deepEqual(f.seen, [expected]);
    assert.equal(f.timers.size,0);
  }
});
