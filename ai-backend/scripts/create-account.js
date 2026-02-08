#!/usr/bin/env node
/**
 * Generate one new Ethereum account (private key + address) for backend use.
 * Run: node scripts/create-account.js
 */
const { ethers } = require('ethers');

const wallet = ethers.Wallet.createRandom();

console.log('New account created:\n');
console.log('Private key:', wallet.privateKey);
console.log('Address:    ', wallet.address);
console.log('\nAdd to .env (e.g. for agent or treasury):');
console.log(`BACKEND_ACCOUNT_PRIVATE_KEY=${wallet.privateKey}`);
console.log(`BACKEND_ACCOUNT_ADDRESS=${wallet.address}`);
