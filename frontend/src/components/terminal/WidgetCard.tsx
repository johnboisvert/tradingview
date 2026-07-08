// Bloomberg-style terminal widget system.
// Every widget is a self-contained card. Header shows a monospace tag +
// an optional refresh/expand action. Body auto-scrolls.
// Aesthetic: JetBrains Mono, orange/amber accents on pitch-black bg.
import { ReactNode } from "react";

interface Props {
  tag: string;
  title: ReactNode;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
  accent?: "amber" | "green" | "red" | "cyan";
  fullBleed?: boolean;
}

const ACCENTS = {
  amber: "border-amber-500/40 text-amber-400",
  green: "border-emerald-500/40 text-emerald-400",
  red: "border-red-500/40 text-red-400",
  cyan: "border-cyan-500/40 text-cyan-400",
};

export default function WidgetCard({
  tag, title, right, className = "", children, accent = "amber", fullBleed,
}: Props) {
  const accentCls = ACCENTS[accent];
  return (
    <div className={`flex flex-col h-full bg-black/60 border ${accentCls.split(" ")[0]} rounded overflow-hidden font-mono ${className}`}>
      <header className="flex items-center justify-between px-2.5 py-1 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${accentCls} bg-black/40 border`}>
            {tag}
          </span>
          <span className="text-[11px] font-bold text-white/90 truncate uppercase tracking-wide">{title}</span>
        </div>
        {right && <div className="flex items-center gap-1 flex-shrink-0">{right}</div>}
      </header>
      <div className={`flex-1 overflow-auto ${fullBleed ? "" : "p-2"} text-[11px] leading-relaxed text-white/90`}>
        {children}
      </div>
    </div>
  );
}
