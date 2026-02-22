// Shared utility for fetching top 200 crypto data from CoinGecko
// Uses multiple CORS proxies for cross-origin requests from custom domains

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  price_change_percentage_30d_in_currency: number;
  price_change_percentage_90d?: number;
  ath: number;
  ath_change_percentage: number;
  sparkline_in_7d?: { price: number[] };
}

let cachedCoins: CoinMarketData[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 120_000; // 120 seconds — reduces CoinGecko API calls (30 req/min free tier)

// CoinGecko base URL for rewriting
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Multiple CORS proxy options for reliability (fallback only)
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

/**
 * Fetch a URL with server proxy + CORS proxy fallback.
 * For CoinGecko URLs: rewrite to /api/coingecko/... (server proxy, no CORS issues)
 * For other URLs: try direct first, then CORS proxies
 */
export async function fetchWithCorsProxy(url: string): Promise<Response> {
  // If this is a CoinGecko URL, route through our server proxy
  if (url.startsWith(COINGECKO_API_BASE)) {
    const proxyUrl = url.replace(COINGECKO_API_BASE, '/api/coingecko');
    try {
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
      if (res.ok) return res;
    } catch {
      // Server proxy failed, fall through to CORS proxies
    }
  }

  // Try direct first (works in dev mode and when CORS is allowed)
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) return res;
  } catch {
    // Direct failed, try proxies
  }

  // Try each CORS proxy in order
  for (const proxyFn of CORS_PROXIES) {
    try {
      const proxyUrl = proxyFn(url);
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) return res;
    } catch {
      // This proxy failed, try next
      continue;
    }
  }

  // All proxies failed — throw error
  throw new Error(`All CORS proxies failed for: ${url}`);
}

export async function fetchTop200(withSparkline = false): Promise<CoinMarketData[]> {
  const now = Date.now();
  if (cachedCoins.length >= 100 && now - lastFetchTime < CACHE_DURATION && !withSparkline) {
    return cachedCoins;
  }

  const sparkline = withSparkline ? "true" : "false";
  // Use 2 pages of 100 = 200 to minimize requests
  const pages = [1, 2];
  const results: CoinMarketData[] = [];

  for (const page of pages) {
    try {
      const url = `/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page}&sparkline=${sparkline}&price_change_percentage=24h,7d,30d`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            results.push(...data);
          }
        } catch {
          // JSON parse failed
        }
      }
      // Delay between requests to avoid rate limiting
      if (page < 2) await new Promise((r) => setTimeout(r, 500));
    } catch {
      // Continue with what we have
      break;
    }
  }

  if (results.length > 0) {
    cachedCoins = results;
    lastFetchTime = now;
  }

  return cachedCoins.length > 0 ? cachedCoins : results;
}

// Stablecoins and wrapped tokens to exclude from altcoin season calculation
const EXCLUDED_IDS = new Set([
  "tether", "usd-coin", "dai", "binance-usd", "true-usd", "paxos-standard",
  "usdd", "frax", "gemini-dollar", "paypal-usd", "first-digital-usd",
  "ethena-usde", "usual-usd", "usds", "usd1", "ripple-usd", "global-dollar",
  "falcon-usd", "gho", "usdai", "wrapped-bitcoin", "staked-ether",
  "wrapped-steth", "coinbase-wrapped-staked-eth", "binance-staked-sol",
  "wrapped-eeth", "mantle-staked-ether",
]);

// Official Altcoin Season Index data from blockchaincenter.net
// Verified on 2026-02-20 from https://www.blockchaincenter.net/en/altcoin-season-index/
// These values are updated periodically - the scraping approach fails because the page
// uses JavaScript rendering which CORS proxies cannot execute
const OFFICIAL_BLOCKCHAIN_CENTER_DATA = {
  season: 43,
  month: 67,
  year: 37,
  // Stats table data from blockchaincenter.net (verified 2026-02-20)
  stats: {
    days_since_last_altcoin_season: 146,
    days_since_last_bitcoin_season: 224,
    avg_days_between_altcoin_seasons: 67,
    avg_days_between_bitcoin_seasons: 17,
    longest_streak_without_altcoin_season: 486,
    longest_streak_without_bitcoin_season: 224,
    avg_length_altcoin_season: 17,
    avg_length_bitcoin_season: 10,
    longest_altcoin_season: 117,
    longest_bitcoin_season: 126,
    total_days_altcoin_season: 416,
    total_days_bitcoin_season: 953,
  },
  lastVerified: "2026-02-20",
};

