import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import {
  BarChart3,
  RefreshCw,
  Target,
  Shield,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Crown,
  Award,
  Flame,
  BookOpen,
  Sparkles,
  Printer,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────── */

interface TimeframePreset {
  timeframe: string;
  name: string;
  winrate: number;
  tp1: number;
  tp3: number;
  sl: number;
  pnl: number;
  worst: string;
  badge?: "RECOMMANDÉ" | "TOP" | null;
  accent: string; // tailwind gradient class
}

interface EntryRule {
  condition: string;
  action: string;
  tone: "good" | "warn" | "bad" | "neutral";
}

interface TradeStep {
  step: string;
  action: string;
}

interface CapitalRow {
  capital: string;
  perTrade: string;
  leverage: string;
  tp1: string;
  tp3: string;
  sl: string;
  monthly: string;
}

interface SessionRow {
  session: string;
  montreal: string;
  utc: string;
  quality: "MEILLEUR" | "BON" | "EVITER";
}

interface RoutineRow {
  hour: string;
  action: string;
}

/* ─────────────────────────────────────────────────────────────
 * Static data (mirrors /report & /strategy content)
 * ──────────────────────────────────────────────────────────── */

const PRESETS: TimeframePreset[] = [
  {
    timeframe: "5M",
    name: "Scalp 5M",
    winrate: 81.3,
    tp1: 71.9,
    tp3: 41.7,
    sl: 16.6,
    pnl: 0.71,
    worst: "3-5",
    badge: "RECOMMANDÉ",
    accent: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  {
    timeframe: "15M",
    name: "Crypto RR Safe 15min",
    winrate: 81.0,
    tp1: 80.4,
    tp3: 53.3,
    sl: 16.0,
    pnl: 5.32,
    worst: "1-4",
    badge: "TOP",
    accent: "from-violet-500 via-purple-500 to-fuchsia-500",
  },
  {
    timeframe: "1H",
    name: "Crypto Safe 1H",
    winrate: 75.1,
    tp1: 70.1,
    tp3: 36.7,
    sl: 22.0,
    pnl: 4.36,
    worst: "2-4",
    badge: null,
    accent: "from-sky-500 via-blue-500 to-indigo-500",
  },
  {
    timeframe: "4H",
    name: "Crypto Safe 4H",
    winrate: 77.8,
    tp1: 72.9,
    tp3: 41.5,
    sl: 17.7,
    pnl: 10.80,
    worst: "2-4",
    badge: null,
    accent: "from-amber-500 via-orange-500 to-rose-500",
  },
];

const ENTRY_RULES: EntryRule[] = [
  { condition: "Score 7-10 + Trend 4H confirmé", action: "Entrez FULL SIZE", tone: "good" },
  { condition: "Score 5-6 + Trend 4H confirmé", action: "Entrez 50% de la taille", tone: "good" },
  { condition: "Score 5+ + Trend 4H NEUTRE", action: "Entrez 50% de la taille", tone: "neutral" },
  { condition: "Score 5+ + Trend 4H opposé", action: "SKIP — ne tradez pas", tone: "bad" },
  { condition: "Score 1-4", action: "SKIP — signal trop faible", tone: "warn" },
];

const TRADE_STEPS: TradeStep[] = [
  { step: "Signal reçu", action: "Entrez à E1 (market order)" },
  { step: "TP1 touché", action: "Fermez 30% — SL au Break Even" },
  { step: "TP2 touché", action: "Fermez 25% — laissez courir le reste" },
  { step: "TP3 touché", action: "Fermez 20% — Trailing Stop gère le reste" },
  { step: "TP4 / TP5", action: "Le Trailing Stop ferme automatiquement" },
  { step: "SL touché avant TP1", action: "Acceptez la perte, passez au suivant" },
];

const CAPITAL_ROWS: CapitalRow[] = [
  { capital: "1,000$", perTrade: "100$", leverage: "x10", tp1: "+13$", tp3: "+39$", sl: "-12$", monthly: "+360$" },
  { capital: "5,000$", perTrade: "250$", leverage: "x10", tp1: "+33$", tp3: "+98$", sl: "-30$", monthly: "+900$" },
  { capital: "10,000$", perTrade: "500$", leverage: "x10", tp1: "+65$", tp3: "+195$", sl: "-60$", monthly: "+1,800$" },
  { capital: "25,000$", perTrade: "500$", leverage: "x20", tp1: "+130$", tp3: "+390$", sl: "-120$", monthly: "+3,600$" },
];

const SESSIONS: SessionRow[] = [
  { session: "Tokyo", montreal: "19h - 3h", utc: "0h - 8h", quality: "EVITER" },
  { session: "Londres", montreal: "3h - 5h", utc: "8h - 10h", quality: "BON" },
  { session: "Overlap (LON+NY)", montreal: "8h - 11h", utc: "13h - 16h", quality: "MEILLEUR" },
  { session: "New York", montreal: "8h - 16h", utc: "13h - 21h", quality: "BON" },
];

const ROUTINE: RoutineRow[] = [
  { hour: "7h45", action: "Ouvrez TradingView, scannez vos paires Note A en 15M" },
  { hour: "8h - 11h", action: "TRADEZ ACTIVEMENT — Overlap = meilleur moment" },
  { hour: "11h - 14h", action: "Tradez si bon signal (Score 6+, Trend confirmé), sinon attendez" },
  { hour: "14h - 16h", action: "Derniers trades, fermez les positions ouvertes avant 16h" },
  { hour: "16h+", action: "STOP — Ne tradez plus. Revenez demain matin." },
];

const GOLDEN_RULES: string[] = [
  "Ne risquez JAMAIS plus de 1-2% de votre capital par trade",
  "Maximum 3 trades ouverts en même temps",
  "Arrêtez de trader après 3 pertes d'affilée — revenez le lendemain",
  "Ne tradez que pendant les Kill Zones (Londres + New York)",
  "SHORT + Trend 4H BULL = SKIP. LONG + Trend 4H BEAR = SKIP",
  "Jamais de revenge trade — si le SL est touché, attendez le prochain signal",
  "SL au Break Even dès que TP1 touché — vous ne pouvez plus perdre",
  "Commencez petit, augmentez progressivement quand les résultats sont confirmés en live",
];

/* ─────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────── */

export default function MagicStrategy() {
  const [now, setNow] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const updateNow = useCallback(() => {
    const d = new Date();
    setNow(
      d.toLocaleString("fr-CA", {
        timeZone: "America/Toronto",
        dateStyle: "medium",
        timeStyle: "short",
      })
    );
  }, []);

  useEffect(() => {
    updateNow();
    setLoading(false);
    const t = setInterval(updateNow, 60_000);
    return () => clearInterval(t);
  }, [updateNow]);

  const handlePrint = () => window.print();

  return (
    <div className="flex min-h-screen bg-[#0a0e17] text-white">
      <Sidebar />

      <main className="flex-1 lg:ml-64 flex flex-col">
        <PageHeader />

        {/* ── Hero ───────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-white/5">
          {/* Glow layers */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.25),_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.15),_transparent_50%)]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:48px_48px]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200 backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Magic JB IA — Stratégie officielle
                </div>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                    Magic Strategy
                  </span>
                </h1>
                <p className="mt-3 max-w-2xl text-base sm:text-lg text-white/70">
                  Tout votre playbook de trading en une seule page — presets gagnants,
                  règles d'entrée, gestion des trades, capital et routine quotidienne.
                </p>
                <div className="mt-3 text-xs text-white/50 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  Dernière mise à jour : {now || "…"}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={updateNow}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 transition"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Rafraîchir
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 hover:from-violet-400 hover:to-fuchsia-400 transition"
                >
                  <Printer className="h-4 w-4" />
                  Imprimer / PDF
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Presets par Timeframe ──────────────────────── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <SectionTitle
            icon={<Crown className="h-5 w-5 text-amber-300" />}
            eyebrow="Performance backtestée"
            title="Meilleur preset par timeframe"
            subtitle="Les 4 configurations qui offrent le meilleur ratio winrate / profit / drawdown."
          />

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {PRESETS.map((p) => (
              <PresetCard key={p.timeframe} preset={p} />
            ))}
          </div>
        </section>

        {/* ── Règles d'entrée ───────────────────────────── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <SectionTitle
            icon={<Target className="h-5 w-5 text-emerald-300" />}
            eyebrow="Étape 1"
            title="Règles d'entrée"
            subtitle="Qualifiez chaque signal avant d'appuyer sur le bouton."
          />

          <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent overflow-hidden backdrop-blur-sm">
            <div className="grid grid-cols-12 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/50 border-b border-white/10 bg-white/[0.02]">
              <div className="col-span-7 sm:col-span-8">Condition</div>
              <div className="col-span-5 sm:col-span-4 text-right">Action</div>
            </div>
            {ENTRY_RULES.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-12 items-center px-5 py-4 border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition"
              >
                <div className="col-span-7 sm:col-span-8 text-sm text-white/85">{r.condition}</div>
                <div className="col-span-5 sm:col-span-4 flex justify-end">
                  <ToneBadge tone={r.tone}>{r.action}</ToneBadge>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Gestion du trade ──────────────────────────── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <SectionTitle
            icon={<Shield className="h-5 w-5 text-sky-300" />}
            eyebrow="Étape 2"
            title="Gestion du trade"
            subtitle="Une fois dans le trade, laissez le plan piloter — pas vos émotions."
          />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRADE_STEPS.map((s, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-emerald-400/30 hover:bg-white/[0.05] transition"
              >
                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 grid place-items-center text-xs font-black text-slate-900 shadow-lg shadow-emerald-500/30">
                  {i + 1}
                </div>
                <div className="pl-4">
                  <div className="text-sm font-semibold text-white">{s.step}</div>
                  <div className="mt-2 text-sm text-white/70 leading-relaxed">{s.action}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Capital & Leverage ────────────────────────── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <SectionTitle
            icon={<Award className="h-5 w-5 text-fuchsia-300" />}
            eyebrow="Dimensionnement"
            title="Capital & Leverage recommandés"
            subtitle="Projections basées sur ~2 trades/jour avec Crypto Safe 15min."
          />

          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-white/50">
                  <Th>Capital</Th>
                  <Th>/Trade</Th>
                  <Th>Leverage</Th>
                  <Th className="text-emerald-300">Gain TP1</Th>
                  <Th className="text-emerald-300">Gain TP3</Th>
                  <Th className="text-rose-300">Perte SL</Th>
                  <Th className="text-amber-300">Profit/Mois</Th>
                </tr>
              </thead>
              <tbody>
                {CAPITAL_ROWS.map((r, i) => (
                  <tr
                    key={i}
                    className="border-t border-white/5 hover:bg-white/[0.03] transition"
                  >
                    <Td className="font-semibold text-white">{r.capital}</Td>
                    <Td>{r.perTrade}</Td>
                    <Td>
                      <span className="inline-flex rounded-md bg-violet-500/15 text-violet-200 px-2 py-0.5 text-xs font-semibold">
                        {r.leverage}
                      </span>
                    </Td>
                    <Td className="text-emerald-300 font-medium">{r.tp1}</Td>
                    <Td className="text-emerald-300 font-medium">{r.tp3}</Td>
                    <Td className="text-rose-300 font-medium">{r.sl}</Td>
                    <Td className="text-amber-300 font-bold">{r.monthly}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Horaires de trading ──────────────────────── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <SectionTitle
            icon={<Clock className="h-5 w-5 text-cyan-300" />}
            eyebrow="Kill Zones"
            title="Horaires de trading (Montréal / EST)"
            subtitle="Tradez quand le marché bouge. Dormez quand il dort."
          />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {SESSIONS.map((s) => (
              <div
                key={s.session}
                className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm ${
                  s.quality === "MEILLEUR"
                    ? "border-emerald-400/40 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent"
                    : s.quality === "BON"
                    ? "border-sky-400/30 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent"
                    : "border-rose-400/30 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/50">
                      Session
                    </div>
                    <div className="mt-1 text-2xl font-bold text-white">{s.session}</div>
                  </div>
                  <QualityBadge quality={s.quality} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <InfoPill label="Montréal" value={s.montreal} />
                  <InfoPill label="UTC" value={s.utc} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <AlertCard
              variant="danger"
              icon={<AlertTriangle className="h-5 w-5" />}
              title="NE TRADEZ PAS pendant Tokyo (19h - 3h EST)"
              text="Volume faible, mouvements imprévisibles. La majorité des SL touchés arrivent pendant cette session."
            />
            <AlertCard
              variant="success"
              icon={<Flame className="h-5 w-5" />}
              title="Sweet spot 8h - 11h EST (Overlap LON + NY)"
              text="Volume maximum, signaux les plus fiables. C'est là que vous faites la majorité de votre profit."
            />
          </div>
        </section>

        {/* ── Routine quotidienne ───────────────────────── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <SectionTitle
            icon={<Zap className="h-5 w-5 text-yellow-300" />}
            eyebrow="Discipline"
            title="Routine quotidienne"
            subtitle="Même journée, même rituel. C'est la constance qui paye."
          />

          <div className="mt-6 relative">
            {/* vertical line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-400/50 via-fuchsia-400/30 to-transparent" />
            <div className="space-y-3">
              {ROUTINE.map((r, i) => (
                <div key={i} className="relative flex gap-4 items-start">
                  <div className="relative z-10 h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center shadow-lg shadow-violet-500/30">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05] transition">
                    <div className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                      {r.hour}
                    </div>
                    <div className="mt-1 text-sm text-white/85">{r.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Règles d'or ───────────────────────────────── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <SectionTitle
            icon={<BookOpen className="h-5 w-5 text-amber-300" />}
            eyebrow="Commandements"
            title="Règles d'or"
            subtitle="Si vous ne deviez retenir que ça, retenez ça."
          />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {GOLDEN_RULES.map((rule, i) => (
              <div
                key={i}
                className="group flex items-start gap-3 rounded-xl border border-white/10 bg-gradient-to-br from-amber-500/[0.04] to-transparent p-4 hover:border-amber-400/30 hover:from-amber-500/[0.08] transition"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-300 mt-0.5" />
                <div className="text-sm text-white/85 leading-relaxed">{rule}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Disclaimer ────────────────────────────────── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-xs text-white/50 leading-relaxed">
            <span className="font-semibold text-white/70">Magic JB IA </span>
            — Les performances passées ne garantissent pas les résultats futurs. Les
            projections sont basées sur le backtest historique. Tradez de manière
            responsable et n'investissez jamais plus que ce que vous pouvez vous
            permettre de perdre.
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Small sub-components
 * ──────────────────────────────────────────────────────────── */

function SectionTitle({
  icon,
  eyebrow,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm">
        {icon}
        {eyebrow}
      </div>
      <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm text-white/60 max-w-2xl">{subtitle}</p>
      )}
    </div>
  );
}

