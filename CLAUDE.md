# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build and Run:**
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm start` - Run the compiled MCP server
- `npm run dev` - Run in development mode with tsx (no compilation needed)


**Code Quality:**
- `npm run lint` - Run ESLint on TypeScript files
- `npm run typecheck` - Run TypeScript type checking without emitting files

**Environment Setup:**
- Export the variables shown in `.env.example`; the server does not load `.env` files itself
- Set `BINANCE_TESTNET=true` for safe testing; false or unset selects mainnet

**Docker Deployment:**
- `docker build -t binance-mcp-server .` - Build Docker image

## Architecture Overview

This is a **Model Context Protocol (MCP) server** that exposes Binance exchange API functionality to Claude Code through standardized tools.

### Core Architecture

**MCP Server Flow:**
1. `BinanceMCPServer` class initializes with environment validation
2. Server registers 20 tools across 4 categories (market data, account, trading, dust conversion)
3. Uses `StdioServerTransport` for Claude Code communication
4. Each tool call is validated, executed via Binance client, and results returned as JSON

**Tool System:**
- Tools are defined as objects with `name`, `description`, `inputSchema`, and `handler`
- All tools use Zod schemas for input validation from `src/types/mcp.ts`
- Tool handlers receive a Binance client instance and validated arguments
- Results are automatically JSON-stringified for MCP protocol

### Key Components

**Configuration (`src/config/binance.ts`):**
- Environment variable validation on startup
- Binance client configuration with API keys
- Testnet/mainnet endpoint selection

**Tool Categories:**
- **Market Data** (`src/tools/market-data.ts`): 7 public-data tools
- **Account** (`src/tools/account.ts`): 6 signed read-only tools
- **Trading** (`src/tools/trading.ts`): 5 order tools
- **Dust** (`src/tools/dust.ts`): 2 dust-conversion tools

**Error Handling (`src/utils/error-handling.ts`):**
- Sanitizes sensitive information from error messages before logging
- Handles Binance-specific error codes with user-friendly messages
- All errors are caught and returned as structured JSON responses

**Security Model:**
- API credentials loaded from environment variables only
- Trading functions explicitly check `BINANCE_TESTNET=true` before execution
- Input validation prevents malformed requests to Binance API
- Error sanitization removes API keys/secrets from logs

### Working with Tools

When adding new tools:
1. Define input schema in `src/types/mcp.ts` using Zod
2. Add tool implementation to appropriate file in `src/tools/`
3. Export from `src/tools/index.ts`
4. Tool will be automatically registered by `setupTools()` method

Tool handlers should:
- Use `validateInput()` with the appropriate schema
- Call `validateSymbol()` for trading pair symbols
- Use `handleBinanceError()` for Binance API error handling
- Return plain objects (not wrapped in additional response structure)

### Binance API Integration

Uses `binance-api-node` library with rate limiting respect. The client is initialized once and reused across all tool calls. Testnet mode is controlled by environment variable and enforced at the tool level for trading operations.

## Docker Deployment

The MCP server can be deployed using Docker for easy containerization and deployment.

### Prerequisites

- Docker installed
- `.env` file configured with Binance API credentials

### Manual Docker Build

1. **Build the Docker image:**
   ```bash
   docker build -t binance-mcp-server .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name binance-mcp-server \
     --env-file .env \
     binance-mcp-server
   ```

### Configuration

The Docker deployment uses the following environment variables:

- `BINANCE_API_KEY` - Your Binance API key
- `BINANCE_API_SECRET` - Your Binance API secret  
- `BINANCE_TESTNET` - Set to `true` for testnet (default: `true`)
- `MCP_SERVER_NAME` - Server name identifier
- `MCP_SERVER_VERSION` - Server version
- `LOG_LEVEL` - Logging level (info, debug, error)

### Security Considerations

- The container runs as a non-root user for security
- API credentials are loaded from environment variables only
- Mainnet writes are possible when `BINANCE_TESTNET` is false and operate on real funds; use testnet for development