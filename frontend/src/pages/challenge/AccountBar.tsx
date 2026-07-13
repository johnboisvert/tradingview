// "Mon Compte" — prominent monetary balance panel shown at the top of the
// Challenge page so the user always sees Cash / Equity / Margin / PnL at a glance.
import { Wallet, TrendingUp, TrendingDown, Layers, Trophy } from "lucide-react";
import type { Me } from "./types";
import { fmtUsd } from "./format";

export default function AccountBar({ me, rank, total }: { me: Me; rank: number; total: number }) {
  const positions = Object.values(me.positions || {});
  const collateral = positions.reduce((s, p) => s + (p.collateral ?? (p.qty * p.avg_price) / (p.leverage || 1)), 0);
  const unrealized = positions.reduce((s, p) => s + (p.pnl || 0), 0);
  const roi = me.roi_pct ?? 0;
  const cashLow = me.balance < 1 && positions.length > 0;

  return (
    <div data-testid="account-bar" className="bg-gradient-to-r from-[#0d0e16] via-[#10121c] to-[#0d0e16] border border-amber-500/20 rounded-2xl px-4 py-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <Wallet className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">Mon Compte · {me.username}</span>
        {cashLow && (
          <span data-testid="account-cash-warning" className="ml-auto text-[9px] font-bold text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded px-2 py-0.5 uppercase tracking-wider">
            Cash épuisé — tout en marge · ferme une position pour libérer des fonds
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-2">
        <div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Cash disponible</div>
          <div data-testid="account-cash" className={`text-lg md:text-xl font-black font-mono ${cashLow ? "text-orange-300" : "text-emerald-300"}`}>${fmtUsd(me.balance)}</div>
        </div>
        <div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Equity totale</div>
          <div data-testid="account-equity" className="text-lg md:text-xl font-black font-mono text-white">${fmtUsd(me.equity)}</div>
        </div>
        <div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Marge utilisée</div>
          <div data-testid="account-margin" className="text-lg md:text-xl font-black font-mono text-cyan-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 opacity-60" />${fmtUsd(collateral)}
          </div>
        </div>
        <div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">PnL latent · ROI</div>
          <div data-testid="account-pnl" className={`text-lg md:text-xl font-black font-mono flex items-center gap-1.5 ${unrealized >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {unrealized >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {unrealized >= 0 ? "+" : "-"}${fmtUsd(Math.abs(unrealized))}
            <span className={`text-[10px] font-bold ${roi >= 0 ? "text-emerald-400/70" : "text-red-400/70"}`}>{roi >= 0 ? "+" : ""}{roi.toFixed(2)}%</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Positions · Rang</div>
          <div data-testid="account-positions" className="text-lg md:text-xl font-black font-mono text-amber-300 flex items-center gap-1.5">
            {positions.length}
            <span className="text-gray-600">·</span>
            <Trophy className="w-3.5 h-3.5 opacity-60" />
            {rank > 0 ? `#${rank}` : "—"}
            <span className="text-[10px] text-gray-500 font-bold">/ {total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
