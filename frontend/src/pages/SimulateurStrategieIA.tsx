import { useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { Target, Zap, RefreshCw, TrendingUp, TrendingDown, Minus, Info, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskProfile = "conservateur" | "modere" | "agressif";
type Horizon = "1w" | "1m" | "3m" | "1y";

interface FormState {
  capital: string;
  risk: RiskProfile;
  horizon: Horizon;
}

interface Allocation {
  symbol: string;
  name: string;
  color: string;
  pct: number;
  amount: number;
  reason: string;
  expectedReturn: number; // % for horizon
  riskScore: number; // 0-100
}

interface Scenario {
  label: string;
  pct: number;
  amount: number;
  color: string;
  icon: React.ReactNode;
  description: string;
}

interface SimResult {
  allocations: Allocation[];
  globalRisk: number;
  scenarios: Scenario[];
  totalCapital: number;
  horizon: Horizon;
  risk: RiskProfile;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_LABELS: Record<RiskProfile, string> = {
  conservateur: "Conservateur",
  modere: "Modéré",
  agressif: "Agressif",
};

const HORIZON_LABELS: Record<Horizon, string> = {
  "1w": "1 semaine",
  "1m": "1 mois",
  "3m": "3 mois",
  "1y": "1 an",
};

// Horizon multiplier for expected returns
const HORIZON_MULT: Record<Horizon, number> = {
  "1w": 0.25,
  "1m": 1,
  "3m": 3,
  "1y": 12,
};

// Base monthly expected returns per crypto
const CRYPTO_DATA: Array<{
  symbol: string; name: string; color: string;
  baseReturn: number; riskScore: number;
  reasons: Record<RiskProfile, string>;
}> = [
  {
    symbol: "BTC", name: "Bitcoin", color: "#F7931A",
    baseReturn: 4.5, riskScore: 35,
    reasons: {
      conservateur: "Valeur refuge numérique, dominance de marché >50%, adoption institutionnelle croissante (ETF Bitcoin approuvés).",
      modere: "Meilleur rapport risque/rendement du marché crypto, corrélation faible avec les altcoins en période de stress.",
      agressif: "Base solide du portefeuille, liquidité maximale pour rééquilibrer rapidement vers des opportunités.",
    },
  },
  {
    symbol: "ETH", name: "Ethereum", color: "#627EEA",
    baseReturn: 5.8, riskScore: 42,
    reasons: {
      conservateur: "Plateforme DeFi dominante, revenus de staking ~4% APY, upgrade Dencun réduit les frais de 90%.",
      modere: "Écosystème le plus développé (DeFi, NFT, L2), ETF Ethereum en cours d'approbation.",
      agressif: "Effet de levier sur l'écosystème L2 en pleine expansion, catalyseur fort pour les prochains mois.",
    },
  },
  {
    symbol: "SOL", name: "Solana", color: "#9945FF",
    baseReturn: 8.2, riskScore: 58,
    reasons: {
      conservateur: "Performances réseau exceptionnelles (65k TPS), adoption DeFi et NFT en forte croissance.",
      modere: "Concurrent sérieux d'Ethereum avec des frais ultra-bas, momentum fort et communauté active.",
      agressif: "Potentiel de x3-x5 sur l'horizon, forte activité on-chain et nouveaux projets en déploiement continu.",
    },
  },
  {
    symbol: "BNB", name: "BNB Chain", color: "#F3BA2F",
    baseReturn: 5.2, riskScore: 48,
    reasons: {
      conservateur: "Utilité forte (frais Binance), mécanisme de burn déflationniste, écosystème BSC établi.",
      modere: "Exposition à l'écosystème Binance, le plus grand exchange mondial, bon potentiel de rendement stable.",
      agressif: "Catalyseur opBNB (L2), expansion en Asie, forte liquidité pour arbitrage.",
    },
  },
  {
    symbol: "AVAX", name: "Avalanche", color: "#E84142",
    baseReturn: 9.1, riskScore: 65,
    reasons: {
      conservateur: "Technologie Subnet innovante, partenariats institutionnels (Deloitte, AWS), staking ~8% APY.",
      modere: "Architecture multi-chaîne unique, forte adoption dans la finance traditionnelle tokenisée.",
      agressif: "Momentum fort sur les subnets gaming et RWA, potentiel de rattrapage significatif.",
    },
  },
  {
    symbol: "MATIC", name: "Polygon", color: "#8247E5",
    baseReturn: 7.4, riskScore: 60,
    reasons: {
      conservateur: "Solution L2 Ethereum la plus adoptée, partenariats majeurs (Nike, Starbucks, Reddit).",
      modere: "Migration vers zkEVM en cours, positionnement stratégique sur l'identité décentralisée.",
      agressif: "Transition vers POL token, expansion aggressive sur les marchés émergents.",
    },
  },
  {
    symbol: "LINK", name: "Chainlink", color: "#375BD2",
    baseReturn: 6.8, riskScore: 52,
    reasons: {
      conservateur: "Infrastructure critique DeFi (oracles), monopole de fait sur les données on-chain, revenus récurrents.",
      modere: "CCIP (Cross-Chain Interoperability Protocol) positionne LINK comme backbone du Web3.",
      agressif: "Expansion vers les marchés TradFi (SWIFT, DTCC), catalyseur majeur pour 2025.",
    },
  },
  {
    symbol: "DOT", name: "Polkadot", color: "#E6007A",
    baseReturn: 7.9, riskScore: 63,
    reasons: {
      conservateur: "Interopérabilité blockchain unique, staking ~14% APY, gouvernance on-chain mature.",
      modere: "Parachains actives avec des projets DeFi solides, JAM upgrade prévu pour booster l'écosystème.",
      agressif: "Sous-évalué par rapport aux fondamentaux, fort potentiel de rattrapage vs L1 concurrents.",
    },
  },
  {
    symbol: "ARB", name: "Arbitrum", color: "#28A0F0",
    baseReturn: 10.5, riskScore: 70,
    reasons: {
      conservateur: "Leader L2 Ethereum, TVL >$18B, adoption DeFi massive (GMX, Uniswap, Aave).",
      modere: "Stylus upgrade permet les smart contracts en Rust/C++, expansion rapide de l'écosystème.",
      agressif: "Token relativement récent avec fort potentiel de valorisation, DAO active et bien financée.",
    },
  },
  {
    symbol: "OP", name: "Optimism", color: "#FF0420",
    baseReturn: 11.2, riskScore: 72,
    reasons: {
      conservateur: "Superchain en construction avec Coinbase (Base), modèle de revenus partagés innovant.",
      modere: "Écosystème OP Stack adopté par de nombreux projets, croissance TVL soutenue.",
      agressif: "Forte corrélation avec l'adoption L2, potentiel de x5 si adoption mainstream.",
    },
  },
];

// ─── Allocation logic ─────────────────────────────────────────────────────────

function buildAllocations(capital: number, risk: RiskProfile, horizon: Horizon): Allocation[] {
  const mult = HORIZON_MULT[horizon];

  // Weights per risk profile
  const weights: Record<RiskProfile, number[]> = {
    conservateur: [35, 25, 10, 10, 5, 5, 5, 5, 0, 0],
    modere:       [28, 20, 12, 8, 7, 7, 6, 5, 4, 3],
    agressif:     [20, 15, 15, 8, 8, 7, 6, 5, 8, 8],
  };

  const w = weights[risk];
  return CRYPTO_DATA.map((c, i) => ({
    symbol: c.symbol,
    name: c.name,
    color: c.color,
    pct: w[i],
    amount: Math.round((capital * w[i]) / 100),
    reason: c.reasons[risk],
    expectedReturn: parseFloat((c.baseReturn * mult).toFixed(1)),
    riskScore: c.riskScore,
  })).filter((a) => a.pct > 0);
}

function buildScenarios(capital: number, allocations: Allocation[], horizon: Horizon): Scenario[] {
  const mult = HORIZON_MULT[horizon];
  // Weighted average expected return
  const avgReturn = allocations.reduce((sum, a) => sum + (a.expectedReturn * a.pct) / 100, 0);

  const optimistic = avgReturn * 1.8;
  const realistic = avgReturn * 1.0;
  const pessimistic = avgReturn * -0.4;

  return [
    {
      label: "Optimiste",
      pct: parseFloat(optimistic.toFixed(1)),
      amount: Math.round(capital * optimistic / 100),
      color: "emerald",
      icon: <TrendingUp className="w-4 h-4" />,
      description: `Conditions de marché favorables, bull run en cours. Gain estimé sur ${HORIZON_LABELS[horizon]}.`,
    },
    {
      label: "Réaliste",
      pct: parseFloat(realistic.toFixed(1)),
      amount: Math.round(capital * realistic / 100),
      color: "indigo",
      icon: <Minus className="w-4 h-4" />,
      description: `Conditions normales de marché, tendance haussière modérée. Projection IA sur ${HORIZON_LABELS[horizon]}.`,
    },
    {
      label: "Pessimiste",
      pct: parseFloat(pessimistic.toFixed(1)),
      amount: Math.round(capital * Math.abs(pessimistic) / 100),
      color: "red",
      icon: <TrendingDown className="w-4 h-4" />,
      description: `Correction de marché ou bear market. Perte maximale estimée sur ${HORIZON_LABELS[horizon]}.`,
    },
  ];
}

function computeGlobalRisk(allocations: Allocation[], risk: RiskProfile): number {
  const base = allocations.reduce((sum, a) => sum + (a.riskScore * a.pct) / 100, 0);
  const modifier = risk === "conservateur" ? -8 : risk === "agressif" ? +8 : 0;
  return Math.round(Math.min(95, Math.max(10, base + modifier)));
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ allocations }: { allocations: Allocation[] }) {
  const size = 200;
  const r = 75;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const [hovered, setHovered] = useState<string | null>(null);

  let cumPct = 0;
  const slices = allocations.map((a) => {
    const start = cumPct;
    cumPct += a.pct;
    return { ...a, start, end: cumPct };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {slices.map((s) => {
            const dashLen = (s.pct / 100) * circ;
            const dashOffset = circ - ((s.start / 100) * circ);
            const isHov = hovered === s.symbol;
            return (
              <circle
                key={s.symbol}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={isHov ? 28 : 22}
                strokeDasharray={`${dashLen} ${circ - dashLen}`}
                strokeDashoffset={dashOffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHovered(s.symbol)}
                onMouseLeave={() => setHovered(null)}
                style={{ opacity: hovered && !isHov ? 0.4 : 1 }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hovered ? (
            <>
              <span className="text-lg font-black text-white">{hovered}</span>
              <span className="text-sm text-gray-400">{slices.find((s) => s.symbol === hovered)?.pct}%</span>
            </>
          ) : (
            <>
              <span className="text-xs text-gray-500">Allocation</span>
              <span className="text-sm font-bold text-white">IA</span>
            </>
          )}
        </div>
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 w-full">
        {allocations.map((a) => (
          <div
            key={a.symbol}
            className="flex items-center gap-2 cursor-pointer"
            onMouseEnter={() => setHovered(a.symbol)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
            <span className="text-xs text-gray-400 truncate">{a.symbol}</span>
            <span className="text-xs font-bold text-white ml-auto">{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Risk Gauge ───────────────────────────────────────────────────────────────

function RiskGauge({ score }: { score: number }) {
  const color = score >= 67 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#10b981";
  const label = score >= 67 ? "Élevé" : score >= 40 ? "Modéré" : "Faible";
  const w = 220;
  const h = 110;
  const r = 90;
  const cx = w / 2;
  const cy = h - 5;
  // Half circle: from 180° to 0°
  const angle = 180 - (score / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const nx = cx + r * Math.cos(rad);
  const ny = cy - r * Math.sin(rad);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} strokeLinecap="round"
        />
        {/* Colored arc */}
        {[
          { from: 0, to: 33, c: "#10b981" },
          { from: 33, to: 66, c: "#f59e0b" },
          { from: 66, to: 100, c: "#ef4444" },
        ].map((seg) => {
          const a1 = 180 - (seg.from / 100) * 180;
          const a2 = 180 - (seg.to / 100) * 180;
          const r1 = (a1 * Math.PI) / 180;
          const r2 = (a2 * Math.PI) / 180;
          const x1 = cx + r * Math.cos(r1);
          const y1 = cy - r * Math.sin(r1);
          const x2 = cx + r * Math.cos(r2);
          const y2 = cy - r * Math.sin(r2);
          return (
            <path
              key={seg.from}
              d={`M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2}`}
              fill="none" stroke={seg.c} strokeWidth={14} strokeLinecap="round"
              style={{ opacity: score >= seg.from ? 1 : 0.15 }}
            />
          );
        })}
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={nx} y2={ny}
          stroke={color} strokeWidth={3} strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={5} fill={color} />
        {/* Labels */}
        <text x={cx - r - 4} y={cy + 16} fill="#10b981" fontSize={9} fontWeight="bold" textAnchor="middle">Faible</text>
        <text x={cx} y={cy + 20} fill="#f59e0b" fontSize={9} fontWeight="bold" textAnchor="middle">Modéré</text>
        <text x={cx + r + 4} y={cy + 16} fill="#ef4444" fontSize={9} fontWeight="bold" textAnchor="middle">Élevé</text>
      </svg>
      <div className="text-center -mt-2">
        <p className="text-2xl font-black" style={{ color }}>{score}<span className="text-sm text-gray-500">/100</span></p>
        <p className="text-xs font-bold" style={{ color }}>Risque {label}</p>
      </div>
    </div>
  );
}

// ─── Allocation Row ───────────────────────────────────────────────────────────

function AllocationRow({ a, capital }: { a: Allocation; capital: number }) {
  const [open, setOpen] = useState(false);
  const projAmount = Math.round(a.amount * a.expectedReturn / 100);
  const positive = a.expectedReturn >= 0;

  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-slate-900/60 hover:bg-white/[0.03] transition-all cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Color dot + symbol */}
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white">{a.symbol}</span>
            <span className="text-xs text-gray-500">{a.name}</span>
          </div>
        </div>
        {/* Pct bar */}
        <div className="hidden sm:flex items-center gap-2 w-28">
          <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${a.pct}%`, backgroundColor: a.color, opacity: 0.85 }} />
          </div>
          <span className="text-xs font-bold text-white w-8 text-right">{a.pct}%</span>
        </div>
        {/* Amount */}
        <div className="text-right w-24">
          <p className="text-sm font-black text-white">${a.amount.toLocaleString()}</p>
          <p className={`text-[10px] font-bold ${positive ? "text-emerald-400" : "text-red-400"}`}>
            {positive ? "+" : ""}{a.expectedReturn}% → {positive ? "+" : "-"}${Math.abs(projAmount).toLocaleString()}
          </p>
        </div>
        {/* Toggle */}
        <div className="text-gray-500 ml-2">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      {open && (
        <div className="px-4 py-3 bg-black/20 border-t border-white/[0.04]">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 leading-relaxed">{a.reason}</p>
          </div>
          <div className="mt-2 flex items-center gap-4">
            <div>
              <p className="text-[10px] text-gray-600">Score de risque</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-16 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${a.riskScore}%`,
                      backgroundColor: a.riskScore >= 67 ? "#ef4444" : a.riskScore >= 40 ? "#f59e0b" : "#10b981",
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-gray-400">{a.riskScore}/100</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-600">Montant alloué</p>
              <p className="text-xs font-bold text-white">${a.amount.toLocaleString()} ({a.pct}%)</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600">Rendement projeté</p>
              <p className={`text-xs font-bold ${positive ? "text-emerald-400" : "text-red-400"}`}>
                {positive ? "+" : ""}{a.expectedReturn}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SimulateurStrategieIA() {
  const [form, setForm] = useState<FormState>({ capital: "10000", risk: "modere", horizon: "3m" });
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);

  const simulate = useCallback(() => {
    const capital = parseFloat(form.capital.replace(/[^0-9.]/g, ""));
    if (!capital || capital <= 0) return;
    setLoading(true);
    setTimeout(() => {
      const allocations = buildAllocations(capital, form.risk, form.horizon);
      const scenarios = buildScenarios(capital, allocations, form.horizon);
      const globalRisk = computeGlobalRisk(allocations, form.risk);
      setResult({ allocations, scenarios, totalCapital: capital, horizon: form.horizon, risk: form.risk });
      setLoading(false);
    }, 900);
  }, [form]);

  const scenarioColorMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  const globalRisk = result ? computeGlobalRisk(result.allocations, result.risk) : null;

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 py-6">
          {/* Page Header */}
          <PageHeader
            icon={<Target className="w-6 h-6" />}
            title="Simulateur de Stratégie IA"
            subtitle="Entrez votre capital et votre profil de risque. L'IA calcule une allocation optimisée, des projections de gains/pertes sur 3 scénarios et un niveau de risque global."
            accentColor="indigo"
            steps={[
              { n: "1", title: "Entrez votre capital et profil", desc: "Renseignez votre capital disponible en $, votre profil de risque (Conservateur, Modéré, Agressif) et votre horizon d'investissement." },
              { n: "2", title: "Lancez la simulation IA", desc: "L'IA analyse les données de marché, les scores de confiance et les métriques on-chain pour générer une allocation optimisée." },
              { n: "3", title: "Analysez les projections", desc: "Consultez la répartition par crypto, les 3 scénarios (optimiste/réaliste/pessimiste) et le niveau de risque global avant de prendre vos décisions." },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
            {/* ── Left: Form ── */}
            <div className="space-y-4">
              <div className="bg-slate-900/70 border border-white/[0.07] rounded-2xl p-5">
                <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" /> Paramètres de simulation
                </h2>

                {/* Capital */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">Capital disponible ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
                    <input
                      type="number"
                      min="100"
                      value={form.capital}
                      onChange={(e) => setForm((f) => ({ ...f, capital: e.target.value }))}
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] text-white font-mono text-sm focus:outline-none focus:border-indigo-500/50 placeholder-gray-600"
                      placeholder="10000"
                    />
                  </div>
                  {/* Quick amounts */}
                  <div className="flex gap-2 mt-2">
                    {[1000, 5000, 10000, 50000].map((v) => (
                      <button
                        key={v}
                        onClick={() => setForm((f) => ({ ...f, capital: String(v) }))}
                        className="flex-1 py-1 rounded-lg bg-white/[0.04] hover:bg-indigo-500/20 text-[10px] font-bold text-gray-500 hover:text-indigo-400 border border-white/[0.05] transition-all"
                      >
                        ${v >= 1000 ? `${v / 1000}k` : v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Risk Profile */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">Profil de risque</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["conservateur", "modere", "agressif"] as RiskProfile[]).map((r) => {
                      const colors = {
                        conservateur: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
                        modere: "border-amber-500/40 bg-amber-500/10 text-amber-400",
                        agressif: "border-red-500/40 bg-red-500/10 text-red-400",
                      };
                      const inactive = "border-white/[0.06] bg-white/[0.02] text-gray-500";
                      return (
                        <button
                          key={r}
                          onClick={() => setForm((f) => ({ ...f, risk: r }))}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all ${form.risk === r ? colors[r] : inactive} hover:border-white/20`}
                        >
                          {RISK_LABELS[r]}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1.5">
                    {form.risk === "conservateur" && "Priorité BTC/ETH, faible volatilité, préservation du capital."}
                    {form.risk === "modere" && "Équilibre rendement/risque, diversification large cap + mid cap."}
                    {form.risk === "agressif" && "Maximisation des gains, exposition aux altcoins à fort potentiel."}
                  </p>
                </div>

                {/* Horizon */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">Horizon d'investissement</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["1w", "1m", "3m", "1y"] as Horizon[]).map((h) => (
                      <button
                        key={h}
                        onClick={() => setForm((f) => ({ ...f, horizon: h }))}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${form.horizon === h ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-400" : "border-white/[0.06] bg-white/[0.02] text-gray-500 hover:border-white/20"}`}
                      >
                        {HORIZON_LABELS[h]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulate button */}
                <button
                  onClick={simulate}
                  disabled={loading || !form.capital}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Calcul en cours...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      {result ? "Recalculer la stratégie" : "Lancer la simulation IA"}
                    </>
                  )}
                </button>

                {/* Disclaimer */}
                <p className="text-[10px] text-gray-600 mt-3 leading-relaxed">
                  ⚠️ Simulation à titre informatif uniquement. Les projections ne constituent pas des conseils financiers. Les performances passées ne garantissent pas les résultats futurs.
                </p>
              </div>

              {/* Risk gauge */}
              {result && globalRisk !== null && (
                <div className="bg-slate-900/70 border border-white/[0.07] rounded-2xl p-5">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Niveau de risque global</h3>
                  <RiskGauge score={globalRisk} />
                  <p className="text-[11px] text-gray-500 text-center mt-2">
                    Basé sur la pondération de votre portefeuille et votre profil {RISK_LABELS[result.risk].toLowerCase()}.
                  </p>
                </div>
              )}
            </div>

            {/* ── Right: Results ── */}
            <div className="space-y-5">
              {!result && !loading && (
                <div className="flex flex-col items-center justify-center h-80 bg-slate-900/40 border border-white/[0.05] rounded-2xl gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Target className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold">Prêt à simuler</p>
                    <p className="text-sm text-gray-500 mt-1">Renseignez vos paramètres et lancez la simulation IA</p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center h-80 bg-slate-900/40 border border-white/[0.05] rounded-2xl gap-4">
                  <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">L'IA calcule votre stratégie optimale...</p>
                </div>
              )}

              {result && !loading && (
                <>
                  {/* Summary bar */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900/70 border border-white/[0.06] rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 mb-1">Capital</p>
                      <p className="text-base font-black text-white">${result.totalCapital.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-900/70 border border-white/[0.06] rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 mb-1">Profil</p>
                      <p className="text-base font-black text-white">{RISK_LABELS[result.risk]}</p>
                    </div>
                    <div className="bg-slate-900/70 border border-white/[0.06] rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 mb-1">Horizon</p>
                      <p className="text-base font-black text-white">{HORIZON_LABELS[result.horizon]}</p>
                    </div>
                  </div>

                  {/* Donut + Scenarios */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Donut */}
                    <div className="bg-slate-900/70 border border-white/[0.07] rounded-2xl p-5">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Répartition du portefeuille</h3>
                      <DonutChart allocations={result.allocations} />
                    </div>

                    {/* Scenarios */}
                    <div className="bg-slate-900/70 border border-white/[0.07] rounded-2xl p-5">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Projections sur {HORIZON_LABELS[result.horizon]}</h3>
                      <div className="space-y-3">
                        {result.scenarios.map((sc) => {
                          const isPessimistic = sc.label === "Pessimiste";
                          return (
                            <div key={sc.label} className={`p-3 rounded-xl border ${scenarioColorMap[sc.color]}`}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className={scenarioColorMap[sc.color].split(" ")[0]}>{sc.icon}</span>
                                  <span className="text-sm font-black text-white">{sc.label}</span>
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-black ${scenarioColorMap[sc.color].split(" ")[0]}`}>
                                    {isPessimistic ? "-" : "+"}{sc.pct}%
                                  </p>
                                  <p className={`text-[10px] font-bold ${scenarioColorMap[sc.color].split(" ")[0]}`}>
                                    {isPessimistic ? "-" : "+"}${sc.amount.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-500 leading-relaxed">{sc.description}</p>
                              {/* Progress bar */}
                              <div className="mt-2 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${Math.min(100, Math.abs(sc.pct) * 2)}%`,
                                    backgroundColor: sc.color === "emerald" ? "#10b981" : sc.color === "indigo" ? "#6366f1" : "#ef4444",
                                    opacity: 0.7,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Allocations detail */}
                  <div className="bg-slate-900/70 border border-white/[0.07] rounded-2xl p-5">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                      Détail des allocations recommandées
                      <span className="ml-2 text-gray-600 font-normal normal-case">— cliquez pour voir l'analyse IA</span>
                    </h3>
                    <div className="space-y-2">
                      {result.allocations.map((a) => (
                        <AllocationRow key={a.symbol} a={a} capital={result.totalCapital} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}