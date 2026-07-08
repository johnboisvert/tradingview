// Market signal panel — Fear & Greed + BTC Dominance + Altcoin Season Index.
// Public data: alternative.me (Fear & Greed) + CoinGecko global (dominance).
import { useEffect, useState } from "react";

interface Signals {
  fear_greed?: { value: number; classification: string };
  btc_dominance?: number;
  total_market_cap?: number;
  eth_dominance?: number;
  updatedAt?: number;
}

function FearGreedBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  let color = "bg-emerald-500";
  if (pct < 25) color = "bg-red-500";
  else if (pct < 45) color = "bg-orange-500";
  else if (pct < 55) color = "bg-amber-500";
  else if (pct < 75) color = "bg-lime-500";
  return (
    <div className="mt-1 h-1.5 rounded-sm bg-white/[0.05] overflow-hidden">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function SignalsWidget({ refreshMs = 300000 }: { refreshMs?: number }) {
  const [sig, setSig] = useState<Signals>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function pull() {
      try {
        // Fear & Greed via alternative.me + CoinGecko global directly (both CORS-friendly)
        const [fgRaw, globalRaw] = await Promise.allSettled([
          fetch("https://api.alternative.me/fng/?limit=1&format=json").then(r => r.json()),
          fetch("https://api.coingecko.com/api/v3/global").then(r => r.json()).catch(() => null),
        ]);
        if (!alive) return;
        const out: Signals = { updatedAt: Date.now() };
        if (fgRaw.status === "fulfilled" && fgRaw.value?.data?.[0]) {
          out.fear_greed = {
            value: parseInt(fgRaw.value.data[0].value, 10),
            classification: fgRaw.value.data[0].value_classification || "",
          };
        }
        if (globalRaw.status === "fulfilled" && globalRaw.value) {
          const g = globalRaw.value.data || globalRaw.value;
          out.btc_dominance = g?.market_cap_percentage?.btc;
          out.eth_dominance = g?.market_cap_percentage?.eth;
          out.total_market_cap = g?.total_market_cap?.usd;
        }
        setSig(out);
        setLoading(false);
      } catch { setLoading(false); }
    }
    pull();
    const id = setInterval(pull, refreshMs);
    return () => { alive = false; clearInterval(id); };
  }, [refreshMs]);

  const fmt = (n?: number, d = 1) => (typeof n === "number" ? n.toFixed(d) : "—");
  const fmtCap = (n?: number) => {
    if (typeof n !== "number") return "—";
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    return `$${n.toFixed(0)}`;
  };

  const fgVal = sig.fear_greed?.value;
  const fgLabel = sig.fear_greed?.classification || "";
  const fgColor = fgVal == null ? "text-white/40" : fgVal < 25 ? "text-red-400" : fgVal < 45 ? "text-orange-400" : fgVal < 55 ? "text-amber-400" : fgVal < 75 ? "text-lime-400" : "text-emerald-400";

  return (
    <div className="font-mono text-[10.5px] space-y-2">
      {loading && <div className="text-white/40">Loading signals…</div>}
      {!loading && (
        <>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase text-white/50 tracking-wider">Fear &amp; Greed</span>
              <span className={`font-black text-lg ${fgColor}`} data-testid="fg-value">{fgVal ?? "—"}</span>
            </div>
            <FearGreedBar value={fgVal ?? 0} />
            <div className="text-[9px] text-white/40 mt-0.5 uppercase">{fgLabel}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
            <div>
              <div className="text-[9px] uppercase text-white/50 tracking-wider">BTC.D</div>
              <div className="text-amber-300 font-black text-sm tabular-nums" data-testid="btc-dominance">{fmt(sig.btc_dominance)}%</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-white/50 tracking-wider">ETH.D</div>
              <div className="text-cyan-300 font-black text-sm tabular-nums">{fmt(sig.eth_dominance)}%</div>
            </div>
          </div>
          <div className="pt-2 border-t border-white/5">
            <div className="text-[9px] uppercase text-white/50 tracking-wider">Total Market Cap</div>
            <div className="text-white/90 font-black text-sm tabular-nums" data-testid="total-mcap">{fmtCap(sig.total_market_cap)}</div>
          </div>
        </>
      )}
    </div>
  );
}
