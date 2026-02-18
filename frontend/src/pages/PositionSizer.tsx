import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Calculator, Shield, Target, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";

interface SizerResult {
  riskAmount: number;
  quantity: number;
  positionNotional: number;
  margin: number;
  rr: number;
  tp1: number;
  tp2: number;
  tp3: number;
}

export default function PositionSizer() {
  const [account, setAccount] = useState("1000");
  const [risk, setRisk] = useState("1");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [leverage, setLeverage] = useState("1");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [rrTarget, setRrTarget] = useState("2");
  const [result, setResult] = useState<SizerResult | null>(null);
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    setResult(null);

    try {
      const acc = parseFloat(account);
      const r = parseFloat(risk) / 100;
      const e = parseFloat(entry);
      const s = parseFloat(stop);
      const lev = Math.max(1, parseFloat(leverage));
      const rr = parseFloat(rrTarget);

      if (isNaN(acc) || isNaN(e) || isNaN(s) || acc <= 0 || e <= 0 || s <= 0) {
        setError("Veuillez remplir tous les champs avec des valeurs valides.");
        return;
      }

      const perUnitRisk = Math.abs(e - s);
      if (perUnitRisk <= 0) {
        setError("L'entrée et le stop doivent être différents.");
        return;
      }

      const riskAmount = acc * r;
      const qty = riskAmount / perUnitRisk;
      const positionNotional = qty * e;
      const margin = positionNotional / lev;

      const tpDistance = perUnitRisk * rr;
      const tp1 = direction === "long" ? e + perUnitRisk * 1 : e - perUnitRisk * 1;
      const tp2 = direction === "long" ? e + perUnitRisk * rr : e - perUnitRisk * rr;
      const tp3 = direction === "long" ? e + perUnitRisk * (rr * 1.5) : e - perUnitRisk * (rr * 1.5);

      setResult({
        riskAmount,
        quantity: qty,
        positionNotional,
        margin,
        rr,
        tp1,
        tp2,
        tp3,
      });
    } catch {
      setError("Erreur de calcul. Vérifiez vos valeurs.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">AI Position Sizer</h1>
              <p className="text-sm text-gray-400">Calculez la taille optimale de vos positions (Spot & Futures)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Paramètres
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Capital du compte ($)</label>
                <input
                  type="number"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500/50"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Risque par trade (%)</label>
                <input
                  type="number"
                  value={risk}
                  onChange={(e) => setRisk(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500/50"
                  placeholder="1"
                  step="0.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Prix d'entrée ($)</label>
                  <input
                    type="number"
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500/50"
                    placeholder="97000"
                    step="any"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Stop-Loss ($)</label>
                  <input
                    type="number"
                    value={stop}
                    onChange={(e) => setStop(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500/50"
                    placeholder="95000"
                    step="any"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Levier</label>
                  <input
                    type="number"
                    value={leverage}
                    onChange={(e) => setLeverage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500/50"
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Ratio R:R cible</label>
                  <input
                    type="number"
                    value={rrTarget}
                    onChange={(e) => setRrTarget(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500/50"
                    placeholder="2"
                    step="0.5"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Direction</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDirection("long")}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      direction === "long"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/[0.04] text-gray-400 border border-white/[0.06]"
                    }`}
                  >
                    🟢 Long
                  </button>
                  <button
                    onClick={() => setDirection("short")}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      direction === "short"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-white/[0.04] text-gray-400 border border-white/[0.06]"
                    }`}
                  >
                    🔴 Short
                  </button>
                </div>
              </div>

              <button
                onClick={calculate}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-sm hover:brightness-110 transition-all"
              >
                Calculer la Position
              </button>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {result ? (
              <>
                <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
                  <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    Résultats
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-amber-400" />
                        <p className="text-xs text-gray-500 font-semibold">Risque ($)</p>
                      </div>
                      <p className="text-xl font-extrabold text-amber-400">${result.riskAmount.toFixed(2)}</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-4">
                      <p className="text-xs text-gray-500 font-semibold mb-1">Quantité</p>
                      <p className="text-xl font-extrabold">{result.quantity.toFixed(6)}</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-4">
                      <p className="text-xs text-gray-500 font-semibold mb-1">Taille Position</p>
                      <p className="text-xl font-extrabold">${result.positionNotional.toFixed(2)}</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-4">
                      <p className="text-xs text-gray-500 font-semibold mb-1">Marge Requise</p>
                      <p className="text-xl font-extrabold">${result.margin.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
                  <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Take-Profit Suggérés
                  </h2>
                  <div className="space-y-3">
                    {[
                      { label: "TP1 (1:1)", value: result.tp1, color: "text-cyan-400" },
                      { label: `TP2 (1:${result.rr})`, value: result.tp2, color: "text-emerald-400" },
                      { label: `TP3 (1:${(result.rr * 1.5).toFixed(1)})`, value: result.tp3, color: "text-purple-400" },
                    ].map((tp, i) => (
                      <div key={i} className="flex items-center justify-between py-3 px-4 bg-black/20 rounded-xl">
                        <span className="text-sm font-semibold text-gray-400">{tp.label}</span>
                        <span className={`text-sm font-bold ${tp.color}`}>
                          ${tp.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-10 text-center">
                <Calculator className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Entrez vos paramètres</h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto">
                  Remplissez le formulaire à gauche pour calculer la taille optimale de votre position et les niveaux de take-profit.
                </p>
              </div>
            )}

            {/* Tips */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-bold mb-3">💡 Conseils de gestion du risque</h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  Ne risquez jamais plus de 1-2% de votre capital par trade
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  Visez un ratio risque/récompense minimum de 1:2
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  Utilisez toujours un stop-loss pour protéger votre capital
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  Avec du levier, réduisez proportionnellement votre taille de position
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}