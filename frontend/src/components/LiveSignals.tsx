// Signaux actifs en direct (moteur swing v8.3 + Scanner IA) — affiché sur /trades
import { useEffect, useState } from "react";
import { Bot, TrendingUp, TrendingDown, Radio } from "lucide-react";

interface LiveCall {
  id: number;
  symbol: string;
  side: "LONG" | "SHORT";
  entry_price: number;
  stop_loss: number;
  tp1: number;
  confidence: number;
  engine?: string | null;
  tp1_hit: boolean;
  live_pnl_pct?: number | null;
  created_at: string;
}

const fmtP = (p: number) => (p >= 1000 ? p.toLocaleString("fr-CA", { maximumFractionDigits: 0 }) : p >= 1 ? p.toFixed(3) : p.toPrecision(4));

export const LiveSignals = () => {
  const [calls, setCalls] = useState<LiveCall[]>([]);

  useEffect(() => {
    const load = () =>
      fetch("/api/v1/trade-calls?status=active&limit=30")
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setCalls(d))
        .catch(() => {});
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, []);

  if (calls.length === 0) return null;

  return (
    <div data-testid="live-signals-section" className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
        <h3 className="text-sm font-bold text-white">Signaux en direct ({calls.length})</h3>
        <span className="text-[11px] text-gray-500">moteur v8.3 + Scanner IA — suivi auto toutes les 5 min</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {calls.map((c) => {
          const isIA = c.engine === "scanner-ia";
          const pnl = typeof c.live_pnl_pct === "number" ? c.live_pnl_pct : null;
          return (
            <div key={c.id} data-testid={`live-signal-${c.id}`} className={`rounded-2xl border p-4 bg-[#0d1526] ${isIA ? "border-violet-400/20" : "border-cyan-400/15"}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">
                  {c.symbol.replace("USDT", "/USDT")}
                  {isIA ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 text-[10px] font-black text-violet-300"><Bot className="h-3 w-3" />Scanner IA</span>
                  ) : (
                    <span className="ml-2 inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-black text-cyan-300">v8.3</span>
                  )}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-bold ${c.side === "LONG" ? "text-emerald-300" : "text-rose-300"}`}>
                  {c.side === "LONG" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {c.side}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1 text-xs font-mono text-white/50">
                <span>E ${fmtP(c.entry_price)}</span>
                <span className="text-center">SL ${fmtP(c.stop_loss)}</span>
                <span className="text-right">TP1 ${fmtP(c.tp1)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-sm font-mono font-black ${pnl == null ? "text-white/30" : pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {pnl == null ? "PnL —" : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`}
                </span>
                {c.tp1_hit && (
                  <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-300">TP1 ✓ · stop au BE</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveSignals;
