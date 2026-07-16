import {
  PlaceOrderSchema,
  TestOrderSchema,
  CancelOrderSchema,
  CancelAllOrdersSchema,
  GetOrderSchema,
} from '../types/mcp.js';
import {
  validateInput,
  validateSymbol,
  validateQuantity,
  validatePrice,
  validateStopPrice,
} from '../utils/validation.js';
import { handleBinanceError } from '../utils/error-handling.js';
import { withRetry } from '../utils/retry.js';
import { isTestnetEnabled, getNetworkMode } from '../config/binance.js';

function validateAndWarnMainnet(): string {
  const networkMode = getNetworkMode();
  if (networkMode === 'mainnet') {
    console.warn('⚠️  WARNING: Trading on MAINNET with REAL money!');
  }
  return networkMode;
}

const ORDER_TYPES_REQUIRING_PRICE = ['LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'];
const ORDER_TYPES_REQUIRING_STOP_PRICE = ['STOP_LOSS', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT', 'TAKE_PROFIT_LIMIT'];

function validateOrderParams(input: any): void {
  validateSymbol(input.symbol);
  validateQuantity(input.quantity);

  if (ORDER_TYPES_REQUIRING_PRICE.includes(input.type) && !input.price) {
    throw new Error(`Price is required for ${input.type} orders`);
  }

  if (ORDER_TYPES_REQUIRING_STOP_PRICE.includes(input.type) && !input.stopPrice) {
    throw new Error(`Stop price is required for ${input.type} orders`);
  }

  if (input.price) {
    validatePrice(input.price as string);
  }

  if (input.stopPrice) {
    validateStopPrice(input.stopPrice as string);
  }
}

function buildOrderParams(input: any): any {
  const params: any = {
    symbol: input.symbol,
    side: input.side,
    type: input.type,
    quantity: input.quantity,
  };

  if (input.price) {
    params.price = input.price;
  }

  if (input.stopPrice) {
    params.stopPrice = input.stopPrice;
  }

  // Set timeInForce for LIMIT-type orders (default GTC)
  if (ORDER_TYPES_REQUIRING_PRICE.includes(input.type) || input.type === 'LIMIT_MAKER') {
    params.timeInForce = input.timeInForce || 'GTC';
  }

  return params;
}

export const tradingTools = [
  {
    name: 'place_order',
    description: 'Place a new order on Binance (supports MARKET, LIMIT, STOP_LOSS, STOP_LOSS_LIMIT, TAKE_PROFIT, TAKE_PROFIT_LIMIT, LIMIT_MAKER)',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol, e.g. BTCUSDT',
        },
        side: {
          type: 'string',
          enum: ['BUY', 'SELL'],
          description: 'Order side: BUY or SELL',
        },
        type: {
          type: 'string',
          enum: ['MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT', 'TAKE_PROFIT_LIMIT', 'LIMIT_MAKER'],
          description: 'Order type',
        },
        quantity: {
          type: 'string',
          description: 'Order quantity (amount of base asset)',
        },
        price: {
          type: 'string',
          description: 'Order price (required for LIMIT, STOP_LOSS_LIMIT, TAKE_PROFIT_LIMIT)',
        },
        stopPrice: {
          type: 'string',
          description: 'Stop price (required for STOP_LOSS, STOP_LOSS_LIMIT, TAKE_PROFIT, TAKE_PROFIT_LIMIT)',
        },
        timeInForce: {
          type: 'string',
          enum: ['GTC', 'IOC', 'FOK'],
          description: 'Time in force: GTC (Good-Til-Cancelled, default), IOC (Immediate-Or-Cancel), or FOK (Fill-Or-Kill)',
        },
      },
      required: ['symbol', 'side', 'type', 'quantity'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const networkMode = validateAndWarnMainnet();

      const input = validateInput(PlaceOrderSchema, args);
      validateOrderParams(input);

      try {
        const orderParams = buildOrderParams(input);
        const orderResult = await withRetry(() => binanceClient.order(orderParams));

        return {
          symbol: orderResult.symbol,
          orderId: orderResult.orderId,
          orderListId: orderResult.orderListId,
          clientOrderId: orderResult.clientOrderId,
          transactTime: orderResult.transactTime,
          price: orderResult.price,
          origQty: orderResult.origQty,
          executedQty: orderResult.executedQty,
          cummulativeQuoteQty: orderResult.cummulativeQuoteQty,
          status: orderResult.status,
          timeInForce: orderResult.timeInForce,
          type: orderResult.type,
          side: orderResult.side,
          fills: orderResult.fills || [],
          network: networkMode,
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'test_order',
    description: 'Test order creation without actually placing it. Validates parameters and checks if the order would be accepted.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol, e.g. BTCUSDT',
        },
        side: {
          type: 'string',
          enum: ['BUY', 'SELL'],
          description: 'Order side: BUY or SELL',
        },
        type: {
          type: 'string',
          enum: ['MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT', 'TAKE_PROFIT_LIMIT', 'LIMIT_MAKER'],
          description: 'Order type',
        },
        quantity: {
          type: 'string',
          description: 'Order quantity',
        },
        price: {
          type: 'string',
          description: 'Order price (required for LIMIT-type orders)',
        },
        stopPrice: {
          type: 'string',
          description: 'Stop price (required for stop-type orders)',
        },
        timeInForce: {
          type: 'string',
          enum: ['GTC', 'IOC', 'FOK'],
          description: 'Time in force',
        },
      },
      required: ['symbol', 'side', 'type', 'quantity'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = validateInput(TestOrderSchema, args);
      validateOrderParams(input);

      try {
        const orderParams = buildOrderParams(input);
        await withRetry(() => binanceClient.orderTest(orderParams));

        return {
          symbol: input.symbol,
          side: input.side,
          type: input.type,
          quantity: input.quantity,
          price: input.price || null,
          stopPrice: input.stopPrice || null,
          timeInForce: input.timeInForce || 'GTC',
          status: 'TEST_PASSED',
          message: 'Order would be accepted. No actual order was placed.',
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'get_order',
    description: 'Get details of a specific order by order ID',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol, e.g. BTCUSDT',
        },
        orderId: {
          type: 'number',
          description: 'Order ID',
        },
      },
      required: ['symbol', 'orderId'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = validateInput(GetOrderSchema, args);
      validateSymbol(input.symbol);

      try {
        const order = await withRetry(() => binanceClient.getOrder({
          symbol: input.symbol,
          orderId: input.orderId,
        }));

        return {
          symbol: order.symbol,
          orderId: order.orderId,
          orderListId: order.orderListId,
          clientOrderId: order.clientOrderId,
          price: order.price,
          origQty: order.origQty,
          executedQty: order.executedQty,
          cummulativeQuoteQty: order.cummulativeQuoteQty,
          status: order.status,
          timeInForce: order.timeInForce,
          type: order.type,
          side: order.side,
          stopPrice: order.stopPrice,
          icebergQty: order.icebergQty,
          time: order.time,
          updateTime: order.updateTime,
          isWorking: order.isWorking,
          origQuoteOrderQty: order.origQuoteOrderQty,
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'cancel_order',
    description: 'Cancel a specific order by order ID',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol, e.g. BTCUSDT',
        },
        orderId: {
          type: 'number',
          description: 'Order ID',
        },
      },
      required: ['symbol', 'orderId'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const networkMode = validateAndWarnMainnet();

      const input = validateInput(CancelOrderSchema, args);
      validateSymbol(input.symbol);

      try {
        const cancelResult = await withRetry(() => binanceClient.cancelOrder({
          symbol: input.symbol,
          orderId: input.orderId,
        }));

        return {
          symbol: cancelResult.symbol,
          origClientOrderId: cancelResult.origClientOrderId,
          orderId: cancelResult.orderId,
          orderListId: cancelResult.orderListId,
          clientOrderId: cancelResult.clientOrderId,
          price: cancelResult.price,
          origQty: cancelResult.origQty,
          executedQty: cancelResult.executedQty,
          cummulativeQuoteQty: cancelResult.cummulativeQuoteQty,
          status: cancelResult.status,
          timeInForce: cancelResult.timeInForce,
          type: cancelResult.type,
          side: cancelResult.side,
          network: networkMode,
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'cancel_all_orders',
    description: 'Cancel all open orders for a trading pair, or all open orders across all pairs if no symbol is provided',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol. If omitted, cancels all open orders across all pairs',
        },
      },
      required: [],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const networkMode = validateAndWarnMainnet();

      const input = validateInput(CancelAllOrdersSchema, args);

      if (input.symbol) {
        validateSymbol(input.symbol);
      }

      try {
        const cancelResults = await withRetry(() =>
          binanceClient.cancelOpenOrders(input.symbol ? { symbol: input.symbol } : {})
        );

        const results = Array.isArray(cancelResults) ? cancelResults : [cancelResults];

        return {
          symbol: input.symbol || 'ALL',
          cancelledOrders: results.map((result: any) => ({
            symbol: result.symbol,
            origClientOrderId: result.origClientOrderId,
            orderId: result.orderId,
            orderListId: result.orderListId,
            clientOrderId: result.clientOrderId,
            price: result.price,
            origQty: result.origQty,
            executedQty: result.executedQty,
            cummulativeQuoteQty: result.cummulativeQuoteQty,
            status: result.status,
            timeInForce: result.timeInForce,
            type: result.type,
            side: result.side,
          })),
          count: results.length,
          network: networkMode,
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },
];