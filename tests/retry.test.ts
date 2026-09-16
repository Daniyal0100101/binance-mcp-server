import assert from 'node:assert/strict';
import test from 'node:test';
import { withRetry } from '../src/utils/retry.js';

test('withRetry retries transient failures for read-only callers', async () => {
  let attempts = 0;

  const result = await withRetry(async () => {
    attempts += 1;
    if (attempts < 3) {
      throw Object.assign(new Error('rate limited'), { code: -1003 });
    }
    return 'ok';
  }, 3, 1);

  assert.equal(result, 'ok');
  assert.equal(attempts, 3);
});

test('withRetry does not retry permanent Binance errors', async () => {
  let attempts = 0;

  await assert.rejects(
    withRetry(async () => {
      attempts += 1;
      throw Object.assign(new Error('invalid symbol'), { code: -1121 });
    }, 3, 1),
    /invalid symbol/,
  );

  assert.equal(attempts, 1);
});
