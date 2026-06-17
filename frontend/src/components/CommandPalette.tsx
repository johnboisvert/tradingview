import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  Command as CommandIcon,
  ArrowRight,
  Coins,
  Compass,
  Zap,
  X,
  Sparkles,
  LogOut,
  Sun,
  Moon,
  Trash2,
} from "lucide-react";

// ── Données de navigation (miroir de Sidebar.tsx, gardé local pour découplage) ─
type NavItem = { path: string; label: string; section: string };

const NAV: NavItem[] = [
  { path: "/", label: "Dashboard", section: "Accueil" },
  { path: "/my-cryptoia", label: "My CryptoIA", section: "Mon Espace" },
  { path: "/gamification", label: "Gamification & Badges", section: "Mon Espace" },
  { path: "/fear-greed", label: "Fear & Greed", section: "Marché" },
  { path: "/dominance", label: "Dominance", section: "Marché" },
  { path: "/altcoin-season", label: "Altcoin Season", section: "Marché" },
  { path: "/heatmap", label: "Heatmap", section: "Marché" },
  { path: "/bullrun-phase", label: "Bullrun Phase", section: "Marché" },
  { path: "/market-regime", label: "Market Regime", section: "Marché" },
  { path: "/alertes-ia", label: "Alertes IA", section: "IA & Analyse" },
  { path: "/score-confiance-ia", label: "Score Confiance IA", section: "IA & Analyse" },
  { path: "/simulateur-strategie-ia", label: "Simulateur Stratégie IA", section: "IA & Analyse" },
  { path: "/rapport-hebdomadaire-ia", label: "Rapport Hebdomadaire IA", section: "IA & Analyse" },
  { path: "/backtesting-visuel", label: "Backtesting Visuel IA", section: "IA & Analyse" },
  { path: "/predictions", label: "Prédictions Crypto", section: "IA & Analyse" },
  { path: "/prediction-ia", label: "Prédiction IA", section: "IA & Analyse" },
  { path: "/crypto-ia", label: "Crypto IA", section: "IA & Analyse" },
  { path: "/token-scanner", label: "AI Token Scanner", section: "IA & Analyse" },
  { path: "/opportunity-scanner", label: "Scanner Opportunités", section: "IA & Analyse" },
  { path: "/whale-watcher", label: "Whale Watcher", section: "IA & Analyse" },
  { path: "/technical-analysis", label: "Analyse Technique", section: "IA & Analyse" },
  { path: "/gem-hunter", label: "Gem Hunter", section: "IA & Analyse" },
  { path: "/ai-signals", label: "AI Signals", section: "IA & Analyse" },
  { path: "/ai-patterns", label: "Patterns IA", section: "IA & Analyse" },
  { path: "/ai-sentiment", label: "Sentiment IA", section: "IA & Analyse" },
  { path: "/position-sizer", label: "Position Sizer", section: "IA & Analyse" },
  { path: "/ai-setup-builder", label: "AI Setup Builder", section: "IA & Analyse" },
  { path: "/narrative-radar", label: "Narrative Radar", section: "IA & Analyse" },
  { path: "/pepites-crypto", label: "Pépites Crypto", section: "IA & Analyse" },
  { path: "/rug-scam-shield", label: "Rug Shield", section: "IA & Analyse" },
  { path: "/strategy", label: "Stratégie", section: "Trading" },
  { path: "/spot-trading", label: "Spot Trading", section: "Trading" },
  { path: "/calculatrice", label: "Calculatrice", section: "Trading" },
  { path: "/trades", label: "Swing Trading", section: "Trading" },
  { path: "/scalp", label: "Scalp Trading", section: "Trading" },
  { path: "/range", label: "Range Trading", section: "Trading" },
  { path: "/risk-management", label: "Risk Management", section: "Trading" },
  { path: "/watchlist", label: "Watchlist", section: "Trading" },
  { path: "/graphiques", label: "Graphiques", section: "Trading" },
  { path: "/backtesting", label: "Backtesting", section: "Trading" },
  { path: "/portfolio-tracker", label: "Portfolio", section: "Trading" },
  { path: "/timeframe-analysis", label: "Timeframe Analysis", section: "Trading" },
  { path: "/crypto-journal", label: "Journal de Trading", section: "Trading" },
  { path: "/screener-technique", label: "Screener Technique", section: "Trading" },
  { path: "/dtrading-ia-pro", label: "Dtrading IA PRO", section: "Trading" },
  { path: "/assistant-ia", label: "Assistant IA Conversationnel", section: "Assistant" },
  { path: "/stats-avancees", label: "Stats Avancées", section: "Outils" },
  { path: "/simulation", label: "Simulation", section: "Outils" },
  { path: "/convertisseur", label: "Convertisseur", section: "Outils" },
  { path: "/calendrier", label: "Calendrier", section: "Outils" },
  { path: "/news", label: "Nouvelles", section: "Outils" },
  { path: "/success-stories", label: "Success Stories", section: "Outils" },
  { path: "/onchain-metrics", label: "On-Chain", section: "Outils" },
  { path: "/defi-yield", label: "DeFi Yield", section: "Outils" },
  { path: "/trading-academy", label: "Trading Academy", section: "Outils" },
  { path: "/telechargement", label: "Téléchargements", section: "Outils" },
  { path: "/contact", label: "Contact", section: "Outils" },
  { path: "/abonnements", label: "Abonnements", section: "Compte" },
  { path: "/affiliation", label: "Affiliation 30%", section: "Compte" },
  { path: "/magic-strategy", label: "Indicateur Magic JB IA", section: "Compte" },
  { path: "/admin", label: "Admin Panel", section: "Admin" },
  { path: "/admin/analytics", label: "Admin Analytics", section: "Admin" },
  { path: "/mon-compte", label: "Mon Compte", section: "Compte" },
];

