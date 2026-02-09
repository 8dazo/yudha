# Frontend Implementation Plan - Phase 2

## Current Status
- Next.js 14 app with shadcn/ui.
- Premium sci-fi dashboard layout.
- Real-time charts (Recharts) and log stream.
- Hooks for LI.FI and Yellow (mocked).

## Phase 2 Features
1. **Wallet Integration**:
   - Add `RainbowKit`, `wagmi`, and `viem`.
   - Implement "Connect Wallet" in the header.
2. **Real Protocol Hooks**:
   - Fix `useLiFi` to use real SDK calls.
   - Refine `useYellow` visualization for state channel activity.
3. **Enhanced Visualization**:
   - More granular charts (candle stick if possible, or multiple lines).
   - Transaction success/failure notifications (Toast).

## File Breakdown
- `components/Web3Provider.tsx`: [NEW] Wallet provider setup.
- `hooks/useLiFi.ts`: Refactor to use real SDK.
- `components/ArenaDashboard.tsx`: Add wallet button and real-time SDK interactions.
