-- Yudha Arena: schema for agent decisions and market history
-- Run this to create tables (e.g. on first start or manually).

CREATE TABLE IF NOT EXISTS market_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    price REAL NOT NULL,
    change24h TEXT,
    volatility REAL,
    source TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_key TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    protocol TEXT NOT NULL,
    action TEXT NOT NULL,
    amount REAL NOT NULL,
    thought TEXT,
    market_snapshot_id INTEGER NOT NULL,
    player_address TEXT,
    play_deducted REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (market_snapshot_id) REFERENCES market_snapshots(id)
);

CREATE INDEX IF NOT EXISTS idx_decisions_agent_key ON decisions(agent_key);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_decisions_action ON decisions(action);

CREATE TABLE IF NOT EXISTS treasury_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    wallet TEXT,
    amount TEXT,
    tx_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_treasury_events_created_at ON treasury_events(created_at);
