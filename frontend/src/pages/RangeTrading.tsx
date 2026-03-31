import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import {
  TrendingUp, TrendingDown, RefreshCw, Filter,
  Shield, Target, ChevronDown, ChevronUp, Zap, Trophy, Trash2, BarChart3,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

/* ─── Types ─── */

interface RangeSetup {
  symbol: string;
  name: string;
  side: "LONG" | "SHORT";
  currentPrice: number;
  entry: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  rr: number;
  confidence: number;
  reason: string;
  rsi_m15: number | null;
  adx_m15: number | null;
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
  bb_width: number | null;
  ema8_h1: number | null;
  ema20_h1: number | null;
  h1_trend: string;
  source?: "client" | "server";
}

interface ServerRangeCall {
  id: number;
  symbol: string;
  side: "LONG" | "SHORT";
  entry_price: number;
  stop_loss: number;
  trailing_sl?: number | null;
  tp1: number;
  tp2: number;
  confidence: number;
  reason: string;
  rsi_m15: number | null;
  adx_m15: number | null;
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
  bb_width: number | null;
  ema8_h1: number | null;
  ema20_h1: number | null;
  h1_trend: string;
  rr: number | null;
  status: string;
  tp1_hit: boolean;
  tp2_hit: boolean;
  sl_hit: boolean;
  best_tp_reached: number;
  exit_price: number | null;
  profit_pct: number | null;
  created_at: string;
  resolved_at: string | null;
  expires_at: string | null;
}

/* ─── Helpers ─── */

function formatPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(2);
  if (p >= 0.01) return p.toFixed(4);
  return p.toFixed(6);
}

function getApiBase(): string {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3001";
  }
  return "";
}

/* ─── Main Component ─── */

