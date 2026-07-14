// Shared market data helpers (Binance mirror + Bybit fallback).
// Extracted from server.js — used by the binance_market routes and by
// server.js internals (scalp alerts, challenge prices, trade calls).
export const INVALID_BINANCE_SYMBOLS = new Set([
  'POWERUSDT', 'SIRENUSDT', 'PIPPINUSDT', 'RIVERUSDT', 'APEPEUSDT',
  'XAUTUSDT', 'FFUSDT', 'XPLUSDT', 'BARDUSDT', 'VVVUSDT', 'MONUSDT', 'KITEUSDT',
]); // Pre-populated known-bad symbols + runtime cache

export const BYBIT_FALLBACK_SYMBOLS = new Set(); // Cache of symbols that need Bybit

export const STABLECOIN_BASES = new Set([
  'USDT', 'USDC', 'BUSD', 'TUSD', 'DAI', 'FDUSD', 'USDP', 'USDD', 'GUSD',
  'FRAX', 'LUSD', 'SUSD', 'EURS', 'EURT', 'USDJ', 'UST', 'AUSD', 'PYUSD',
  'CRVUSD', 'EURC', 'USDE', 'EUR', 'GBP', 'AUD',
]);

// ─── Bybit interval mapping (Binance → Bybit) ───
function binanceToBybitInterval(interval) {
  const map = { '1m': '1', '3m': '3', '5m': '5', '15m': '15', '30m': '30', '1h': '60', '2h': '120', '4h': '240', '6h': '360', '12h': '720', '1d': 'D', '1w': 'W', '1M': 'M' };
  return map[interval] || '60';
}

// ─── Convert Bybit klines to Binance klines format ───
export function bybitKlinesToBinanceFormat(bybitList) {
  // Bybit returns: [[timestamp, open, high, low, close, volume, turnover], ...]
  // Bybit returns newest first, so reverse
  const reversed = [...bybitList].reverse();
  return reversed.map(k => [
    parseInt(k[0]),        // 0: Open time (timestamp ms)
    k[1],                  // 1: Open
    k[2],                  // 2: High
    k[3],                  // 3: Low
    k[4],                  // 4: Close
    k[5],                  // 5: Volume
    parseInt(k[0]) + 60000, // 6: Close time (approx)
    k[6] || '0',           // 7: Quote asset volume (turnover)
    '0',                   // 8: Number of trades
    '0',                   // 9: Taker buy base
    '0',                   // 10: Taker buy quote
    '0',                   // 11: Ignore
  ]);
}

// ─── Fetch klines from Bybit as fallback ───
export async function fetchBybitKlines(symbol, interval, limit) {
  const bybitInterval = binanceToBybitInterval(interval);
  const url = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${bybitInterval}&limit=${limit}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'User-Agent': 'CryptoIA/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!resp.ok) return null;
  const json = await resp.json();
  if (json.retCode !== 0 || !json.result?.list?.length) return null;
  return json.result.list;
}

// ─── Fetch ticker price from Bybit as fallback ───
export async function fetchBybitPrice(symbol) {
  const url = `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!resp.ok) return null;
  const json = await resp.json();
  if (json.retCode !== 0 || !json.result?.list?.length) return null;
  return parseFloat(json.result.list[0].lastPrice);
}
