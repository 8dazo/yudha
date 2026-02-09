# Backend Implementation Plan - Phase 2

## Current Status
- Express server running on port 3001.
- OpenRouter service with dev fallback logic.
- Mock market data simulation.
- Basic treasury management (mocked profits).

## Phase 2 Features
1. **Real AI Integration**:
   - Connection to OpenRouter (Llama 3 / Claude Haiku).
   - Prompt engineering for 4 distinct personalities.
2. **Transaction Simulation**:
   - Instead of just returning a JSON decision, simulate the actual execution of the transaction on a private fork or testnet.
3. **Treasury Management**:
   - Connect to the `ArcTreasury` contract via `ethers.js`.
   - Monitor `ProfitSwept` events.

## File Breakdown
- `src/services/openRouterService.js`: Migration to live API.
- `src/services/blockchainService.js`: [NEW] Interaction with Sepolia using agent private keys.
- `src/services/treasuryService.js`: Integration with `ArcTreasury` contract.
