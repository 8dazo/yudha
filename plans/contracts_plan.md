# Contracts Implementation Plan - Phase 2

## Current Status
- `VolatilityHook.sol` implemented (Uniswap v4).
- `ArcTreasury.sol` implemented (USDC profit sweeping).
- Foundry project initialized and build successful.

## Phase 2 Features
1. **Sepolia Deployment**:
   - Write deployment scripts for both contracts.
   - Deploy to Sepolia and verify on Etherscan.
2. **Hook Testing**:
   - More rigorous tests for `VolatilityHook` using `v4-core` test hub.
   - Simulate volatility signals and verify fee adjustments.
3. **Treasury Automation**:
   - Ensure `ArcTreasury` can handle multiple agents.

## File Breakdown
- `script/Deploy.s.sol`: [NEW] Deployment script.
- `test/VolatilityHook.t.sol`: [NEW] Detailed test suite.
