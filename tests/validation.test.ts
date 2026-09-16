import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validatePrice,
  validateQuantity,
  validateStopPrice,
} from '../src/utils/validation.js';

const validators = [validateQuantity, validatePrice, validateStopPrice];

for (const validate of validators) {
  test(`${validate.name} accepts positive decimal strings`, () => {
    assert.doesNotThrow(() => validate('0.001'));
    assert.doesNotThrow(() => validate('42'));
  });

  test(`${validate.name} rejects malformed or non-finite values`, () => {
    for (const value of ['1abc', 'Infinity', 'NaN', ' 1', '1 ', '-1', '0', '']) {
      assert.throws(() => validate(value));
    }
  });
}
