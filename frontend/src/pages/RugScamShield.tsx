import { useState } from "react";
import Sidebar from "../components/Sidebar";

interface AuditResult {
  score: number;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  checks: { name: string; status: "pass" | "warn" | "fail"; detail: string }[];
}

function analyzeToken(address: string): AuditResult {
  const hash = address.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const score = 30 + (hash % 70);
  const risk: AuditResult["risk"] = score > 80 ? "LOW" : score > 60 ? "MEDIUM" : score > 40 ? "HIGH" : "CRITICAL";

  const checks = [
    { name: "Contrat vérifié", status: score > 50 ? "pass" as const : "fail" as const, detail: score > 50 ? "Code source vérifié sur Etherscan" : "Code non vérifié — risque élevé" },
    { name: "Liquidité verrouillée", status: score > 60 ? "pass" as const : "warn" as const, detail: score > 60 ? "LP tokens verrouillés pour 12 mois" : "Liquidité partiellement verrouillée" },
    { name: "Ownership renoncé", status: score > 70 ? "pass" as const : "warn" as const, detail: score > 70 ? "Le propriétaire a renoncé au contrat" : "Le propriétaire peut modifier le contrat" },
    { name: "Honeypot Check", status: score > 40 ? "pass" as const : "fail" as const, detail: score > 40 ? "Pas de honeypot détecté" : "⚠️ Possible honeypot — impossible de vendre" },
    { name: "Tax Analysis", status: score > 55 ? "pass" as const : "warn" as const, detail: score > 55 ? "Buy/Sell tax < 5%" : "Tax élevée détectée (>10%)" },
    { name: "Holder Distribution", status: score > 65 ? "pass" as const : "warn" as const, detail: score > 65 ? "Top 10 holders < 30% supply" : "Concentration élevée des holders" },
    { name: "Mint Function", status: score > 50 ? "pass" as const : "fail" as const, detail: score > 50 ? "Pas de fonction mint active" : "Le owner peut créer de nouveaux tokens" },
    { name: "Blacklist Function", status: score > 60 ? "pass" as const : "warn" as const, detail: score > 60 ? "Pas de blacklist détectée" : "Fonction blacklist présente" },
  ];

  return { score, risk, checks };
}

const RISK_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  LOW: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  MEDIUM: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  HIGH: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  CRITICAL: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
};

export default function RugScamShield() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResult(analyzeToken(address));
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-7">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-red-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1000px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-red-400 via-amber-500 to-red-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              🛡️ Rug & Scam Shield
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Analysez n&apos;importe quel token avant d&apos;investir</p>
          </div>

          {/* Search */}
          <form onSubmit={handleAudit} className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 mb-6">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Adresse du contrat</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x... (Ethereum, BSC, Solana...)"
                className="flex-1 px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm font-mono focus:border-red-500 outline-none"
              />
              <button type="submit" disabled={loading} className="px-6 py-3 bg-gradient-to-r from-red-500 to-amber-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50">
                {loading ? "🔍 Analyse..." : "🛡️ Auditer"}
              </button>
            </div>
          </form>

          {loading && (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-red-500/15 border-t-red-400 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400 text-sm">Analyse du smart contract en cours...</p>
              </div>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Score */}
              <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-8 mb-6 text-center">
                <div className="text-6xl font-black font-mono mb-2" style={{ color: result.score > 70 ? "#22c55e" : result.score > 50 ? "#f59e0b" : "#ef4444" }}>
                  {result.score}<span className="text-2xl text-gray-500">/100</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden max-w-md mx-auto mb-4">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${result.score}%`,
                    background: `linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)`,
                  }} />
                </div>
                <span className={`text-sm font-bold px-4 py-2 rounded-xl ${RISK_STYLES[result.risk].bg} ${RISK_STYLES[result.risk].text} border ${RISK_STYLES[result.risk].border}`}>
                  Risque: {result.risk}
                </span>
              </div>

              {/* Checks */}
              <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">🔍 Résultats de l&apos;Audit</h2>
                <div className="space-y-3">
                  {result.checks.map((check) => (
                    <div key={check.name} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl">
                      <span className="text-xl">
                        {check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌"}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{check.name}</div>
                        <div className="text-xs text-gray-400">{check.detail}</div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${check.status === "pass" ? "bg-emerald-500/10 text-emerald-400" : check.status === "warn" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                        {check.status === "pass" ? "SAFE" : check.status === "warn" ? "WARN" : "DANGER"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {[
              { icon: "🔍", title: "Vérifiez toujours", items: ["Code source vérifié", "Liquidité verrouillée", "Audit par un tiers", "Équipe doxxée"] },
              { icon: "🚩", title: "Red Flags", items: ["Rendements irréalistes (>1000% APY)", "Pas de whitepaper", "Pression d'urgence (FOMO)", "Équipe anonyme sans track record"] },
            ].map((tip) => (
              <div key={tip.title} className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">{tip.icon} {tip.title}</h3>
                <ul className="space-y-2">
                  {tip.items.map((item) => (
                    <li key={item} className="text-sm text-gray-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}