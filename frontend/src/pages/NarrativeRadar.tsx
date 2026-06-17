import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { Radar, Sparkles, Flame, TrendingUp, MoveHorizontal, TrendingDown } from "lucide-react";

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

const TREND_STYLES: Record<string, { color: string; bg: string; label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  hot:       { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  label: "HOT",       Icon: Flame },
  rising:    { color: "#22c55e", bg: "rgba(34,197,94,0.12)",  label: "Rising",    Icon: TrendingUp },
  stable:    { color: "#94a3b8", bg: "rgba(148,163,184,0.12)",label: "Stable",    Icon: MoveHorizontal },
  declining: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Declining", Icon: TrendingDown },
};

// ====================== RADAR CHART ======================
function NarrativeRadarChart({ narratives }: { narratives: Narrative[] }) {
  const cx = 200, cy = 200, maxR = 160;
  const n = narratives.length;
  const angleStep = (2 * Math.PI) / n;

  const points = narratives.map((nar, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (nar.score / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      lx: cx + (maxR + 20) * Math.cos(angle),
      ly: cy + (maxR + 20) * Math.sin(angle),
      angle, name: nar.name, icon: nar.icon, score: nar.score,
    };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 400 400" className="w-full h-auto max-w-[480px] mx-auto">
      <defs>
        <radialGradient id="radarFill">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.15" />
        </radialGradient>
        <filter id="radarGlow"><feGaussianBlur stdDeviation="3" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {/* concentric grid */}
      {[0.25, 0.5, 0.75, 1].map((p, i) => (
        <circle key={i} cx={cx} cy={cy} r={maxR * p} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray={i === 3 ? "" : "3 3"} />
      ))}
      {/* spokes */}
      {points.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(p.angle)} y2={cy + maxR * Math.sin(p.angle)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* shape */}
      <path d={path} fill="url(#radarFill)" stroke="#a855f7" strokeWidth="2" strokeLinejoin="round" filter="url(#radarGlow)" opacity="0.9" />
      {/* point dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#a855f7" stroke="white" strokeWidth="1.5">
          <animate attributeName="r" values="3;5;3" dur={`${2 + i * 0.15}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* labels */}
      {points.map((p, i) => (
        <text key={i} x={p.lx} y={p.ly} fill="rgba(255,255,255,0.7)" fontSize="11" fontWeight="700" textAnchor={Math.abs(p.lx - cx) < 5 ? "middle" : p.lx > cx ? "start" : "end"} dominantBaseline="middle">
          {p.icon}
        </text>
      ))}
    </svg>
  );
}

export default function NarrativeRadar() {
  const { t } = useTranslation();
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setNarratives(NARRATIVES);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
        <PageHeader
          icon={<Radar className="w-5 h-5" />}
          title={t("pages.narrativeRadar.title")}
          subtitle={t("pages.narrativeRadar.subtitle")}
          accentColor="pink"
          steps={[
            { n: "1", title: t("pages.narrativeRadar.steps.1.title"), desc: t("pages.narrativeRadar.steps.1.desc") },
            { n: "2", title: t("pages.narrativeRadar.steps.2.title"), desc: t("pages.narrativeRadar.steps.2.desc") },
            { n: "3", title: t("pages.narrativeRadar.steps.3.title"), desc: t("pages.narrativeRadar.steps.3.desc") },
          ]}
        />

        <div className="relative z-10 max-w-[1440px] mx-auto p-4 md:p-6">
          {/* ===== HERO ===== */}
          <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]">
            <div className="absolute inset-0 bg-[#0A0E1A]" />
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-500/25 blur-3xl" style={{ animation: "nr-pulse 6s ease-in-out infinite" }} />
            <div className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full bg-pink-500/20 blur-3xl" style={{ animation: "nr-pulse 8s ease-in-out infinite reverse" }} />
            <div className="absolute -top-12 right-1/2 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl" style={{ animation: "nr-pulse 7s ease-in-out infinite" }} />
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }} />
            <div className="relative z-10 flex items-center gap-4 px-6 md:px-10 py-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center" style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3)" }}>
                <Radar className="w-7 h-7 text-purple-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                    Narrative Radar
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-purple-500/40 bg-purple-500/10 text-purple-300">
                    <Sparkles className="w-2.5 h-2.5" /> Live · Social Analysis
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-400">
                  Détectez les narratifs crypto dominants et émergents · {narratives.length} secteurs suivis
                </p>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes nr-pulse {
              0%, 100% { transform: scale(1) translate(0,0); opacity: 0.3; }
              50% { transform: scale(1.2) translate(20px,-10px); opacity: 0.45; }
            }
            @keyframes nr-fadeUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .nr-anim { animation: nr-fadeUp 0.6s ease-out both; }
          `}</style>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-11 h-11 border-[3px] border-purple-500/15 border-t-purple-400 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ===== RADAR + Top 3 ===== */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 mb-6">
                {/* Radar */}
                <div className="nr-anim lg:col-span-2 relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 overflow-hidden" style={{ animationDelay: "100ms" }}>
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-25 bg-purple-500" />
                  <div className="relative">
                    <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> Carte des Narratifs
                    </h2>
                    <NarrativeRadarChart narratives={narratives} />
                    <p className="text-[11px] text-gray-500 text-center mt-3">Plus une branche est étendue, plus le narratif est dominant.</p>
                  </div>
                </div>

                {/* Top 3 */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  {narratives.slice(0, 3).map((n, i) => {
                    const style = TREND_STYLES[n.trend];
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
                    return (
                      <div key={n.name}
                        className="nr-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border rounded-3xl p-5 transition-all hover:-translate-y-1 overflow-hidden"
                        style={{ animationDelay: `${150 + i * 80}ms`, borderColor: i === 0 ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)" }}
                      >
                        <div className="absolute -top-12 -right-8 w-32 h-32 rounded-full blur-3xl opacity-25" style={{ background: style.color }} />
                        <div className="absolute top-3 right-3 text-3xl opacity-15">{medal}</div>
                        <div className="relative">
                          <div className="text-4xl mb-2" style={{ filter: i === 0 ? `drop-shadow(0 0 12px ${style.color})` : "none" }}>{n.icon}</div>
                          <h3 className="text-base font-black text-white mb-1.5 leading-tight">{n.name}</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border" style={{ background: style.bg, color: style.color, borderColor: `${style.color}33` }}>
                              <style.Icon className="w-3 h-3" /> {style.label}
                            </span>
                            <span className="text-[10px] text-gray-500">{n.mentions.toLocaleString()} mentions</span>
                          </div>
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500 font-semibold">Score</span>
                              <span className="font-black" style={{ color: style.color }}>{n.score}<span className="text-gray-600">/100</span></span>
                            </div>
                            <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden ring-1 ring-white/[0.04]">
                              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${n.score}%`, background: `linear-gradient(90deg, ${style.color}, ${style.color}aa)`, boxShadow: `0 0 8px ${style.color}66` }} />
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mb-3 leading-relaxed line-clamp-2">{n.description}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {n.topCoins.map((c) => (
                              <span key={c} className="text-[10px] bg-white/[0.04] text-gray-300 px-2 py-1 rounded-lg font-mono font-bold border border-white/[0.04]">{c}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ===== Full list ===== */}
              <div className="nr-anim bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6" style={{ animationDelay: "320ms" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> Tous les Narratifs
                  </h2>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{narratives.length} secteurs</span>
                </div>
                <div className="space-y-2">
                  {narratives.map((n, i) => {
                    const style = TREND_STYLES[n.trend];
                    return (
                      <div key={n.name} className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl transition-colors border border-white/[0.04] hover:border-white/[0.08]">
                        <span className="text-sm font-black text-gray-500 w-7 text-center">#{i + 1}</span>
                        <span className="text-2xl flex-shrink-0">{n.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{n.name}</span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border" style={{ background: style.bg, color: style.color, borderColor: `${style.color}33` }}>
                              <style.Icon className="w-3 h-3" /> {style.label}
                            </span>
                          </div>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {n.topCoins.slice(0, 4).map((c) => (
                              <span key={c} className="text-[10px] text-gray-500 font-mono font-semibold">{c}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right hidden md:block">
                          <div className="text-lg font-black font-mono" style={{ color: style.color, textShadow: `0 0 12px ${style.color}40` }}>{n.score}</div>
                          <div className="text-[10px] text-gray-500">{n.mentions.toLocaleString()}</div>
                        </div>
                        <div className="w-20 md:w-32 flex-shrink-0">
                          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden ring-1 ring-white/[0.04]">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${n.score}%`, background: `linear-gradient(90deg, ${style.color}, ${style.color}aa)`, boxShadow: `0 0 6px ${style.color}55` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}
