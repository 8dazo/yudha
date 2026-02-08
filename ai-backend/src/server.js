const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PORT } = require('./config');
const db = require('./db');

const app = express();

// Init SQLite DB (run schema if needed)
db.getDb();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const agentRoutes = require('./routes/agentRoutes');
const treasuryRoutes = require('./routes/treasuryRoutes');
const decisionHistoryRoutes = require('./routes/decisionHistoryRoutes');

// Routes
app.use('/api/agents', agentRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/decisions', decisionHistoryRoutes);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
    res.send('Yudha AI Agent Backend is running.');
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Yudha Backend running on port ${PORT}`);
});

module.exports = app;
