// Shared utility for fetching top 200 crypto data from CoinGecko

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
  ath: number;
  ath_change_percentage: number;
  sparkline_in_7d?: { price: number[] };
}

let cachedCoins: CoinMarketData[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 90_000; // 90 seconds

export async function fetchTop200(withSparkline = false): Promise<CoinMarketData[]> {
  const now = Date.now();
  if (cachedCoins.length >= 200 && now - lastFetchTime < CACHE_DURATION && !withSparkline) {
    return cachedCoins;
  }

  const sparkline = withSparkline ? "true" : "false";
  const pages = [1, 2, 3, 4]; // 4 pages x 50 = 200
  const results: CoinMarketData[] = [];

  for (const page of pages) {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=${page}&sparkline=${sparkline}&price_change_percentage=24h,7d,30d`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          results.push(...data);
        }
      }
      // Small delay between requests to avoid rate limiting
      if (page < 4) await new Promise((r) => setTimeout(r, 300));
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