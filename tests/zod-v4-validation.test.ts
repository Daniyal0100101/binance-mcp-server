import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';
import {
  CancelOrderSchema,
  GetAccountTradesSchema,
  GetKlinesSchema,
  GetOrderBookSchema,
  GetOrderHistorySchema,
  GetOrderSchema,
} from '../src/types/mcp.js';
import { validateInput } from '../src/utils/validation.js';

const numericSchemas = [
  ['GetOrderBookSchema', GetOrderBookSchema, { symbol: 'BTCUSDT', limit: 10 }],
  ['GetKlinesSchema', GetKlinesSchema, { symbol: 'BTCUSDT', interval: '1m', limit: 10 }],
  ['GetOrderHistorySchema', GetOrderHistorySchema, { symbol: 'BTCUSDT', limit: 10 }],
  ['GetAccountTradesSchema', GetAccountTradesSchema, { symbol: 'BTCUSDT', limit: 10 }],
  ['CancelOrderSchema', CancelOrderSchema, { symbol: 'BTCUSDT', orderId: 10 }],
  ['GetOrderSchema', GetOrderSchema, { symbol: 'BTCUSDT', orderId: 10 }],
] as const;

for (const [name, schema, validInput] of numericSchemas) {
  test(`${name} preserves finite numeric inputs`, () => {
    assert.deepEqual(validateInput(schema as z.ZodType<unknown>, validInput), validInput);
  });

  for (const value of [Infinity, -Infinity]) {
    test(`${name} rejects non-finite numeric input ${String(value)}`, () => {
      const key = 'limit' in validInput ? 'limit' : 'orderId';
      assert.throws(
        () => validateInput(schema as z.ZodType<unknown>, { ...validInput, [key]: value }),
        /^Error: Validation error:/,
      );
    });
  }
}
