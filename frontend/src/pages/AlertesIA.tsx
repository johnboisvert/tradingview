import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { fetchTop200, formatPrice, type CoinMarketData } from "@/lib/cryptoApi";
import {
  Bell,
  Plus,
  X,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Eye,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Search,
  Mail,
  MessageSquare,
  Settings,
  Send,
  Smartphone,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertType = "price_above" | "price_below" | "signal_buy" | "signal_sell" | "pattern" | "whale";
type AlertStatus = "active" | "inactive" | "triggered";
type NotifChannel = "in-app" | "email" | "sms" | "all";

interface AlertRule {
  id: string;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  coinImage: string;
  type: AlertType;
  targetPrice?: number;
  currentPrice?: number;
  condition: string;
  channel: NotifChannel;
  status: AlertStatus;
  createdAt: string;
  triggeredAt?: string;
}

interface HistoryEntry {
  id: string;
  coinSymbol: string;
  coinImage: string;
  type: AlertType;
  condition: string;
  triggeredAt: string;
  price?: number;
  channel: NotifChannel;
}

interface NotifSettings {
  emailEnabled: boolean;
  emailAddress: string;
  smsEnabled: boolean;
  smsPhone: string;
  sendgridKey: string;
  twilioSid: string;
  twilioToken: string;
  twilioFrom: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  price_above: "Prix au-dessus de",
  price_below: "Prix en-dessous de",
  signal_buy: "Signal IA BUY",
  signal_sell: "Signal IA SELL",
  pattern: "Pattern technique",
  whale: "Mouvement Whale",
};

const ALERT_TYPE_ICONS: Record<AlertType, React.ReactNode> = {
  price_above: <TrendingUp className="w-3.5 h-3.5" />,
  price_below: <TrendingDown className="w-3.5 h-3.5" />,
  signal_buy: <Zap className="w-3.5 h-3.5" />,
  signal_sell: <Zap className="w-3.5 h-3.5" />,
  pattern: <Activity className="w-3.5 h-3.5" />,
  whale: <Eye className="w-3.5 h-3.5" />,
};

const ALERT_TYPE_COLORS: Record<AlertType, { bg: string; text: string; border: string }> = {
  price_above: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  price_below: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
  signal_buy: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
  signal_sell: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
  pattern: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" },
  whale: { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30" },
};

const PATTERNS = [
  "Bullish Engulfing",
  "Bearish Engulfing",
  "Doji",
  "Hammer",
  "Shooting Star",
  "Double Top",
  "Double Bottom",
  "Head & Shoulders",
  "Golden Cross",
  "Death Cross",
];

const MOCK_HISTORY: HistoryEntry[] = [
  { id: "h1", coinSymbol: "BTC", coinImage: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png", type: "price_above", condition: "Prix > 68 000 $", triggeredAt: "2026-02-19 14:32", price: 68420, channel: "in-app" },
  { id: "h2", coinSymbol: "ETH", coinImage: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", type: "signal_buy", condition: "Signal IA STRONG BUY détecté", triggeredAt: "2026-02-19 11:15", channel: "email" },
  { id: "h3", coinSymbol: "SOL", coinImage: "https://assets.coingecko.com/coins/images/4128/small/solana.png", type: "price_below", condition: "Prix < 150 $", triggeredAt: "2026-02-18 22:47", price: 148.3, channel: "sms" },
  { id: "h4", coinSymbol: "BNB", coinImage: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png", type: "pattern", condition: "Pattern Golden Cross détecté", triggeredAt: "2026-02-18 09:05", channel: "in-app" },
  { id: "h5", coinSymbol: "XRP", coinImage: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png", type: "whale", condition: "Mouvement Whale > 10M$ détecté", triggeredAt: "2026-02-17 18:22", channel: "in-app" },
];

const STORAGE_KEY = "cryptoia_alertes_ia";
const NOTIF_SETTINGS_KEY = "cryptoia_notif_settings";

const CHANNEL_OPTIONS: { value: NotifChannel; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "in-app", label: "In-App seulement", icon: <Bell className="w-3.5 h-3.5" />, color: "text-indigo-400" },
  { value: "email", label: "Email", icon: <Mail className="w-3.5 h-3.5" />, color: "text-blue-400" },
  { value: "sms", label: "SMS", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-emerald-400" },
  { value: "all", label: "Tous les canaux", icon: <Send className="w-3.5 h-3.5" />, color: "text-amber-400" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadAlerts(): AlertRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: AlertRule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

function loadNotifSettings(): NotifSettings {
  try {
    const raw = localStorage.getItem(NOTIF_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {
      emailEnabled: false, emailAddress: "",
      smsEnabled: false, smsPhone: "",
      sendgridKey: "", twilioSid: "", twilioToken: "", twilioFrom: "",
    };
  } catch {
    return { emailEnabled: false, emailAddress: "", smsEnabled: false, smsPhone: "", sendgridKey: "", twilioSid: "", twilioToken: "", twilioFrom: "" };
  }
}

function saveNotifSettings(s: NotifSettings) {
  localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(s));
}

function buildConditionLabel(type: AlertType, targetPrice?: number, pattern?: string): string {
  if (type === "price_above") return `Prix > ${targetPrice ? "$" + targetPrice.toLocaleString() : "?"}`;
  if (type === "price_below") return `Prix < ${targetPrice ? "$" + targetPrice.toLocaleString() : "?"}`;
  if (type === "signal_buy") return "Signal IA BUY ou STRONG BUY détecté";
  if (type === "signal_sell") return "Signal IA SELL ou STRONG SELL détecté";
  if (type === "pattern") return `Pattern ${pattern || "technique"} détecté`;
  if (type === "whale") return "Mouvement Whale > 10M$ détecté";
  return "";
}

// ─── Send notification helpers ────────────────────────────────────────────────

async function sendEmailNotification(settings: NotifSettings, subject: string, body: string): Promise<{ ok: boolean; error?: string }> {
  if (!settings.sendgridKey) return { ok: false, error: "Clé SendGrid manquante" };
  if (!settings.emailAddress) return { ok: false, error: "Adresse email non configurée" };
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.sendgridKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: settings.emailAddress }] }],
        from: { email: "alerts@cryptoia.app", name: "CryptoIA Alertes" },
        subject,
        content: [{ type: "text/plain", value: body }],
      }),
    });
    if (res.status === 202) return { ok: true };
    const text = await res.text();
    return { ok: false, error: `SendGrid erreur ${res.status}: ${text.slice(0, 100)}` };
  } catch (e) {
    return { ok: false, error: `Erreur réseau: ${String(e).slice(0, 80)}` };
  }
}

