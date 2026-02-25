import { LucideIcon } from "lucide-react";

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
  accentColor?: string; // tailwind gradient class or hex
}

const ACCENT_CLASSES: Record<string, string> = {
  blue: "from-blue-500 to-purple-500",
  green: "from-emerald-500 to-cyan-500",
  orange: "from-orange-500 to-amber-500",
  red: "from-red-500 to-pink-500",
  purple: "from-purple-500 to-indigo-500",
  cyan: "from-cyan-500 to-blue-500",
  amber: "from-amber-500 to-yellow-500",
  pink: "from-pink-500 to-rose-500",
  indigo: "from-indigo-500 to-blue-500",
};

export default function PageHeader({ icon, title, subtitle, steps = [], accentColor = "blue" }: PageHeaderProps) {
  const gradient = ACCENT_CLASSES[accentColor] ?? ACCENT_CLASSES["blue"];

  return (
    <div className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6">
      {/* Title row */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white leading-tight">{title}</h2>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed max-w-2xl">{subtitle}</p>
        </div>
      </div>

      {/* Steps */}
      {steps.length > 0 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {steps.map((step) => (
          <div
            key={step.n}
            className="flex gap-3 items-start bg-black/20 rounded-xl p-4 border border-white/[0.04] hover:border-white/10 transition-colors"
          >
            <span
              className={`flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-black text-white shadow`}
            >
              {step.n}
            </span>
            <div>
              <p className="text-xs font-bold text-white mb-0.5">{step.title}</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}