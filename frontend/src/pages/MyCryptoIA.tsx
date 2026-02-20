import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { fetchTop200, formatPrice, type CoinMarketData } from "@/lib/cryptoApi";
import {
  LayoutDashboard,
  Star,
  TrendingUp,
  RefreshCw,
  Plus,
  X,
  Bell,
  Activity,
  Zap,
  Shield,
  BarChart3,
  Eye,
  Settings,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Globe,
  Target,
  Clock,
  Flame,
  DollarSign,
  PieChart,
  Layers,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  LineChart,
  Hash,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FavoriteCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume: number;
  confidence: number;
  signal: "STRONG BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG SELL";
}

interface PortfolioEntry {
  symbol: string;
  allocation: number;
  pnl: number;
  color: string;
}

interface AlertItem {
  id: string;
  symbol: string;
  type: "price_up" | "price_down" | "signal";
  message: string;
  time: string;
  read: boolean;
}

type WidgetId =
  | "favorites" | "portfolio" | "signals" | "alerts" | "market" | "confidence"
  | "topGainers" | "topLosers" | "volume" | "watchlist" | "news" | "heatmap"
  | "dominance" | "fearGreed" | "dca" | "targets" | "rsi" | "whales"
  | "calendar" | "performance";

interface Widget {
  id: WidgetId;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  category: "analyse" | "portfolio" | "marché" | "outils";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSignal(c: CoinMarketData): FavoriteCoin["signal"] {
  const change = c.price_change_percentage_24h || 0;
  const change7d = c.price_change_percentage_7d_in_currency || 0;
  const seed = c.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const pr = ((seed * 9301 + 49297) % 233280) / 233280;
  const rsi = Math.max(15, Math.min(90, 50 + change * 2 + pr * 10 - 5));
  if (change > 5 && change7d > 10 && rsi < 70) return "STRONG BUY";
  if (change > 2 && rsi < 65) return "BUY";
  if (change < -5 && change7d < -10 && rsi > 35) return "STRONG SELL";
  if (change < -2 && rsi > 40) return "SELL";
  return "NEUTRAL";
}

function generateConfidence(c: CoinMarketData): number {
  const seed = c.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const pr = ((seed * 9301 + 49297) % 233280) / 233280;
  const change = Math.abs(c.price_change_percentage_24h || 0);
  return Math.round(Math.min(97, Math.max(45, 55 + change * 3 + pr * 20)));
}

function generateRSI(id: string, change: number): number {
  const seed = id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const pr = ((seed * 1234 + 5678) % 10000) / 10000;
  return Math.round(Math.max(20, Math.min(85, 50 + change * 3 + pr * 20 - 10)));
}

const SIGNAL_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  "STRONG BUY": { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  "BUY": { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  "NEUTRAL": { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20" },
  "SELL": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  "STRONG SELL": { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
};

const DEFAULT_FAVORITES = ["bitcoin", "ethereum", "solana", "binancecoin", "ripple", "cardano"];

const MOCK_PORTFOLIO: PortfolioEntry[] = [
  { symbol: "BTC", allocation: 45, pnl: 12.4, color: "#f59e0b" },
  { symbol: "ETH", allocation: 25, pnl: 8.7, color: "#6366f1" },
  { symbol: "SOL", allocation: 15, pnl: -3.2, color: "#10b981" },
  { symbol: "BNB", allocation: 10, pnl: 5.1, color: "#f97316" },
  { symbol: "Autres", allocation: 5, pnl: 2.3, color: "#8b5cf6" },
];

const MOCK_ALERTS: AlertItem[] = [
  { id: "1", symbol: "BTC", type: "price_up", message: "Bitcoin a dépassé 68 000 $", time: "Il y a 5 min", read: false },
  { id: "2", symbol: "ETH", type: "signal", message: "Signal STRONG BUY détecté sur ETH", time: "Il y a 12 min", read: false },
  { id: "3", symbol: "SOL", type: "price_down", message: "Solana a chuté de -5% en 1h", time: "Il y a 28 min", read: true },
  { id: "4", symbol: "BNB", type: "signal", message: "Pattern Bullish Engulfing sur BNB", time: "Il y a 1h", read: true },
];

const MOCK_NEWS = [
  { id: "n1", title: "Bitcoin franchit les 70 000$ — Nouveau record historique", time: "Il y a 2h", tag: "BTC", sentiment: "bullish" },
  { id: "n2", title: "Ethereum : mise à jour Dencun déployée avec succès", time: "Il y a 5h", tag: "ETH", sentiment: "bullish" },
  { id: "n3", title: "La SEC approuve de nouveaux ETF Bitcoin Spot", time: "Il y a 8h", tag: "Régulation", sentiment: "bullish" },
  { id: "n4", title: "Solana subit une panne réseau de 4 heures", time: "Il y a 1j", tag: "SOL", sentiment: "bearish" },
];

const MOCK_CALENDAR = [
  { id: "c1", date: "20 Fév", event: "Réunion FED — Décision taux d'intérêt", type: "macro" },
  { id: "c2", date: "22 Fév", event: "Expiration options BTC — 2.4Md$", type: "crypto" },
  { id: "c3", date: "25 Fév", event: "Rapport CPI USA (Inflation)", type: "macro" },
  { id: "c4", date: "28 Fév", event: "Ethereum — Mise à jour réseau", type: "crypto" },
];

const MOCK_DCA = [
  { symbol: "BTC", avgPrice: 42500, currentPrice: 68200, invested: 5000, pnl: 60.5 },
  { symbol: "ETH", avgPrice: 2100, currentPrice: 3400, invested: 2000, pnl: 61.9 },
  { symbol: "SOL", avgPrice: 95, currentPrice: 148, invested: 1000, pnl: 55.8 },
];

const MOCK_TARGETS = [
  { symbol: "BTC", target: 80000, current: 68200, progress: 85, timeframe: "Q1 2026" },
  { symbol: "ETH", target: 5000, current: 3400, progress: 68, timeframe: "Q2 2026" },
  { symbol: "SOL", target: 250, current: 148, progress: 59, timeframe: "Q2 2026" },
];

const MOCK_WHALES = [
  { id: "w1", symbol: "BTC", amount: "2,450 BTC", value: "$167M", time: "Il y a 3 min", direction: "out" },
  { id: "w2", symbol: "ETH", amount: "45,000 ETH", value: "$153M", time: "Il y a 12 min", direction: "in" },
  { id: "w3", symbol: "USDT", amount: "85,000,000 USDT", value: "$85M", time: "Il y a 25 min", direction: "out" },
  { id: "w4", symbol: "BNB", amount: "120,000 BNB", value: "$72M", time: "Il y a 1h", direction: "in" },
];

const DEFAULT_WIDGETS: Widget[] = [
  // Analyse
  { id: "favorites", label: "Cryptos Favorites", icon: <Star className="w-4 h-4" />, enabled: true, category: "analyse" },
  { id: "signals", label: "Signaux IA", icon: <Zap className="w-4 h-4" />, enabled: true, category: "analyse" },
  { id: "confidence", label: "Score Confiance IA", icon: <Shield className="w-4 h-4" />, enabled: true, category: "analyse" },
  { id: "rsi", label: "RSI & Indicateurs", icon: <LineChart className="w-4 h-4" />, enabled: true, category: "analyse" },
  // Portfolio
  { id: "portfolio", label: "Aperçu Portfolio", icon: <BarChart3 className="w-4 h-4" />, enabled: true, category: "portfolio" },
  { id: "dca", label: "Suivi DCA", icon: <Layers className="w-4 h-4" />, enabled: true, category: "portfolio" },
  { id: "targets", label: "Objectifs de Prix", icon: <Target className="w-4 h-4" />, enabled: true, category: "portfolio" },
  { id: "performance", label: "Performance", icon: <TrendingUp className="w-4 h-4" />, enabled: false, category: "portfolio" },
  // Marché
  { id: "market", label: "Résumé Marché", icon: <Activity className="w-4 h-4" />, enabled: true, category: "marché" },
  { id: "topGainers", label: "Top Gainers", icon: <ArrowUpRight className="w-4 h-4" />, enabled: true, category: "marché" },
  { id: "topLosers", label: "Top Losers", icon: <ArrowDownRight className="w-4 h-4" />, enabled: true, category: "marché" },
  { id: "volume", label: "Volume 24h", icon: <DollarSign className="w-4 h-4" />, enabled: false, category: "marché" },
  { id: "dominance", label: "Dominance BTC/ETH", icon: <PieChart className="w-4 h-4" />, enabled: true, category: "marché" },
  { id: "fearGreed", label: "Fear & Greed Index", icon: <Flame className="w-4 h-4" />, enabled: true, category: "marché" },
  { id: "heatmap", label: "Heatmap Marché", icon: <Hash className="w-4 h-4" />, enabled: false, category: "marché" },
  // Outils
  { id: "alerts", label: "Alertes Récentes", icon: <Bell className="w-4 h-4" />, enabled: true, category: "outils" },
  { id: "whales", label: "Mouvements Whales", icon: <Eye className="w-4 h-4" />, enabled: true, category: "outils" },
  { id: "news", label: "Actualités Crypto", icon: <Globe className="w-4 h-4" />, enabled: true, category: "outils" },
  { id: "calendar", label: "Calendrier Crypto", icon: <Clock className="w-4 h-4" />, enabled: false, category: "outils" },
  { id: "watchlist", label: "Watchlist Rapide", icon: <Search className="w-4 h-4" />, enabled: false, category: "outils" },
];

const CATEGORY_COLORS: Record<Widget["category"], { active: string; inactive: string; label: string }> = {
  analyse: { active: "bg-indigo-500/20 border-indigo-500/30 text-indigo-400", inactive: "bg-white/[0.02] border-white/[0.06] text-gray-500", label: "🔍 Analyse" },
  portfolio: { active: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400", inactive: "bg-white/[0.02] border-white/[0.06] text-gray-500", label: "💼 Portfolio" },
  marché: { active: "bg-amber-500/20 border-amber-500/30 text-amber-400", inactive: "bg-white/[0.02] border-white/[0.06] text-gray-500", label: "📊 Marché" },
  outils: { active: "bg-purple-500/20 border-purple-500/30 text-purple-400", inactive: "bg-white/[0.02] border-white/[0.06] text-gray-500", label: "🛠 Outils" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function WidgetCard({ title, icon, children, className = "" }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-slate-900/70 border border-white/[0.06] rounded-2xl p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">{icon}</div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FavoritesWidget({ coins, onRemove, onAdd, allCoins, showAddPanel, setShowAddPanel }: {
  coins: FavoriteCoin[]; onRemove: (id: string) => void; onAdd: (coin: CoinMarketData) => void;
  allCoins: CoinMarketData[]; showAddPanel: boolean; setShowAddPanel: (v: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = allCoins
    .filter((c) => !coins.find((f) => f.id === c.id))
    .filter((c) => !search || c.symbol.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);
  return (
    <WidgetCard title="Cryptos Favorites" icon={<Star className="w-4 h-4" />}>
      <div className="space-y-2">
        {coins.map((coin) => {
          const style = SIGNAL_STYLE[coin.signal];
          return (
            <div key={coin.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-black/20 border border-white/[0.04] hover:border-white/10 transition-all group">
              <img src={coin.image} alt={coin.symbol} className="w-7 h-7 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{coin.symbol}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${style.bg} ${style.text} border ${style.border}`}>{coin.signal}</span>
                </div>
                <span className="text-[11px] text-gray-500">{coin.name}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-white font-mono">${formatPrice(coin.price)}</p>
                <p className={`text-[11px] font-bold ${coin.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                </p>
              </div>
              <button onClick={() => onRemove(coin.id)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-gray-600 hover:text-red-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      <button onClick={() => setShowAddPanel(!showAddPanel)} className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/10 text-gray-500 hover:text-indigo-400 hover:border-indigo-500/30 transition-all text-xs font-semibold">
        <Plus className="w-3.5 h-3.5" /> Ajouter une crypto
      </button>
      {showAddPanel && (
        <div className="mt-3 p-3 bg-black/30 rounded-xl border border-white/[0.06]">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 mb-2" />
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {filtered.map((c) => (
              <button key={c.id} onClick={() => { onAdd(c); setShowAddPanel(false); setSearch(""); }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.05] transition-all text-left">
                <img src={c.image} alt={c.symbol} className="w-5 h-5 rounded-full" />
                <span className="text-xs font-bold text-white">{c.symbol.toUpperCase()}</span>
                <span className="text-[11px] text-gray-500">{c.name}</span>
                <span className="ml-auto text-xs text-gray-400 font-mono">${formatPrice(c.current_price)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}

function SignalsWidget({ coins }: { coins: FavoriteCoin[] }) {
  const top = [...coins].sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  return (
    <WidgetCard title="Signaux IA Récents" icon={<Zap className="w-4 h-4" />}>
      <div className="space-y-2.5">
        {top.map((coin) => {
          const style = SIGNAL_STYLE[coin.signal];
          return (
            <div key={coin.id} className="flex items-center gap-3">
              <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{coin.symbol}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${style.bg} ${style.text} border ${style.border}`}>{coin.signal}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${coin.confidence > 75 ? "bg-emerald-400" : coin.confidence > 55 ? "bg-amber-400" : "bg-gray-500"}`} style={{ width: `${coin.confidence}%` }} />
                </div>
              </div>
              <span className={`text-xs font-black flex-shrink-0 ${coin.confidence > 75 ? "text-emerald-400" : coin.confidence > 55 ? "text-amber-400" : "text-gray-400"}`}>{coin.confidence}%</span>
            </div>
          );
        })}
        {top.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Chargement des signaux...</p>}
      </div>
    </WidgetCard>
  );
}

function PortfolioWidget() {
  const totalPnl = MOCK_PORTFOLIO.reduce((acc, e) => acc + e.pnl * e.allocation / 100, 0);
  return (
    <WidgetCard title="Aperçu Portfolio" icon={<BarChart3 className="w-4 h-4" />}>
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Performance globale</p>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-black ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)}%</span>
          <span className="text-xs text-gray-500">ce mois</span>
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-20 mb-3">
        {MOCK_PORTFOLIO.map((e) => (
          <div key={e.symbol} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-md transition-all" style={{ height: `${(e.allocation / 45) * 100}%`, backgroundColor: e.color, opacity: 0.8 }} />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {MOCK_PORTFOLIO.map((e) => (
          <div key={e.symbol} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
            <span className="text-xs font-bold text-white flex-1">{e.symbol}</span>
            <span className="text-xs text-gray-500">{e.allocation}%</span>
            <span className={`text-xs font-bold ${e.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{e.pnl >= 0 ? "+" : ""}{e.pnl}%</span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

function AlertsWidget({ alerts, onDismiss }: { alerts: AlertItem[]; onDismiss: (id: string) => void }) {
  const typeIcon = (type: AlertItem["type"]) => {
    if (type === "price_up") return <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />;
    if (type === "price_down") return <ChevronDown className="w-3.5 h-3.5 text-red-400" />;
    return <Zap className="w-3.5 h-3.5 text-indigo-400" />;
  };
  const typeBg = (type: AlertItem["type"]) => {
    if (type === "price_up") return "bg-emerald-500/10 border-emerald-500/20";
    if (type === "price_down") return "bg-red-500/10 border-red-500/20";
    return "bg-indigo-500/10 border-indigo-500/20";
  };
  return (
    <WidgetCard title="Alertes Récentes" icon={<Bell className="w-4 h-4" />}>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div key={alert.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all group ${typeBg(alert.type)} ${alert.read ? "opacity-50" : ""}`}>
            <div className="w-6 h-6 rounded-lg bg-black/20 flex items-center justify-center flex-shrink-0 mt-0.5">{typeIcon(alert.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-bold text-white">{alert.symbol}</span>
                {!alert.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />}
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">{alert.message}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{alert.time}</p>
            </div>
            <button onClick={() => onDismiss(alert.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 flex-shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="text-center py-6">
            <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Aucune alerte récente</p>
          </div>
        )}
      </div>
    </WidgetCard>
  );
}

function MarketWidget({ coins }: { coins: FavoriteCoin[] }) {
  const bullish = coins.filter((c) => c.signal === "BUY" || c.signal === "STRONG BUY").length;
  const bearish = coins.filter((c) => c.signal === "SELL" || c.signal === "STRONG SELL").length;
  const neutral = coins.filter((c) => c.signal === "NEUTRAL").length;
  const total = coins.length || 1;
  const bullPct = Math.round((bullish / total) * 100);
  const bearPct = Math.round((bearish / total) * 100);
  const avgChange = coins.length ? coins.reduce((a, c) => a + c.change24h, 0) / coins.length : 0;
  return (
    <WidgetCard title="Résumé Marché" icon={<Activity className="w-4 h-4" />}>
      <div className="mb-4 p-3 rounded-xl bg-black/20 border border-white/[0.04]">
        <p className="text-xs text-gray-500 mb-1">Variation moyenne 24h</p>
        <div className={`text-2xl font-black ${avgChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>{avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%</div>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 mb-3">
        <div className="bg-emerald-400 rounded-l-full" style={{ width: `${bullPct}%` }} />
        <div className="bg-gray-500" style={{ width: `${Math.round((neutral / total) * 100)}%` }} />
        <div className="bg-red-400 rounded-r-full" style={{ width: `${bearPct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Haussier", value: bullish, pct: bullPct, text: "text-emerald-400" },
          { label: "Neutre", value: neutral, pct: Math.round((neutral / total) * 100), text: "text-gray-400" },
          { label: "Baissier", value: bearish, pct: bearPct, text: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="text-center p-2 rounded-lg bg-black/20">
            <p className={`text-lg font-black ${s.text}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
            <p className={`text-[10px] font-bold ${s.text}`}>{s.pct}%</p>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

function ConfidenceWidget({ coins }: { coins: FavoriteCoin[] }) {
  const sorted = [...coins].sort((a, b) => b.confidence - a.confidence).slice(0, 6);
  const avg = sorted.length ? Math.round(sorted.reduce((a, c) => a + c.confidence, 0) / sorted.length) : 0;
  return (
    <WidgetCard title="Score de Confiance IA" icon={<Shield className="w-4 h-4" />}>
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle cx="48" cy="48" r="40" fill="none" stroke={avg > 75 ? "#10b981" : avg > 55 ? "#f59e0b" : "#6b7280"} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - avg / 100)}`} className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-black ${avg > 75 ? "text-emerald-400" : avg > 55 ? "text-amber-400" : "text-gray-400"}`}>{avg}%</span>
            <span className="text-[9px] text-gray-500 font-bold">MOY. IA</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {sorted.map((coin) => (
          <div key={coin.id} className="flex items-center gap-2">
            <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full flex-shrink-0" />
            <span className="text-xs font-bold text-white w-12 flex-shrink-0">{coin.symbol}</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${coin.confidence > 75 ? "bg-emerald-400" : coin.confidence > 55 ? "bg-amber-400" : "bg-gray-500"}`} style={{ width: `${coin.confidence}%` }} />
            </div>
            <span className={`text-xs font-black flex-shrink-0 w-9 text-right ${coin.confidence > 75 ? "text-emerald-400" : coin.confidence > 55 ? "text-amber-400" : "text-gray-400"}`}>{coin.confidence}%</span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

function TopGainersWidget({ coins }: { coins: FavoriteCoin[] }) {
  const top = [...coins].sort((a, b) => b.change24h - a.change24h).slice(0, 5);
  return (
    <WidgetCard title="Top Gainers 24h" icon={<ArrowUpRight className="w-4 h-4" />}>
      <div className="space-y-2.5">
        {top.map((coin, i) => (
          <div key={coin.id} className="flex items-center gap-3">
            <span className="text-xs font-black text-gray-600 w-4 flex-shrink-0">#{i + 1}</span>
            <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-white">{coin.symbol}</span>
              <p className="text-[10px] text-gray-500 font-mono">${formatPrice(coin.price)}</p>
            </div>
            <span className="text-xs font-black text-emerald-400">+{coin.change24h.toFixed(2)}%</span>
          </div>
        ))}
        {top.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Chargement...</p>}
      </div>
    </WidgetCard>
  );
}

function TopLosersWidget({ coins }: { coins: FavoriteCoin[] }) {
  const top = [...coins].sort((a, b) => a.change24h - b.change24h).slice(0, 5);
  return (
    <WidgetCard title="Top Losers 24h" icon={<ArrowDownRight className="w-4 h-4" />}>
      <div className="space-y-2.5">
        {top.map((coin, i) => (
          <div key={coin.id} className="flex items-center gap-3">
            <span className="text-xs font-black text-gray-600 w-4 flex-shrink-0">#{i + 1}</span>
            <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-white">{coin.symbol}</span>
              <p className="text-[10px] text-gray-500 font-mono">${formatPrice(coin.price)}</p>
            </div>
            <span className="text-xs font-black text-red-400">{coin.change24h.toFixed(2)}%</span>
          </div>
        ))}
        {top.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Chargement...</p>}
      </div>
    </WidgetCard>
  );
}

function VolumeWidget({ coins }: { coins: FavoriteCoin[] }) {
  const sorted = [...coins].sort((a, b) => b.volume - a.volume).slice(0, 5);
  const maxVol = sorted[0]?.volume || 1;
  return (
    <WidgetCard title="Volume 24h" icon={<DollarSign className="w-4 h-4" />}>
      <div className="space-y-3">
        {sorted.map((coin) => (
          <div key={coin.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full" />
                <span className="text-xs font-bold text-white">{coin.symbol}</span>
              </div>
              <span className="text-xs text-gray-400 font-mono">${(coin.volume / 1e9).toFixed(1)}B</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${(coin.volume / maxVol) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

function DominanceWidget() {
  const btcDom = 52.4;
  const ethDom = 17.8;
  const otherDom = 100 - btcDom - ethDom;
  return (
    <WidgetCard title="Dominance BTC / ETH" icon={<PieChart className="w-4 h-4" />}>
      <div className="space-y-3">
        {[
          { label: "Bitcoin (BTC)", pct: btcDom, color: "#f59e0b", bar: "bg-amber-400" },
          { label: "Ethereum (ETH)", pct: ethDom, color: "#6366f1", bar: "bg-indigo-400" },
          { label: "Altcoins", pct: otherDom, color: "#8b5cf6", bar: "bg-purple-400" },
        ].map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-white">{item.label}</span>
              </div>
              <span className="text-xs font-black text-white">{item.pct.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
        <p className="text-[10px] text-gray-600 text-center mt-2">Données simulées — mise à jour toutes les 2h</p>
      </div>
    </WidgetCard>
  );
}

function FearGreedWidget() {
  const value = 72;
  const label = value >= 75 ? "Extrême Avidité" : value >= 55 ? "Avidité" : value >= 45 ? "Neutre" : value >= 25 ? "Peur" : "Extrême Peur";
  const color = value >= 75 ? "#10b981" : value >= 55 ? "#f59e0b" : value >= 45 ? "#6b7280" : value >= 25 ? "#f97316" : "#ef4444";
  const history = [45, 52, 61, 68, 72, 70, 72];
  return (
    <WidgetCard title="Fear & Greed Index" icon={<Flame className="w-4 h-4" />}>
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
            <circle cx="56" cy="56" r="48" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 48}`} strokeDashoffset={`${2 * Math.PI * 48 * (1 - value / 100)}`} className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{value}</span>
            <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
          </div>
        </div>
      </div>
      <div className="flex items-end gap-1 h-10 mt-2">
        {history.map((v, i) => (
          <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${v}%`, backgroundColor: color, opacity: i === history.length - 1 ? 1 : 0.4 }} />
        ))}
      </div>
      <p className="text-[10px] text-gray-600 text-center mt-1">7 derniers jours</p>
    </WidgetCard>
  );
}

function RSIWidget({ coins }: { coins: FavoriteCoin[] }) {
  return (
    <WidgetCard title="RSI & Indicateurs Techniques" icon={<LineChart className="w-4 h-4" />}>
      <div className="space-y-3">
        {coins.slice(0, 5).map((coin) => {
          const rsi = generateRSI(coin.id, coin.change24h);
          const rsiColor = rsi >= 70 ? "text-red-400" : rsi <= 30 ? "text-emerald-400" : "text-amber-400";
          const rsiLabel = rsi >= 70 ? "Suracheté" : rsi <= 30 ? "Survendu" : "Neutre";
          return (
            <div key={coin.id} className="flex items-center gap-3">
              <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{coin.symbol}</span>
                  <span className={`text-[10px] font-bold ${rsiColor}`}>{rsiLabel}</span>
                </div>
                <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="absolute inset-0 flex">
                    <div className="w-[30%] bg-emerald-500/20" />
                    <div className="flex-1 bg-amber-500/10" />
                    <div className="w-[30%] bg-red-500/20" />
                  </div>
                  <div className="absolute top-0 h-full w-1 bg-white rounded-full" style={{ left: `${rsi}%`, transform: "translateX(-50%)" }} />
                </div>
              </div>
              <span className={`text-xs font-black flex-shrink-0 ${rsiColor}`}>{rsi}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-gray-600">
        <span className="text-emerald-500">Survendu &lt;30</span>
        <span className="text-amber-500">Neutre 30–70</span>
        <span className="text-red-500">Suracheté &gt;70</span>
      </div>
    </WidgetCard>
  );
}

function WhalesWidget() {
  return (
    <WidgetCard title="Mouvements Whales" icon={<Eye className="w-4 h-4" />}>
      <div className="space-y-2">
        {MOCK_WHALES.map((w) => (
          <div key={w.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${w.direction === "in" ? "bg-emerald-500/5 border-emerald-500/15" : "bg-red-500/5 border-red-500/15"}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${w.direction === "in" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
              {w.direction === "in" ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{w.symbol}</span>
                <span className="text-[10px] text-gray-500">{w.amount}</span>
              </div>
              <p className="text-[10px] text-gray-600">{w.time}</p>
            </div>
            <span className={`text-xs font-black flex-shrink-0 ${w.direction === "in" ? "text-emerald-400" : "text-red-400"}`}>{w.value}</span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

function NewsWidget() {
  return (
    <WidgetCard title="Actualités Crypto" icon={<Globe className="w-4 h-4" />}>
      <div className="space-y-3">
        {MOCK_NEWS.map((n) => (
          <div key={n.id} className="flex items-start gap-3 pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${n.sentiment === "bullish" ? "bg-emerald-400" : "bg-red-400"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-semibold leading-snug">{n.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 font-bold">{n.tag}</span>
                <span className="text-[10px] text-gray-600">{n.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

function HeatmapWidget({ coins }: { coins: FavoriteCoin[] }) {
  return (
    <WidgetCard title="Heatmap Marché" icon={<Hash className="w-4 h-4" />}>
      <div className="grid grid-cols-4 gap-1.5">
        {coins.slice(0, 12).map((coin) => {
          const intensity = Math.abs(coin.change24h);
          const isPos = coin.change24h >= 0;
          const opacity = Math.min(0.9, 0.2 + intensity * 0.08);
          return (
            <div key={coin.id} className="rounded-lg p-2 text-center" style={{ backgroundColor: isPos ? `rgba(16,185,129,${opacity})` : `rgba(239,68,68,${opacity})` }}>
              <p className="text-[10px] font-black text-white">{coin.symbol}</p>
              <p className={`text-[9px] font-bold ${isPos ? "text-emerald-300" : "text-red-300"}`}>{isPos ? "+" : ""}{coin.change24h.toFixed(1)}%</p>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}

function DCAWidget() {
  return (
    <WidgetCard title="Suivi DCA" icon={<Layers className="w-4 h-4" />}>
      <div className="space-y-3">
        {MOCK_DCA.map((entry) => (
          <div key={entry.symbol} className="p-3 rounded-xl bg-black/20 border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black text-white">{entry.symbol}</span>
              <span className="text-xs font-black text-emerald-400">+{entry.pnl.toFixed(1)}%</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><p className="text-gray-500">Prix moyen</p><p className="text-white font-mono font-bold">${formatPrice(entry.avgPrice)}</p></div>
              <div><p className="text-gray-500">Prix actuel</p><p className="text-emerald-400 font-mono font-bold">${formatPrice(entry.currentPrice)}</p></div>
              <div><p className="text-gray-500">Investi</p><p className="text-white font-bold">${entry.invested.toLocaleString()}</p></div>
              <div><p className="text-gray-500">Valeur actuelle</p><p className="text-emerald-400 font-bold">${Math.round(entry.invested * (1 + entry.pnl / 100)).toLocaleString()}</p></div>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

function TargetsWidget() {
  return (
    <WidgetCard title="Objectifs de Prix" icon={<Target className="w-4 h-4" />}>
      <div className="space-y-4">
        {MOCK_TARGETS.map((t) => (
          <div key={t.symbol}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">{t.symbol}</span>
                <span className="text-[10px] text-gray-500">{t.timeframe}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-400">${formatPrice(t.target)}</span>
                <span className="text-[10px] text-gray-600 ml-1">objectif</span>
              </div>
            </div>
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${t.progress}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-gray-500 font-mono">${formatPrice(t.current)}</span>
              <span className="text-[10px] font-bold text-indigo-400">{t.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

function CalendarWidget() {
  return (
    <WidgetCard title="Calendrier Crypto" icon={<Clock className="w-4 h-4" />}>
      <div className="space-y-2">
        {MOCK_CALENDAR.map((ev) => (
          <div key={ev.id} className={`flex items-start gap-3 p-2.5 rounded-xl border ${ev.type === "macro" ? "bg-amber-500/5 border-amber-500/15" : "bg-indigo-500/5 border-indigo-500/15"}`}>
            <div className={`px-2 py-1 rounded-lg text-center flex-shrink-0 ${ev.type === "macro" ? "bg-amber-500/20" : "bg-indigo-500/20"}`}>
              <p className={`text-[10px] font-black ${ev.type === "macro" ? "text-amber-400" : "text-indigo-400"}`}>{ev.date}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-semibold leading-snug">{ev.event}</p>
              <span className={`text-[10px] font-bold ${ev.type === "macro" ? "text-amber-500" : "text-indigo-400"}`}>{ev.type === "macro" ? "Macro" : "Crypto"}</span>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

function PerformanceWidget({ coins }: { coins: FavoriteCoin[] }) {
  const avg24h = coins.length ? coins.reduce((a, c) => a + c.change24h, 0) / coins.length : 0;
  const periods = [
    { label: "24h", value: avg24h },
    { label: "7j", value: 8.4 },
    { label: "30j", value: 23.7 },
    { label: "90j", value: -5.2 },
  ];
  return (
    <WidgetCard title="Performance Portfolio" icon={<TrendingUp className="w-4 h-4" />}>
      <div className="grid grid-cols-2 gap-3">
        {periods.map((p) => (
          <div key={p.label} className="p-3 rounded-xl bg-black/20 border border-white/[0.04] text-center">
            <p className="text-[10px] text-gray-500 mb-1">{p.label}</p>
            <p className={`text-lg font-black ${p.value >= 0 ? "text-emerald-400" : "text-red-400"}`}>{p.value >= 0 ? "+" : ""}{p.value.toFixed(1)}%</p>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-bold text-indigo-300">Analyse IA</span>
        </div>
        <p className="text-[11px] text-gray-400">Votre portfolio surperforme le marché de +4.2% sur 30 jours. Diversification recommandée vers les mid-caps.</p>
      </div>
    </WidgetCard>
  );
}

function WatchlistWidget({ allCoins }: { allCoins: CoinMarketData[] }) {
  const [search, setSearch] = useState("");
  const filtered = allCoins
    .filter((c) => !search || c.symbol.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 6);
  return (
    <WidgetCard title="Watchlist Rapide" icon={<Search className="w-4 h-4" />}>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une crypto..."
        className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 mb-3" />
      <div className="space-y-2">
        {filtered.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <img src={c.image} alt={c.symbol} className="w-6 h-6 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-white">{c.symbol.toUpperCase()}</span>
              <span className="text-[10px] text-gray-500 ml-1.5">{c.name}</span>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-white">${formatPrice(c.current_price)}</p>
              <p className={`text-[10px] font-bold ${(c.price_change_percentage_24h || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {(c.price_change_percentage_24h || 0) >= 0 ? "+" : ""}{(c.price_change_percentage_24h || 0).toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

// ─── Widget Renderer ─────────────────────────────────────────────────────────

function renderWidget(
  w: Widget,
  favorites: FavoriteCoin[],
  alerts: AlertItem[],
  allCoins: CoinMarketData[],
  showAddPanel: boolean,
  setShowAddPanel: (v: boolean) => void,
  onRemoveFavorite: (id: string) => void,
  onAddFavorite: (coin: CoinMarketData) => void,
  onDismissAlert: (id: string) => void,
) {
  switch (w.id) {
    case "favorites": return <FavoritesWidget coins={favorites} onRemove={onRemoveFavorite} onAdd={onAddFavorite} allCoins={allCoins} showAddPanel={showAddPanel} setShowAddPanel={setShowAddPanel} />;
    case "signals": return <SignalsWidget coins={favorites} />;
    case "portfolio": return <PortfolioWidget />;
    case "alerts": return <AlertsWidget alerts={alerts} onDismiss={onDismissAlert} />;
    case "market": return <MarketWidget coins={favorites} />;
    case "confidence": return <ConfidenceWidget coins={favorites} />;
    case "topGainers": return <TopGainersWidget coins={favorites} />;
    case "topLosers": return <TopLosersWidget coins={favorites} />;
    case "volume": return <VolumeWidget coins={favorites} />;
    case "dominance": return <DominanceWidget />;
    case "fearGreed": return <FearGreedWidget />;
    case "rsi": return <RSIWidget coins={favorites} />;
    case "whales": return <WhalesWidget />;
    case "news": return <NewsWidget />;
    case "heatmap": return <HeatmapWidget coins={favorites} />;
    case "dca": return <DCAWidget />;
    case "targets": return <TargetsWidget />;
    case "calendar": return <CalendarWidget />;
    case "performance": return <PerformanceWidget coins={favorites} />;
    case "watchlist": return <WatchlistWidget allCoins={allCoins} />;
    default: return null;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyCryptoIA() {
  const [allCoins, setAllCoins] = useState<CoinMarketData[]>([]);
  const [favorites, setFavorites] = useState<FavoriteCoin[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>(MOCK_ALERTS);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [activeCategory, setActiveCategory] = useState<"all" | Widget["category"]>("all");

  const FAVORITES_KEY = "cryptoia_my_favorites";

  const loadFavoriteIds = (): string[] => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_FAVORITES;
    } catch { return DEFAULT_FAVORITES; }
  };

  const saveFavoriteIds = (ids: string[]) => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  };

  const buildFavorites = useCallback((coins: CoinMarketData[], ids: string[]): FavoriteCoin[] => {
    return ids.map((id) => coins.find((c) => c.id === id)).filter(Boolean).map((c) => ({
      id: c!.id, symbol: c!.symbol.toUpperCase(), name: c!.name, image: c!.image,
      price: c!.current_price, change24h: c!.price_change_percentage_24h || 0,
      marketCap: c!.market_cap, volume: c!.total_volume,
      confidence: generateConfidence(c!), signal: generateSignal(c!),
    })) as FavoriteCoin[];
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTop200(false);
      setAllCoins(data);
      const ids = loadFavoriteIds();
      setFavorites(buildFavorites(data, ids));
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch { /* keep */ } finally { setLoading(false); }
  }, [buildFavorites]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRemoveFavorite = (id: string) => {
    const newIds = loadFavoriteIds().filter((i) => i !== id);
    saveFavoriteIds(newIds);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAddFavorite = (coin: CoinMarketData) => {
    const ids = loadFavoriteIds();
    if (ids.includes(coin.id)) return;
    saveFavoriteIds([...ids, coin.id]);
    setFavorites((prev) => [...prev, {
      id: coin.id, symbol: coin.symbol.toUpperCase(), name: coin.name, image: coin.image,
      price: coin.current_price, change24h: coin.price_change_percentage_24h || 0,
      marketCap: coin.market_cap, volume: coin.total_volume,
      confidence: generateConfidence(coin), signal: generateSignal(coin),
    }]);
  };

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleWidget = (id: WidgetId) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)));
  };

  const unreadAlerts = alerts.filter((a) => !a.read).length;

  const categories: Array<"all" | Widget["category"]> = ["all", "analyse", "portfolio", "marché", "outils"];
  const filteredWidgets = widgets.filter((w) => activeCategory === "all" || w.category === activeCategory);
  const enabledWidgets = widgets.filter((w) => w.enabled);

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 py-6">
          <PageHeader
            icon={<LayoutDashboard className="w-6 h-6" />}
            title="My CryptoIA — Dashboard Personnalisé"
            subtitle="Votre espace personnel entièrement configurable. 20 widgets disponibles : favoris, signaux IA, portfolio, alertes, marché, RSI, whales, actualités et bien plus."
            accentColor="indigo"
            steps={[
              { n: "1", title: "Personnalisez vos widgets", desc: "Cliquez sur ⚙️ Personnaliser pour activer/désactiver les 20 widgets disponibles. Filtrez par catégorie pour trouver rapidement." },
              { n: "2", title: "Ajoutez vos cryptos favorites", desc: "Dans le widget 'Cryptos Favorites', cliquez sur '+ Ajouter une crypto' pour suivre les actifs qui vous intéressent." },
              { n: "3", title: "Interprétez les signaux IA", desc: "Les scores de confiance > 75% indiquent des signaux forts. Combinez RSI, Fear & Greed et mouvements Whales pour valider vos décisions." },
            ]}
          />

          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-400">Dashboard IA Actif</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                <span className="text-xs font-bold text-gray-400">{enabledWidgets.length}/20 widgets actifs</span>
              </div>
              {unreadAlerts > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">{unreadAlerts} alerte{unreadAlerts > 1 ? "s" : ""}</span>
                </div>
              )}
              {lastUpdate && <span className="text-xs text-gray-600">Mis à jour : {lastUpdate}</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchData} disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-bold text-gray-400 hover:text-white transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualiser
              </button>
              <button onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${showSettings ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400" : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-gray-400 hover:text-white"}`}>
                <Settings className="w-3.5 h-3.5" /> Personnaliser ({enabledWidgets.length})
              </button>
            </div>
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="mb-6 p-5 rounded-2xl bg-slate-900/70 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Widgets disponibles</h3>
                <span className="text-xs text-gray-500 ml-1">— 20 widgets, activez ceux que vous souhaitez</span>
              </div>
              {/* Category filter */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${activeCategory === cat ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400" : "bg-white/[0.02] border-white/[0.06] text-gray-500 hover:text-gray-300"}`}>
                    {cat === "all" ? "🔲 Tous (20)" : CATEGORY_COLORS[cat].label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {filteredWidgets.map((w) => {
                  const catStyle = CATEGORY_COLORS[w.category];
                  return (
                    <button key={w.id} onClick={() => toggleWidget(w.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${w.enabled ? catStyle.active : catStyle.inactive}`}>
                      {w.icon}
                      <span className="text-[10px] font-bold text-center leading-tight">{w.label}</span>
                      <div className={`w-8 h-4 rounded-full transition-all ${w.enabled ? "bg-indigo-500" : "bg-gray-700"} relative`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${w.enabled ? "left-4" : "left-0.5"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-600 mt-3 text-center">{enabledWidgets.length} widget{enabledWidgets.length > 1 ? "s" : ""} actif{enabledWidgets.length > 1 ? "s" : ""} sur 20 disponibles</p>
            </div>
          )}

          {/* Loading state */}
          {loading && favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Chargement de votre dashboard...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {enabledWidgets.map((w) => (
                <div key={w.id}>
                  {renderWidget(w, favorites, alerts, allCoins, showAddPanel, setShowAddPanel, handleRemoveFavorite, handleAddFavorite, handleDismissAlert)}
                </div>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}