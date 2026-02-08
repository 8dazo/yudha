# Contracts Implementation Plan - Phase 2

## Current Status
- `VolatilityHook.sol` implemented (Uniswap v4); dynamic fee uses `OVERRIDE_FEE_FLAG`; testable via `setManager`/`setOwner` for etch pattern.
- `ArcTreasury.sol` implemented (USDC profit sweeping); supports optional token override for tests; multi-agent sweep/withdraw.
- Foundry project initialized and build successful.
- **Sepolia**: `DeployYudha.s.sol` deploys `ArcTreasury` (pass `address(0)` for token = USDC). VolatilityHook not in deploy script (requires v4 PoolManager on chain).

## Phase 2 Features (done)
1. **Sepolia Deployment**:
   - Deployment script `script/DeployYudha.s.sol` for ArcTreasury; deploy with `PRIVATE_KEY`/`ACCOUNT_1_PRIVATE_KEY` and `--verify` for Etherscan.
2. **Hook Testing**:
   - `test/VolatilityHook.t.sol`: full suite using v4-core test hub (Deployers, dynamic fee pool). Tests: updateVolatility, beforeSwap fee scaling, beforeAddLiquidity revert when volatility >= 500, onlyOwner.
3. **Treasury**:
   - `test/ArcTreasury.t.sol`: sweepProfit, withdraw, multiple agents, access control and ZeroAddress/ZeroAmount reverts.
   - ArcTreasury handles multiple agents via `sweepProfit(agent, amount)`.

## File Breakdown
- `script/DeployYudha.s.sol`: Deploys ArcTreasury(owner, address(0)).
- `test/VolatilityHook.t.sol`: VolatilityHook test suite (v4-core-test).
- `test/ArcTreasury.t.sol`: ArcTreasury test suite.
