import { useState } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/Sidebar";
import { Calculator, Shield, Target, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

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
  const { t } = useTranslation();
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
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
        <div className="max-w-[1440px] mx-auto px-6 py-6">
          <PageHeader
            icon={<Calculator className="w-6 h-6" />}
            title={t("pages.positionSizer.title")}
            subtitle={t("pages.positionSizer.subtitle")}
            accentColor="blue"
            steps={[
              { n: "1", title: "Entrez votre capital", desc: "Indiquez votre capital total disponible pour le trading. L'IA calculera la taille de position basée sur un pourcentage de ce capital." },
              { n: "2", title: "Définissez votre risque", desc: "Entrez votre pourcentage de risque par trade (recommandé : 1-2%) et votre stop loss en pourcentage ou en prix." },
              { n: "3", title: "Obtenez la taille optimale", desc: "L'IA calcule le nombre de tokens à acheter, le montant en dollars et le ratio risque/récompense pour votre setup." },
            ]}
          />

          {/* ===== HERO premium ===== */}
          <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]">
            <div className="absolute inset-0 bg-[#0A0E1A]" />
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/22 blur-3xl" style={{ animation: "ps-pulse 6s ease-in-out infinite" }} />
            <div className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full bg-cyan-500/22 blur-3xl" style={{ animation: "ps-pulse 8s ease-in-out infinite reverse" }} />
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }} />
            <div className="relative z-10 flex items-center gap-4 px-6 md:px-10 py-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/40 flex items-center justify-center" style={{ boxShadow: "0 0 30px rgba(59,130,246,0.3)" }}>
                <Calculator className="w-7 h-7 text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                    AI Position Sizer
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-500/40 bg-blue-500/10 text-blue-300">
                    <Shield className="w-2.5 h-2.5" /> Money Management
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-400">Taille optimale · Capital · Risque · Stop Loss</p>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes ps-pulse {
              0%, 100% { transform: scale(1) translate(0,0); opacity: 0.3; }
              50% { transform: scale(1.2) translate(20px,-10px); opacity: 0.45; }
            }
          `}</style>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 overflow-hidden">
            <div className="absolute -top-20 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-15 bg-blue-500" />
            <h2 className="relative text-base md:text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <Shield className="w-4 h-4 text-blue-400" />
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
        </div>
        <Footer />
      </main>
    </div>
  );
}