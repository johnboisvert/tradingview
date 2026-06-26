// Collapsible trade history table. Pure presentation: parent supplies the last
// N trades, this component renders them with timestamps + colored PnL.
import type { Trade } from "./types";
import { fmtPrice, fmtUsd, fmtQty } from "./format";

interface Props {
  trades: Trade[];
}

export default function TradeHistory({ trades }: Props) {
  if (trades.length === 0) return null;
  return (
    <details className="bg-[#0d0e16] border border-white/[0.06] rounded-2xl overflow-hidden mb-3">
      <summary className="px-4 py-3 cursor-pointer text-xs font-extrabold uppercase tracking-wider text-gray-300 hover:bg-white/[0.02]">
        Trade History ({trades.length})
      </summary>
      <div className="overflow-x-auto max-h-72 overflow-y-auto">
        <table className="w-full text-xs font-mono">
          <thead className="text-[10px] uppercase tracking-wider text-gray-500 sticky top-0 bg-[#0d0e16]">
            <tr>
              <th className="text-left px-4 py-2 font-bold">Time</th>
              <th className="text-left px-3 py-2 font-bold">Action</th>
              <th className="text-left px-3 py-2 font-bold">Symbol</th>
              <th className="text-right px-3 py-2 font-bold">Qty</th>
              <th className="text-right px-3 py-2 font-bold">Price</th>
              <th className="text-right px-3 py-2 font-bold">Value</th>
              <th className="text-right px-4 py-2 font-bold">PnL</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 100).map((t, i) => {
              const isClose = t.action === "close";
              const sideStr = String(t.side).toLowerCase();
              const color = isClose
                ? (t.pnl !== undefined && t.pnl >= 0 ? "text-emerald-400" : "text-red-400")
                : (sideStr === "long" || sideStr === "buy" ? "text-emerald-400" : "text-red-400");
              return (
                <tr key={i} className="border-b border-white/[0.02]">
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(t.ts).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td className={`px-3 py-2 font-extrabold ${color}`}>
                    {isClose ? `CLOSE ${sideStr.toUpperCase()}` : `OPEN ${sideStr.toUpperCase()}`}
                    {t.trigger && <span className="ml-1.5 text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded">{t.trigger === "stop_loss" ? "SL" : "TP"}</span>}
                  </td>
                  <td className="px-3 py-2 text-white font-extrabold">{t.symbol}</td>
                  <td className="px-3 py-2 text-right text-gray-300">{fmtQty(t.qty)}</td>
                  <td className="px-3 py-2 text-right text-cyan-300">${fmtPrice(t.price)}</td>
                  <td className="px-3 py-2 text-right font-extrabold text-white">${fmtUsd(t.value)}</td>
                  <td className={`px-4 py-2 text-right font-extrabold ${t.pnl !== undefined && t.pnl >= 0 ? "text-emerald-400" : t.pnl !== undefined ? "text-red-400" : "text-gray-600"}`}>
                    {t.pnl !== undefined ? `${t.pnl >= 0 ? "+" : ""}$${fmtUsd(t.pnl)}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
