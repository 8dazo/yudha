#!/usr/bin/env node
/**
 * Run API tests against the current app (starts server in-process on a random port).
 * Use when you want to test the exact code in this repo without relying on an external server.
 * Usage: node scripts/test-apis-with-server.js
 */
const http = require('http');

async function main() {
    const app = require('../src/server');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const BASE = `http://127.0.0.1:${port}`;
    process.env.BASE_URL = BASE;

    const { execSync } = require('child_process');
    const path = require('path');
    try {
        execSync(`node scripts/test-apis.js`, {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..'),
            env: { ...process.env, BASE_URL: BASE },
        });
    } finally {
        server.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
