// Signaux IA — page unifiée : Signaux BUY/SELL + Scanner d'Opportunités (top 200)
import { useSearchParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { Radio, Crosshair } from "lucide-react";
import SignauxContent from "./AISignals";
import OpportunitesContent from "./OpportunityScanner";

const TABS = [
  { id: "signaux", label: "Signaux BUY / SELL", icon: Radio, desc: "Signaux d'achat et de vente notés par l'IA sur le top 200" },
  { id: "opportunites", label: "Scanner d'Opportunités", icon: Crosshair, desc: "Pumps, cassures et divergences détectées en temps réel" },
];

export default function SignauxIA() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "opportunites" ? "opportunites" : "signaux";

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
        <PageHeader
          icon={<span className="text-lg">📶</span>}
          title="Signaux IA"
          subtitle="Tous les signaux générés par l'IA sur le top 200 : recommandations BUY/SELL et opportunités détectées (pumps, cassures, divergences)."
          accentColor="blue"
          steps={[
            { n: "1", title: "Signaux BUY/SELL", desc: "L'IA note chaque crypto et émet des recommandations claires avec niveau de confiance." },
            { n: "2", title: "Opportunités", desc: "Le scanner détecte pumps, cassures et divergences dès qu'elles apparaissent." },
            { n: "3", title: "Agissez vite", desc: "Rafraîchissement automatique — les meilleures fenêtres durent rarement longtemps." },
          ]}
        />

        <div data-testid="signaux-tabs" className="mb-4 px-4 md:px-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[1440px] mx-auto">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                data-testid={`signaux-tab-${t.id}`}
                onClick={() => setSearchParams(t.id === "signaux" ? {} : { tab: t.id })}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${active ? "border-blue-400/40 bg-blue-500/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"}`}
              >
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${active ? "bg-blue-500/20" : "bg-white/[0.05]"}`}>
                  <t.icon className={`w-4.5 h-4.5 ${active ? "text-blue-300" : "text-gray-400"}`} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${active ? "text-blue-200" : "text-white"}`}>{t.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {tab === "opportunites" ? <OpportunitesContent /> : <SignauxContent />}

        <Footer />
      </main>
    </div>
  );
}
