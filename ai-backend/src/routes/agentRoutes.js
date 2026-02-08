const express = require('express');
const router = express.Router();
const config = require('../config');
const { getAgentDecision } = require('../services/openRouterService');
const { getMarketData } = require('../services/marketService');
const treasuryService = require('../services/treasuryService');
const { deductPlay, getArenaBalance } = require('../services/blockchainService');
const personalities = require('../agents/personalities');
const db = require('../db');

// Static routes MUST come before /:agentKey/decision so they are not matched as agentKey
// Dashboard state from SQL (per-agent chart + decisions for frontend hydration)
router.get('/dashboard-state', (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
        const state = db.getDashboardState(limit);
        res.json(state);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all agent personalities
router.get('/personalities', (req, res) => {
    res.json(personalities);
});

// Get decisions for all agents (batch) - one agent at a time: fetch market, decide, deduct, persist, then next
// Each agent gets its own market snapshot so charts and state can differ per agent
router.get('/decisions', async (req, res) => {
    const keys = Object.keys(personalities);
    try {
        const arenaAddress = config.ARENA_TREASURY_ADDRESS;
        const playerWallet = config.AGENT_WALLET;
        let remainingBalance = 0;
        if (arenaAddress && playerWallet) {
            remainingBalance = await getArenaBalance(arenaAddress, playerWallet);
        }

        const results = [];
        for (const agentKey of keys) {
            const agent = personalities[agentKey];
            try {
                // Fresh market data per agent so each sees current state and charts differ
                const marketData = await getMarketData();
                const marketSnapshotId = db.insertMarketSnapshot({
                    price: marketData.price,
                    change24h: marketData.change24h,
                    volatility: marketData.volatility,
                    source: marketData.source,
                });

                const decision = await getAgentDecision(agent.personality, marketData, remainingBalance);
                const requestedAmount = Number(decision.amount) || 0;

                let playDeducted = null;
                if (decision.action !== 'HOLD' && !Number.isNaN(requestedAmount) && requestedAmount > 0) {
                    treasuryService.recordProfit(agentKey, requestedAmount);
                    if (arenaAddress && playerWallet) {
                        const amountToDeduct = Math.min(requestedAmount, Math.max(0, remainingBalance));
                        if (amountToDeduct > 0) {
                            const result = await deductPlay(arenaAddress, playerWallet, amountToDeduct);
                            if (result.success) {
                                playDeducted = amountToDeduct;
                                db.insertTreasuryEvent({ event_type: 'play_deduct', wallet: playerWallet, amount: amountToDeduct, tx_hash: result.txHash });
                                remainingBalance -= amountToDeduct;
                            }
                        }
                    }
                }

                db.insertDecision({
                    agent_key: agentKey,
                    agent_name: agent.name,
                    protocol: agent.protocol,
                    action: decision.action,
                    amount: requestedAmount,
                    thought: decision.thought,
                    market_snapshot_id: marketSnapshotId,
                    play_deducted: playDeducted,
                });

                if (agentKey === 'CHAD_BRIDGE' && decision.action !== 'HOLD' && requestedAmount > 0 && playerWallet) {
                    db.insertTreasuryEvent({ event_type: 'bridge_requested', wallet: playerWallet, amount: String(requestedAmount), tx_hash: null });
                }

                results.push({
                    agentKey,
                    name: agent.name,
                    protocol: agent.protocol,
                    decision,
                    market: marketData,
                });
            } catch (err) {
                console.warn('[agents/decisions] Agent failed:', agentKey, err.message);
                results.push({ agentKey, name: agent.name, protocol: agent.protocol, error: err.message });
            }
        }

        res.json({ agents: results });
    } catch (error) {
        console.error('[agents/decisions] Batch failed:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get decision for a specific agent
router.get('/:agentKey/decision', async (req, res) => {
    const { agentKey } = req.params;
    const agent = personalities[agentKey.toUpperCase()];

    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }

    try {
        const marketData = await getMarketData();
        const arenaAddress = config.ARENA_TREASURY_ADDRESS;
        const playerWallet = config.AGENT_WALLET;
        let playBalanceArena = null;
        if (arenaAddress && playerWallet) {
            playBalanceArena = await getArenaBalance(arenaAddress, playerWallet);
        }

        const decision = await getAgentDecision(agent.personality, marketData, playBalanceArena);
        const requestedAmount = Number(decision.amount) || 0;

        let playDeducted = null;
        if (decision.action !== 'HOLD' && !Number.isNaN(requestedAmount) && requestedAmount > 0) {
            treasuryService.recordProfit(agentKey, requestedAmount);
            if (arenaAddress && playerWallet && playBalanceArena != null) {
                const amountToDeduct = Math.min(requestedAmount, Math.max(0, playBalanceArena));
                if (amountToDeduct > 0) {
                    const result = await deductPlay(arenaAddress, playerWallet, amountToDeduct);
                    if (result.success) {
                        playDeducted = amountToDeduct;
                        db.insertTreasuryEvent({ event_type: 'play_deduct', wallet: playerWallet, amount: amountToDeduct, tx_hash: result.txHash });
                    }
                }
            }
        }

        // Persist to SQL (requested amount so log shows what AI said; play_deducted = actual deducted)
        try {
            const marketSnapshotId = db.insertMarketSnapshot({
                price: marketData.price,
                change24h: marketData.change24h,
                volatility: marketData.volatility,
                source: marketData.source,
            });
            db.insertDecision({
                agent_key: agentKey,
                agent_name: agent.name,
                protocol: agent.protocol,
                action: decision.action,
                amount: requestedAmount,
                thought: decision.thought,
                market_snapshot_id: marketSnapshotId,
                play_deducted: playDeducted,
            });
        } catch (err) {
            console.warn('[DB] Persist decision failed:', err.message);
        }

        res.json({
            agent: agent.name,
            protocol: agent.protocol,
            market: marketData,
            decision,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
