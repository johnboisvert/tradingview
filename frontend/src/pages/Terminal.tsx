// CryptoIA Terminal Pro — Bloomberg-style trading cockpit.
// Elite plan gated. Ctrl/Cmd+K to open command palette.
// Layout: CSS Grid (12 cols × 12 rows). Persisted per user via localStorage.
import { useEffect, useMemo, useState } from "react";
import TradingViewChart from "@/components/TradingViewChart";
import WidgetCard from "@/components/terminal/WidgetCard";
import LiveTickerWidget from "@/components/terminal/widgets/LiveTickerWidget";
import NewsFlashWidget from "@/components/terminal/widgets/NewsFlashWidget";
import WhalesWidget from "@/components/terminal/widgets/WhalesWidget";
import CommunityFeedWidget from "@/components/terminal/widgets/CommunityFeedWidget";
import SignalsWidget from "@/components/terminal/widgets/SignalsWidget";
import CommandBar from "@/components/terminal/CommandBar";
import HelpModal from "@/components/terminal/HelpModal";
import { Crown, Terminal as TerminalIcon, Command as CmdIcon } from "lucide-react";

type LayoutKey = "layout1" | "layout2";

const LAYOUT_LABELS: Record<LayoutKey, string> = {
  layout1: "CHART-DOMINANT",
  layout2: "WATCHLIST",
};

