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

        // Simulate profit recording for treasury demo
        if (decision.action !== 'HOLD') {
            const profit = Math.floor(Math.random() * 20) + 1;
            treasuryService.recordProfit(agentKey, profit);
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
            const simulation = await simulateDecision(decision, agentWallet, treasuryAddress);
            if (simulation) payload.simulation = simulation;
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

module.exports = router;
