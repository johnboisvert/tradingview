import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Calculator } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const CALC_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/b3c0b3a0-ae42-46d0-9f3a-9f12780c9e10.png";

export default function Calculatrice() {
  const [tab, setTab] = useState<"profit" | "position" | "dca" | "liquidation">("profit");

  // Profit Calculator
  const [entryPrice, setEntryPrice] = useState("50000");
  const [exitPrice, setExitPrice] = useState("60000");
  const [investment, setInvestment] = useState("1000");
  const [leverage, setLeverage] = useState("1");
  const [direction, setDirection] = useState<"long" | "short">("long");

  // Position Sizer
  const [capital, setCapital] = useState("10000");
  const [riskPct, setRiskPct] = useState("2");
  const [stopLossPct, setStopLossPct] = useState("5");

  // DCA
  const [dcaAmount, setDcaAmount] = useState("100");
  const [dcaFreq, setDcaFreq] = useState("4"); // per month
  const [dcaMonths, setDcaMonths] = useState("12");
  const [dcaGrowth, setDcaGrowth] = useState("10"); // monthly growth %

  // Liquidation
  const [liqEntry, setLiqEntry] = useState("50000");
  const [liqLeverage, setLiqLeverage] = useState("10");
  const [liqDirection, setLiqDirection] = useState<"long" | "short">("long");

  // Calculations
  const ep = parseFloat(entryPrice) || 0;
  const xp = parseFloat(exitPrice) || 0;
  const inv = parseFloat(investment) || 0;
  const lev = parseFloat(leverage) || 1;
  const pctChange = ep > 0 ? ((direction === "long" ? xp - ep : ep - xp) / ep) * 100 : 0;
  const profitPct = pctChange * lev;
  const profitUSD = inv * (profitPct / 100);
  const finalValue = inv + profitUSD;

  const cap = parseFloat(capital) || 0;
  const rp = parseFloat(riskPct) || 0;
  const slp = parseFloat(stopLossPct) || 0;
  const riskAmount = cap * (rp / 100);
  const positionSize = slp > 0 ? riskAmount / (slp / 100) : 0;

  const da = parseFloat(dcaAmount) || 0;
  const df = parseFloat(dcaFreq) || 1;
  const dm = parseFloat(dcaMonths) || 1;
  const dg = parseFloat(dcaGrowth) || 0;
  const totalInvested = da * df * dm;
  let dcaValue = 0;
  for (let m = 0; m < dm; m++) {
    dcaValue = (dcaValue + da * df) * (1 + dg / 100);
  }

  const le = parseFloat(liqEntry) || 0;
  const ll = parseFloat(liqLeverage) || 1;
  const liqPrice = liqDirection === "long" ? le * (1 - 1 / ll) : le * (1 + 1 / ll);

  const tabs = [
    { key: "profit" as const, label: "💰 Profit/Perte", desc: "Calculez vos gains potentiels" },
    { key: "position" as const, label: "📐 Taille Position", desc: "Calculez la taille optimale" },
    { key: "dca" as const, label: "📊 DCA Simulator", desc: "Simulez votre stratégie DCA" },
    { key: "liquidation" as const, label: "⚠️ Liquidation", desc: "Calculez le prix de liquidation" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
      <PageHeader
          icon={<Calculator className="w-6 h-6" />}
          title="Calculatrice Trading"
          subtitle="Calculez instantanément vos profits/pertes potentiels, la taille de vos positions et vos niveaux de liquidation. Un outil indispensable avant chaque trade."
          accentColor="cyan"
          steps={[
            { n: "1", title: "Entrez les paramètres", desc: "Renseignez le prix d'entrée, le prix cible, le stop loss et le montant investi pour calculer votre P&L potentiel." },
            { n: "2", title: "Vérifiez le ratio R/R", desc: "Un bon trade a un ratio risque/récompense d'au moins 1:2. Si votre ratio est inférieur, reconsidérez votre setup." },
            { n: "3", title: "Calculez le levier", desc: "Pour le trading avec levier, entrez le multiplicateur pour voir l'impact sur vos gains et pertes potentiels et votre prix de liquidation." },
          ]}
        />
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={CALC_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Calculator className="w-7 h-7 text-emerald-400" />
                <h1 className="text-2xl font-extrabold">Calculatrice Trading</h1>
              </div>
              <p className="text-sm text-gray-400">Profit/Perte • Taille de position • DCA • Liquidation</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                tab === t.key ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-[#111827] text-gray-400 border border-white/[0.06] hover:bg-white/[0.04]"
              }`}>{t.label}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">{tabs.find((t) => t.key === tab)?.label} — Paramètres</h2>

            {tab === "profit" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {(["long", "short"] as const).map((d) => (
                    <button key={d} onClick={() => setDirection(d)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        direction === d ? (d === "long" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30") : "bg-white/[0.04] text-gray-400 border border-white/[0.06]"
                      }`}>{d === "long" ? "🟢 Long" : "🔴 Short"}</button>
                  ))}
                </div>
                {[
                  { label: "Prix d'entrée ($)", val: entryPrice, set: setEntryPrice },
                  { label: "Prix de sortie ($)", val: exitPrice, set: setExitPrice },
                  { label: "Investissement ($)", val: investment, set: setInvestment },
                  { label: "Levier (x)", val: leverage, set: setLeverage },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-xs text-gray-500 font-semibold mb-1 block">{f.label}</label>
                    <input type="number" value={f.val} onChange={(e) => f.set(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                  </div>
                ))}
              </div>
            )}

            {tab === "position" && (
              <div className="space-y-4">
                {[
                  { label: "Capital Total ($)", val: capital, set: setCapital },
                  { label: "Risque par Trade (%)", val: riskPct, set: setRiskPct },
                  { label: "Stop Loss (%)", val: stopLossPct, set: setStopLossPct },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-xs text-gray-500 font-semibold mb-1 block">{f.label}</label>
                    <input type="number" value={f.val} onChange={(e) => f.set(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                  </div>
                ))}
              </div>
            )}

            {tab === "dca" && (
              <div className="space-y-4">
                {[
                  { label: "Montant par achat ($)", val: dcaAmount, set: setDcaAmount },
                  { label: "Achats par mois", val: dcaFreq, set: setDcaFreq },
                  { label: "Durée (mois)", val: dcaMonths, set: setDcaMonths },
                  { label: "Croissance mensuelle estimée (%)", val: dcaGrowth, set: setDcaGrowth },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-xs text-gray-500 font-semibold mb-1 block">{f.label}</label>
                    <input type="number" value={f.val} onChange={(e) => f.set(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                  </div>
                ))}
              </div>
            )}

            {tab === "liquidation" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {(["long", "short"] as const).map((d) => (
                    <button key={d} onClick={() => setLiqDirection(d)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        liqDirection === d ? (d === "long" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30") : "bg-white/[0.04] text-gray-400 border border-white/[0.06]"
                      }`}>{d === "long" ? "🟢 Long" : "🔴 Short"}</button>
                  ))}
                </div>
                {[
                  { label: "Prix d'entrée ($)", val: liqEntry, set: setLiqEntry },
                  { label: "Levier (x)", val: liqLeverage, set: setLiqLeverage },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-xs text-gray-500 font-semibold mb-1 block">{f.label}</label>
                    <input type="number" value={f.val} onChange={(e) => f.set(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">📊 Résultats</h2>

            {tab === "profit" && (
              <div className="space-y-4">
                <div className="bg-black/20 rounded-xl p-5 border border-white/[0.04] text-center">
                  <p className="text-gray-400 text-sm mb-2">Profit / Perte</p>
                  <p className={`text-4xl font-black ${profitUSD >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {profitUSD >= 0 ? "+" : ""}{profitUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })} $
                  </p>
                  <p className={`text-lg font-bold mt-1 ${profitPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {profitPct >= 0 ? "+" : ""}{profitPct.toFixed(2)}%
                  </p>
                </div>
                {[
                  { label: "Investissement", value: `$${inv.toLocaleString()}` },
                  { label: "Valeur Finale", value: `$${finalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}` },
                  { label: "Variation Prix", value: `${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(2)}%` },
                  { label: "Levier", value: `${lev}x` },
                  { label: "Direction", value: direction === "long" ? "🟢 Long" : "🔴 Short" },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-gray-400 text-sm">{r.label}</span>
                    <span className="text-white font-bold text-sm">{r.value}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === "position" && (
              <div className="space-y-4">
                <div className="bg-black/20 rounded-xl p-5 border border-white/[0.04] text-center">
                  <p className="text-gray-400 text-sm mb-2">Taille de Position Recommandée</p>
                  <p className="text-4xl font-black text-cyan-400">${positionSize.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
                </div>
                {[
                  { label: "Capital", value: `$${cap.toLocaleString()}` },
                  { label: "Risque", value: `${rp}% = $${riskAmount.toFixed(2)}` },
                  { label: "Stop Loss", value: `${slp}%` },
                  { label: "Ratio Risque/Position", value: `1:${slp > 0 ? (100 / slp).toFixed(1) : "∞"}` },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-gray-400 text-sm">{r.label}</span>
                    <span className="text-white font-bold text-sm">{r.value}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === "dca" && (
              <div className="space-y-4">
                <div className="bg-black/20 rounded-xl p-5 border border-white/[0.04] text-center">
                  <p className="text-gray-400 text-sm mb-2">Valeur Estimée du Portfolio</p>
                  <p className="text-4xl font-black text-emerald-400">${dcaValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
                </div>
                {[
                  { label: "Total Investi", value: `$${totalInvested.toLocaleString()}` },
                  { label: "Profit Estimé", value: `$${(dcaValue - totalInvested).toLocaleString("en-US", { maximumFractionDigits: 2 })}` },
                  { label: "ROI", value: `${totalInvested > 0 ? (((dcaValue - totalInvested) / totalInvested) * 100).toFixed(1) : 0}%` },
                  { label: "Nombre d'achats", value: `${Math.round(df * dm)}` },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-gray-400 text-sm">{r.label}</span>
                    <span className="text-white font-bold text-sm">{r.value}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === "liquidation" && (
              <div className="space-y-4">
                <div className="bg-black/20 rounded-xl p-5 border border-white/[0.04] text-center">
                  <p className="text-gray-400 text-sm mb-2">Prix de Liquidation</p>
                  <p className="text-4xl font-black text-red-400">${liqPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
                </div>
                {[
                  { label: "Prix d'entrée", value: `$${le.toLocaleString()}` },
                  { label: "Levier", value: `${ll}x` },
                  { label: "Direction", value: liqDirection === "long" ? "🟢 Long" : "🔴 Short" },
                  { label: "Distance", value: `${Math.abs(((liqPrice - le) / le) * 100).toFixed(2)}%` },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-gray-400 text-sm">{r.label}</span>
                    <span className="text-white font-bold text-sm">{r.value}</span>
                  </div>
                ))}
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mt-4">
                  <p className="text-red-400 text-sm font-bold">⚠️ Attention</p>
                  <p className="text-gray-400 text-xs mt-1">Un levier élevé augmente considérablement le risque de liquidation. Utilisez toujours un stop loss.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}