// Analyse Technique — page unifiée : Screener marché + Analyse d'une crypto + Prédiction Crypto IA
import { useSearchParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { BarChart3, SlidersHorizontal, LineChart, Brain } from "lucide-react";
import ScreenerContent from "./ScreenerTechnique";
import IndicateursContent from "./TechnicalAnalysis";
import CryptoIAContent from "./CryptoIA";

const TABS = [
  { id: "screener", label: "Screener marché", icon: SlidersHorizontal, desc: "200 cryptos filtrées par 7 indicateurs" },
  { id: "indicateurs", label: "Analyse d'une crypto", icon: LineChart, desc: "RSI, MACD, Bollinger, EMA, S/R en direct" },
  { id: "ia", label: "Prédiction Crypto IA", icon: Brain, desc: "Score de force + probabilités par IA" },
];

export default function AnalyseTechnique() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "screener";

  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#070B14]">
        <PageHeader
          icon={<BarChart3 className="w-6 h-6" />}
          title="Analyse Technique"
          subtitle="Tout votre arsenal d'analyse au même endroit : screener du marché complet, indicateurs détaillés par crypto et prédictions IA."
          accentColor="cyan"
          steps={[
            { n: "1", title: "Screener marché", desc: "Filtrez 200 cryptos par RSI, tendance, signal BUY/SELL et multi-timeframes réels." },
            { n: "2", title: "Analyse détaillée", desc: "Zoomez sur une crypto : RSI, MACD, Bollinger, EMA 20/50, supports et résistances." },
            { n: "3", title: "Prédiction IA", desc: "L'IA calcule un score de force et des probabilités de mouvement pour chaque crypto." },
          ]}
        />

        {/* Onglets */}
        <div data-testid="analyse-tabs" className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                data-testid={`analyse-tab-${t.id}`}
                onClick={() => setSearchParams(t.id === "screener" ? {} : { tab: t.id })}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                  active
                    ? "border-cyan-400/40 bg-cyan-500/10"
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${active ? "bg-cyan-500/20" : "bg-white/[0.05]"}`}>
                  <t.icon className={`w-4.5 h-4.5 ${active ? "text-cyan-300" : "text-gray-400"}`} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${active ? "text-cyan-200" : "text-white"}`}>{t.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {tab === "indicateurs" ? <IndicateursContent /> : tab === "ia" ? <CryptoIAContent /> : <ScreenerContent />}

        <Footer />
      </main>
    </div>
  );
}