export default function Terminal() {
  const [symbol, setSymbol] = useState<string>(() => localStorage.getItem("cia_terminal_symbol") || "BTC");
  const [symbols, setSymbols] = useState<string[]>([]);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [layout, setLayout] = useState<LayoutKey>(() => (localStorage.getItem("cia_terminal_layout") as LayoutKey) || "layout1");
  const [now, setNow] = useState(new Date());

  // Load available symbols for command palette autocomplete
  useEffect(() => {
    fetch("/api/v1/challenge/symbols")
      .then(r => r.json())
      .then(j => setSymbols((j.coins || []).map((c: any) => c.symbol)))
      .catch(() => {});
  }, []);

  // Persist
  useEffect(() => { localStorage.setItem("cia_terminal_symbol", symbol); }, [symbol]);
  useEffect(() => { localStorage.setItem("cia_terminal_layout", layout); }, [layout]);

  // Clock (1s tick)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Keyboard: Cmd/Ctrl+K to open command palette; '?' opens help
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA"].includes(t.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setCmdOpen(true);
      } else if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const onAction = (name: string) => {
    if (name === "reset") setSymbol("BTC");
    else if (name === "layout1") setLayout("layout1");
    else if (name === "layout2") setLayout("layout2");
    else if (name === "help") setHelpOpen(true);
    else if (["news", "whales", "feed", "signals"].includes(name)) {
      const el = document.querySelector(`[data-widget="${name}"]`) as HTMLElement | null;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Inline-style glow (Tailwind JIT purges dynamic classes)
      const prevBoxShadow = el.style.boxShadow;
      const prevOutline = el.style.outline;
      el.style.boxShadow = "0 0 0 2px rgb(245 158 11), 0 0 30px 4px rgba(245, 158, 11, 0.4)";
      el.style.outline = "none";
      el.style.transition = "box-shadow 220ms ease-out";
      setTimeout(() => {
        el.style.boxShadow = prevBoxShadow;
        el.style.outline = prevOutline;
      }, 1800);
    }
  };

  const gridClass = useMemo(() => {
    // layout1: chart takes 8 cols × 8 rows; sidebar widgets stack right
    // layout2: chart smaller, ticker + whales larger
    return layout === "layout1"
      ? "grid grid-cols-12 grid-rows-[repeat(12,minmax(60px,1fr))] gap-1.5"
      : "grid grid-cols-12 grid-rows-[repeat(12,minmax(60px,1fr))] gap-1.5";
  }, [layout]);

  const timeStr = now.toISOString().slice(11, 19); // HH:MM:SS UTC

  return (
    <div className="min-h-screen bg-black text-white font-mono overflow-hidden flex flex-col">
      {/* Top status bar */}
      <header className="flex items-center justify-between px-3 py-1.5 border-b border-amber-500/20 bg-black flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <TerminalIcon className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-black text-xs tracking-[0.2em]">CRYPTOIA TERMINAL</span>
            <span className="text-[9px] text-white/40 px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 uppercase">PRO</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] text-white/50">
            <span>ACTIVE: <span className="text-amber-300 font-black">{symbol}</span></span>
            <span>·</span>
            <span>LAYOUT: <span className="text-amber-300 font-black">{LAYOUT_LABELS[layout]}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            data-testid="terminal-open-cmd"
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 border border-amber-500/40 rounded text-[10px] text-amber-300 hover:bg-amber-500/10 transition font-bold"
          >
            <CmdIcon className="w-3 h-3" />
            <kbd className="hidden sm:inline">⌘K</kbd>
            <span className="uppercase tracking-wider">Command</span>
          </button>
          <button
            data-testid="terminal-open-help"
            onClick={() => setHelpOpen(true)}
            aria-label="Open help"
            title="Help (?)"
            className="w-6 h-6 flex items-center justify-center border border-white/15 rounded text-[11px] font-black text-white/70 hover:text-amber-300 hover:border-amber-500/40 transition"
          >
            ?
          </button>
          <div className="text-[10px] text-white/60 tabular-nums" data-testid="terminal-clock">{timeStr} UTC</div>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 p-1.5 min-h-0">
        <div className={`h-full ${gridClass}`}>
          {/* CHART (dominant) */}
          <div className={`${layout === "layout1" ? "col-span-8 row-span-8" : "col-span-7 row-span-7"} min-h-0`}>
            <WidgetCard
              tag="TVL"
              title={`${symbol}/USDT · TradingView Live`}
              accent="amber"
              fullBleed
              right={
                <span className="text-[9px] text-white/40 uppercase">1H / D1</span>
              }
            >
              <div className="h-full w-full">
                <TradingViewChart symbol={symbol} />
              </div>
            </WidgetCard>
          </div>

          {/* TICKER — right of chart */}
          <div className={`${layout === "layout1" ? "col-span-4 row-span-5" : "col-span-5 row-span-6"} min-h-0`}>
            <WidgetCard tag="TCK" title="Live Ticker · 41 Cryptos" accent="cyan" data-widget="ticker">
              <LiveTickerWidget onSelectSymbol={setSymbol} activeSymbol={symbol} />
            </WidgetCard>
          </div>

          {/* SIGNALS — right lower */}
          <div className={`${layout === "layout1" ? "col-span-4 row-span-3" : "col-span-5 row-span-3"} min-h-0`}>
            <div data-widget="signals" className="h-full transition-shadow rounded">
              <WidgetCard tag="SIG" title="Market Signals" accent="amber">
                <SignalsWidget />
              </WidgetCard>
            </div>
          </div>

          {/* WHALES — bottom row */}
          <div className={`${layout === "layout1" ? "col-span-4 row-span-4" : "col-span-4 row-span-5"} min-h-0`}>
            <div data-widget="whales" className="h-full transition-shadow rounded">
              <WidgetCard tag="WHL" title="Whale Activity" accent="green">
                <WhalesWidget />
              </WidgetCard>
            </div>
          </div>

          {/* NEWS — bottom middle */}
          <div className={`${layout === "layout1" ? "col-span-4 row-span-4" : "col-span-4 row-span-5"} min-h-0`}>
            <div data-widget="news" className="h-full transition-shadow rounded">
              <WidgetCard tag="NWS" title="News Flash" accent="amber">
                <NewsFlashWidget />
              </WidgetCard>
            </div>
          </div>

          {/* COMMUNITY FEED — bottom right */}
          <div className={`${layout === "layout1" ? "col-span-4 row-span-4" : "col-span-4 row-span-5"} min-h-0`}>
            <div data-widget="feed" className="h-full transition-shadow rounded">
              <WidgetCard tag="FED" title="Community Trades" accent="cyan">
                <CommunityFeedWidget />
              </WidgetCard>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom status bar */}
      <footer className="flex items-center justify-between px-3 py-1 border-t border-white/5 bg-black text-[9px] text-white/40 uppercase tracking-wider flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
          <span>·</span>
          <span>Data: CoinGecko + Binance + alternative.me</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Press <kbd className="text-amber-300">⌘K</kbd> for commands</span>
          <span className="text-emerald-400 flex items-center gap-1"><Crown className="w-2.5 h-2.5" /> ELITE</span>
        </div>
      </footer>

      <CommandBar
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        symbols={symbols}
        onSymbolSelect={setSymbol}
        onAction={onAction}
      />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
