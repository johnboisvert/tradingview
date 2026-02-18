import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { PlayCircle } from "lucide-react";

const SIM_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/4b6e1138-5e13-42c7-9e5d-95ba3808c41a.png";

interface SimResult { month: number; invested: number; value: number; }

export default function Simulation() {
  const [initial, setInitial] = useState("10000");
  const [monthly, setMonthly] = useState("500");
  const [months, setMonths] = useState("24");
  const [bullReturn, setBullReturn] = useState("15");
  const [bearReturn, setBearReturn] = useState("-8");
  const [bullProb, setBullProb] = useState("60");
  const [results, setResults] = useState<SimResult[]>([]);
  const [runs, setRuns] = useState(0);

  const simulate = () => {
    const init = parseFloat(initial) || 0;
    const mon = parseFloat(monthly) || 0;
    const m = parseInt(months) || 12;
    const br = parseFloat(bullReturn) || 10;
    const bear = parseFloat(bearReturn) || -5;
    const bp = (parseFloat(bullProb) || 60) / 100;

    const simResults: SimResult[] = [];
    let value = init;
    let invested = init;

    for (let i = 1; i <= m; i++) {
      invested += mon;
      value += mon;
      const isBull = Math.random() < bp;
      const ret = isBull ? br / 100 : bear / 100;
      value *= (1 + ret);
      simResults.push({ month: i, invested, value: Math.round(value * 100) / 100 });
    }

    setResults(simResults);
    setRuns((prev) => prev + 1);
  };

  const finalValue = results.length ? results[results.length - 1].value : 0;
  const totalInvested = results.length ? results[results.length - 1].invested : 0;
  const pnl = finalValue - totalInvested;
  const roi = totalInvested > 0 ? ((pnl / totalInvested) * 100) : 0;

  const maxVal = results.length ? Math.max(...results.map((r) => Math.max(r.value, r.invested))) : 1;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={SIM_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <PlayCircle className="w-7 h-7 text-green-400" />
                <h1 className="text-2xl font-extrabold">Simulateur de Portfolio</h1>
              </div>
              <p className="text-sm text-gray-400">Simulez l'évolution de votre portfolio crypto avec Monte Carlo</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Params */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">⚙️ Paramètres</h2>
            <div className="space-y-4">
              {[
                { label: "Capital Initial ($)", val: initial, set: setInitial },
                { label: "Investissement Mensuel ($)", val: monthly, set: setMonthly },
                { label: "Durée (mois)", val: months, set: setMonths },
                { label: "Rendement Bull (%/mois)", val: bullReturn, set: setBullReturn },
                { label: "Rendement Bear (%/mois)", val: bearReturn, set: setBearReturn },
                { label: "Probabilité Bull (%)", val: bullProb, set: setBullProb },
              ].map((f, i) => (
                <div key={i}>
                  <label className="text-xs text-gray-500 font-semibold mb-1 block">{f.label}</label>
                  <input type="number" value={f.val} onChange={(e) => f.set(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-green-500/50" />
                </div>
              ))}
              <button onClick={simulate}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-sm font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <PlayCircle className="w-4 h-4" /> Lancer la Simulation
              </button>
              {runs > 0 && <p className="text-xs text-gray-500 text-center">{runs} simulation(s) effectuée(s)</p>}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {results.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Valeur Finale</p>
                    <p className="text-2xl font-extrabold text-emerald-400">${finalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Total Investi</p>
                    <p className="text-2xl font-extrabold">${totalInvested.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Profit/Perte</p>
                    <p className={`text-2xl font-extrabold ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {pnl >= 0 ? "+" : ""}${pnl.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                    <p className="text-xs text-gray-500 font-semibold mb-1">ROI</p>
                    <p className={`text-2xl font-extrabold ${roi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Chart */}
                <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4">📈 Évolution du Portfolio</h3>
                  <svg viewBox={`0 0 ${results.length * 20 + 40} 200`} className="w-full h-48">
                    {/* Grid */}
                    {[0, 50, 100, 150, 200].map((y) => (
                      <line key={y} x1="30" y1={y} x2={results.length * 20 + 30} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    ))}
                    {/* Invested line */}
                    <polyline
                      points={results.map((r, i) => `${i * 20 + 30},${200 - (r.invested / maxVal) * 190}`).join(" ")}
                      fill="none" stroke="#6B7280" strokeWidth="1.5" strokeDasharray="4,4" />
                    {/* Value line */}
                    <polyline
                      points={results.map((r, i) => `${i * 20 + 30},${200 - (r.value / maxVal) * 190}`).join(" ")}
                      fill="none" stroke={pnl >= 0 ? "#10B981" : "#EF4444"} strokeWidth="2" />
                    {/* Dots */}
                    {results.filter((_, i) => i % Math.ceil(results.length / 12) === 0 || i === results.length - 1).map((r, _, arr) => {
                      const idx = results.indexOf(r);
                      return (
                        <circle key={idx} cx={idx * 20 + 30} cy={200 - (r.value / maxVal) * 190} r="3"
                          fill={pnl >= 0 ? "#10B981" : "#EF4444"} />
                      );
                    })}
                  </svg>
                  <div className="flex items-center gap-4 mt-2 justify-center">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-gray-500" style={{ borderTop: "2px dashed #6B7280" }} /><span className="text-xs text-gray-500">Investi</span></div>
                    <div className="flex items-center gap-1.5"><div className={`w-3 h-0.5 ${pnl >= 0 ? "bg-emerald-500" : "bg-red-500"}`} /><span className="text-xs text-gray-400">Valeur</span></div>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4">📊 Détails Mensuels</h3>
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-[#111827]">
                        <tr className="border-b border-white/[0.06]">
                          <th className="text-left py-2 px-3 text-xs font-bold text-gray-500">Mois</th>
                          <th className="text-right py-2 px-3 text-xs font-bold text-gray-500">Investi</th>
                          <th className="text-right py-2 px-3 text-xs font-bold text-gray-500">Valeur</th>
                          <th className="text-right py-2 px-3 text-xs font-bold text-gray-500">P&L</th>
                          <th className="text-right py-2 px-3 text-xs font-bold text-gray-500">ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r) => {
                          const p = r.value - r.invested;
                          const roi = r.invested > 0 ? (p / r.invested) * 100 : 0;
                          return (
                            <tr key={r.month} className="border-b border-white/[0.03]">
                              <td className="py-2 px-3 text-sm">{r.month}</td>
                              <td className="py-2 px-3 text-right text-sm">${r.invested.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right text-sm font-bold">${r.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                              <td className={`py-2 px-3 text-right text-sm font-bold ${p >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {p >= 0 ? "+" : ""}${p.toFixed(2)}
                              </td>
                              <td className={`py-2 px-3 text-right text-sm font-bold ${roi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {results.length === 0 && (
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-12 text-center">
                <PlayCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-bold">Configurez les paramètres et lancez la simulation</p>
                <p className="text-gray-600 text-sm mt-2">La simulation utilise la méthode Monte Carlo pour modéliser l'évolution de votre portfolio</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}