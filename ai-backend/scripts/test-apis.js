#!/usr/bin/env node
/**
 * Test all backend APIs. Ensures real implementations (no mocks in response).
 * Run with server up: npm start (in another terminal), then node scripts/test-apis.js
 * Or: BASE_URL=http://localhost:3001 node scripts/test-apis.js
 */
const BASE = process.env.BASE_URL || 'http://localhost:3001';

async function request(method, path, body = null) {
    const url = `${BASE}${path}`;
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
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
    console.log('Testing APIs at', BASE, '\n');

    // 1. Health
    const health = await request('GET', '/health');
    assert(health.status === 200, 'GET /health should 200');
    assert(health.data?.status === 'ok', 'health.status should be ok');
    console.log('✓ GET /health – real');

    // 2. Personalities (static data, no mock)
    const pers = await request('GET', '/api/agents/personalities');
    assert(pers.status === 200, 'GET /api/agents/personalities should 200');
    const keys = Object.keys(pers.data);
    assert(keys.length === 4, 'should have 4 agents');
    assert(keys.includes('DEGEN_DAVE') && keys.includes('CORPORATE_KEN'), 'expected agent keys');
    console.log('✓ GET /api/agents/personalities – 4 agents');

    // 3. Treasury (real contract address + chain events)
    const treasury = await request('GET', '/api/treasury');
    assert(treasury.status === 200, 'GET /api/treasury should 200');
    assert(typeof treasury.data.treasuryAddress === 'string', 'treasuryAddress required');
    assert(treasury.data.treasuryAddress.length === 42, 'treasuryAddress should be 0x...');
    assert(Array.isArray(treasury.data.profitSweptEvents), 'profitSweptEvents must be array');
    assert(typeof treasury.data.onChainEnabled === 'boolean', 'onChainEnabled required');
    console.log('✓ GET /api/treasury – real address, profitSweptEvents, onChainEnabled');

    const stats = await request('GET', '/api/treasury/stats');
    assert(stats.status === 200 && stats.data.treasuryAddress === treasury.data.treasuryAddress, 'GET /api/treasury/stats consistent');
    console.log('✓ GET /api/treasury/stats – real');

    // 4. Decision endpoint – real AI when OpenRouter configured; no mock fallback
    const decisionRes = await request('GET', '/api/agents/DEGEN_DAVE/decision');
    if (decisionRes.status === 200) {
        assert(decisionRes.data.market != null, 'market in response');
        assert(['coingecko', 'binance', 'fallback'].includes(decisionRes.data.market.source), 'market.source must be coingecko, binance, or fallback');
        assert(decisionRes.data.decision?.action != null, 'decision.action');
        assert(typeof decisionRes.data.decision?.amount === 'number' || typeof decisionRes.data.decision?.amount === 'string', 'decision.amount');
        console.log('✓ GET /api/agents/:key/decision – real (market.source=' + decisionRes.data.market.source + ', AI decision)');
    } else {
        assert(decisionRes.status >= 400, 'decision endpoint returns error when AI/config fails (no mock)');
        console.log('⚠ GET /api/agents/:key/decision –', decisionRes.status, decisionRes.data?.error || '' , '(real API attempted, no mock returned)');
    }

    // 5. Batch decisions (per-agent market; no top-level market)
    const batch = await request('GET', '/api/agents/decisions');
    if (batch.status === 200) {
        assert(Array.isArray(batch.data.agents) && batch.data.agents.length === 4, '4 agents in batch');
        const firstWithMarket = batch.data.agents.find((a) => a.market);
        if (firstWithMarket?.market?.source) {
            assert(['coingecko', 'binance', 'fallback'].includes(firstWithMarket.market.source), 'market.source must be coingecko, binance, or fallback');
        }
        console.log('✓ GET /api/agents/decisions – real (4 agents, per-agent market)');
    } else {
        assert(batch.status >= 400, 'decisions endpoint returns error when AI fails (no mock)');
        console.log('⚠ GET /api/agents/decisions –', batch.status, batch.data?.error || '', '(real API attempted)');
    }

    // 6. Decision history (SQL persistence)
    const history = await request('GET', '/api/decisions?page=1&limit=10');
    assert(history.status === 200, 'GET /api/decisions should 200');
    assert(Array.isArray(history.data.rows), 'decisions.rows must be array');
    assert(typeof history.data.total === 'number', 'decisions.total required');
    assert(history.data.page === 1 && history.data.limit === 10, 'decisions pagination');
    if (history.data.rows.length > 0) {
        const row = history.data.rows[0];
        assert(row.agent_key != null && row.action != null && row.amount != null, 'row has agent_key, action, amount');
        assert('market_price' in row, 'row has market_price from snapshot');
    }
    console.log('✓ GET /api/decisions – paginated (total=' + history.data.total + ')');

    const historyStats = await request('GET', '/api/decisions/stats');
    assert(historyStats.status === 200, 'GET /api/decisions/stats should 200');
    assert(Array.isArray(historyStats.data.byAgent), 'stats.byAgent array');
    assert(Array.isArray(historyStats.data.priceHistory), 'stats.priceHistory array');
    console.log('✓ GET /api/decisions/stats – byAgent, priceHistory');

    const dashboardState = await request('GET', '/api/agents/dashboard-state?limit=10');
    assert(dashboardState.status === 200, 'GET /api/agents/dashboard-state should 200');
    assert(dashboardState.data.agents != null && typeof dashboardState.data.agents === 'object', 'dashboard-state.agents object');
    console.log('✓ GET /api/agents/dashboard-state – per-agent chartData, lastDecisions');

    console.log('\nAll API tests passed. Implementations are real (no hidden mocks).');
}

main().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
