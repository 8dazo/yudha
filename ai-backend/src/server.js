const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PORT } = require('./config');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const agentRoutes = require('./routes/agentRoutes');

// Routes
app.use('/api/agents', agentRoutes);
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
