import { marketDataTools } from './market-data.js';
import { accountTools } from './account.js';
import { tradingTools } from './trading.js';
import { dustTools } from './dust.js';

export { marketDataTools, accountTools, tradingTools, dustTools };

export const getAllTools = () => {
  return [
    ...marketDataTools,
    ...accountTools,
    ...tradingTools,
    ...dustTools,
  ];
};