import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { TrendingUp, Plus, Trash2 } from "lucide-react";

const TRADES_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/b3c0b3a0-ae42-46d0-9f3a-9f12780c9e10.png";

interface Trade {
  id: number; pair: string; type: "long" | "short"; entry: number; exit: number;
  amount: number; date: string; notes: string;
}

const INITIAL_TRADES: Trade[] = [
  { id: 1, pair: "BTC/USDT", type: "long", entry: 92000, exit: 97000, amount: 500, date: "2026-02-15", notes: "Breakout sur résistance" },
  { id: 2, pair: "ETH/USDT", type: "long", entry: 2500, exit: 2720, amount: 300, date: "2026-02-14", notes: "DCA hebdomadaire" },
  { id: 3, pair: "SOL/USDT", type: "short", entry: 210, exit: 195, amount: 200, date: "2026-02-13", notes: "RSI suracheté" },
  { id: 4, pair: "BNB/USDT", type: "long", entry: 620, exit: 650, amount: 250, date: "2026-02-12", notes: "Support testé" },
  { id: 5, pair: "DOGE/USDT", type: "long", entry: 0.22, exit: 0.25, amount: 150, date: "2026-02-11", notes: "Momentum social" },
  { id: 6, pair: "ADA/USDT", type: "short", entry: 0.85, exit: 0.78, amount: 100, date: "2026-02-10", notes: "Cassure support" },
  { id: 7, pair: "AVAX/USDT", type: "long", entry: 35, exit: 38.5, amount: 200, date: "2026-02-09", notes: "Accumulation zone" },
  { id: 8, pair: "XRP/USDT", type: "long", entry: 2.20, exit: 2.45, amount: 300, date: "2026-02-08", notes: "News positive SEC" },
  { id: 9, pair: "DOT/USDT", type: "short", entry: 8.5, exit: 7.8, amount: 150, date: "2026-02-07", notes: "Tendance baissière" },
  { id: 10, pair: "LINK/USDT", type: "long", entry: 18, exit: 21, amount: 250, date: "2026-02-06", notes: "Intégration CCIP" },
];

export default function Trades() {
  const [trades, setTrades] = useState<Trade[]>(INITIAL_TRADES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ pair: "", type: "long" as "long" | "short", entry: "", exit: "", amount: "", date: "", notes: "" });

  const addTrade = () => {
    if (!form.pair || !form.entry || !form.exit) return;
    setTrades((prev) => [{
      id: Date.now(), pair: form.pair.toUpperCase(), type: form.type,
      entry: parseFloat(form.entry), exit: parseFloat(form.exit),
      amount: parseFloat(form.amount) || 0, date: form.date || new Date().toISOString().split("T")[0], notes: form.notes,
    }, ...prev]);
    setForm({ pair: "", type: "long", entry: "", exit: "", amount: "", date: "", notes: "" });
    setShowForm(false);
  };

  const deleteTrade = (id: number) => setTrades((prev) => prev.filter((t) => t.id !== id));

  const getPnL = (t: Trade) => {
    const pct = t.entry > 0 ? ((t.type === "long" ? t.exit - t.entry : t.entry - t.exit) / t.entry) * 100 : 0;
    const usd = t.amount * (pct / 100);
    return { pct, usd };
  };

  const totalPnL = trades.reduce((s, t) => s + getPnL(t).usd, 0);
  const winTrades = trades.filter((t) => getPnL(t).usd > 0).length;
  const winRate = trades.length ? (winTrades / trades.length) * 100 : 0;
  const avgPnL = trades.length ? trades.reduce((s, t) => s + getPnL(t).pct, 0) / trades.length : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={TRADES_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <TrendingUp className="w-7 h-7 text-emerald-400" />
                <h1 className="text-2xl font-extrabold">Journal de Trades</h1>
              </div>
              <p className="text-sm text-gray-400">Suivez et analysez toutes vos transactions crypto</p>
            </div>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-sm font-bold hover:brightness-110 transition-all">
              <Plus className="w-4 h-4" /> Nouveau Trade
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Ajouter un Trade</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Paire</label>
                <input type="text" value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value })} placeholder="BTC/USDT"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Direction</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "long" | "short" })}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none">
                  <option value="long">🟢 Long</option>
                  <option value="short">🔴 Short</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Prix d'entrée</label>
                <input type="number" value={form.entry} onChange={(e) => setForm({ ...form, entry: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Prix de sortie</label>
                <input type="number" value={form.exit} onChange={(e) => setForm({ ...form, exit: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Montant ($)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Notes</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Raison du trade..."
                  className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none" />
              </div>
            </div>
            <button onClick={addTrade}
              className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-sm font-bold hover:brightness-110 transition-all">
              Ajouter
            </button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Total Trades</p>
            <p className="text-2xl font-extrabold">{trades.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">P&L Total</p>
            <p className={`text-2xl font-extrabold ${totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
            </p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Win Rate</p>
            <p className="text-2xl font-extrabold text-amber-400">{winRate.toFixed(1)}%</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">P&L Moyen</p>
            <p className={`text-2xl font-extrabold ${avgPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {avgPnL >= 0 ? "+" : ""}{avgPnL.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Trades Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">📋 Historique des Trades</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Paire</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 uppercase">Type</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Entrée</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Sortie</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Montant</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">P&L</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Notes</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => {
                  const pnl = getPnL(t);
                  return (
                    <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 text-sm text-gray-400">{t.date}</td>
                      <td className="py-3 px-3 text-sm font-bold">{t.pair}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.type === "long" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                          {t.type === "long" ? "🟢 Long" : "🔴 Short"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-sm">${t.entry.toLocaleString("en-US", { maximumFractionDigits: 6 })}</td>
                      <td className="py-3 px-3 text-right text-sm">${t.exit.toLocaleString("en-US", { maximumFractionDigits: 6 })}</td>
                      <td className="py-3 px-3 text-right text-sm">${t.amount.toLocaleString()}</td>
                      <td className={`py-3 px-3 text-right text-sm font-bold ${pnl.usd >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {pnl.usd >= 0 ? "+" : ""}${pnl.usd.toFixed(2)} ({pnl.pct >= 0 ? "+" : ""}{pnl.pct.toFixed(1)}%)
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-500 max-w-[150px] truncate">{t.notes}</td>
                      <td className="py-3 px-3 text-center">
                        <button onClick={() => deleteTrade(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}