import { useEffect, useState } from "react";

interface Step {
  n: string;
  title: string;
  desc: string;
}

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  steps?: Step[];
  accentColor?: string; // key dans ACCENTS ci-dessous
}

/**
 * Accents premium : chaque clé définit une palette cohérente
 * - gradient : pour le titre + l'icône
 * - blob1/blob2 : couleurs des halos animés en arrière-plan
 * - glow : ombre rgba pour l'icône
 * - chip : couleur du badge LIVE
 */
const ACCENTS: Record<
  string,
  { gradient: string; blob1: string; blob2: string; glow: string; chip: string; ring: string }
> = {
  blue:    { gradient: "from-blue-400 via-indigo-400 to-purple-400",   blob1: "rgba(59,130,246,0.35)",  blob2: "rgba(139,92,246,0.30)",  glow: "rgba(59,130,246,0.45)",  chip: "bg-blue-400/10 text-blue-300 border-blue-400/30",       ring: "border-blue-400/40" },
  green:   { gradient: "from-emerald-300 via-teal-400 to-cyan-400",    blob1: "rgba(16,185,129,0.32)", blob2: "rgba(34,211,238,0.28)",  glow: "rgba(16,185,129,0.45)",  chip: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30", ring: "border-emerald-400/40" },
  emerald: { gradient: "from-emerald-300 via-teal-400 to-cyan-400",    blob1: "rgba(16,185,129,0.32)", blob2: "rgba(34,211,238,0.28)",  glow: "rgba(16,185,129,0.45)",  chip: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30", ring: "border-emerald-400/40" },
  orange:  { gradient: "from-orange-300 via-amber-400 to-yellow-400",  blob1: "rgba(249,115,22,0.34)", blob2: "rgba(250,204,21,0.28)",  glow: "rgba(249,115,22,0.45)",  chip: "bg-orange-400/10 text-orange-300 border-orange-400/30",  ring: "border-orange-400/40" },
  red:     { gradient: "from-red-400 via-rose-400 to-pink-500",        blob1: "rgba(239,68,68,0.32)",  blob2: "rgba(244,63,94,0.28)",   glow: "rgba(239,68,68,0.45)",   chip: "bg-red-400/10 text-red-300 border-red-400/30",           ring: "border-red-400/40" },
  purple:  { gradient: "from-purple-300 via-fuchsia-400 to-indigo-400", blob1: "rgba(168,85,247,0.34)", blob2: "rgba(99,102,241,0.30)", glow: "rgba(168,85,247,0.45)",   chip: "bg-purple-400/10 text-purple-300 border-purple-400/30",  ring: "border-purple-400/40" },
  violet:  { gradient: "from-violet-300 via-fuchsia-400 to-indigo-400", blob1: "rgba(139,92,246,0.34)", blob2: "rgba(34,211,238,0.28)", glow: "rgba(139,92,246,0.45)",   chip: "bg-violet-400/10 text-violet-300 border-violet-400/30",  ring: "border-violet-400/40" },
  cyan:    { gradient: "from-cyan-300 via-sky-400 to-blue-400",         blob1: "rgba(34,211,238,0.34)", blob2: "rgba(59,130,246,0.28)", glow: "rgba(34,211,238,0.45)",   chip: "bg-cyan-400/10 text-cyan-300 border-cyan-400/30",        ring: "border-cyan-400/40" },
  amber:   { gradient: "from-amber-300 via-yellow-400 to-orange-400",   blob1: "rgba(245,158,11,0.34)", blob2: "rgba(249,115,22,0.28)", glow: "rgba(245,158,11,0.45)",   chip: "bg-amber-400/10 text-amber-300 border-amber-400/30",     ring: "border-amber-400/40" },
  pink:    { gradient: "from-pink-300 via-rose-400 to-fuchsia-400",     blob1: "rgba(236,72,153,0.34)", blob2: "rgba(168,85,247,0.28)", glow: "rgba(236,72,153,0.45)",   chip: "bg-pink-400/10 text-pink-300 border-pink-400/30",        ring: "border-pink-400/40" },
  indigo:  { gradient: "from-indigo-300 via-blue-400 to-purple-400",    blob1: "rgba(99,102,241,0.34)", blob2: "rgba(168,85,247,0.30)", glow: "rgba(99,102,241,0.45)",   chip: "bg-indigo-400/10 text-indigo-300 border-indigo-400/30",  ring: "border-indigo-400/40" },
};

export default function PageHeader({ icon, title, subtitle, steps = [], accentColor = "blue" }: PageHeaderProps) {
  const a = ACCENTS[accentColor] ?? ACCENTS.blue;
  const [now, setNow] = useState("");

  useEffect(() => {
    const update = () => setNow(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mb-6 rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0A0E1A]/80 backdrop-blur-xl">
      {/* ── Animated blobs ── */}
      <div
        className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none"
        style={{ background: a.blob1, animation: "ph-pulse 8s ease-in-out infinite" }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[380px] h-[380px] rounded-full blur-3xl pointer-events-none"
        style={{ background: a.blob2, animation: "ph-pulse 10s ease-in-out infinite reverse" }}
      />

      {/* ── Grid overlay ── */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.45) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* ── Top-edge gradient ring (subtle highlight) ── */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      {/* ── Content ── */}
      <div className="relative z-10 px-5 md:px-8 py-6 md:py-7">
        <div className="flex items-start gap-4 md:gap-5">
          {/* Icon with glow */}
          <div
            className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${a.gradient} flex items-center justify-center text-white shadow-lg relative overflow-hidden`}
            style={{ boxShadow: `0 0 30px ${a.glow}, inset 0 1px 0 rgba(255,255,255,0.25)` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <div className="relative z-10 text-xl md:text-2xl">{icon}</div>
          </div>

          {/* Title block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h2
                className={`text-xl md:text-2xl lg:text-3xl font-black tracking-tight bg-gradient-to-r ${a.gradient} bg-clip-text text-transparent leading-tight`}
              >
                {title}
              </h2>
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${a.chip}`}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                </span>
                Live · {now}
              </span>
            </div>
            <p className="text-sm md:text-[15px] text-gray-300/85 leading-relaxed max-w-3xl">
              {subtitle}
            </p>
          </div>
        </div>

        {/* ── Steps ── */}
        {steps.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            {steps.map((step, idx) => (
              <div
                key={step.n}
                className={`group relative flex gap-3 items-start bg-white/[0.025] backdrop-blur-md rounded-2xl p-4 border border-white/[0.06] hover:border-white/[0.16] hover:bg-white/[0.05] transition-all hover:-translate-y-0.5 overflow-hidden`}
                style={{ animation: "ph-fadeUp 0.6s ease-out both", animationDelay: `${100 + idx * 80}ms` }}
              >
                <div
                  className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity"
                  style={{ background: a.blob1 }}
                />
                <span
                  className={`relative flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center text-xs font-black text-white shadow-md`}
                  style={{ boxShadow: `0 4px 12px ${a.glow}` }}
                >
                  {step.n}
                </span>
                <div className="relative min-w-0">
                  <p className="text-xs font-bold text-white mb-0.5 leading-tight">{step.title}</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Animations (scoped — no global pollution) */}
      <style>{`
        @keyframes ph-pulse {
          0%, 100% { transform: scale(1) translate(0,0); opacity: 0.55; }
          50% { transform: scale(1.18) translate(18px,-12px); opacity: 0.85; }
        }
        @keyframes ph-fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
