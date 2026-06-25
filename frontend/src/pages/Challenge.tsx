import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import TrialBanner from "@/components/TrialBanner";
import { Trophy, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, Users, Calendar, Crown } from "lucide-react";

interface Position { qty: number; avg_price: number }
interface Trade { ts: string; side: "buy" | "sell"; symbol: string; qty: number; price: number; value: number }
interface Me {
  username: string;
  balance: number;
  positions: Record<string, Position>;
  equity: number;
  roi_pct: number;
  trades: Trade[];
  prices?: Record<string, number>;
}
interface LeaderRow { username: string; equity: number; roi_pct: number; trade_count: number }
interface LeaderboardResp {
  ok: boolean;
  period: string;
  starting_balance: number;
  total_participants: number;
  leaderboard: LeaderRow[];
  last_winner: { period: string; username: string; equity: number } | null;
  prize: string;
}

const LS_EMAIL = "challenge.email";
const LS_USERNAME = "challenge.username";

const QUICK_AMOUNTS = [10, 50, 100, 250, 500];

function fmtUsd(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
function fmtQty(n: number) {
  if (n >= 1) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toFixed(8);
}

export default function Challenge() {
  const [email, setEmail] = useState<string>(() => localStorage.getItem(LS_EMAIL) || "");
  const [username, setUsername] = useState<string>(() => localStorage.getItem(LS_USERNAME) || "");
  const [me, setMe] = useState<Me | null>(null);
  const [board, setBoard] = useState<LeaderboardResp | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [tradeSym, setTradeSym] = useState("BTC");
  const [inputMode, setInputMode] = useState<"usd" | "qty">("usd");
  const [usdAmount, setUsdAmount] = useState<string>("100");
  const [tradeQty, setTradeQty] = useState("0.01");
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    try {
      const r = await fetch("/api/v1/challenge/leaderboard");
      const j = await r.json();
      if (j?.ok) setBoard(j);
    } catch { /* ignore */ }
  }, []);

  const fetchPrices = useCallback(async () => {
    try {
      const r = await fetch("/api/v1/challenge/prices");
      const j = await r.json();
      if (j?.ok && j.prices) setPrices(j.prices);
    } catch { /* ignore */ }
  }, []);

  const fetchMe = useCallback(async (em: string) => {
    if (!em) return;
    try {
      const r = await fetch(`/api/v1/challenge/me?email=${encodeURIComponent(em)}`);
      const j = await r.json();
      if (j?.ok) setMe(j.participant);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchBoard();
    fetchPrices();
    fetch("/api/v1/challenge/symbols").then((r) => r.json()).then((j) => j?.ok && setSymbols(j.symbols)).catch(() => {});
  }, [fetchBoard, fetchPrices]);

  useEffect(() => {
    if (email) fetchMe(email);
  }, [email, fetchMe]);

  // Refresh leaderboard + prices every 30s
  useEffect(() => {
    const id = setInterval(() => { fetchBoard(); fetchPrices(); }, 30000);
    return () => clearInterval(id);
  }, [fetchBoard, fetchPrices]);

  async function join() {
    setError(null); setInfo(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Email invalide"); return; }
    if (!username.trim()) { setError("Pseudo requis"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/v1/challenge/join", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), username: username.trim() }),
      });
      const j = await r.json();
      if (!j?.ok) { setError(j?.error || "Erreur"); return; }
      localStorage.setItem(LS_EMAIL, email.trim());
      localStorage.setItem(LS_USERNAME, username.trim());
      setInfo(`Bienvenue ${j.participant.username} ! Tu as $1000 virtuels.`);
      await fetchMe(email.trim());
      await fetchBoard();
    } catch { setError("Erreur réseau"); }
    finally { setBusy(false); }
  }

  async function executeTrade() {
    setError(null); setInfo(null);
    if (!me) { setError("Rejoins d'abord le challenge"); return; }
    const livePrice = (me.prices?.[tradeSym]) || prices[tradeSym];
    if (!livePrice) { setError("Prix en cours de chargement, réessaye dans 2s."); return; }

    let qty: number;
    if (inputMode === "usd") {
      const usd = parseFloat(usdAmount);
      if (!Number.isFinite(usd) || usd <= 0) { setError("Montant USD invalide"); return; }
      qty = usd / livePrice;
    } else {
      qty = parseFloat(tradeQty);
      if (!Number.isFinite(qty) || qty <= 0) { setError("Quantité invalide"); return; }
    }

    // Client-side pre-validation
    if (side === "buy" && qty * livePrice > me.balance + 0.01) {
      setError(`Solde insuffisant. Max achetable: $${fmtUsd(me.balance)}`);
      return;
    }
    if (side === "sell") {
      const heldQty = me.positions[tradeSym]?.qty || 0;
      if (qty > heldQty + 1e-9) { setError(`Tu détiens seulement ${fmtQty(heldQty)} ${tradeSym}`); return; }
    }

    setBusy(true);
    try {
      const r = await fetch("/api/v1/challenge/trade", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, side, symbol: tradeSym, qty }),
      });
      const j = await r.json();
      if (!j?.ok) { setError(j?.error || "Trade refusé"); return; }
      setMe(j.participant);
      setInfo(`✅ ${side === "buy" ? "Achat" : "Vente"} de ${fmtQty(qty)} ${tradeSym} @ $${fmtUsd(j.executed.price)} ($${fmtUsd(j.executed.value)})`);
      await fetchBoard();
    } catch { setError("Erreur réseau"); }
    finally { setBusy(false); }
  }

  // Quick-fill helpers
  function setMaxBuy() {
    if (!me) return;
    setInputMode("usd");
    setUsdAmount(me.balance.toFixed(2));
  }
  function setMaxSell() {
    if (!me) return;
    const held = me.positions[tradeSym]?.qty || 0;
    setInputMode("qty");
    setTradeQty(held.toString());
  }

  const isJoined = !!me;
  const myRank = board && me ? board.leaderboard.findIndex((r) => r.username.toLowerCase() === me.username.toLowerCase()) + 1 : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <SEOHead
        title="Trading Challenge Mensuel · Paper Trading $1000"
        description="Concours de trading paper-trading mensuel gratuit. $1000 virtuels, leaderboard public, le gagnant remporte 1 mois CryptoIA Premium offert."
        path="/challenge"
      />
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-5">
              <Trophy className="w-3.5 h-3.5" />
              CHALLENGE MENSUEL · GRATUIT
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-3 bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Trading Challenge
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-2">
              $1000 virtuels · Aucun risque réel · Le #1 du mois gagne 1 mois Premium offert
            </p>
            {board && (
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mt-4 flex-wrap">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Période: {board.period}</span>
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {board.total_participants} participants</span>
                <span className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-amber-400" /> {board.prize}</span>
              </div>
            )}
          </div>

          {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm" data-testid="challenge-error">{error}</div>}
          {info && <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm" data-testid="challenge-info">{info}</div>}

          {/* Join section if not yet joined */}
          {!isJoined && (
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 md:p-8 mb-8" data-testid="challenge-join">
              <h2 className="text-xl font-extrabold mb-1">Rejoins le challenge</h2>
              <p className="text-sm text-gray-400 mb-5">Reçois $1000 virtuels et grimpe au leaderboard. Reset chaque 1er du mois.</p>
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <input
                  data-testid="challenge-email-input"
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com"
                  className="px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
                <input
                  data-testid="challenge-username-input"
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ton pseudo (public)"
                  maxLength={24}
                  className="px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <button
                data-testid="challenge-join-button"
                onClick={join} disabled={busy}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-sm hover:from-amber-400 hover:to-orange-400 transition disabled:opacity-50"
              >
                <Trophy className="w-4 h-4" />
                {busy ? "..." : "Rejoindre le challenge"}
              </button>
              <p className="text-[10px] text-gray-500 mt-3">Pas de CB requise · Aucun spam · Reset le 1er de chaque mois</p>
            </div>
          )}

          {/* Joined: portfolio + trade UI */}
          {isJoined && me && (
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Portfolio summary */}
              <div className="lg:col-span-2 bg-[#111827] border border-white/[0.06] rounded-2xl p-6" data-testid="challenge-portfolio">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Ton portfolio · {me.username}</div>
                    <div className="text-3xl md:text-4xl font-black text-white">${fmtUsd(me.equity)}</div>
                    <div className={`text-sm font-bold mt-1 flex items-center gap-1 ${me.roi_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {me.roi_pct >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {me.roi_pct >= 0 ? "+" : ""}{me.roi_pct.toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Cash dispo</div>
                    <div className="text-xl font-extrabold text-cyan-300">${fmtUsd(me.balance)}</div>
                    {myRank > 0 && (
                      <div className="text-xs text-amber-300 font-bold mt-2 flex items-center gap-1 justify-end">
                        <Crown className="w-3.5 h-3.5" /> Rang #{myRank}
                      </div>
                    )}
                  </div>
                </div>

                {Object.keys(me.positions).length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500">Aucune position ouverte. Achète ta première crypto ci-contre →</div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(me.positions).map(([sym, pos]) => {
                      const price = me.prices?.[sym] || pos.avg_price;
                      const value = pos.qty * price;
                      const pnl = (price - pos.avg_price) * pos.qty;
                      const pnlPct = pos.avg_price > 0 ? ((price - pos.avg_price) / pos.avg_price) * 100 : 0;
                      return (
                        <div key={sym} className="flex items-center justify-between py-3 px-4 rounded-xl bg-black/30 border border-white/[0.04]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/30 flex items-center justify-center font-extrabold text-xs">{sym.slice(0, 3)}</div>
                            <div>
                              <div className="font-bold text-sm">{sym}</div>
                              <div className="text-xs text-gray-500">{pos.qty.toFixed(6)} @ ${fmtUsd(pos.avg_price)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-extrabold text-sm">${fmtUsd(value)}</div>
                            <div className={`text-xs font-bold ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {pnl >= 0 ? "+" : ""}${fmtUsd(pnl)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {me.trades.length > 0 && (
                  <details className="mt-5">
                    <summary className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer font-bold uppercase tracking-wider">Historique ({me.trades.length})</summary>
                    <div className="mt-3 space-y-1 max-h-64 overflow-y-auto">
                      {me.trades.slice(0, 30).map((t, i) => (
                        <div key={i} className="flex justify-between text-xs py-2 px-3 rounded-lg bg-black/20">
                          <span className={`font-bold ${t.side === "buy" ? "text-emerald-400" : "text-red-400"}`}>{t.side === "buy" ? "ACHAT" : "VENTE"} {t.symbol}</span>
                          <span className="text-gray-400">{t.qty.toFixed(6)} @ ${fmtUsd(t.price)}</span>
                          <span className="text-gray-500">{new Date(t.ts).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              {/* Trade form — new UX with USD-amount mode + live price + max + preview */}
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6" data-testid="challenge-trade-form">
                <h3 className="font-extrabold text-base mb-4 flex items-center gap-2"><Wallet className="w-4 h-4 text-amber-400" /> Trade</h3>

                {/* Side toggle */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button data-testid="trade-side-buy" onClick={() => setSide("buy")} className={`py-2.5 rounded-xl text-sm font-bold transition ${side === "buy" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-white/[0.04] text-gray-400 border border-white/[0.06]"}`}>🟢 Acheter</button>
                  <button data-testid="trade-side-sell" onClick={() => setSide("sell")} className={`py-2.5 rounded-xl text-sm font-bold transition ${side === "sell" ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-white/[0.04] text-gray-400 border border-white/[0.06]"}`}>🔴 Vendre</button>
                </div>

                {/* Symbol select with live price */}
                <label className="text-[10px] text-gray-500 font-bold mb-1.5 block uppercase tracking-wider">Crypto</label>
                <div className="relative mb-1">
                  <select
                    data-testid="trade-symbol-select"
                    value={tradeSym}
                    onChange={(e) => setTradeSym(e.target.value)}
                    className="w-full appearance-none px-4 py-3 pr-10 rounded-xl bg-black/30 border border-white/[0.08] text-white text-sm font-bold focus:outline-none focus:border-amber-500/50"
                  >
                    {symbols.map((s) => (
                      <option key={s} value={s}>
                        {s}{prices[s] ? ` — $${fmtUsd(prices[s])}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-4">
                  <span>Prix actuel</span>
                  <span className="font-bold text-cyan-300">
                    {prices[tradeSym] ? `$${fmtUsd(prices[tradeSym])}` : "..."}
                  </span>
                </div>

                {/* Mode toggle: USD vs Qty */}
                <div className="grid grid-cols-2 gap-1 mb-3 p-0.5 bg-black/30 rounded-lg">
                  <button
                    data-testid="trade-mode-usd"
                    onClick={() => setInputMode("usd")}
                    className={`py-1.5 rounded-md text-[11px] font-bold transition ${inputMode === "usd" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}
                  >Montant $</button>
                  <button
                    data-testid="trade-mode-qty"
                    onClick={() => setInputMode("qty")}
                    className={`py-1.5 rounded-md text-[11px] font-bold transition ${inputMode === "qty" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}
                  >Quantité {tradeSym}</button>
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
                        className="w-full pl-7 pr-3 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-white text-sm font-bold focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-1 mb-3">
                      {QUICK_AMOUNTS.map((a) => (
                        <button
                          key={a}
                          data-testid={`trade-quick-${a}`}
                          onClick={() => setUsdAmount(a.toString())}
                          className="py-1.5 rounded-md text-[11px] font-bold bg-white/[0.04] hover:bg-white/[0.1] text-gray-400 hover:text-white transition"
                        >${a}</button>
                      ))}
                    </div>
                  </>
                ) : (
                  <input
                    data-testid="trade-qty-input"
                    type="number" step="any" min="0"
                    value={tradeQty}
                    onChange={(e) => setTradeQty(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-white text-sm font-bold mb-3 focus:outline-none focus:border-amber-500/50"
                    placeholder={`0.01 ${tradeSym}`}
                  />
                )}

                {/* Max button */}
                <button
                  data-testid="trade-max-button"
                  onClick={side === "buy" ? setMaxBuy : setMaxSell}
                  className="w-full mb-3 py-2 rounded-lg text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition"
                >
                  {side === "buy"
                    ? `Max ($${fmtUsd(me.balance)})`
                    : `Max (${fmtQty(me.positions[tradeSym]?.qty || 0)} ${tradeSym})`}
                </button>

                {/* Order preview */}
                {(() => {
                  const livePrice = me.prices?.[tradeSym] || prices[tradeSym] || 0;
                  let previewQty = 0, previewUsd = 0;
                  if (inputMode === "usd") {
                    previewUsd = parseFloat(usdAmount) || 0;
                    previewQty = livePrice > 0 ? previewUsd / livePrice : 0;
                  } else {
                    previewQty = parseFloat(tradeQty) || 0;
                    previewUsd = previewQty * livePrice;
                  }
                  if (previewQty <= 0 || livePrice <= 0) return null;
                  const newBalance = side === "buy" ? me.balance - previewUsd : me.balance + previewUsd;
                  return (
                    <div className="mb-3 p-3 rounded-xl bg-black/30 border border-white/[0.04] text-[11px] space-y-1" data-testid="trade-preview">
                      <div className="flex justify-between"><span className="text-gray-500">Tu {side === "buy" ? "vas acheter" : "vas vendre"}</span><span className="font-bold text-white">{fmtQty(previewQty)} {tradeSym}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Valeur</span><span className="font-bold text-white">${fmtUsd(previewUsd)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Cash après</span><span className={`font-bold ${newBalance < 0 ? "text-red-400" : "text-cyan-300"}`}>${fmtUsd(newBalance)}</span></div>
                    </div>
                  );
                })()}

                <button
                  data-testid="trade-execute"
                  onClick={executeTrade}
                  disabled={busy}
                  className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition disabled:opacity-50 ${side === "buy" ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400" : "bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-400 hover:to-rose-400"}`}
                >
                  {busy ? "..." : (side === "buy" ? `Acheter ${tradeSym}` : `Vendre ${tradeSym}`)}
                </button>
                <p className="text-[10px] text-gray-500 mt-3 text-center">Prix temps réel CoinGecko · Fees 0 · Pas de levier</p>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-8" data-testid="challenge-leaderboard">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-extrabold text-lg flex items-center gap-2"><Crown className="w-5 h-5 text-amber-400" /> Leaderboard</h2>
              <button onClick={fetchBoard} className="text-xs text-gray-500 hover:text-white flex items-center gap-1" data-testid="leaderboard-refresh">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
            {board?.last_winner && (
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="text-xs text-amber-300 font-bold uppercase tracking-wider mb-1">🏆 Gagnant du mois précédent ({board.last_winner.period})</div>
                <div className="text-sm font-bold">{board.last_winner.username} avec ${fmtUsd(board.last_winner.equity)}</div>
              </div>
            )}
            {!board || board.leaderboard.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-500">Pas encore de participants. Sois le premier !</div>
            ) : (
              <div className="space-y-1">
                {board.leaderboard.map((row, i) => {
                  const isMe = me && row.username.toLowerCase() === me.username.toLowerCase();
                  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
                  return (
                    <div key={i} className={`flex items-center justify-between py-3 px-4 rounded-xl border ${isMe ? "bg-amber-500/10 border-amber-500/30" : "bg-black/20 border-white/[0.04]"}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 text-center font-extrabold text-base">{medal}</div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{row.username}{isMe && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">TOI</span>}</div>
                          <div className="text-xs text-gray-500">{row.trade_count} trades</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-extrabold text-sm">${fmtUsd(row.equity)}</div>
                        <div className={`text-xs font-bold ${row.roi_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>{row.roi_pct >= 0 ? "+" : ""}{row.roi_pct.toFixed(2)}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <TrialBanner source="challenge-page" />
        </div>
        <Footer />
      </main>
    </div>
  );
}
