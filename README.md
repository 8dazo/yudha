# Yudha — AI Agent Trading Arena

Multi-agent trading arena where four AI personalities make live market decisions across Yellow Network, Uniswap v4, LI.FI, and Arc (USDC). Profits are swept on-chain into an Arc treasury on Sepolia.

## Concept

Yudha is a trading platform where **AI agents** with distinct personalities (Degen Dave, Stable Sarah, Chad Bridge, Corporate Ken) make decisions. Each agent is tied to a protocol; the backend runs OpenRouter for AI, fetches market data, and executes Arc USDC sweeps server-side—no frontend transaction prompts for treasury flows.

## How it works

### High-level flow

```mermaid
flowchart LR
    subgraph Frontend
        UI[Arena Dashboard]
    end
    subgraph Backend["ai-backend"]
        API[Express API]
        AI[OpenRouter / LLM]
        Market[Market Data]
        Treasury[Treasury Service]
    end
    subgraph External
        CoinGecko[CoinGecko / Binance]
        Sepolia[(Sepolia)]
    end
    UI -->|GET decisions, treasury, dashboard-state| API
    API --> AI
    API --> Market
    API --> Treasury
    Market --> CoinGecko
    Treasury -->|approve + sweepProfit| Sepolia
```

### Arc profit sweep (backend-only, no frontend tx)

```mermaid
sequenceDiagram
    participant Agent as Agent decision (e.g. Corporate Ken)
    participant TS as Treasury Service
    participant BC as Blockchain Service
    participant USDC as USDC (Sepolia)
    participant Arc as ArcTreasury

    Agent->>TS: recordProfit(agentKey, amount)
    TS->>TS: Accumulate in memory
    alt Accumulated >= 100 USDC
        TS->>BC: approveUsdcForTreasury(treasury, amountWei)
        BC->>USDC: approve(ArcTreasury, amount)  [agent wallet key]
        USDC-->>BC: ok
        TS->>BC: getTreasuryContract().sweepProfit(agent, amountWei)
        BC->>Arc: sweepProfit(agent, amount)
        Arc->>USDC: transferFrom(agent, treasury, amount)
        USDC-->>Arc: ok
        Arc-->>BC: ProfitSwept event
        TS->>TS: Reset accumulated profit for agent
    end
```

### Data flow: dashboard and decisions

```mermaid
flowchart TB
    subgraph User
        Browser[Browser]
    end
    subgraph Frontend["frontend (Next.js)"]
        Dashboard[Arena Dashboard]
        DecisionsPage[Decisions Page]
    end
    subgraph Backend["ai-backend"]
        AgentsAPI["/api/agents/decisions"]
        DashboardAPI["/api/agents/dashboard-state"]
        TreasuryAPI["/api/treasury"]
        DB[(SQLite)]
    end
    Browser --> Dashboard
    Browser --> DecisionsPage
    Dashboard --> AgentsAPI
    Dashboard --> DashboardAPI
    Dashboard --> TreasuryAPI
    DecisionsPage --> DashboardAPI
    AgentsAPI --> OpenRouter[OpenRouter AI]
    AgentsAPI --> Market[Market Service]
    DashboardAPI --> DB
    TreasuryAPI --> Sepolia[(Sepolia events)]
```

## Tech Stack

| Layer | Stack |
|-------|--------|
| **AI** | OpenRouter (LLM), Node.js + Express |
| **Frontend** | Next.js 14, Tailwind, shadcn/ui, wagmi, RainbowKit |
| **Contracts** | Solidity (Foundry), ArcTreasury, ArenaTreasury |
| **Chain** | Ethereum Sepolia (Arc USDC, Arena token) |

## Repo Structure

```
yudha/
├── ai-backend/     # Express API: agents, market data, treasury sweep
├── contracts/      # ArcTreasury, ArenaTreasury (Foundry)
├── frontend/       # Next.js arena dashboard
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (frontend) or npm
- [Foundry](https://book.getfoundry.sh/) (for contracts)
- [OpenRouter](https://openrouter.ai/) API key

### 1. Backend

```bash
cd ai-backend
npm install
cp .env.example .env
# Set OPENROUTER_API_KEY. For sweep: RPC_URL, TREASURY_OWNER_PRIVATE_KEY, ARC_TREASURY_ADDRESS, AGENT_WALLET, AGENT_WALLET_PRIVATE_KEY
npm start
```

Runs on **http://localhost:3001**. See [ai-backend/README.md](ai-backend/README.md) for env and endpoints.

### 2. Frontend

```bash
cd frontend
pnpm install
# Optional: .env.local with NEXT_PUBLIC_API_URL=http://localhost:3001, NEXT_PUBLIC_ARENA_TREASURY_ADDRESS, etc.
pnpm dev
```

Runs on **http://localhost:3000**. Dashboard reads from the API; no wallet required for viewing. Connect wallet for Arena balance (Sepolia).

### 3. Contracts (optional)

Arc treasury and Arena (play token) on Sepolia:

```bash
cd contracts
# Set RPC_URL, PRIVATE_KEY (or use ai-backend .env)
forge script script/DeployYudha.s.sol:DeployYudha --rpc-url $RPC_URL --broadcast --verify
# Arena: script/DeployArena.s.sol
```

Set `ARC_TREASURY_ADDRESS` and `ARENA_TREASURY_ADDRESS` in `ai-backend/.env`.

## Deployed Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| **ArcTreasury** | [`0xb0B384F0CA720FD334182f650885b9bb22e28F65`](https://sepolia.etherscan.io/address/0xb0B384F0CA720FD334182f650885b9bb22e28F65) |
| **ArenaTreasury** | Deploy via `scripts/deploy-arena-and-mint.js` (see ai-backend) |

ArcTreasury: `sweepProfit(agent, amount)` pulls USDC from agent into treasury; owner can `withdraw(to, amount)`.

## Agents

| Agent | Persona | Protocol |
|-------|---------|-----------|
| **Degen Dave** | Momentum, high risk | Yellow Network |
| **Stable Sarah** | Cautious, liquidity | Uniswap v4 |
| **Chad Bridge** | Cross-chain arb | LI.FI |
| **Corporate Ken** | Treasury, USDC sweep | Arc |

## License

MIT
