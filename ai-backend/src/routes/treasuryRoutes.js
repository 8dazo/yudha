const express = require('express');
const router = express.Router();
const treasuryService = require('../services/treasuryService');

/**
 * GET /api/treasury
 * Treasury stats + in-memory profits + recent ProfitSwept events from chain.
 * Query: fromBlock, toBlock (optional, for event range).
 */
router.get('/', async (req, res) => {
    try {
        const fromBlock = req.query.fromBlock != null ? parseInt(req.query.fromBlock, 10) : undefined;
        const toBlock = req.query.toBlock != null ? parseInt(req.query.toBlock, 10) : undefined;
        const data = await treasuryService.getStatsWithEvents(fromBlock, toBlock);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/treasury/stats
 * Lightweight stats only (no event fetch).
 */
router.get('/stats', (req, res) => {
    res.json(treasuryService.getStats());
});

module.exports = router;
