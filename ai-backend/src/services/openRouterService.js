const axios = require('axios');
const { OPENROUTER_API_KEY, OPENROUTER_MODEL } = require('../config');

const openRouter = axios.create({
    baseURL: 'https://openrouter.ai/api/v1',
    headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/yourusername/yudha', // Required by OpenRouter
        'X-Title': 'Yudha AI Trading Arena', // Required by OpenRouter
    },
});

/**
 * Get a decision from an AI agent based on personality and market data.
 * @param {string} personality - The system prompt for the agent.
 * @param {object} marketData - The current market state.
 * @param {number|null} playBalanceArena - Optional. Current Arena play token balance (human units). When set, the model is instructed not to exceed it and to prefer conservative sizing when low.
 * @returns {Promise<object>} - The agent's decision and thought process.
 */
const getAgentDecision = async (personality, marketData, playBalanceArena = null) => {
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
        const err = new Error('OpenRouter not configured: set OPENROUTER_API_KEY in .env for real AI decisions');
        err.code = 'OPENROUTER_NOT_CONFIGURED';
        throw err;
    }

    let userContent = `Current market data: ${JSON.stringify(marketData)}.`;
    if (playBalanceArena != null && typeof playBalanceArena === 'number' && playBalanceArena >= 0) {
        userContent += ` You have ${playBalanceArena.toFixed(2)} Arena play tokens available. Do not suggest BUY or SELL amounts greater than this. Prefer HOLD or smaller sizes when balance is low (e.g. below 20% of a typical position).`;
    }
    userContent += ` Provide your next action strictly in JSON format: {"action": "BUY"|"SELL"|"HOLD", "amount": number, "thought": "your brief reasoning"}`;

    try {
        const response = await openRouter.post('/chat/completions', {
            model: OPENROUTER_MODEL,
            messages: [
                { role: 'system', content: personality },
                { role: 'user', content: userContent },
            ],
            response_format: { type: 'json_object' },
        });

        return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
        console.error('Error fetching agent decision:', error.response?.data || error.message);
        throw error;
    }
};

module.exports = {
    getAgentDecision,
};
