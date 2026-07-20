// Performance des Signaux — page publique de transparence (preuve sociale)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import {
  Trophy, ShieldCheck, TrendingUp, TrendingDown, Target, Activity,
  ArrowRight, Sparkles, BarChart3, Lock, CheckCircle2, XCircle, MinusCircle, Clock,
  Share2, Link2,
} from "lucide-react";

interface Stats {
  total_calls: number;
  active_calls: number;
  win_rate: number;
  tp1_rate: number;
  tp2_rate: number;
  tp3_rate: number;
  avg_profit_pct: number;
  long_win_rate: number;
  short_win_rate: number;
  long_total: number;
  short_total: number;
  confidence_buckets: Record<string, { win_rate: number; total: number }>;
  weekly_win_rate: { week: string; wins: number; total: number; win_rate: number }[];
}

interface TradeCall {
  id: number;
  symbol: string;
  side: "LONG" | "SHORT";
  entry_price: number;
  exit_price: number | null;
  profit_pct: number | null;
  confidence: number;
  status: string;
  tp1_hit: boolean;
  tp2_hit: boolean;
  tp3_hit: boolean;
  sl_hit: boolean;
  best_tp_reached: number;
  created_at: string;
  engine?: string | null;
}

const V7_DATE = new Date("2026-07-20T21:00:00Z");

function fmtPrice(p: number) {
  if (p >= 1000) return p.toLocaleString("fr-CA", { maximumFractionDigits: 0 });
  if (p >= 1) return p.toFixed(3);
  return p.toPrecision(4);
}

