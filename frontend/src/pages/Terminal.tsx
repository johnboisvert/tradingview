// CryptoIA Terminal Pro — Bloomberg-style trading cockpit.
// Elite plan gated. Ctrl/Cmd+K to open command palette.
// Layout: react-grid-layout (12 cols) with drag & resize, persisted per user.
// Supports multi-chart (BTC vs ETH side-by-side) + OrderBook depth (Binance).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import TradingViewChart from "@/components/TradingViewChart";
import WidgetCard from "@/components/terminal/WidgetCard";
import LiveTickerWidget from "@/components/terminal/widgets/LiveTickerWidget";
import NewsFlashWidget from "@/components/terminal/widgets/NewsFlashWidget";
import WhalesWidget from "@/components/terminal/widgets/WhalesWidget";
import CommunityFeedWidget from "@/components/terminal/widgets/CommunityFeedWidget";
import SignalsWidget from "@/components/terminal/widgets/SignalsWidget";
import OrderBookWidget from "@/components/terminal/widgets/OrderBookWidget";
import CommandBar from "@/components/terminal/CommandBar";
import HelpModal from "@/components/terminal/HelpModal";
import {
  Crown, Terminal as TerminalIcon, Command as CmdIcon,
  X as XIcon, Plus, Grid as GridIcon, Lock, Unlock, RotateCcw,
  Cloud, CloudOff,
} from "lucide-react";

const ResponsiveGridLayout = WidthProvider(Responsive);

// ---------- Widget registry ----------
type WidgetId = "chart" | "chart2" | "ticker" | "signals" | "whales" | "news" | "feed" | "orderbook";

interface WidgetDef {
  id: WidgetId;
  tag: string;
  title: string;
  accent: "amber" | "cyan" | "green" | "red";
  removable: boolean;
  fullBleed?: boolean;
}
const WIDGETS: Record<WidgetId, WidgetDef> = {
  chart:     { id: "chart",     tag: "TVL", title: "TradingView · Chart 1", accent: "amber", removable: false, fullBleed: true },
  chart2:    { id: "chart2",    tag: "TV2", title: "TradingView · Chart 2", accent: "cyan",  removable: true,  fullBleed: true },
  ticker:    { id: "ticker",    tag: "TCK", title: "Live Ticker · 41 Cryptos", accent: "cyan",  removable: false },
  signals:   { id: "signals",   tag: "SIG", title: "Market Signals",         accent: "amber", removable: false },
  whales:    { id: "whales",    tag: "WHL", title: "Whale Activity",         accent: "green", removable: false },
  news:      { id: "news",      tag: "NWS", title: "News Flash",             accent: "amber", removable: false },
  feed:      { id: "feed",      tag: "FED", title: "Community Trades",       accent: "cyan",  removable: false },
  orderbook: { id: "orderbook", tag: "OBK", title: "Order Book Depth",       accent: "amber", removable: true },
};

// ---------- Preset layouts ----------
type LayoutKey = "layout1" | "layout2" | "scalping" | "swing" | "multichart";

const LAYOUT_LABELS: Record<LayoutKey, string> = {
  layout1: "CHART-DOMINANT",
  layout2: "WATCHLIST",
  scalping: "SCALPING",
  swing: "SWING",
  multichart: "MULTI-CHART",
};

// x,y are grid cells; w,h too. rowHeight is set below.
type LO = { i: WidgetId; x: number; y: number; w: number; h: number; minW?: number; minH?: number };

