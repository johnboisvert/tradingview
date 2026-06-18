import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/Sidebar";
import { RefreshCw, TrendingUp, TrendingDown, Activity, Flame, Snowflake, Sparkles } from "lucide-react";
import { fetchWithCorsProxy } from "@/lib/cryptoApi";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

interface FGData {
  value: number;
  value_classification: string;
  timestamp: string;
}

interface CoinSentiment {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  image: string;
}

function getColor(val: number) {
  if (val <= 20) return "#ef4444";
  if (val <= 40) return "#f97316";
  if (val <= 55) return "#eab308";
  if (val <= 75) return "#84cc16";
  return "#22c55e";
}

function getLabel(val: number) {
  if (val <= 20) return "Peur Extrême";
  if (val <= 40) return "Peur";
  if (val <= 55) return "Neutre";
  if (val <= 75) return "Avidité";
  return "Avidité Extrême";
}

function getEmoji(val: number) {
  if (val <= 20) return "😱";
  if (val <= 40) return "😨";
  if (val <= 55) return "😐";
  if (val <= 75) return "🤑";
  return "🚀";
}

// ====================== ANIMATED COUNTER ======================
function useAnimatedNumber(target: number, duration = 1200): number {
  const [val, setVal] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = val;
    startRef.current = null;
    let raf = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return val;
}

