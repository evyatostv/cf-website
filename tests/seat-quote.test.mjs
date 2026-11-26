import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const source = readFileSync(new URL('../src-2/lib/seat-quote.ts', import.meta.url), 'utf8');
const { parseQuote, matchesQuotedOrder } = vm.runInNewContext(
  stripTypeScriptTypes(source.replace(/^export /gm, '')) + '\n;({ parseQuote, matchesQuotedOrder })'
);
const order = { amount:389700, currency:'ILS', paidSeats:0, targetSeat:1, quantity:3 };

test('a checkout quote must match the requested quantity and the first eligible ordinal', () => {
  assert.equal(parseQuote(order, 3).amount, 389700);
  assert.equal(parseQuote({ ...order, targetSeat:2 }, 3), null);
  assert.equal(parseQuote({ ...order, quantity:undefined }, 3), null);
  assert.equal(parseQuote({ ...order, quantity:2 }, 3), null);
  assert.equal(parseQuote({ ...order, quantity:undefined, amount:149900 }, 1).quantity, 1);
});

test('a link for another quantity, amount or currency cannot be used for the quote', () => {
  const quote = parseQuote(order, 3);
  assert.ok(matchesQuotedOrder(quote, order));
  for (const change of [{ amount:359700 }, { currency:'USD' }, { quantity:2 }, { quantity:undefined }]) {
    assert.equal(matchesQuotedOrder(quote, { ...order, ...change }), false);
  }
});
