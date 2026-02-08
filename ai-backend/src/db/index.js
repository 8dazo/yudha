const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = process.env.SQLITE_DB_PATH || path.join(DATA_DIR, 'yudha.sqlite');

let db = null;

function getDb() {
    if (db) return db;
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema();
    return db;
}

function initSchema() {
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(sql);
    try {
        db.exec('ALTER TABLE decisions ADD COLUMN play_deducted REAL');
    } catch (_) {
        // Column already exists (e.g. new install from schema)
    }
}

function insertMarketSnapshot(row) {
    const stmt = getDb().prepare(
        `INSERT INTO market_snapshots (price, change24h, volatility, source) VALUES (?, ?, ?, ?)`
    );
    const result = stmt.run(
        row.price,
        row.change24h != null ? String(row.change24h) : null,
        row.volatility ?? null,
        row.source ?? null
    );
    return result.lastInsertRowid;
}

function insertDecision(row) {
    const stmt = getDb().prepare(
        `INSERT INTO decisions (agent_key, agent_name, protocol, action, amount, thought, market_snapshot_id, player_address, play_deducted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
        row.agent_key,
        row.agent_name,
        row.protocol,
        row.action,
        row.amount,
        row.thought ?? null,
        row.market_snapshot_id,
        row.player_address ?? null,
        row.play_deducted != null ? row.play_deducted : null
    );
    return result.lastInsertRowid;
}

function getDecisionsPaginated(options = {}) {
    const { page = 1, limit = 50, agent_key, from, to } = options;
    const offset = (page - 1) * limit;
    let where = [];
    let params = [];
    if (agent_key) {
        where.push('d.agent_key = ?');
        params.push(agent_key);
    }
    if (from) {
        where.push("d.created_at >= ?");
        params.push(from);
    }
    if (to) {
        where.push("d.created_at <= ?");
        params.push(to);
    }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const countStmt = getDb().prepare(
        `SELECT COUNT(*) as total FROM decisions d ${whereClause}`
    );
    const countResult = countStmt.get(...params);
    const total = countResult.total;

    params.push(limit, offset);
    const stmt = getDb().prepare(
        `SELECT d.id, d.agent_key, d.agent_name, d.protocol, d.action, d.amount, d.thought, d.player_address, d.play_deducted, d.created_at,
                m.price as market_price, m.change24h as market_change24h, m.volatility as market_volatility, m.source as market_source
         FROM decisions d
         JOIN market_snapshots m ON d.market_snapshot_id = m.id
         ${whereClause}
         ORDER BY d.created_at DESC
         LIMIT ? OFFSET ?`
    );
    const rows = stmt.all(...params);
    return { rows, total, page, limit };
}

function getDecisionsStats() {
    const db = getDb();
    const byAgent = db.prepare(
        `SELECT agent_key, MAX(agent_name) as agent_name, COUNT(*) as count FROM decisions GROUP BY agent_key ORDER BY count DESC`
    ).all();
    const byAction = db.prepare(
        `SELECT action, COUNT(*) as count FROM decisions GROUP BY action`
    ).all();
    const timeBuckets = db.prepare(
        `SELECT date(created_at) as day, COUNT(*) as count FROM decisions GROUP BY date(created_at) ORDER BY day DESC LIMIT 30`
    ).all();
    const priceHistory = db.prepare(
        `SELECT d.created_at, m.price FROM decisions d JOIN market_snapshots m ON d.market_snapshot_id = m.id ORDER BY d.created_at ASC LIMIT 200`
    ).all();
    // Ensure numeric price for JSON (SQLite REAL may sometimes be string in edge cases)
    const priceHistoryNormalized = priceHistory.map((row) => ({
        created_at: row.created_at,
        price: Number(row.price) || 0,
    }));
    return { byAgent, byAction, timeBuckets, priceHistory: priceHistoryNormalized };
}

/**
 * Get per-agent last decisions with market price for dashboard hydration (charts + logs).
 * @param {number} limitPerAgent - Max decisions per agent (default 20)
 * @returns {{ agents: Record<string, { chartData: Array<{created_at: string, price: number}>, lastDecisions: Array<{created_at, action, amount, thought, market_price}> }> }}
 */
function getDashboardState(limitPerAgent = 20) {
    const database = getDb();
    const keys = ['DEGEN_DAVE', 'STABLE_SARAH', 'CHAD_BRIDGE', 'CORPORATE_KEN'];
    const agents = {};
    for (const agentKey of keys) {
        const rows = database.prepare(
            `SELECT d.created_at, d.action, d.amount, d.thought, m.price as market_price
             FROM decisions d
             JOIN market_snapshots m ON d.market_snapshot_id = m.id
             WHERE d.agent_key = ?
             ORDER BY d.created_at DESC
             LIMIT ?`
        ).all(agentKey, limitPerAgent);
        const chartData = rows.map((r) => ({
            created_at: r.created_at,
            price: Number(r.market_price) || 0,
        })).reverse();
        const lastDecisions = rows.map((r) => ({
            created_at: r.created_at,
            action: r.action,
            amount: r.amount,
            thought: r.thought,
            market_price: Number(r.market_price) || 0,
        }));
        agents[agentKey] = { chartData, lastDecisions };
    }
    return { agents };
}

function insertTreasuryEvent(row) {
    const stmt = getDb().prepare(
        `INSERT INTO treasury_events (event_type, wallet, amount, tx_hash) VALUES (?, ?, ?, ?)`
    );
    return stmt.run(
        row.event_type,
        row.wallet ?? null,
        row.amount != null ? String(row.amount) : null,
        row.tx_hash ?? null
    );
}

module.exports = {
    getDb,
    initSchema,
    insertMarketSnapshot,
    insertDecision,
    getDecisionsPaginated,
    getDecisionsStats,
    getDashboardState,
    insertTreasuryEvent,
};
