import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import TrialBanner from "@/components/TrialBanner";
import TradingViewChart from "@/components/TradingViewChart";
import Confetti from "@/components/Confetti";
import {
  Trophy, RefreshCw, Users, Calendar, Crown,
  ArrowUpRight, ArrowDownRight, X, Search, Award, Lock,
} from "lucide-react";
import type { Position, Trade, Coin, Achievement, AchievementMeta, Me, LeaderboardResp } from "./challenge/types";
import { fmtUsd, fmtMcap, fmtPrice, fmtQty } from "./challenge/format";
import { Kpi } from "./challenge/ui";
import LiveFeed from "./challenge/LiveFeed";
import OrderTicket from "./challenge/OrderTicket";
import EquityCurve from "./challenge/EquityCurve";
import BadgesPanel from "./challenge/BadgesPanel";
import PositionsTable from "./challenge/PositionsTable";
import TradeHistory from "./challenge/TradeHistory";

const LS_EMAIL = "challenge.email";
const LS_USERNAME = "challenge.username";
const QUICK_AMOUNTS = [10, 50, 100, 250, 500];

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
  const [leverage, setLeverage] = useState<number>(1);
  const [slInput, setSlInput] = useState<string>("");
  const [tpInput, setTpInput] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [achievementsCatalog, setAchievementsCatalog] = useState<AchievementMeta[]>([]);
  const [recentTrades, setRecentTrades] = useState<Array<Trade & { username: string }>>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showMobileTicket, setShowMobileTicket] = useState(false);
  // Badge unlock toast queue — pops a golden animated card top-right when a new
  // achievement appears in `me.achievements` (compared to previous render).
  const [badgeToast, setBadgeToast] = useState<{ key: string; emoji: string; name: string; desc: string } | null>(null);
  const [badgeConfetti, setBadgeConfetti] = useState(false);
  const seenAchievementsRef = useRef<Set<string>>(new Set());
  const seenInitializedRef = useRef<boolean>(false);

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

  const fetchRecentTrades = useCallback(async () => {
    try {
      const r = await fetch("/api/v1/challenge/recent-trades");
      const j = await r.json();
      if (j?.ok && Array.isArray(j.trades)) setRecentTrades(j.trades);
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
    fetchRecentTrades();
    fetch("/api/v1/challenge/symbols").then((r) => r.json()).then((j) => {
      if (j?.ok) {
        setSymbols(j.symbols || []);
        const map: Record<string, Coin> = {};
        for (const c of (j.coins || [])) map[c.symbol] = c;
        setCoins(map);
      }
    }).catch(() => {});
    fetch("/api/v1/challenge/achievements").then((r) => r.json()).then((j) => {
      if (j?.ok && Array.isArray(j.achievements)) setAchievementsCatalog(j.achievements);
    }).catch(() => {});
  }, [fetchBoard, fetchPrices, fetchRecentTrades]);

  useEffect(() => { if (email) fetchMe(email); }, [email, fetchMe]);

  useEffect(() => {
    const id = setInterval(() => { fetchBoard(); fetchPrices(); fetchRecentTrades(); if (email) fetchMe(email); }, 20000);
    return () => clearInterval(id);
  }, [fetchBoard, fetchPrices, fetchRecentTrades, fetchMe, email]);

  // Auto-clear notifications
  useEffect(() => {
    if (!info && !error) return;
    const id = setTimeout(() => { setInfo(null); setError(null); }, 4500);
    return () => clearTimeout(id);
  }, [info, error]);

  // Detect newly unlocked badges and show a golden celebration toast.
  // First load seeds the "seen" set silently so we don't spam returning users
  // with toasts for previously-earned badges.
  useEffect(() => {
    if (!me?.achievements || achievementsCatalog.length === 0) return;
    const current = new Set(me.achievements.map(a => a.key));
    if (!seenInitializedRef.current) {
      seenAchievementsRef.current = current;
      seenInitializedRef.current = true;
      return;
    }
    const newlyUnlocked: string[] = [];
    for (const k of current) {
      if (!seenAchievementsRef.current.has(k)) newlyUnlocked.push(k);
    }
    if (newlyUnlocked.length === 0) return;
    seenAchievementsRef.current = current;
    const meta = achievementsCatalog.find(a => a.key === newlyUnlocked[0]);
    if (!meta) return;
    setBadgeToast(meta);
    setBadgeConfetti(true);
    // confetti fades; toast auto-dismisses
    const t1 = setTimeout(() => setBadgeConfetti(false), 2600);
    const t2 = setTimeout(() => setBadgeToast(null), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [me?.achievements, achievementsCatalog]);

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

    if (qty * livePrice / leverage > me.balance + 0.01) {
      setError(`Collateral insuffisant. Max: $${fmtUsd(me.balance * leverage)} (avec ${leverage}x lev)`); return;
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
          email, action: "open", side, symbol: tradeSym, qty, leverage,
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

  function setMaxBuy() { if (!me) return; setInputMode("usd"); setUsdAmount((me.balance * leverage).toFixed(2)); }
  function setPctBalance(pct: number) { if (!me) return; setInputMode("usd"); setUsdAmount((me.balance * leverage * pct).toFixed(2)); }

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

              {/* Live trade feed ticker — social proof */}
              <LiveFeed trades={recentTrades} />

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 mb-4">
                {/* TradingView chart — single instance with responsive height (avoids DOM ID collision) */}
                <div data-testid="chart-container" className="order-1 lg:order-none h-[360px] lg:h-[520px]">
                  <TradingViewChart symbol={tradeSym} idSuffix="main" />
                </div>

                {/* Mobile FAB to open order ticket — hidden on lg */}
                <button
                  onClick={() => setShowMobileTicket(true)}
                  data-testid="mobile-ticket-fab"
                  className="lg:hidden fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-black font-extrabold text-xs shadow-2xl shadow-amber-500/40 flex items-center justify-center"
                >
                  TRADE
                </button>

                {/* Order panel — NinjaTrader style. Inline on lg, modal on mobile */}
                <OrderTicket
                  me={me!}
                  tradeSym={tradeSym}
                  livePrice={livePrice}
                  side={side} setSide={setSide}
                  inputMode={inputMode} setInputMode={setInputMode}
                  usdAmount={usdAmount} setUsdAmount={setUsdAmount}
                  tradeQty={tradeQty} setTradeQty={setTradeQty}
                  leverage={leverage} setLeverage={setLeverage}
                  slInput={slInput} setSlInput={setSlInput}
                  tpInput={tpInput} setTpInput={setTpInput}
                  busy={busy}
                  showMobileTicket={showMobileTicket} setShowMobileTicket={setShowMobileTicket}
                  executeTrade={executeTrade}
                  setMaxBuy={setMaxBuy}
                  setPctBalance={setPctBalance}
                  quickAmounts={QUICK_AMOUNTS}
                />
              </div>

              {/* Portfolio stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                <Kpi label="Equity" value={`$${fmtUsd(me!.equity)}`} sub={`${me!.roi_pct >= 0 ? "+" : ""}${me!.roi_pct.toFixed(2)}%`} subColor={me!.roi_pct >= 0 ? "emerald" : "red"} />
                <Kpi label="Cash" value={`$${fmtUsd(me!.balance)}`} sub="USD" />
                <Kpi label="W/L" value={`${me!.stats?.wins || 0} / ${me!.stats?.losses || 0}`} sub={`${me!.win_streak ? `🔥 ${me!.win_streak} streak` : "No streak"}`} />
                <Kpi label="Rang" value={myRank > 0 ? `#${myRank}` : "—"} sub={board ? `/ ${board.total_participants}` : ""} accent />
              </div>

              {/* Equity curve + Achievements row */}
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 mb-3">
                <EquityCurve history={me!.equity_history || []} roi={me!.roi_pct ?? 0} />
                <BadgesPanel
                  catalog={achievementsCatalog}
                  unlocked={me!.achievements || []}
                  onShowAll={() => setShowAchievements(true)}
                />
              </div>

              {/* Positions table */}
              <PositionsTable
                me={me!}
                prices={prices}
                coins={coins}
                onSelectSymbol={setTradeSym}
                onEditSL={(pos) => {
                  const v = prompt(`Stop Loss pour ${pos.side.toUpperCase()} ${pos.symbol} (laisser vide pour effacer)`, pos.sl ? String(pos.sl) : "");
                  if (v === null) return;
                  updatePositionSLTP(pos, v === "" ? null : parseFloat(v));
                }}
                onEditTP={(pos) => {
                  const v = prompt(`Take Profit pour ${pos.side.toUpperCase()} ${pos.symbol} (laisser vide pour effacer)`, pos.tp ? String(pos.tp) : "");
                  if (v === null) return;
                  updatePositionSLTP(pos, undefined, v === "" ? null : parseFloat(v));
                }}
                onClose={(pos) => closePosition(pos)}
              />

              {/* History */}
              <TradeHistory trades={me!.trades} />
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

        {/* Achievements modal */}
        {showAchievements && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowAchievements(false)} data-testid="achievements-modal">
            <div className="bg-[#0d0e16] border border-white/[0.1] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" /> Tous les badges</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{(me?.achievements || []).length} / {achievementsCatalog.length} débloqués</p>
                </div>
                <button onClick={() => setShowAchievements(false)} data-testid="close-achievements" className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto flex-1 p-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {achievementsCatalog.map((a) => {
                    const unlocked = (me?.achievements || []).find(x => x.key === a.key);
                    return (
                      <div key={a.key} data-testid={`badge-detail-${a.key}`} className={`p-4 rounded-xl border ${unlocked ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30" : "bg-white/[0.02] border-white/[0.04] opacity-50"}`}>
                        <div className={`text-3xl mb-2 ${unlocked ? "" : "grayscale"}`}>{unlocked ? a.emoji : <Lock className="w-6 h-6 text-gray-600" />}</div>
                        <div className={`text-sm font-extrabold mb-1 ${unlocked ? "text-amber-300" : "text-gray-500"}`}>{a.name}</div>
                        <div className="text-[11px] text-gray-400">{a.desc}</div>
                        {unlocked && (
                          <div className="text-[9px] text-gray-500 mt-2 font-mono">
                            Débloqué : {new Date(unlocked.unlocked_at).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

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

      {/* Badge unlock toast — golden animated card top-right when a new achievement triggers */}
      {badgeToast && (
        <div
          data-testid="badge-unlock-toast"
          className="fixed top-4 right-4 z-[9999] w-[320px] max-w-[calc(100vw-2rem)] pointer-events-auto"
          style={{ animation: "badgeToastIn 380ms cubic-bezier(.2,.9,.3,1.2)" }}
        >
          <div className="relative rounded-2xl overflow-hidden border border-amber-400/50 shadow-2xl shadow-amber-500/30 bg-gradient-to-br from-[#1a1404] via-[#2a1d05] to-[#1a1404]">
            {/* shimmer overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                background: "linear-gradient(120deg, transparent 25%, rgba(253,224,71,0.18) 45%, rgba(253,224,71,0.32) 50%, rgba(253,224,71,0.18) 55%, transparent 75%)",
                backgroundSize: "200% 100%",
                animation: "badgeShimmer 2.4s linear infinite",
              }}
            />
            <div className="relative flex items-start gap-3 p-4">
              <div
                className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl border border-amber-300/40"
                style={{ background: "radial-gradient(circle at 30% 25%, rgba(253,224,71,0.35), rgba(253,224,71,0.05) 70%)" }}
              >
                {badgeToast.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-amber-400">Badge débloqué</span>
                  <Trophy className="w-3 h-3 text-amber-300" />
                </div>
                <div className="text-base font-black text-amber-100 truncate" data-testid="badge-toast-name">{badgeToast.name}</div>
                <div className="text-[11px] text-amber-200/70 mt-0.5 leading-snug">{badgeToast.desc}</div>
              </div>
              <button
                onClick={() => setBadgeToast(null)}
                data-testid="badge-toast-close"
                className="shrink-0 text-amber-300/50 hover:text-amber-200 transition"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <style>{`
            @keyframes badgeToastIn { 0% { transform: translateY(-12px) scale(0.96); opacity: 0; } 60% { transform: translateY(2px) scale(1.02); opacity: 1; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
            @keyframes badgeShimmer { 0% { background-position: 200% 0; } 100% { background-position: -50% 0; } }
          `}</style>
        </div>
      )}

      <Confetti active={badgeConfetti} count={70} />
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
