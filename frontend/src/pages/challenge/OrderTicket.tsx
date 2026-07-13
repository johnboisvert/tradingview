// Order ticket panel — NinjaTrader-style controlled form. The parent owns all
// state (side, leverage, qty, SL/TP, mode, mobile-modal) and just passes it down
// with setters. This keeps the page-level logic (executeTrade, setMaxBuy,
// setPctBalance) untouched while moving ~150 lines of JSX out of Challenge.tsx.
import type { Me } from "./types";
import { fmtPrice, fmtUsd, fmtQty } from "./format";
import { Row } from "./ui";

interface Props {
  me: Me;
  tradeSym: string;
  livePrice: number;
  side: "long" | "short";
  setSide: (s: "long" | "short") => void;
  inputMode: "usd" | "qty";
  setInputMode: (m: "usd" | "qty") => void;
  usdAmount: string;
  setUsdAmount: (v: string) => void;
  tradeQty: string;
  setTradeQty: (v: string) => void;
  leverage: number;
  setLeverage: (n: number) => void;
  slInput: string;
  setSlInput: (v: string) => void;
  tpInput: string;
  setTpInput: (v: string) => void;
  busy: boolean;
  showMobileTicket: boolean;
  setShowMobileTicket: (v: boolean) => void;
  executeTrade: () => void;
  setMaxBuy: () => void;
  setPctBalance: (p: number) => void;
  quickAmounts: number[];
}

