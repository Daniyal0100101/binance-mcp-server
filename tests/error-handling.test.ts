import assert from 'node:assert/strict';
import test from 'node:test';
import { BinanceError, handleBinanceError } from '../src/utils/error-handling.js';

test('network error messages remain actionable', () => {
  const error = Object.assign(new Error('socket reset'), { code: 'ECONNRESET' });

  assert.throws(
    () => handleBinanceError(error),
    (thrown: unknown) => thrown instanceof BinanceError && thrown.message === 'socket reset',
  );
});
