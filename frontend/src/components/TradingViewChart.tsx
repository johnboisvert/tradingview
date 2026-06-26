// Embed-only TradingView widget for the Trading Challenge.
// Symbol mapping: CRYPTO ticker → TradingView format (BINANCE:BTCUSDT)
import { useEffect, useRef } from "react";

interface Props {
  symbol: string;
  height?: number;
  /** Unique suffix to avoid container ID collision when multiple charts render */
  idSuffix?: string;
}

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

// TradingView always uses Binance symbols where possible; fallback to ones that exist on Binance
function toTvSymbol(s: string): string {
  const up = s.toUpperCase();
  // Common exceptions where Binance doesn't list, use Coinbase or fallback
  const overrides: Record<string, string> = {
    XMR: "KRAKEN:XMRUSD",
    BCH: "BINANCE:BCHUSDT",
    HBAR: "BINANCE:HBARUSDT",
  };
  if (overrides[up]) return overrides[up];
  return `BINANCE:${up}USDT`;
}

export default function TradingViewChart({ symbol, height, idSuffix }: Props) {
  // Unique container ID per chart instance to avoid DOM collision when multiple charts mount
  const containerId = "tv_chart_" + symbol + (idSuffix ? `_${idSuffix}` : "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    function build() {
      if (cancelled || !ref.current || !window.TradingView) return;
      ref.current.innerHTML = "";
      try {
        new window.TradingView.widget({
          autosize: true,
          symbol: toTvSymbol(symbol),
          interval: "60",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "fr",
          toolbar_bg: "#0a0a0f",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          allow_symbol_change: false,
          container_id: containerId,
          studies: ["MASimple@tv-basicstudies", "Volume@tv-basicstudies"],
          backgroundColor: "rgba(10,10,15,1)",
          gridColor: "rgba(255,255,255,0.04)",
        });
      } catch {
        // Silent fallback if widget fails to load
      }
    }

    if (window.TradingView?.widget) {
      build();
    } else {
      const existing = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
      if (!existing) {
        const s = document.createElement("script");
        s.src = "https://s3.tradingview.com/tv.js";
        s.async = true;
        s.onload = build;
        document.head.appendChild(s);
      } else {
        existing.addEventListener("load", build);
      }
    }
    return () => { cancelled = true; };
  }, [symbol, containerId]);

  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-[#0a0a0f] w-full h-full" style={height ? { height } : undefined}>
      <div id={containerId} ref={ref} className="w-full h-full" data-testid="tradingview-chart" />
    </div>
  );
}
