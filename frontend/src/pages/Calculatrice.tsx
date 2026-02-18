import Sidebar from "@/components/Sidebar";
import { useState } from "react";

export default function Calculatrice() {
  const [investment, setInvestment] = useState("1000");
  const [entryPrice, setEntryPrice] = useState("97000");
  const [targetPrice, setTargetPrice] = useState("120000");
  const [stopLoss, setStopLoss] = useState("90000");

  const inv = parseFloat(investment) || 0;
  const entry = parseFloat(entryPrice) || 1;
  const target = parseFloat(targetPrice) || 0;
  const stop = parseFloat(stopLoss) || 0;

  const qty = inv / entry;
  const profitPct = ((target - entry) / entry) * 100;
  const profitUsd = (target - entry) * qty;
  const lossPct = ((stop - entry) / entry) * 100;
  const lossUsd = (stop - entry) * qty;
  const rr = Math.abs(profitPct / (lossPct || 1));

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">🧮 Calculatrice Trading</h1>
        <p className="text-gray-400 mb-8">Calculez vos profits, pertes et ratio risque/récompense</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <h2 className="text-lg font-bold text-white mb-6">Paramètres</h2>
            <div className="space-y-5">
              {[
                { label: "Investissement (USDT)", value: investment, set: setInvestment, icon: "💰" },
                { label: "Prix d'entrée", value: entryPrice, set: setEntryPrice, icon: "📍" },
                { label: "Prix cible (Take Profit)", value: targetPrice, set: setTargetPrice, icon: "🎯" },
                { label: "Stop Loss", value: stopLoss, set: setStopLoss, icon: "🛑" },
              ].map((f, i) => (
                <div key={i}>
                  <label className="text-gray-400 text-xs font-semibold flex items-center gap-2 mb-2">
                    <span>{f.icon}</span> {f.label}
                  </label>
                  <input type="number" value={f.value} onChange={(e) => f.set(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-6">
              <h2 className="text-lg font-bold text-white mb-4">Résultats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <p className="text-emerald-400 text-xs font-semibold mb-1">Profit potentiel</p>
                  <p className="text-emerald-400 text-2xl font-black">+{profitPct.toFixed(1)}%</p>
                  <p className="text-emerald-400/70 text-sm font-semibold">${profitUsd.toFixed(2)}</p>
                </div>
                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                  <p className="text-red-400 text-xs font-semibold mb-1">Perte potentielle</p>
                  <p className="text-red-400 text-2xl font-black">{lossPct.toFixed(1)}%</p>
                  <p className="text-red-400/70 text-sm font-semibold">${lossUsd.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Quantité</p>
                  <p className="text-white font-bold text-lg">{qty.toFixed(6)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Ratio R/R</p>
                  <p className={`font-bold text-lg ${rr >= 2 ? "text-emerald-400" : rr >= 1 ? "text-yellow-400" : "text-red-400"}`}>
                    1:{rr.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Qualité</p>
                  <p className={`font-bold text-lg ${rr >= 3 ? "text-emerald-400" : rr >= 2 ? "text-yellow-400" : "text-red-400"}`}>
                    {rr >= 3 ? "Excellent" : rr >= 2 ? "Bon" : "Risqué"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-500/10 rounded-2xl border border-indigo-500/20 p-6">
              <p className="text-indigo-400 text-sm font-semibold">💡 Conseil</p>
              <p className="text-gray-300 text-sm mt-2">
                {rr >= 3 ? "Excellent ratio risque/récompense ! Ce trade a un bon potentiel." :
                 rr >= 2 ? "Ratio acceptable. Assurez-vous que votre analyse technique confirme cette entrée." :
                 "Ratio risque/récompense faible. Considérez d'ajuster votre stop loss ou votre cible."}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}