import { z } from 'zod';

export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new Error(`Validation error: ${issues}`);
    }
    throw error;
  }
}

/**
 * Validates a Binance trading pair symbol.
 * Accepts standard symbols like BTCUSDT, ETHUSDT, etc.
 * Also accepts symbols with numeric prefixes like 1000SATSUSDT, 1INCHUSDT.
 */
export function isValidSymbol(symbol: string): boolean {
  return /^[A-Z0-9]{2,}USDT?$|^[A-Z0-9]{2,}[A-Z]{3,}$/.test(symbol) && symbol.length >= 6;
}

export function validateSymbol(symbol: string): void {
  if (!isValidSymbol(symbol)) {
    throw new Error(`Invalid symbol format: ${symbol}. Expected format like BTCUSDT, ETHBTC, 1000SATSUSDT`);
  }
}

export function validateQuantity(quantity: string): void {
  const num = parseFloat(quantity);
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid quantity: ${quantity}. Must be a positive number`);
  }
}

export function validatePrice(price: string): void {
  const num = parseFloat(price);
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid price: ${price}. Must be a positive number`);
  }
}

export function validateStopPrice(stopPrice: string): void {
  const num = parseFloat(stopPrice);
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid stop price: ${stopPrice}. Must be a positive number`);
  }
}