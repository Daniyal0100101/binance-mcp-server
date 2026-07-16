import {
  GetAccountInfoSchema,
  GetAssetBalanceSchema,
  GetOpenOrdersSchema,
  GetOrderHistorySchema,
  GetAccountTradesSchema,
  GetTradeFeeSchema,
} from '../types/mcp.js';
import { validateInput, validateSymbol } from '../utils/validation.js';
import { handleBinanceError } from '../utils/error-handling.js';
import { withRetry } from '../utils/retry.js';

export const accountTools = [
  {
    name: 'get_account_info',
    description: 'Get account information including balances, permissions, and trading status',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async (binanceClient: any, args: unknown) => {
      validateInput(GetAccountInfoSchema, args);

      try {
        const accountInfo = await withRetry(() => binanceClient.accountInfo());

        return {
          makerCommission: accountInfo.makerCommission,
          takerCommission: accountInfo.takerCommission,
          buyerCommission: accountInfo.buyerCommission,
          sellerCommission: accountInfo.sellerCommission,
          canTrade: accountInfo.canTrade,
          canWithdraw: accountInfo.canWithdraw,
          canDeposit: accountInfo.canDeposit,
          updateTime: accountInfo.updateTime,
          accountType: accountInfo.accountType,
          permissions: accountInfo.permissions,
          balances: accountInfo.balances
            .filter((balance: any) => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
            .map((balance: any) => {
              const free = balance.free;
              const locked = balance.locked;
              // Use string concatenation to avoid floating-point precision issues
              const total = (Number(free) + Number(locked)).toString();
              return {
                asset: balance.asset,
                free,
                locked,
                total,
              };
            }),
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'get_asset_balance',
    description: 'Get balance for a specific asset (e.g. BTC, USDT)',
    inputSchema: {
      type: 'object',
      properties: {
        asset: {
          type: 'string',
          description: 'Asset symbol, e.g. BTC, USDT, ETH',
        },
      },
      required: ['asset'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = validateInput(GetAssetBalanceSchema, args);

      try {
        const accountInfo = await withRetry(() => binanceClient.accountInfo());
        const balance = accountInfo.balances.find((b: any) => b.asset === input.asset.toUpperCase());

        if (!balance) {
          return {
            asset: input.asset.toUpperCase(),
            free: '0.00000000',
            locked: '0.00000000',
            total: '0.00000000',
            timestamp: Date.now(),
          };
        }

        return {
          asset: balance.asset,
          free: balance.free,
          locked: balance.locked,
          total: (Number(balance.free) + Number(balance.locked)).toString(),
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'get_open_orders',
    description: 'Get current open orders for a trading pair or all pairs',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol. If omitted, returns open orders for all pairs',
        },
      },
      required: [],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = validateInput(GetOpenOrdersSchema, args);

      if (input.symbol) {
        validateSymbol(input.symbol);
      }

      try {
        const openOrders = await withRetry(() =>
          binanceClient.openOrders(input.symbol ? { symbol: input.symbol } : {})
        );

        return {
          symbol: input.symbol || 'ALL',
          orders: openOrders.map((order: any) => ({
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
          })),
          count: openOrders.length,
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'get_order_history',
    description: 'Get historical order records for a trading pair',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol, e.g. BTCUSDT',
        },
        limit: {
          type: 'number',
          description: 'Number of results, default 500',
          default: 500,
        },
      },
      required: ['symbol'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = validateInput(GetOrderHistorySchema, args);
      validateSymbol(input.symbol);

      try {
        const orderHistory = await withRetry(() => binanceClient.allOrders({
          symbol: input.symbol,
          limit: input.limit,
        }));

        return {
          symbol: input.symbol,
          orders: orderHistory.map((order: any) => ({
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
          })),
          count: orderHistory.length,
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'get_account_trades',
    description: 'Get account trade history (executed trades) for a trading pair',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol, e.g. BTCUSDT',
        },
        limit: {
          type: 'number',
          description: 'Number of results, default 500',
          default: 500,
        },
      },
      required: ['symbol'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = validateInput(GetAccountTradesSchema, args);
      validateSymbol(input.symbol);

      try {
        const trades = await withRetry(() => binanceClient.myTrades({
          symbol: input.symbol,
          limit: input.limit,
        }));

        return {
          symbol: input.symbol,
          trades: trades.map((trade: any) => ({
            id: trade.id,
            orderId: trade.orderId,
            price: trade.price,
            qty: trade.qty,
            commission: trade.commission,
            commissionAsset: trade.commissionAsset,
            time: trade.time,
            isBuyer: trade.isBuyer,
            isMaker: trade.isMaker,
            isBestMatch: trade.isBestMatch,
          })),
          count: trades.length,
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'get_trade_fee',
    description: 'Get trading fee rates for a trading pair or all pairs',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol. If omitted, returns fees for all pairs',
        },
      },
      required: [],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = validateInput(GetTradeFeeSchema, args);

      try {
        const fees = await withRetry(() => binanceClient.tradeFee({
          symbol: input.symbol || undefined,
        }));

        return {
          symbol: input.symbol || 'ALL',
          fees: Array.isArray(fees) ? fees : [fees],
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },
];