// ====================== SEMICIRCLE GAUGE ======================
function FearGreedGauge({ value }: { value: number }) {
  const animated = useAnimatedNumber(value);
  // Semicircle: angle from 180° (left, value=0) to 0° (right, value=100)
  const angle = Math.PI - (animated / 100) * Math.PI;
  const cx = 150;
  const cy = 140;
  const r = 110;
  const needleX = cx + (r - 20) * Math.cos(angle);
  const needleY = cy - (r - 20) * Math.sin(angle);
  const color = getColor(animated);

  // Build segmented arc with smooth gradient
  return (
    <div className="relative w-full max-w-[360px] aspect-[3/2] mx-auto">
      <svg viewBox="0 0 300 180" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="fgArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <filter id="fgGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="fgCenterGlow">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Center glow following needle color */}
        <circle cx={cx} cy={cy} r="100" fill="url(#fgCenterGlow)" className="transition-all duration-1000" />

        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="22"
          strokeLinecap="round"
        />

        {/* Color gradient arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="url(#fgArcGrad)"
          strokeWidth="22"
          strokeLinecap="round"
          opacity="0.92"
          filter="url(#fgGlow)"
        />

        {/* Tick marks every 10 */}
        {Array.from({ length: 11 }).map((_, i) => {
          const v = i * 10;
          const a = Math.PI - (v / 100) * Math.PI;
          const r1 = r + 14;
          const r2 = r + 22;
          const major = v % 25 === 0;
          return (
            <line
              key={v}
              x1={cx + r1 * Math.cos(a)}
              y1={cy - r1 * Math.sin(a)}
              x2={cx + r2 * Math.cos(a)}
              y2={cy - r2 * Math.sin(a)}
              stroke={major ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"}
              strokeWidth={major ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Tick labels for 0, 25, 50, 75, 100 */}
        {[
          { v: 0, color: "#ef4444" },
          { v: 25, color: "#f97316" },
          { v: 50, color: "#eab308" },
          { v: 75, color: "#84cc16" },
          { v: 100, color: "#22c55e" },
        ].map(({ v, color: tc }) => {
          const a = Math.PI - (v / 100) * Math.PI;
          const rl = r + 36;
          return (
            <text
              key={v}
              x={cx + rl * Math.cos(a)}
              y={cy - rl * Math.sin(a)}
              fill={tc}
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {v}
            </text>
          );
        })}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#fgGlow)"
          style={{ transition: "all 1s cubic-bezier(.34,1.56,.64,1)" }}
        />
        <circle cx={cx} cy={cy} r="10" fill="white" />
        <circle cx={cx} cy={cy} r="5" fill={color} />
      </svg>

      {/* Centered value below the gauge */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-6xl font-black tracking-tight" style={{ color, textShadow: `0 0 30px ${color}66` }}>
            {animated}
          </span>
          <span className="text-2xl">{getEmoji(animated)}</span>
        </div>
        <div className="text-sm font-bold mt-1 uppercase tracking-widest" style={{ color }}>
          {getLabel(animated)}
        </div>
      </div>
    </div>
  );
}

// ====================== CIRCULAR PROGRESS RING ======================
function CircularRing({ value, color, icon, name }: { value: number; color: string; icon: string; name: string }) {
  const animated = useAnimatedNumber(value);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  return (
    <div className="group bg-gradient-to-br from-white/[0.04] to-white/[0.01] hover:from-white/[0.07] hover:to-white/[0.02] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-4 text-center transition-all duration-300">
      <div className="relative w-24 h-24 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(.34,1.56,.64,1)",
              filter: `drop-shadow(0 0 4px ${color}99)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
          <span className="text-base font-black" style={{ color }}>
            {animated}
          </span>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 mt-2 font-bold uppercase tracking-wider">{name}</p>
    </div>
  );
}

// ====================== SPARKLINE AREA CHART ======================
function HistoryAreaChart({ history }: { history: FGData[] }) {
  if (history.length < 2) return null;
  // Use full history (caller decides range via historyRange state)
  const data = [...history].reverse();
  const W = 760;
  const H = 200;
  const padX = 14;
  const padY = 18;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const step = innerW / (data.length - 1);

  // For long ranges (90/365), don't draw a dot at every point — only key ones
  const showDots = data.length <= 60;
  const dotEvery = data.length <= 60 ? 1 : Math.ceil(data.length / 40);

  const points = data.map((d, i) => ({
    x: padX + i * step,
    y: padY + (1 - d.value / 100) * innerH,
    v: d.value,
  }));

  const pathLine = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const pathArea = `${pathLine} L ${points[points.length - 1].x} ${H - padY} L ${points[0].x} ${H - padY} Z`;
  const last = points[points.length - 1];
  const lastVal = data[data.length - 1].value;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 md:h-52">
        <defs>
          <linearGradient id="histArea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={getColor(lastVal)} stopOpacity="0.4" />
            <stop offset="100%" stopColor={getColor(lastVal)} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="histLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={getColor(data[0].value)} />
            <stop offset="100%" stopColor={getColor(lastVal)} />
          </linearGradient>
        </defs>
        {/* Horizontal threshold lines */}
        {[20, 40, 55, 75].map((v) => {
          const y = padY + (1 - v / 100) * innerH;
          return (
            <line
              key={v}
              x1={padX}
              x2={W - padX}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          );
        })}
        {/* Area fill */}
        <path d={pathArea} fill="url(#histArea)" />
        {/* Line */}
        <path d={pathLine} fill="none" stroke="url(#histLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {showDots && points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={getColor(p.v)} opacity="0.7" />
        ))}
        {!showDots && points.filter((_, i) => i % dotEvery === 0).map((p, i) => (
          <circle key={`s-${i}`} cx={p.x} cy={p.y} r="1.8" fill={getColor(p.v)} opacity="0.55" />
        ))}
        {/* Last point pulse */}
        <circle cx={last.x} cy={last.y} r="6" fill={getColor(lastVal)} opacity="0.25">
          <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx={last.x} cy={last.y} r="4.5" fill={getColor(lastVal)} stroke="white" strokeWidth="1.5" />
      </svg>
      <div className="flex justify-between px-3 text-[10px] text-gray-600 -mt-1">
        <span>{data.length}j</span>
        <span>{Math.round(data.length / 2)}j</span>
        <span>{Math.round(data.length / 4)}j</span>
        <span className="text-white font-bold">Aujourd&apos;hui</span>
      </div>
    </div>
  );
}

export default function FearGreed() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<FGData | null>(null);
  const [history, setHistory] = useState<FGData[]>([]);
  const [coins, setCoins] = useState<CoinSentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [historyRange, setHistoryRange] = useState<7 | 30 | 90 | 365>(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const [fgRes, top200Data] = await Promise.all([
        fetchWithCorsProxy(`https://api.alternative.me/fng/?limit=${historyRange}`).then(r => ({ status: "fulfilled" as const, value: r })).catch(() => ({ status: "rejected" as const, value: null as any })),
        fetchTop200(false),
      ]);

      if (fgRes.status === "fulfilled" && fgRes.value.ok) {
        const data = await fgRes.value.json();
        if (data?.data?.length > 0) {
          setCurrent({
            value: parseInt(data.data[0].value),
            value_classification: data.data[0].value_classification,
            timestamp: data.data[0].timestamp,
          });
          setHistory(
            data.data.slice(0, historyRange).map((d: Record<string, string>) => ({
              value: parseInt(d.value),
              value_classification: d.value_classification,
              timestamp: d.timestamp,
            }))
          );
        }
      }

      if (top200Data.length > 0) {
        setCoins(
          top200Data.map((c: any) => ({
            id: c.id as string,
            symbol: ((c.symbol as string) || "").toUpperCase(),
            name: c.name as string,
            price: c.current_price as number,
            change24h: (c.price_change_percentage_24h as number) || 0,
            volume: (c.total_volume as number) || 0,
            image: c.image as string,
          }))
        );
      }

      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      // keep existing data
    } finally {
      setLoading(false);
    }
  }, [historyRange]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const val = current?.value ?? 65;
  const mainColor = getColor(val);
  const bullishCoins = coins.filter((c) => c.change24h > 0).length;
  const bearishCoins = coins.filter((c) => c.change24h < 0).length;
  const avgChange = coins.length ? coins.reduce((s, c) => s + c.change24h, 0) / coins.length : 0;

  const factors = [
    { name: "Volatilité", val: Math.round(Math.max(0, Math.min(100, 50 + (coins.length ? coins.reduce((s, c) => s + Math.abs(c.change24h), 0) / coins.length * 5 : 0)))), icon: "📉" },
    { name: "Volume", val: Math.round(Math.max(0, Math.min(100, 40 + (coins.length ? Math.log10(coins.reduce((s, c) => s + c.volume, 0) / 1e9) * 15 : 0)))), icon: "📊" },
    { name: "Momentum", val: Math.round(Math.max(0, Math.min(100, 50 + avgChange * 5))), icon: "🚀" },
    { name: "Dominance BTC", val: Math.round(Math.max(0, Math.min(100, coins.length && coins[0]?.symbol === "BTC" ? 50 + (coins[0].change24h > 0 ? 10 : -10) : 52))), icon: "👑" },
    { name: "Social Media", val: Math.round(Math.max(0, Math.min(100, val * 0.95 + (avgChange > 0 ? 3 : -3)))), icon: "🐦" },
    { name: "Tendances", val: Math.round(Math.max(0, Math.min(100, (bullishCoins / (coins.length || 1)) * 100))), icon: "🔍" },
  ];

  const historyLabels = ["Aujourd'hui", "Hier", "Il y a 2j", "Il y a 3j", "Il y a 7j", "Il y a 14j", "Il y a 30j"];
  const historyIndices = [0, 1, 2, 3, 6, 13, 29];

  // 7-day average for trend
  const last7 = history.slice(0, 7).map(h => h.value);
  const avg7 = last7.length ? last7.reduce((a, b) => a + b, 0) / last7.length : val;
  const trend7 = val - avg7;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen bg-[#0A0E1A]">
        <PageHeader
          icon={<Activity className="w-6 h-6" />}
          title={t("pages.fearGreed.title")}
          subtitle={t("pages.fearGreed.subtitle")}
          accentColor="amber"
          steps={[
            { n: "1", title: t("pages.fearGreed.steps.1.title"), desc: t("pages.fearGreed.steps.1.desc") },
            { n: "2", title: t("pages.fearGreed.steps.2.title"), desc: t("pages.fearGreed.steps.2.desc") },
            { n: "3", title: t("pages.fearGreed.steps.3.title"), desc: t("pages.fearGreed.steps.3.desc") },
          ]}
        />

        {/* ===== HERO (pure CSS, no external image) ===== */}
        <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]">
          <div className="absolute inset-0 bg-[#0A0E1A]" />
          {/* Animated gradient blobs */}
          <div
            className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-30 blur-3xl"
            style={{ background: mainColor, animation: "fg-pulse 6s ease-in-out infinite" }}
          />
          <div
            className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full opacity-20 blur-3xl"
            style={{ background: getColor(val > 50 ? 100 : 0), animation: "fg-pulse 8s ease-in-out infinite reverse" }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="relative z-10 flex items-center justify-between gap-4 px-6 md:px-10 py-6">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center border"
                style={{ background: `${mainColor}1a`, borderColor: `${mainColor}55`, boxShadow: `0 0 30px ${mainColor}40` }}
              >
                <Activity className="w-7 h-7" style={{ color: mainColor }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-xl md:text-2xl font-black">Fear &amp; Greed Index</h1>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                    style={{ color: mainColor, borderColor: `${mainColor}44`, background: `${mainColor}10` }}
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Temps réel
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-400">
                  Sentiment global crypto • {coins.length || 50} actifs analysés • MAJ chaque minute
                </p>
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-sm font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}</span>
            </button>
          </div>
        </div>

        <style>{`
          @keyframes fg-pulse {
            0%, 100% { transform: scale(1) translate(0,0); opacity: 0.25; }
            50% { transform: scale(1.2) translate(20px,-10px); opacity: 0.4; }
          }
          @keyframes fg-fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fg-anim { animation: fg-fadeUp 0.6s ease-out both; }
        `}</style>

        {/* ===== KPIs ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            {
              label: "Indice Actuel",
              value: val,
              suffix: "",
              color: mainColor,
              icon: getEmoji(val),
              sub: getLabel(val),
            },
            {
              label: "Tendance 7 jours",
              value: trend7 >= 0 ? `+${trend7.toFixed(1)}` : trend7.toFixed(1),
              suffix: " pts",
              color: trend7 >= 0 ? "#22c55e" : "#ef4444",
              icon: trend7 >= 0 ? "📈" : "📉",
              sub: `Moyenne 7j : ${avg7.toFixed(0)}`,
            },
            {
              label: "Cryptos Haussières",
              value: bullishCoins,
              suffix: ` / ${coins.length}`,
              color: "#22c55e",
              icon: "🟢",
              sub: `${((bullishCoins / (coins.length || 1)) * 100).toFixed(0)}% du marché`,
            },
            {
              label: "Variation Moyenne 24h",
              value: `${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}`,
              suffix: "%",
              color: avgChange >= 0 ? "#22c55e" : "#ef4444",
              icon: avgChange >= 0 ? "🚀" : "🔻",
              sub: `${bearishCoins} cryptos baissières`,
            },
          ].map((k, i) => (
            <div
              key={i}
              className="fg-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-4 md:p-5 overflow-hidden transition-all"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Color glow accent */}
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20"
                style={{ background: k.color }}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider">{k.label}</p>
                  <span className="text-lg">{k.icon}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-2xl md:text-3xl font-black tracking-tight"
                    style={{ color: k.color, textShadow: `0 0 20px ${k.color}30` }}
                  >
                    {k.value}
                  </span>
                  <span className="text-sm md:text-base font-bold text-gray-500">{k.suffix}</span>
                </div>
                <p className="text-[10px] md:text-xs text-gray-500 mt-1">{k.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ===== GAUGE + HISTORY ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Gauge card */}
          <div
            className="fg-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 md:p-8 overflow-hidden"
            style={{ animationDelay: "200ms" }}
          >
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-25"
              style={{ background: mainColor }}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: mainColor }} />
                  Indice principal
                </h2>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">/ 100</span>
              </div>
              <FearGreedGauge value={val} />
              <p className="text-gray-400 text-xs md:text-sm mt-6 text-center max-w-md mx-auto leading-relaxed">
                Échelle de <span className="text-red-400 font-bold">0 (peur extrême)</span> à{" "}
                <span className="text-emerald-400 font-bold">100 (avidité extrême)</span>. Basé sur volatilité, volume,
                réseaux sociaux, dominance BTC &amp; tendances Google.
              </p>
            </div>
          </div>

          {/* History card */}
          <div
            className="fg-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 md:p-8 overflow-hidden"
            style={{ animationDelay: "280ms" }}
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" /> Évolution{" "}
                {historyRange === 7 ? "7 jours" : historyRange === 30 ? "30 jours" : historyRange === 90 ? "90 jours" : "1 an"}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Range selector */}
                <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  {([7, 30, 90, 365] as const).map((r) => (
                    <button
                      key={r}
                      data-testid={`fg-range-${r}`}
                      onClick={() => setHistoryRange(r)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        historyRange === r
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                          : "text-gray-400 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      {r === 365 ? "1A" : `${r}J`}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                  {history.length} points
                </span>
              </div>
            </div>

            <HistoryAreaChart history={history} />

            <div className="grid grid-cols-2 gap-1.5 mt-5">
              {historyIndices.map((idx, i) => {
                const h = history[idx];
                if (!h) return null;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl transition-colors border border-white/[0.04]"
                  >
                    <span className="text-[11px] text-gray-400 font-semibold">{historyLabels[i]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black w-6 text-right" style={{ color: getColor(h.value) }}>
                        {h.value}
                      </span>
                      <div className="w-2 h-2 rounded-full" style={{ background: getColor(h.value), boxShadow: `0 0 8px ${getColor(h.value)}` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===== FACTORS (circular rings) ===== */}
        <div
          className="fg-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 mb-6"
          style={{ animationDelay: "340ms" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-cyan-400" /> Facteurs d&apos;influence
            </h2>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">6 indicateurs pondérés</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {factors.map((f, i) => (
              <div key={i} style={{ animationDelay: `${400 + i * 50}ms` }} className="fg-anim">
                <CircularRing value={f.val} color={getColor(f.val)} icon={f.icon} name={f.name} />
              </div>
            ))}
          </div>
        </div>

        {/* ===== TOP 50 TABLE ===== */}
        <div
          className="fg-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6"
          style={{ animationDelay: "420ms" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> Sentiment Top 50 Cryptos
            </h2>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
              {coins.length} actifs
            </span>
          </div>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Crypto</th>
                  <th className="text-right py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Prix</th>
                  <th className="text-right py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">24h</th>
                  <th className="text-right py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Volume</th>
                  <th className="text-center py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sentiment</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((c, i) => {
                  const isVeryBull = c.change24h > 3;
                  const isBull = c.change24h > 0;
                  const isVeryBear = c.change24h < -3;
                  let sentColor = "#9ca3af";
                  let sentLabel = "Neutre";
                  let sentEmoji = "⚪";
                  if (isVeryBull) { sentColor = "#22c55e"; sentLabel = "Très Haussier"; sentEmoji = "🟢"; }
                  else if (isBull) { sentColor = "#84cc16"; sentLabel = "Haussier"; sentEmoji = "🟢"; }
                  else if (isVeryBear) { sentColor = "#ef4444"; sentLabel = "Très Baissier"; sentEmoji = "🔴"; }
                  else if (c.change24h < 0) { sentColor = "#f97316"; sentLabel = "Baissier"; sentEmoji = "🔴"; }

                  // Subtle row tint based on sentiment
                  const tintOpacity = Math.min(Math.abs(c.change24h) / 8, 1) * 0.06;

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-white/[0.03] transition-colors group"
                      style={{ background: c.change24h !== 0 ? `${sentColor}${Math.round(tintOpacity * 255).toString(16).padStart(2, "0")}` : "transparent" }}
                    >
                      <td className="py-3 px-3 text-sm text-gray-500 font-bold">{i + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {c.image ? (
                            <img loading="lazy" decoding="async" src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full ring-1 ring-white/10" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold ring-1 ring-white/10">
                              {c.symbol.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold">{c.name}</p>
                            <p className="text-[10px] text-gray-500 font-semibold">{c.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-bold font-mono">
                        ${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}
                      </td>
                      <td className={`py-3 px-3 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        <div className="flex items-center justify-end gap-1">
                          {c.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-gray-300 font-mono">
                        ${c.volume >= 1e9 ? (c.volume / 1e9).toFixed(2) + "B" : c.volume >= 1e6 ? (c.volume / 1e6).toFixed(1) + "M" : (c.volume / 1e3).toFixed(0) + "K"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap"
                          style={{ color: sentColor, borderColor: `${sentColor}33`, background: `${sentColor}14` }}
                        >
                          <span>{sentEmoji}</span> {sentLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
