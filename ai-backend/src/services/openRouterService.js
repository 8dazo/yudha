const axios = require('axios');
const { OPENROUTER_API_KEY } = require('../config');

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
 * @returns {Promise<object>} - The agent's decision and thought process.
 */
const getAgentDecision = async (personality, marketData) => {
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
        // Development fallback for demo purposes
        return {
            action: Math.random() > 0.5 ? 'BUY' : 'HOLD',
            amount: Math.floor(Math.random() * 5) + 1,
            thought: `[DEV MODE] Analyzing price at ${marketData.price}. Momentum seems ${marketData.change24h > 0 ? 'bullish' : 'bearish'}. Looking for ${personality.split(',')[0]} opportunities.`,
        };
    }

    try {
        const response = await openRouter.post('/chat/completions', {
            model: 'meta-llama/llama-3-8b-instruct:free', // Defaulting to a free model for setup
            messages: [
                { role: 'system', content: personality },
                {
                    role: 'user',
                    content: `Current market data: ${JSON.stringify(marketData)}. Provide your next action strictly in JSON format: {"action": "BUY"|"SELL"|"HOLD", "amount": number, "thought": "your brief reasoning"}`
                },
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
