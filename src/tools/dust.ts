import {
  GetDustAssetsSchema,
  ConvertDustSchema,
} from '../types/mcp.js';
import { validateInput } from '../utils/validation.js';
import { handleBinanceError } from '../utils/error-handling.js';
import { withRetry } from '../utils/retry.js';
import { getNetworkMode } from '../config/binance.js';

export const dustTools = [
  {
    name: 'get_dust_assets',
    description: 'Get list of dust assets (small balance tokens) convertible to BNB and their estimated BNB value',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async (binanceClient: any, args: unknown) => {
      validateInput(GetDustAssetsSchema, args);

      try {
        const result = await withRetry(() => binanceClient.dustLog());
        return {
          network: getNetworkMode(),
          data: result,
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },

  {
    name: 'convert_dust_to_bnb',
    description: 'Convert dust assets (small balance tokens) to BNB. Requires a list of asset symbols.',
    inputSchema: {
      type: 'object',
      properties: {
        assets: {
          type: 'array',
          items: { type: 'string' },
          description: 'Asset symbols to convert to BNB, e.g. ["BTC", "ETH"]',
        },
      },
      required: ['assets'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const networkMode = getNetworkMode();
      const input = validateInput(ConvertDustSchema, args);

      if (!input.assets || input.assets.length === 0) {
        throw new Error('At least one asset must be specified for dust conversion');
      }

      try {
        const result = await withRetry(() => binanceClient.dustTransfer({
          asset: input.assets,
        }));

        return {
          network: networkMode,
          transferResult: result,
          timestamp: Date.now(),
        };
      } catch (error) {
        handleBinanceError(error);
      }
    },
  },
];