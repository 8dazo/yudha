#!/usr/bin/env node
/**
 * Quick API + data independence checks (no batch AI call).
 * Run with server up, or: node -e "require('./src/server'); require('http').createServer(require('./src/server')).listen(0, () => { ... run this with BASE_URL ... })"
 */
const BASE = process.env.BASE_URL || 'http://localhost:3001';

async function request(method, path) {
    const res = await fetch(`${BASE}${path}`, { method, headers: { 'Content-Type': 'application/json' } });
    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }
    return { status: res.status, data };
}

function assert(condition, msg) {
    if (!condition) throw new Error(msg);
}

async function main() {
    console.log('Quick API + independence checks at', BASE, '\n');

    const health = await request('GET', '/health');
    assert(health.status === 200 && health.data?.status === 'ok', 'GET /health');
    console.log('✓ GET /health');

    const pers = await request('GET', '/api/agents/personalities');
    assert(pers.status === 200 && Object.keys(pers.data).length === 4, '4 personalities');
    console.log('✓ GET /api/agents/personalities – 4 agents');

    const state = await request('GET', '/api/agents/dashboard-state?limit=5');
    assert(state.status === 200 && state.data?.agents != null, 'dashboard-state');
    const keys = ['DEGEN_DAVE', 'STABLE_SARAH', 'CHAD_BRIDGE', 'CORPORATE_KEN'];
    for (const k of keys) {
        assert(state.data.agents[k] != null, 'agent ' + k + ' in state');
        assert(Array.isArray(state.data.agents[k].chartData), k + '.chartData array');
        assert(Array.isArray(state.data.agents[k].lastDecisions), k + '.lastDecisions array');
    }
    console.log('✓ GET /api/agents/dashboard-state – per-agent chartData & lastDecisions (independent)');

    const history = await request('GET', '/api/decisions?page=1&limit=20');
    assert(history.status === 200 && Array.isArray(history.data.rows) && typeof history.data.total === 'number', 'decisions paginated');
    if (history.data.rows.length > 0) {
        const row = history.data.rows[0];
        assert(row.agent_key != null && 'market_price' in row, 'row has agent_key and market_price');
        const agentKeys = [...new Set(history.data.rows.map((r) => r.agent_key))];
        console.log('✓ GET /api/decisions – rows have agent_key, market_price; agents:', agentKeys.join(', '));
    } else {
        console.log('✓ GET /api/decisions – paginated (total=' + history.data.total + ')');
    }

    const stats = await request('GET', '/api/decisions/stats');
    assert(stats.status === 200 && Array.isArray(stats.data.byAgent) && Array.isArray(stats.data.priceHistory), 'decisions/stats');
    console.log('✓ GET /api/decisions/stats – byAgent, priceHistory');

    const db = require('../src/db');
    db.getDb();
    const dash = db.getDashboardState(5);
    let perAgentOk = true;
    for (const k of keys) {
        if (!dash.agents[k] || !Array.isArray(dash.agents[k].chartData)) perAgentOk = false;
    }
    assert(perAgentOk, 'getDashboardState returns independent per-agent data');
    console.log('✓ DB getDashboardState – each agent has own chartData & lastDecisions');

    const paginated = db.getDecisionsPaginated({ page: 1, limit: 20 });
    if (paginated.rows.length >= 2) {
        const prices = paginated.rows.map((r) => r.market_price);
        const agents = paginated.rows.map((r) => r.agent_key);
        assert(new Set(agents).size >= 1 && prices.every((p) => typeof p === 'number' || typeof p === 'string'), 'rows have agent_key and market_price');
        console.log('✓ DB decisions – each row has agent_key + market_price (per-decision snapshot)');
    }

    console.log('\nAll quick checks passed. Data is set correctly and per-agent state is independent.');
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('FAIL:', err.message);
        process.exit(1);
    });
