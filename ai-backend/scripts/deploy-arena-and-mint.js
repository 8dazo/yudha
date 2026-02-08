/**
 * Deploy ArenaTreasury to Sepolia and mint Arena tokens to the 4 accounts in .env.
 * Reads ai-backend/.env; writes ARENA_TREASURY_ADDRESS back to .env.
 * Run: node scripts/deploy-arena-and-mint.js (from ai-backend)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.TREASURY_OWNER_PRIVATE_KEY || process.env.ACCOUNT_1_PRIVATE_KEY;
const ADDRESSES = [
  process.env.ACCOUNT_1_ADDRESS,
  process.env.ACCOUNT_2_ADDRESS,
  process.env.ACCOUNT_3_ADDRESS,
  process.env.ACCOUNT_4_ADDRESS,
].filter(Boolean);

const MINT_PER_ACCOUNT = BigInt(1000 * 1e6); // 1000 Arena (6 decimals)

async function main() {
  if (!RPC_URL || !PRIVATE_KEY) {
    console.error('Set RPC_URL and TREASURY_OWNER_PRIVATE_KEY (or ACCOUNT_1_PRIVATE_KEY) in .env');
    process.exit(1);
  }
  if (ADDRESSES.length < 4) {
    console.error('Set ACCOUNT_1_ADDRESS through ACCOUNT_4_ADDRESS in .env');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const ownerAddress = wallet.address;

  const artifactPath = path.join(__dirname, '../../contracts/out/ArenaTreasury.sol/ArenaTreasury.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode.object, wallet);

  console.log('Deploying ArenaTreasury...');
  const arena = await factory.deploy(ownerAddress, ethers.ZeroAddress);
  await arena.waitForDeployment();
  const arenaAddress = await arena.getAddress();
  console.log('ArenaTreasury deployed at:', arenaAddress);

  for (let i = 0; i < ADDRESSES.length; i++) {
    const to = ADDRESSES[i];
    console.log(`Minting ${Number(MINT_PER_ACCOUNT) / 1e6} Arena to ${to} (account ${i + 1})...`);
    const tx = await arena.mint(to, MINT_PER_ACCOUNT);
    await tx.wait();
    const bal = await arena.balanceOf(to);
    console.log('  Balance:', (Number(bal) / 1e6).toFixed(2), 'Arena');
  }

  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  const line = `ARENA_TREASURY_ADDRESS=${arenaAddress}`;
  if (envContent.includes('ARENA_TREASURY_ADDRESS=')) {
    envContent = envContent.replace(/ARENA_TREASURY_ADDRESS=.*/m, line);
  } else {
    envContent = envContent.trimEnd() + '\n' + line + '\n';
  }
  fs.writeFileSync(envPath, envContent);
  console.log('Updated .env with ARENA_TREASURY_ADDRESS=' + arenaAddress);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
