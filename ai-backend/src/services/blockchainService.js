const { ethers } = require('ethers');
const config = require('../config');

const RPC_URL = config.RPC_URL;
const TREASURY_OWNER_PRIVATE_KEY = config.TREASURY_OWNER_PRIVATE_KEY;
const AGENT_WALLET_PRIVATE_KEY = config.AGENT_WALLET_PRIVATE_KEY;

let provider = null;
let treasurySigner = null;
let agentSigner = null;

/** Official Circle USDC on Sepolia (same as ArcTreasury.sol) */
const USDC_SEPOLIA = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

const ERC20_APPROVE_ABI = ['function approve(address spender, uint256 amount) returns (bool)'];

const ARC_TREASURY_ABI = [
    'function sweepProfit(address _agent, uint256 _amount) external',
    'function owner() view returns (address)',
    'event ProfitSwept(address indexed agent, uint256 amount)',
];

const ARENA_TREASURY_ABI = [
    'function deductPlay(address player, uint256 amount) external',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
];

/**
 * Get a read-only provider for the configured chain (e.g. Sepolia).
 * @returns {ethers.JsonRpcProvider|null}
 */
function getProvider() {
    if (!RPC_URL) return null;
    if (!provider) {
        provider = new ethers.JsonRpcProvider(RPC_URL);
    }
    return provider;
}

/**
 * Get signer for treasury owner (can broadcast sweepProfit).
 * @returns {ethers.Wallet|null}
 */
function getTreasurySigner() {
    if (!TREASURY_OWNER_PRIVATE_KEY || !RPC_URL) return null;
    if (!treasurySigner) {
        const p = getProvider();
        treasurySigner = new ethers.Wallet(TREASURY_OWNER_PRIVATE_KEY, p);
    }
    return treasurySigner;
}

/**
 * Get signer for agent wallet (holds USDC; must approve treasury for sweepProfit).
 * @returns {ethers.Wallet|null}
 */
function getAgentSigner() {
    if (!AGENT_WALLET_PRIVATE_KEY || !RPC_URL) return null;
    if (!agentSigner) {
        const p = getProvider();
        agentSigner = new ethers.Wallet(AGENT_WALLET_PRIVATE_KEY, p);
    }
    return agentSigner;
}

/**
 * Have the agent wallet approve the ArcTreasury to spend USDC (required before sweepProfit on Sepolia).
 * @param {string} treasuryAddress - ArcTreasury contract address
 * @param {bigint} amountWei - Amount in USDC base units (6 decimals)
 * @returns {Promise<{ success: boolean, txHash?: string, error?: string }>}
 */
