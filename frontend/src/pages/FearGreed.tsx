import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";

const HISTORY = [
  { date: "Aujourd'hui", value: 72, label: "Greed" },
  { date: "Hier", value: 68, label: "Greed" },
  { date: "Il y a 7j", value: 45, label: "Neutral" },
  { date: "Il y a 30j", value: 32, label: "Fear" },
  { date: "Il y a 90j", value: 58, label: "Greed" },
];

function getColor(val: number) {
  if (val <= 25) return "#ef4444";
  if (val <= 45) return "#f97316";
  if (val <= 55) return "#eab308";
  if (val <= 75) return "#84cc16";
  return "#22c55e";
}

function getLabel(val: number) {
  if (val <= 25) return "Extreme Fear";
  if (val <= 45) return "Fear";
  if (val <= 55) return "Neutral";
  if (val <= 75) return "Greed";
  return "Extreme Greed";
}

export default function FearGreed() {
  const [value, setValue] = useState(72);
  useEffect(() => { setValue(Math.floor(Math.random() * 30) + 55); }, []);

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">😨 Fear & Greed Index</h1>
        <p className="text-gray-400 mb-8">Indicateur de sentiment du marché crypto en temps réel</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gauge */}
          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8 flex flex-col items-center">
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r="85" fill="none" stroke="#1f2937" strokeWidth="12" />
                <circle cx="100" cy="100" r="85" fill="none" stroke={getColor(value)} strokeWidth="12"
                  strokeDasharray={`${(value / 100) * 534} 534`} strokeLinecap="round"
                  transform="rotate(-90 100 100)" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-black text-white">{value}</span>
                <span className="text-lg font-bold mt-1" style={{ color: getColor(value) }}>{getLabel(value)}</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4 text-center">
              L'indice Fear & Greed mesure le sentiment global du marché crypto sur une échelle de 0 à 100.
            </p>
          </div>

          {/* History */}
          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <h2 className="text-xl font-bold text-white mb-6">📊 Historique</h2>
            <div className="space-y-4">
              {HISTORY.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl">
                  <span className="text-gray-300 font-medium">{h.date}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${h.value}%`, background: getColor(h.value) }} />
                    </div>
                    <span className="text-white font-bold w-8 text-right">{h.value}</span>
                    <span className="text-sm font-medium w-24 text-right" style={{ color: getColor(h.value) }}>{h.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Factors */}
        <div className="mt-8 bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
          <h2 className="text-xl font-bold text-white mb-6">📈 Facteurs d'influence</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Volatilité", val: 35, icon: "📉" },
              { name: "Volume", val: 68, icon: "📊" },
              { name: "Social Media", val: 78, icon: "🐦" },
              { name: "Dominance BTC", val: 52, icon: "👑" },
              { name: "Tendances", val: 65, icon: "🔍" },
              { name: "Momentum", val: 71, icon: "🚀" },
            ].map((f, i) => (
              <div key={i} className="bg-white/[0.03] rounded-xl p-4 text-center">
                <span className="text-2xl">{f.icon}</span>
                <p className="text-gray-400 text-xs mt-2">{f.name}</p>
                <p className="text-white font-bold text-lg mt-1">{f.val}</p>
                <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2">
                  <div className="h-full rounded-full" style={{ width: `${f.val}%`, background: getColor(f.val) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}