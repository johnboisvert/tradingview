// Whale activity widget — top 8 accumulation/distribution signals.
// Re-uses the CoinGecko data + whale scoring logic from WhaleWatcher page.
import { useEffect, useState } from "react";

type Row = {
  symbol: string;
  price: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
  vol_mcap: number;
  score: number;
  signal: "accumulation" | "distribution" | "neutral";
};

function analyze(coins: any[]): Row[] {
  return (coins || []).map((c) => {
    const mcap = c.market_cap || 0;
    const vol = c.total_volume || 0;
    const change24h = c.price_change_percentage_24h || 0;
    const ratio = mcap > 0 ? vol / mcap : 0;
    let signal: Row["signal"] = "neutral";
    if (change24h > 3 && ratio > 0.15) signal = "accumulation";
    else if (change24h < -3 && ratio > 0.15) signal = "distribution";
    else if (ratio > 0.25 && Math.abs(change24h) < 2) signal = "accumulation";
    else if (change24h < -5) signal = "distribution";
    else if (change24h > 5) signal = "accumulation";
    const score = Math.min(100, Math.round(ratio * 200 + Math.abs(change24h) * 3));
    return {
      symbol: (c.symbol || "").toUpperCase(),
      price: c.current_price || 0,
      change_24h: change24h,
      volume_24h: vol,
      market_cap: mcap,
      vol_mcap: ratio,
      score,
      signal,
    };
  });
}

const fmtUsd = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
};

export default function WhalesWidget({ refreshMs = 30000 }: { refreshMs?: number }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const { fetchTop200 } = await import("@/lib/cryptoApi");
        const data = await fetchTop200(false);
        if (!alive) return;
        const list = analyze(data)
          .filter(r => r.signal !== "neutral")
          .sort((a, b) => b.score - a.score)
          .slice(0, 12);
        setRows(list);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }
    tick();
    const id = setInterval(tick, refreshMs);
    return () => { alive = false; clearInterval(id); };
  }, [refreshMs]);

  return (
    <div className="font-mono text-[10.5px] h-full">
      {loading && <div className="text-white/40">Detecting whales…</div>}
      {!loading && rows.length === 0 && <div className="text-white/30 py-3 text-center">— no signal —</div>}
      <ul className="space-y-0.5">
        {rows.map((r) => {
          const isAcc = r.signal === "accumulation";
          return (
            <li key={r.symbol} data-testid={`whale-${r.symbol}`} className="flex items-center gap-1.5 border-l-2 pl-2 py-0.5"
                style={{ borderColor: isAcc ? "rgba(52, 211, 153, 0.5)" : "rgba(239, 68, 68, 0.5)" }}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isAcc ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
              <span className="font-bold text-white/90 min-w-[42px]">{r.symbol}</span>
              <span className={`text-[9px] font-bold uppercase min-w-[38px] ${isAcc ? "text-emerald-400" : "text-red-400"}`}>{isAcc ? "ACC" : "DIST"}</span>
              <span className={`tabular-nums font-bold ${r.change_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {r.change_24h >= 0 ? "+" : ""}{r.change_24h.toFixed(1)}%
              </span>
              <span className="text-white/40 ml-auto tabular-nums">V/MC {(r.vol_mcap * 100).toFixed(0)}%</span>
              <span className="text-amber-400 tabular-nums font-bold">${fmtUsd(r.volume_24h)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