async function approveUsdcForTreasury(treasuryAddress, amountWei) {
    const signer = getAgentSigner();
    if (!signer) return { success: false, error: 'Agent signer not configured (AGENT_WALLET_PRIVATE_KEY or ACCOUNT_2_PRIVATE_KEY)' };
    const usdc = new ethers.Contract(USDC_SEPOLIA, ERC20_APPROVE_ABI, signer);
    try {
        const tx = await usdc.approve(treasuryAddress, amountWei);
        const receipt = await tx.wait();
        return { success: true, txHash: receipt.hash };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Get ArcTreasury contract instance (read-only or with signer).
 * @param {string} treasuryAddress - Deployed ArcTreasury address
 * @param {boolean} withSigner - If true, use treasury owner signer for writes
 * @returns {ethers.Contract|null}
 */
function getTreasuryContract(treasuryAddress, withSigner = false) {
    if (!treasuryAddress || treasuryAddress === '0x') return null;
    const p = getProvider();
    if (!p) return null;
    const signer = withSigner ? getTreasurySigner() : null;
    return new ethers.Contract(treasuryAddress, ARC_TREASURY_ABI, signer || p);
}

/**
 * Check if blockchain features are enabled and on-chain sweep is allowed.
 */
function isBlockchainEnabled() {
    return !!(
        config.ENABLE_ONCHAIN_SWEEP &&
        RPC_URL &&
        TREASURY_OWNER_PRIVATE_KEY &&
        config.ARC_TREASURY_ADDRESS
    );
}

/**
 * Fetch ProfitSwept events from ArcTreasury (for monitoring / dashboard).
 * @param {string} treasuryAddress - ArcTreasury contract address
 * @param {number} [fromBlock] - Start block (default: current - 10000)
 * @param {number} [toBlock] - End block (default: latest)
 * @returns {Promise<Array<{ agent: string, amount: string, blockNumber: number, transactionHash: string }>>}
 */
async function getProfitSweptEvents(treasuryAddress, fromBlock, toBlock) {
    const contract = getTreasuryContract(treasuryAddress, false);
    if (!contract) return [];
    const provider = getProvider();
    if (!provider) return [];
    const current = await provider.getBlockNumber();
    const from = fromBlock != null ? fromBlock : Math.max(0, current - 10000);
    const to = toBlock != null ? toBlock : 'latest';
    try {
        const events = await contract.queryFilter(contract.filters.ProfitSwept(), from, to);
        return events.map((e) => ({
            agent: e.args?.agent ?? e.args[0],
            amount: e.args?.amount != null ? e.args.amount.toString() : (e.args && e.args[1] ? e.args[1].toString() : '0'),
            blockNumber: e.blockNumber,
            transactionHash: e.transactionHash,
        }));
    } catch (err) {
        console.warn('[Blockchain] getProfitSweptEvents failed:', err.message);
        return [];
    }
}

/**
 * Get ArenaTreasury (play token) contract.
 * @param {string} arenaAddress - Deployed ArenaTreasury address
 * @param {boolean} withSigner - If true, use treasury owner signer for writes (deductPlay)
 * @returns {ethers.Contract|null}
 */
function getArenaContract(arenaAddress, withSigner = false) {
    if (!arenaAddress || arenaAddress === '0x') return null;
    const p = getProvider();
    if (!p) return null;
    const signer = withSigner ? getTreasurySigner() : null;
    return new ethers.Contract(arenaAddress, ARENA_TREASURY_ABI, signer || p);
}

const ARENA_DECIMALS = 6;

/**
 * Get a player's Arena (play token) balance in human units (6 decimals).
 * @param {string} arenaAddress - ArenaTreasury address
 * @param {string} playerAddress - Wallet to query
 * @returns {Promise<number>} Balance in whole units, or 0 if not configured / error
 */
async function getArenaBalance(arenaAddress, playerAddress) {
    if (!arenaAddress || arenaAddress === '0x' || !playerAddress) return 0;
    const contract = getArenaContract(arenaAddress, false);
    if (!contract) return 0;
    try {
        const balanceWei = await contract.balanceOf(playerAddress);
        return Number(balanceWei) / (10 ** ARENA_DECIMALS);
    } catch (err) {
        console.warn('[Blockchain] getArenaBalance failed:', err.message);
        return 0;
    }
}

/**
 * Deduct play tokens from a player (onlyOwner on contract). Used when agent makes a non-HOLD decision.
 * @param {string} arenaAddress - ArenaTreasury address
 * @param {string} playerAddress - Wallet to deduct from
 * @param {number} amountUsdc - Amount in whole units (6 decimals)
 * @returns {Promise<{ success: boolean, txHash?: string, error?: string }>}
 */
async function deductPlay(arenaAddress, playerAddress, amountUsdc) {
    const contract = getArenaContract(arenaAddress, true);
    if (!contract) return { success: false, error: 'Arena not configured' };
    const amountWei = BigInt(Math.floor(amountUsdc)) * BigInt(10 ** ARENA_DECIMALS);
    if (amountWei === 0n) return { success: false, error: 'Zero amount' };
    try {
        const tx = await contract.deductPlay(playerAddress, amountWei);
        const receipt = await tx.wait();
        return { success: true, txHash: receipt.hash };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

module.exports = {
    getProvider,
    getTreasurySigner,
    getAgentSigner,
    getTreasuryContract,
    getArenaContract,
    getArenaBalance,
    deductPlay,
    isBlockchainEnabled,
    getProfitSweptEvents,
    approveUsdcForTreasury,
    USDC_SEPOLIA,
};
