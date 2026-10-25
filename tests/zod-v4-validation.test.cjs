const assert = require('node:assert/strict');
const test = require('node:test');

const {
  CancelOrderSchema,
  GetAccountTradesSchema,
  GetKlinesSchema,
  GetOrderBookSchema,
  GetOrderHistorySchema,
  GetOrderSchema,
} = require('../dist/types/mcp.js');
const { validateInput } = require('../dist/utils/validation.js');

const numericSchemas = [
  ['GetOrderBookSchema', GetOrderBookSchema, { symbol: 'BTCUSDT', limit: 10 }],
  ['GetKlinesSchema', GetKlinesSchema, { symbol: 'BTCUSDT', interval: '1m', limit: 10 }],
  ['GetOrderHistorySchema', GetOrderHistorySchema, { symbol: 'BTCUSDT', limit: 10 }],
  ['GetAccountTradesSchema', GetAccountTradesSchema, { symbol: 'BTCUSDT', limit: 10 }],
  ['CancelOrderSchema', CancelOrderSchema, { symbol: 'BTCUSDT', orderId: 10 }],
  ['GetOrderSchema', GetOrderSchema, { symbol: 'BTCUSDT', orderId: 10 }],
];

for (const [name, schema, validInput] of numericSchemas) {
  test(`${name} preserves finite numeric inputs`, () => {
    assert.deepEqual(validateInput(schema, validInput), validInput);
  });

  for (const value of [Infinity, -Infinity]) {
    test(`${name} rejects non-finite numeric input ${String(value)}`, () => {
      const key = 'limit' in validInput ? 'limit' : 'orderId';
      assert.throws(
        () => validateInput(schema, { ...validInput, [key]: value }),
        /^Error: Validation error:/,
      );
    });
  }
}