async function sendSmsNotification(settings: NotifSettings, message: string): Promise<{ ok: boolean; error?: string }> {
  if (!settings.twilioSid || !settings.twilioToken || !settings.twilioFrom) return { ok: false, error: "Configuration Twilio manquante" };
  if (!settings.smsPhone) return { ok: false, error: "Numéro de téléphone non configuré" };
  try {
    const credentials = btoa(`${settings.twilioSid}:${settings.twilioToken}`);
    const body = new URLSearchParams({ To: settings.smsPhone, From: settings.twilioFrom, Body: message });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${settings.twilioSid}/Messages.json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${credentials}` },
      body: body.toString(),
    });
    if (res.ok) return { ok: true };
    const json = await res.json();
    return { ok: false, error: `Twilio erreur: ${json.message || res.status}` };
  } catch (e) {
    return { ok: false, error: `Erreur réseau: ${String(e).slice(0, 80)}` };
  }
}

async function dispatchNotification(
  settings: NotifSettings,
  channel: NotifChannel,
  alert: AlertRule,
  price?: number
): Promise<void> {
  const subject = `🚨 CryptoIA — Alerte ${alert.coinSymbol} déclenchée`;
  const body = `Votre alerte sur ${alert.coinSymbol} (${alert.coinName}) a été déclenchée.\n\nCondition : ${alert.condition}${price ? `\nPrix actuel : $${formatPrice(price)}` : ""}\n\nDéclenché le : ${new Date().toLocaleString("fr-FR")}\n\n— CryptoIA Platform`;
  const smsMsg = `🚨 CryptoIA: Alerte ${alert.coinSymbol} — ${alert.condition}${price ? ` @ $${formatPrice(price)}` : ""}`;

  if ((channel === "email" || channel === "all") && settings.emailEnabled) {
    await sendEmailNotification(settings, subject, body);
  }
  if ((channel === "sms" || channel === "all") && settings.smsEnabled) {
    await sendSmsNotification(settings, smsMsg);
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SelectField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/50 pr-8"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#0f172a]">{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Notification Settings Panel ─────────────────────────────────────────────

function NotifSettingsPanel({ settings, onChange, onTest }: {
  settings: NotifSettings;
  onChange: (s: NotifSettings) => void;
  onTest: (channel: "email" | "sms") => void;
}) {
  const [showKeys, setShowKeys] = useState(false);

  return (
    <div className="mb-6 bg-slate-900/80 border border-white/[0.08] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Settings className="w-4 h-4 text-indigo-400" />
        </div>
        <h3 className="text-sm font-bold text-white">Configuration des notifications</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email section */}
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-white">Email via SendGrid</span>
            </div>
            <button
              onClick={() => onChange({ ...settings, emailEnabled: !settings.emailEnabled })}
              className={`w-10 h-5 rounded-full transition-all relative ${settings.emailEnabled ? "bg-blue-500" : "bg-gray-700"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings.emailEnabled ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1">Adresse email de destination</label>
              <input
                type="email"
                value={settings.emailAddress}
                onChange={(e) => onChange({ ...settings, emailAddress: e.target.value })}
                placeholder="votre@email.com"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1">
                Clé API SendGrid
                <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-400 hover:underline">→ Obtenir une clé</a>
              </label>
              <input
                type={showKeys ? "text" : "password"}
                value={settings.sendgridKey}
                onChange={(e) => onChange({ ...settings, sendgridKey: e.target.value })}
                placeholder="SG.xxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono"
              />
            </div>
            {!settings.sendgridKey && (
              <p className="text-[10px] text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Clé SendGrid manquante — les emails ne seront pas envoyés
              </p>
            )}
            <button
              onClick={() => onTest("email")}
              disabled={!settings.sendgridKey || !settings.emailAddress}
              className="w-full py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Envoyer un email de test
            </button>
          </div>
        </div>

        {/* SMS section */}
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">SMS via Twilio</span>
            </div>
            <button
              onClick={() => onChange({ ...settings, smsEnabled: !settings.smsEnabled })}
              className={`w-10 h-5 rounded-full transition-all relative ${settings.smsEnabled ? "bg-emerald-500" : "bg-gray-700"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings.smsEnabled ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1">Numéro de téléphone (format +33...)</label>
              <input
                type="tel"
                value={settings.smsPhone}
                onChange={(e) => onChange({ ...settings, smsPhone: e.target.value })}
                placeholder="+33612345678"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1">
                Account SID Twilio
                <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="ml-2 text-emerald-400 hover:underline">→ Console Twilio</a>
              </label>
              <input
                type={showKeys ? "text" : "password"}
                value={settings.twilioSid}
                onChange={(e) => onChange({ ...settings, twilioSid: e.target.value })}
                placeholder="ACxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1">Auth Token Twilio</label>
              <input
                type={showKeys ? "text" : "password"}
                value={settings.twilioToken}
                onChange={(e) => onChange({ ...settings, twilioToken: e.target.value })}
                placeholder="xxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1">Numéro Twilio expéditeur</label>
              <input
                type="text"
                value={settings.twilioFrom}
                onChange={(e) => onChange({ ...settings, twilioFrom: e.target.value })}
                placeholder="+15017122661"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            {(!settings.twilioSid || !settings.twilioToken || !settings.twilioFrom) && (
              <p className="text-[10px] text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Configuration Twilio manquante — les SMS ne seront pas envoyés
              </p>
            )}
            <button
              onClick={() => onTest("sms")}
              disabled={!settings.twilioSid || !settings.twilioToken || !settings.twilioFrom || !settings.smsPhone}
              className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Envoyer un SMS de test
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setShowKeys(!showKeys)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          <Eye className="w-3 h-3" />
          {showKeys ? "Masquer les clés" : "Afficher les clés"}
        </button>
        <p className="text-[10px] text-gray-600">Les clés sont stockées localement dans votre navigateur</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AlertesIA() {
  const [alerts, setAlerts] = useState<AlertRule[]>(loadAlerts);
  const [history, setHistory] = useState<HistoryEntry[]>(MOCK_HISTORY);
  const [allCoins, setAllCoins] = useState<CoinMarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [searchCoin, setSearchCoin] = useState("");
  const [showCoinDropdown, setShowCoinDropdown] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotifSettings>(loadNotifSettings);
  const [toastMsg, setToastMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Form state
  const [formCoin, setFormCoin] = useState<CoinMarketData | null>(null);
  const [formType, setFormType] = useState<AlertType>("price_above");
  const [formTargetPrice, setFormTargetPrice] = useState("");
  const [formPattern, setFormPattern] = useState(PATTERNS[0]);
  const [formChannel, setFormChannel] = useState<NotifChannel>("in-app");
  const [formError, setFormError] = useState("");

  const showToast = (text: string, ok: boolean) => {
    setToastMsg({ text, ok });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch coins
  const fetchCoins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTop200(false);
      setAllCoins(data);
    } catch {
      // keep
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  // Simulate alert triggers
  useEffect(() => {
    if (allCoins.length === 0) return;
    const updated = alerts.map((alert) => {
      if (alert.status !== "active") return alert;
      const coin = allCoins.find((c) => c.id === alert.coinId);
      if (!coin) return alert;
      const price = coin.current_price;
      let triggered = false;
      if (alert.type === "price_above" && alert.targetPrice && price >= alert.targetPrice) triggered = true;
      if (alert.type === "price_below" && alert.targetPrice && price <= alert.targetPrice) triggered = true;
      if (triggered) {
        const newEntry: HistoryEntry = {
          id: `h_${Date.now()}_${alert.id}`,
          coinSymbol: alert.coinSymbol,
          coinImage: alert.coinImage,
          type: alert.type,
          condition: alert.condition,
          triggeredAt: new Date().toLocaleString("fr-FR"),
          price,
          channel: alert.channel,
        };
        setHistory((prev) => [newEntry, ...prev]);
        // Fire notification
        dispatchNotification(notifSettings, alert.channel, alert, price);
        return { ...alert, status: "triggered" as AlertStatus, triggeredAt: new Date().toLocaleString("fr-FR"), currentPrice: price };
      }
      return { ...alert, currentPrice: price };
    });
    setAlerts(updated);
    saveAlerts(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCoins]);

  const filteredCoins = allCoins
    .filter((c) =>
      !searchCoin ||
      c.symbol.toLowerCase().includes(searchCoin.toLowerCase()) ||
      c.name.toLowerCase().includes(searchCoin.toLowerCase())
    )
    .slice(0, 8);

  const handleNotifSettingsChange = (s: NotifSettings) => {
    setNotifSettings(s);
    saveNotifSettings(s);
  };

  const handleTestNotif = async (channel: "email" | "sms") => {
    const testAlert: AlertRule = {
      id: "test",
      coinId: "bitcoin",
      coinSymbol: "BTC",
      coinName: "Bitcoin",
      coinImage: "",
      type: "price_above",
      targetPrice: 70000,
      condition: "Test de notification CryptoIA",
      channel,
      status: "active",
      createdAt: new Date().toLocaleString("fr-FR"),
    };
    if (channel === "email") {
      const res = await sendEmailNotification(notifSettings, "🧪 Test CryptoIA — Notification Email", "Ceci est un email de test envoyé depuis CryptoIA Platform.\n\nSi vous recevez cet email, vos notifications email sont correctement configurées !");
      showToast(res.ok ? "✅ Email de test envoyé !" : `❌ ${res.error}`, res.ok);
    } else {
      const res = await sendSmsNotification(notifSettings, "🧪 CryptoIA Test: Vos notifications SMS sont actives !");
      showToast(res.ok ? "✅ SMS de test envoyé !" : `❌ ${res.error}`, res.ok);
    }
  };

  const handleCreateAlert = () => {
    setFormError("");
    if (!formCoin) { setFormError("Veuillez sélectionner une crypto."); return; }
    if ((formType === "price_above" || formType === "price_below") && !formTargetPrice) {
      setFormError("Veuillez entrer un prix cible."); return;
    }
    const targetPrice = formTargetPrice ? parseFloat(formTargetPrice) : undefined;
    if (targetPrice !== undefined && isNaN(targetPrice)) {
      setFormError("Prix cible invalide."); return;
    }

    // Validate notification channel config
    if ((formChannel === "email" || formChannel === "all") && !notifSettings.sendgridKey) {
      setFormError("Clé SendGrid manquante. Configurez les notifications email d'abord.");
      return;
    }
    if ((formChannel === "sms" || formChannel === "all") && (!notifSettings.twilioSid || !notifSettings.twilioToken)) {
      setFormError("Configuration Twilio manquante. Configurez les notifications SMS d'abord.");
      return;
    }

    const newAlert: AlertRule = {
      id: `alert_${Date.now()}`,
      coinId: formCoin.id,
      coinSymbol: formCoin.symbol.toUpperCase(),
      coinName: formCoin.name,
      coinImage: formCoin.image,
      type: formType,
      targetPrice,
      currentPrice: formCoin.current_price,
      condition: buildConditionLabel(formType, targetPrice, formPattern),
      channel: formChannel,
      status: "active",
      createdAt: new Date().toLocaleString("fr-FR"),
    };

    const updated = [newAlert, ...alerts];
    setAlerts(updated);
    saveAlerts(updated);
    // Reset form
    setFormCoin(null);
    setSearchCoin("");
    setFormType("price_above");
    setFormTargetPrice("");
    setFormPattern(PATTERNS[0]);
    setFormChannel("in-app");
    setShowForm(false);
    showToast("✅ Alerte créée avec succès !", true);
  };

  const handleToggle = (id: string) => {
    const updated = alerts.map((a) =>
      a.id === id
        ? { ...a, status: (a.status === "active" ? "inactive" : "active") as AlertStatus }
        : a
    );
    setAlerts(updated);
    saveAlerts(updated);
  };

  const handleDelete = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    saveAlerts(updated);
  };

  const activeAlerts = alerts.filter((a) => a.status === "active");
  const inactiveAlerts = alerts.filter((a) => a.status === "inactive");
  const triggeredAlerts = alerts.filter((a) => a.status === "triggered");

  const channelLabel = (ch: NotifChannel) => {
    const opt = CHANNEL_OPTIONS.find((o) => o.value === ch);
    return opt ? opt : CHANNEL_OPTIONS[0];
  };

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-bold transition-all ${toastMsg.ok ? "bg-emerald-900/90 border-emerald-500/30 text-emerald-300" : "bg-red-900/90 border-red-500/30 text-red-300"}`}>
          {toastMsg.text}
        </div>
      )}
      <main className="flex-1 md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-6">
          {/* Page Header */}
          <PageHeader
            icon={<Bell className="w-6 h-6" />}
            title="Alertes Intelligentes IA"
            subtitle="Configurez des alertes personnalisées sur vos cryptos favorites. Recevez des notifications en temps réel via l'application, email (SendGrid) ou SMS (Twilio)."
            accentColor="indigo"
            steps={[
              { n: "1", title: "Configurer les notifications", desc: "Cliquez sur '⚙️ Notifications' pour configurer vos clés SendGrid (email) et Twilio (SMS). Vos clés sont stockées localement." },
              { n: "2", title: "Créer une alerte", desc: "Cliquez sur '+ Nouvelle alerte', sélectionnez votre crypto, le type d'alerte et le canal de notification souhaité." },
              { n: "3", title: "Recevoir les notifications", desc: "Dès qu'une condition est remplie, vous êtes notifié via le canal choisi : in-app, email, SMS ou tous les canaux." },
            ]}
          />

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/70 border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{activeAlerts.length}</p>
                <p className="text-xs text-gray-500">Alertes actives</p>
              </div>
            </div>
            <div className="bg-slate-900/70 border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{triggeredAlerts.length}</p>
                <p className="text-xs text-gray-500">Déclenchées</p>
              </div>
            </div>
            <div className="bg-slate-900/70 border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{history.length}</p>
                <p className="text-xs text-gray-500">Dans l'historique</p>
              </div>
            </div>
          </div>

          {/* Top bar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex gap-1 bg-black/30 border border-white/[0.06] rounded-xl p-1">
              <button
                onClick={() => setActiveTab("active")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "active" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-gray-500 hover:text-white"}`}
              >
                Alertes actives ({alerts.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "history" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-gray-500 hover:text-white"}`}
              >
                Historique ({history.length})
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowNotifSettings(!showNotifSettings); setShowForm(false); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${showNotifSettings ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-gray-400 hover:text-white"}`}
              >
                <Settings className="w-4 h-4" />
                Notifications
                {(notifSettings.emailEnabled || notifSettings.smsEnabled) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>
              <button
                onClick={() => { setShowForm(!showForm); setShowNotifSettings(false); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${showForm ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}
              >
                <Plus className="w-4 h-4" />
                Nouvelle alerte
              </button>
            </div>
          </div>

          {/* Notification Settings Panel */}
          {showNotifSettings && (
            <NotifSettingsPanel
              settings={notifSettings}
              onChange={handleNotifSettingsChange}
              onTest={handleTestNotif}
            />
          )}

          {/* Create Form */}
          {showForm && (
            <div className="mb-6 bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Créer une nouvelle alerte</h3>
                </div>
                <button onClick={() => setShowForm(false)} className="text-gray-600 hover:text-gray-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Coin selector */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">Crypto à surveiller</label>
                  <div className="relative">
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] focus-within:border-indigo-500/50">
                      {formCoin && (
                        <img src={formCoin.image} alt={formCoin.symbol} className="w-5 h-5 rounded-full flex-shrink-0" />
                      )}
                      <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <input
                        type="text"
                        value={formCoin ? `${formCoin.symbol.toUpperCase()} — ${formCoin.name}` : searchCoin}
                        onChange={(e) => {
                          setSearchCoin(e.target.value);
                          setFormCoin(null);
                          setShowCoinDropdown(true);
                        }}
                        onFocus={() => setShowCoinDropdown(true)}
                        placeholder="Rechercher BTC, ETH, SOL..."
                        className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                      />
                      {formCoin && (
                        <button onClick={() => { setFormCoin(null); setSearchCoin(""); }} className="text-gray-600 hover:text-red-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {showCoinDropdown && !formCoin && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f172a] border border-white/[0.08] rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                        {loading ? (
                          <div className="p-3 text-xs text-gray-500 text-center">Chargement...</div>
                        ) : filteredCoins.length === 0 ? (
                          <div className="p-3 text-xs text-gray-500 text-center">Aucun résultat</div>
                        ) : (
                          filteredCoins.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setFormCoin(c);
                                setSearchCoin("");
                                setShowCoinDropdown(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.04] transition-all text-left"
                            >
                              <img src={c.image} alt={c.symbol} className="w-6 h-6 rounded-full flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-white">{c.symbol.toUpperCase()}</span>
                                <span className="text-[11px] text-gray-500 ml-1.5">{c.name}</span>
                              </div>
                              <span className="text-xs text-gray-400 font-mono flex-shrink-0">${formatPrice(c.current_price)}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Alert type */}
                <SelectField
                  label="Type d'alerte"
                  value={formType}
                  onChange={(v) => setFormType(v as AlertType)}
                  options={[
                    { value: "price_above", label: "📈 Prix au-dessus de" },
                    { value: "price_below", label: "📉 Prix en-dessous de" },
                    { value: "signal_buy", label: "⚡ Signal IA BUY" },
                    { value: "signal_sell", label: "⚡ Signal IA SELL" },
                    { value: "pattern", label: "📊 Pattern technique" },
                    { value: "whale", label: "🐋 Mouvement Whale" },
                  ]}
                />

                {/* Conditional fields */}
                {(formType === "price_above" || formType === "price_below") && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">
                      Prix cible ($)
                      {formCoin && (
                        <span className="ml-2 text-gray-600 font-normal">
                          Actuel : ${formatPrice(formCoin.current_price)}
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={formTargetPrice}
                      onChange={(e) => setFormTargetPrice(e.target.value)}
                      placeholder="ex: 70000"
                      className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                )}

                {formType === "pattern" && (
                  <SelectField
                    label="Pattern à détecter"
                    value={formPattern}
                    onChange={setFormPattern}
                    options={PATTERNS.map((p) => ({ value: p, label: p }))}
                  />
                )}

                {(formType === "signal_buy" || formType === "signal_sell" || formType === "whale") && (
                  <div className="flex items-end">
                    <div className="w-full p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <p className="text-xs text-indigo-300 font-semibold">
                        {formType === "signal_buy" && "✅ Alerte déclenchée quand l'IA détecte un signal BUY ou STRONG BUY."}
                        {formType === "signal_sell" && "⚠️ Alerte déclenchée quand l'IA détecte un signal SELL ou STRONG SELL."}
                        {formType === "whale" && "🐋 Alerte déclenchée lors d'un mouvement de wallet > 10M$ détecté."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Canal de notification */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">Canal de notification</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CHANNEL_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFormChannel(opt.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-xs font-bold ${formChannel === opt.value ? "bg-indigo-500/20 border-indigo-500/30 text-white" : "bg-black/20 border-white/[0.06] text-gray-500 hover:text-gray-300 hover:border-white/10"}`}
                      >
                        <span className={opt.color}>{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {formChannel !== "in-app" && (
                    <p className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      Assurez-vous d'avoir configuré les clés dans "⚙️ Notifications" ci-dessus
                    </p>
                  )}
                </div>
              </div>

              {formError && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleCreateAlert}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all"
                >
                  ✅ Créer l'alerte
                </button>
                <button
                  onClick={() => { setShowForm(false); setFormError(""); }}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-gray-400 text-sm font-bold transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Active Alerts Tab */}
          {activeTab === "active" && (
            <div>
              {alerts.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/40 border border-white/[0.04] rounded-2xl">
                  <Bell className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold">Aucune alerte configurée</p>
                  <p className="text-xs text-gray-600 mt-1">Cliquez sur "+ Nouvelle alerte" pour commencer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Active */}
                  {activeAlerts.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
                        Actives ({activeAlerts.length})
                      </p>
                      {activeAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} onToggle={handleToggle} onDelete={handleDelete} channelLabel={channelLabel} />)}
                    </div>
                  )}
                  {/* Triggered */}
                  {triggeredAlerts.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-amber-500/70 uppercase tracking-widest mb-2 px-1 mt-4">
                        Déclenchées ({triggeredAlerts.length})
                      </p>
                      {triggeredAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} onToggle={handleToggle} onDelete={handleDelete} channelLabel={channelLabel} />)}
                    </div>
                  )}
                  {/* Inactive */}
                  {inactiveAlerts.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 px-1 mt-4">
                        Désactivées ({inactiveAlerts.length})
                      </p>
                      {inactiveAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} onToggle={handleToggle} onDelete={handleDelete} channelLabel={channelLabel} />)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div>
              {history.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/40 border border-white/[0.04] rounded-2xl">
                  <Clock className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold">Aucun historique</p>
                  <p className="text-xs text-gray-600 mt-1">Les alertes déclenchées apparaîtront ici</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((entry) => {
                    const colors = ALERT_TYPE_COLORS[entry.type];
                    const chOpt = CHANNEL_OPTIONS.find((o) => o.value === entry.channel) || CHANNEL_OPTIONS[0];
                    return (
                      <div key={entry.id} className="flex items-center gap-4 p-4 bg-slate-900/60 border border-white/[0.05] rounded-xl hover:border-white/10 transition-all">
                        <img src={entry.coinImage} alt={entry.coinSymbol} className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-sm font-bold text-white">{entry.coinSymbol}</span>
                            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${colors.bg} ${colors.text} border ${colors.border}`}>
                              {ALERT_TYPE_ICONS[entry.type]}
                              {ALERT_TYPE_LABELS[entry.type]}
                            </span>
                            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 ${chOpt.color}`}>
                              {chOpt.icon}
                              {chOpt.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{entry.condition}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {entry.price && (
                            <p className="text-sm font-bold text-white font-mono">${formatPrice(entry.price)}</p>
                          )}
                          <p className="text-[11px] text-gray-600 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {entry.triggeredAt}
                          </p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({ alert, onToggle, onDelete, channelLabel }: {
  alert: AlertRule;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  channelLabel: (ch: NotifChannel) => typeof CHANNEL_OPTIONS[0];
}) {
  const colors = ALERT_TYPE_COLORS[alert.type];
  const isActive = alert.status === "active";
  const isTriggered = alert.status === "triggered";
  const chOpt = channelLabel(alert.channel);

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isTriggered ? "bg-amber-500/5 border-amber-500/20" : isActive ? "bg-slate-900/60 border-white/[0.06] hover:border-white/10" : "bg-black/20 border-white/[0.03] opacity-60"}`}>
      <img src={alert.coinImage} alt={alert.coinSymbol} className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-bold text-white">{alert.coinSymbol}</span>
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${colors.bg} ${colors.text} border ${colors.border}`}>
            {ALERT_TYPE_ICONS[alert.type]}
            {ALERT_TYPE_LABELS[alert.type]}
          </span>
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 ${chOpt.color}`}>
            {chOpt.icon}
            {chOpt.label}
          </span>
          {isTriggered && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <CheckCircle2 className="w-3 h-3" />
              Déclenchée
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">{alert.condition}</p>
        <div className="flex items-center gap-3 mt-1">
          {alert.currentPrice && (
            <span className="text-[11px] text-gray-600">
              Prix actuel : <span className="text-gray-400 font-mono">${formatPrice(alert.currentPrice)}</span>
            </span>
          )}
          <span className="text-[11px] text-gray-600 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {alert.triggeredAt || alert.createdAt}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onToggle(alert.id)}
          className={`transition-colors ${isActive ? "text-indigo-400 hover:text-indigo-300" : "text-gray-600 hover:text-gray-400"}`}
          title={isActive ? "Désactiver" : "Activer"}
        >
          {isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
        <button
          onClick={() => onDelete(alert.id)}
          className="text-gray-700 hover:text-red-400 transition-colors"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}