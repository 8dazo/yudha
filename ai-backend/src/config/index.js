require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3001,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  /** OpenRouter model: e.g. liquid/lfm-2.5-1.2b-thinking:free */
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'liquid/lfm-2.5-1.2b-thinking:free',
  NODE_ENV: process.env.NODE_ENV || 'development',
  RPC_URL: process.env.RPC_URL,
  /** Treasury owner signer; falls back to ACCOUNT_1_PRIVATE_KEY if not set */
  TREASURY_OWNER_PRIVATE_KEY: process.env.TREASURY_OWNER_PRIVATE_KEY || process.env.ACCOUNT_1_PRIVATE_KEY,
  ARC_TREASURY_ADDRESS: process.env.ARC_TREASURY_ADDRESS,
  /** Arena (play token) contract; when set, non-HOLD decisions deduct play tokens from player */
  ARENA_TREASURY_ADDRESS: process.env.ARENA_TREASURY_ADDRESS,
  /** Wallet that holds USDC for sweep; backend pre-approves then sweeps (no frontend tx). Falls back to BACKEND_ACCOUNT then ACCOUNT_2. */
  AGENT_WALLET: process.env.AGENT_WALLET || process.env.BACKEND_ACCOUNT_ADDRESS || process.env.ACCOUNT_2_ADDRESS,
  /** Private key for AGENT_WALLET (backend-only approve + sweep, no user confirm). Falls back to BACKEND_ACCOUNT then ACCOUNT_2. */
  AGENT_WALLET_PRIVATE_KEY: process.env.AGENT_WALLET_PRIVATE_KEY || process.env.BACKEND_ACCOUNT_PRIVATE_KEY || process.env.ACCOUNT_2_PRIVATE_KEY,
  /** Set to true or 1 to send real sweep txs when RPC + treasury + keys are set */
  ENABLE_ONCHAIN_SWEEP: process.env.ENABLE_ONCHAIN_SWEEP !== 'false' && process.env.ENABLE_ONCHAIN_SWEEP !== '0',
};
