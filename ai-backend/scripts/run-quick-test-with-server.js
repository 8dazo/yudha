#!/usr/bin/env node
/**
 * Start server on random port, run test-apis-quick.js, then exit.
 * Usage: node scripts/run-quick-test-with-server.js
 */
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const app = require('../src/server');
const server = http.createServer(app);

server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    const BASE = `http://127.0.0.1:${port}`;
    const child = spawn(
        process.execPath,
        [path.join(__dirname, 'test-apis-quick.js')],
        {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..'),
            env: { ...process.env, BASE_URL: BASE },
        }
    );
    child.on('close', (code) => {
        server.close();
        process.exit(code);
    });
});
