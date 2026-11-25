import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const handlerSource = readFileSync(new URL('../supabase/functions/process-email-lifecycle/index.ts', import.meta.url), 'utf8')
  .replace(/^import .*;$/gm, '');
const original = { id: 'access-1', user_id: 'user-1', email: 'trial@example.test',
  is_active: true, plan: 'trial', expires_at: '2025-01-01T00:00:00Z' };

for (const [scenario, concurrentChange, shouldExpire] of [
  ['unchanged trial', {}, true],
  ['paid upgrade', { plan: 'forever', expires_at: null }, false],
  ['extended trial', { expires_at: '2099-01-01T00:00:00Z' }, false],
  ['already deactivated', { is_active: false }, false],
]) {
  test('trial expiry handles ' + scenario, async () => {
    const current = { ...original, ...concurrentChange };
    const messages = [];
    const db = { from() {
      const filters = {};
      let mutation;
      let selected;
      return {
        select(columns) { selected = columns; return this; },
        eq(column, value) { filters[column] = value; return this; },
        lte() { return this; }, lt() { return this; }, gte() { return this; },
        update(changes) { mutation = changes; return this; },
        async maybeSingle() {
          if (!Object.entries(filters).every(([key, value]) => current[key] === value)) return { data: null };
          Object.assign(current, mutation);
          return { data: { id: current.id } };
        },
        then(resolve) {
          resolve({ data: selected.startsWith('id,') ? [{ ...original }] : [] });
        },
      };
    } };
    let handler;
    vm.runInNewContext(stripTypeScriptTypes(handlerSource), {
      Deno: { env: { get: key => ({ CRON_SECRET: 'test', LIFECYCLE_EMAILS_ENABLED: 'true' })[key] },
        serve: callback => { handler = callback; } },
      Response, createClient: () => db,
      sendOnce: async (_, message) => { messages.push(message.template); return { sent: true }; },
    });
    const result = await handler(new Request('https://example.test', { headers: { 'x-cron-secret': 'test' } }));
    assert.equal(result.status, 200);
    const { sections } = await result.json();
    assert.deepEqual(Object.keys(sections).sort(), ['trial-ended', 'trial-ending', 'win-back']);
    const section = sections['trial-ended'];
    assert.equal(section.sent, Number(shouldExpire));
    assert.equal(section.skipped, Number(!shouldExpire));
    assert.deepEqual(messages, shouldExpire ? ['trial-ended'] : []);
    assert.equal(current.is_active, shouldExpire ? false : (concurrentChange.is_active ?? true));
  });
}
