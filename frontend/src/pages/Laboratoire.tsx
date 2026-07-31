// Laboratoire de Test — page unifiée : Backtesting Visuel + Simulation de Trading + Simulateur Stratégie IA
import { useSearchParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { FlaskConical, Activity, Gamepad2, Target } from "lucide-react";
import BacktestContent from "./BacktestingVisuel";
import SimulationContent from "./Simulation";
import AllocationContent from "./SimulateurStrategieIA";

const TABS = [
  { id: "backtest", label: "Backtesting Visuel", icon: Activity, desc: "Testez 5 stratégies sur l'historique réel Binance" },
  { id: "simulation", label: "Simulation de Trading", icon: Gamepad2, desc: "Entraînez-vous avec un portefeuille virtuel, sans risque" },
  { id: "allocation", label: "Stratégie de Portefeuille IA", icon: Target, desc: "Simulez une allocation et projetez vos gains" },
];

export default function Laboratoire() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get("tab");
  const tab = raw === "simulation" || raw === "allocation" ? raw : "backtest";

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
        <PageHeader
          icon={<FlaskConical className="w-6 h-6" />}
          title="Laboratoire de Test"
          subtitle="Testez avant d'investir : backtestez des stratégies sur données réelles, entraînez-vous en simulation et projetez votre allocation de portefeuille."
          accentColor="purple"
          steps={[
            { n: "1", title: "Backtestez", desc: "Vérifiez ce qu'une stratégie aurait donné sur l'historique réel de Binance." },
            { n: "2", title: "Entraînez-vous", desc: "Tradez avec un portefeuille virtuel pour pratiquer sans risquer un dollar." },
            { n: "3", title: "Projetez", desc: "Simulez une allocation et visualisez son évolution potentielle." },
          ]}
        />

        <div data-testid="labo-tabs" className="mb-4 px-4 md:px-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-[1440px] mx-auto">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                data-testid={`labo-tab-${t.id}`}
                onClick={() => setSearchParams(t.id === "backtest" ? {} : { tab: t.id })}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${active ? "border-purple-400/40 bg-purple-500/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"}`}
              >
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${active ? "bg-purple-500/20" : "bg-white/[0.05]"}`}>
                  <t.icon className={`w-4.5 h-4.5 ${active ? "text-purple-300" : "text-gray-400"}`} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${active ? "text-purple-200" : "text-white"}`}>{t.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {tab === "simulation" ? <SimulationContent /> : tab === "allocation" ? <AllocationContent /> : <BacktestContent />}

        <Footer />
      </main>
    </div>
  );
}
