import Sidebar from "@/components/Sidebar";
import { useState } from "react";

const CRYPTOS: Record<string, number> = {
  BTC: 97245, ETH: 3421, SOL: 198.75, BNB: 612.40, XRP: 2.45, ADA: 0.892, AVAX: 42.50, DOT: 8.92, LINK: 19.82, MATIC: 1.15,
};

export default function Convertisseur() {
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState("BTC");
  const [to, setTo] = useState("ETH");

  const fromPrice = CRYPTOS[from] || 1;
  const toPrice = CRYPTOS[to] || 1;
  const result = (parseFloat(amount) || 0) * fromPrice / toPrice;
  const usdValue = (parseFloat(amount) || 0) * fromPrice;

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">💱 Convertisseur Crypto</h1>
        <p className="text-gray-400 mb-8">Convertissez entre différentes cryptomonnaies en temps réel</p>

        <div className="max-w-2xl mx-auto">
          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <div className="space-y-6">
              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-2">Montant</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-4 text-white text-2xl font-bold focus:border-indigo-500 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-semibold block mb-2">De</label>
                  <select value={from} onChange={(e) => setFrom(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-bold appearance-none cursor-pointer">
                    {Object.keys(CRYPTOS).map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-semibold block mb-2">Vers</label>
                  <select value={to} onChange={(e) => setTo(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-bold appearance-none cursor-pointer">
                    {Object.keys(CRYPTOS).map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-indigo-500/10 rounded-xl border border-indigo-500/20 p-6 text-center">
                <p className="text-gray-400 text-sm mb-2">Résultat</p>
                <p className="text-3xl font-black text-white">{result.toLocaleString(undefined, { maximumFractionDigits: 6 })} {to}</p>
                <p className="text-indigo-400 text-sm mt-2">≈ ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</p>
              </div>
            </div>
          </div>

          {/* Quick conversions */}
          <div className="mt-8 bg-[#111827] rounded-2xl border border-white/[0.06] p-6">
            <h2 className="text-lg font-bold text-white mb-4">⚡ Conversions rapides</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { f: "BTC", t: "ETH" }, { f: "BTC", t: "SOL" }, { f: "ETH", t: "BNB" }, { f: "SOL", t: "ADA" },
              ].map((pair, i) => (
                <div key={i} className="bg-white/[0.03] rounded-xl p-4 flex items-center justify-between">
                  <span className="text-white font-semibold">1 {pair.f}</span>
                  <span className="text-gray-500">=</span>
                  <span className="text-indigo-400 font-bold">
                    {(CRYPTOS[pair.f] / CRYPTOS[pair.t]).toLocaleString(undefined, { maximumFractionDigits: 4 })} {pair.t}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}