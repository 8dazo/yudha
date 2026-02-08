const axios = require('axios');

const COINGECKO_ETH_ID = 'ethereum';
const COINGECKO_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_ETH_ID}&vs_currencies=usd&include_24hr_change=true`;
const BINANCE_TICKER_URL = 'https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT';

let fallbackPrice = 2500;
let fallbackVolatility = 0.02;

/**
 * CoinGecko: no key (rate limited) or COINGECKO_API_KEY for Demo API (free, higher limits). Header: x-cg-demo-api-key.
 * @returns {Promise<object|null>} - { price, change24h } or null.
 */
async function fetchFromCoinGecko() {
    const apiKey = process.env.COINGECKO_API_KEY;
    const headers = apiKey ? { 'x-cg-demo-api-key': apiKey } : {};
    try {
        const { data } = await axios.get(COINGECKO_URL, { timeout: 5000, headers });
        const eth = data[COINGECKO_ETH_ID];
        if (!eth || typeof eth.usd !== 'number') return null;
        const change24h = eth.usd_24h_change != null ? eth.usd_24h_change : 0;
        return { price: eth.usd, change24h };
    } catch (err) {
        console.warn('[Market] CoinGecko failed:', err.message);
        return null;
    }
}

/**
 * Binance: free, no API key, public ticker. Good alternative if CoinGecko is rate-limited.
 * @returns {Promise<object|null>} - { price, change24h } or null.
 */
async function fetchFromBinance() {
    try {
        const { data } = await axios.get(BINANCE_TICKER_URL, { timeout: 5000 });
        const price = parseFloat(data.lastPrice);
        const change24h = parseFloat(data.priceChangePercent) || 0;
        if (!Number.isFinite(price)) return null;
        return { price, change24h };
    } catch (err) {
        console.warn('[Market] Binance failed:', err.message);
        return null;
    }
}

/**
 * Fetch live ETH/USD. Tries CoinGecko then Binance (both free, no key). Use MARKET_DATA_SOURCE=coingecko|binance to force one.
 */
async function fetchLivePrice() {
    const source = (process.env.MARKET_DATA_SOURCE || 'auto').toLowerCase();
    if (source === 'binance') {
        const b = await fetchFromBinance();
        if (b) return { ...b, _source: 'binance' };
        return null;
    }
    if (source === 'coingecko') {
        const c = await fetchFromCoinGecko();
        if (c) return { ...c, _source: 'coingecko' };
        return null;
    }
    const c = await fetchFromCoinGecko();
    if (c) return { ...c, _source: 'coingecko' };
    const b = await fetchFromBinance();
    if (b) return { ...b, _source: 'binance' };
    return null;
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
 * Get current market data. Uses CoinGecko when available, otherwise fallback (marked in response).
 * @returns {Promise<object>} - { price, change24h, volatility, timestamp, source: 'coingecko'|'fallback' }.
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
            source: live._source || 'coingecko',
        };
    }
    const fallback = getMockMarketData();
    fallback.source = 'fallback';
    return fallback;
}

module.exports = {
    getMarketData,
};