const LAYOUT_PRESETS: Record<LayoutKey, LO[]> = {
  // Default: dominant chart, sidebar widgets right
  layout1: [
    { i: "chart",    x: 0, y: 0, w: 8, h: 8, minW: 4, minH: 4 },
    { i: "ticker",   x: 8, y: 0, w: 4, h: 5, minW: 2, minH: 3 },
    { i: "signals",  x: 8, y: 5, w: 4, h: 3, minW: 2, minH: 2 },
    { i: "whales",   x: 0, y: 8, w: 4, h: 4, minW: 2, minH: 2 },
    { i: "news",     x: 4, y: 8, w: 4, h: 4, minW: 2, minH: 2 },
    { i: "feed",     x: 8, y: 8, w: 4, h: 4, minW: 2, minH: 2 },
  ],
  // Watchlist: chart smaller, ticker larger
  layout2: [
    { i: "chart",    x: 0, y: 0, w: 7, h: 7, minW: 4, minH: 4 },
    { i: "ticker",   x: 7, y: 0, w: 5, h: 6, minW: 3, minH: 3 },
    { i: "signals",  x: 7, y: 6, w: 5, h: 3, minW: 3, minH: 2 },
    { i: "whales",   x: 0, y: 7, w: 4, h: 5, minW: 2, minH: 2 },
    { i: "news",     x: 4, y: 7, w: 4, h: 5, minW: 2, minH: 2 },
    { i: "feed",     x: 8, y: 9, w: 4, h: 3, minW: 2, minH: 2 },
  ],
  // Scalping: chart + ticker 50/50, feed bar horizontal
  scalping: [
    { i: "chart",    x: 0, y: 0, w: 6, h: 7, minW: 4, minH: 4 },
    { i: "ticker",   x: 6, y: 0, w: 6, h: 7, minW: 3, minH: 3 },
    { i: "signals",  x: 0, y: 7, w: 4, h: 5, minW: 2, minH: 2 },
    { i: "whales",   x: 4, y: 7, w: 4, h: 5, minW: 2, minH: 2 },
    { i: "news",     x: 8, y: 7, w: 4, h: 5, minW: 2, minH: 2 },
    { i: "feed",     x: 0, y: 12, w: 12, h: 3, minW: 3, minH: 2 },
  ],
  // Swing: XXL chart
  swing: [
    { i: "chart",    x: 0, y: 0, w: 9, h: 9, minW: 4, minH: 4 },
    { i: "ticker",   x: 9, y: 0, w: 3, h: 5, minW: 2, minH: 3 },
    { i: "signals",  x: 9, y: 5, w: 3, h: 4, minW: 2, minH: 2 },
    { i: "whales",   x: 0, y: 9, w: 4, h: 3, minW: 2, minH: 2 },
    { i: "news",     x: 4, y: 9, w: 4, h: 3, minW: 2, minH: 2 },
    { i: "feed",     x: 8, y: 9, w: 4, h: 3, minW: 2, minH: 2 },
  ],
  // Multi-chart: 2 charts side by side + orderbook
  multichart: [
    { i: "chart",     x: 0, y: 0, w: 6, h: 7, minW: 3, minH: 4 },
    { i: "chart2",    x: 6, y: 0, w: 6, h: 7, minW: 3, minH: 4 },
    { i: "orderbook", x: 0, y: 7, w: 3, h: 5, minW: 2, minH: 3 },
    { i: "ticker",    x: 3, y: 7, w: 3, h: 5, minW: 2, minH: 3 },
    { i: "signals",   x: 6, y: 7, w: 3, h: 5, minW: 2, minH: 2 },
    { i: "whales",    x: 9, y: 7, w: 3, h: 5, minW: 2, minH: 2 },
    { i: "news",      x: 0, y: 12, w: 6, h: 3, minW: 2, minH: 2 },
    { i: "feed",      x: 6, y: 12, w: 6, h: 3, minW: 2, minH: 2 },
  ],
};

interface StoredLayout {
  layoutKey: LayoutKey;
  items: LO[];
  locked: boolean;
}

const LS_KEY = "cia_terminal_v2_layout";
const LS_SYMBOL = "cia_terminal_symbol";
const LS_SYMBOL2 = "cia_terminal_symbol2";
const LS_SOUND = "cia_terminal_sound";
const LS_USER_EMAIL = "cia_user_email";

function loadStored(): StoredLayout | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !Array.isArray(p.items)) return null;
    return p as StoredLayout;
  } catch { return null; }
}

