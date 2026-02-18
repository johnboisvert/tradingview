import Sidebar from "@/components/Sidebar";
import { useState } from "react";

const PAIRS = [
  { pair: "BTC/USDT", price: "97,245.30", change: 2.4, vol: "2.1B" },
  { pair: "ETH/USDT", price: "3,421.50", change: -1.2, vol: "890M" },
  { pair: "SOL/USDT", price: "198.75", change: 8.5, vol: "650M" },
  { pair: "BNB/USDT", price: "612.40", change: 3.1, vol: "320M" },
  { pair: "XRP/USDT", price: "2.45", change: -0.8, vol: "280M" },
  { pair: "ADA/USDT", price: "0.892", change: 4.2, vol: "180M" },
];

export default function SpotTrading() {
  const [side, setSide] = useState<"buy" | "sell">("buy");

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">💎 Spot Trading</h1>
        <p className="text-gray-400 mb-8">Interface de trading spot avec données en temps réel</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Book */}
          <div className="lg:col-span-2 bg-[#111827] rounded-2xl border border-white/[0.06] p-6">
            <h2 className="text-lg font-bold text-white mb-4">📋 Paires de Trading</h2>
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/[0.06]">
                  <th className="text-left pb-3">Paire</th>
                  <th className="text-right pb-3">Prix</th>
                  <th className="text-right pb-3">24h</th>
                  <th className="text-right pb-3">Volume</th>
                </tr>
              </thead>
              <tbody>
                {PAIRS.map((p, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer">
                    <td className="py-4 text-white font-bold">{p.pair}</td>
                    <td className="text-right text-white font-semibold">${p.price}</td>
                    <td className={`text-right font-semibold ${p.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {p.change >= 0 ? "+" : ""}{p.change}%
                    </td>
                    <td className="text-right text-gray-400">${p.vol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order Form */}
          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-6">
            <h2 className="text-lg font-bold text-white mb-4">📝 Passer un Ordre</h2>
            <div className="flex gap-2 mb-6">
              <button onClick={() => setSide("buy")} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${side === "buy" ? "bg-emerald-500 text-white" : "bg-white/[0.05] text-gray-400"}`}>
                Acheter
              </button>
              <button onClick={() => setSide("sell")} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${side === "sell" ? "bg-red-500 text-white" : "bg-white/[0.05] text-gray-400"}`}>
                Vendre
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-1">Prix (USDT)</label>
                <input type="text" defaultValue="97,245.30" className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-1">Montant (BTC)</label>
                <input type="text" placeholder="0.00" className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-1">Total (USDT)</label>
                <input type="text" placeholder="0.00" className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm" readOnly />
              </div>
              <button className={`w-full py-3 rounded-xl font-bold text-white text-sm ${side === "buy" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"} transition-colors`}>
                {side === "buy" ? "Acheter BTC" : "Vendre BTC"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}