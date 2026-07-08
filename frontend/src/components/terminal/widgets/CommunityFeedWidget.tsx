// Community live feed — real trades from CryptoIA Challenge participants.
// Reuses /api/v1/challenge/recent-trades (already filters QA test accounts).
import { useEffect, useState } from "react";

type Trade = {
  username: string;
  symbol: string;
  side: "long" | "short";
  qty: number;
  price: number;
  action: "open" | "close";
  pnl_pct?: number;
  ts: number;
};

const timeAgo = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

export default function CommunityFeedWidget({ refreshMs = 10000 }: { refreshMs?: number }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const r = await fetch("/api/v1/challenge/recent-trades");
        const j = await r.json();
        if (!alive) return;
        const list = (j.trades || []).slice(0, 25);
        setTrades(list);
        setLoading(false);
      } catch { setLoading(false); }
    }
    tick();
    const id = setInterval(tick, refreshMs);
    return () => { alive = false; clearInterval(id); };
  }, [refreshMs]);

  return (
    <div className="font-mono text-[10.5px] h-full">
      {loading && <div className="text-white/40">Streaming trades…</div>}
      {!loading && trades.length === 0 && <div className="text-white/30 py-3 text-center">— no live trades —</div>}
      <ul className="space-y-0.5">
        {trades.map((t, i) => {
          const isOpen = t.action === "open";
          const isLong = t.side === "long";
          const pnl = typeof t.pnl_pct === "number" ? t.pnl_pct : null;
          return (
            <li key={i} data-testid={`feed-trade-${i}`} className="flex items-center gap-1.5 border-l-2 pl-2 py-0.5"
                style={{ borderColor: isOpen ? (isLong ? "rgba(52, 211, 153, 0.4)" : "rgba(239, 68, 68, 0.4)") : "rgba(148, 163, 184, 0.4)" }}>
              <span className="text-white/50 text-[9px] w-[24px]">{timeAgo(t.ts)}</span>
              <span className="text-amber-300 font-bold w-[68px] truncate">{t.username}</span>
              <span className={`w-[36px] font-bold text-[9px] uppercase ${isOpen ? (isLong ? "text-emerald-400" : "text-red-400") : "text-white/50"}`}>
                {isOpen ? (isLong ? "LONG" : "SHORT") : "CLOSE"}
              </span>
              <span className="font-bold text-white/90 w-[42px]">{t.symbol}</span>
              {pnl !== null && (
                <span className={`ml-auto tabular-nums font-bold ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
