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

module.exports = {
    getProvider,
    getTreasurySigner,
    getTreasuryContract,
    isBlockchainEnabled,
};
