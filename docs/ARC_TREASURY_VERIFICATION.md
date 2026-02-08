# Arc Treasury – Verification

This doc proves the app uses the **actual** ArcTreasury contract (sweep USDC on-chain).

## 1. Contract (source of truth)

- **Path:** `contracts/src/ArcTreasury.sol`
- **USDC:** Official Circle USDC on Sepolia  
  `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`  
  ([Circle](https://developers.circle.com/stablecoins/usdc-contract-addresses))
- **Main API:** `sweepProfit(address _agent, uint256 _amount)` – pulls USDC from `_agent` into the treasury.

## 2. Backend uses the same contract

- **ABI** in `ai-backend/src/services/blockchainService.js` matches the contract:

  ```js
  const ARC_TREASURY_ABI = [
      'function sweepProfit(address _agent, uint256 _amount) external',
      'function owner() view returns (address)',
      'event ProfitSwept(address indexed agent, uint256 amount)',
  ];
  ```

- **Calls:** `treasuryService.js` gets the contract from `getTreasuryContract(ARC_TREASURY_ADDRESS, true)` and calls `contract.sweepProfit(agentAddress, amountWei)` (line 47).
- **Config:** Treasury address comes from `ARC_TREASURY_ADDRESS` in `.env`; that should be the deployed ArcTreasury address (e.g. Sepolia).

## 3. Deploy proof (Sepolia)

- **Chain:** 11155111 (Sepolia)
- **Deployed address:** `0x894aDc69849EF8d606845b4f8543986FBF86746d`
- **Evidence:** `contracts/broadcast/DeployYudha.s.sol/11155111/run-latest.json` (and other run files) contain `"contractName": "ArcTreasury"` and this address.

So: the same contract that defines `sweepProfit` and uses official USDC is what the backend calls when `ARC_TREASURY_ADDRESS` is set to the deployed address above.

## 4. Quick check

1. Set in `ai-backend/.env`:  
   `ARC_TREASURY_ADDRESS=0x894aDc69849EF8d606845b4f8543986FBF86746d`  
   (and `RPC_URL`, `TREASURY_OWNER_PRIVATE_KEY`, `AGENT_WALLET` as needed).
2. When the backend sweeps, it calls `sweepProfit` on that address.
3. On Sepolia Etherscan, open that address and confirm it is the same ArcTreasury (e.g. `sweepProfit` and `owner` present).
