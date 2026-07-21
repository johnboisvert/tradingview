// Forex, Or & Métaux — page publique marché (82 instruments : majeures, croisées, exotiques, métaux, DXY)
import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { DollarSign, Search, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface FxRow {
  pair: string;
  name: string;
  category: "major" | "cross" | "exotic" | "metal" | "index";
  price: number;
  prev_close: number | null;
  change_pct: number;
  day_high: number | null;
  day_low: number | null;
  spark: number[];
}

const FLAGS: Record<string, string> = {
  EUR: "🇪🇺", USD: "🇺🇸", GBP: "🇬🇧", JPY: "🇯🇵", CHF: "🇨🇭", CAD: "🇨🇦", AUD: "🇦🇺", NZD: "🇳🇿",
  SEK: "🇸🇪", NOK: "🇳🇴", DKK: "🇩🇰", ISK: "🇮🇸", PLN: "🇵🇱", HUF: "🇭🇺", CZK: "🇨🇿", RON: "🇷🇴",
  BGN: "🇧🇬", RSD: "🇷🇸", UAH: "🇺🇦", MDL: "🇲🇩", BYN: "🇧🇾", TRY: "🇹🇷", RUB: "🇷🇺", KZT: "🇰🇿",
  GEL: "🇬🇪", AMD: "🇦🇲", AZN: "🇦🇿", UZS: "🇺🇿",
  ZAR: "🇿🇦", NGN: "🇳🇬", GHS: "🇬🇭", KES: "🇰🇪", TZS: "🇹🇿", UGX: "🇺🇬", ZMW: "🇿🇲", BWP: "🇧🇼",
  NAD: "🇳🇦", MUR: "🇲🇺", ETB: "🇪🇹", XAF: "🇨🇲", XOF: "🇸🇳", EGP: "🇪🇬", MAD: "🇲🇦", TND: "🇹🇳", DZD: "🇩🇿",
  MXN: "🇲🇽", BRL: "🇧🇷", ARS: "🇦🇷", CLP: "🇨🇱", COP: "🇨🇴", PEN: "🇵🇪", UYU: "🇺🇾", BOB: "🇧🇴",
  PYG: "🇵🇾", CRC: "🇨🇷", GTQ: "🇬🇹", DOP: "🇩🇴", JMD: "🇯🇲", TTD: "🇹🇹", HNL: "🇭🇳", NIO: "🇳🇮",
  SGD: "🇸🇬", HKD: "🇭🇰", CNH: "🇨🇳", CNY: "🇨🇳", INR: "🇮🇳", KRW: "🇰🇷", THB: "🇹🇭", IDR: "🇮🇩",
  PHP: "🇵🇭", MYR: "🇲🇾", TWD: "🇹🇼", VND: "🇻🇳", PKR: "🇵🇰", BDT: "🇧🇩", LKR: "🇱🇰", NPR: "🇳🇵",
  BND: "🇧🇳", FJD: "🇫🇯", XPF: "🇵🇫", ILS: "🇮🇱", SAR: "🇸🇦", AED: "🇦🇪", KWD: "🇰🇼", QAR: "🇶🇦",
  BHD: "🇧🇭", OMR: "🇴🇲", JOD: "🇯🇴", LBP: "🇱🇧",
};

const METAL_BADGE: Record<string, { sym: string; cls: string }> = {
  "XAU/USD": { sym: "Au", cls: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30" },
  "XAG/USD": { sym: "Ag", cls: "bg-slate-300/20 text-slate-200 border-slate-300/30" },
  "XPT/USD": { sym: "Pt", cls: "bg-cyan-400/15 text-cyan-200 border-cyan-300/30" },
  "XPD/USD": { sym: "Pd", cls: "bg-indigo-400/15 text-indigo-200 border-indigo-300/30" },
  "COPPER": { sym: "Cu", cls: "bg-orange-500/20 text-orange-300 border-orange-400/30" },
  "DXY": { sym: "DXY", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
};

const TABS = [
  { id: "all", label: "Tous" },
  { id: "major", label: "Majeures" },
  { id: "cross", label: "Croisées" },
  { id: "exotic", label: "Exotiques" },
  { id: "metal", label: "Métaux & Indices" },
] as const;

const CAT_LABEL: Record<string, string> = {
  major: "Majeure", cross: "Croisée", exotic: "Exotique", metal: "Métal", index: "Indice",
};

function fmtPrice(p: number): string {
  if (p >= 500) return p.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 20) return p.toFixed(3);
  return p.toFixed(5);
}

function PairBadge({ row }: { row: FxRow }) {
  const metal = METAL_BADGE[row.pair];
  if (metal) {
    return (
      <span className={`inline-flex h-7 min-w-7 px-1.5 items-center justify-center rounded-full border text-[11px] font-bold ${metal.cls}`}>
        {metal.sym}
      </span>
    );
  }
  const [base, quote] = row.pair.split("/");
  return (
    <span className="text-lg leading-none tracking-tight">
      {FLAGS[base] || ""}{FLAGS[quote] || ""}
    </span>
  );
}

function Spark({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return <span className="text-slate-600 text-xs">—</span>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${max === min ? 18 : 34 - ((v - min) / (max - min)) * 30}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 36" className="w-24 h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={up ? "#34d399" : "#fb7185"} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function StatCard({ label, row, testId }: { label: string; row?: FxRow; testId: string }) {
  const up = (row?.change_pct ?? 0) >= 0;
  return (
    <div data-testid={testId} className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-md p-4">
      <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-slate-500">{label}</div>
      <div className="mt-1.5 text-xl font-black text-white">{row ? fmtPrice(row.price) : "…"}</div>
      {row && (
        <div className={`mt-0.5 inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-400" : "text-rose-400"}`}>
          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {up ? "+" : ""}{row.change_pct.toFixed(2)}%
        </div>
      )}
    </div>
  );
}

export default function Forex() {
  const [rows, setRows] = useState<FxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/v1/forex/rates");
      const j = await r.json();
      if (j.ok && Array.isArray(j.rows)) {
        setRows(j.rows);
        setLastUpdate(new Date());
      }
    } catch { /* réseau — on garde les données précédentes */ }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, []);

  const byPair = useMemo(() => new Map(rows.map((r) => [r.pair, r])), [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== "all") {
      list = tab === "metal" ? list.filter((r) => r.category === "metal" || r.category === "index") : list.filter((r) => r.category === tab);
    }
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.pair.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
    return list;
  }, [rows, tab, search]);

  const ups = rows.filter((r) => r.change_pct > 0).length;
  const downs = rows.filter((r) => r.change_pct < 0).length;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, major: 0, cross: 0, exotic: 0, metal: 0 };
    for (const r of rows) c[r.category === "index" ? "metal" : r.category] = (c[r.category === "index" ? "metal" : r.category] || 0) + 1;
    return c;
  }, [rows]);

  return (
    <div data-testid="forex-page" className="flex min-h-screen bg-[#0a0e17] text-white">
      <SEOHead
        title="Forex en Direct — 75+ Paires de Devises, Or, Argent & Métaux"
        description="Cours forex en temps réel : paires majeures (EUR/USD, GBP/USD, USD/JPY), croisées, exotiques, Or XAU/USD, Argent, Platine, Palladium et US Dollar Index. Données live gratuites."
        path="/forex"
      />
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col relative">
        <PageHeader
          icon={<DollarSign className="w-6 h-6" />}
          title="Forex, Or & Métaux"
          subtitle="Plus de 200 instruments en direct — majeures, croisées, exotiques, métaux précieux et US Dollar Index"
          accentColor="amber"
          steps={[
            { n: "1", title: "Choisissez une catégorie", desc: "Majeures, croisées, exotiques ou métaux précieux." },
            { n: "2", title: "Analysez la tendance", desc: "Prix live, variation du jour, plus haut/bas et mini-graphique." },
            { n: "3", title: "Tradez informé", desc: "Données rafraîchies automatiquement toutes les 60 secondes." },
          ]}
        />

        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Or · XAU/USD" row={byPair.get("XAU/USD")} testId="forex-stat-gold" />
            <StatCard label="Argent · XAG/USD" row={byPair.get("XAG/USD")} testId="forex-stat-silver" />
            <StatCard label="Dollar Index · DXY" row={byPair.get("DXY")} testId="forex-stat-dxy" />
            <StatCard label="EUR/USD" row={byPair.get("EUR/USD")} testId="forex-stat-eurusd" />
            <div data-testid="forex-stat-breadth" className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-md p-4">
              <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-slate-500">Marché</div>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold"><TrendingUp className="w-4 h-4" />{ups}</span>
                <span className="inline-flex items-center gap-1 text-rose-400 font-bold"><TrendingDown className="w-4 h-4" />{downs}</span>
              </div>
              <div className="mt-0.5 text-xs text-slate-500">hausse / baisse</div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1.5 rounded-full border border-white/8 bg-white/[0.03] p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  data-testid={`forex-tab-${t.id}`}
                  onClick={() => setTab(t.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    tab === t.id ? "bg-amber-400/15 text-amber-300 border border-amber-400/30" : "text-slate-400 hover:text-white border border-transparent"
                  }`}
                >
                  {t.label}{counts[t.id] ? <span className="ml-1.5 text-xs opacity-60">{counts[t.id]}</span> : null}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                data-testid="forex-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une paire…"
                className="w-full rounded-full border border-white/10 bg-white/[0.04] pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/40"
              />
            </div>
            <button
              data-testid="forex-refresh-btn"
              onClick={() => { setLoading(true); load(); }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MàJ ${lastUpdate.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}` : "Rafraîchir"}
            </button>
          </div>

          {/* Table */}
          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/8 bg-white/[0.02]">
            <table data-testid="forex-table" className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-[11px] font-mono uppercase tracking-[0.15em] text-slate-500">
                  <th className="px-4 py-3">Instrument</th>
                  <th className="px-4 py-3 hidden md:table-cell">Catégorie</th>
                  <th className="px-4 py-3 text-right">Prix</th>
                  <th className="px-4 py-3 text-right">Var. 24h</th>
                  <th className="px-4 py-3 text-right hidden lg:table-cell">Plus haut</th>
                  <th className="px-4 py-3 text-right hidden lg:table-cell">Plus bas</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Chargement des cours…</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Aucun instrument trouvé.</td></tr>
                )}
                {filtered.map((r) => {
                  const up = r.change_pct >= 0;
                  return (
                    <tr
                      key={r.pair}
                      data-testid={`forex-row-${r.pair.replace("/", "-")}`}
                      className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <PairBadge row={r} />
                          <div>
                            <div className="font-bold text-white">{r.pair}</div>
                            <div className="text-xs text-slate-500">{r.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-slate-400">
                          {CAT_LABEL[r.category]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-white">{fmtPrice(r.price)}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${up ? "text-emerald-400" : "text-rose-400"}`}>
                        {up ? "+" : ""}{r.change_pct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400 hidden lg:table-cell">{r.day_high ? fmtPrice(r.day_high) : "—"}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400 hidden lg:table-cell">{r.day_low ? fmtPrice(r.day_low) : "—"}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex justify-end"><Spark data={r.spark} up={up} /></div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-slate-600">
            Données indicatives fournies à titre informatif (source : marchés spot & futures). Métaux cotés via contrats futures les plus proches.
            Rafraîchissement automatique toutes les 60 secondes.
          </p>
        </div>

        <Footer />
      </main>
    </div>
  );
}
