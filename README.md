# 🧠 Yudha (PsycheFi): The AI Agent Trading Arena

**Where distinct AI personalities battle for alpha using Yellow, Uniswap v4, LI.FI, and Arc.**

## 💡 The Concept
Yudha (PsycheFi) is an experimental trading platform where users don't place trades—they back **AI Agents** with distinct psychological profiles. We utilize Large Language Models (via OpenRouter) to simulate "Diamond Hands," "Panic Sellers," "Calculated Arbitrageurs," and "Passive Yield Farmers."

These agents don't just talk; they execute transactions on-chain across multiple protocols to prove which "mindset" is the most profitable.

## 🏆 Hackathon Tracks & Integrations

### 1. ⚡ Yellow Network (The Day Trader)
* **Agent Persona:** "The Scalper" (High frequency, low latency).
* **Integration:** We utilize the **Yellow SDK** to open state channels.
* **Logic:** The Scalper agent detects micro-volatility and executes rapid buy/sell orders off-chain without gas, settling the final PnL on-chain only when the session closes.

### 2. 🦄 Uniswap Foundation (The Liquidity Manager)
* **Agent Persona:** "The Market Maker" (Neutral, passive).
* **Integration:** **Uniswap v4 Hooks**.
* **Logic:** This agent monitors volatility. If the market is calm, it concentrates liquidity (via a custom Hook). If volatility spikes, it widens the range to avoid Impermanent Loss.

### 3. 🦎 LI.FI (The Cross-Chain Nomad)
* **Agent Persona:** "The Arbitrageur" (Opportunity seeker).
* **Integration:** **LI.FI SDK/API**.
* **Logic:** The agent monitors price discrepancies between chains (e.g., ETH vs. Polygon). When a gap is found, it automatically routes funds using LI.FI to capture the arbitrage.

### 4. 🌐 Arc (The Treasury)
* **Agent Persona:** "The Bank Manager" (Risk-averse).
* **Integration:** **Arc (USDC)** & Circle ecosystem.
* **Logic:** Acts as the central treasury. It sweeps profits from the other agents into USDC on Arc to preserve capital. It programmatically manages the "House Funds."

---

## 🛠️ Tech Stack
- **AI Core:** OpenRouter (Llama 3 / Claude Haiku), Node.js (Express).
- **Frontend:** Next.js 14, Tailwind CSS, shadcn/ui.
- **Blockchain:** Yellow SDK, Uniswap v4 (Foundry), LI.FI SDK.

---

## 📜 Deployed Contracts (Sepolia)

| Contract       | Address | Etherscan |
|----------------|---------|-----------|
| **ArcTreasury** | `0x894aDc69849EF8d606845b4f8543986FBF86746d` | [View on Etherscan](https://sepolia.etherscan.io/address/0x894aDc69849EF8d606845b4f8543986FBF86746d) |

*ArcTreasury* holds swept USDC from agents; owner can `sweepProfit(agent, amount)` and `withdraw(to, amount)`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Foundry (for Uniswap hooks)
- OpenRouter API Key

### Installation

1. **Clone the Repo**
   ```bash
   git clone https://github.com/yourusername/yudha.git
   cd yudha
   ```

2. **Setup Backend (The Brain)**
   ```bash
   cd ai-backend
   npm install
   cp .env.example .env
   # Set OPENROUTER_API_KEY. For real-world: RPC_URL, TREASURY_OWNER_PRIVATE_KEY, ARC_TREASURY_ADDRESS, AGENT_WALLET
   npm start
   ```

3. **Setup Frontend (The Arena)**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (WalletConnect Cloud). Optional: NEXT_PUBLIC_API_URL
   npm run dev
   ```

4. **Deploy Arc Treasury (optional, for on-chain sweep)**  
   The contract is production-ready (SafeERC20, ReentrancyGuard, two-step ownership). Use account 1 from ai-backend `.env`:
   ```bash
   cd contracts
   # Load keys from backend (or copy ACCOUNT_1_PRIVATE_KEY to PRIVATE_KEY in contracts/.env)
   set -a && source ../ai-backend/.env && set +a
   forge script script/DeployYudha.s.sol:DeployYudha --rpc-url $RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
   ```
   Then set `ARC_TREASURY_ADDRESS` in `ai-backend/.env` to the deployed address.

## 🧠 Agent Personalities

| Agent | Personality | Strategy | Protocol Used |
| --- | --- | --- | --- |
| **Degen Dave** | Impulsive, high-risk, follows momentum. | Momentum Trading | Yellow Network (Flash trades) |
| **Stable Sarah** | Cautious, hates drawdowns. | Liquidity Provision | Uniswap v4 (Hooks) |
| **Chad Bridge** | Agnostic, follows the yield. | Cross-chain Arb | LI.FI |
| **Corporate Ken** | Greedy but risk-managed. | Treasury Mgmt | Arc (USDC) |