export default function RangeTrading() {
  const [setups, setSetups] = useState<RangeSetup[]>([]);
  const [serverCalls, setServerCalls] = useState<ServerRangeCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [filterSide, setFilterSide] = useState<"ALL" | "LONG" | "SHORT">("ALL");
  const [minConfidence, setMinConfidence] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchServerCalls = useCallback(async () => {
    try {
      const base = getApiBase();
      const resp = await fetch(`${base}/api/v1/range-calls?status=active&limit=50`);
      if (resp.ok) {
        const data: ServerRangeCall[] = await resp.json();
        setServerCalls(data);

        // Convert server calls to RangeSetup format for display
        const serverSetups: RangeSetup[] = data
          .filter(c => c.status === "active")
          .map(c => ({
            symbol: c.symbol,
            name: c.symbol.replace("USDT", ""),
            side: c.side,
            currentPrice: c.entry_price,
            entry: c.entry_price,
            stopLoss: c.stop_loss,
            tp1: c.tp1,
            tp2: c.tp2,
            rr: c.rr || 1,
            confidence: c.confidence,
            reason: c.reason || "",
            rsi_m15: c.rsi_m15,
            adx_m15: c.adx_m15,
            bb_upper: c.bb_upper,
            bb_middle: c.bb_middle,
            bb_lower: c.bb_lower,
            bb_width: c.bb_width,
            ema8_h1: c.ema8_h1,
            ema20_h1: c.ema20_h1,
            h1_trend: c.h1_trend || "neutral",
            source: "server" as const,
          }));
        setSetups(serverSetups);
      }
    } catch (err) {
      console.warn("[RangeTrading] Failed to fetch server calls:", err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchServerCalls();
    } catch (err) {
      setError("Erreur lors du chargement des signaux range.");
    } finally {
      setLoading(false);
    }
  }, [fetchServerCalls]);

  useEffect(() => {
    refreshAll();
    refreshTimerRef.current = setInterval(refreshAll, 60000);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [refreshAll]);

  const filteredSetups = setups
    .filter(s => filterSide === "ALL" || s.side === filterSide)
    .filter(s => s.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence);

  const longCount = setups.filter(s => s.side === "LONG").length;
  const shortCount = setups.filter(s => s.side === "SHORT").length;

  return (
    <div className="flex min-h-screen bg-[#0A0E1A]">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <PageHeader
            title="Range Trading"
            subtitle="Signaux de trading en range — Bollinger Bands + RSI + ADX"
            icon={<BarChart3 className="w-7 h-7 text-blue-400" />}
          />

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{setups.length}</div>
              <div className="text-xs text-gray-400">Signaux Actifs</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">{longCount}</div>
              <div className="text-xs text-gray-400">LONG</div>
            </div>
            <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{shortCount}</div>
              <div className="text-xs text-gray-400">SHORT</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">M15</div>
              <div className="text-xs text-gray-400">Timeframe</div>
            </div>
            <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
              <Link to="/range/performance" className="block hover:opacity-80 transition-opacity">
                <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="text-xs text-amber-400 font-semibold">Performance →</div>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-all"
            >
              <Filter className="w-4 h-4" />
              Filtres
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={refreshAll}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Rafraîchir
            </button>

            <div className="flex gap-1 ml-auto">
              {(["ALL", "LONG", "SHORT"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterSide(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterSide === f
                      ? f === "LONG" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : f === "SHORT" ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {showFilters && (
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Confiance minimum: {minConfidence}%</label>
                <input
                  type="range" min={0} max={95} step={5}
                  value={minConfidence}
                  onChange={e => setMinConfidence(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && setups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-4" />
              <p className="text-gray-400">Analyse des marchés en cours...</p>
            </div>
          )}

          {/* No signals */}
          {!loading && filteredSetups.length === 0 && (
            <div className="text-center py-20">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">Aucun signal range détecté</h3>
              <p className="text-sm text-gray-500">
                Les signaux apparaissent quand le marché est en range (ADX &lt; 25) avec des conditions BB + RSI favorables.
              </p>
            </div>
          )}

          {/* Signal Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredSetups.map((setup, idx) => {
              const isLong = setup.side === "LONG";
              const isExpanded = expandedCard === `${setup.symbol}-${idx}`;
              const pctTP1 = ((setup.tp1 - setup.entry) / setup.entry * 100);
              const pctTP2 = ((setup.tp2 - setup.entry) / setup.entry * 100);
              const pctSL = ((setup.stopLoss - setup.entry) / setup.entry * 100);

              return (
                <div
                  key={`${setup.symbol}-${idx}`}
                  className={`relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${
                    isLong
                      ? "bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border-emerald-500/20"
                      : "bg-gradient-to-br from-red-500/5 to-blue-500/5 border-red-500/20"
                  }`}
                >
                  {/* Header */}
                  <div className="p-4 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isLong ? "bg-emerald-500/20" : "bg-red-500/20"
                        }`}>
                          {isLong ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                        </div>
                        <div>
                          <span className="font-bold text-white">{setup.name}</span>
                          <span className="text-xs text-gray-500 ml-1">{setup.symbol}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isLong ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        }`}>
                          {setup.side}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Confiance</div>
                        <div className={`text-lg font-bold ${
                          setup.confidence >= 80 ? "text-blue-400" : setup.confidence >= 60 ? "text-amber-400" : "text-gray-400"
                        }`}>
                          {setup.confidence}%
                        </div>
                      </div>
                    </div>

                    {/* Price & Targets */}
                    <div className="grid grid-cols-4 gap-2 text-center mt-3">
                      <div className="bg-white/[0.03] rounded-lg p-2">
                        <div className="text-[10px] text-gray-500">Entry</div>
                        <div className="text-xs font-semibold text-white">${formatPrice(setup.entry)}</div>
                      </div>
                      <div className="bg-emerald-500/5 rounded-lg p-2">
                        <div className="text-[10px] text-gray-500">TP1 (Mid)</div>
                        <div className="text-xs font-semibold text-emerald-400">${formatPrice(setup.tp1)}</div>
                        <div className="text-[9px] text-emerald-400/70">{pctTP1 >= 0 ? "+" : ""}{pctTP1.toFixed(2)}%</div>
                      </div>
                      <div className="bg-blue-500/5 rounded-lg p-2">
                        <div className="text-[10px] text-gray-500">TP2 (Opp)</div>
                        <div className="text-xs font-semibold text-blue-400">${formatPrice(setup.tp2)}</div>
                        <div className="text-[9px] text-blue-400/70">{pctTP2 >= 0 ? "+" : ""}{pctTP2.toFixed(2)}%</div>
                      </div>
                      <div className="bg-red-500/5 rounded-lg p-2">
                        <div className="text-[10px] text-gray-500">SL</div>
                        <div className="text-xs font-semibold text-red-400">${formatPrice(setup.stopLoss)}</div>
                        <div className="text-[9px] text-red-400/70">{pctSL >= 0 ? "+" : ""}{pctSL.toFixed(2)}%</div>
                      </div>
                    </div>

                    {/* R:R and indicators */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-400">R:R <span className="text-white font-semibold">1:{setup.rr}</span></span>
                        {setup.adx_m15 != null && (
                          <span className="text-gray-400">ADX <span className="text-blue-400 font-semibold">{setup.adx_m15.toFixed(1)}</span></span>
                        )}
                        {setup.rsi_m15 != null && (
                          <span className="text-gray-400">RSI <span className={`font-semibold ${
                            setup.rsi_m15 < 35 ? "text-emerald-400" : setup.rsi_m15 > 65 ? "text-red-400" : "text-gray-300"
                          }`}>{setup.rsi_m15.toFixed(1)}</span></span>
                        )}
                      </div>
                      <button
                        onClick={() => setExpandedCard(isExpanded ? null : `${setup.symbol}-${idx}`)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {isExpanded ? "Moins" : "Détails"}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                      {/* Bollinger Bands */}
                      <div>
                        <div className="text-xs font-semibold text-blue-400 mb-2">📊 Bollinger Bands (20, 2)</div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="bg-red-500/5 rounded p-1.5">
                            <div className="text-[9px] text-gray-500">Upper</div>
                            <div className="text-[10px] font-semibold text-red-400">{setup.bb_upper ? "$" + formatPrice(setup.bb_upper) : "N/A"}</div>
                          </div>
                          <div className="bg-white/[0.03] rounded p-1.5">
                            <div className="text-[9px] text-gray-500">Middle</div>
                            <div className="text-[10px] font-semibold text-gray-300">{setup.bb_middle ? "$" + formatPrice(setup.bb_middle) : "N/A"}</div>
                          </div>
                          <div className="bg-emerald-500/5 rounded p-1.5">
                            <div className="text-[9px] text-gray-500">Lower</div>
                            <div className="text-[10px] font-semibold text-emerald-400">{setup.bb_lower ? "$" + formatPrice(setup.bb_lower) : "N/A"}</div>
                          </div>
                          <div className="bg-blue-500/5 rounded p-1.5">
                            <div className="text-[9px] text-gray-500">Width</div>
                            <div className="text-[10px] font-semibold text-blue-400">{setup.bb_width ? (setup.bb_width * 100).toFixed(2) + "%" : "N/A"}</div>
                          </div>
                        </div>
                      </div>

                      {/* H1 Trend */}
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-gray-400">Tendance H1:</span>
                        <span className={`font-semibold ${
                          setup.h1_trend === "bullish" ? "text-emerald-400" : setup.h1_trend === "bearish" ? "text-red-400" : "text-gray-400"
                        }`}>
                          {setup.h1_trend === "bullish" ? "🟢 Haussière" : setup.h1_trend === "bearish" ? "🔴 Baissière" : "⚪ Neutre"}
                        </span>
                        {setup.ema8_h1 && setup.ema20_h1 && (
                          <span className="text-gray-500">
                            EMA8: ${formatPrice(setup.ema8_h1)} / EMA20: ${formatPrice(setup.ema20_h1)}
                          </span>
                        )}
                      </div>

                      {/* Reason */}
                      <div className="bg-white/[0.02] rounded-lg p-3">
                        <div className="text-[10px] text-gray-500 mb-1">📋 Raison</div>
                        <div className="text-xs text-gray-300 leading-relaxed">
                          {setup.reason.split(" | ").map((r, i) => (
                            <div key={i} className="mb-0.5">• {r}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Strategy Info */}
          <div className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-blue-400 mb-3">📊 Stratégie Range Trading</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div>
                <div className="font-semibold text-white mb-1">Indicateurs</div>
                <ul className="space-y-1 text-xs">
                  <li>• Bollinger Bands (20, 2)</li>
                  <li>• RSI (14) sur M15</li>
                  <li>• ADX (14) &lt; 25 = Range</li>
                  <li>• EMA 8/20 sur H1 (biais)</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-white mb-1">Conditions</div>
                <ul className="space-y-1 text-xs">
                  <li>🟢 LONG: Prix → BB inf + RSI &lt; 35</li>
                  <li>🔴 SHORT: Prix → BB sup + RSI &gt; 65</li>
                  <li>🎯 TP1: BB médiane</li>
                  <li>🎯 TP2: BB opposée</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-white mb-1">Gestion du risque</div>
                <ul className="space-y-1 text-xs">
                  <li>• SL: 0.5-1.5% au-delà du BB</li>
                  <li>• Trailing SL → breakeven après TP1</li>
                  <li>• Expiration: 2 heures</li>
                  <li>• Max 10 trades actifs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}