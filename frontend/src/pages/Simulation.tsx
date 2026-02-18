import Sidebar from "@/components/Sidebar";
import { useState } from "react";

export default function Simulation() {
  const [capital, setCapital] = useState("10000");
  const [months, setMonths] = useState("12");
  const [monthly, setMonthly] = useState("500");
  const [growth, setGrowth] = useState("8");

  const c = parseFloat(capital) || 0;
  const m = parseInt(months) || 0;
  const mo = parseFloat(monthly) || 0;
  const g = parseFloat(growth) / 100 || 0;

  const monthlyRate = g / 12;
  let total = c;
  const data: { month: number; value: number }[] = [{ month: 0, value: c }];
  for (let i = 1; i <= m; i++) {
    total = (total + mo) * (1 + monthlyRate);
    data.push({ month: i, value: total });
  }
  const totalInvested = c + mo * m;
  const profit = total - totalInvested;

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">🎮 Simulation de Portfolio</h1>
        <p className="text-gray-400 mb-8">Simulez la croissance de votre portfolio crypto</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inputs */}
          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <h2 className="text-lg font-bold text-white mb-6">Paramètres</h2>
            <div className="space-y-5">
              {[
                { label: "Capital initial ($)", value: capital, set: setCapital, icon: "💰" },
                { label: "Durée (mois)", value: months, set: setMonths, icon: "📅" },
                { label: "Investissement mensuel ($)", value: monthly, set: setMonthly, icon: "💵" },
                { label: "Croissance annuelle (%)", value: growth, set: setGrowth, icon: "📈" },
              ].map((f, i) => (
                <div key={i}>
                  <label className="text-gray-400 text-xs font-semibold flex items-center gap-2 mb-2">
                    <span>{f.icon}</span> {f.label}
                  </label>
                  <input type="number" value={f.value} onChange={(e) => f.set(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-6 text-center">
                <p className="text-gray-400 text-xs mb-1">Valeur finale</p>
                <p className="text-2xl font-black text-white">${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-6 text-center">
                <p className="text-gray-400 text-xs mb-1">Total investi</p>
                <p className="text-2xl font-black text-indigo-400">${totalInvested.toLocaleString()}</p>
              </div>
              <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-6 text-center">
                <p className="text-gray-400 text-xs mb-1">Profit</p>
                <p className={`text-2xl font-black ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  ${profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            {/* Simple bar chart */}
            <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
              <h2 className="text-lg font-bold text-white mb-4">📊 Évolution du Portfolio</h2>
              <div className="flex items-end gap-1 h-48">
                {data.filter((_, i) => i % Math.max(1, Math.floor(m / 24)) === 0 || i === m).map((d, i) => {
                  const maxVal = data[data.length - 1]?.value || 1;
                  const height = (d.value / maxVal) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-sm transition-all hover:opacity-80"
                        style={{ height: `${height}%`, minHeight: "4px" }} title={`Mois ${d.month}: $${d.value.toFixed(0)}`} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-gray-500 text-xs">Mois 0</span>
                <span className="text-gray-500 text-xs">Mois {m}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}