export default function Terminal() {
  const stored = useMemo(loadStored, []);
  const [symbol, setSymbol] = useState<string>(() => localStorage.getItem(LS_SYMBOL) || "BTC");
  const [symbol2, setSymbol2] = useState<string>(() => localStorage.getItem(LS_SYMBOL2) || "ETH");
  const [symbols, setSymbols] = useState<string[]>([]);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [layoutKey, setLayoutKey] = useState<LayoutKey>(stored?.layoutKey ?? "layout1");
  const [items, setItems] = useState<LO[]>(stored?.items ?? LAYOUT_PRESETS.layout1);
  const [locked, setLocked] = useState<boolean>(stored?.locked ?? false);
  const [soundOn, setSoundOn] = useState<boolean>(() => localStorage.getItem(LS_SOUND) === "1");
  const [now, setNow] = useState(new Date());

  // --- Cloud sync (multi-device layout continuity, keyed by email)
  const [syncEmail, setSyncEmail] = useState<string>(() => localStorage.getItem(LS_USER_EMAIL) || "");
  const [syncState, setSyncState] = useState<"off" | "loading" | "synced" | "error">(() => (localStorage.getItem(LS_USER_EMAIL) ? "loading" : "off"));
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const serverLoadedRef = useRef(false);
  const stateRef = useRef({ layoutKey, items, locked, symbol, symbol2 });
  useEffect(() => { stateRef.current = { layoutKey, items, locked, symbol, symbol2 }; });

  const pushLayout = useCallback((email: string) => {
    setSyncState("loading");
    fetch("/api/v1/terminal/layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, layout: stateRef.current }),
    })
      .then(r => r.json())
      .then(j => setSyncState(j?.ok ? "synced" : "error"))
      .catch(() => setSyncState("error"));
  }, []);

  // Initial pull: server layout wins if it exists; otherwise push local state up.
  useEffect(() => {
    if (!syncEmail) { serverLoadedRef.current = true; return; }
    let alive = true;
    setSyncState("loading");
    fetch(`/api/v1/terminal/layout?email=${encodeURIComponent(syncEmail)}`)
      .then(r => r.json())
      .then(j => {
        if (!alive) return;
        if (j?.ok && j.layout && Array.isArray(j.layout.items) && j.layout.items.length > 0) {
          const L = j.layout;
          if (L.layoutKey && L.layoutKey in LAYOUT_PRESETS) setLayoutKey(L.layoutKey as LayoutKey);
          setItems(L.items as LO[]);
          setLocked(!!L.locked);
          if (typeof L.symbol === "string" && L.symbol) setSymbol(L.symbol);
          if (typeof L.symbol2 === "string" && L.symbol2) setSymbol2(L.symbol2);
          setSyncState("synced");
        } else if (j?.ok) {
          pushLayout(syncEmail);
        } else {
          setSyncState("error");
        }
      })
      .catch(() => { if (alive) setSyncState("error"); })
      .finally(() => { serverLoadedRef.current = true; });
    return () => { alive = false; };
  }, [syncEmail, pushLayout]);

  // Debounced auto-save to server on any layout/symbol change
  useEffect(() => {
    if (!syncEmail || !serverLoadedRef.current) return;
    const t = window.setTimeout(() => pushLayout(syncEmail), 2500);
    return () => window.clearTimeout(t);
  }, [items, layoutKey, locked, symbol, symbol2, syncEmail, pushLayout]);

  const enableSync = useCallback((email: string) => {
    const e = email.trim().toLowerCase();
    if (!e.includes("@")) return;
    localStorage.setItem(LS_USER_EMAIL, e);
    serverLoadedRef.current = false;
    setSyncEmail(e);
    setSyncModalOpen(false);
  }, []);
  const disableSync = useCallback(() => {
    localStorage.removeItem(LS_USER_EMAIL);
    setSyncEmail("");
    setSyncState("off");
    setSyncModalOpen(false);
  }, []);

  // --- Load available symbols for command palette autocomplete
  useEffect(() => {
    fetch("/api/v1/challenge/symbols")
      .then(r => r.json())
      .then(j => setSymbols((j.coins || []).map((c: any) => c.symbol)))
      .catch(() => {});
  }, []);

  // --- Persistence
  useEffect(() => { localStorage.setItem(LS_SYMBOL, symbol); }, [symbol]);
  useEffect(() => { localStorage.setItem(LS_SYMBOL2, symbol2); }, [symbol2]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ layoutKey, items, locked }));
    } catch { /* ignore quota */ }
  }, [layoutKey, items, locked]);

  // --- Clock (1s tick)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // --- Keyboard: Cmd/Ctrl+K to open command palette; '?' opens help.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA"].includes(t.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setCmdOpen(true);
      } else if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setHelpOpen(true);
      }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true } as EventListenerOptions);
  }, []);

  // --- Apply preset
  const applyPreset = useCallback((k: LayoutKey) => {
    setLayoutKey(k);
    setItems(LAYOUT_PRESETS[k].map(x => ({ ...x })));
  }, []);

  // --- Add / remove widget
  const addWidget = useCallback((id: WidgetId) => {
    setItems(prev => {
      if (prev.find(x => x.i === id)) return prev;
      // Find a spot at the bottom
      const maxY = prev.reduce((m, x) => Math.max(m, x.y + x.h), 0);
      return [...prev, { i: id, x: 0, y: maxY, w: 4, h: 4, minW: 2, minH: 2 }];
    });
  }, []);
  const removeWidget = useCallback((id: WidgetId) => {
    if (!WIDGETS[id].removable) return;
    setItems(prev => prev.filter(x => x.i !== id));
  }, []);

  const resetLayout = useCallback(() => {
    applyPreset(layoutKey);
  }, [applyPreset, layoutKey]);

  // --- Handle CommandBar actions
  const onAction = (name: string) => {
    if (name === "reset") setSymbol("BTC");
    else if (name === "reset-layout") resetLayout();
    else if (name === "lock") setLocked(v => !v);
    else if (name === "chart2") {
      if (items.find(x => x.i === "chart2")) removeWidget("chart2");
      else addWidget("chart2");
    }
    else if (name === "orderbook") {
      if (items.find(x => x.i === "orderbook")) removeWidget("orderbook");
      else addWidget("orderbook");
    }
    else if (name in LAYOUT_PRESETS) applyPreset(name as LayoutKey);
    else if (name === "sound") {
      const newVal = !soundOn;
      setSoundOn(newVal);
      localStorage.setItem(LS_SOUND, newVal ? "1" : "0");
    }
    else if (name === "help") setHelpOpen(true);
    else if (name === "sync") setSyncModalOpen(true);
    else if (["news", "whales", "feed", "signals"].includes(name)) {
      const el = document.querySelector(`[data-widget="${name}"]`) as HTMLElement | null;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
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

  // --- Render widget body by ID
  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case "chart":     return <TradingViewChart symbol={symbol} idSuffix="main" />;
      case "chart2":    return <TradingViewChart symbol={symbol2} idSuffix="secondary" />;
      case "ticker":    return <LiveTickerWidget onSelectSymbol={setSymbol} activeSymbol={symbol} />;
      case "signals":   return <SignalsWidget />;
      case "whales":    return <WhalesWidget soundOn={soundOn} />;
      case "news":      return <NewsFlashWidget />;
      case "feed":      return <CommunityFeedWidget />;
      case "orderbook": return <OrderBookWidget symbol={symbol} />;
      default:          return null;
    }
  };

  // Layout for RGL: convert LO[] into Layout[] with static=locked
  const rglLayout: Layout[] = items.map(x => ({
    i: x.i, x: x.x, y: x.y, w: x.w, h: x.h,
    minW: x.minW, minH: x.minH,
    static: locked,
  }));

  const onLayoutChange = (nl: Layout[]) => {
    setItems(prev => {
      // Merge new positions into existing item defs
      const map: Record<string, Layout> = {};
      for (const l of nl) map[l.i] = l;
      return prev.map(it => {
        const l = map[it.i];
        return l ? { ...it, x: l.x, y: l.y, w: l.w, h: l.h } : it;
      });
    });
  };

  const timeStr = now.toISOString().slice(11, 19);

  // Symbol picker for chart2 (only when visible)
  const chart2Visible = !!items.find(x => x.i === "chart2");

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
            <span>C1: <span className="text-amber-300 font-black">{symbol}</span></span>
            {chart2Visible && <><span>·</span><span>C2: <span className="text-cyan-300 font-black">{symbol2}</span></span></>}
            <span>·</span>
            <span>LAYOUT: <span className="text-amber-300 font-black">{LAYOUT_LABELS[layoutKey]}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Multi-chart toggle */}
          <button
            data-testid="terminal-toggle-multichart"
            onClick={() => onAction(chart2Visible ? "chart2" : "multichart")}
            title={chart2Visible ? "Retirer Chart 2" : "Activer Multi-Chart"}
            className={`hidden md:flex items-center gap-1 px-2 py-1 border rounded text-[10px] font-bold transition ${chart2Visible ? "border-cyan-500/50 text-cyan-300 bg-cyan-500/10" : "border-white/15 text-white/60 hover:text-cyan-300 hover:border-cyan-500/40"}`}
          >
            <GridIcon className="w-3 h-3" />
            MULTI-CHART
          </button>
          {/* Lock */}
          <button
            data-testid="terminal-toggle-lock"
            onClick={() => setLocked(v => !v)}
            aria-label={locked ? "Déverrouiller" : "Verrouiller"}
            title={locked ? "Layout verrouillé (cliquer pour déverrouiller)" : "Layout modifiable — cliquer pour verrouiller"}
            className={`w-6 h-6 flex items-center justify-center border rounded text-[11px] font-black transition ${locked ? "border-red-500/40 text-red-300 bg-red-500/10" : "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"}`}
          >
            {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
          {/* Cloud sync */}
          <button
            data-testid="terminal-sync-button"
            onClick={() => setSyncModalOpen(true)}
            aria-label="Sync du layout"
            title={syncEmail ? `Sync cloud active (${syncEmail}) — état : ${syncState}` : "Activer la sync cloud du layout (multi-appareils)"}
            className={`w-6 h-6 flex items-center justify-center border rounded transition ${
              syncState === "synced" ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
              : syncState === "loading" ? "border-amber-500/40 text-amber-300 bg-amber-500/10 animate-pulse"
              : syncState === "error" ? "border-red-500/40 text-red-300 bg-red-500/10"
              : "border-white/15 text-white/50 hover:text-white/80"
            }`}
          >
            {syncEmail ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
          </button>
          {/* Reset layout */}
          <button
            data-testid="terminal-reset-layout"
            onClick={resetLayout}
            aria-label="Réinitialiser le layout"
            title="Réinitialiser le layout au preset"
            className="w-6 h-6 flex items-center justify-center border border-white/15 rounded text-white/60 hover:text-amber-300 hover:border-amber-500/40 transition"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
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
            aria-label="Ouvrir l'aide"
            title="Help (?)"
            className="w-6 h-6 flex items-center justify-center border border-white/15 rounded text-[11px] font-black text-white/70 hover:text-amber-300 hover:border-amber-500/40 transition"
          >
            ?
          </button>
          <button
            data-testid="terminal-sound-toggle"
            onClick={() => {
              const nv = !soundOn;
              setSoundOn(nv);
              localStorage.setItem(LS_SOUND, nv ? "1" : "0");
            }}
            aria-label={soundOn ? "Sound on" : "Sound off"}
            title={`Sound alerts: ${soundOn ? "ON" : "OFF"}`}
            className={`w-6 h-6 flex items-center justify-center border rounded text-[11px] font-black transition ${soundOn ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10" : "border-white/15 text-white/50 hover:text-white/80"}`}
          >
            {soundOn ? "♪" : "♩"}
          </button>
          <div className="text-[10px] text-white/60 tabular-nums" data-testid="terminal-clock">{timeStr} UTC</div>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 min-h-0 overflow-auto p-1.5">
        <ResponsiveGridLayout
          className="terminal-rgl"
          layouts={{ lg: rglLayout, md: rglLayout, sm: rglLayout, xs: rglLayout }}
          breakpoints={{ lg: 1200, md: 900, sm: 640, xs: 0 }}
          cols={{ lg: 12, md: 12, sm: 6, xs: 4 }}
          rowHeight={54}
          margin={[6, 6]}
          containerPadding={[0, 0]}
          isDraggable={!locked}
          isResizable={!locked}
          draggableHandle=".rgl-drag-handle"
          onLayoutChange={onLayoutChange}
          compactType="vertical"
        >
          {items.map((it) => {
            const def = WIDGETS[it.i];
            const isFocusable = ["news", "whales", "feed", "signals"].includes(it.i);
            return (
              <div key={it.i} data-widget={isFocusable ? it.i : undefined} className="min-h-0">
                <WidgetCard
                  tag={def.tag}
                  title={
                    it.i === "chart2"
                      ? <SymbolInlinePicker value={symbol2} options={symbols} onChange={setSymbol2} label="Chart 2" />
                      : it.i === "chart"
                        ? <SymbolInlinePicker value={symbol} options={symbols} onChange={setSymbol} label="Chart 1" />
                        : def.title
                  }
                  accent={def.accent}
                  fullBleed={def.fullBleed}
                  right={
                    <div className="flex items-center gap-1">
                      {!locked && (
                        <span className="rgl-drag-handle cursor-grab active:cursor-grabbing text-[9px] text-white/40 hover:text-amber-300 px-1 border border-white/10 rounded uppercase select-none" title="Glisser pour déplacer">MOVE</span>
                      )}
                      {def.removable && !locked && (
                        <button
                          data-testid={`widget-remove-${it.i}`}
                          onClick={() => removeWidget(it.i)}
                          aria-label={`Retirer ${def.title}`}
                          title="Retirer"
                          className="text-white/40 hover:text-red-400 transition"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  }
                >
                  {renderWidget(it.i)}
                </WidgetCard>
              </div>
            );
          })}
        </ResponsiveGridLayout>

        {/* Add-widget bar (only visible when a removable widget is missing) */}
        <div className="flex items-center gap-2 mt-2 text-[10px] text-white/50 uppercase tracking-wider">
          <span className="text-white/40">+ Ajouter :</span>
          {(["chart2", "orderbook"] as WidgetId[]).map(id => {
            const active = !!items.find(x => x.i === id);
            return (
              <button
                key={id}
                data-testid={`add-widget-${id}`}
                onClick={() => (active ? removeWidget(id) : addWidget(id))}
                className={`flex items-center gap-1 px-2 py-0.5 border rounded font-bold transition ${active ? "border-amber-500/40 text-amber-300 bg-amber-500/10" : "border-white/15 text-white/50 hover:text-amber-300 hover:border-amber-500/40"}`}
              >
                {active ? <XIcon className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                {WIDGETS[id].tag}
              </button>
            );
          })}
          <span className="ml-auto text-white/30 hidden md:inline">Astuce : glisse « MOVE » pour déplacer · coin bas-droit pour redimensionner</span>
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

      {syncModalOpen && (
        <SyncModal
          email={syncEmail}
          state={syncState}
          onEnable={enableSync}
          onDisable={disableSync}
          onClose={() => setSyncModalOpen(false)}
        />
      )}

      {/* RGL tweaks — bloomberg aesthetics */}
      <style>{`
        .terminal-rgl .react-grid-item.react-grid-placeholder {
          background: rgba(245, 158, 11, 0.15);
          border: 1px dashed rgba(245, 158, 11, 0.5);
          opacity: 1;
          border-radius: 4px;
        }
        .terminal-rgl .react-grid-item > .react-resizable-handle::after {
          border-right: 2px solid rgba(245, 158, 11, 0.5);
          border-bottom: 2px solid rgba(245, 158, 11, 0.5);
        }
        .terminal-rgl .react-grid-item.react-draggable-dragging {
          z-index: 60;
          box-shadow: 0 8px 40px rgba(245, 158, 11, 0.25);
        }
      `}</style>
    </div>
  );
}

// ------- Cloud sync modal --------
function SyncModal({
  email, state, onEnable, onDisable, onClose,
}: { email: string; state: string; onEnable: (e: string) => void; onDisable: () => void; onClose: () => void }) {
  const [value, setValue] = useState(email);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose} data-testid="sync-modal">
      <div className="bg-[#0a0a0f] border border-amber-500/30 rounded-xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-1">
          <Cloud className="w-4 h-4 text-amber-400" />
          <h3 className="font-black text-xs uppercase tracking-[0.15em] text-amber-300">Sync Cloud du Layout</h3>
        </div>
        <p className="text-[10px] text-white/50 mb-4 leading-relaxed">
          Sauvegarde ton layout sur le serveur pour le retrouver sur tous tes appareils. Utilise le même email que ton accès Elite.
        </p>
        <input
          data-testid="sync-email-input"
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnable(value)}
          placeholder="ton@email.com"
          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-amber-500/50 mb-3"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <button
            data-testid="sync-enable-button"
            onClick={() => onEnable(value)}
            disabled={!value.includes("@")}
            className="flex-1 py-2 rounded-lg bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider hover:bg-amber-400 transition disabled:opacity-40"
          >
            {email ? "Mettre à jour" : "Activer la sync"}
          </button>
          {email && (
            <button
              data-testid="sync-disable-button"
              onClick={onDisable}
              className="px-3 py-2 rounded-lg border border-red-500/40 text-red-300 text-[10px] font-black uppercase tracking-wider hover:bg-red-500/10 transition"
            >
              Désactiver
            </button>
          )}
        </div>
        {email && (
          <p className="text-[9px] text-white/40 mt-3 font-mono">
            État : <span className={state === "synced" ? "text-emerald-400" : state === "error" ? "text-red-400" : "text-amber-300"}>{state === "synced" ? "✓ synchronisé" : state === "error" ? "erreur serveur" : state}</span> · {email}
          </p>
        )}
      </div>
    </div>
  );
}

// ------- Inline symbol picker used in Chart widget headers --------
function SymbolInlinePicker({
  value, options, onChange, label,
}: { value: string; options: string[]; onChange: (s: string) => void; label: string }) {
  const opts = options.length ? options : [value];
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      <span className="text-[10px] text-white/50 uppercase tracking-wider">{label}</span>
      <select
        data-testid={`chart-symbol-${label.replace(/\s/g, "").toLowerCase()}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="bg-black border border-white/15 rounded text-amber-300 text-[11px] font-bold px-1.5 py-0.5 outline-none focus:border-amber-500/60"
      >
        {opts.map(s => <option key={s} value={s}>{s}/USDT</option>)}
      </select>
    </span>
  );
}
