# Backend Implementation Plan - Phase 2

## Current Status
- Express server on port 3001; OpenRouter with dev fallback; live market data (CoinGecko + mock fallback).
- **Real AI**: OpenRouter (Llama 3 default, configurable via `OPENROUTER_MODEL` e.g. Claude Haiku); 4 personalities in `personalities.js`.
- **Transaction simulation**: `simulationService.js` – `simulateDecision` / `simulateSweep` (staticCall + estimateGas) for ArcTreasury sweeps; attached to `GET /api/agents/:agentKey/decision` when treasury + agent wallet are set.
- **Treasury**: `blockchainService.js` (ethers, ArcTreasury ABI, `getProfitSweptEvents`); `treasuryService.js` (recordProfit, sweep on-chain, `getStatsWithEvents`); **ProfitSwept monitoring** via `getProfitSweptEvents` and `GET /api/treasury`.

## Phase 2 Features (done)
1. **Real AI Integration**: OpenRouter live API; configurable model; 4 distinct personalities.
2. **Transaction Simulation**: Simulate sweep execution (staticCall + gas estimate) and attach to decision response.
3. **Treasury Management**: ArcTreasury via ethers; ProfitSwept events fetched and exposed in `/api/treasury`.

## File Breakdown
- `src/services/openRouterService.js`: Live OpenRouter API; uses `OPENROUTER_MODEL`.
- `src/services/blockchainService.js`: Sepolia provider/signer; ArcTreasury contract; `getProfitSweptEvents(treasuryAddress, fromBlock?, toBlock?)`.
- `src/services/treasuryService.js`: ArcTreasury integration; recordProfit/sweep; `getStatsWithEvents()`.
- `src/services/simulationService.js`: `simulateSweep`, `simulateDecision`.
- `src/routes/agentRoutes.js`: `GET /:agentKey/decision`, `GET /personalities`, `GET /decisions` (batch).
- `src/routes/treasuryRoutes.js`: `GET /api/treasury` (stats + profitSweptEvents), `GET /api/treasury/stats`.

## Wrap-up
- **Market data**: CoinGecko (free tier, no key) + **Binance** (free, no key) as alternative. `MARKET_DATA_SOURCE=coingecko|binance|auto`. Neither is paid for normal use; fallback to in-memory mock if both fail.
- **README**: `ai-backend/README.md` documents env and market data.