function outcome(c: TradeCall): { label: string; cls: string; icon: typeof CheckCircle2 } {
  if (c.best_tp_reached >= 1 && c.sl_hit)
    return { label: `TP${c.best_tp_reached} + BE`, cls: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300", icon: CheckCircle2 };
  if (c.best_tp_reached >= 1)
    return { label: `TP${c.best_tp_reached}`, cls: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300", icon: CheckCircle2 };
  if (c.sl_hit) return { label: "SL", cls: "border-rose-500/30 bg-rose-500/15 text-rose-300", icon: XCircle };
  return { label: "Expiré", cls: "border-slate-500/30 bg-slate-500/15 text-slate-400", icon: MinusCircle };
}

function effectiveProfit(c: TradeCall): number | null {
  if (c.tp1_hit && c.sl_hit && (c.profit_pct == null || c.profit_pct < 0)) return 0;
  return c.profit_pct;
}

export default function SignalsPerformance() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [scalpStats, setScalpStats] = useState<Stats | null>(null);
  const [rangeStats, setRangeStats] = useState<Stats | null>(null);
  const [trades, setTrades] = useState<TradeCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [s, sc, rg, tc] = await Promise.all([
          fetch("/api/v1/trade-calls/stats").then((r) => r.json()),
          fetch("/api/v1/scalp-calls/stats").then((r) => r.json()).catch(() => null),
          fetch("/api/v1/range-calls/stats").then((r) => r.json()).catch(() => null),
          fetch("/api/v1/trade-calls?limit=300").then((r) => r.json()),
        ]);
        setStats(s);
        setScalpStats(sc);
        setRangeStats(rg);
        const closed = (tc as TradeCall[])
          .filter((c) => c.status !== "active")
          .slice(0, 15);
        setTrades(closed);
        setLastUpdate(new Date());
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    fetchAll();
    const interval = setInterval(fetchAll, 60_000);
    return () => clearInterval(interval);
  }, []);

  const hc = stats?.confidence_buckets?.[">80%"];
  const totalSignals = (stats?.total_calls || 0) + (scalpStats?.total_calls || 0) + (rangeStats?.total_calls || 0);
  const weeks = (stats?.weekly_win_rate || []).slice(-12);
  const bestWeek = weeks.reduce((b, w) => (w.total >= 3 && w.win_rate > (b?.win_rate ?? -1) ? w : b), null as null | Stats["weekly_win_rate"][0]);

  const shareText = `📊 ${hc?.win_rate ?? 0}% de winrate sur les signaux crypto haute confiance — résultats trackés automatiquement et 100% transparents (${totalSignals} signaux) 👇`;
  const shareUrl = "https://www.cryptoia.ca/performance";

  function shareTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,width=600,height=500"
    );
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard indisponible */
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0a0e17] text-white">
      <SEOHead
        title="Performance de nos Signaux Crypto — Résultats Réels & Vérifiables"
        description="Transparence totale : chaque signal de trading CryptoIA est tracké automatiquement. Winrate réel, taux TP1/TP2/TP3, performance par niveau de confiance IA et historique complet des trades."
        path="/performance"
      />
      <Sidebar />

      <main className="flex-1 lg:ml-64 flex flex-col relative">
        <PageHeader />

        {/* ── Hero ─────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.16),_transparent_55%)]" />
          <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
          <div className="noise-overlay" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="hero-item inline-flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 backdrop-blur-md px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Transparence totale — tracké automatiquement, non modifiable
              </span>
              <span data-testid="live-badge" className="inline-flex items-center gap-2 rounded-full border border-rose-400/25 bg-rose-500/10 backdrop-blur-md px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-rose-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-400" />
                </span>
                En direct
                {lastUpdate && <span className="text-rose-200/50 normal-case tracking-normal">· MàJ {lastUpdate.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}</span>}
              </span>
            </div>
            <h1 className="hero-item [animation-delay:120ms] mt-6 text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.02]">
              <span className="text-white">Performance</span>{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
                des Signaux
              </span>
            </h1>
            <p className="hero-item [animation-delay:240ms] mt-6 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
              La plupart des services cachent leurs résultats. Nous, on affiche tout : chaque signal est
              enregistré à son émission et son résultat est calculé automatiquement par nos serveurs.
              Aucune retouche possible.
            </p>

            {/* Stats clés */}
            <div className="hero-item [animation-delay:360ms] mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
              {[
                { label: "Signaux trackés", value: loading ? "…" : `${totalSignals}`, icon: Activity, accent: "text-cyan-300" },
                { label: "Winrate haute confiance*", value: loading ? "…" : `${hc?.win_rate ?? 0}%`, icon: Trophy, accent: "text-emerald-300" },
                { label: "Taux TP2 atteint", value: loading ? "…" : `${stats?.tp2_rate ?? 0}%`, icon: Target, accent: "text-teal-300" },
                { label: "Meilleure semaine", value: loading ? "…" : bestWeek ? `${bestWeek.win_rate}%` : "—", icon: TrendingUp, accent: "text-lime-300" },
              ].map((s) => (
                <div key={s.label} data-testid={`perf-stat-${s.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="rounded-2xl border border-white/10 bg-[#0d1526]/80 backdrop-blur-sm p-5">
                  <s.icon className={`h-4 w-4 ${s.accent}`} />
                  <div className="mt-3 text-3xl font-black tracking-tighter text-white">{s.value}</div>
                  <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.15em] text-white/40">{s.label}</div>
                </div>
              ))}
            </div>
            <p className="hero-item [animation-delay:480ms] mt-4 text-xs text-white/30">
              * Signaux avec score de confiance IA supérieur à 80 % ({hc?.total ?? 0} trades clôturés). Win = TP1 atteint.
            </p>

            {/* Partage */}
            <div className="hero-item [animation-delay:560ms] mt-6 flex flex-wrap items-center gap-3">
              <span className="text-xs text-white/40">Partagez ces résultats :</span>
              <button
                type="button"
                data-testid="share-twitter-btn"
                onClick={shareTwitter}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white hover:bg-white/[0.1] transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
                Partager sur X
              </button>
              <button
                type="button"
                data-testid="share-copy-btn"
                onClick={copyShareLink}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${copied ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300" : "border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.1]"}`}
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                {copied ? "Copié — collez sur Discord !" : "Copier pour Discord / Telegram"}
              </button>
            </div>
          </div>
        </section>

        {/* ── Confiance IA ─────────────────────────────── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200">
                <Sparkles className="h-3 w-3" />
                La preuve que l'IA fonctionne
              </div>
              <h2 className="mt-4 text-2xl sm:text-3xl font-black tracking-tighter text-white">
                Plus le score de confiance est élevé,{" "}
                <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">plus ça gagne</span>
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
                Chaque signal reçoit un score de confiance calculé par notre IA (momentum, volume, structure,
                confluences). Les données le prouvent : le winrate grimpe avec le score. C'est exactement
                pour ça que nos abonnés se concentrent sur les signaux à haute confiance.
              </p>
              <div className="mt-6 space-y-4" data-testid="confidence-buckets">
                {Object.entries(stats?.confidence_buckets || {}).map(([bucket, b]) => (
                  <div key={bucket}>
                    <div className="flex items-center justify-between text-xs font-mono text-white/50">
                      <span>Confiance {bucket}</span>
                      <span className="text-white/80 font-bold">{b.total > 0 ? `${b.win_rate}% winrate` : "—"} <span className="text-white/30">({b.total} trades)</span></span>
                    </div>
                    <div className="mt-1.5 h-2.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-1000"
                        style={{ width: `${Math.min(b.win_rate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Winrate hebdo */}
            <div className="rounded-3xl border border-white/10 bg-[#0d1526] p-7">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
                <BarChart3 className="h-3.5 w-3.5" />
                Winrate hebdomadaire
              </div>
              <div className="mt-6 flex items-end gap-2 h-44" data-testid="weekly-chart">
                {weeks.length === 0 && <div className="text-sm text-white/30 m-auto">{loading ? "Chargement…" : "Données en construction"}</div>}
                {weeks.map((w) => (
                  <div key={w.week} className="flex-1 flex flex-col items-center gap-1.5 group" title={`${w.week} : ${w.win_rate}% (${w.wins}/${w.total})`}>
                    <span className="text-[10px] font-mono text-white/50 opacity-0 group-hover:opacity-100 transition-opacity">{w.win_rate}%</span>
                    <div
                      className={`w-full rounded-t-md transition-all duration-700 ${w.win_rate >= 50 ? "bg-gradient-to-t from-emerald-500/60 to-emerald-400" : "bg-gradient-to-t from-slate-600/50 to-slate-500"}`}
                      style={{ height: `${Math.max(w.win_rate, 4)}%` }}
                    />
                    <span className="text-[9px] font-mono text-white/25 rotate-0">{w.week.split("-W")[1]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-white/40">
                <span>12 dernières semaines (n° de semaine)</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> ≥ 50 %</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── LONG vs SHORT + moteurs ──────────────────── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-white/10 bg-[#0d1526] p-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">Moteur Swing</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{stats?.total_calls ?? "…"}</span>
                <span className="text-xs text-white/40">signaux</span>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between"><span className="inline-flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-emerald-300" /> LONG</span><span className="text-white/70">{stats?.long_win_rate ?? 0}% ({stats?.long_total ?? 0})</span></div>
                <div className="flex justify-between"><span className="inline-flex items-center gap-1.5"><TrendingDown className="h-3 w-3 text-rose-300" /> SHORT</span><span className="text-white/70">{stats?.short_win_rate ?? 0}% ({stats?.short_total ?? 0})</span></div>
                <div className="flex justify-between"><span>TP3 atteint</span><span className="text-white/70">{stats?.tp3_rate ?? 0}%</span></div>
              </div>
            </div>
            {[
              { name: "Moteur Scalp", s: scalpStats, desc: "Signaux rapides M5/H1" },
              { name: "Moteur Range", s: rangeStats, desc: "Achats en zone de range" },
            ].map((m) => (
              <div key={m.name} className="rounded-2xl border border-white/10 bg-[#0d1526] p-6">
                <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">{m.name}</div>
                {m.s && m.s.total_calls > 0 ? (
                  <>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">{m.s.total_calls}</span>
                      <span className="text-xs text-white/40">signaux</span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between"><span>Winrate</span><span className="text-white/70">{m.s.win_rate}%</span></div>
                      <div className="flex justify-between"><span>TP2 atteint</span><span className="text-white/70">{m.s.tp2_rate}%</span></div>
                    </div>
                  </>
                ) : (
                  <div className="mt-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-200">
                      <Clock className="h-3 w-3" /> Nouveau moteur
                    </div>
                    <p className="mt-3 text-xs text-slate-500 leading-relaxed">{m.desc} — historique public en construction, les résultats s'afficheront ici automatiquement.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Derniers trades ──────────────────────────── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-white">
            Derniers signaux <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">clôturés</span>
          </h2>
          <p className="mt-2 text-sm text-slate-500">Résultats bruts, dans l'ordre — les pertes aussi. C'est ça, la transparence.</p>
          <div data-testid="v7-notice" className="mt-4 flex items-start gap-3 rounded-2xl border border-cyan-400/25 bg-cyan-500/[0.07] p-4">
            <Sparkles className="shrink-0 mt-0.5 h-4 w-4 text-cyan-300" />
            <p className="text-sm text-cyan-100/80 leading-relaxed">
              <strong className="text-cyan-200">Moteur v7 déployé le 20 juillet 2026</strong> — recalibrage complet basé
              sur l'analyse de l'historique : anti pump-chasing, filtre de tendance Bitcoin, ratio TP/SL corrigé et
              convergence supports/résistances renforcée. Les signaux du nouveau moteur portent le badge{" "}
              <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-black text-cyan-300">v7</span>.
              L'historique ci-dessous inclut l'ancien moteur.
            </p>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-[#0d1526] overflow-hidden" data-testid="recent-trades-table">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[11px] font-mono uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Paire</th>
                    <th className="px-4 py-3">Direction</th>
                    <th className="px-4 py-3">Confiance IA</th>
                    <th className="px-4 py-3">Entrée</th>
                    <th className="px-4 py-3">Résultat</th>
                    <th className="px-4 py-3 text-right">PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-white/30">Chargement…</td></tr>
                  )}
                  {!loading && trades.map((c) => {
                    const o = outcome(c);
                    const p = effectiveProfit(c);
                    return (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(c.created_at).toLocaleDateString("fr-CA")}</td>
                        <td className="px-4 py-3 font-bold text-white">
                          {c.symbol.replace("USDT", "/USDT")}
                          {(c.engine === "v7" || new Date(c.created_at) >= V7_DATE) && (
                            <span className="ml-2 inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-black text-cyan-300">v7</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold ${c.side === "LONG" ? "text-emerald-300" : "text-rose-300"}`}>
                            {c.side === "LONG" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {c.side}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-xs ${c.confidence >= 80 ? "text-emerald-300" : "text-white/50"}`}>{c.confidence}%</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-white/60">${fmtPrice(c.entry_price)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${o.cls}`}>
                            <o.icon className="h-3 w-3" />
                            {o.label}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-mono text-sm font-bold ${p == null ? "text-white/30" : p > 0 ? "text-emerald-300" : p < 0 ? "text-rose-300" : "text-white/50"}`}>
                          {p == null ? "—" : `${p > 0 ? "+" : ""}${p.toFixed(2)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-4 text-xs text-white/30 leading-relaxed max-w-3xl">
            Win = TP1 atteint (dès TP1, le stop est déplacé au point d'entrée : le trade ne peut plus perdre).
            Les performances passées ne garantissent pas les résultats futurs. Ceci n'est pas un conseil financier.
          </p>
        </section>

        {/* ── CTA ──────────────────────────────────────── */}
        <section className="relative border-t border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(16,185,129,0.12),_transparent_60%)]" />
          <div className="noise-overlay" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter">
              <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
                Recevez ces signaux en direct
              </span>
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-base text-slate-400 leading-relaxed">
              Alertes Telegram en temps réel avec entrée, stop loss, TP1-TP3 et score de confiance IA.
              Concentrez-vous sur les signaux haute confiance.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/abonnements"
                data-testid="performance-cta-subscribe"
                className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-3.5 text-sm font-bold text-[#0a0e17] shadow-lg shadow-emerald-500/20 transition-transform duration-300 hover:-translate-y-0.5"
              >
                Voir les abonnements
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/magic-strategy"
                data-testid="performance-cta-indicators"
                className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-8 py-3.5 text-sm font-bold text-white hover:bg-white/[0.1] transition-colors"
              >
                <Lock className="h-4 w-4" />
                Nos 9 indicateurs TradingView
              </Link>
            </div>
          </div>
        </section>

        <div className="flex-1" />
        <Footer />
      </main>
    </div>
  );
}
