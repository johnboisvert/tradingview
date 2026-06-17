import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      const res = await fetch(`/api/coingecko/simple/price?ids=${ids}&vs_currencies=usd`, { signal: AbortSignal.timeout(15000) });
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
      <main className="flex-1 md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
      <PageHeader
          icon={<span className="text-lg">💼</span>}
          title={t("pages.portfolioTracker.title")}
          subtitle={t("pages.portfolioTracker.subtitle")}
          accentColor="indigo"
          steps={[
            { n: "1", title: "Ajoutez vos actifs", desc: "Cliquez sur Ajouter un Actif, entrez le symbole, la quantité et le prix d’achat pour commencer à tracker votre portfolio." },
            { n: "2", title: "Suivez vos performances", desc: "Le tableau de bord affiche votre P&L total, la valeur actuelle et la variation de chaque position en temps réel." },
            { n: "3", title: "Analysez la répartition", desc: "Le graphique de répartition vous montre votre exposition par actif pour identifier les concentrations de risque." },
          ]}
        />
        <div className="relative z-10 max-w-[1440px] mx-auto p-4 md:p-6">
          {/* ===== HERO ===== */}
          <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]">
            <div className="absolute inset-0 bg-[#0A0E1A]" />
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/22 blur-3xl" style={{ animation: "pt-pulse 6s ease-in-out infinite" }} />
            <div className="absolute -bottom-24 right-1/4 w-80 h-80 rounded-full bg-emerald-500/22 blur-3xl" style={{ animation: "pt-pulse 8s ease-in-out infinite reverse" }} />
            <div className="absolute -top-12 right-1/2 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl" style={{ animation: "pt-pulse 7s ease-in-out infinite" }} />
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }} />
            <div className="relative z-10 flex items-center gap-4 px-6 md:px-10 py-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center text-2xl" style={{ boxShadow: "0 0 30px rgba(99,102,241,0.3)" }}>
                💼
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-indigo-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
                    Portfolio Tracker
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Prix Live
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-400">
                  Suivez vos investissements crypto avec des prix temps réel · {enriched.length} actifs
                </p>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes pt-pulse {
              0%, 100% { transform: scale(1) translate(0,0); opacity: 0.3; }
              50% { transform: scale(1.2) translate(20px,-10px); opacity: 0.45; }
            }
            @keyframes pt-fadeUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .pt-anim { animation: pt-fadeUp 0.6s ease-out both; }
          `}</style>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6">
            {[
              { icon: "💰", label: "Valeur Totale", value: `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "#a78bfa" },
              { icon: "📈", label: "P&L Total", value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: totalPnl >= 0 ? "#22c55e" : "#ef4444" },
              { icon: "🪙", label: "Actifs", value: enriched.length.toString(), color: "#22d3ee" },
              { icon: "🏆", label: "Meilleur", value: best ? best.symbol : "—", color: "#fbbf24" },
            ].map((s, i) => (
              <div key={s.label}
                className="pt-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-4 md:p-5 text-center hover:-translate-y-1 transition-all overflow-hidden"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-25" style={{ background: s.color }} />
                <div className="relative">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{s.label}</div>
                  <div className="text-xl md:text-2xl font-black font-mono mt-1" style={{ color: s.color, textShadow: `0 0 14px ${s.color}40` }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Form */}
          <div className="pt-anim bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 mb-6" style={{ animationDelay: "320ms" }}>
            <h2 className="text-base md:text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" /> Ajouter un Actif
            </h2>
            <form onSubmit={addHolding} className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Symbole</label>
                <input type="text" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="BTC, ETH, SOL..." required className="px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:border-indigo-500 focus:bg-white/[0.06] outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Quantité</label>
                <input type="number" step="any" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.5" required className="px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:border-indigo-500 focus:bg-white/[0.06] outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Prix d&apos;achat ($)</label>
                <input type="number" step="any" value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} placeholder="45000" required className="px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:border-indigo-500 focus:bg-white/[0.06] outline-none transition-all" />
              </div>
              <button type="submit" className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all whitespace-nowrap" style={{ boxShadow: "0 0 24px rgba(99,102,241,0.25)" }}>
                ➕ Ajouter
              </button>
            </form>
          </div>

          {/* Holdings Table */}
          <div className="pt-anim bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 overflow-x-auto" style={{ animationDelay: "400ms" }}>
            <h2 className="text-base md:text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Mes Holdings
            </h2>
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