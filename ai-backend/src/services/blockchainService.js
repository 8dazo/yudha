const { ethers } = require('ethers');

const RPC_URL = process.env.RPC_URL;
const TREASURY_OWNER_PRIVATE_KEY = process.env.TREASURY_OWNER_PRIVATE_KEY;

let provider = null;
let treasurySigner = null;

const ARC_TREASURY_ABI = [
    'function sweepProfit(address _agent, uint256 _amount) external',
    'function owner() view returns (address)',
    'event ProfitSwept(address indexed agent, uint256 amount)',
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
 * Check if blockchain features are enabled (RPC + treasury owner key + treasury address).
 */
function isBlockchainEnabled() {
    return !!(RPC_URL && TREASURY_OWNER_PRIVATE_KEY && process.env.ARC_TREASURY_ADDRESS);
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

module.exports = {
    getProvider,
    getTreasurySigner,
    getTreasuryContract,
    isBlockchainEnabled,
    getProfitSweptEvents,
};
