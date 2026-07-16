# Binance MCP Server (Hardened Fork)

A [Model Context Protocol](https://modelcontextprotocol.io) server for Binance exchange — market data, account management, and trading. Forked from [ethancod1ng/binance-mcp-server](https://github.com/ethancod1ng/binance-mcp-server) with critical bug fixes, an expanded tool set, and production hardening.

## What's fixed vs the original

| Issue | Original | This fork |
|---|---|---|
| Timestamp sync | Missing `useServerTime` — signed endpoints fail with -1021 | Fixed with `useServerTime: true` |
| Symbol validation | Rejects numeric-prefixed symbols (1000SATSUSDT, 1INCHUSDT) | Fixed regex accepts all valid Binance symbols |
| Order types | Only MARKET and LIMIT | All 7 types: MARKET, LIMIT, STOP_LOSS, STOP_LOSS_LIMIT, TAKE_PROFIT, TAKE_PROFIT_LIMIT, LIMIT_MAKER |
| Time in force | Hardcoded GTC | Configurable GTC, IOC, FOK |
| `cancel_all_orders` | Requires symbol parameter | Symbol is optional — can cancel across all pairs |
| Tool descriptions | Chinese only | English (international) |
| Rate limiting | No retry logic | Exponential backoff with jitter for -1003 and network errors |
| Error format | Doubled `isError` + `error` in JSON | Clean single error format |
| Balance precision | `parseFloat + parseFloat` with FP artifacts | `Number()` based with string preservation |
| Config wiring | `recvWindow`/`timeout` declared but never passed to client | Properly wired |
| MCP SDK | `@modelcontextprotocol/sdk@0.4.0` | `@modelcontextprotocol/sdk@^1.12.1` |
| dotenv | Loads `.env` from cwd at startup | Removed — env vars only via config |
| Vulnerabilities | 13 known (3 moderate, 10 high) | 0 |

## New tools (not in original)

| Tool | Description |
|---|---|
| `get_exchange_info` | Trading rules, lot size filters, price filters, min notional |
| `get_server_time` | Binance server time + local offset for clock sync diagnostics |
| `get_avg_price` | 5-minute average price for a trading pair |
| `get_asset_balance` | Balance for a specific asset |
| `get_account_trades` | Executed trade history for a pair |
| `get_trade_fee` | Trading fee rates |
| `test_order` | Validate order parameters without placing |
| `get_order` | Get details of a specific order by ID |
| `get_dust_assets` | List dust assets convertible to BNB |
| `convert_dust_to_bnb` | Convert dust assets to BNB |

**Total: 20 tools** (up from 10 in the original)

## Installation

```bash
npm install @daniyal0100101/binance-mcp
```

Or use directly with npx:

```bash
npx @daniyal0100101/binance-mcp
```

## Configuration

Add to your MCP client configuration (Claude Desktop, Hermes, Cursor, etc.):

```json
{
  "mcpServers": {
    "binance": {
      "command": "npx",
      "args": ["-y", "@daniyal0100101/binance-mcp"],
      "env": {
        "BINANCE_API_KEY": "your_api_key",
        "BINANCE_API_SECRET": "your_api_secret",
        "BINANCE_TESTNET": "false"
      }
    }
  }
}
```

Set `BINANCE_TESTNET` to `"true"` for testnet mode.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `BINANCE_API_KEY` | Yes | Binance API key |
| `BINANCE_API_SECRET` | Yes | Binance API secret |
| `BINANCE_TESTNET` | No | Set `"true"` for testnet (default: mainnet) |
| `LOG_LEVEL` | No | `info` (default) or `debug` for stack traces |

## Tools Reference

### Market Data (7 tools, no API key needed)

- `get_price` — Current price for a trading pair
- `get_orderbook` — Order book depth data
- `get_klines` — K-line/candlestick history
- `get_24hr_ticker` — 24-hour price change statistics
- `get_exchange_info` — Exchange trading rules and symbol filters
- `get_server_time` — Binance server time for clock sync diagnostics
- `get_avg_price` — 5-minute average price

### Account (6 tools, API key required)

- `get_account_info` — Account info with filtered balances
- `get_asset_balance` — Balance for a specific asset
- `get_open_orders` — Current open orders (all or by pair)
- `get_order_history` — Historical orders for a pair
- `get_account_trades` — Executed trade history
- `get_trade_fee` — Trading fee rates

### Trading (5 tools, API key required)

- `place_order` — Place an order (all 7 Binance order types)
- `test_order` — Test order validation without executing
- `get_order` — Get order details by ID
- `cancel_order` — Cancel a specific order
- `cancel_all_orders` — Cancel all open orders (by pair or all)

### Dust Conversion (2 tools, API key required)

- `get_dust_assets` — List dust assets convertible to BNB
- `convert_dust_to_bnb` — Convert dust to BNB

## Development

```bash
npm install
npm run build       # Compile TypeScript
npm run typecheck   # Type checking without emit
npm run dev         # Development mode with tsx
```

## License

MIT — see [LICENSE](LICENSE)

## Acknowledgments

Originally forked from [ethancod1ng/binance-mcp-server](https://github.com/ethancod1ng/binance-mcp-server) by Ethan, published under MIT.