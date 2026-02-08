const express = require('express');
const router = express.Router();
const { getAgentDecision } = require('../services/openRouterService');
const { getMarketData } = require('../services/marketService');
const treasuryService = require('../services/treasuryService');
const { simulateDecision } = require('../services/simulationService');
const personalities = require('../agents/personalities');

// Get decision for a specific agent
router.get('/:agentKey/decision', async (req, res) => {
    const { agentKey } = req.params;
    const agent = personalities[agentKey.toUpperCase()];

    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }

    try {
        const marketData = await getMarketData();
        const decision = await getAgentDecision(agent.personality, marketData);

        // Record profit from decision amount (real threshold -> real sweep when blockchain enabled)
        if (decision.action !== 'HOLD') {
            const amount = Number(decision.amount);
            if (!Number.isNaN(amount) && amount > 0) {
                treasuryService.recordProfit(agentKey, amount);
            }
        }

        const payload = {
            agent: agent.name,
            protocol: agent.protocol,
            market: marketData,
            decision,
        };

        const treasuryAddress = process.env.ARC_TREASURY_ADDRESS;
        const agentWallet = process.env.AGENT_WALLET;
        if (treasuryAddress && agentWallet) {
            const sweepPreview = await simulateDecision(decision, agentWallet, treasuryAddress);
            if (sweepPreview) payload.sweepPreview = sweepPreview;
        }

        res.json(payload);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all agent personalities
router.get('/personalities', (req, res) => {
    res.json(personalities);
});

// Get decisions for all agents (batch, for dashboard)
router.get('/decisions', async (req, res) => {
    const keys = Object.keys(personalities);
    const treasuryAddress = process.env.ARC_TREASURY_ADDRESS;
    const agentWallet = process.env.AGENT_WALLET;
    try {
        const { getMarketData } = require('../services/marketService');
        const marketData = await getMarketData();
        const results = await Promise.all(
            keys.map(async (agentKey) => {
                const agent = personalities[agentKey];
                try {
                    const decision = await getAgentDecision(agent.personality, marketData);
                    if (decision.action !== 'HOLD') {
                        const amount = Number(decision.amount);
                        if (!Number.isNaN(amount) && amount > 0) {
                            treasuryService.recordProfit(agentKey, amount);
                        }
                    }
                    let sweepPreview = null;
                    if (treasuryAddress && agentWallet) {
                        sweepPreview = await simulateDecision(decision, agentWallet, treasuryAddress);
                    }
                    return {
                        agentKey,
                        name: agent.name,
                        protocol: agent.protocol,
                        decision,
                        sweepPreview,
                    };
                } catch (err) {
                    return { agentKey, name: agent.name, protocol: agent.protocol, error: err.message };
                }
            })
        );
        res.json({ market: marketData, agents: results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
