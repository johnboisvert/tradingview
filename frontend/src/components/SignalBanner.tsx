// Bannière globale : notifie quand un nouveau signal Scanner IA (agent Claude) vient de tomber
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, X, TrendingUp, TrendingDown } from "lucide-react";

const SEEN_KEY = "cryptoia_seen_signal_id";

interface SignalCall {
  id: number;
  symbol: string;
  side: "LONG" | "SHORT";
  entry_price: number;
  engine?: string | null;
  created_at: string;
}

export const SignalBanner = () => {
  const [signal, setSignal] = useState<SignalCall | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const check = () =>
      fetch("/api/v1/trade-calls?status=active&limit=20")
        .then((r) => r.json())
        .then((calls: SignalCall[]) => {
          if (!Array.isArray(calls)) return;
          const seen = Number(localStorage.getItem(SEEN_KEY) || 0);
          const fresh = calls
            .filter((c) => c.engine === "scanner-ia" && c.id > seen)
            .filter((c) => Date.now() - new Date(c.created_at).getTime() < 48 * 3600 * 1000)
            .sort((a, b) => b.id - a.id)[0];
          if (fresh) setSignal(fresh);
        })
        .catch(() => {});
    check();
    const iv = setInterval(check, 60000);
    return () => clearInterval(iv);
  }, []);

  if (!signal) return null;

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, String(signal.id));
    setSignal(null);
  };

  return (
    <div
      data-testid="signal-banner"
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[10001] max-w-[360px] w-[calc(100vw-2rem)] rounded-2xl border border-violet-400/30 bg-[#0d0a1f]/95 backdrop-blur-xl p-4 shadow-[0_12px_40px_-8px_rgba(139,92,246,0.5)]"
      style={{ animation: "signal-slide-in 0.45s cubic-bezier(0.16,1,0.3,1) both" }}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
          <Bot className="w-5 h-5 text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300/80">Nouveau signal Scanner IA</p>
          <p className="mt-1 text-sm font-bold text-white flex items-center gap-2">
            {signal.symbol.replace("USDT", "/USDT")}
            <span className={`inline-flex items-center gap-1 text-xs font-black ${signal.side === "LONG" ? "text-emerald-300" : "text-rose-300"}`}>
              {signal.side === "LONG" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {signal.side}
            </span>
            <span className="text-xs font-mono text-white/50">@ ${signal.entry_price >= 1 ? signal.entry_price.toLocaleString("fr-CA") : signal.entry_price.toPrecision(4)}</span>
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              data-testid="signal-banner-view"
              onClick={() => { dismiss(); navigate("/performance"); }}
              className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1.5 text-xs font-black text-white hover:brightness-110 transition-all"
            >
              Voir le signal
            </button>
            <span className="text-[10px] text-white/30">suivi auto toutes les 5 min</span>
          </div>
        </div>
        <button data-testid="signal-banner-close" onClick={dismiss} className="shrink-0 rounded-lg p-1 text-white/40 hover:text-white hover:bg-white/10 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <style>{`
        @keyframes signal-slide-in {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SignalBanner;
