import { useEffect, useState, useCallback, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import TrialBanner from "@/components/TrialBanner";
import TradingViewChart from "@/components/TradingViewChart";
import {
  Trophy, TrendingUp, RefreshCw, Users, Calendar, Crown,
  ArrowUpRight, ArrowDownRight, X, Search,
} from "lucide-react";

interface Position { id: string; symbol: string; side: "long" | "short"; qty: number; avg_price: number; mark?: number; value?: number; pnl?: number; pnl_pct?: number; sl?: number; tp?: number; opened_at?: string; collateral?: number }
interface Trade { ts: string; action?: "open" | "close"; side: "buy" | "sell" | "long" | "short"; symbol: string; qty: number; price: number; value: number; pnl?: number; trigger?: string }
interface Coin { symbol: string; name: string; image: string | null; price: number; change_24h: number; rank: number; market_cap?: number }
interface Me {
  username: string;
  balance: number;
  positions: Record<string, Position>;
  equity: number;
  roi_pct: number;
  trades: Trade[];
  prices?: Record<string, number>;
  pnl_realized?: number;
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
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPrice(n: number) {
  if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}
function fmtQty(n: number) {
  if (n >= 1) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toFixed(8);
}
function fmtMcap(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${fmtUsd(n)}`;
}

export default function Challenge() {
  const [email, setEmail] = useState<string>(() => localStorage.getItem(LS_EMAIL) || "");
  const [username, setUsername] = useState<string>(() => localStorage.getItem(LS_USERNAME) || "");
  const [me, setMe] = useState<Me | null>(null);
  const [board, setBoard] = useState<LeaderboardResp | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [coins, setCoins] = useState<Record<string, Coin>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [side, setSide] = useState<"long" | "short">("long");
  const [tradeSym, setTradeSym] = useState("BTC");
  const [inputMode, setInputMode] = useState<"usd" | "qty">("usd");
  const [usdAmount, setUsdAmount] = useState<string>("100");
  const [tradeQty, setTradeQty] = useState("0.01");
  const [slInput, setSlInput] = useState<string>("");
  const [tpInput, setTpInput] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
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
    fetch("/api/v1/challenge/symbols").then((r) => r.json()).then((j) => {
      if (j?.ok) {
        setSymbols(j.symbols || []);
        const map: Record<string, Coin> = {};
        for (const c of (j.coins || [])) map[c.symbol] = c;
        setCoins(map);
      }
    }).catch(() => {});
  }, [fetchBoard, fetchPrices]);

  useEffect(() => { if (email) fetchMe(email); }, [email, fetchMe]);

  useEffect(() => {
    const id = setInterval(() => { fetchBoard(); fetchPrices(); if (email) fetchMe(email); }, 20000);
    return () => clearInterval(id);
  }, [fetchBoard, fetchPrices, fetchMe, email]);

  // Auto-clear notifications
  useEffect(() => {
    if (!info && !error) return;
    const id = setTimeout(() => { setInfo(null); setError(null); }, 4500);
    return () => clearTimeout(id);
  }, [info, error]);

  const filteredSymbols = useMemo(() => {
    if (!pickerQuery.trim()) return symbols;
    const q = pickerQuery.trim().toLowerCase();
    return symbols.filter(s => {
      const c = coins[s];
      return s.toLowerCase().includes(q) || (c?.name || "").toLowerCase().includes(q);
    });
  }, [symbols, pickerQuery, coins]);

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
    const livePrice = (me.prices?.[tradeSym]) || prices[tradeSym] || coins[tradeSym]?.price || 0;
    if (!livePrice) { setError("Prix indisponible. Choisis une autre crypto."); return; }

    let qty: number;
    if (inputMode === "usd") {
      const usd = parseFloat(usdAmount);
      if (!Number.isFinite(usd) || usd <= 0) { setError("Montant USD invalide"); return; }
      qty = usd / livePrice;
    } else {
      qty = parseFloat(tradeQty);
      if (!Number.isFinite(qty) || qty <= 0) { setError("Quantité invalide"); return; }
    }

    if (qty * livePrice > me.balance + 0.01) {
      setError(`Solde insuffisant. Max: $${fmtUsd(me.balance)}`); return;
    }

    // Validate SL/TP
    const slNum = slInput.trim() === "" ? null : parseFloat(slInput);
    const tpNum = tpInput.trim() === "" ? null : parseFloat(tpInput);
    if (slNum !== null) {
      if (!Number.isFinite(slNum) || slNum <= 0) { setError("SL invalide"); return; }
      if (side === "long" && slNum >= livePrice) { setError("SL doit être < prix actuel pour un LONG"); return; }
      if (side === "short" && slNum <= livePrice) { setError("SL doit être > prix actuel pour un SHORT"); return; }
    }
    if (tpNum !== null) {
      if (!Number.isFinite(tpNum) || tpNum <= 0) { setError("TP invalide"); return; }
      if (side === "long" && tpNum <= livePrice) { setError("TP doit être > prix actuel pour un LONG"); return; }
      if (side === "short" && tpNum >= livePrice) { setError("TP doit être < prix actuel pour un SHORT"); return; }
    }

    setBusy(true);
    try {
      const r = await fetch("/api/v1/challenge/trade", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, action: "open", side, symbol: tradeSym, qty,
          ...(slNum !== null ? { sl: slNum } : {}),
          ...(tpNum !== null ? { tp: tpNum } : {}),
        }),
      });
      const j = await r.json();
      if (!j?.ok) { setError(j?.error || "Trade refusé"); return; }
      setMe(j.participant);
      setInfo(`${side.toUpperCase()} ${fmtQty(qty)} ${tradeSym} @ $${fmtPrice(j.executed.price)}${slNum ? ` · SL $${fmtPrice(slNum)}` : ""}${tpNum ? ` · TP $${fmtPrice(tpNum)}` : ""}`);
      setSlInput(""); setTpInput("");
      await fetchBoard();
    } catch { setError("Erreur réseau"); }
    finally { setBusy(false); }
  }

  async function closePosition(pos: Position, partial?: number) {
    if (!me) return;
    setError(null); setInfo(null);
    setBusy(true);
    try {
      const r = await fetch("/api/v1/challenge/trade", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "close", side: pos.side, symbol: pos.symbol, qty: partial || pos.qty, position_id: pos.id }),
      });
      const j = await r.json();
      if (!j?.ok) { setError(j?.error || "Erreur close"); return; }
      setMe(j.participant);
      setInfo(`Fermé ${fmtQty(partial || pos.qty)} ${pos.symbol} ${pos.side.toUpperCase()}`);
      await fetchBoard();
    } catch { setError("Erreur réseau"); }
    finally { setBusy(false); }
  }

  async function updatePositionSLTP(pos: Position, sl?: number | null, tp?: number | null) {
    setError(null); setInfo(null);
    setBusy(true);
    try {
      const body: Record<string, unknown> = { email, position_id: pos.id };
      if (sl !== undefined) body.sl = sl;
      if (tp !== undefined) body.tp = tp;
      const r = await fetch("/api/v1/challenge/position/update", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!j?.ok) { setError(j?.error || "Erreur SL/TP"); return; }
      setInfo(`SL/TP mis à jour sur ${pos.symbol} ${pos.side.toUpperCase()}`);
      if (email) await fetchMe(email);
    } catch { setError("Erreur réseau"); }
    finally { setBusy(false); }
  }

  function setMaxBuy() { if (!me) return; setInputMode("usd"); setUsdAmount(me.balance.toFixed(2)); }
  function setPctBalance(pct: number) { if (!me) return; setInputMode("usd"); setUsdAmount((me.balance * pct).toFixed(2)); }

  const isJoined = !!me;
  const selCoin = coins[tradeSym];
  const livePrice = (me?.prices?.[tradeSym]) || prices[tradeSym] || selCoin?.price || 0;
  const ch24 = selCoin?.change_24h ?? 0;
  const myRank = board && me ? board.leaderboard.findIndex(r => r.username.toLowerCase() === me.username.toLowerCase()) + 1 : 0;

  return (
    <div className="min-h-screen bg-[#06070d] text-white">
      <SEOHead title="Trading Challenge · Paper Trading $1000" description="Concours paper-trading mensuel sur 100 cryptos. $1000 virtuels, leaderboard live, le #1 gagne 1 mois CryptoIA Premium." path="/challenge" />
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#06070d]">
        <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4 md:py-6">

          {/* Header ribbon — compact pro */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center"><Trophy className="w-5 h-5 text-black" /></div>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight">Trading Challenge</h1>
                <p className="text-[11px] text-gray-500">Paper trading mensuel · Aucun risque réel</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 text-[11px] flex-wrap">
              <RibbonStat icon={<Calendar className="w-3 h-3" />} label="Période" value={board?.period || "—"} />
              <RibbonStat icon={<Users className="w-3 h-3" />} label="Joueurs" value={String(board?.total_participants ?? 0)} />
              <RibbonStat icon={<Trophy className="w-3 h-3 text-amber-400" />} label="Prix" value="1 mois Premium" highlight />
            </div>
          </div>

          {/* Notifications */}
          {error && <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium" data-testid="challenge-error">{error}</div>}
          {info && <div className="mb-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium" data-testid="challenge-info">{info}</div>}

          {/* Join screen */}
          {!isJoined && (
            <div className="bg-[#0d0e16] border border-white/[0.06] rounded-2xl p-6 md:p-8 mb-6 max-w-2xl mx-auto" data-testid="challenge-join">
              <div className="text-center mb-6">
                <div className="text-5xl mb-2">🏆</div>
                <h2 className="text-2xl font-black mb-1">Rejoins le challenge</h2>
                <p className="text-sm text-gray-400">Reçois <b className="text-emerald-400">$1000 virtuels</b>, trade 100 cryptos, vise la 1ère place.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <input data-testid="challenge-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com" className="px-4 py-3 rounded-xl bg-black/40 border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50" />
                <input data-testid="challenge-username-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Pseudo public" maxLength={24} className="px-4 py-3 rounded-xl bg-black/40 border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50" />
              </div>
              <button data-testid="challenge-join-button" onClick={join} disabled={busy} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-sm hover:from-amber-400 hover:to-orange-400 transition disabled:opacity-50">
                <Trophy className="w-4 h-4" /> {busy ? "..." : "Rejoindre · $1000 virtuels"}
              </button>
              <p className="text-[10px] text-gray-500 mt-3 text-center">Pas de CB · Reset le 1er de chaque mois</p>
            </div>
          )}

          {/* Pro layout — Chart left, Order panel right, Portfolio + Leaderboard below */}
          {isJoined && (
            <>
              {/* Selected coin ticker bar */}
              <div className="bg-[#0d0e16] border border-white/[0.06] rounded-2xl px-4 py-3 mb-3 flex items-center gap-4 flex-wrap" data-testid="ticker-bar">
                <button onClick={() => setPickerOpen(true)} data-testid="open-coin-picker" className="flex items-center gap-3 hover:bg-white/[0.04] rounded-lg p-1 -m-1 transition">
                  {selCoin?.image ? <img src={selCoin.image} alt={selCoin.name} className="w-9 h-9 rounded-full" /> : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/30 flex items-center justify-center font-extrabold text-[10px]">{tradeSym.slice(0, 3)}</div>}
                  <div className="text-left">
                    <div className="text-base font-extrabold leading-tight">{tradeSym}<span className="text-gray-500 font-normal text-xs ml-2">{selCoin?.name || ""}</span></div>
                    <div className="text-[10px] text-gray-500">#{selCoin?.rank || "—"} · Mcap {selCoin?.market_cap ? fmtMcap(selCoin.market_cap) : "—"}</div>
                  </div>
                </button>
                <div className="ml-auto flex items-center gap-5 text-right">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Prix</div>
                    <div className="text-xl font-black text-cyan-300">${livePrice ? fmtPrice(livePrice) : "..."}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">24h</div>
                    <div className={`text-base font-extrabold flex items-center gap-1 justify-end ${ch24 >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {ch24 >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {ch24 >= 0 ? "+" : ""}{ch24.toFixed(2)}%
                    </div>
                  </div>
                  <button onClick={() => setPickerOpen(true)} data-testid="change-coin-button" className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-bold text-gray-200 transition">Changer</button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 mb-4">
                {/* TradingView chart */}
                <div data-testid="chart-container">
                  <TradingViewChart symbol={tradeSym} height={520} />
                </div>

                {/* Order panel — NinjaTrader style */}
                <div className="bg-[#0d0e16] border border-white/[0.06] rounded-2xl p-4" data-testid="challenge-trade-form">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-300">Order Ticket</h3>
                    <span className="text-[10px] text-gray-500 font-mono">{tradeSym}/USD</span>
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
                        <input data-testid="trade-usd-input" type="number" step="any" min="0" value={usdAmount} onChange={(e) => setUsdAmount(e.target.value)} className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-black/40 border border-white/[0.08] text-white text-base font-extrabold focus:outline-none focus:border-amber-500/50 font-mono" />
                      </div>
                      <div className="grid grid-cols-5 gap-1 mb-2">
                        {QUICK_AMOUNTS.map((a) => (
                          <button key={a} data-testid={`trade-quick-${a}`} onClick={() => setUsdAmount(a.toString())} className="py-1.5 rounded text-[10px] font-bold bg-white/[0.04] hover:bg-white/[0.1] text-gray-400 hover:text-white transition">${a}</button>
                        ))}
                      </div>
                      {/* Percentage of balance */}
                      <div className="grid grid-cols-4 gap-1 mb-2">
                        {[0.25, 0.5, 0.75, 1].map((p) => (
                          <button key={p} data-testid={`trade-pct-${p * 100}`} onClick={() => setPctBalance(p)} className="py-1.5 rounded text-[10px] font-bold bg-white/[0.04] hover:bg-amber-500/20 text-amber-300 transition">
                            {p * 100}%
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <input data-testid="trade-qty-input" type="number" step="any" min="0" value={tradeQty} onChange={(e) => setTradeQty(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/[0.08] text-white text-base font-extrabold mb-2 focus:outline-none focus:border-amber-500/50 font-mono" placeholder={`0.01 ${tradeSym}`} />
                  )}

                  <button data-testid="trade-max-button" onClick={setMaxBuy} className="w-full mb-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition">
                    Max · ${fmtUsd(me!.balance)}
                  </button>

                  {/* SL / TP inputs */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-[9px] text-red-400 font-bold uppercase tracking-wider mb-1 block">Stop Loss</label>
                      <input
                        data-testid="trade-sl-input"
                        type="number" step="any" min="0" value={slInput} onChange={(e) => setSlInput(e.target.value)}
                        placeholder={livePrice ? `< $${fmtPrice(livePrice)}` : "—"}
                        className="w-full px-2.5 py-2 rounded-lg bg-black/40 border border-red-500/20 text-red-300 text-xs font-extrabold focus:outline-none focus:border-red-500/50 font-mono"
                      />
                      {slInput && livePrice && (
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
                        type="number" step="any" min="0" value={tpInput} onChange={(e) => setTpInput(e.target.value)}
                        placeholder={livePrice ? `> $${fmtPrice(livePrice)}` : "—"}
                        className="w-full px-2.5 py-2 rounded-lg bg-black/40 border border-emerald-500/20 text-emerald-300 text-xs font-extrabold focus:outline-none focus:border-emerald-500/50 font-mono"
                      />
                      {tpInput && livePrice && (
                        <div className="text-[9px] text-gray-500 mt-0.5 font-mono">
                          Gain: {side === "long"
                            ? `+${(((parseFloat(tpInput) - livePrice) / livePrice) * 100).toFixed(2)}%`
                            : `+${(((livePrice - parseFloat(tpInput)) / livePrice) * 100).toFixed(2)}%`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order preview */}
                  {(() => {
                    let previewQty = 0, previewUsd = 0;
                    if (inputMode === "usd") {
                      previewUsd = parseFloat(usdAmount) || 0;
                      previewQty = livePrice > 0 ? previewUsd / livePrice : 0;
                    } else {
                      previewQty = parseFloat(tradeQty) || 0;
                      previewUsd = previewQty * livePrice;
                    }
                    if (previewQty <= 0 || livePrice <= 0) return null;
                    const newBalance = me!.balance - previewUsd;
                    return (
                      <div className="mb-3 p-2.5 rounded-lg bg-black/40 border border-white/[0.04] text-[10px] space-y-1 font-mono" data-testid="trade-preview">
                        <Row k="SIDE" v={side.toUpperCase()} accent={side === "long" ? "cyan" : "red"} />
                        <Row k="QTY" v={`${fmtQty(previewQty)} ${tradeSym}`} />
                        <Row k="ENTRY" v={`$${fmtPrice(livePrice)}`} />
                        <Row k="COLLATERAL" v={`$${fmtUsd(previewUsd)}`} />
                        <Row k="CASH AFTER" v={`$${fmtUsd(newBalance)}`} accent={newBalance < 0 ? "red" : "cyan"} />
                      </div>
                    );
                  })()}

                  <button data-testid="trade-execute" onClick={executeTrade} disabled={busy} className={`w-full py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider transition disabled:opacity-50 ${side === "long" ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20" : "bg-red-500 hover:bg-red-400 text-black shadow-lg shadow-red-500/20"}`}>
                    {busy ? "..." : `Open ${side.toUpperCase()} · ${tradeSym} · Market`}
                  </button>
                  <p className="text-[9px] text-gray-600 mt-2 text-center font-mono uppercase tracking-wider">CoinGecko · 0 fees · No leverage</p>
                </div>
              </div>

              {/* Portfolio stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                <Kpi label="Equity" value={`$${fmtUsd(me!.equity)}`} sub={`${me!.roi_pct >= 0 ? "+" : ""}${me!.roi_pct.toFixed(2)}%`} subColor={me!.roi_pct >= 0 ? "emerald" : "red"} />
                <Kpi label="Cash" value={`$${fmtUsd(me!.balance)}`} sub="USD" />
                <Kpi label="Positions" value={String(Object.keys(me!.positions).length)} sub={`${me!.trades.length} trades`} />
                <Kpi label="Rang" value={myRank > 0 ? `#${myRank}` : "—"} sub={board ? `/ ${board.total_participants}` : ""} accent />
              </div>

              {/* Positions table */}
              <div className="bg-[#0d0e16] border border-white/[0.06] rounded-2xl overflow-hidden mb-3" data-testid="challenge-portfolio">
                <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-300">Open Positions · {me!.username}</h3>
                  <span className="text-[10px] text-gray-500 font-mono">{Object.keys(me!.positions).length} active</span>
                </div>
                {Object.keys(me!.positions).length === 0 ? (
                  <div className="text-center py-10 text-xs text-gray-500">Aucune position. Lance ton premier trade ci-dessus.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/[0.04]">
                        <tr>
                          <th className="text-left px-4 py-2 font-bold">Asset</th>
                          <th className="text-left px-2 py-2 font-bold">Side</th>
                          <th className="text-right px-2 py-2 font-bold">Qty</th>
                          <th className="text-right px-2 py-2 font-bold">Entry</th>
                          <th className="text-right px-2 py-2 font-bold">Mark</th>
                          <th className="text-right px-2 py-2 font-bold">SL</th>
                          <th className="text-right px-2 py-2 font-bold">TP</th>
                          <th className="text-right px-2 py-2 font-bold">PnL</th>
                          <th className="text-right px-4 py-2 font-bold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        {Object.entries(me!.positions).map(([key, pos]) => {
                          const sym = pos.symbol;
                          const px = pos.mark || me!.prices?.[sym] || prices[sym] || pos.avg_price;
                          const pnl = typeof pos.pnl === "number" ? pos.pnl : (pos.side === "short" ? (pos.avg_price - px) * pos.qty : (px - pos.avg_price) * pos.qty);
                          const pnlPct = typeof pos.pnl_pct === "number" ? pos.pnl_pct : (pos.avg_price > 0 ? (pnl / (pos.qty * pos.avg_price)) * 100 : 0);
                          return (
                            <tr key={key} className="border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer" onClick={() => setTradeSym(sym)}>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  {coins[sym]?.image ? <img src={coins[sym].image!} alt={sym} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-white/[0.06]" />}
                                  <div><div className="font-extrabold text-white">{sym}</div><div className="text-[10px] text-gray-500 font-sans">{coins[sym]?.name || ""}</div></div>
                                </div>
                              </td>
                              <td className="px-2 py-2.5">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${pos.side === "long" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{pos.side === "long" ? "↗ LONG" : "↘ SHORT"}</span>
                              </td>
                              <td className="text-right px-2 py-2.5 text-white">{fmtQty(pos.qty)}</td>
                              <td className="text-right px-2 py-2.5 text-gray-400">${fmtPrice(pos.avg_price)}</td>
                              <td className="text-right px-2 py-2.5 text-cyan-300">${fmtPrice(px)}</td>
                              <td className="text-right px-2 py-2.5">
                                <button
                                  data-testid={`edit-sl-${key}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const v = prompt(`Stop Loss pour ${pos.side.toUpperCase()} ${sym} (laisser vide pour effacer)`, pos.sl ? String(pos.sl) : "");
                                    if (v === null) return;
                                    updatePositionSLTP(pos, v === "" ? null : parseFloat(v));
                                  }}
                                  className={`text-[10px] font-bold ${pos.sl ? "text-red-400" : "text-gray-600 hover:text-red-400"}`}
                                >
                                  {pos.sl ? `$${fmtPrice(pos.sl)}` : "— set"}
                                </button>
                              </td>
                              <td className="text-right px-2 py-2.5">
                                <button
                                  data-testid={`edit-tp-${key}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const v = prompt(`Take Profit pour ${pos.side.toUpperCase()} ${sym} (laisser vide pour effacer)`, pos.tp ? String(pos.tp) : "");
                                    if (v === null) return;
                                    updatePositionSLTP(pos, undefined, v === "" ? null : parseFloat(v));
                                  }}
                                  className={`text-[10px] font-bold ${pos.tp ? "text-emerald-400" : "text-gray-600 hover:text-emerald-400"}`}
                                >
                                  {pos.tp ? `$${fmtPrice(pos.tp)}` : "— set"}
                                </button>
                              </td>
                              <td className={`text-right px-2 py-2.5 font-extrabold ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pnl >= 0 ? "+" : ""}${fmtUsd(pnl)}<div className="text-[10px] font-bold">{pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%</div></td>
                              <td className="text-right px-4 py-2.5">
                                <button data-testid={`close-position-${key}`} onClick={(e) => { e.stopPropagation(); closePosition(pos); }} className="px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/20 transition">Close</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* History */}
              {me!.trades.length > 0 && (
                <details className="bg-[#0d0e16] border border-white/[0.06] rounded-2xl overflow-hidden mb-3">
                  <summary className="px-4 py-3 cursor-pointer text-xs font-extrabold uppercase tracking-wider text-gray-300 hover:bg-white/[0.02]">Trade History ({me!.trades.length})</summary>
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-xs font-mono">
                      <thead className="text-[10px] uppercase tracking-wider text-gray-500 sticky top-0 bg-[#0d0e16]">
                        <tr><th className="text-left px-4 py-2 font-bold">Time</th><th className="text-left px-3 py-2 font-bold">Action</th><th className="text-left px-3 py-2 font-bold">Symbol</th><th className="text-right px-3 py-2 font-bold">Qty</th><th className="text-right px-3 py-2 font-bold">Price</th><th className="text-right px-3 py-2 font-bold">Value</th><th className="text-right px-4 py-2 font-bold">PnL</th></tr>
                      </thead>
                      <tbody>
                        {me!.trades.slice(0, 100).map((t, i) => {
                          const isClose = t.action === "close";
                          const sideStr = String(t.side).toLowerCase();
                          const color = isClose ? (t.pnl !== undefined && t.pnl >= 0 ? "text-emerald-400" : "text-red-400") : (sideStr === "long" || sideStr === "buy" ? "text-emerald-400" : "text-red-400");
                          return (
                            <tr key={i} className="border-b border-white/[0.02]">
                              <td className="px-4 py-2 text-gray-500">{new Date(t.ts).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</td>
                              <td className={`px-3 py-2 font-extrabold ${color}`}>
                                {isClose ? `CLOSE ${sideStr.toUpperCase()}` : `OPEN ${sideStr.toUpperCase()}`}
                                {t.trigger && <span className="ml-1.5 text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded">{t.trigger === "stop_loss" ? "SL" : "TP"}</span>}
                              </td>
                              <td className="px-3 py-2 text-white font-extrabold">{t.symbol}</td>
                              <td className="px-3 py-2 text-right text-gray-300">{fmtQty(t.qty)}</td>
                              <td className="px-3 py-2 text-right text-cyan-300">${fmtPrice(t.price)}</td>
                              <td className="px-3 py-2 text-right font-extrabold text-white">${fmtUsd(t.value)}</td>
                              <td className={`px-4 py-2 text-right font-extrabold ${t.pnl !== undefined && t.pnl >= 0 ? "text-emerald-400" : t.pnl !== undefined ? "text-red-400" : "text-gray-600"}`}>{t.pnl !== undefined ? `${t.pnl >= 0 ? "+" : ""}$${fmtUsd(t.pnl)}` : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </>
          )}

          {/* Leaderboard */}
          <div className="bg-[#0d0e16] border border-white/[0.06] rounded-2xl overflow-hidden mb-4" data-testid="challenge-leaderboard">
            <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-300 flex items-center gap-2"><Crown className="w-3.5 h-3.5 text-amber-400" /> Leaderboard</h2>
              <button onClick={fetchBoard} className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1" data-testid="leaderboard-refresh"><RefreshCw className="w-3 h-3" /> Refresh</button>
            </div>
            {board?.last_winner && (
              <div className="px-4 py-2 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-b border-amber-500/10">
                <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">🏆 Gagnant {board.last_winner.period} · <span className="text-white">{board.last_winner.username}</span> · ${fmtUsd(board.last_winner.equity)}</div>
              </div>
            )}
            {!board || board.leaderboard.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-500">Sois le premier à rejoindre.</div>
            ) : (
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/[0.04]">
                  <tr><th className="text-left px-4 py-2 font-bold">Rank</th><th className="text-left px-3 py-2 font-bold">User</th><th className="text-right px-3 py-2 font-bold">Equity</th><th className="text-right px-3 py-2 font-bold">ROI</th><th className="text-right px-4 py-2 font-bold">Trades</th></tr>
                </thead>
                <tbody className="font-mono">
                  {board.leaderboard.map((row, i) => {
                    const isMe = me && row.username.toLowerCase() === me.username.toLowerCase();
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
                    return (
                      <tr key={i} className={`border-b border-white/[0.02] ${isMe ? "bg-amber-500/5" : ""}`}>
                        <td className="px-4 py-2.5 font-extrabold text-base">{medal}</td>
                        <td className="px-3 py-2.5 font-extrabold text-white font-sans">{row.username}{isMe && <span className="ml-2 text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">YOU</span>}</td>
                        <td className="text-right px-3 py-2.5 font-extrabold text-white">${fmtUsd(row.equity)}</td>
                        <td className={`text-right px-3 py-2.5 font-extrabold ${row.roi_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>{row.roi_pct >= 0 ? "+" : ""}{row.roi_pct.toFixed(2)}%</td>
                        <td className="text-right px-4 py-2.5 text-gray-400">{row.trade_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <TrialBanner source="challenge-page" />
        </div>

        {/* Coin picker modal */}
        {pickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPickerOpen(false)} data-testid="coin-picker-modal">
            <div className="bg-[#0d0e16] border border-white/[0.1] rounded-2xl max-w-xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="font-extrabold text-sm uppercase tracking-wider">Sélectionne une crypto ({symbols.length})</h3>
                <button onClick={() => setPickerOpen(false)} data-testid="close-picker" className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-3 border-b border-white/[0.06]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input data-testid="coin-picker-search" type="text" value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)} placeholder="Bitcoin, ETH, Solana..." className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-black/40 border border-white/[0.08] text-sm focus:outline-none focus:border-amber-500/50" autoFocus />
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                {filteredSymbols.length === 0 && <div className="p-8 text-center text-sm text-gray-500">Aucun résultat</div>}
                {filteredSymbols.map((s) => {
                  const c = coins[s];
                  const p = prices[s] || c?.price || 0;
                  const ch = c?.change_24h ?? 0;
                  return (
                    <button key={s} data-testid={`coin-picker-${s}`} onClick={() => { setTradeSym(s); setPickerOpen(false); setPickerQuery(""); }} className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.04] transition border-b border-white/[0.02] text-left ${tradeSym === s ? "bg-amber-500/5" : ""}`}>
                      {c?.image ? <img src={c.image} alt={c.name} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-white/[0.06]" />}
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-sm">{s} <span className="text-gray-500 font-normal text-xs">· {c?.name || s}</span></div>
                        <div className="text-[10px] text-gray-500">#{c?.rank || "—"} · {c?.market_cap ? fmtMcap(c.market_cap) : ""}</div>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <div className="text-sm font-extrabold text-cyan-300">${fmtPrice(p)}</div>
                        <div className={`text-[10px] font-bold ${ch >= 0 ? "text-emerald-400" : "text-red-400"}`}>{ch >= 0 ? "+" : ""}{ch.toFixed(2)}%</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
}

function RibbonStat({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${highlight ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/[0.04]"}`}>
      <span className="text-gray-500">{icon}</span>
      <span className="text-gray-500 uppercase tracking-wider text-[9px] font-bold">{label}</span>
      <span className={`font-extrabold ${highlight ? "text-amber-300" : "text-white"}`}>{value}</span>
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: "red" | "cyan" }) {
  const color = accent === "red" ? "text-red-400" : accent === "cyan" ? "text-cyan-300" : "text-white";
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 uppercase tracking-wider text-[9px] font-bold">{k}</span>
      <span className={`font-extrabold ${color}`}>{v}</span>
    </div>
  );
}

function Kpi({ label, value, sub, subColor, accent }: { label: string; value: string; sub?: string; subColor?: "emerald" | "red"; accent?: boolean }) {
  return (
    <div className={`bg-[#0d0e16] border rounded-xl p-3 ${accent ? "border-amber-500/30" : "border-white/[0.06]"}`}>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">{label}</div>
      <div className={`text-xl font-black font-mono ${accent ? "text-amber-300" : "text-white"}`}>{value}</div>
      {sub && <div className={`text-[10px] font-bold mt-0.5 ${subColor === "emerald" ? "text-emerald-400" : subColor === "red" ? "text-red-400" : "text-gray-500"} font-mono`}>{sub}</div>}
    </div>
  );
}
