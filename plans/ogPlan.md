
### 📂 Project Structure & Architecture

Before you start coding, organize your team into 3 units:

1. **Team AI (Backend):** Handles OpenRouter, System Prompts, and the API.
2. **Team Chain (Contracts/SDKs):** Handles Yellow, Uniswap, LI.FI, and Arc integrations.
3. **Team UI (Frontend):** Handles Next.js, visualizations, and the "Terminal" view.

**Directory Structure:**

```text
psyche-fi/
├── ai-backend/             # Python (FastAPI) or Node.js
│   ├── agents/             # Personality definitions
│   ├── market_data/        # Mock price feeds or live API
│   └── server.py           # Main API
├── contracts/              # Solidity
│   ├── uniswap-hooks/      # v4 Hooks
│   └── arc-treasury/       # USDC Logic
├── frontend/               # Next.js + Tailwind
│   ├── components/         # AgentCards, Terminal, Charts
│   └── hooks/              # Yellow SDK, LiFi SDK hooks
└── README.md

```

---

### 📝 The Master README.md

*Create a file named `README.md` in the root of your repo and paste this in. It is written to appeal specifically to the judges of the 4 tracks.*

```markdown
# 🧠 PsycheFi: The AI Agent Trading Arena

**Where distinct AI personalities battle for alpha using Yellow, Uniswap v4, LI.FI, and Arc.**

## 💡 The Concept
PsycheFi is an experimental trading platform where users don't place trades—they back **AI Agents** with distinct psychological profiles. We utilize Large Language Models (via OpenRouter) to simulate "Diamond Hands," "Panic Sellers," "Calculated Arbitrageurs," and "Passive Yield Farmers."

These agents don't just talk; they execute transactions on-chain across multiple protocols to prove which "mindset" is the most profitable.

## 🏆 Hackathon Tracks & Integrations

### 1. ⚡ Yellow Network (The Day Trader)
* **Agent Persona:** "The Scalper" (High frequency, low latency).
* **Integration:** We utilize the **Yellow SDK** to open state channels.
* **Logic:** The Scalper agent detects micro-volatility and executes rapid buy/sell orders off-chain without gas, settling the final PnL on-chain only when the session closes.
* **Why Yellow?** Standard blockchains are too slow and expensive for an AI agent that wants to trade every 3 seconds.

### 2. 🦄 Uniswap Foundation (The Liquidity Manager)
* **Agent Persona:** "The Market Maker" (Neutral, passive).
* **Integration:** **Uniswap v4 Hooks**.
* **Logic:** This agent monitors volatility. If the market is calm, it concentrates liquidity (via a custom Hook). If volatility spikes, it widens the range to avoid Impermanent Loss.
* **Tech:** Custom Hook deployed on Sepolia/Testnet.

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
- **AI Core:** OpenRouter (Llama 3 / Claude Haiku), Python/FastAPI.
- **Frontend:** Next.js, Tailwind CSS, shadcn/ui.
- **Blockchain:** Yellow SDK, Uniswap v4 (Foundry), LI.FI Widget/SDK.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Python 3.9+
- Foundry (for Uniswap hooks)
- OpenRouter API Key

### Installation

1. **Clone the Repo**
   ```bash
   git clone [https://github.com/yourusername/psyche-fi.git](https://github.com/yourusername/psyche-fi.git)
   cd psyche-fi

```

2. **Setup Backend (The Brain)**
```bash
cd ai-backend
pip install -r requirements.txt
# Set OPENROUTER_API_KEY in .env
python server.py

```


3. **Setup Frontend (The Arena)**
```bash
cd frontend
npm install
npm run dev

```



## 🧠 Agent Personalities (System Prompts)

| Agent | Personality | Strategy | Protocol Used |
| --- | --- | --- | --- |
| **Degen Dave** | Impulsive, high-risk, follows momentum. | Momentum Trading | Yellow Network (Flash trades) |
| **Stable Sarah** | Cautious, hates drawdowns. | Liquidity Provision | Uniswap v4 (Hooks) |
| **Chad Bridge** | Agnostic, follows the yield. | Cross-chain Arb | LI.FI |
| **Corporate Ken** | Greedy but risk-managed. | Treasury Mgmt | Arc (USDC) |

```

---

### 🗓️ The 48-Hour Execution Plan

#### Phase 1: The "Brain" (Backend) - Hours 0-8
*Goal: Get an API that returns a trade decision based on a personality.*

1.  **Set up OpenRouter:** Get an API key.
2.  **Create `agent.py`:**
    * Input: `Current_Price`, `Trend (Up/Down)`, `Balance`, `Personality_Prompt`.
    * System Prompt Example: *"You are Degen Dave. You love risk. You see the price going up. Do you Buy or Sell? Reply strictly in JSON: {action: 'BUY', amount: 10, thought: 'LFG moon soon!'}"*
3.  **Mock Market Data:** Create a simple script that generates a random price that moves up or down every 5 seconds so the agents have something to react to.

#### Phase 2: The Integrations (The Prize Winners) - Hours 8-24

**A. Yellow Network (The "Scalper")**
* **Task:** Install Yellow SDK in the frontend.
* **Action:** When the backend says "BUY", trigger `yellowClient.openChannel()` (or the equivalent testnet function).
* **Demo Trick:** Log these transactions in a console window on screen labeled "Off-Chain Speed Layer."

**B. Uniswap v4 (The "LP")**
* **Task:** Use a Uniswap v4 template (Foundry).
* **Action:** Write a simple Hook that accepts a parameter change.
* **The Hack:** You don't need a full complex algo. Just have the Agent call a function `updateSpread(uint24 newSpread)` on the contract based on its "fear" level.

**C. LI.FI (The "Arb")**
* **Task:** npm install `@lifi/sdk`.
* **Action:** Create a button (that the AI clicks programmatically) that calls `lifi.getQuote(...)`.
* **The Hack:** Hardcode a "Destination Chain" (e.g., Optimism). When the Agent says "Bridge", execute the quote.

**D. Arc (The "Treasury")**
* **Task:** detailed reading of Arc docs (Circle wrapper).
* **Action:** Simulate a "Profit Sweep." When the Degen Agent makes a profit, send a transaction moving USDC to the "Arc Treasury Wallet."

#### Phase 3: The Frontend (The Show) - Hours 24-40
*Goal: Make it look like a sci-fi trading floor.*

1.  **Layout:** 4 Columns. One for each Agent.
2.  **The "Thought Stream":** This is CRITICAL.
    * Display the `thought` field from the JSON response in a chat bubble.
    * *Degen Dave:* "RSI is overbought but I don't care. FOMOing in!"
    * *Stable Sarah:* "Volatility is too high. Withdrawing liquidity."
3.  **The Graphs:** Use `Recharts` to show a simple price line.

#### Phase 4: The Pitch & Video - Hours 40-48
1.  **Record the screen:** Narrate *exactly* which tool is doing what.
    * "See here? Degen Dave just made 5 trades in 2 seconds using **Yellow Network**."
    * "Now look at Sarah, she just updated her **Uniswap v4 Hook** because she detected a price drop."
    * "Here, our Arb agent is moving funds via **LI.FI**."
    * "And finally, we secure profits using **Arc**."

### ⚠️ Hackathon Cheats (How to cut corners safely)

1.  **Don't connect to Real Mainnet:** Use Sepolia, Base Sepolia, or purely simulate the transaction hashes if the testnets are congested (but try to get at least one real testnet tx for the judges).
2.  **Mock the "Market":** Don't try to fetch live CoinGecko data if it's too hard. Just write a `random()` function that changes the price. The judges care about the **Agent's reaction**, not the accuracy of the Bitcoin price.
3.  **Hardcode the Wallets:** Don't build complex user auth. Just have 4 hardcoded private keys (in `.env`) representing the 4 agents.

### 🏁 Final Step: Submission
When submitting to the hackathon portal, you will likely have to submit to each sponsor separately.
* **Link the specific file** where their code is used.
    * *Yellow:* Link to `frontend/hooks/useYellow.ts`
    * *Uniswap:* Link to `contracts/src/VolatilityHook.sol`
    * *LI.FI:* Link to `frontend/components/BridgeWidget.tsx`
    * *Arc:* Link to `backend/treasury_manager.py`

Start coding! Focus on **The Thought Stream** (AI personality) and **The Transaction Hash** (Proof of integration). Good luck!

