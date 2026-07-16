export interface BinanceConfig {
  apiKey: string;
  apiSecret: string;
  sandbox: boolean;
  recvWindow?: number;
  timeout?: number;
}