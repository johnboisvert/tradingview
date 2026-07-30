// Scanner IA — signaux envoyés par l'agent Claude × TradingView (webhook externe)
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { Bot, TrendingUp, TrendingDown, Activity, Trophy, Target } from "lucide-react";

interface ExtSignal {
  id: number;
  symbol: string;
  side: "LONG" | "SHORT";
  entry_price: number;
  stop_loss: number;
  tp1: number;
  tp2: number | null;
  tp3: number | null;
  timeframe: string | null;
  note: string | null;
  status: string;
  tp1_hit: boolean;
  tp2_hit: boolean;
  tp3_hit: boolean;
  sl_hit: boolean;
  live_pnl_pct: number | null;
  profit_pct: number | null;
  created_at: string;
}

interface ExtStats {
  total_calls: number;
  active_calls: number;
  resolved_calls: number;
  expired_calls: number;
  win_rate: number;
  tp2_rate: number;
  avg_profit_pct: number;
}

const fmt = (p: number | null | undefined) =>
  p == null ? "—" : p >= 500 ? p.toLocaleString("fr-CA", { maximumFractionDigits: 2 }) : p >= 1 ? p.toFixed(3) : p.toPrecision(4);

export default function ScannerIA() {
  const [signals, setSignals] = useState<ExtSignal[]>([]);
  const [stats, setStats] = useState<ExtStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [sig, st] = await Promise.all([
        fetch("/api/v1/external-signals?limit=100").then((r) => r.json()),
        fetch("/api/v1/external-signals/stats").then((r) => r.json()),
      ]);
      setSignals(sig);
      setStats(st);
    } catch { /* réseau */ }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, []);

  const active = signals.filter((s) => s.status === "active");
  const closed = signals.filter((s) => s.status !== "active").slice(0, 20);

  return (
    <div data-testid="scanner-ia-page" className="flex min-h-screen bg-[#0a0e17] text-white">
      <SEOHead
        title="Scanner IA — Signaux d'analyse autonome multi-timeframes"
        description="Signaux LONG/SHORT détectés par notre scanner IA connecté à TradingView : analyse autonome de 60+ cryptos, entrées, stops et objectifs suivis automatiquement."
        path="/scanner-ia"
      />
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col relative">
        <PageHeader
          icon={<Bot className="w-6 h-6" />}
          title="Scanner IA"
          subtitle="Signaux détectés par notre agent IA connecté à TradingView — analyse autonome de 60+ cryptos, toutes les 4 heures"
          accentColor="violet"
          steps={[
            { n: "1", title: "L'IA scanne en continu", desc: "60+ cryptos analysées toutes les 4h : structure, supports/résistances, momentum multi-timeframes." },
            { n: "2", title: "Signal seulement si vrai setup", desc: "Aucun signal forcé — l'agent n'alerte que lorsque toutes ses conditions sont réunies." },
            { n: "3", title: "Suivi automatique", desc: "Entrée, SL, TP1/TP2/TP3 vérifiés toutes les 5 minutes, stop au breakeven après TP1." },
          ]}
        />

        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Signaux trackés", value: stats ? `${stats.total_calls}` : "…", icon: Activity, accent: "text-violet-300" },
              { label: "Actifs", value: stats ? `${stats.active_calls}` : "…", icon: Bot, accent: "text-cyan-300" },
              { label: "Winrate (TP1)", value: stats ? `${stats.win_rate}%` : "…", icon: Trophy, accent: "text-emerald-300" },
              { label: "Profit moyen", value: stats ? `${stats.avg_profit_pct >= 0 ? "+" : ""}${stats.avg_profit_pct}%` : "…", icon: Target, accent: "text-teal-300" },
            ].map((s) => (
              <div key={s.label} data-testid={`scanner-stat-${s.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <s.icon className={`h-4 w-4 ${s.accent}`} />
                <div className="mt-2 text-2xl font-black text-white">{s.value}</div>
                <div className="mt-0.5 text-[11px] font-mono uppercase tracking-[0.15em] text-white/40">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Signaux actifs */}
          <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">Signaux actifs ({active.length})</h2>
          {!loading && active.length === 0 && (
            <p data-testid="scanner-empty-active" className="mt-3 text-sm text-white/40">
              Aucun signal actif — le scanner n'alerte que lorsqu'un vrai setup se présente. Revenez bientôt.
            </p>
          )}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {active.map((s) => {
              const up = (s.live_pnl_pct ?? 0) >= 0;
              return (
                <div key={s.id} data-testid={`scanner-active-${s.id}`} className="rounded-2xl border border-violet-400/15 bg-[#0d1526] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{s.symbol.replace("USDT", "/USDT")}</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold ${s.side === "LONG" ? "text-emerald-300" : "text-rose-300"}`}>
                      {s.side === "LONG" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {s.side}{s.timeframe ? ` · ${s.timeframe}` : ""}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs font-mono text-white/50">
                    <span>Entrée ${fmt(s.entry_price)}</span>
                    <span className="text-right">SL ${fmt(s.stop_loss)}</span>
                    <span>TP1 ${fmt(s.tp1)}</span>
                    <span className="text-right">{s.tp3 ? `TP3 $${fmt(s.tp3)}` : s.tp2 ? `TP2 $${fmt(s.tp2)}` : ""}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-sm font-mono font-black ${up ? "text-emerald-300" : "text-rose-300"}`}>
                      {s.live_pnl_pct == null ? "—" : `${up ? "+" : ""}${s.live_pnl_pct.toFixed(2)}%`}
                    </span>
                    {s.tp1_hit && (
                      <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-300">TP1 ✓ · stop au BE</span>
                    )}
                  </div>
                  {s.note && <div className="mt-2 text-[11px] text-white/35 leading-relaxed">{s.note}</div>}
                  <div className="mt-1 text-[11px] text-white/30">{new Date(s.created_at).toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" })}</div>
                </div>
              );
            })}
          </div>

          {/* Historique */}
          <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">Derniers signaux clôturés</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-white/8 bg-white/[0.02]">
            <table data-testid="scanner-closed-table" className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-[11px] font-mono uppercase tracking-[0.15em] text-white/40">
                  <th className="px-4 py-3">Crypto</th>
                  <th className="px-4 py-3">Sens</th>
                  <th className="px-4 py-3 text-right">Entrée</th>
                  <th className="px-4 py-3">Résultat</th>
                  <th className="px-4 py-3 text-right">PnL</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {closed.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-white/40 text-sm">Aucun signal clôturé pour l'instant — les résultats s'afficheront automatiquement.</td></tr>
                )}
                {closed.map((s) => {
                  const outcome = s.tp3_hit ? "TP3 🎯" : s.tp2_hit ? "TP2 ✓" : s.tp1_hit ? (s.status === "expired" ? "TP1 + Expiré" : "TP1 + BE") : s.sl_hit ? "Stop Loss" : "Expiré";
                  const win = (s.profit_pct ?? 0) >= 0;
                  return (
                    <tr key={s.id} className="border-b border-white/[0.04]">
                      <td className="px-4 py-3 font-bold text-white">{s.symbol.replace("USDT", "/USDT")}</td>
                      <td className={`px-4 py-3 text-xs font-bold ${s.side === "LONG" ? "text-emerald-300" : "text-rose-300"}`}>{s.side}</td>
                      <td className="px-4 py-3 text-right font-mono text-white/70">${fmt(s.entry_price)}</td>
                      <td className="px-4 py-3 text-xs text-white/60">{outcome}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${win ? "text-emerald-300" : "text-rose-300"}`}>
                        {s.profit_pct == null ? "—" : `${win ? "+" : ""}${s.profit_pct.toFixed(2)}%`}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-white/40 hidden sm:table-cell">{new Date(s.created_at).toLocaleDateString("fr-CA")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-white/30 leading-relaxed max-w-3xl">
            Win = TP1 atteint (dès TP1, le stop est déplacé au point d'entrée). PnL basé sur des sorties partielles
            (50 % TP1, 25 % TP2, 25 % TP3). Les performances passées ne garantissent pas les résultats futurs. Ceci
            n'est pas un conseil financier.
          </p>
        </div>
        <Footer />
      </main>
    </div>
  );
}
