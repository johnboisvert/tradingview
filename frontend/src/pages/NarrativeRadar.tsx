import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

interface Narrative {
  name: string;
  icon: string;
  score: number;
  trend: "hot" | "rising" | "stable" | "declining";
  mentions: number;
  topCoins: string[];
  description: string;
}

const NARRATIVES: Narrative[] = [
  { name: "AI & Machine Learning", icon: "🤖", score: 95, trend: "hot", mentions: 45200, topCoins: ["NEAR", "FET", "RNDR", "TAO", "AGIX"], description: "L'IA est le narratif dominant. Les tokens AI surperforment le marché." },
  { name: "Real World Assets (RWA)", icon: "🏛️", score: 88, trend: "hot", mentions: 32100, topCoins: ["ONDO", "MKR", "COMP", "AAVE", "SNX"], description: "Tokenisation d'actifs réels : immobilier, obligations, commodités." },
  { name: "Layer 2 Scaling", icon: "⚡", score: 82, trend: "rising", mentions: 28500, topCoins: ["ARB", "OP", "MATIC", "STRK", "ZK"], description: "Les solutions L2 continuent d'attirer des utilisateurs et du TVL." },
  { name: "DePIN", icon: "📡", score: 78, trend: "rising", mentions: 21300, topCoins: ["HNT", "RNDR", "FIL", "AR", "THETA"], description: "Infrastructure physique décentralisée : stockage, compute, IoT." },
  { name: "Gaming & Metaverse", icon: "🎮", score: 65, trend: "stable", mentions: 18900, topCoins: ["IMX", "GALA", "AXS", "SAND", "MANA"], description: "Le gaming crypto évolue vers des modèles plus durables." },
  { name: "DeFi 2.0", icon: "🏦", score: 72, trend: "rising", mentions: 25600, topCoins: ["UNI", "AAVE", "CRV", "GMX", "DYDX"], description: "Nouvelle vague DeFi avec des protocoles plus efficaces." },
  { name: "Memecoins", icon: "🐸", score: 60, trend: "declining", mentions: 42000, topCoins: ["DOGE", "SHIB", "PEPE", "WIF", "BONK"], description: "Les memecoins perdent en momentum après la phase euphorique." },
  { name: "Bitcoin Ecosystem", icon: "₿", score: 85, trend: "hot", mentions: 38700, topCoins: ["BTC", "STX", "ORDI", "SATS", "RUNE"], description: "Ordinals, BRC-20, et Layer 2 Bitcoin transforment l'écosystème." },
  { name: "Privacy & ZK", icon: "🔒", score: 70, trend: "stable", mentions: 15200, topCoins: ["ZEC", "XMR", "DUSK", "MINA", "ALEO"], description: "Zero-knowledge proofs et confidentialité restent des thèmes clés." },
  { name: "SocialFi", icon: "💬", score: 55, trend: "declining", mentions: 12800, topCoins: ["DESO", "CYBER", "LENS", "FRIEND"], description: "Les réseaux sociaux décentralisés cherchent encore leur product-market fit." },
];

const TREND_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  hot: { bg: "bg-red-500/10", text: "text-red-400", label: "🔥 HOT" },
  rising: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "📈 Rising" },
  stable: { bg: "bg-gray-500/10", text: "text-gray-400", label: "➡️ Stable" },
  declining: { bg: "bg-amber-500/10", text: "text-amber-400", label: "📉 Declining" },
};

export default function NarrativeRadar() {
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setNarratives(NARRATIVES);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
      <PageHeader
          icon={<span className="text-lg">📡</span>}
          title="Narrative Radar"
          subtitle="Identifiez les narratives dominantes du marché crypto : quels secteurs (AI, DeFi, GameFi, L2...) captent l’attention et le capital des investisseurs en ce moment."
          accentColor="pink"
          steps={[
            { n: "1", title: "Repérez les tendances", desc: "Les narratives avec le score le plus élevé sont celles qui dominent le marché actuellement. Elles attirent le plus de capital." },
            { n: "2", title: "Évaluez la force", desc: "Un score en hausse indique une narrative émergente. Un score en baisse peut signaler une rotation vers d’autres secteurs." },
            { n: "3", title: "Positionnez-vous", desc: "Investissez dans les cryptos liées aux narratives dominantes pour bénéficier de l’effet de momentum sectoriel." },
          ]}
        />
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              🎯 Narrative Radar
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Détectez les narratifs crypto dominants et émergents</p>
            <div className="inline-flex items-center gap-2 mt-4 bg-purple-500/10 border border-purple-500/25 rounded-full px-5 py-1.5 text-xs text-purple-400 font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#8b5cf6] animate-pulse" />
              LIVE — Social Analysis
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-11 h-11 border-3 border-purple-500/15 border-t-purple-400 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Top 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {narratives.slice(0, 3).map((n, i) => (
                  <div key={n.name} className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 hover:border-purple-500/20 transition-all hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute top-3 right-3 text-4xl opacity-10">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>
                    <div className="text-4xl mb-3">{n.icon}</div>
                    <h3 className="text-lg font-bold text-white mb-1">{n.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${TREND_STYLES[n.trend].bg} ${TREND_STYLES[n.trend].text}`}>
                        {TREND_STYLES[n.trend].label}
                      </span>
                      <span className="text-xs text-gray-500">{n.mentions.toLocaleString()} mentions</span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Score</span>
                        <span className="text-purple-400 font-bold">{n.score}/100</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400" style={{ width: `${n.score}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-3 leading-relaxed">{n.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {n.topCoins.map((c) => (
                        <span key={c} className="text-xs bg-white/[0.04] text-gray-300 px-2 py-1 rounded-lg font-mono">{c}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* All Narratives */}
              <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">📊 Tous les Narratifs</h2>
                <div className="space-y-3">
                  {narratives.map((n, i) => (
                    <div key={n.name} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                      <span className="text-sm font-bold text-gray-500 w-6">#{i + 1}</span>
                      <span className="text-2xl">{n.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{n.name}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${TREND_STYLES[n.trend].bg} ${TREND_STYLES[n.trend].text}`}>
                            {TREND_STYLES[n.trend].label}
                          </span>
                        </div>
                        <div className="flex gap-1.5 mt-1">
                          {n.topCoins.slice(0, 3).map((c) => (
                            <span key={c} className="text-xs text-gray-500 font-mono">{c}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black font-mono text-purple-400">{n.score}</div>
                        <div className="text-xs text-gray-500">{n.mentions.toLocaleString()} mentions</div>
                      </div>
                      <div className="w-24 hidden sm:block">
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400" style={{ width: `${n.score}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}