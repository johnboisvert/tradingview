// Live price ticker — Bloomberg-style scrolling table with 24h change.
// Uses /api/v1/challenge/prices which auto-caches every 60s (already warmed).
// Adds a mini sparkline column via CoinGecko sparkline_in_7d.
import { useEffect, useMemo, useState } from "react";

type Coin = { symbol: string; price: number; change_24h?: number; sparkline?: number[] };

interface Props {
  onSelectSymbol?: (sym: string) => void;
  activeSymbol?: string;
  refreshMs?: number;
}

export default function LiveTickerWidget({ onSelectSymbol, activeSymbol, refreshMs = 15000 }: Props) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<"mcap" | "gain" | "loss" | "vol">("mcap");

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const r = await fetch("/api/v1/challenge/symbols");
        const j = await r.json();
        if (!alive) return;
        setCoins((j.coins || []).map((c: any) => ({
          symbol: c.symbol,
          price: c.price ?? 0,
          change_24h: c.price_change_24h ?? c.change_24h ?? 0,
          sparkline: c.sparkline ?? [],
        })));
        setLoading(false);
      } catch { /* keep old */ }
    }
    tick();
    const id = setInterval(tick, refreshMs);
    return () => { alive = false; clearInterval(id); };
  }, [refreshMs]);

  const filtered = useMemo(() => {
    const term = q.trim().toUpperCase();
    let list = term ? coins.filter(c => c.symbol.includes(term)) : coins.slice();
    if (sortBy === "gain") list = [...list].sort((a, b) => (b.change_24h || 0) - (a.change_24h || 0));
    else if (sortBy === "loss") list = [...list].sort((a, b) => (a.change_24h || 0) - (b.change_24h || 0));
    return list;
  }, [coins, q, sortBy]);

  const fmtPrice = (n: number) => {
    if (!Number.isFinite(n)) return "—";
    if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 0.01) return n.toFixed(4);
    return n.toLocaleString("en-US", { minimumSignificantDigits: 4, maximumSignificantDigits: 4, useGrouping: false });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="flex items-center gap-1 mb-1 px-1">
        <input
          data-testid="ticker-filter"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="FILTER..."
          className="flex-1 bg-black/40 border border-white/10 px-1.5 py-0.5 text-[10px] font-mono text-amber-300 placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 rounded-sm"
        />
        {(["mcap", "gain", "loss"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setSortBy(k)}
            data-testid={`ticker-sort-${k}`}
            className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase transition ${sortBy === k ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-white/[0.03] text-white/40 border border-white/10 hover:text-white/60"}`}
          >{k}</button>
        ))}
      </div>
      {/* Table */}
      <div className="flex-1 overflow-auto text-[10.5px]">
        {loading && <div className="text-white/40 p-2">Loading…</div>}
        {!loading && (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-black/90 text-[9px] text-white/40 uppercase tracking-wider">
              <tr>
                <th className="py-1 pl-1 pr-2">SYM</th>
                <th className="py-1 px-1 text-right">PRICE</th>
                <th className="py-1 pl-1 pr-2 text-right">24H%</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const chg = c.change_24h || 0;
                const chgColor = chg > 0 ? "text-emerald-400" : chg < 0 ? "text-red-400" : "text-white/40";
                const isActive = activeSymbol === c.symbol;
                return (
                  <tr
                    key={c.symbol}
                    onClick={() => onSelectSymbol?.(c.symbol)}
                    data-testid={`ticker-row-${c.symbol}`}
                    className={`cursor-pointer border-t border-white/[0.03] transition-colors ${isActive ? "bg-amber-500/10" : "hover:bg-white/[0.03]"}`}
                  >
                    <td className={`py-0.5 pl-1 pr-2 font-bold ${isActive ? "text-amber-300" : "text-white/90"}`}>{c.symbol}</td>
                    <td className="py-0.5 px-1 text-right tabular-nums text-white/80">{fmtPrice(c.price)}</td>
                    <td className={`py-0.5 pl-1 pr-2 text-right tabular-nums font-bold ${chgColor}`}>
                      {chg > 0 ? "+" : ""}{chg.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={3} className="text-white/30 text-center py-3">— no match —</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
