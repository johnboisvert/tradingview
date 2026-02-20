import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import {
  BookOpen, Plus, TrendingUp, TrendingDown, Target, Award,
  Trash2, BarChart3, Calendar, DollarSign, Brain, ChevronDown,
  ChevronUp, Smile, Meh, Frown, CheckCircle, XCircle, Clock,
  Zap, Filter, Download
} from "lucide-react";

interface Trade {
  id: string;
  date: string;
  crypto: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  emotion: "calm" | "fomo" | "fear" | "greedy" | "confident";
  strategy: string;
  notes: string;
  result: "win" | "loss" | "breakeven";
  timeframe: string;
  riskReward: number;
}

const EMOTION_CONFIG = {
  calm: { label: "Calme", icon: Smile, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  confident: { label: "Confiant", icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  fomo: { label: "FOMO", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  greedy: { label: "Avidité", icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  fear: { label: "Peur", icon: Frown, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

const STRATEGIES = ["Breakout", "Retracement", "Scalping", "Swing", "DCA", "Momentum", "Support/Résistance", "Autre"];
const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1j", "1sem"];

const SAMPLE_TRADES: Trade[] = [
  { id: "1", date: "2026-02-18", crypto: "Bitcoin", symbol: "BTC", direction: "LONG", entryPrice: 96500, exitPrice: 99200, size: 0.1, pnl: 270, pnlPercent: 2.8, emotion: "calm", strategy: "Breakout", notes: "Cassure du niveau 96k avec volume fort", result: "win", timeframe: "4h", riskReward: 2.5 },
  { id: "2", date: "2026-02-16", crypto: "Ethereum", symbol: "ETH", direction: "LONG", entryPrice: 2750, exitPrice: 2620, size: 1.5, pnl: -195, pnlPercent: -4.7, emotion: "fomo", strategy: "Momentum", notes: "Entrée trop tardive, FOMO sur la hausse", result: "loss", timeframe: "1h", riskReward: 0.8 },
  { id: "3", date: "2026-02-14", crypto: "Solana", symbol: "SOL", direction: "SHORT", entryPrice: 205, exitPrice: 192, size: 5, pnl: 65, pnlPercent: 6.3, emotion: "confident", strategy: "Retracement", notes: "Divergence baissière RSI + résistance majeure", result: "win", timeframe: "4h", riskReward: 3.1 },
  { id: "4", date: "2026-02-12", crypto: "Avalanche", symbol: "AVAX", direction: "LONG", entryPrice: 38, exitPrice: 38.2, size: 10, pnl: 2, pnlPercent: 0.5, emotion: "calm", strategy: "Support/Résistance", notes: "Sortie trop tôt, manque de patience", result: "breakeven", timeframe: "1j", riskReward: 1.0 },
  { id: "5", date: "2026-02-10", crypto: "BNB", symbol: "BNB", direction: "LONG", entryPrice: 620, exitPrice: 668, size: 0.5, pnl: 24, pnlPercent: 7.7, emotion: "confident", strategy: "Swing", notes: "Setup parfait, respect du plan de trading", result: "win", timeframe: "1j", riskReward: 3.8 },
];

function formatPnl(pnl: number): string {
  return `${pnl >= 0 ? "+" : ""}$${Math.abs(pnl).toFixed(0)}`;
}

function AIInsight({ trades }: { trades: Trade[] }) {
  if (trades.length < 2) return null;

  const wins = trades.filter(t => t.result === "win");
  const losses = trades.filter(t => t.result === "loss");
  const winRate = (wins.length / trades.length) * 100;
  const avgRR = trades.reduce((s, t) => s + t.riskReward, 0) / trades.length;
  const fomoTrades = trades.filter(t => t.emotion === "fomo" || t.emotion === "greedy");
  const fomoLosses = fomoTrades.filter(t => t.result === "loss");
  const calmTrades = trades.filter(t => t.emotion === "calm" || t.emotion === "confident");
  const calmWins = calmTrades.filter(t => t.result === "win");

  const insights: { icon: string; text: string; color: string }[] = [];

  if (fomoTrades.length > 0 && fomoLosses.length / fomoTrades.length > 0.5) {
    insights.push({ icon: "⚠️", text: `${Math.round(fomoLosses.length / fomoTrades.length * 100)}% de vos trades FOMO/Avidité sont des pertes. Évitez d'entrer sous l'émotion.`, color: "text-amber-400" });
  }
  if (calmTrades.length > 0 && calmWins.length / calmTrades.length > 0.6) {
    insights.push({ icon: "✅", text: `Vous gagnez ${Math.round(calmWins.length / calmTrades.length * 100)}% du temps quand vous êtes calme/confiant. Continuez ainsi !`, color: "text-emerald-400" });
  }
  if (avgRR < 1.5) {
    insights.push({ icon: "📊", text: `Votre R/R moyen est ${avgRR.toFixed(1)}. Visez minimum 2:1 pour être rentable long terme.`, color: "text-red-400" });
  }
  if (winRate > 60) {
    insights.push({ icon: "🏆", text: `Win rate de ${winRate.toFixed(0)}% — excellent ! Maintenez votre discipline.`, color: "text-indigo-400" });
  }

  const bestStrategy = STRATEGIES.map(s => {
    const st = trades.filter(t => t.strategy === s);
    if (st.length < 2) return null;
    const wr = st.filter(t => t.result === "win").length / st.length;
    return { strategy: s, winRate: wr, count: st.length };
  }).filter(Boolean).sort((a, b) => b!.winRate - a!.winRate)[0];

  if (bestStrategy && bestStrategy.winRate > 0.6) {
    insights.push({ icon: "🎯", text: `Votre meilleure stratégie est "${bestStrategy.strategy}" avec ${Math.round(bestStrategy.winRate * 100)}% de win rate sur ${bestStrategy.count} trades.`, color: "text-cyan-400" });
  }

  if (insights.length === 0) return null;

  return (
    <div className="bg-[#0d1117] border border-indigo-500/20 rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Brain className="w-4 h-4 text-indigo-400" />
        </div>
        <h2 className="text-base font-bold text-white">Analyse IA — Insights Psychologiques</h2>
      </div>
      <div className="space-y-3">
        {insights.map((ins, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
            <span className="text-lg">{ins.icon}</span>
            <p className={`text-sm font-medium ${ins.color}`}>{ins.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CryptoJournal() {
  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const saved = localStorage.getItem("crypto_journal_trades");
      return saved ? JSON.parse(saved) : SAMPLE_TRADES;
    } catch { return SAMPLE_TRADES; }
  });
  const [showForm, setShowForm] = useState(false);
  const [filterResult, setFilterResult] = useState<"all" | "win" | "loss" | "breakeven">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    crypto: "", symbol: "", direction: "LONG" as "LONG" | "SHORT",
    entryPrice: "", exitPrice: "", size: "",
    emotion: "calm" as Trade["emotion"],
    strategy: "Breakout", notes: "", timeframe: "4h",
  });

  useEffect(() => {
    localStorage.setItem("crypto_journal_trades", JSON.stringify(trades));
  }, [trades]);

  const filteredTrades = trades.filter(t => filterResult === "all" || t.result === filterResult);

  const stats = {
    total: trades.length,
    wins: trades.filter(t => t.result === "win").length,
    losses: trades.filter(t => t.result === "loss").length,
    winRate: trades.length > 0 ? (trades.filter(t => t.result === "win").length / trades.length) * 100 : 0,
    totalPnl: trades.reduce((s, t) => s + t.pnl, 0),
    avgRR: trades.length > 0 ? trades.reduce((s, t) => s + t.riskReward, 0) / trades.length : 0,
    bestTrade: trades.length > 0 ? Math.max(...trades.map(t => t.pnl)) : 0,
    worstTrade: trades.length > 0 ? Math.min(...trades.map(t => t.pnl)) : 0,
  };

  const handleSubmit = () => {
    if (!form.crypto || !form.entryPrice || !form.exitPrice || !form.size) return;
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const size = parseFloat(form.size);
    const pnl = form.direction === "LONG" ? (exit - entry) * size : (entry - exit) * size;
    const pnlPercent = form.direction === "LONG" ? ((exit - entry) / entry) * 100 : ((entry - exit) / entry) * 100;
    const result: Trade["result"] = pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven";
    const riskReward = Math.abs(pnlPercent / 2);

    const newTrade: Trade = {
      id: Date.now().toString(),
      date: form.date,
      crypto: form.crypto,
      symbol: form.symbol.toUpperCase() || form.crypto.slice(0, 3).toUpperCase(),
      direction: form.direction,
      entryPrice: entry,
      exitPrice: exit,
      size,
      pnl,
      pnlPercent,
      emotion: form.emotion,
      strategy: form.strategy,
      notes: form.notes,
      result,
      timeframe: form.timeframe,
      riskReward,
    };

    setTrades(prev => [newTrade, ...prev]);
    setShowForm(false);
    setForm({ date: new Date().toISOString().split("T")[0], crypto: "", symbol: "", direction: "LONG", entryPrice: "", exitPrice: "", size: "", emotion: "calm", strategy: "Breakout", notes: "", timeframe: "4h" });
  };

  const deleteTrade = (id: string) => setTrades(prev => prev.filter(t => t.id !== id));

  const monthlyPnl = trades.reduce((acc, t) => {
    const month = t.date.slice(0, 7);
    acc[month] = (acc[month] || 0) + t.pnl;
    return acc;
  }, {} as Record<string, number>);

  const monthlyEntries = Object.entries(monthlyPnl).sort().slice(-6);

  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      <Sidebar />
      <main className="ml-[260px]">
      <PageHeader
          icon={<BookOpen className="w-6 h-6" />}
          title="Crypto Journal"
          subtitle="Tenez un journal de trading structuré pour analyser vos performances, identifier vos biais psychologiques et améliorer continuellement votre discipline de trading."
          accentColor="indigo"
          steps={[
            { n: "1", title: "Enregistrez vos trades", desc: "Après chaque trade, notez l'entrée, la sortie, la raison du trade et votre état émotionnel. La discipline du journal est clé." },
            { n: "2", title: "Analysez vos patterns", desc: "L'IA analyse vos entrées pour identifier vos biais récurrents : FOMO, revenge trading, sortie prématurée, etc." },
            { n: "3", title: "Améliorez-vous", desc: "Consultez vos statistiques hebdomadaires et mensuelles pour mesurer votre progression et ajuster votre approche." },
          ]}
        />
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Journal de Trading
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1 ml-13">Suivez vos trades, analysez vos émotions, progressez</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Nouveau Trade
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-5 hover:border-violet-500/20 transition-all">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Win Rate</p>
            <p className={`text-2xl font-extrabold ${stats.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>
              {stats.winRate.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-600 mt-1">{stats.wins}W / {stats.losses}L</p>
          </div>
          <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-5 hover:border-violet-500/20 transition-all">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">P&L Total</p>
            <p className={`text-2xl font-extrabold ${stats.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatPnl(stats.totalPnl)}
            </p>
            <p className="text-xs text-gray-600 mt-1">{stats.total} trades</p>
          </div>
          <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-5 hover:border-violet-500/20 transition-all">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">R/R Moyen</p>
            <p className={`text-2xl font-extrabold ${stats.avgRR >= 2 ? "text-emerald-400" : stats.avgRR >= 1.5 ? "text-amber-400" : "text-red-400"}`}>
              {stats.avgRR.toFixed(1)}
            </p>
            <p className="text-xs text-gray-600 mt-1">Objectif: 2.0+</p>
          </div>
          <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-5 hover:border-violet-500/20 transition-all">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Meilleur Trade</p>
            <p className="text-2xl font-extrabold text-emerald-400">{formatPnl(stats.bestTrade)}</p>
            <p className="text-xs text-gray-600 mt-1">Pire: {formatPnl(stats.worstTrade)}</p>
          </div>
        </div>

        {/* Monthly PnL Chart */}
        {monthlyEntries.length > 0 && (
          <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-violet-400" />
              <h2 className="text-base font-bold">Performance Mensuelle</h2>
            </div>
            <div className="flex items-end gap-3 h-32">
              {monthlyEntries.map(([month, pnl]) => {
                const maxAbs = Math.max(...monthlyEntries.map(([, v]) => Math.abs(v)), 1);
                const height = Math.max((Math.abs(pnl) / maxAbs) * 100, 4);
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <span className={`text-xs font-bold ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatPnl(pnl)}
                    </span>
                    <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                      <div
                        className={`w-full rounded-t-lg transition-all ${pnl >= 0 ? "bg-gradient-to-t from-emerald-600 to-emerald-400" : "bg-gradient-to-t from-red-600 to-red-400"}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-600">{month.slice(5)}/{month.slice(2, 4)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Insights */}
        <AIInsight trades={trades} />

        {/* Add Trade Form */}
        {showForm && (
          <div className="bg-[#0d1117] border border-violet-500/20 rounded-2xl p-6 mb-6">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-400" />
              Ajouter un Trade
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Crypto</label>
                <input placeholder="ex: Bitcoin" value={form.crypto} onChange={e => setForm(f => ({ ...f, crypto: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Symbole</label>
                <input placeholder="ex: BTC" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Direction</label>
                <div className="flex gap-2">
                  {(["LONG", "SHORT"] as const).map(d => (
                    <button key={d} onClick={() => setForm(f => ({ ...f, direction: d }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${form.direction === d ? (d === "LONG" ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400" : "bg-red-500/20 border border-red-500/40 text-red-400") : "bg-white/[0.04] border border-white/[0.06] text-gray-500"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Prix Entrée</label>
                <input type="number" placeholder="0.00" value={form.entryPrice} onChange={e => setForm(f => ({ ...f, entryPrice: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Prix Sortie</label>
                <input type="number" placeholder="0.00" value={form.exitPrice} onChange={e => setForm(f => ({ ...f, exitPrice: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Taille (unités)</label>
                <input type="number" placeholder="0.00" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Stratégie</label>
                <select value={form.strategy} onChange={e => setForm(f => ({ ...f, strategy: e.target.value }))}
                  className="w-full bg-[#0d1117] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50">
                  {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Timeframe</label>
                <select value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))}
                  className="w-full bg-[#0d1117] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50">
                  {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">État Émotionnel</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(EMOTION_CONFIG) as [Trade["emotion"], typeof EMOTION_CONFIG[keyof typeof EMOTION_CONFIG]][]).map(([key, cfg]) => (
                  <button key={key} onClick={() => setForm(f => ({ ...f, emotion: key }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${form.emotion === key ? cfg.bg + " " + cfg.color : "bg-white/[0.03] border-white/[0.06] text-gray-500"}`}>
                    <cfg.icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Notes & Analyse</label>
              <textarea placeholder="Décrivez votre raisonnement, ce qui a bien/mal fonctionné..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 resize-none" />
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm transition-all">
                Enregistrer
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 font-bold text-sm transition-all">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          {(["all", "win", "loss", "breakeven"] as const).map(f => (
            <button key={f} onClick={() => setFilterResult(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterResult === f ? "bg-violet-500/20 border border-violet-500/30 text-violet-400" : "bg-white/[0.03] border border-white/[0.06] text-gray-500 hover:text-gray-300"}`}>
              {f === "all" ? "Tous" : f === "win" ? "✅ Gains" : f === "loss" ? "❌ Pertes" : "➖ Neutre"}
              {f !== "all" && <span className="ml-1 opacity-70">({trades.filter(t => t.result === f).length})</span>}
            </button>
          ))}
        </div>

        {/* Trades List */}
        <div className="space-y-3">
          {filteredTrades.length === 0 && (
            <div className="text-center py-16 text-gray-600">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Aucun trade trouvé</p>
              <p className="text-sm mt-1">Ajoutez votre premier trade avec le bouton ci-dessus</p>
            </div>
          )}
          {filteredTrades.map(trade => {
            const emotionCfg = EMOTION_CONFIG[trade.emotion];
            const EmotionIcon = emotionCfg.icon;
            const isExpanded = expandedId === trade.id;
            return (
              <div key={trade.id} className={`bg-[#0d1117] border rounded-2xl overflow-hidden transition-all ${trade.result === "win" ? "border-emerald-500/10 hover:border-emerald-500/20" : trade.result === "loss" ? "border-red-500/10 hover:border-red-500/20" : "border-white/[0.06] hover:border-white/[0.10]"}`}>
                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : trade.id)}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${trade.result === "win" ? "bg-emerald-500/15 text-emerald-400" : trade.result === "loss" ? "bg-red-500/15 text-red-400" : "bg-gray-500/15 text-gray-400"}`}>
                      {trade.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{trade.crypto}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trade.direction === "LONG" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                          {trade.direction}
                        </span>
                        <span className="text-[10px] text-gray-600">{trade.timeframe}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3 h-3 text-gray-600" />
                        <span className="text-xs text-gray-600">{trade.date}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-600">{trade.strategy}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${emotionCfg.bg} ${emotionCfg.color}`}>
                      <EmotionIcon className="w-3 h-3" />
                      {emotionCfg.label}
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-extrabold ${trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatPnl(trade.pnl)}
                      </p>
                      <p className={`text-xs font-bold ${trade.pnlPercent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {trade.pnlPercent >= 0 ? "+" : ""}{trade.pnlPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); deleteTrade(trade.id); }}
                        className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/[0.04] pt-3">
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-white/[0.02] rounded-xl p-3">
                        <p className="text-xs text-gray-600 mb-1">Entrée → Sortie</p>
                        <p className="text-sm font-bold">${trade.entryPrice.toLocaleString()} → ${trade.exitPrice.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/[0.02] rounded-xl p-3">
                        <p className="text-xs text-gray-600 mb-1">Taille</p>
                        <p className="text-sm font-bold">{trade.size} unités</p>
                      </div>
                      <div className="bg-white/[0.02] rounded-xl p-3">
                        <p className="text-xs text-gray-600 mb-1">Risk/Reward</p>
                        <p className={`text-sm font-bold ${trade.riskReward >= 2 ? "text-emerald-400" : trade.riskReward >= 1 ? "text-amber-400" : "text-red-400"}`}>
                          {trade.riskReward.toFixed(1)}:1
                        </p>
                      </div>
                    </div>
                    {trade.notes && (
                      <div className="bg-white/[0.02] rounded-xl p-3">
                        <p className="text-xs text-gray-600 mb-1">Notes</p>
                        <p className="text-sm text-gray-300">{trade.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}