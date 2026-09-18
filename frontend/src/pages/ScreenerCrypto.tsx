import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Search, Star, RefreshCw, ChevronDown, ChevronUp, ArrowDown, ArrowUp,
  X, Plus, MoreHorizontal, Download, AlertTriangle, SlidersHorizontal,
  LayoutGrid, List, TrendingUp, TrendingDown, Minus, Maximize2,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════
// Screener Crypto — page PUBLIQUE (aucun abonnement requis)
// Reproduit les paramètres du screener TradingView de la capture :
// chips de filtres, onglets Overview / Performance / Technicals,
// colonnes Symbol, Exchange, Price, Chg %, Vol in USD, Vol chg %,
// Tech rating. Données 100 % réelles via Binance (Spot + Perpétuels).
// ════════════════════════════════════════════════════════════════

type Market = "spot" | "perp";
type TabKey = "overview" | "performance" | "technicals";

interface TechRating {
  rating: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
  buy: number; sell: number; neutral: number;
  rsi: number | null; macd: number | null;
  ma5: number | null; ma10: number | null; ma20: number | null; ma50: number | null;
}

interface ScreenerRow {
  symbol: string;
  base: string;
  market: Market;
  exchange: string;
  price: number;
  chg24h: number;
  chg1h: number | null;
  volUsd: number;
  volChg24h: number | null;
  high24h: number;
  low24h: number;
  closes: number[];
  tech: TechRating | null;
}

interface ScreenerResponse {
  ok: boolean;
  market: Market;
  count: number;
  updatedAt: string;
  cached?: boolean;
  stale?: boolean;
  rows: ScreenerRow[];
  error?: string;
  message?: string;
}

type Op = ">" | "<";

interface NumFilter { enabled: boolean; op: Op; value: number }
interface Filters {
  chg1h: NumFilter;
  perf: NumFilter;      // Perf % (24h)
  vol: NumFilter;       // Vol in USD (en $M)
  volChg: NumFilter;    // Vol chg %
  base: string;         // Devise de base ("" = toutes)
  watchlistOnly: boolean;
}

const DEFAULT_FILTERS: Filters = {
  chg1h: { enabled: false, op: ">", value: 1 },
  perf: { enabled: false, op: ">", value: 0 },
  vol: { enabled: false, op: ">", value: 50 },
  volChg: { enabled: false, op: ">", value: 0 },
  base: "",
  watchlistOnly: false,
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "performance", label: "Performance" },
  { key: "technicals", label: "Technicals" },
];

const RATING_UI: Record<TechRating["rating"], { label: string; cls: string; arrow: string }> = {
  strong_buy: { label: "Strong buy", cls: "text-emerald-400", arrow: "⬈⬈" },
  buy: { label: "Buy", cls: "text-emerald-400", arrow: "↑" },
  neutral: { label: "Neutral", cls: "text-gray-400", arrow: "=" },
  sell: { label: "Sell", cls: "text-red-400", arrow: "↓" },
  strong_sell: { label: "Strong sell", cls: "text-red-400", arrow: "⬊⬊" },
};

// ─── Formatage ───
function fmtPrice(p: number): string {
  if (!isFinite(p)) return "—";
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (p >= 1) return p.toLocaleString("en-US", { maximumFractionDigits: 4 });
  if (p >= 0.01) return p.toFixed(6).replace(/0+$/, "").replace(/\.$/, ".0");
  return p.toPrecision(4);
}
function fmtUsd(n: number | null): string {
  if (n == null || !isFinite(n)) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}
function fmtPct(n: number | null, signed = true): string {
  if (n == null || !isFinite(n)) return "—";
  const s = n.toFixed(2);
  return `${signed && n > 0 ? "+" : ""}${s}%`;
}
function pctCls(n: number | null): string {
  if (n == null || !isFinite(n)) return "text-gray-500";
  return n > 0 ? "text-emerald-400" : n < 0 ? "text-red-400" : "text-gray-400";
}

