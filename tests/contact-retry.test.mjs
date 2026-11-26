import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const code = ts.transpile(readFileSync(new URL('../src-2/lib/leads.ts', import.meta.url), 'utf8'),
  { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
const lead = { name: 'Example', email: 'lead@example.invalid', message: 'Synthetic inquiry' };
function createForm(insert) {
  const exports = {};
  const imports = {
    react: { useState: initialize => [initialize()] },
    '@/lib/supabase': { supabase: { from: () => ({ insert }) } },
  };
  runInNewContext(code, { exports, require: name => imports[name], crypto: { randomUUID }, console: {error() {}} });
  return exports.useSubmitLead();
}

test('ambiguous delivery reuses its ID and an acknowledged duplicate completes the intent', async () => {
  const ids = [];
  const submit = createForm(async row => {
    ids.push(row.id);
    if (ids.length === 1) throw Error('connection lost after insert');
    return ids.length === 2 ? { error: {code:'23505', message:'duplicate key value violates unique constraint "contact_messages_pkey"'} } : {};
  });
  await assert.rejects(submit(lead));
  assert.equal((await submit(lead)).ok, true);
  assert.equal((await submit(lead)).ok, true);
  assert.equal(ids[0], ids[1]);
  assert.notEqual(ids[1], ids[2]);
});

test('edited inquiry has a new ID and cannot inherit success from other constraint failures', async () => {
  const ids = [];
  const submit = createForm(async row => { ids.push(row.id); return { error: {code:'23505', message:'other constraint'} }; });
  assert.equal((await submit(lead)).ok, false);
  assert.equal((await submit({...lead, message:'Updated question'})).ok, false);
  assert.notEqual(ids[0], ids[1]);
});

test('oversized user input is rejected before sending', async () => {
  const submit = createForm(() => assert.fail('Unexpected insert'));
  assert.equal((await submit({...lead, message:'x'.repeat(5001)})).ok, false);
});
