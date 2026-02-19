import Sidebar from "@/components/Sidebar";
import { ExternalLink } from "lucide-react";

export default function AltcoinSeason() {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="ml-[260px] min-h-screen relative">
        <div className="relative z-10 max-w-[1440px] mx-auto p-7 pb-20">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <h1 className="text-[clamp(28px,4vw,42px)] font-black tracking-[-1px] bg-gradient-to-r from-[#22c55e] via-[#f7931a] to-[#22c55e] bg-clip-text text-transparent">
              🔄 Altcoin Season Index
            </h1>
            <p className="text-[#64748b] text-sm mt-2">
              Index de référence mondial — Source: BlockchainCenter.net
            </p>
            <a
              href="https://www.blockchaincenter.net/en/altcoin-season-index/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-xs text-[#818cf8] hover:text-[#a5b4fc] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ouvrir sur BlockchainCenter.net
            </a>
          </div>

          {/* BlockchainCenter Altcoin Season Index */}
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl overflow-hidden mb-6">
            <div className="rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: "700px" }}>
              <iframe
                src="https://www.blockchaincenter.net/en/altcoin-season-index/"
                title="Altcoin Season Index - BlockchainCenter"
                className="w-full h-full border-0"
                style={{ filter: "brightness(0.95)" }}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8">
            <h3 className="text-lg font-extrabold mb-6 flex items-center gap-2">
              <span>📖</span> Comment ça marche ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h4 className="text-[15px] font-extrabold mb-3 text-[#f7931a]">🟠 Bitcoin Season (0-25)</h4>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  Moins de 25% des top 50 altcoins surperforment BTC sur 90 jours. Les investisseurs se réfugient dans Bitcoin.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h4 className="text-[15px] font-extrabold mb-3 text-[#eab308]">⚖️ Zone Neutre (25-75)</h4>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  Pas de tendance claire. Le marché est partagé entre BTC et altcoins.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h4 className="text-[15px] font-extrabold mb-3 text-[#22c55e]">🟢 Altcoin Season (75-100)</h4>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  75%+ des top 50 altcoins surperforment BTC sur 90 jours. C&apos;est l&apos;Altseason !
                </p>
              </div>
            </div>
            <p className="text-[#64748b] text-xs mt-5 text-center">
              Source: blockchaincenter.net — L&apos;index de référence mondial pour l&apos;Altcoin Season
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}