function PresetCard({ preset }: { preset: TimeframePreset }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f1420] p-5 hover:border-white/20 transition">
      {/* Accent glow */}
      <div
        className={`absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${preset.accent} opacity-20 blur-3xl group-hover:opacity-30 transition`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            Timeframe
          </div>
          <div className="mt-1 text-3xl font-black text-white">{preset.timeframe}</div>
        </div>
        {preset.badge && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              preset.badge === "RECOMMANDÉ"
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                : "border-amber-400/40 bg-amber-500/10 text-amber-300"
            }`}
          >
            <Crown className="h-3 w-3" />
            {preset.badge}
          </span>
        )}
      </div>

      <div className="relative mt-3 text-sm font-semibold text-white/80 truncate">
        {preset.name}
      </div>

      <div className="relative mt-4">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-4xl font-black bg-gradient-to-r ${preset.accent} bg-clip-text text-transparent`}
          >
            {preset.winrate.toFixed(1)}%
          </span>
          <span className="text-xs text-white/50">winrate</span>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2">
        <MiniStat label="TP1" value={`${preset.tp1}%`} tone="good" />
        <MiniStat label="TP3" value={`${preset.tp3}%`} tone="good" />
        <MiniStat label="SL" value={`${preset.sl}%`} tone="bad" />
      </div>

      <div className="relative mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="text-xs text-white/60">PnL / trade</div>
        <div
          className={`text-sm font-bold ${
            preset.pnl >= 0 ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {preset.pnl >= 0 ? "+" : ""}
          {preset.pnl.toFixed(2)}$
        </div>
      </div>
      <div className="relative mt-2 flex items-center justify-between text-xs text-white/50">
        <span>Worst streak</span>
        <span className="font-semibold text-white/70">{preset.worst}</span>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "neutral";
}) {
  const color =
    tone === "good"
      ? "text-emerald-300"
      : tone === "bad"
      ? "text-rose-300"
      : "text-white/80";
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-2 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className={`mt-0.5 text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}

function ToneBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: EntryRule["tone"];
}) {
  const map: Record<EntryRule["tone"], string> = {
    good: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    warn: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    bad: "border-rose-400/40 bg-rose-500/10 text-rose-300",
    neutral: "border-sky-400/40 bg-sky-500/10 text-sky-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function QualityBadge({ quality }: { quality: SessionRow["quality"] }) {
  const map: Record<SessionRow["quality"], string> = {
    MEILLEUR: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
    BON: "border-sky-400/40 bg-sky-500/15 text-sky-200",
    EVITER: "border-rose-400/40 bg-rose-500/15 text-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${map[quality]}`}
    >
      {quality}
    </span>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function AlertCard({
  variant,
  icon,
  title,
  text,
}: {
  variant: "danger" | "success";
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  const styles =
    variant === "danger"
      ? "border-rose-400/30 bg-gradient-to-br from-rose-500/10 to-transparent text-rose-200"
      : "border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-transparent text-emerald-200";
  return (
    <div className={`rounded-2xl border p-5 ${styles}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0">{icon}</div>
        <div>
          <div className="text-sm font-bold">{title}</div>
          <div className="mt-1 text-xs text-white/70 leading-relaxed">{text}</div>
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`text-left px-4 py-3 font-semibold ${className}`}>{children}</th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 text-sm text-white/80 ${className}`}>{children}</td>
  );
}