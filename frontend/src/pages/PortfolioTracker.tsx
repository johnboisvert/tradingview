import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

interface Holding {
  id: number;
  symbol: string;
  amount: number;
  buyPrice: number;
  currentPrice: number;
}

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

const COIN_MAP: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", BNB: "binancecoin",
  XRP: "ripple", ADA: "cardano", DOGE: "dogecoin", AVAX: "avalanche-2",
  DOT: "polkadot", MATIC: "matic-network", LINK: "chainlink", UNI: "uniswap",
};

export default function PortfolioTracker() {
  const [holdings, setHoldings] = useState<Holding[]>(() => {
    const saved = localStorage.getItem("cryptoia_portfolio");
    return saved ? JSON.parse(saved) : [];
  });
  const [form, setForm] = useState({ symbol: "", amount: "", buyPrice: "" });
  const [prices, setPrices] = useState<Record<string, number>>({});

  const fetchPrices = useCallback(async () => {
    const symbols = [...new Set(holdings.map((h) => h.symbol.toUpperCase()))];
    const ids = symbols.map((s) => COIN_MAP[s]).filter(Boolean).join(",");
    if (!ids) return;
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
      const data = await res.json();
      const priceMap: Record<string, number> = {};
      for (const [key, val] of Object.entries(data)) {
        const sym = Object.entries(COIN_MAP).find(([, v]) => v === key)?.[0];
        if (sym) priceMap[sym] = (val as { usd: number }).usd;
      }
      setPrices(priceMap);
    } catch { /* fallback */ }
  }, [holdings]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  useEffect(() => {
    localStorage.setItem("cryptoia_portfolio", JSON.stringify(holdings));
  }, [holdings]);

  const addHolding = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = form.symbol.toUpperCase();
    const newH: Holding = {
      id: Date.now(),
      symbol: sym,
      amount: parseFloat(form.amount),
      buyPrice: parseFloat(form.buyPrice),
      currentPrice: prices[sym] || parseFloat(form.buyPrice),
    };
    setHoldings([...holdings, newH]);
    setForm({ symbol: "", amount: "", buyPrice: "" });
  };

  const removeHolding = (id: number) => setHoldings(holdings.filter((h) => h.id !== id));

  const enriched = holdings.map((h) => ({
    ...h,
    currentPrice: prices[h.symbol.toUpperCase()] || h.currentPrice || h.buyPrice,
  }));

  const totalValue = enriched.reduce((s, h) => s + h.amount * h.currentPrice, 0);
  const totalCost = enriched.reduce((s, h) => s + h.amount * h.buyPrice, 0);
  const totalPnl = totalValue - totalCost;
  const best = enriched.length > 0 ? enriched.reduce((best, h) => {
    const pnlPct = ((h.currentPrice - h.buyPrice) / h.buyPrice) * 100;
    const bestPct = ((best.currentPrice - best.buyPrice) / best.buyPrice) * 100;
    return pnlPct > bestPct ? h : best;
  }) : null;

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px] bg-[#030712]">
      <PageHeader
          icon={<span className="text-lg">💼</span>}
          title="Portfolio Tracker"
          subtitle="Suivez la performance de votre portefeuille crypto en temps réel. Ajoutez vos positions, visualisez vos gains/pertes et analysez la répartition de vos actifs."
          accentColor="indigo"
          steps={[
            { n: "1", title: "Ajoutez vos actifs", desc: "Cliquez sur Ajouter un Actif, entrez le symbole, la quantité et le prix d’achat pour commencer à tracker votre portfolio." },
            { n: "2", title: "Suivez vos performances", desc: "Le tableau de bord affiche votre P&L total, la valeur actuelle et la variation de chaque position en temps réel." },
            { n: "3", title: "Analysez la répartition", desc: "Le graphique de répartition vous montre votre exposition par actif pour identifier les concentrations de risque." },
          ]}
        />
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-400 via-emerald-400 to-amber-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              💼 Portfolio Tracker
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Suivez vos investissements crypto avec des prix temps réel</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { icon: "💰", label: "Valeur Totale", value: `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
              { icon: "📈", label: "P&L Total", value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: totalPnl >= 0 ? "text-emerald-400" : "text-red-400" },
              { icon: "🪙", label: "Actifs", value: enriched.length.toString() },
              { icon: "🏆", label: "Meilleur", value: best ? best.symbol : "—" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-900/70 border border-white/5 rounded-2xl p-5 text-center hover:-translate-y-1 transition-all">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">{s.label}</div>
                <div className={`text-xl font-black font-mono mt-1 ${s.color || "text-white"}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Add Form */}
          <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">➕ Ajouter un Actif</h2>
            <form onSubmit={addHolding} className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Symbole</label>
                <input type="text" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="BTC, ETH, SOL..." required className="px-4 py-3 bg-slate-800/50 border border-white/5 rounded-xl text-white text-sm focus:border-indigo-500 outline-none" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Quantité</label>
                <input type="number" step="any" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.5" required className="px-4 py-3 bg-slate-800/50 border border-white/5 rounded-xl text-white text-sm focus:border-indigo-500 outline-none" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Prix d&apos;achat ($)</label>
                <input type="number" step="any" value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} placeholder="45000" required className="px-4 py-3 bg-slate-800/50 border border-white/5 rounded-xl text-white text-sm focus:border-indigo-500 outline-none" />
              </div>
              <button type="submit" className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all whitespace-nowrap">
                ➕ Ajouter
              </button>
            </form>
          </div>

          {/* Holdings Table */}
          <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 overflow-x-auto">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">📋 Mes Holdings</h2>
            {enriched.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-6xl mb-4">💼</div>
                <div className="text-xl font-bold text-white mb-2">Portfolio vide</div>
                <p>Ajoutez votre premier actif pour commencer le suivi</p>
              </div>
            ) : (
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Actif", "Quantité", "Prix Achat", "Prix Actuel", "Valeur", "P&L", ""].map((h) => (
                      <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((h, i) => {
                    const value = h.amount * h.currentPrice;
                    const pnl = (h.currentPrice - h.buyPrice) * h.amount;
                    const pnlPct = ((h.currentPrice - h.buyPrice) / h.buyPrice) * 100;
                    return (
                      <tr key={h.id} className="border-b border-white/5 hover:bg-indigo-500/5 transition-colors">
                        <td className="py-3 px-3 flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background: COLORS[i % COLORS.length] }}>
                            {h.symbol.slice(0, 3)}
                          </span>
                          <span className="font-bold text-white">{h.symbol}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-sm text-gray-300">{h.amount}</td>
                        <td className="py-3 px-3 font-mono text-sm text-gray-300">${h.buyPrice.toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono text-sm text-white font-bold">${h.currentPrice.toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono text-sm text-white">${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className={`py-3 px-3 font-mono text-sm font-bold ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {pnl >= 0 ? "+" : ""}{pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}$ ({pnlPct.toFixed(1)}%)
                        </td>
                        <td className="py-3 px-3">
                          <button onClick={() => removeHolding(h.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors">
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}