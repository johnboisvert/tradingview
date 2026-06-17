import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, ChevronDown } from "lucide-react";

const LANGS = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
] as const;

type Variant = "compact" | "inline";

export default function LanguageSwitcher({
  variant = "compact",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGS.find((l) => i18n.resolvedLanguage?.startsWith(l.code)) || LANGS[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const change = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`} data-testid="language-switcher">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("common.language")}
        className={
          variant === "inline"
            ? "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            : "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
        }
        data-testid="language-switcher-trigger"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="font-semibold">{current.flag}</span>
        <span className="hidden sm:inline uppercase tracking-wide text-[10px]">{current.code}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1.5 min-w-[160px] py-1 bg-[#0F1422]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 z-50"
          role="menu"
        >
          {LANGS.map((l) => {
            const active = current.code === l.code;
            return (
              <button
                key={l.code}
                onClick={() => change(l.code)}
                data-testid={`language-switcher-option-${l.code}`}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                  active ? "text-white bg-indigo-500/15" : "text-gray-300 hover:text-white hover:bg-white/[0.05]"
                }`}
                role="menuitem"
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span className="flex-1 font-medium">{l.label}</span>
                {active && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
