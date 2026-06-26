// Open positions table. Pure presentation: parent owns prices/coins and
// supplies callbacks for SL/TP edit, close, and 'select symbol on row click'.
import type { Position, Me, Coin } from "./types";
import { fmtPrice, fmtUsd, fmtQty } from "./format";

interface Props {
  me: Me;
  prices: Record<string, number>;
  coins: Record<string, Coin>;
  onSelectSymbol: (sym: string) => void;
  onEditSL: (pos: Position) => void;
  onEditTP: (pos: Position) => void;
  onClose: (pos: Position) => void;
}

export default function PositionsTable({ me, prices, coins, onSelectSymbol, onEditSL, onEditTP, onClose }: Props) {
  const positions = me.positions;
  return (
    <div className="bg-[#0d0e16] border border-white/[0.06] rounded-2xl overflow-hidden mb-3" data-testid="challenge-portfolio">
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-300">Open Positions · {me.username}</h3>
        <span className="text-[10px] text-gray-500 font-mono">{Object.keys(positions).length} active</span>
      </div>
      {Object.keys(positions).length === 0 ? (
        <div className="text-center py-10 text-xs text-gray-500">Aucune position. Lance ton premier trade ci-dessus.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/[0.04]">
              <tr>
                <th className="text-left px-4 py-2 font-bold">Asset</th>
                <th className="text-left px-2 py-2 font-bold">Side</th>
                <th className="text-right px-2 py-2 font-bold">Qty</th>
                <th className="text-right px-2 py-2 font-bold">Entry</th>
                <th className="text-right px-2 py-2 font-bold">Mark</th>
                <th className="text-right px-2 py-2 font-bold">SL</th>
                <th className="text-right px-2 py-2 font-bold">TP</th>
                <th className="text-right px-2 py-2 font-bold">PnL</th>
                <th className="text-right px-4 py-2 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {Object.entries(positions).map(([key, pos]) => {
                const sym = pos.symbol;
                const livePx = pos.mark || me.prices?.[sym] || prices[sym] || 0;
                const px = livePx > 0 ? livePx : (pos.avg_price || 0);
                const hasMark = livePx > 0;
                const rawPnl = typeof pos.pnl === "number"
                  ? pos.pnl
                  : (pos.side === "short" ? (pos.avg_price - px) * pos.qty : (px - pos.avg_price) * pos.qty);
                const pnl = Number.isFinite(rawPnl) ? rawPnl : 0;
                const rawPnlPct = typeof pos.pnl_pct === "number"
                  ? pos.pnl_pct
                  : (pos.avg_price > 0 ? (pnl / (pos.qty * pos.avg_price)) * 100 : 0);
                const pnlPct = Number.isFinite(rawPnlPct) ? rawPnlPct : 0;
                return (
                  <tr key={key} className="border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer" onClick={() => onSelectSymbol(sym)}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {coins[sym]?.image ? <img src={coins[sym].image!} alt={sym} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-white/[0.06]" />}
                        <div>
                          <div className="font-extrabold text-white">{sym}</div>
                          <div className="text-[10px] text-gray-500 font-sans">{coins[sym]?.name || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${pos.side === "long" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                        {pos.side === "long" ? "↗ LONG" : "↘ SHORT"}
                        {pos.leverage && pos.leverage > 1 ? ` ${pos.leverage}x` : ""}
                      </span>
                    </td>
                    <td className="text-right px-2 py-2.5 text-white">{fmtQty(pos.qty)}</td>
                    <td className="text-right px-2 py-2.5 text-gray-400">${fmtPrice(pos.avg_price)}</td>
                    <td className="text-right px-2 py-2.5 text-cyan-300">
                      ${fmtPrice(px)}
                      {!hasMark && <span className="ml-1 text-[9px] text-amber-400" title="Prix indisponible">⚠</span>}
                      {pos.liquidation_price ? <div className="text-[9px] text-red-400 font-bold">Liq ${fmtPrice(pos.liquidation_price)}</div> : null}
                    </td>
                    <td className="text-right px-2 py-2.5">
                      <button
                        data-testid={`edit-sl-${key}`}
                        onClick={(e) => { e.stopPropagation(); onEditSL(pos); }}
                        className={`text-[10px] font-bold ${pos.sl ? "text-red-400" : "text-gray-600 hover:text-red-400"}`}
                      >
                        {pos.sl ? `$${fmtPrice(pos.sl)}` : "— set"}
                      </button>
                    </td>
                    <td className="text-right px-2 py-2.5">
                      <button
                        data-testid={`edit-tp-${key}`}
                        onClick={(e) => { e.stopPropagation(); onEditTP(pos); }}
                        className={`text-[10px] font-bold ${pos.tp ? "text-emerald-400" : "text-gray-600 hover:text-emerald-400"}`}
                      >
                        {pos.tp ? `$${fmtPrice(pos.tp)}` : "— set"}
                      </button>
                    </td>
                    <td className={`text-right px-2 py-2.5 font-extrabold ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {pnl >= 0 ? "+" : ""}${fmtUsd(pnl)}
                      <div className="text-[10px] font-bold">{pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%</div>
                    </td>
                    <td className="text-right px-4 py-2.5">
                      <button
                        data-testid={`close-position-${key}`}
                        onClick={(e) => { e.stopPropagation(); onClose(pos); }}
                        className="px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/20 transition"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
