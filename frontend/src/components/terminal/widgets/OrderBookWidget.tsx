// Bloomberg-style Order Book Depth widget.
// Pulls Binance public depth API (top 20 bids/asks) every 2s.
// Renders bid/ask columns with cumulative depth bars behind each row.
import { useEffect, useMemo, useState } from "react";

interface Props {
  symbol: string;
}

type Level = [string, string]; // [price, qty]

interface Depth {
  lastUpdateId: number;
  bids: Level[];
  asks: Level[];
}

function toBinancePair(symbol: string): string {
  const up = symbol.toUpperCase();
  const overrides: Record<string, string> = {
    XMR: "", // not on Binance USDT spot
  };
  if (overrides[up] === "") return "";
  return `${up}USDT`;
}

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toFixed(1);
  if (p >= 1) return p.toFixed(3);
  if (p >= 0.01) return p.toFixed(5);
  return p.toFixed(8);
}

function fmtQty(q: number): string {
  if (q >= 1_000_000) return (q / 1_000_000).toFixed(2) + "M";
  if (q >= 1_000) return (q / 1_000).toFixed(2) + "K";
  if (q >= 1) return q.toFixed(2);
  return q.toFixed(4);
}

export default function OrderBookWidget({ symbol }: Props) {
  const [depth, setDepth] = useState<Depth | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pair = toBinancePair(symbol);
    if (!pair) {
      setErr(`${symbol} non disponible sur Binance`);
      setDepth(null);
      return;
    }
    setErr(null);

    const fetchDepth = async () => {
      try {
        const r = await fetch(`https://api.binance.com/api/v3/depth?symbol=${pair}&limit=20`);
        if (!r.ok) throw new Error(String(r.status));
        const j: Depth = await r.json();
        if (!cancelled) setDepth(j);
      } catch {
        if (!cancelled) setErr("Erreur de chargement");
      }
    };

    fetchDepth();
    const id = setInterval(fetchDepth, 2000);
    return () => { cancelled = true; clearInterval(id); };
  }, [symbol]);

  // Compute cumulative sums + max, and spread
  const view = useMemo(() => {
    if (!depth) return null;
    const bids = depth.bids.slice(0, 15).map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) }));
    const asks = depth.asks.slice(0, 15).map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) }));
    let cb = 0;
    const bidsCum = bids.map(l => { cb += l.qty; return { ...l, cum: cb }; });
    let ca = 0;
    const asksCum = asks.map(l => { ca += l.qty; return { ...l, cum: ca }; });
    const maxCum = Math.max(cb, ca, 1);
    const bestBid = bids[0]?.price ?? 0;
    const bestAsk = asks[0]?.price ?? 0;
    const spread = bestAsk - bestBid;
    const spreadPct = bestBid > 0 ? (spread / bestBid) * 100 : 0;
    const mid = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : 0;
    return { bids: bidsCum, asks: asksCum.reverse(), maxCum, bestBid, bestAsk, spread, spreadPct, mid };
  }, [depth]);

  if (err) {
    return <div className="text-[10px] text-white/40 p-2 text-center">{err}</div>;
  }
  if (!view) {
    return <div className="text-[10px] text-white/40 p-2 text-center animate-pulse">Chargement du carnet…</div>;
  }

  return (
    <div className="flex flex-col h-full" data-testid="orderbook-widget">
      {/* Header row */}
      <div className="grid grid-cols-3 text-[9px] uppercase tracking-wider text-white/40 px-1 pb-1 border-b border-white/5">
        <span>Prix</span>
        <span className="text-right">Qté</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (reversed, low → high visually top → bottom flip) */}
      <ul className="flex-1 overflow-y-auto text-[10px] leading-tight font-mono">
        {view.asks.map((l, i) => {
          const pct = (l.cum / view.maxCum) * 100;
          return (
            <li key={`a-${i}`} className="relative grid grid-cols-3 items-center px-1 py-[1px]">
              <span className="absolute inset-y-0 right-0 bg-red-500/10" style={{ width: `${pct}%` }} />
              <span className="relative text-red-400 tabular-nums">{fmtPrice(l.price)}</span>
              <span className="relative text-white/70 text-right tabular-nums">{fmtQty(l.qty)}</span>
              <span className="relative text-white/40 text-right tabular-nums">{fmtQty(l.cum)}</span>
            </li>
          );
        })}
      </ul>

      {/* Spread */}
      <div className="flex items-center justify-between px-1 py-1 border-y border-amber-500/30 bg-amber-500/5">
        <span className="text-[10px] text-amber-300 font-black tabular-nums">
          {fmtPrice(view.mid)}
        </span>
        <span className="text-[9px] text-white/50 uppercase">
          Spread {fmtPrice(view.spread)} · {view.spreadPct.toFixed(3)}%
        </span>
      </div>

      {/* Bids */}
      <ul className="flex-1 overflow-y-auto text-[10px] leading-tight font-mono">
        {view.bids.map((l, i) => {
          const pct = (l.cum / view.maxCum) * 100;
          return (
            <li key={`b-${i}`} className="relative grid grid-cols-3 items-center px-1 py-[1px]">
              <span className="absolute inset-y-0 right-0 bg-emerald-500/10" style={{ width: `${pct}%` }} />
              <span className="relative text-emerald-400 tabular-nums">{fmtPrice(l.price)}</span>
              <span className="relative text-white/70 text-right tabular-nums">{fmtQty(l.qty)}</span>
              <span className="relative text-white/40 text-right tabular-nums">{fmtQty(l.cum)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
