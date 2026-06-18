// Free SEO Tool: Exchange Fees Comparator — drives passive Google traffic
import { useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { Scale, TrendingDown, Info } from "lucide-react";
import { Link } from "react-router-dom";

type Exchange = {
  name: string;
  maker_pct: number;
  taker_pct: number;
  withdraw_btc: number;
  notes: string;
  fr_support: boolean;
};

// Public data — verified rates as of early 2026 (review quarterly)
const EXCHANGES: Exchange[] = [
  { name: "Binance",    maker_pct: 0.10, taker_pct: 0.10, withdraw_btc: 0.0002, notes: "Réduction -25% en BNB", fr_support: true },
  { name: "Kraken",     maker_pct: 0.16, taker_pct: 0.26, withdraw_btc: 0.00015, notes: "Pro a des frais plus bas", fr_support: true },
  { name: "Coinbase",   maker_pct: 0.40, taker_pct: 0.60, withdraw_btc: 0.0005, notes: "Pro/Advanced moins cher", fr_support: true },
  { name: "Bitget",     maker_pct: 0.10, taker_pct: 0.10, withdraw_btc: 0.0002, notes: "Idéal copy-trading", fr_support: false },
  { name: "OKX",        maker_pct: 0.08, taker_pct: 0.10, withdraw_btc: 0.0002, notes: "Bons frais sur dérivés", fr_support: true },
  { name: "Bybit",      maker_pct: 0.10, taker_pct: 0.10, withdraw_btc: 0.0002, notes: "Perpétuels populaires", fr_support: true },
  { name: "Newton (CA)",maker_pct: 0.50, taker_pct: 0.70, withdraw_btc: 0.0005, notes: "Régulé Canada, KYC simple", fr_support: true },
  { name: "Shakepay (CA)", maker_pct: 1.50, taker_pct: 1.50, withdraw_btc: 0.0005, notes: "Frais élevés, app simple", fr_support: true },
];

export default function ExchangeFeesComparator() {
  const [amount, setAmount] = useState(1000);
  const [trades, setTrades] = useState(10);
  const [tradeType, setTradeType] = useState<"maker" | "taker">("taker");

  const rows = useMemo(() => {
    return EXCHANGES.map(ex => {
      const pct = tradeType === "maker" ? ex.maker_pct : ex.taker_pct;
      const fee_per_trade = (amount * pct) / 100;
      const total_fees = fee_per_trade * trades * 2; // aller-retour
      return { ...ex, pct, fee_per_trade, total_fees };
    }).sort((a, b) => a.total_fees - b.total_fees);
  }, [amount, trades, tradeType]);

  const cheapest = rows[0];
  const mostExpensive = rows[rows.length - 1];
  const savings = mostExpensive.total_fees - cheapest.total_fees;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Scale className="w-7 h-7 text-amber-300" />
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Comparateur Frais Exchanges Crypto
            </h1>
          </div>
          <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-2xl">
            Compare les frais de 8 exchanges crypto populaires (FR/CA inclus). Saisis ton montant et nombre de trades pour voir combien tu peux économiser. <strong className="text-white">Gratuit, sans inscription.</strong>
          </p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <label className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2 font-bold">Montant par trade ($CAD)</div>
            <input type="number" min={10} value={amount} onChange={(e) => setAmount(Math.max(10, Number(e.target.value) || 0))}
              data-testid="comparator-amount"
              className="w-full bg-transparent text-2xl font-black text-white focus:outline-none" />
          </label>
          <label className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2 font-bold">Nombre de trades / mois</div>
            <input type="number" min={1} value={trades} onChange={(e) => setTrades(Math.max(1, Number(e.target.value) || 0))}
              data-testid="comparator-trades"
              className="w-full bg-transparent text-2xl font-black text-white focus:outline-none" />
          </label>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2 font-bold">Type d'ordre</div>
            <div className="flex gap-2">
              <button onClick={() => setTradeType("maker")} data-testid="comparator-maker"
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-black ${tradeType === "maker" ? "bg-indigo-500 text-white" : "bg-white/[0.06] text-gray-400"}`}>Maker</button>
              <button onClick={() => setTradeType("taker")} data-testid="comparator-taker"
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-black ${tradeType === "taker" ? "bg-indigo-500 text-white" : "bg-white/[0.06] text-gray-400"}`}>Taker</button>
            </div>
          </div>
        </div>

        {/* Savings highlight */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-5 mb-6 flex items-center gap-4">
          <TrendingDown className="w-8 h-8 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-2xl font-black text-white">
              Économie potentielle : <span className="text-emerald-300">{savings.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}/mois</span>
            </div>
            <div className="text-sm text-gray-300 mt-1">
              En passant de <strong>{mostExpensive.name}</strong> ({mostExpensive.total_fees.toFixed(2)}$) à <strong>{cheapest.name}</strong> ({cheapest.total_fees.toFixed(2)}$)
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden mb-8" data-testid="comparator-table">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04]">
              <tr>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-gray-400 font-bold">Exchange</th>
                <th className="text-right p-3 text-[10px] uppercase tracking-wider text-gray-400 font-bold">Frais %</th>
                <th className="text-right p-3 text-[10px] uppercase tracking-wider text-gray-400 font-bold">Par trade</th>
                <th className="text-right p-3 text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total/mois</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-gray-400 font-bold hidden md:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.name} className={`border-t border-white/[0.05] ${i === 0 ? "bg-emerald-500/[0.04]" : ""}`}>
                  <td className="p-3 font-bold text-white">
                    {i === 0 && <span className="inline-block mr-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-black">BEST</span>}
                    {r.name}
                    {r.fr_support && <span className="ml-2 text-[9px] text-gray-500">🇫🇷</span>}
                  </td>
                  <td className="p-3 text-right font-mono text-gray-300">{r.pct.toFixed(2)}%</td>
                  <td className="p-3 text-right font-mono text-gray-300">{r.fee_per_trade.toFixed(2)}$</td>
                  <td className="p-3 text-right font-mono font-black text-white">{r.total_fees.toFixed(2)}$</td>
                  <td className="p-3 text-gray-500 text-xs hidden md:table-cell">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 mb-8">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-300 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-gray-300">Données indicatives</strong> (frais standards révisés trimestriellement). Le total inclut l'aller-retour (achat + vente) sur {trades} trades. Les frais de retrait, le slippage et les promotions ponctuelles ne sont pas inclus. Vérifie toujours les conditions actuelles sur le site officiel de l'exchange.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-6 md:p-8 text-center">
          <h3 className="text-xl md:text-2xl font-black text-white mb-2">Tu veux des signaux IA en plus de frais bas ?</h3>
          <p className="text-sm text-gray-300 mb-4">CryptoIA scanne 200+ paires 24/7 et envoie des alertes Telegram quand un setup déclenche.</p>
          <Link to="/abonnements" data-testid="comparator-cta-pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-sm hover:scale-[1.02] transition-transform">
            Essai 7 jours gratuit →
          </Link>
        </div>

        <Footer />
      </main>
    </div>
  );
}
