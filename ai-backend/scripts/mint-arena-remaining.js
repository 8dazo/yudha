/**
 * Mint Arena to accounts that have 0 balance. Use after deploy-arena-and-mint was interrupted.
 * Run: node scripts/mint-arena-remaining.js (from ai-backend)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.TREASURY_OWNER_PRIVATE_KEY || process.env.ACCOUNT_1_PRIVATE_KEY;
const ARENA_ADDRESS = process.env.ARENA_TREASURY_ADDRESS;
const ADDRESSES = [
  process.env.ACCOUNT_1_ADDRESS,
  process.env.ACCOUNT_2_ADDRESS,
  process.env.ACCOUNT_3_ADDRESS,
  process.env.ACCOUNT_4_ADDRESS,
].filter(Boolean);

const MINT_PER_ACCOUNT = BigInt(1000 * 1e6);

async function main() {
  if (!RPC_URL || !PRIVATE_KEY || !ARENA_ADDRESS) {
    console.error('Set RPC_URL, TREASURY_OWNER_PRIVATE_KEY, ARENA_TREASURY_ADDRESS in .env');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const artifactPath = path.join(__dirname, '../../contracts/out/ArenaTreasury.sol/ArenaTreasury.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const arena = new ethers.Contract(ARENA_ADDRESS, artifact.abi, wallet);

  for (let i = 0; i < ADDRESSES.length; i++) {
    const to = ADDRESSES[i];
    const bal = await arena.balanceOf(to);
    if (bal > 0n) {
      console.log(`Account ${i + 1} ${to} already has ${(Number(bal) / 1e6).toFixed(2)} Arena, skip.`);
      continue;
    }
    console.log(`Minting ${Number(MINT_PER_ACCOUNT) / 1e6} Arena to ${to} (account ${i + 1})...`);
    const tx = await arena.mint(to, MINT_PER_ACCOUNT);
    await tx.wait();
    const newBal = await arena.balanceOf(to);
    console.log('  Balance:', (Number(newBal) / 1e6).toFixed(2), 'Arena');
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
