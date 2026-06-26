// Auto-scrolling ticker that shows the last 30 trades across all participants.
// Pure presentation: parent fetches and pipes the array down.
import type { Trade } from "./types";
import { fmtUsd } from "./format";

interface Props {
  trades: Array<Trade & { username: string }>;
}

export default function LiveFeed({ trades }: Props) {
  if (trades.length === 0) return null;
  return (
    <div className="bg-[#0d0e16] border border-white/[0.06] rounded-xl mb-3 overflow-hidden" data-testid="live-feed">
      <div className="flex items-center">
        <div className="bg-red-500/15 border-r border-red-500/30 px-3 py-2 flex items-center gap-1.5 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-400">Live</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-6 animate-scroll-left" style={{ animation: "scroll-left 60s linear infinite" }}>
            {[...trades, ...trades].map((t, i) => {
              const isOpen = t.action === "open";
              const sideStr = String(t.side).toLowerCase();
              const sideColor = sideStr === "long" || sideStr === "buy" ? "text-emerald-400" : "text-red-400";
              return (
                <div key={i} className="flex items-center gap-2 text-[11px] font-mono whitespace-nowrap py-2 shrink-0">
                  <span className="text-gray-400 font-bold">{t.username}</span>
                  <span className={`font-extrabold ${sideColor}`}>{isOpen ? "OPENED" : "CLOSED"} {sideStr.toUpperCase()}</span>
                  <span className="text-white font-bold">{t.symbol}</span>
                  {t.leverage && t.leverage > 1 && <span className="text-amber-300 font-bold">{t.leverage}x</span>}
                  <span className="text-cyan-300">${fmtUsd(t.value)}</span>
                  {t.pnl !== undefined && <span className={t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>{t.pnl >= 0 ? "+" : ""}${fmtUsd(t.pnl)}</span>}
                  {t.trigger && <span className="text-amber-300 text-[9px] uppercase">[{t.trigger === "stop_loss" ? "SL" : t.trigger === "take_profit" ? "TP" : "LIQ"}]</span>}
                  <span className="text-gray-600">•</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
