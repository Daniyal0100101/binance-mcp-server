export function addDecimalStrings(left: string, right: string): string {
  const decimalPattern = /^\d+(?:\.\d+)?$/;
  if (!decimalPattern.test(left) || !decimalPattern.test(right)) {
    throw new Error('Cannot add invalid decimal values');
  }

  const [leftInteger, leftFraction = ''] = left.split('.');
  const [rightInteger, rightFraction = ''] = right.split('.');
  const scale = Math.max(leftFraction.length, rightFraction.length);

  const toScaledInteger = (integer: string, fraction: string): bigint =>
    BigInt(`${integer}${fraction.padEnd(scale, '0')}`);

  const total = (
    toScaledInteger(leftInteger, leftFraction) +
    toScaledInteger(rightInteger, rightFraction)
  ).toString().padStart(scale + 1, '0');

  if (scale === 0) {
    return total;
  }

  const integer = total.slice(0, -scale);
  const fraction = total.slice(-scale).replace(/0+$/, '');
  return fraction ? `${integer}.${fraction}` : integer;
}
