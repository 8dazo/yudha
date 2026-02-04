const { getTreasuryContract, getProvider } = require('./blockchainService');

const USDC_DECIMALS = 6;

/**
 * Simulate a treasury sweep (sweepProfit) without sending a transaction.
 * @param {string} treasuryAddress - ArcTreasury contract address
 * @param {string} agentAddress - Agent wallet address
 * @param {number} amountUsdc - Amount in whole USDC (e.g. 100)
 * @returns {Promise<{ success: boolean, gasEstimate?: string, error?: string }>}
 */
async function simulateSweep(treasuryAddress, agentAddress, amountUsdc) {
    const contract = getTreasuryContract(treasuryAddress, false);
    if (!contract) {
        return { success: false, error: 'Blockchain not configured' };
    }
    const amountWei = BigInt(Math.floor(amountUsdc)) * BigInt(10 ** USDC_DECIMALS);
    try {
        await contract.sweepProfit.staticCall(agentAddress, amountWei);
        const gas = await contract.sweepProfit.estimateGas(agentAddress, amountWei);
        return { success: true, gasEstimate: gas.toString() };
    } catch (err) {
        return { success: false, error: err.message || 'Simulation failed' };
    }
}

/**
 * Simulate an agent decision (e.g. would a sweep succeed). Used after OpenRouter returns a decision.
 * @param {object} decision - { action, amount }
 * @param {string} agentAddress - Agent wallet (e.g. AGENT_WALLET)
 * @param {string} treasuryAddress - ARC_TREASURY_ADDRESS
 * @returns {Promise<object|null>} - Simulation result or null if not applicable
 */
async function simulateDecision(decision, agentAddress, treasuryAddress) {
    if (!decision || decision.action === 'HOLD' || !agentAddress || !treasuryAddress) {
        return null;
    }
    const amount = Number(decision.amount) || 0;
    if (amount <= 0) return null;
    return simulateSweep(treasuryAddress, agentAddress, amount);
}

module.exports = {
    simulateSweep,
    simulateDecision,
};
