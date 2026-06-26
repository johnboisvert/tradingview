// Public iframe-safe widget: live trade feed across the Challenge.
// Designed to be embedded by users on Twitter / Discord / blogs / Notion via:
//   <iframe src="https://www.cryptoia.ca/embed/live-feed?theme=dark" width="600" height="80" />
//
// No Sidebar / Footer / SEO chrome. Auto-refreshes every 8s. UTM tracking on
// the "Powered by" link.
import { useEffect, useState } from "react";
import type { Trade } from "../pages/challenge/types";
import { fmtUsd } from "../pages/challenge/format";

type FeedTrade = Trade & { username: string };

export default function EmbedLiveFeed() {
  const [trades, setTrades] = useState<FeedTrade[]>([]);
  const params = new URLSearchParams(window.location.search);
  const theme = params.get("theme") === "transparent" ? "transparent" : "dark";
  const refSrc = params.get("ref") || "embed-live-feed";

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/v1/challenge/recent-trades");
        const j = await r.json();
        if (alive && j?.ok) setTrades(j.trades || []);
      } catch { /* ignore */ }
    };
    load();
    const id = setInterval(load, 8000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const bg = theme === "transparent" ? "transparent" : "#0a0a0f";

  return (
    <div
      data-testid="embed-live-feed"
      style={{ background: bg, color: "#e5e7eb", fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif" }}
      className="min-h-screen w-full overflow-hidden"
    >
      <div className="border border-white/[0.06] rounded-2xl mx-2 my-2 overflow-hidden">
        <div className="flex items-center">
          <div className="bg-red-500/15 border-r border-red-500/30 px-3 py-2 flex items-center gap-1.5 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-400">Live</span>
          </div>
          <div className="flex-1 overflow-hidden">
            {trades.length === 0 ? (
              <div className="px-4 py-2 text-xs text-gray-500">Connexion au flux…</div>
            ) : (
              <div className="flex items-center gap-6" style={{ animation: "scroll-left 60s linear infinite" }}>
                {[...trades, ...trades].map((t, i) => {
                  const isOpen = t.action === "open";
                  const sideStr = String(t.side).toLowerCase();
                  const sideColor = sideStr === "long" || sideStr === "buy" ? "#10b981" : "#ef4444";
                  return (
                    <div key={i} className="flex items-center gap-2 text-[11px] whitespace-nowrap py-2 shrink-0" style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
                      <span className="text-gray-400 font-bold">{t.username}</span>
                      <span style={{ color: sideColor, fontWeight: 800 }}>{isOpen ? "OPENED" : "CLOSED"} {sideStr.toUpperCase()}</span>
                      <span className="text-white font-bold">{t.symbol}</span>
                      {t.leverage && t.leverage > 1 && <span className="text-amber-300 font-bold">{t.leverage}x</span>}
                      <span className="text-cyan-300">${fmtUsd(t.value)}</span>
                      {t.pnl !== undefined && <span style={{ color: t.pnl >= 0 ? "#10b981" : "#ef4444" }}>{t.pnl >= 0 ? "+" : ""}${fmtUsd(t.pnl)}</span>}
                      <span className="text-gray-600">•</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="absolute bottom-1 right-2 text-[9px] text-gray-500 font-bold">
        <a
          href={`https://www.cryptoia.ca/?utm_source=embed&utm_medium=widget&utm_campaign=live_feed&utm_content=${encodeURIComponent(refSrc)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-amber-400 transition-colors"
          data-testid="embed-poweredby"
        >
          Powered by CryptoIA →
        </a>
      </div>
      <style>{`
        @keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        body { background: ${bg} !important; margin: 0; }
      `}</style>
    </div>
  );
}
