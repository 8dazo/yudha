const { getTreasuryContract, isBlockchainEnabled } = require('./blockchainService');

const USDC_DECIMALS = 6;

/**
 * Treasury Manager for Arc (USDC).
 * Sweeps profits from agents into the central treasury.
 * When ARC_TREASURY_ADDRESS and TREASURY_OWNER_PRIVATE_KEY are set, sweeps on-chain.
 */
class TreasuryManager {
    constructor() {
        this.treasuryAddress = process.env.ARC_TREASURY_ADDRESS || '0x';
        this.usdcAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'; // Official Circle USDC on Sepolia
        this.profits = {};
        this.agentWallet = process.env.AGENT_WALLET || null; // Wallet that holds USDC and has approved treasury
    }

    /**
     * Record profit for an agent and sweep on-chain if threshold reached and blockchain is configured.
     */
    async recordProfit(agentKey, amount) {
        if (!this.profits[agentKey]) this.profits[agentKey] = 0;
        this.profits[agentKey] += amount;

        console.log(`[Arc] Profit recorded for ${agentKey}: +${amount} USDC. Total: ${this.profits[agentKey]}`);

        if (this.profits[agentKey] >= 100) {
            await this.sweep(agentKey, this.profits[agentKey]);
            this.profits[agentKey] = 0;
        }
    }

    /**
     * Sweep accumulated USDC to treasury. On-chain if blockchain enabled and AGENT_WALLET set.
     */
    async sweep(agentKey, amount) {
        const amountWei = BigInt(Math.floor(amount)) * BigInt(10 ** USDC_DECIMALS);
        const agentAddress = this.agentWallet;

        if (isBlockchainEnabled() && agentAddress && this.treasuryAddress && this.treasuryAddress !== '0x') {
            try {
                const contract = getTreasuryContract(this.treasuryAddress, true);
                if (!contract) {
                    console.log(`[Arc] SWEEP skipped: no treasury contract (missing RPC/signer).`);
                    return;
                }
                const tx = await contract.sweepProfit(agentAddress, amountWei);
                console.log(`[Arc] SWEEP tx submitted: ${tx.hash}`);
                const receipt = await tx.wait();
                console.log(`[Arc] SWEEP confirmed: ${receipt.hash}`);
            } catch (err) {
                console.error('[Arc] SWEEP failed:', err.message);
            }
        } else {
            console.log(`[Arc] SWEEP (simulated) ${amount} USDC from ${agentKey} to Treasury. Set RPC_URL, TREASURY_OWNER_PRIVATE_KEY, ARC_TREASURY_ADDRESS, AGENT_WALLET for on-chain sweep.`);
        }
    }

    getStats() {
        return {
            totalProfits: this.profits,
            usdc: this.usdcAddress,
            treasuryAddress: this.treasuryAddress,
            onChainEnabled: isBlockchainEnabled() && !!this.agentWallet,
        };
    }
}

module.exports = new TreasuryManager();
