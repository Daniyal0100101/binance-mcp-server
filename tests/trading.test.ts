import assert from 'node:assert/strict';
import test from 'node:test';
import { dustTools } from '../src/tools/dust.js';
import { tradingTools } from '../src/tools/trading.js';

interface ToolDefinition {
  name: string;
  handler: (client: any, args: unknown) => Promise<any>;
}

function getTool(tools: ToolDefinition[], name: string): ToolDefinition {
  const tool = tools.find(candidate => candidate.name === name);
  assert.ok(tool, `Missing tool: ${name}`);
  return tool;
}

function networkError(): Error & { code: string } {
  return Object.assign(new Error('socket reset'), { code: 'ECONNRESET' });
}

process.env.BINANCE_TESTNET = 'true';

test('LIMIT_MAKER requires a price before calling Binance', async () => {
  let calls = 0;
  const client = {
    orderTest: async () => {
      calls += 1;
    },
  };

  await assert.rejects(
    getTool(tradingTools, 'test_order').handler(client, {
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'LIMIT_MAKER',
      quantity: '0.001',
    }),
    /Price is required for LIMIT_MAKER orders/,
  );
  assert.equal(calls, 0);
});

test('LIMIT_MAKER omits timeInForce', async () => {
  let sentParams: Record<string, unknown> | undefined;
  const client = {
    orderTest: async (params: Record<string, unknown>) => {
      sentParams = params;
    },
  };

  await getTool(tradingTools, 'test_order').handler(client, {
    symbol: 'BTCUSDT',
    side: 'BUY',
    type: 'LIMIT_MAKER',
    quantity: '0.001',
    price: '10000',
  });

  assert.deepEqual(sentParams, {
    symbol: 'BTCUSDT',
    side: 'BUY',
    type: 'LIMIT_MAKER',
    quantity: '0.001',
    price: '10000',
  });
});

const orderCases = [
  { type: 'MARKET', expected: {} },
  { type: 'LIMIT', price: '100', expected: { price: '100', timeInForce: 'GTC' } },
  { type: 'STOP_LOSS', stopPrice: '90', expected: { stopPrice: '90' } },
  { type: 'STOP_LOSS_LIMIT', price: '89', stopPrice: '90', expected: { price: '89', stopPrice: '90', timeInForce: 'GTC' } },
  { type: 'TAKE_PROFIT', stopPrice: '110', expected: { stopPrice: '110' } },
  { type: 'TAKE_PROFIT_LIMIT', price: '111', stopPrice: '110', expected: { price: '111', stopPrice: '110', timeInForce: 'GTC' } },
  { type: 'LIMIT_MAKER', price: '100', expected: { price: '100' } },
] as const;

for (const orderCase of orderCases) {
  test(`test_order builds valid ${orderCase.type} parameters`, async () => {
    let captured: Record<string, unknown> | undefined;
    const client = {
      orderTest: async (params: Record<string, unknown>) => {
        captured = params;
      },
    };

    await getTool(tradingTools, 'test_order').handler(client, {
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: orderCase.type,
      quantity: '0.001',
      ...('price' in orderCase ? { price: orderCase.price } : {}),
      ...('stopPrice' in orderCase ? { stopPrice: orderCase.stopPrice } : {}),
    });

    assert.deepEqual(captured, {
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: orderCase.type,
      quantity: '0.001',
      ...orderCase.expected,
    });
  });
}

const mutationCases = [
  {
    name: 'place_order',
    method: 'order',
    args: {
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: '0.001',
    },
  },
  {
    name: 'cancel_order',
    method: 'cancelOrder',
    args: { symbol: 'BTCUSDT', orderId: 1 },
  },
  {
    name: 'cancel_all_orders',
    method: 'cancelOpenOrders',
    args: { symbol: 'BTCUSDT' },
  },
] as const;

for (const mutation of mutationCases) {
  test(`${mutation.name} does not replay an ambiguous failed mutation`, async () => {
    let calls = 0;
    const client = {
      [mutation.method]: async () => {
        calls += 1;
        throw networkError();
      },
    };

    await assert.rejects(getTool(tradingTools, mutation.name).handler(client, mutation.args));
    assert.equal(calls, 1);
  });
}

test('convert_dust_to_bnb does not replay an ambiguous failed mutation', async () => {
  let calls = 0;
  const client = {
    dustTransfer: async () => {
      calls += 1;
      throw networkError();
    },
  };

  await assert.rejects(
    getTool(dustTools, 'convert_dust_to_bnb').handler(client, { assets: ['BTC'] }),
  );
  assert.equal(calls, 1);
});
