const axios = require('axios');

const COINGECKO_ETH_ID = 'ethereum';
const COINGECKO_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_ETH_ID}&vs_currencies=usd&include_24hr_change=true`;

let fallbackPrice = 2500;
let fallbackVolatility = 0.02;

/**
 * Fetch live ETH/USD price and 24h change from CoinGecko.
 * @returns {Promise<object|null>} - { price, change24h } or null on failure.
 */
async function fetchLivePrice() {
    try {
        const { data } = await axios.get(COINGECKO_URL, { timeout: 5000 });
        const eth = data[COINGECKO_ETH_ID];
        if (!eth || typeof eth.usd !== 'number') return null;
        const change24h = eth.usd_24h_change != null ? eth.usd_24h_change : 0;
        return { price: eth.usd, change24h };
    } catch (err) {
        console.warn('[Market] CoinGecko fetch failed:', err.message);
        return null;
    }
}

/**
 * Mock market data (fallback when live API fails).
 */
function getMockMarketData() {
    const change = (Math.random() - 0.48) * fallbackPrice * fallbackVolatility;
    fallbackPrice += change;
    fallbackVolatility = Math.max(0.01, Math.min(0.05, fallbackVolatility + (Math.random() - 0.5) * 0.005));
    return {
        price: parseFloat(fallbackPrice.toFixed(2)),
        change24h: (Math.random() * 10 - 5).toFixed(2),
        volatility: parseFloat(fallbackVolatility.toFixed(4)),
        timestamp: new Date().toISOString(),
    };
}

/**
 * Get current market data. Uses CoinGecko when available, otherwise mock.
 * @returns {Promise<object>} - { price, change24h, volatility, timestamp }.
 */
async function getMarketData() {
    const live = await fetchLivePrice();
    if (live) {
        const change24h = typeof live.change24h === 'number' ? live.change24h.toFixed(2) : String(live.change24h || 0);
        const volatility = Math.min(0.05, Math.max(0.01, Math.abs(live.change24h || 0) / 100));
        return {
            price: parseFloat(Number(live.price).toFixed(2)),
            change24h,
            volatility: parseFloat(volatility.toFixed(4)),
            timestamp: new Date().toISOString(),
        };
    }
    return getMockMarketData();
}

module.exports = {
    getMarketData,
};