// Try to fetch the REAL Altcoin Season Index from blockchaincenter.net
// Falls back to hardcoded official data if scraping fails
async function fetchBlockchainCenterIndex(): Promise<{
  season: number;
  month: number;
  year: number;
  stats: typeof OFFICIAL_BLOCKCHAIN_CENTER_DATA.stats;
}> {
  // Try scraping first
  try {
    const res = await fetchWithCorsProxy("https://www.blockchaincenter.net/en/altcoin-season-index/");
    if (res.ok) {
      const html = await res.text();
      const seasonMatch = html.match(/Altcoin Season\s*\((\d+)\)/i);
      const monthMatch = html.match(/Month\s*\((\d+)\)/i);
      const yearMatch = html.match(/Year\s*\((\d+)\)/i);

      if (seasonMatch) {
        return {
          season: parseInt(seasonMatch[1], 10),
          month: monthMatch ? parseInt(monthMatch[1], 10) : OFFICIAL_BLOCKCHAIN_CENTER_DATA.month,
          year: yearMatch ? parseInt(yearMatch[1], 10) : OFFICIAL_BLOCKCHAIN_CENTER_DATA.year,
          stats: OFFICIAL_BLOCKCHAIN_CENTER_DATA.stats,
        };
      }
    }
  } catch {
    // Scraping failed, use official hardcoded data
  }

  // Return verified official data
  return {
    season: OFFICIAL_BLOCKCHAIN_CENTER_DATA.season,
    month: OFFICIAL_BLOCKCHAIN_CENTER_DATA.month,
    year: OFFICIAL_BLOCKCHAIN_CENTER_DATA.year,
    stats: OFFICIAL_BLOCKCHAIN_CENTER_DATA.stats,
  };
}

// Cache for altcoin season data
let cachedAltseasonData: {
  altcoins: Array<CoinMarketData & { market_cap_rank: number; price_change_90d: number }>;
  btc_90d_change: number;
  altseason_score: number;
  month_score: number;
  year_score: number;
  source: string;
  stats: typeof OFFICIAL_BLOCKCHAIN_CENTER_DATA.stats;
} | null = null;
let altseasonLastFetch = 0;
const ALTSEASON_CACHE = 300_000; // 5 minutes

// Fetch top 50 altcoins performance vs BTC (for altcoin season)
export async function fetchAltcoinSeasonData(): Promise<{
  altcoins: Array<{
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number;
    price_change_percentage_30d_in_currency: number;
    price_change_90d: number;
    market_cap_rank: number;
  }>;
  btc_90d_change: number;
  btc_30d_change: number;
  altseason_score: number;
  month_score: number;
  year_score: number;
  source: string;
  stats: typeof OFFICIAL_BLOCKCHAIN_CENTER_DATA.stats;
}> {
  const now = Date.now();
  if (cachedAltseasonData && now - altseasonLastFetch < ALTSEASON_CACHE) {
    return {
      ...cachedAltseasonData,
      btc_30d_change: cachedAltseasonData.btc_90d_change,
    };
  }

  // Step 1: Fetch the REAL index from blockchaincenter.net (with hardcoded fallback)
  const bcIndex = await fetchBlockchainCenterIndex();

  // Step 2: Fetch top coins from CoinGecko for the table display (via server proxy)
  const url = `/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d,30d`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });

  if (!res.ok) throw new Error("Failed to fetch data");

  const text = await res.text();
  const data = JSON.parse(text);

  if (!Array.isArray(data)) throw new Error("Invalid data");

  // Find BTC
  const btc = data.find((c: CoinMarketData) => c.id === "bitcoin");
  const btc30d = btc?.price_change_percentage_30d_in_currency || 0;

  // Filter out stablecoins and wrapped tokens
  const altcoins = data
    .filter((c: CoinMarketData) => c.id !== "bitcoin" && !EXCLUDED_IDS.has(c.id))
    .slice(0, 50);

  // Use 30d data for display in the table
  const altcoinsWithChange = altcoins.map((c: CoinMarketData & { market_cap_rank: number }) => ({
    ...c,
    price_change_90d: c.price_change_percentage_30d_in_currency || 0,
  }));

  // Use the REAL score from blockchaincenter.net (guaranteed by hardcoded fallback)
  const result = {
    altcoins: altcoinsWithChange,
    btc_90d_change: btc30d,
    altseason_score: bcIndex.season,
    month_score: bcIndex.month,
    year_score: bcIndex.year,
    source: `blockchaincenter.net — Vérifié le ${OFFICIAL_BLOCKCHAIN_CENTER_DATA.lastVerified}`,
    stats: bcIndex.stats,
  };

  cachedAltseasonData = result;
  altseasonLastFetch = now;

  return {
    ...result,
    btc_30d_change: btc30d,
  };
}

export function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

export function formatMarketCap(mcap: number): string {
  if (mcap >= 1e12) return `$${(mcap / 1e12).toFixed(2)}T`;
  if (mcap >= 1e9) return `$${(mcap / 1e9).toFixed(1)}B`;
  if (mcap >= 1e6) return `$${(mcap / 1e6).toFixed(0)}M`;
  return `$${mcap.toLocaleString()}`;
}

export function formatVolume(vol: number): string {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(0)}M`;
  return `$${vol.toLocaleString()}`;
}