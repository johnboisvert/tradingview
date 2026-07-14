// Funding rates widget — perp funding across majors + extremes.
// Positive funding = longs pay shorts (crowded long). Data via backend proxy
// /api/binance/funding (Binance futures with Bybit fallback, 60s cache).
import { useEffect, useState } from "react";

type Row = {
  symbol: string;
  funding_rate: number;
  mark_price: number;
  next_funding_time: number | null;
};

const MAJORS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT"];

const fmtPct = (r: number) => `${r >= 0 ? "+" : ""}${(r * 100).toFixed(4)}%`;
const fmtApr = (r: number) => `${r >= 0 ? "+" : ""}${(r * 3 * 365 * 100).toFixed(1)}%`;
const fmtPrice = (p: number) => (p >= 1000 ? p.toLocaleString("en-US", { maximumFractionDigits: 0 }) : p >= 1 ? p.toFixed(2) : p.toPrecision(4));

function countdown(ts: number | null, now: number): string {
  if (!ts || ts <= now) return "—";
  const s = Math.floor((ts - now) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}

export default function FundingWidget({ refreshMs = 60000 }: { refreshMs?: number }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const r = await fetch("/api/binance/funding");
        const j = await r.json();
        if (!alive || !j?.ok || !Array.isArray(j.rows)) { setLoading(false); return; }
        setSource(j.source || "");
        const bySymbol: Record<string, Row> = {};
        for (const x of j.rows as Row[]) bySymbol[x.symbol] = x;
        const majors = MAJORS.map((s) => bySymbol[s]).filter(Boolean) as Row[];
        const extremes = (j.rows as Row[])
          .filter((x) => !MAJORS.includes(x.symbol) && Math.abs(x.funding_rate) >= 0.0003)
          .sort((a, b) => Math.abs(b.funding_rate) - Math.abs(a.funding_rate))
          .slice(0, 8);
        setRows([...majors, ...extremes]);
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
      <div className="flex items-center justify-between mb-1 text-[9px] uppercase tracking-wider text-white/40">
        <span>8h rate · + = longs paient</span>
        <span className="text-white/30">{source ? `src: ${source}` : ""}</span>
      </div>
      {loading && <div className="text-white/40">Loading funding…</div>}
      {!loading && rows.length === 0 && <div className="text-white/30 py-3 text-center">— no data —</div>}
      <ul className="space-y-0.5">
        {rows.map((r, i) => {
          const pos = r.funding_rate >= 0;
          const extreme = Math.abs(r.funding_rate) >= 0.0005;
          const isMajor = MAJORS.includes(r.symbol);
          return (
            <li
              key={r.symbol}
              data-testid={`funding-${r.symbol}`}
              className={`flex items-center gap-1.5 border-l-2 pl-2 py-0.5 ${!isMajor && i === MAJORS.length ? "mt-1 border-t border-t-white/5 pt-1" : ""}`}
              style={{ borderLeftColor: pos ? "rgba(52, 211, 153, 0.5)" : "rgba(239, 68, 68, 0.5)" }}
            >
              <span className="font-bold text-white/90 min-w-[64px]">{r.symbol.replace("USDT", "")}</span>
              <span className={`tabular-nums font-bold min-w-[62px] ${pos ? "text-emerald-400" : "text-red-400"}`}>
                {fmtPct(r.funding_rate)}
              </span>
              {extreme && <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-1 uppercase">⚡</span>}
              <span className="text-white/40 ml-auto tabular-nums">APR {fmtApr(r.funding_rate)}</span>
              <span className="text-cyan-300/70 tabular-nums min-w-[42px] text-right">{countdown(r.next_funding_time, now)}</span>
              <span className="text-white/30 tabular-nums min-w-[58px] text-right hidden xl:inline">${fmtPrice(r.mark_price)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