// ─── Watchlist (localStorage) ───
const WL_KEY = "screener_crypto_watchlist";
function loadWatchlist(): Set<string> {
  try {
    const raw = localStorage.getItem(WL_KEY);
    if (raw) return new Set<string>(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}
function saveWatchlist(s: Set<string>) {
  try { localStorage.setItem(WL_KEY, JSON.stringify([...s])); } catch { /* ignore */ }
}

// ─── Chip de filtre numérique (style TradingView : « Chg, 1h > 1% ») ───
function NumChip({
  label, sub, f, onChange, suffix = "%",
}: {
  label: string; sub?: string; f: NumFilter;
  onChange: (f: NumFilter) => void; suffix?: string;
}) {
  if (!f.enabled) {
    return (
      <button
        onClick={() => onChange({ ...f, enabled: true })}
        className="flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-gray-400 hover:text-gray-200 hover:bg-white/[0.07] transition-all whitespace-nowrap"
      >
        <Plus className="w-3 h-3" />
        {label}
        {sub && <span className="text-gray-600">{sub}</span>}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-[11px] text-cyan-200 whitespace-nowrap">
      <span className="font-semibold">{label}</span>
      {sub && <span className="text-cyan-400/70">{sub}</span>}
      <select
        value={f.op}
        onChange={(e) => onChange({ ...f, op: e.target.value as Op })}
        className="bg-transparent text-cyan-200 text-[11px] font-bold focus:outline-none cursor-pointer"
      >
        <option value=">" className="bg-[#0d1117] text-gray-200">&gt;</option>
        <option value="<" className="bg-[#0d1117] text-gray-200">&lt;</option>
      </select>
      <input
        type="number"
        value={f.value}
        step={suffix === "%" ? 0.5 : 1}
        onChange={(e) => onChange({ ...f, value: parseFloat(e.target.value) || 0 })}
        className="w-14 bg-white/[0.06] rounded px-1.5 py-0.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
      />
      <span className="text-cyan-400/70">{suffix}</span>
      <button
        onClick={() => onChange({ ...f, enabled: false })}
        className="ml-0.5 p-0.5 rounded hover:bg-white/10 text-cyan-300/70 hover:text-white transition-colors"
        title="Retirer ce filtre"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Sparkline (données horaires réelles) ───
function Spark({ closes }: { closes: number[] }) {
  if (!closes || closes.length < 3) return <span className="text-[10px] text-gray-600">—</span>;
  const w = 72, h = 22;
  const min = Math.min(...closes), max = Math.max(...closes);
  const range = max - min || 1;
  const step = w / (closes.length - 1);
  const pts = closes.map((p, i) => `${(i * step).toFixed(1)},${(h - ((p - min) / range) * (h - 3) - 1.5).toFixed(1)}`).join(" ");
  const up = closes[closes.length - 1] >= closes[0];
  return (
    <svg width={w} height={h} className="block">
      <polyline points={pts} fill="none" stroke={up ? "#10B981" : "#EF4444"} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════
// Composant principal
// ════════════════════════════════════════════════════════════════
export default function ScreenerCrypto() {
  const [market, setMarket] = useState<Market>("spot");
  const [rows, setRows] = useState<ScreenerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [tab, setTab] = useState<TabKey>("overview");
  const [view, setView] = useState<"table" | "chart">("table");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [sortKey, setSortKey] = useState<string>("volUsd");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [watchlist, setWatchlist] = useState<Set<string>>(loadWatchlist);
  const [menuOpen, setMenuOpen] = useState(false);
  const PER_PAGE = 25;

  const fetchData = useCallback(async (m: Market, refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/binance/screener?market=${m}&limit=150${refresh ? "&refresh=1" : ""}`, {
        signal: AbortSignal.timeout(45000),
      });
      const j: ScreenerResponse = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.message || `Erreur serveur (${r.status})`);
      setRows(j.rows || []);
      setUpdatedAt(j.updatedAt || "");
      setStale(!!j.stale);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Impossible de charger les données de marché.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(market); }, [market, fetchData]);
  useEffect(() => {
    const id = setInterval(() => fetchData(market, true), 120000);
    return () => clearInterval(id);
  }, [market, fetchData]);

  const toggleWatch = (sym: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym); else next.add(sym);
      saveWatchlist(next);
      return next;
    });
  };

  const bases = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => s.add(r.base));
    return [...s].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return rows.filter((r) => {
      if (q && !r.symbol.toUpperCase().includes(q) && !r.base.toUpperCase().includes(q)) return false;
      if (filters.base && r.base !== filters.base) return false;
      if (filters.watchlistOnly && !watchlist.has(r.symbol)) return false;
      const pass = (f: NumFilter, v: number | null): boolean => {
        if (!f.enabled) return true;
        if (v == null || !isFinite(v)) return false;
        return f.op === ">" ? v > f.value : v < f.value;
      };
      if (!pass(filters.chg1h, r.chg1h)) return false;
      if (!pass(filters.perf, r.chg24h)) return false;
      if (!pass(filters.vol, r.volUsd / 1e6)) return false;
      if (!pass(filters.volChg, r.volChg24h)) return false;
      return true;
    });
  }, [rows, search, filters, watchlist]);

  const sorted = useMemo(() => {
    const get = (r: ScreenerRow): number | string => {
      switch (sortKey) {
        case "symbol": return r.symbol;
        case "exchange": return r.exchange;
        case "price": return r.price;
        case "chg1h": return r.chg1h ?? -Infinity;
        case "chg24h": return r.chg24h;
        case "volUsd": return r.volUsd;
        case "volChg24h": return r.volChg24h ?? -Infinity;
        case "rsi": return r.tech?.rsi ?? -Infinity;
        case "macd": return r.tech?.macd ?? -Infinity;
        case "tech": {
          const order = { strong_sell: 0, sell: 1, neutral: 2, buy: 3, strong_buy: 4 } as const;
          return r.tech ? order[r.tech.rating] : 2;
        }
        default: return r.volUsd;
      }
    };
    return [...filtered].sort((a, b) => {
      const va = get(a), vb = get(b);
      const c = typeof va === "string" ? String(va).localeCompare(String(vb)) : (va as number) - (vb as number);
      return sortDir === "asc" ? c : -c;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const activeCount =
    [filters.chg1h, filters.perf, filters.vol, filters.volChg].filter((f) => f.enabled).length +
    (filters.base ? 1 : 0) + (filters.watchlistOnly ? 1 : 0);

  const resetFilters = () => { setFilters(DEFAULT_FILTERS); setSearch(""); setPage(1); };

  const exportCSV = () => {
    const head = ["Symbol", "Exchange", "Price", "Chg % 1h", "Chg % 24h", "Vol in USD", "Vol chg % 24h", "RSI 1h", "MACD hist", "Tech rating"];
    const lines = sorted.map((r) => [
      r.symbol, r.exchange, r.price,
      r.chg1h == null ? "" : r.chg1h.toFixed(2),
      r.chg24h.toFixed(2), Math.round(r.volUsd),
      r.volChg24h == null ? "" : r.volChg24h.toFixed(2),
      r.tech?.rsi ?? "", r.tech?.macd ?? "", r.tech?.rating ?? "",
    ].join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `screener_crypto_${market}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const goFullscreen = () => {
    const el = document.getElementById("screener-crypto-root");
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    el?.requestFullscreen?.().catch(() => {});
  };

  const Th = ({ k, children, align = "left" }: { k: string; children: ReactNode; align?: "left" | "right" }) => (
    <th
      onClick={() => toggleSort(k)}
      className={`py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-200 transition-colors whitespace-nowrap ${align === "right" ? "text-right" : "text-left"}`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortKey === k
          ? sortDir === "desc" ? <ArrowDown className="w-3 h-3 text-cyan-400" /> : <ArrowUp className="w-3 h-3 text-cyan-400" />
          : <ArrowDown className="w-3 h-3 opacity-15" />}
      </span>
    </th>
  );

  const TechBadge = ({ tech }: { tech: TechRating | null }) => {
    if (!tech) return <span className="text-[11px] text-gray-600">—</span>;
    const u = RATING_UI[tech.rating];
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${u.cls}`} title={`Acheteurs: ${tech.buy} • Neutres: ${tech.neutral} • Vendeurs: ${tech.sell} (moyenneurs 1h, RSI, MACD)`}>
        <span aria-hidden>{u.arrow}</span>
        {u.label}
      </span>
    );
  };

  const rangePos = (r: ScreenerRow): number | null => {
    if (!(r.high24h > r.low24h) || !isFinite(r.price)) return null;
    return ((r.price - r.low24h) / (r.high24h - r.low24h)) * 100;
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]" id="screener-crypto-root">
        <div className="px-4 md:px-6 py-5">

          {/* Titre + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-extrabold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent leading-tight">
                  Screener Crypto
                </h1>
                <p className="text-[11px] text-gray-500">
                  Données de marché en direct — {rows.length} paires • source Binance • accès gratuit, sans abonnement
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[10px] text-gray-600">
                {updatedAt ? `MAJ ${new Date(updatedAt).toLocaleTimeString("fr-FR")}` : ""}
                {stale && <span className="text-amber-400"> • données temporaires</span>}
              </span>
              <button
                onClick={() => fetchData(market, true)}
                disabled={loading}
                className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-[11px] font-semibold text-gray-300 transition-all"
                title="Actualiser"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={goFullscreen}
                className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-gray-300 transition-all"
                title="Plein écran"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bandeau d'erreur */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-2.5 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error} — les marchés peuvent être momentanément indisponibles.
              <button onClick={() => fetchData(market, true)} className="ml-auto underline hover:text-red-200">Réessayer</button>
            </div>
          )}

          {/* Barre de filtres (chips style TradingView) */}
          <div className="bg-[#0d1117] border border-white/[0.06] rounded-xl p-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Watchlist */}
              <button
                onClick={() => setFilters((f) => ({ ...f, watchlistOnly: !f.watchlistOnly }))}
                className={`flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[11px] font-semibold transition-all ${
                  filters.watchlistOnly
                    ? "bg-yellow-500/15 border-yellow-500/35 text-yellow-300"
                    : "bg-white/[0.04] border-white/[0.08] text-gray-400 hover:text-gray-200"
                }`}
                title="Filtrer sur ma watchlist"
              >
                <Star className={`w-3 h-3 ${filters.watchlistOnly ? "fill-yellow-400 text-yellow-400" : ""}`} />
                Watchlist
                <span className="text-gray-600">({watchlist.size})</span>
                {filters.watchlistOnly && <X className="w-3 h-3" />}
              </button>

              <NumChip label="Chg" sub="1h" f={filters.chg1h} onChange={(v) => setFilters((f) => ({ ...f, chg1h: v }))} />
              <NumChip label="Perf %" f={filters.perf} onChange={(v) => setFilters((f) => ({ ...f, perf: v }))} />

              {/* Marché : Spot / Perpetual */}
              <div className="flex items-center h-7 rounded-md border border-white/[0.08] overflow-hidden">
                <button
                  onClick={() => setMarket("spot")}
                  className={`h-full px-2.5 text-[11px] font-semibold transition-colors ${market === "spot" ? "bg-blue-500/20 text-blue-300" : "bg-white/[0.02] text-gray-500 hover:text-gray-300"}`}
                >
                  Spot
                </button>
                <button
                  onClick={() => setMarket("perp")}
                  className={`h-full px-2.5 text-[11px] font-semibold transition-colors ${market === "perp" ? "bg-blue-500/20 text-blue-300" : "bg-white/[0.02] text-gray-500 hover:text-gray-300"}`}
                >
                  Perpétuel
                </button>
              </div>

              {/* Devise de base */}
              <select
                value={filters.base}
                onChange={(e) => { setFilters((f) => ({ ...f, base: e.target.value })); setPage(1); }}
                className="h-7 px-2 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-gray-300 focus:outline-none focus:border-cyan-500/40 max-w-[120px]"
                title="Devise de base"
              >
                <option value="" className="bg-[#0d1117]">Base currency</option>
                {bases.map((b) => (
                  <option key={b} value={b} className="bg-[#0d1117]">{b}</option>
                ))}
              </select>

              <NumChip label="Vol in USD" f={filters.vol} onChange={(v) => setFilters((f) => ({ ...f, vol: v }))} suffix="M" />
              <NumChip label="Vol chg %" f={filters.volChg} onChange={(v) => setFilters((f) => ({ ...f, volChg: v }))} />

              <button
                onClick={() => setShowAllFilters((s) => !s)}
                className="h-7 w-7 rounded-md bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white flex items-center justify-center transition-all"
                title={showAllFilters ? "Masquer les filtres avancés" : "Plus de filtres"}
              >
                {showAllFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <MoreHorizontal className="w-3.5 h-3.5" />}
              </button>

              {activeCount > 0 && (
                <button onClick={resetFilters} className="h-7 px-2.5 rounded-md text-[11px] text-gray-500 hover:text-white underline-offset-2 hover:underline transition-colors">
                  Réinitialiser ({activeCount})
                </button>
              )}
            </div>

            {showAllFilters && (
              <div className="mt-2 pt-2 border-t border-white/[0.05] flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span className="font-semibold text-gray-400">Filtres rapides :</span>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, chg1h: { enabled: true, op: ">", value: 1 } })}
                  className="h-6 px-2 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20 transition-colors">
                  🚀 Chg 1h &gt; 1%
                </button>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, perf: { enabled: true, op: ">", value: 5 } })}
                  className="h-6 px-2 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/20 transition-colors">
                  📈 Perf 24h &gt; 5%
                </button>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, vol: { enabled: true, op: ">", value: 100 } })}
                  className="h-6 px-2 rounded bg-blue-500/10 border border-blue-500/25 text-blue-300 hover:bg-blue-500/20 transition-colors">
                  💧 Vol &gt; 100M$
                </button>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, volChg: { enabled: true, op: ">", value: 30 } })}
                  className="h-6 px-2 rounded bg-amber-500/10 border border-amber-500/25 text-amber-300 hover:bg-amber-500/20 transition-colors">
                  🔥 Vol chg &gt; 30%
                </button>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, perf: { enabled: true, op: "<", value: -5 } })}
                  className="h-6 px-2 rounded bg-red-500/10 border border-red-500/25 text-red-300 hover:bg-red-500/20 transition-colors">
                  🔻 Perf 24h &lt; -5%
                </button>
                <span className="ml-auto text-gray-600">Cotation en USDT — seule devise de cotation disponible chez la source.</span>
              </div>
            )}
          </div>

          {/* Onglets + recherche + mode d'affichage */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="flex items-center rounded-lg bg-white/[0.03] border border-white/[0.06] p-0.5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 h-7 rounded-md text-[11px] font-bold transition-all ${
                    tab === t.key ? "bg-white/[0.09] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-[180px] max-w-[320px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Rechercher un symbole (ex: BTC)…"
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#0d1117] border border-white/[0.07] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40"
              />
            </div>

            <div className="flex items-center rounded-lg bg-white/[0.03] border border-white/[0.06] p-0.5 ml-auto">
              <button
                onClick={() => setView("table")}
                className={`h-7 w-8 rounded-md flex items-center justify-center transition-all ${view === "table" ? "bg-white/[0.09] text-white" : "text-gray-500 hover:text-gray-300"}`}
                title="Vue tableau"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setView("chart")}
                className={`h-7 w-8 rounded-md flex items-center justify-center transition-all ${view === "chart" ? "bg-white/[0.09] text-white" : "text-gray-500 hover:text-gray-300"}`}
                title="Vue graphique"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="h-8 w-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white flex items-center justify-center transition-all"
                title="Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-9 z-30 w-44 rounded-xl bg-[#0d1117] border border-white/[0.1] shadow-2xl py-1">
                  <button onClick={exportCSV} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/[0.05]">
                    <Download className="w-3.5 h-3.5" /> Exporter CSV
                  </button>
                  <button onClick={() => { resetFilters(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/[0.05]">
                    <X className="w-3.5 h-3.5" /> Réinitialiser filtres
                  </button>
                  <button onClick={() => { setWatchlist(new Set()); saveWatchlist(new Set()); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/[0.05]">
                    <Star className="w-3.5 h-3.5" /> Vider la watchlist
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tableau */}
          <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl overflow-hidden">
            {loading && rows.length === 0 ? (
              <div className="flex items-center justify-center gap-3 py-24">
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                <span className="text-sm text-gray-500">Chargement des données de marché…</span>
              </div>
            ) : view === "chart" ? (
              /* Vue graphique : cartes avec sparkline horaire réelle */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-3">
                {paginated.map((r) => (
                  <div key={r.symbol} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 hover:border-cyan-500/25 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleWatch(r.symbol)} title="Ajouter à la watchlist">
                          <Star className={`w-3.5 h-3.5 ${watchlist.has(r.symbol) ? "fill-yellow-400 text-yellow-400" : "text-gray-600 hover:text-gray-400"}`} />
                        </button>
                        <span className="text-xs font-bold">{r.symbol}</span>
                      </div>
                      <span className={`text-[11px] font-bold ${pctCls(r.chg24h)}`}>{fmtPct(r.chg24h)}</span>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-sm font-extrabold">${fmtPrice(r.price)}</p>
                        <p className="text-[10px] text-gray-600">Vol {fmtUsd(r.volUsd)}</p>
                      </div>
                      <Spark closes={r.closes} />
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/[0.05] flex items-center justify-between">
                      <span className="text-[9px] text-gray-600 uppercase">{r.exchange}</span>
                      <TechBadge tech={r.tech} />
                    </div>
                  </div>
                ))}
                {paginated.length === 0 && (
                  <div className="col-span-full py-16 text-center text-sm text-gray-600">Aucun symbole ne correspond aux filtres.</div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="border-b border-white/[0.06]">
                    <tr>
                      <th className="py-2 px-2 w-8"></th>
                      <Th k="symbol">
                        <span className="flex flex-col leading-none">
                          <span>Symbol</span>
                          <span className="text-[9px] text-gray-600 font-normal normal-case tracking-normal mt-0.5">{sorted.length}</span>
                        </span>
                      </Th>
                      <Th k="exchange">Exchange</Th>
                      <Th k="price" align="right">Price</Th>

                      {tab === "overview" && (
                        <>
                          <Th k="chg24h" align="right">
                            <span className="flex flex-col leading-none items-end">
                              <span className="inline-flex items-center gap-1">
                                {sortKey === "chg24h" && (sortDir === "desc" ? <ArrowDown className="w-2.5 h-2.5 text-cyan-400" /> : <ArrowUp className="w-2.5 h-2.5 text-cyan-400" />)}
                                Chg %
                              </span>
                              <span className="text-[9px] text-gray-600 font-normal normal-case tracking-normal mt-0.5">24h</span>
                            </span>
                          </Th>
                          <Th k="volUsd" align="right">
                            <span className="flex flex-col leading-none items-end">
                              <span>Vol in USD</span>
                              <span className="text-[9px] text-gray-600 font-normal normal-case tracking-normal mt-0.5">24h</span>
                            </span>
                          </Th>
                          <Th k="volChg24h" align="right">
                            <span className="flex flex-col leading-none items-end">
                              <span>Vol chg %</span>
                              <span className="text-[9px] text-gray-600 font-normal normal-case tracking-normal mt-0.5">24h</span>
                            </span>
                          </Th>
                          <Th k="tech">Tech rating</Th>
                        </>
                      )}

                      {tab === "performance" && (
                        <>
                          <Th k="chg1h" align="right">
                            <span className="flex flex-col leading-none items-end">
                              <span>Chg %</span>
                              <span className="text-[9px] text-gray-600 font-normal normal-case tracking-normal mt-0.5">1h</span>
                            </span>
                          </Th>
                          <Th k="chg24h" align="right">
                            <span className="flex flex-col leading-none items-end">
                              <span>Chg %</span>
                              <span className="text-[9px] text-gray-600 font-normal normal-case tracking-normal mt-0.5">24h</span>
                            </span>
                          </Th>
                          <th className="py-2 px-2 text-right text-[11px] font-semibold text-gray-500 uppercase whitespace-nowrap">Haut 24h</th>
                          <th className="py-2 px-2 text-right text-[11px] font-semibold text-gray-500 uppercase whitespace-nowrap">Bas 24h</th>
                          <th className="py-2 px-2 text-left text-[11px] font-semibold text-gray-500 uppercase whitespace-nowrap">Position 24h</th>
                        </>
                      )}

                      {tab === "technicals" && (
                        <>
                          <Th k="rsi" align="right">RSI <span className="text-gray-600 font-normal normal-case">1h</span></Th>
                          <Th k="macd" align="right">MACD <span className="text-gray-600 font-normal normal-case">hist</span></Th>
                          <th className="py-2 px-2 text-left text-[11px] font-semibold text-gray-500 uppercase whitespace-nowrap">Moyennes mobiles 1h</th>
                          <Th k="tech">Tech rating</Th>
                        </>
                      )}

                      <th className="py-2 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((r) => {
                      const rp = rangePos(r);
                      return (
                        <tr key={r.symbol} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="py-2 px-2">
                            <button onClick={() => toggleWatch(r.symbol)} title="Watchlist">
                              <Star className={`w-3.5 h-3.5 ${watchlist.has(r.symbol) ? "fill-yellow-400 text-yellow-400" : "text-gray-700 hover:text-gray-500"}`} />
                            </button>
                          </td>
                          <td className="py-2 px-2">
                            <span className="text-xs font-bold text-white">{r.base}</span>
                            <span className="text-[10px] text-gray-600">/USDT</span>
                          </td>
                          <td className="py-2 px-2 text-[11px] text-gray-400 whitespace-nowrap">{r.exchange}</td>
                          <td className="py-2 px-2 text-xs font-bold text-right tabular-nums">${fmtPrice(r.price)}</td>

                          {tab === "overview" && (
                            <>
                              <td className={`py-2 px-2 text-xs font-bold text-right tabular-nums ${pctCls(r.chg24h)}`}>
                                {r.chg24h > 0 ? <TrendingUp className="w-3 h-3 inline mr-1 -mt-0.5 text-emerald-400" /> : r.chg24h < 0 ? <TrendingDown className="w-3 h-3 inline mr-1 -mt-0.5 text-red-400" /> : <Minus className="w-3 h-3 inline mr-1 -mt-0.5 text-gray-500" />}
                                {fmtPct(r.chg24h)}
                              </td>
                              <td className="py-2 px-2 text-xs text-right tabular-nums text-gray-300">{fmtUsd(r.volUsd)}</td>
                              <td className={`py-2 px-2 text-xs font-semibold text-right tabular-nums ${pctCls(r.volChg24h)}`}>{fmtPct(r.volChg24h)}</td>
                              <td className="py-2 px-2"><TechBadge tech={r.tech} /></td>
                            </>
                          )}

                          {tab === "performance" && (
                            <>
                              <td className={`py-2 px-2 text-xs font-bold text-right tabular-nums ${pctCls(r.chg1h)}`}>{fmtPct(r.chg1h)}</td>
                              <td className={`py-2 px-2 text-xs font-bold text-right tabular-nums ${pctCls(r.chg24h)}`}>{fmtPct(r.chg24h)}</td>
                              <td className="py-2 px-2 text-xs text-right tabular-nums text-emerald-400/90">${fmtPrice(r.high24h)}</td>
                              <td className="py-2 px-2 text-xs text-right tabular-nums text-red-400/90">${fmtPrice(r.low24h)}</td>
                              <td className="py-2 px-2">
                                {rp == null ? <span className="text-[10px] text-gray-600">—</span> : (
                                  <div className="flex items-center gap-2" title={`Position du prix dans la fourchette 24h : ${rp.toFixed(0)}%`}>
                                    <div className="w-24 h-1.5 rounded-full bg-white/[0.07] relative overflow-hidden">
                                      <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 rounded-sm bg-cyan-400" style={{ left: `calc(${Math.min(100, Math.max(0, rp))}% - 3px)` }} />
                                    </div>
                                    <span className="text-[10px] text-gray-500 tabular-nums">{rp.toFixed(0)}%</span>
                                  </div>
                                )}
                              </td>
                            </>
                          )}

                          {tab === "technicals" && (
                            <>
                              <td className="py-2 px-2 text-right">
                                <span className={`text-xs font-bold tabular-nums ${r.tech?.rsi == null ? "text-gray-600" : r.tech.rsi < 30 ? "text-emerald-400" : r.tech.rsi > 70 ? "text-red-400" : "text-gray-300"}`}>
                                  {r.tech?.rsi ?? "—"}
                                </span>
                              </td>
                              <td className={`py-2 px-2 text-xs font-semibold text-right tabular-nums ${r.tech?.macd == null ? "text-gray-600" : r.tech.macd > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {r.tech?.macd == null ? "—" : r.tech.macd.toExponential(2)}
                              </td>
                              <td className="py-2 px-2">
                                {r.tech ? (
                                  <div className="flex items-center gap-1 text-[10px]">
                                    {([["MA5", r.tech.ma5], ["MA10", r.tech.ma10], ["MA20", r.tech.ma20], ["MA50", r.tech.ma50]] as const).map(([lab, v]) => (
                                      <span key={lab}
                                        title={`${lab} 1h : ${v == null ? "—" : v}`}
                                        className={`px-1.5 py-0.5 rounded border ${
                                          v == null ? "text-gray-600 border-white/[0.06]"
                                            : r.price > v ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/5"
                                              : "text-red-400 border-red-500/25 bg-red-500/5"
                                        }`}
                                      >
                                        {lab}
                                      </span>
                                    ))}
                                    <span className="text-gray-600 ml-1">
                                      {r.tech.buy}A · {r.tech.neutral}N · {r.tech.sell}V
                                    </span>
                                  </div>
                                ) : <span className="text-[10px] text-gray-600">—</span>}
                              </td>
                              <td className="py-2 px-2"><TechBadge tech={r.tech} /></td>
                            </>
                          )}

                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => { setFilters((f) => ({ ...f, base: f.base === r.base ? "" : r.base })); setPage(1); }}
                              className="text-gray-700 hover:text-cyan-400 transition-colors"
                              title={`Filtrer sur ${r.base}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-16 text-center text-sm text-gray-600">
                          {loading ? "Actualisation…" : "Aucun symbole ne correspond aux filtres."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {view === "table" && totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.05]">
                <span className="text-[11px] text-gray-600">
                  {sorted.length} résultats • page {safePage}/{totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
                    className="h-7 px-2.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-bold text-gray-400 disabled:opacity-30 transition-all">
                    ←
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pn: number;
                    if (totalPages <= 5) pn = i + 1;
                    else if (safePage <= 3) pn = i + 1;
                    else if (safePage >= totalPages - 2) pn = totalPages - 4 + i;
                    else pn = safePage - 2 + i;
                    return (
                      <button key={pn} onClick={() => setPage(pn)}
                        className={`h-7 w-7 rounded-md text-[11px] font-bold transition-all ${pn === safePage ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-white/[0.04] hover:bg-white/[0.08] text-gray-400"}`}>
                        {pn}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                    className="h-7 px-2.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-bold text-gray-400 disabled:opacity-30 transition-all">
                    →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Avertissement */}
          <p className="mt-3 text-[10px] text-gray-600 leading-relaxed">
            Le « Tech rating » est une note technique synthétique (moyennes mobiles 1h, RSI 14, histogramme MACD) calculée
            à partir de données de marché réelles Binance — ce n'est pas un conseil en investissement.
            Les marchés crypto peuvent évoluer rapidement ; les données sont rafraîchies toutes les 2 minutes.
          </p>
        </div>
      </main>
    </div>
  );
}