export default function OrderTicket({
  me,
  tradeSym,
  livePrice,
  side, setSide,
  inputMode, setInputMode,
  usdAmount, setUsdAmount,
  tradeQty, setTradeQty,
  leverage, setLeverage,
  slInput, setSlInput,
  tpInput, setTpInput,
  busy,
  showMobileTicket, setShowMobileTicket,
  executeTrade,
  setMaxBuy,
  setPctBalance,
  quickAmounts,
}: Props) {
  // Order preview values are derived here to keep parent free of presentation math.
  let previewQty = 0, previewUsd = 0;
  if (inputMode === "usd") {
    previewUsd = parseFloat(usdAmount) || 0;
    previewQty = livePrice > 0 ? previewUsd / livePrice : 0;
  } else {
    previewQty = parseFloat(tradeQty) || 0;
    previewUsd = previewQty * livePrice;
  }
  const showPreview = previewQty > 0 && livePrice > 0;
  const collateral = showPreview ? previewUsd / leverage : 0;
  const newBalance = me.balance - collateral;
  const liqPerUnit = previewQty > 0 ? collateral / previewQty : 0;
  const previewLiq = side === "long" ? Math.max(0, livePrice - liqPerUnit) : livePrice + liqPerUnit;

  return (
    <div className={`${showMobileTicket ? "fixed inset-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm p-3 overflow-y-auto" : "hidden"} lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0 lg:block lg:overflow-visible`}>
      <div className="bg-[#0d0e16] border border-white/[0.06] rounded-2xl p-4" data-testid="challenge-trade-form">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-300">Order Ticket</h3>
          <span className="text-[10px] text-gray-500 font-mono">{tradeSym}/USD</span>
        </div>

        {/* Cash disponible — always visible in the ticket */}
        <div data-testid="ticket-cash" className={`flex items-center justify-between mb-3 px-2.5 py-1.5 rounded-lg border font-mono ${me.balance < 1 ? "bg-orange-500/10 border-orange-500/30" : "bg-emerald-500/[0.06] border-emerald-500/20"}`}>
          <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Cash disponible</span>
          <span className={`text-sm font-black ${me.balance < 1 ? "text-orange-300" : "text-emerald-300"}`}>${fmtUsd(me.balance)}</span>
        </div>

        {/* Side: LONG / SHORT */}
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          <button data-testid="trade-side-long" onClick={() => setSide("long")} className={`py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition ${side === "long" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30" : "bg-white/[0.05] text-emerald-400 hover:bg-emerald-500/10"}`}>↗ Long</button>
          <button data-testid="trade-side-short" onClick={() => setSide("short")} className={`py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition ${side === "short" ? "bg-red-500 text-black shadow-lg shadow-red-500/30" : "bg-white/[0.05] text-red-400 hover:bg-red-500/10"}`}>↘ Short</button>
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-0.5 mb-2 p-0.5 bg-black/40 rounded-md border border-white/[0.04]">
          <button data-testid="trade-mode-usd" onClick={() => setInputMode("usd")} className={`py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition ${inputMode === "usd" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>USD Amount</button>
          <button data-testid="trade-mode-qty" onClick={() => setInputMode("qty")} className={`py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition ${inputMode === "qty" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>Quantity</button>
        </div>

        {inputMode === "usd" ? (
          <>
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
              <input
                data-testid="trade-usd-input"
                type="number" step="any" min="0"
                value={usdAmount}
                onChange={(e) => setUsdAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-black/40 border border-white/[0.08] text-white text-base font-extrabold focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>
            <div className="grid grid-cols-5 gap-1 mb-2">
              {quickAmounts.map((a) => (
                <button key={a} data-testid={`trade-quick-${a}`} onClick={() => setUsdAmount(a.toString())} className="py-1.5 rounded text-[10px] font-bold bg-white/[0.04] hover:bg-white/[0.1] text-gray-400 hover:text-white transition">${a}</button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1 mb-2">
              {[0.25, 0.5, 0.75, 1].map((p) => (
                <button key={p} data-testid={`trade-pct-${p * 100}`} onClick={() => setPctBalance(p)} className="py-1.5 rounded text-[10px] font-bold bg-white/[0.04] hover:bg-amber-500/20 text-amber-300 transition">
                  {p * 100}%
                </button>
              ))}
            </div>
          </>
        ) : (
          <input
            data-testid="trade-qty-input"
            type="number" step="any" min="0"
            value={tradeQty}
            onChange={(e) => setTradeQty(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/[0.08] text-white text-base font-extrabold mb-2 focus:outline-none focus:border-amber-500/50 font-mono"
            placeholder={`0.01 ${tradeSym}`}
          />
        )}

        <button data-testid="trade-max-button" onClick={setMaxBuy} className="w-full mb-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition">
          Max · ${fmtUsd(me.balance * leverage)} ({leverage}x)
        </button>
        {me.balance < 1 && Object.keys(me.positions || {}).length > 0 && (
          <p data-testid="ticket-no-cash-hint" className="text-[9px] text-orange-300/90 mb-2 font-bold">
            💡 Cash à $0 : toute ta balance est en marge sur tes positions ouvertes. Ferme une position pour trader à nouveau.
          </p>
        )}
        <div className="mb-2" />

        {/* Leverage selector — 1x to 50x */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Leverage</label>
            <span className="font-mono font-extrabold text-amber-300 text-sm">{leverage}x</span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {[1, 2, 5, 10, 25, 50].map((l) => (
              <button
                key={l}
                data-testid={`trade-lev-${l}`}
                onClick={() => setLeverage(l)}
                className={`py-1.5 rounded text-[10px] font-extrabold transition ${leverage === l ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30" : "bg-white/[0.04] text-gray-400 hover:bg-amber-500/20 hover:text-amber-300"}`}
              >
                {l}x
              </button>
            ))}
          </div>
          {leverage >= 10 && (
            <p className="text-[9px] text-amber-400 mt-1 font-bold">⚠️ Levier élevé : risque de liquidation rapide</p>
          )}
        </div>

        {/* SL / TP inputs */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[9px] text-red-400 font-bold uppercase tracking-wider mb-1 block">Stop Loss</label>
            <input
              data-testid="trade-sl-input"
              type="number" step="any" min="0"
              value={slInput}
              onChange={(e) => setSlInput(e.target.value)}
              placeholder={livePrice ? `< $${fmtPrice(livePrice)}` : "—"}
              className="w-full px-2.5 py-2 rounded-lg bg-black/40 border border-red-500/20 text-red-300 text-xs font-extrabold focus:outline-none focus:border-red-500/50 font-mono"
            />
            {/* Quick % SL buttons — work for all prices including shitcoins (PEPE/SHIB) */}
            <div className="grid grid-cols-3 gap-0.5 mt-1">
              {[2, 5, 10].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  data-testid={`trade-sl-pct-${pct}`}
                  onClick={() => {
                    if (!livePrice) return;
                    const factor = side === "long" ? 1 - pct / 100 : 1 + pct / 100;
                    setSlInput(String(livePrice * factor));
                  }}
                  className="py-1 rounded text-[9px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-300 transition"
                >-{pct}%</button>
              ))}
            </div>
            {slInput && livePrice > 0 && (
              <div className="text-[9px] text-gray-500 mt-0.5 font-mono">
                Risque: {side === "long"
                  ? `-${(((livePrice - parseFloat(slInput)) / livePrice) * 100).toFixed(2)}%`
                  : `-${(((parseFloat(slInput) - livePrice) / livePrice) * 100).toFixed(2)}%`}
              </div>
            )}
          </div>
          <div>
            <label className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mb-1 block">Take Profit</label>
            <input
              data-testid="trade-tp-input"
              type="number" step="any" min="0"
              value={tpInput}
              onChange={(e) => setTpInput(e.target.value)}
              placeholder={livePrice ? `> $${fmtPrice(livePrice)}` : "—"}
              className="w-full px-2.5 py-2 rounded-lg bg-black/40 border border-emerald-500/20 text-emerald-300 text-xs font-extrabold focus:outline-none focus:border-emerald-500/50 font-mono"
            />
            {/* Quick % TP buttons */}
            <div className="grid grid-cols-3 gap-0.5 mt-1">
              {[5, 10, 25].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  data-testid={`trade-tp-pct-${pct}`}
                  onClick={() => {
                    if (!livePrice) return;
                    const factor = side === "long" ? 1 + pct / 100 : 1 - pct / 100;
                    setTpInput(String(livePrice * factor));
                  }}
                  className="py-1 rounded text-[9px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition"
                >+{pct}%</button>
              ))}
            </div>
            {tpInput && livePrice > 0 && (
              <div className="text-[9px] text-gray-500 mt-0.5 font-mono">
                Gain: {side === "long"
                  ? `+${(((parseFloat(tpInput) - livePrice) / livePrice) * 100).toFixed(2)}%`
                  : `+${(((livePrice - parseFloat(tpInput)) / livePrice) * 100).toFixed(2)}%`}
              </div>
            )}
          </div>
        </div>

        {/* Order preview */}
        {showPreview && (
          <div className="mb-3 p-2.5 rounded-lg bg-black/40 border border-white/[0.04] text-[10px] space-y-1 font-mono" data-testid="trade-preview">
            <Row k="SIDE" v={`${side.toUpperCase()} ${leverage}x`} accent={side === "long" ? "cyan" : "red"} />
            <Row k="QTY" v={`${fmtQty(previewQty)} ${tradeSym}`} />
            <Row k="ENTRY" v={`$${fmtPrice(livePrice)}`} />
            <Row k="NOTIONAL" v={`$${fmtUsd(previewUsd)}`} />
            <Row k="COLLATERAL" v={`$${fmtUsd(collateral)}`} />
            {leverage > 1 && <Row k="LIQ. PRICE" v={`$${fmtPrice(previewLiq)}`} accent="red" />}
            <Row k="CASH AFTER" v={`$${fmtUsd(newBalance)}`} accent={newBalance < 0 ? "red" : "cyan"} />
          </div>
        )}

        <button
          data-testid="trade-execute"
          onClick={executeTrade}
          disabled={busy}
          className={`w-full py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider transition disabled:opacity-50 ${side === "long" ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20" : "bg-red-500 hover:bg-red-400 text-black shadow-lg shadow-red-500/20"}`}
        >
          {busy ? "..." : `Open ${side.toUpperCase()} ${leverage}x · ${tradeSym} · Market`}
        </button>
        <p className="text-[9px] text-gray-600 mt-2 text-center font-mono uppercase tracking-wider">CoinGecko · 0 fees · Max 50x leverage</p>

        {/* Mobile close button */}
        <button
          onClick={() => setShowMobileTicket(false)}
          data-testid="mobile-ticket-close"
          className="lg:hidden mt-3 w-full py-2.5 rounded-lg bg-white/[0.05] text-gray-400 text-[11px] font-bold uppercase tracking-wider hover:bg-white/[0.1] transition"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
