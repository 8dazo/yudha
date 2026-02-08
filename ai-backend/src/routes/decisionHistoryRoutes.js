const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
        const agent_key = req.query.agent_key || undefined;
        const from = req.query.from || undefined;
        const to = req.query.to || undefined;
        const result = db.getDecisionsPaginated({ page, limit, agent_key, from, to });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/stats', (req, res) => {
    try {
        const stats = db.getDecisionsStats();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
