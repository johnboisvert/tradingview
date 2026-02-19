// Shared utility for fetching top 200 crypto data from CoinGecko
// Uses CORS proxy for cross-origin requests from custom domains

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
const CACHE_DURATION = 90_000; // 90 seconds

async function fetchWithCorsProxy(url: string): Promise<Response> {
  // Try direct first
  try {
    const res = await fetch(url);
    if (res.ok) return res;
  } catch {
    // Direct failed, try proxy
  }
  // Use allorigins proxy
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  return fetch(proxyUrl);
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
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page}&sparkline=${sparkline}&price_change_percentage=24h,7d,30d`;
      const res = await fetchWithCorsProxy(url);
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

// Fetch the REAL Altcoin Season Index from blockchaincenter.net
async function fetchBlockchainCenterIndex(): Promise<{ season: number; month: number; year: number } | null> {
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent("https://www.blockchaincenter.net/en/altcoin-season-index/")}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    const html = await res.text();

    // Parse the tab text to extract values: "Altcoin Season (53)", "Month (67)", "Year (37)"
    const seasonMatch = html.match(/Altcoin Season\s*\((\d+)\)/i);
    const monthMatch = html.match(/Month\s*\((\d+)\)/i);
    const yearMatch = html.match(/Year\s*\((\d+)\)/i);

    if (seasonMatch) {
      return {
        season: parseInt(seasonMatch[1], 10),
        month: monthMatch ? parseInt(monthMatch[1], 10) : 0,
        year: yearMatch ? parseInt(yearMatch[1], 10) : 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Fetch 90-day price change for a coin using CoinGecko market_chart endpoint
async function fetch90dChange(coinId: string): Promise<number | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=90&interval=daily`;
    const res = await fetchWithCorsProxy(url);
    if (!res.ok) return null;
    const data = await res.json();
    const prices = data?.prices;
    if (!Array.isArray(prices) || prices.length < 2) return null;
    const oldPrice = prices[0][1];
    const newPrice = prices[prices.length - 1][1];
    if (oldPrice === 0) return null;
    return ((newPrice - oldPrice) / oldPrice) * 100;
  } catch {
    return null;
  }
}

// Cache for altcoin season data
let cachedAltseasonData: {
  altcoins: Array<CoinMarketData & { market_cap_rank: number; price_change_90d: number }>;
  btc_90d_change: number;
  altseason_score: number;
  month_score: number;
  year_score: number;
  source: string;
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
}> {
  const now = Date.now();
  if (cachedAltseasonData && now - altseasonLastFetch < ALTSEASON_CACHE) {
    return {
      ...cachedAltseasonData,
      btc_30d_change: cachedAltseasonData.btc_90d_change, // backward compat
    };
  }

  // Step 1: Fetch the REAL index from blockchaincenter.net
  const bcIndex = await fetchBlockchainCenterIndex();

  // Step 2: Fetch top coins from CoinGecko for the table display
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d,30d`;
  const res = await fetchWithCorsProxy(url);

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

  // Step 3: Try to get 90-day data for BTC to show in stats
  let btc90d = btc30d; // fallback to 30d
  const btc90dResult = await fetch90dChange("bitcoin");
  if (btc90dResult !== null) {
    btc90d = btc90dResult;
  }

  // Step 4: Get 90-day changes for top altcoins (batch - only first few to avoid rate limits)
  // We'll compute approximate 90d from available data, and use the real index from blockchaincenter
  const altcoinsWithChange = altcoins.map((c: CoinMarketData & { market_cap_rank: number }) => ({
    ...c,
    price_change_90d: c.price_change_percentage_30d_in_currency || 0, // display 30d in table as approximation
  }));

  // Step 5: Use the REAL score from blockchaincenter.net, or calculate from our data as fallback
  let altseason_score: number;
  let month_score: number;
  let year_score: number;
  let source: string;

  if (bcIndex) {
    altseason_score = bcIndex.season;
    month_score = bcIndex.month;
    year_score = bcIndex.year;
    source = "blockchaincenter.net (données officielles)";
  } else {
    // Fallback: calculate from 30d data (less accurate)
    const outperformers = altcoins.filter(
      (c: CoinMarketData) => (c.price_change_percentage_30d_in_currency || 0) > btc30d
    ).length;
    altseason_score = Math.round((outperformers / Math.max(altcoins.length, 1)) * 100);
    month_score = altseason_score;
    year_score = 0;
    source = "CoinGecko (estimation 30j)";
  }

  const result = {
    altcoins: altcoinsWithChange,
    btc_90d_change: btc90d,
    altseason_score,
    month_score,
    year_score,
    source,
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