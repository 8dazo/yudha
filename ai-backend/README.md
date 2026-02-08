# Yudha AI Backend

Express API for the AI agent arena: OpenRouter decisions, market data, and Arc treasury (Sepolia).

## Env (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes (for real AI) | OpenRouter API key. No mock fallback. |
| `OPENROUTER_MODEL` | No | Default: `liquid/lfm-2.5-1.2b-thinking:free` |
| `PORT` | No | Default: 3001 |
| `MARKET_DATA_SOURCE` | No | `auto` (try CoinGecko then Binance), `coingecko`, or `binance`. No API key needed for either. |
| `RPC_URL` | For treasury | Sepolia RPC (e.g. publicnode). |
| `TREASURY_OWNER_PRIVATE_KEY` | For sweep | Owner of ArcTreasury. |
| `ARC_TREASURY_ADDRESS` | For sweep | Deployed ArcTreasury contract. |
| `AGENT_WALLET` | For sweep | Wallet that holds USDC and has approved the treasury. |

## Market data (free, no key)

- **CoinGecko**: Free tier, no key. Rate limit ~10–30 req/min. Paid only for higher limits.
- **Binance**: Free, no key, public ticker. Used automatically if CoinGecko fails (or set `MARKET_DATA_SOURCE=binance`).
- **Fallback**: In-memory mock when both fail; response has `source: 'fallback'`.

So **CoinGecko is not required and not paid** for normal use; Binance is the free alternative.

## Endpoints

- `GET /health`
- `GET /api/agents/personalities`
- `GET /api/agents/:agentKey/decision`
- `GET /api/agents/decisions`
- `GET /api/treasury` (stats + ProfitSwept events)
- `GET /api/treasury/stats`

## Run

```bash
npm install
npm start
```

Test APIs (with server running): `node scripts/test-apis.js`
