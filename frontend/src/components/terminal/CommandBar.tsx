// Bloomberg-style command bar. Opens with Cmd/Ctrl+K.
// Type a symbol (BTC, ETH, PEPE…) to change the main chart symbol.
// Type a command (@news, @whales, @help) to trigger actions.
import { useEffect, useRef, useState } from "react";

interface Cmd {
  kind: "symbol" | "action";
  label: string;
  hint?: string;
  onSelect: () => void;
}

interface Props {
  symbols: string[];
  onSymbolSelect: (sym: string) => void;
  onAction: (name: string, arg?: string) => void;
  open: boolean;
  onClose: () => void;
}

const ACTIONS = [
  { name: "help",         label: "@help",         hint: "Show all commands" },
  { name: "news",         label: "@news",         hint: "Focus news panel" },
  { name: "whales",       label: "@whales",       hint: "Focus whales panel" },
  { name: "feed",         label: "@feed",         hint: "Focus community feed" },
  { name: "signals",      label: "@signals",      hint: "Focus signals panel" },
  { name: "reset",        label: "@reset",        hint: "Reset chart to BTC" },
  { name: "sound",        label: "@sound",        hint: "Toggle sound alerts (whales)" },
  { name: "sync",         label: "@sync",         hint: "Sync cloud du layout (multi-appareils)" },
  { name: "chart2",       label: "@chart2",       hint: "Toggle secondary chart (multi-chart)" },
  { name: "orderbook",    label: "@orderbook",    hint: "Toggle order book depth widget" },
  { name: "funding",      label: "@funding",      hint: "Toggle funding rates widget (perps)" },
  { name: "options",      label: "@options",      hint: "Toggle options chain widget (Deribit)" },
  { name: "share",        label: "@share",        hint: "Partager mon layout (X/Discord)" },
  { name: "lock",         label: "@lock",         hint: "Verrouiller / déverrouiller le layout" },
  { name: "reset-layout", label: "@reset-layout", hint: "Réinitialiser le layout au preset actuel" },
  { name: "layout1",      label: "@layout1",      hint: "Default layout (chart-dominant)" },
  { name: "layout2",      label: "@layout2",      hint: "Watchlist layout" },
  { name: "scalping",     label: "@scalping",     hint: "Scalping preset (dense ticker)" },
  { name: "swing",        label: "@swing",        hint: "Swing preset (large chart)" },
  { name: "multichart",   label: "@multichart",   hint: "Preset Multi-chart (BTC + ETH + orderbook)" },
];

export default function CommandBar({ symbols, onSymbolSelect, onAction, open, onClose }: Props) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  // Build candidate list
  const term = q.trim();
  const candidates: Cmd[] = [];
  if (term.startsWith("@")) {
    const t = term.slice(1).toLowerCase();
    for (const a of ACTIONS) {
      if (!t || a.name.startsWith(t)) {
        candidates.push({
          kind: "action",
          label: a.label,
          hint: a.hint,
          onSelect: () => { onAction(a.name); onClose(); },
        });
      }
    }
  } else if (term) {
    const upper = term.toUpperCase();
    for (const s of symbols) {
      if (s.includes(upper)) {
        candidates.push({
          kind: "symbol",
          label: s,
          hint: `Load ${s} on chart`,
          onSelect: () => { onSymbolSelect(s); onClose(); },
        });
      }
    }
  } else {
    // Empty query → show quick actions + top 8 symbols
    for (const a of ACTIONS.slice(0, 4)) {
      candidates.push({
        kind: "action",
        label: a.label,
        hint: a.hint,
        onSelect: () => { onAction(a.name); onClose(); },
      });
    }
    for (const s of symbols.slice(0, 6)) {
      candidates.push({
        kind: "symbol",
        label: s,
        hint: `Load ${s} on chart`,
        onSelect: () => { onSymbolSelect(s); onClose(); },
      });
    }
  }
  const list = candidates.slice(0, 12);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(list.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); list[idx]?.onSelect(); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/70 backdrop-blur-sm"
         data-testid="terminal-command-bar" onClick={onClose}>
      <div className="w-full max-w-xl mx-4 bg-black border-2 border-amber-500/50 shadow-2xl shadow-amber-500/20 rounded overflow-hidden font-mono"
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-500/20 bg-white/[0.02]">
          <span className="text-amber-400 font-black">&gt;</span>
          <input
            ref={inputRef}
            data-testid="terminal-cmd-input"
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            onKeyDown={onKeyDown}
            placeholder="Type symbol (BTC) or @command (@help)…"
            className="flex-1 bg-transparent border-0 outline-none text-amber-300 text-sm placeholder:text-white/20 font-mono"
          />
          <kbd className="text-[9px] text-white/40 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto py-1">
          {list.length === 0 && (
            <li className="px-3 py-4 text-[11px] text-white/40 text-center">— no match —</li>
          )}
          {list.map((c, i) => (
            <li key={i}
                data-testid={`terminal-cmd-item-${i}`}
                onMouseEnter={() => setIdx(i)}
                onClick={() => c.onSelect()}
                className={`flex items-center gap-3 px-3 py-1.5 cursor-pointer border-l-2 ${i === idx ? "bg-amber-500/10 border-amber-500 text-amber-300" : "border-transparent text-white/80"}`}>
              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm ${c.kind === "action" ? "bg-cyan-500/15 text-cyan-300" : "bg-amber-500/15 text-amber-300"}`}>{c.kind}</span>
              <span className="text-[12px] font-bold flex-1">{c.label}</span>
              {c.hint && <span className="text-[10px] text-white/40">{c.hint}</span>}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/5 text-[9px] text-white/40 uppercase tracking-wider">
          <span>↑↓ navigate · ↵ select · ESC close</span>
          <span>CryptoIA Terminal Pro</span>
        </div>
      </div>
    </div>
  );
}
