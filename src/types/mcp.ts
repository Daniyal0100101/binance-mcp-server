import { z } from 'zod';

// ── Market Data Schemas ──

export const GetPriceSchema = z.object({
  symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
});

export const GetOrderBookSchema = z.object({
  symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
  limit: z.number().optional().default(100).describe('Depth limit, default 100'),
});

export const GetKlinesSchema = z.object({
  symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
  interval: z.enum(['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M']).describe('Kline interval'),
  limit: z.number().optional().default(500).describe('Number of candles, default 500'),
});

export const Get24hrTickerSchema = z.object({
  symbol: z.string().optional().describe('Trading pair symbol. If omitted, returns 24hr stats for all pairs'),
});

export const GetExchangeInfoSchema = z.object({
  symbol: z.string().optional().describe('Trading pair symbol. If omitted, returns exchange info for all symbols'),
});

export const GetServerTimeSchema = z.object({});

export const GetAvgPriceSchema = z.object({
  symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
});

// ── Account Schemas ──

export const GetAccountInfoSchema = z.object({});

export const GetAssetBalanceSchema = z.object({
  asset: z.string().describe('Asset symbol, e.g. BTC, USDT'),
});

export const GetOpenOrdersSchema = z.object({
  symbol: z.string().optional().describe('Trading pair symbol. If omitted, returns open orders for all pairs'),
});

export const GetOrderHistorySchema = z.object({
  symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
  limit: z.number().optional().default(500).describe('Number of results, default 500'),
});

export const GetAccountTradesSchema = z.object({
  symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
  limit: z.number().optional().default(500).describe('Number of results, default 500'),
});

export const GetTradeFeeSchema = z.object({
  symbol: z.string().optional().describe('Trading pair symbol. If omitted, returns fees for all pairs'),
});

// ── Trading Schemas ──

export const PlaceOrderSchema = z.object({
  symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
  side: z.enum(['BUY', 'SELL']).describe('Order side'),
  type: z.enum(['MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT', 'TAKE_PROFIT_LIMIT', 'LIMIT_MAKER']).describe('Order type'),
  quantity: z.string().describe('Order quantity'),
  price: z.string().optional().describe('Order price (required for LIMIT, STOP_LOSS_LIMIT, TAKE_PROFIT_LIMIT)'),
  stopPrice: z.string().optional().describe('Stop price (required for STOP_LOSS, STOP_LOSS_LIMIT, TAKE_PROFIT, TAKE_PROFIT_LIMIT)'),
  timeInForce: z.enum(['GTC', 'IOC', 'FOK']).optional().describe('Time in force: GTC (default), IOC, or FOK'),
});

export const TestOrderSchema = z.object({
  symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
  side: z.enum(['BUY', 'SELL']).describe('Order side'),
  type: z.enum(['MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT', 'TAKE_PROFIT_LIMIT', 'LIMIT_MAKER']).describe('Order type'),
  quantity: z.string().describe('Order quantity'),
  price: z.string().optional().describe('Order price (required for LIMIT-type orders)'),
  stopPrice: z.string().optional().describe('Stop price (required for stop-type orders)'),
  timeInForce: z.enum(['GTC', 'IOC', 'FOK']).optional().describe('Time in force'),
});

export const CancelOrderSchema = z.object({
  symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
  orderId: z.number().describe('Order ID'),
});

export const CancelAllOrdersSchema = z.object({
  symbol: z.string().optional().describe('Trading pair symbol. If omitted, cancels all open orders across all pairs'),
});

export const GetOrderSchema = z.object({
  symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
  orderId: z.number().describe('Order ID'),
});

// ── Dust Conversion Schemas ──

export const GetDustAssetsSchema = z.object({});

export const ConvertDustSchema = z.object({
  assets: z.array(z.string()).describe('Asset symbols to convert to BNB, e.g. ["BTC", "ETH"]'),
});

// ── Inferred Types ──

export type GetPriceInput = z.infer<typeof GetPriceSchema>;
export type GetOrderBookInput = z.infer<typeof GetOrderBookSchema>;
export type GetKlinesInput = z.infer<typeof GetKlinesSchema>;
export type Get24hrTickerInput = z.infer<typeof Get24hrTickerSchema>;
export type GetExchangeInfoInput = z.infer<typeof GetExchangeInfoSchema>;
export type GetServerTimeInput = z.infer<typeof GetServerTimeSchema>;
export type GetAvgPriceInput = z.infer<typeof GetAvgPriceSchema>;
export type GetAccountInfoInput = z.infer<typeof GetAccountInfoSchema>;
export type GetAssetBalanceInput = z.infer<typeof GetAssetBalanceSchema>;
export type GetOpenOrdersInput = z.infer<typeof GetOpenOrdersSchema>;
export type GetOrderHistoryInput = z.infer<typeof GetOrderHistorySchema>;
export type GetAccountTradesInput = z.infer<typeof GetAccountTradesSchema>;
export type GetTradeFeeInput = z.infer<typeof GetTradeFeeSchema>;
export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;
export type TestOrderInput = z.infer<typeof TestOrderSchema>;
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;
export type CancelAllOrdersInput = z.infer<typeof CancelAllOrdersSchema>;
export type GetOrderInput = z.infer<typeof GetOrderSchema>;
export type GetDustAssetsInput = z.infer<typeof GetDustAssetsSchema>;
export type ConvertDustInput = z.infer<typeof ConvertDustSchema>;