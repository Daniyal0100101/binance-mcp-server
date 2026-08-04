# Binance MCP Server AGENTS.md

This file provides guidance to AI agents (Claude Code, Hermes, etc.) when working with the Binance MCP Server repository.

## Quick Start

```bash
cd /home/daniyal/projects/binance-mcp-server
npm install
npm run build
npm run dev          # development with tsx
# or
npm start           # run compiled server
```

## Project Overview

**Purpose:** Hardened MCP server for Binance market data, account management, and trading (testnet only).

**Package:** `@daniyal0100101/binance-mcp@2.0.0` (npmjs.org + GitHub Packages)

**Status:** Active production — consumed by Hermes Agent via `npx -y @daniyal0100101/binance-mcp`

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run typecheck` | Type check without emit |
| `npm run lint` | ESLint on TypeScript files |
| `npm run dev` | Run with `tsx` (no compilation) |
| `npm run watch` | File watch + auto-restart |
| `npm publish --access public --otp=<code>` | Publish to npmjs.org (requires 2FA) |
| `npm publish` | Publish to GitHub Packages (auto on push to main) |

## Architecture Highlights

- **MCP SDK:** 1.12.1 with `{ capabilities: { tools: {} } }`
- **Binance Client:** `useServerTime: true`, `recvWindow: 5000`, `timeout: 15000`
- **20 Tools:** 7 market data, 6 account, 5 trading (testnet), 2 dust
- **All 7 order types:** MARKET, LIMIT, STOP_LOSS, STOP_LOSS_LIMIT, TAKE_PROFIT, TAKE_PROFIT_LIMIT, LIMIT_MAKER
- **Validation:** Zod schemas in `src/types/mcp.ts`
- **Error handling:** Sanitized errors, exponential backoff for -1003/-1021

## Critical Files

| File | Purpose |
|------|---------|
| `src/server.ts` | MCP server class, Binance client init, tool registration |
| `src/config/binance.ts` | Env validation, config wiring |
| `src/tools/market-data.ts` | 7 market data tools |
| `src/tools/account.ts` | 6 account tools |
| `src/tools/trading.ts` | 5 trading tools (testnet only) |
| `src/tools/dust.ts` | 2 dust conversion tools |
| `src/utils/validation.ts` | Symbol/quantity/price validation |
| `src/utils/error-handling.ts` | Error sanitization, Binance error mapping, retry logic |
| `.github/workflows/ci.yml` | CI/CD: build, typecheck, audit, dual publish |
| `.npmrc` | Scope mapping to GitHub Packages |

## Adding New Tools

1. Define Zod schema in `src/types/mcp.ts`
2. Implement handler in appropriate `src/tools/*.ts`
3. Export from `src/tools/index.ts`
4. Run `npm run build && npm run typecheck`

## Testing

```bash
# Verify tool count
node -e "const { getAllTools } = require('./dist/tools/index.js'); console.log(getAllTools().length + ' tools')"

# Type check
npm run typecheck

# Lint
npm run lint
```

## Environment

```bash
# Copy and configure
cp .env.example .env
# Required:
BINANCE_API_KEY=your_key
BINANCE_API_SECRET=your_secret
BINANCE_TESTNET=true  # trading tools require this
```

## CI/CD Pipeline

- **Every push/PR:** Build (Node 18/20/22), typecheck, tool count check, npm audit
- **Every push/PR:** Security audit (OSV + secret scan)
- **Push to main:** Auto-publish to GitHub Packages (uses `GITHUB_TOKEN`)
- **GitHub Release:** Auto-publish to npmjs.org (uses `NPM_TOKEN` + provenance)

## Documentation

- **AGENT_OS (durable layer):** `/mnt/c/Users/DANIYAL/Documents/Ideaverse/AGENT_OS/01_PROJECTS/binance-mcp-server/`
  - `PROJECT_INDEX.md` — project overview, status, links
  - `PRD.md` — product requirements
  - `ARCHITECTURE.md` — system architecture
  - `UI_SPEC.md` — tool interface specification
  - `TASKS.md` — task backlog
  - `RISKS.md` — risk register
  - `DECISIONS.md` — key decisions
  - `CHANGELOG.md` — version history
  - `RUNBOOK.md` — operational procedures
- **Repo docs:** `README.md`, `CLAUDE.md`, `docs/`

## Security

- API keys in environment variables only
- Trading tools enforce `BINANCE_TESTNET=true` at runtime
- Error sanitization removes credentials from logs
- 0 npm vulnerabilities (CI/CD enforced)

## Upstream Relationship

- Forked from `ethancod1ng/binance-mcp-server@1.1.2` (MIT)
- Upstream PR #4 submitted (goodwill, not dependency)
- Upstream dormant 6+ months — do not depend on merges
- Fork gives full control over releases and npm namespace