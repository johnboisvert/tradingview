// Terminal Help modal — accessible via @help command or ? key.
// Shows all commands, keyboard shortcuts, and widget descriptions.
import { X, Command, Terminal, Search, Zap } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    title: "Command Bar",
    icon: Command,
    color: "amber",
    items: [
      { key: "⌘K / Ctrl+K", desc: "Ouvrir la command bar (n'importe où sur le terminal)" },
      { key: "ESC", desc: "Fermer la command bar" },
      { key: "↑ ↓", desc: "Naviguer dans les suggestions" },
      { key: "↵ Enter", desc: "Exécuter la commande sélectionnée" },
    ],
  },
  {
    title: "Symboles",
    icon: Search,
    color: "cyan",
    items: [
      { key: "BTC", desc: "Charger BTC sur le chart principal" },
      { key: "ETH", desc: "Charger ETH sur le chart" },
      { key: "PEPE / SHIB…", desc: "N'importe quel symbol des 41 cryptos supportées" },
      { key: "PEP (partiel)", desc: "Autocomplete affiche tous les matches" },
    ],
  },
  {
    title: "Actions rapides",
    icon: Zap,
    color: "green",
    items: [
      { key: "@help", desc: "Afficher cette aide" },
      { key: "@reset", desc: "Réinitialiser le chart sur BTC" },
      { key: "@sound", desc: "Toggle alertes sonores (whales)" },
      { key: "@chart2", desc: "Afficher/masquer un second chart (multi-chart)" },
      { key: "@orderbook", desc: "Afficher/masquer le carnet d'ordres (Binance depth)" },
      { key: "@lock", desc: "Verrouiller / déverrouiller le layout drag-drop" },
      { key: "@reset-layout", desc: "Réinitialiser le layout au preset actuel" },
      { key: "@news", desc: "Focus le panneau NWS (surbrillance 2s)" },
      { key: "@whales", desc: "Focus le panneau WHL" },
      { key: "@feed", desc: "Focus le panneau FED (community trades)" },
      { key: "@signals", desc: "Focus le panneau SIG (Fear/Greed, dominance)" },
      { key: "@layout1", desc: "Layout Chart-Dominant (chart 8×8, sidebar 4)" },
      { key: "@layout2", desc: "Layout Watchlist (chart 7×7, ticker large)" },
      { key: "@scalping", desc: "Preset Scalping (chart + ticker 6×6, news bar horizontal)" },
      { key: "@swing", desc: "Preset Swing (chart XXL 9×9, widgets compacts)" },
      { key: "@multichart", desc: "Preset Multi-Chart (BTC + ETH + Order Book côte à côte)" },
    ],
  },
  {
    title: "Widgets",
    icon: Terminal,
    color: "amber",
    items: [
      { key: "TVL", desc: "Chart TradingView temps réel (Binance)" },
      { key: "TV2", desc: "Second chart TradingView (multi-chart)" },
      { key: "TCK", desc: "Ticker live 41 cryptos · clic pour swap chart" },
      { key: "SIG", desc: "Fear & Greed + BTC.D / ETH.D + Total Market Cap" },
      { key: "OBK", desc: "Carnet d'ordres Binance temps réel (bids/asks)" },
      { key: "WHL", desc: "Détection accumulation/distribution en temps réel" },
      { key: "NWS", desc: "Actualités crypto avec timestamps relatifs" },
      { key: "FED", desc: "Trades LIVE de la communauté Challenge" },
    ],
  },
];

export default function HelpModal({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div
      data-testid="terminal-help-modal"
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[85vh] bg-black border-2 border-amber-500/60 shadow-2xl shadow-amber-500/20 rounded overflow-hidden font-mono flex flex-col"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-amber-500/30 bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">CryptoIA Terminal · Help</h2>
          </div>
          <button
            data-testid="help-close"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          <p className="text-white/60 mb-5 leading-relaxed">
            Le terminal est <b className="text-amber-300">100% pilotable au clavier</b>. Ouvre la command bar avec{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px]">⌘K</kbd>{" "}
            (Mac) ou{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px]">Ctrl+K</kbd>{" "}
            (Windows), puis tape n'importe quel symbol crypto ou une commande <code className="text-cyan-400">@nom</code>.
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const colorCls = sec.color === "amber" ? "text-amber-400 border-amber-500/40"
                : sec.color === "cyan" ? "text-cyan-400 border-cyan-500/40"
                : "text-emerald-400 border-emerald-500/40";
              return (
                <section key={sec.title}>
                  <h3 className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-black mb-2 pb-1 border-b ${colorCls}`}>
                    <Icon className="w-3 h-3" /> {sec.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {sec.items.map((it, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <kbd className="flex-shrink-0 px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-white/90 text-[10px] font-bold min-w-[70px] text-center">
                          {it.key}
                        </kbd>
                        <span className="text-white/70 text-[11px] leading-tight pt-0.5">{it.desc}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-white/40 uppercase tracking-wider text-center">
            Sources data : CoinGecko · Binance · alternative.me · CryptoIA API
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-white/[0.02] text-[10px] text-white/40 uppercase tracking-wider flex-shrink-0">
          <span>Press <kbd className="text-amber-300">?</kbd> to reopen</span>
          <span>Version 1.0 · Elite Only</span>
        </footer>
      </div>
    </div>
  );
}
