import {
  GetPriceSchema,
  GetOrderBookSchema,
  GetKlinesSchema,
  Get24hrTickerSchema,
  GetExchangeInfoSchema,
  GetServerTimeSchema,
  GetAvgPriceSchema,
} from '../types/mcp.js';
import { validateInput, validateSymbol } from '../utils/validation.js';
import { handleBinanceError } from '../utils/error-handling.js';
import { withRetry } from '../utils/retry.js';

export const marketDataTools = [
  {
    name: 'get_price',
    description: 'Get current price for a trading pair',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol, e.g. BTCUSDT',
        },
      },
      required: ['symbol'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = validateInput(GetPriceSchema, args);
      validateSymbol(input.symbol);

      try {
        const price = await withRetry(() => binanceClient.prices({ symbol: input.symbol }));
        return {
          symbol: input.symbol,
          price: price[input.symbol],
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'get_orderbook',
    description: 'Get order book depth data for a trading pair',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol, e.g. BTCUSDT',
        },
        limit: {
          type: 'number',
          description: 'Depth limit, default 100',
          default: 100,
        },
      },
      required: ['symbol'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = validateInput(GetOrderBookSchema, args);
      validateSymbol(input.symbol);

      try {
        const orderBook = await withRetry(() => binanceClient.book({
          symbol: input.symbol,
          limit: input.limit,
        }));

        return {
          symbol: input.symbol,
          lastUpdateId: orderBook.lastUpdateId,
          bids: orderBook.bids.slice(0, input.limit).map((bid: any) => ({
            price: bid.price,
            quantity: bid.quantity,
          })),
          asks: orderBook.asks.slice(0, input.limit).map((ask: any) => ({
            price: ask.price,
            quantity: ask.quantity,
          })),
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'get_klines',
    description: 'Get K-line/candlestick historical data for a trading pair',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol, e.g. BTCUSDT',
        },
        interval: {
          type: 'string',
          enum: ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'],
          description: 'Kline interval',
        },
        limit: {
          type: 'number',
          description: 'Number of candles, default 500',
          default: 500,
        },
      },
      required: ['symbol', 'interval'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = validateInput(GetKlinesSchema, args);
      validateSymbol(input.symbol);

      try {
        const klines = await withRetry(() => binanceClient.candles({
          symbol: input.symbol,
          interval: input.interval,
          limit: input.limit,
        }));

        return {
          symbol: input.symbol,
          interval: input.interval,
          data: klines.map((kline: any) => ({
            openTime: kline.openTime,
            open: kline.open,
            high: kline.high,
            low: kline.low,
            close: kline.close,
            volume: kline.volume,
            closeTime: kline.closeTime,
            quoteAssetVolume: kline.quoteAssetVolume,
            numberOfTrades: kline.numberOfTrades,
            takerBuyBaseAssetVolume: kline.takerBuyBaseAssetVolume,
            takerBuyQuoteAssetVolume: kline.takerBuyQuoteAssetVolume,
          })),
          count: klines.length,
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'get_24hr_ticker',
    description: 'Get 24-hour price change statistics for a trading pair or all pairs',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol. If omitted, returns 24hr stats for all pairs (Warning: large response)',
        },
      },
      required: [],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = validateInput(Get24hrTickerSchema, args);

      if (input.symbol) {
        validateSymbol(input.symbol);
      }

      try {
        if (input.symbol) {
          const ticker = await withRetry(() => binanceClient.dailyStats({ symbol: input.symbol }));
          return {
            symbol: input.symbol,
            data: ticker,
            timestamp: Date.now(),
          };
        } else {
          const tickers = await withRetry(() => binanceClient.dailyStats());
          const data = Array.isArray(tickers) ? tickers : [tickers];
          return {
            count: data.length,
            data,
            timestamp: Date.now(),
          };
        }
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'get_exchange_info',
    description: 'Get exchange trading rules, symbol filters (lot size, price filter, min notional), and rate limits',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol. If omitted, returns info for all symbols (Warning: large response)',
        },
      },
      required: [],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = validateInput(GetExchangeInfoSchema, args);

      if (input.symbol) {
        validateSymbol(input.symbol);
      }

      try {
        const exchangeInfo = await withRetry(() => binanceClient.exchangeInfo());
        const symbols = input.symbol
          ? exchangeInfo.symbols.filter((s: any) => s.symbol === input.symbol)
          : exchangeInfo.symbols;

        return {
          timezone: exchangeInfo.timezone,
          serverTime: exchangeInfo.serverTime,
          rateLimits: exchangeInfo.rateLimits,
          symbols: symbols.map((s: any) => ({
            symbol: s.symbol,
            status: s.status,
            baseAsset: s.baseAsset,
            quoteAsset: s.quoteAsset,
            filters: s.filters,
            permissions: s.permissions,
          })),
          count: symbols.length,
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'get_server_time',
    description: 'Get Binance server time — useful for diagnosing clock sync issues',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async (binanceClient: any, args: unknown) => {
      validateInput(GetServerTimeSchema, args);

      try {
        const serverTime = await withRetry(() => binanceClient.time());
        const localTime = Date.now();
        const offset = serverTime - localTime;
        return {
          serverTime,
          localTime,
          offsetMs: offset,
          offsetSeconds: Math.round(offset / 1000),
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'get_avg_price',
    description: 'Get current average price for a trading pair (5-minute average)',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair symbol, e.g. BTCUSDT',
        },
      },
      required: ['symbol'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = validateInput(GetAvgPriceSchema, args);
      validateSymbol(input.symbol);

      try {
        const avgPrice = await withRetry(() => binanceClient.avgPrice({ symbol: input.symbol }));
        return {
          symbol: input.symbol,
          mins: avgPrice.mins,
          price: avgPrice.price,
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },
];