type CoinHit = { id: string; name: string; symbol: string; thumb: string; market_cap_rank?: number };

// Petit util fuzzy
function fuzzyScore(query: string, text: string) {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return 1;
  if (t.includes(q)) return 100 - (t.indexOf(q) * 0.5);
  // match all chars in order
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length ? 30 - (t.length - q.length) * 0.1 : 0;
}

export default function CommandPalette() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coins, setCoins] = useState<CoinHit[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Hotkey Cmd+K / Ctrl+K + "/"
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          (target as HTMLElement).isContentEditable);

      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "/" && !inField && !open) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Autofocus + reset
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Crypto search debounced (utilise proxy /api/coingecko/search)
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setCoins([]);
      return;
    }
    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/coingecko/search?query=${encodeURIComponent(q)}`, {
          signal: ctl.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const list: CoinHit[] = (data?.coins || []).slice(0, 5).map((c: any) => ({
          id: c.id,
          name: c.name,
          symbol: c.symbol,
          thumb: c.thumb,
          market_cap_rank: c.market_cap_rank,
        }));
        setCoins(list);
      } catch {
        /* ignore */
      }
    }, 220);
    return () => {
      ctl.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  // Actions
  const actions = useMemo(
    () => [
      {
        id: "act-logout",
        label: t("commandPalette.actions.logout"),
        icon: LogOut,
        run: () => {
          try {
            localStorage.removeItem("cryptoia_user");
            sessionStorage.clear();
          } catch {}
          window.location.href = "/login";
        },
      },
      {
        id: "act-clear-cache",
        label: t("commandPalette.actions.clearCache"),
        icon: Trash2,
        run: () => {
          try {
            localStorage.clear();
            sessionStorage.clear();
            if ("caches" in window) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
          } catch {}
          window.location.reload();
        },
      },
      {
        id: "act-theme",
        label: t("commandPalette.actions.toggleTheme"),
        icon: document.documentElement.classList.contains("light") ? Moon : Sun,
        run: () => {
          document.documentElement.classList.toggle("light");
        },
      },
      {
        id: "act-affiliation",
        label: t("commandPalette.actions.affiliation"),
        icon: Sparkles,
        run: () => navigate("/affiliation"),
      },
    ],
    [navigate, t]
  );

  // Résultats filtrés
  const filteredNav = useMemo(() => {
    if (!query.trim()) return NAV.slice(0, 8);
    return NAV.map((n) => ({ n, s: fuzzyScore(query, n.label) + fuzzyScore(query, n.section) * 0.2 }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => x.n);
  }, [query]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return [];
    return actions.filter((a) => fuzzyScore(query, a.label) > 0).slice(0, 4);
  }, [query, actions]);

  // Flatten list for keyboard navigation
  const flatItems = useMemo(() => {
    const items: Array<{ kind: "nav" | "coin" | "action"; payload: any; key: string }> = [];
    filteredNav.forEach((n) => items.push({ kind: "nav", payload: n, key: `nav-${n.path}` }));
    coins.forEach((c) => items.push({ kind: "coin", payload: c, key: `coin-${c.id}` }));
    filteredActions.forEach((a) => items.push({ kind: "action", payload: a, key: a.id }));
    return items;
  }, [filteredNav, coins, filteredActions]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const choose = (item: (typeof flatItems)[number]) => {
    if (item.kind === "nav") {
      navigate(item.payload.path);
    } else if (item.kind === "coin") {
      navigate(`/prediction/${item.payload.id}`);
    } else if (item.kind === "action") {
      item.payload.run();
    }
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!flatItems.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % flatItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = flatItems[selectedIndex];
      if (it) choose(it);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selectedIndex}"]`) as HTMLElement | null;
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!open) return null;

  let idxCounter = -1;
  const nextIdx = () => ++idxCounter;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      data-testid="command-palette-overlay"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-[cmdkfade_180ms_ease]" />

      <div
        className="relative w-full max-w-2xl bg-[#0F1422]/95 border border-white/[0.08] rounded-2xl shadow-2xl shadow-indigo-500/10 overflow-hidden animate-[cmdkpop_220ms_cubic-bezier(.22,.61,.36,1)]"
        data-testid="command-palette"
      >
        {/* Input bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <SearchIcon className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("commandPalette.placeholder")}
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
            data-testid="command-palette-input"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-gray-400 bg-white/[0.05] rounded border border-white/[0.06]">
            ESC
          </kbd>
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-gray-500 hover:text-white transition-colors"
            aria-label={t("common.close")}
            data-testid="command-palette-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto py-2">
          {filteredNav.length > 0 && (
            <Section icon={<Compass className="w-3.5 h-3.5" />} label={query ? t("commandPalette.sections.pages") : t("commandPalette.sections.suggestions")}>
              {filteredNav.map((n) => {
                const i = nextIdx();
                return (
                  <Row
                    key={`nav-${n.path}`}
                    idx={i}
                    selected={selectedIndex === i}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onClick={() => choose({ kind: "nav", payload: n, key: `nav-${n.path}` })}
                  >
                    <Compass className="w-4 h-4 text-indigo-400" />
                    <span className="flex-1 text-sm text-white">{n.label}</span>
                    <span className="text-[10px] uppercase tracking-wide text-gray-500">{n.section}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
                  </Row>
                );
              })}
            </Section>
          )}

          {coins.length > 0 && (
            <Section icon={<Coins className="w-3.5 h-3.5" />} label={t("commandPalette.sections.cryptos")}>
              {coins.map((c) => {
                const i = nextIdx();
                return (
                  <Row
                    key={`coin-${c.id}`}
                    idx={i}
                    selected={selectedIndex === i}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onClick={() => choose({ kind: "coin", payload: c, key: `coin-${c.id}` })}
                  >
                    {c.thumb ? (
                      <img src={c.thumb} alt={c.symbol} className="w-5 h-5 rounded-full" />
                    ) : (
                      <Coins className="w-4 h-4 text-amber-400" />
                    )}
                    <div className="flex-1 min-w-0 flex items-baseline gap-2">
                      <span className="text-sm text-white truncate">{c.name}</span>
                      <span className="text-[10px] uppercase text-gray-500">{c.symbol}</span>
                    </div>
                    {c.market_cap_rank ? (
                      <span className="text-[10px] text-gray-500">#{c.market_cap_rank}</span>
                    ) : null}
                    <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
                  </Row>
                );
              })}
            </Section>
          )}

          {filteredActions.length > 0 && (
            <Section icon={<Zap className="w-3.5 h-3.5" />} label={t("commandPalette.sections.actions")}>
              {filteredActions.map((a) => {
                const i = nextIdx();
                const Icon = a.icon;
                return (
                  <Row
                    key={a.id}
                    idx={i}
                    selected={selectedIndex === i}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onClick={() => choose({ kind: "action", payload: a, key: a.id })}
                  >
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span className="flex-1 text-sm text-white">{a.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
                  </Row>
                );
              })}
            </Section>
          )}

          {flatItems.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-500">{t("commandPalette.noResults", { query })}</p>
              <p className="text-xs text-gray-600 mt-1">{t("commandPalette.tryExamples")}</p>
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded border border-white/[0.06]">↑↓</kbd>
              {t("commandPalette.hints.navigate")}
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded border border-white/[0.06]">↵</kbd>
              {t("commandPalette.hints.open")}
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded border border-white/[0.06]">esc</kbd>
              {t("commandPalette.hints.close")}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <CommandIcon className="w-3 h-3" />
            <span>K</span>
            <span className="text-gray-700">·</span>
            <span className="text-indigo-400 font-bold">CryptoIA</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cmdkfade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cmdkpop {
          from { opacity: 0; transform: translateY(-8px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-2 py-1">
      <div className="px-3 py-1.5 flex items-center gap-2 text-[10px] uppercase tracking-wide text-gray-500 font-bold">
        {icon}
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({
  idx,
  selected,
  children,
  onClick,
  onMouseEnter,
}: {
  idx: number;
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <button
      type="button"
      data-idx={idx}
      data-testid={`command-palette-row-${idx}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg mx-1 transition-colors ${
        selected ? "bg-indigo-500/15 ring-1 ring-indigo-500/30" : "hover:bg-white/[0.04]"
      }`}
    >
      {children}
    </button>
  );
}
