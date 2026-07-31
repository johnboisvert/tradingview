// Cycle du Marché — page unifiée : Phase du bullrun + Régime de marché
import { useSearchParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { Rocket, Activity } from "lucide-react";
import PhaseContent from "./BullrunPhase";
import RegimeContent from "./MarketRegime";

const TABS = [
  { id: "phase", label: "Phase du cycle", icon: Rocket, desc: "Où en est le bullrun ? Du bear market à l'euphorie, phase par phase" },
  { id: "regime", label: "Régime de marché", icon: Activity, desc: "Haussier, baissier ou range : le régime actuel détecté par l'IA" },
];

export default function CycleMarche() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "regime" ? "regime" : "phase";

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
        <PageHeader
          icon={<span className="text-lg">🚀</span>}
          title="Cycle du Marché"
          subtitle="La grande image en un coup d'œil : la phase actuelle du cycle crypto et le régime de marché détecté par l'IA."
          accentColor="amber"
          steps={[
            { n: "1", title: "Phase du cycle", desc: "Du fond du bear market au sommet de l'euphorie : identifiez où on en est." },
            { n: "2", title: "Régime de marché", desc: "Haussier, baissier ou range — adaptez votre stratégie au contexte." },
            { n: "3", title: "Décidez mieux", desc: "Accumulez dans la peur, allégez dans l'euphorie, patientez dans le range." },
          ]}
        />

        <div data-testid="cycle-tabs" className="mb-4 px-4 md:px-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[1440px] mx-auto">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                data-testid={`cycle-tab-${t.id}`}
                onClick={() => setSearchParams(t.id === "phase" ? {} : { tab: t.id })}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${active ? "border-amber-400/40 bg-amber-500/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"}`}
              >
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${active ? "bg-amber-500/20" : "bg-white/[0.05]"}`}>
                  <t.icon className={`w-4.5 h-4.5 ${active ? "text-amber-300" : "text-gray-400"}`} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${active ? "text-amber-200" : "text-white"}`}>{t.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {tab === "regime" ? <RegimeContent /> : <PhaseContent />}

        <Footer />
      </main>
    </div>
  );
}
