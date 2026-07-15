// Options chain widget — Deribit nearest expiry, strikes centered ATM.
// Data via backend proxy /api/deribit/options (120s cache).
import { useEffect, useState } from "react";

type OptSide = { usd: number; iv: number; oi: number } | null;
type Row = { strike: number; call: OptSide; put: OptSide };
type Payload = {
  ok: boolean; currency: string; underlying: number;
  expiry: string; expiry_ts: number; rows: Row[]; pc_oi_ratio: number | null;
};

const fmtUsd = (n: number) => n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : n.toFixed(n >= 10 ? 1 : 2);
const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(1);

export default function OptionsWidget({ refreshMs = 120000 }: { refreshMs?: number }) {
  const [currency, setCurrency] = useState<"BTC" | "ETH">("BTC");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    async function tick() {
      try {
        const r = await fetch(`/api/deribit/options?currency=${currency}`);
        const j = await r.json();
        if (alive && j?.ok) setData(j);
      } catch { /* keep stale */ }
      if (alive) setLoading(false);
    }
    tick();
    const id = setInterval(tick, refreshMs);
    return () => { alive = false; clearInterval(id); };
  }, [currency, refreshMs]);

  const dte = data ? Math.max(0, Math.round((data.expiry_ts - Date.now()) / 86400000)) : 0;

  return (
    <div className="font-mono text-[10.5px] h-full">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          {(["BTC", "ETH"] as const).map((c) => (
            <button
              key={c}
              data-testid={`options-currency-${c}`}
              onClick={() => setCurrency(c)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-black border transition ${currency === c ? "border-amber-500/50 text-amber-300 bg-amber-500/10" : "border-white/15 text-white/40 hover:text-white/70"}`}
            >
              {c}
            </button>
          ))}
        </div>
        {data && (
          <div className="text-[9px] text-white/40 uppercase tracking-wider">
            <span className="text-cyan-300 font-bold">{data.expiry}</span> · {dte}j ·
            spot <span className="text-white/70 font-bold">${fmtUsd(data.underlying)}</span>
            {data.pc_oi_ratio != null && <> · P/C <span className={`font-bold ${data.pc_oi_ratio > 1 ? "text-red-400" : "text-emerald-400"}`}>{data.pc_oi_ratio}</span></>}
          </div>
        )}
      </div>
      {loading && !data && <div className="text-white/40">Loading options…</div>}
      {!loading && !data && <div className="text-white/30 py-3 text-center">— deribit unavailable —</div>}
      {data && (
        <table className="w-full text-right">
          <thead>
            <tr className="text-[8px] text-white/30 uppercase tracking-wider">
              <th className="text-left font-bold pb-0.5">Call $ · IV · OI</th>
              <th className="font-bold pb-0.5 text-center">Strike</th>
              <th className="font-bold pb-0.5">Put $ · IV · OI</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => {
              const isAtm = Math.abs(r.strike - data.underlying) === Math.min(...data.rows.map(x => Math.abs(x.strike - data.underlying)));
              const itm = r.strike < data.underlying;
              return (
                <tr key={r.strike} data-testid={`options-strike-${r.strike}`} className={`${isAtm ? "bg-amber-500/10" : ""}`}>
                  <td className={`text-left py-0.5 tabular-nums ${itm ? "text-emerald-300" : "text-emerald-400/50"}`}>
                    {r.call ? <>${fmtUsd(r.call.usd)} <span className="text-white/35">{r.call.iv.toFixed(0)}% · {fmtK(r.call.oi)}</span></> : "—"}
                  </td>
                  <td className={`py-0.5 text-center font-black tabular-nums ${isAtm ? "text-amber-300" : "text-white/70"}`}>
                    {r.strike >= 1000 ? (r.strike / 1000) + "K" : r.strike}
                  </td>
                  <td className={`py-0.5 tabular-nums ${!itm ? "text-red-300" : "text-red-400/50"}`}>
                    {r.put ? <><span className="text-white/35">{fmtK(r.put.oi)} · {r.put.iv.toFixed(0)}%</span> ${fmtUsd(r.put.usd)}</> : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
