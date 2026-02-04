require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3001,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  RPC_URL: process.env.RPC_URL,
  TREASURY_OWNER_PRIVATE_KEY: process.env.TREASURY_OWNER_PRIVATE_KEY,
  ARC_TREASURY_ADDRESS: process.env.ARC_TREASURY_ADDRESS,
  AGENT_WALLET: process.env.AGENT_WALLET,
};
