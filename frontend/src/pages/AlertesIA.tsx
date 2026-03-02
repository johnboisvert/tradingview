import { useState, useEffect, useCallback } from "react";
import emailjs from "@emailjs/browser";
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
  Settings,
  HelpCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertType = "price_above" | "price_below" | "signal_buy" | "signal_sell" | "pattern" | "whale";
type AlertStatus = "active" | "inactive" | "triggered";
type NotifChannel = "in-app" | "email";

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
  emailjsServiceId: string;
  emailjsTemplateId: string;
  emailjsPublicKey: string;
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

// Alert history is loaded from localStorage — no hardcoded mock data

const STORAGE_KEY = "cryptoia_alertes_ia";
const HISTORY_STORAGE_KEY = "cryptoia_alertes_history";
const NOTIF_SETTINGS_KEY = "cryptoia_notif_settings";

const CHANNEL_OPTIONS: { value: NotifChannel; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "in-app", label: "In-App seulement", icon: <Bell className="w-3.5 h-3.5" />, color: "text-indigo-400" },
  { value: "email", label: "Email", icon: <Mail className="w-3.5 h-3.5" />, color: "text-blue-400" },
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

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: HistoryEntry[]) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function loadNotifSettings(): NotifSettings {
  try {
    const raw = localStorage.getItem(NOTIF_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        emailEnabled: parsed.emailEnabled ?? false,
        emailAddress: parsed.emailAddress ?? "",
        emailjsServiceId: parsed.emailjsServiceId ?? "",
        emailjsTemplateId: parsed.emailjsTemplateId ?? "",
        emailjsPublicKey: parsed.emailjsPublicKey ?? "",
      };
    }
    return {
      emailEnabled: false, emailAddress: "",
      emailjsServiceId: "", emailjsTemplateId: "", emailjsPublicKey: "",
    };
  } catch {
    return {
      emailEnabled: false, emailAddress: "",
      emailjsServiceId: "", emailjsTemplateId: "", emailjsPublicKey: "",
    };
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

async function sendEmailNotification(
  settings: NotifSettings,
  subject: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  if (!settings.emailjsServiceId || !settings.emailjsTemplateId || !settings.emailjsPublicKey) {
    return { ok: false, error: "Configuration EmailJS manquante (Service ID, Template ID ou Public Key)" };
  }
  if (!settings.emailAddress) {
    return { ok: false, error: "Adresse email non configurée" };
  }
  try {
    console.log("[CryptoIA] Envoi email via EmailJS...", {
      serviceId: settings.emailjsServiceId,
      templateId: settings.emailjsTemplateId,
      to: settings.emailAddress,
    });
    const templateParams = {
      to_email: settings.emailAddress,
      subject: subject,
      message: body,
    };
    const result = await emailjs.send(
      settings.emailjsServiceId,
      settings.emailjsTemplateId,
      templateParams,
      settings.emailjsPublicKey
    );
    console.log("[CryptoIA] EmailJS réponse:", result);
    return { ok: true };
  } catch (e: unknown) {
    console.error("[CryptoIA] EmailJS erreur:", e);
    const errMsg = e instanceof Error ? e.message : typeof e === "object" && e !== null && "text" in e ? String((e as { text: string }).text) : String(e);
    return { ok: false, error: `EmailJS erreur: ${errMsg.slice(0, 150)}` };
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

  if (channel === "email" && settings.emailEnabled) {
    await sendEmailNotification(settings, subject, body);
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

// ─── EmailJS Setup Guide ──────────────────────────────────────────────────────

function EmailJSGuide() {
  const [open, setOpen] = useState(false);

  const steps = [
    {
      num: "1",
      title: "Créer un compte gratuit",
      desc: (
        <>
          Rendez-vous sur{" "}
          <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold">
            emailjs.com
          </a>{" "}
          et créez un compte gratuit (200 emails/mois inclus).
        </>
      ),
    },
    {
      num: "2",
      title: "Ajouter un service email",
      desc: (
        <>
          Dans le menu <span className="text-white font-bold">Email Services</span>, cliquez sur{" "}
          <span className="text-white font-bold">Add New Service</span>. Choisissez votre fournisseur (Gmail, Outlook, Yahoo…) et connectez-le.
          Copiez le <span className="text-blue-400 font-bold">Service ID</span> (ex: <code className="bg-black/40 px-1.5 py-0.5 rounded text-blue-300 text-[11px]">service_abc123</code>).
        </>
      ),
    },
    {
      num: "3",
      title: "Créer un template d'email",
      desc: (
        <>
          Dans <span className="text-white font-bold">Email Templates</span>, cliquez sur{" "}
          <span className="text-white font-bold">Create New Template</span>. Utilisez ces variables dans votre template :<br />
          <code className="bg-black/40 px-1.5 py-0.5 rounded text-blue-300 text-[11px]">{"{{to_email}}"}</code> — email du destinataire<br />
          <code className="bg-black/40 px-1.5 py-0.5 rounded text-blue-300 text-[11px]">{"{{subject}}"}</code> — sujet de l'alerte<br />
          <code className="bg-black/40 px-1.5 py-0.5 rounded text-blue-300 text-[11px]">{"{{message}}"}</code> — contenu de l'alerte<br />
          Copiez le <span className="text-blue-400 font-bold">Template ID</span> (ex: <code className="bg-black/40 px-1.5 py-0.5 rounded text-blue-300 text-[11px]">template_xyz789</code>).
        </>
      ),
    },
    {
      num: "4",
      title: "Copier votre Public Key",
      desc: (
        <>
          Allez dans <span className="text-white font-bold">Account → API Keys</span>.
          Copiez votre <span className="text-blue-400 font-bold">Public Key</span> (ex: <code className="bg-black/40 px-1.5 py-0.5 rounded text-blue-300 text-[11px]">aBcDeFgHiJkLmN</code>).
        </>
      ),
    },
  ];

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors font-bold"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        {open ? "Masquer le guide de configuration" : "Comment configurer EmailJS ? (Guide étape par étape)"}
        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {steps.map((step) => (
            <div key={step.num} className="flex gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-black text-blue-400">{step.num}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white mb-0.5">{step.title}</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Notification Settings Panel ─────────────────────────────────────────────

function NotifSettingsPanel({ settings, onChange, onTest, testingEmail }: {
  settings: NotifSettings;
  onChange: (s: NotifSettings) => void;
  onTest: () => void;
  testingEmail: boolean;
}) {
  const [showKeys, setShowKeys] = useState(false);

  const emailConfigured = !!(settings.emailjsServiceId && settings.emailjsTemplateId && settings.emailjsPublicKey);

  return (
    <div className="mb-6 bg-slate-900/80 border border-white/[0.08] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Settings className="w-4 h-4 text-indigo-400" />
        </div>
        <h3 className="text-sm font-bold text-white">Configuration des notifications email</h3>
      </div>

      {/* Email section — EmailJS — full width */}
      <div className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-white">Email via EmailJS</span>
            {emailConfigured && settings.emailEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Configuré" />
            )}
          </div>
          <button
            onClick={() => onChange({ ...settings, emailEnabled: !settings.emailEnabled })}
            className={`w-10 h-5 rounded-full transition-all relative ${settings.emailEnabled ? "bg-blue-500" : "bg-gray-700"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings.emailEnabled ? "left-5" : "left-0.5"}`} />
          </button>
        </div>

        {/* Guide */}
        <EmailJSGuide />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
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
              Service ID
            </label>
            <input
              type="text"
              value={settings.emailjsServiceId}
              onChange={(e) => onChange({ ...settings, emailjsServiceId: e.target.value })}
              placeholder="service_xxxxxxx"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 mb-1">
              Template ID
            </label>
            <input
              type="text"
              value={settings.emailjsTemplateId}
              onChange={(e) => onChange({ ...settings, emailjsTemplateId: e.target.value })}
              placeholder="template_xxxxxxx"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-gray-400 mb-1">
              Public Key
            </label>
            <input
              type={showKeys ? "text" : "password"}
              value={settings.emailjsPublicKey}
              onChange={(e) => onChange({ ...settings, emailjsPublicKey: e.target.value })}
              placeholder="aBcDeFgHiJkLmN"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-mono"
            />
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {!emailConfigured && (
            <p className="text-[10px] text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Configuration EmailJS incomplète — les emails ne seront pas envoyés
            </p>
          )}
          {emailConfigured && (
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              EmailJS configuré correctement
            </p>
          )}
          <button
            onClick={onTest}
            disabled={!emailConfigured || !settings.emailAddress || testingEmail}
            className="w-full py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {testingEmail ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "📧 Envoyer un email de test"
            )}
          </button>
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
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [allCoins, setAllCoins] = useState<CoinMarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [searchCoin, setSearchCoin] = useState("");
  const [showCoinDropdown, setShowCoinDropdown] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotifSettings>(loadNotifSettings);
  const [toastMsg, setToastMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);

  // Form state
  const [formCoin, setFormCoin] = useState<CoinMarketData | null>(null);
  const [formType, setFormType] = useState<AlertType>("price_above");
  const [formTargetPrice, setFormTargetPrice] = useState("");
  const [formPattern, setFormPattern] = useState(PATTERNS[0]);
  const [formChannel, setFormChannel] = useState<NotifChannel>("in-app");
  const [formError, setFormError] = useState("");

  const showToast = (text: string, ok: boolean) => {
    setToastMsg({ text, ok });
    setTimeout(() => setToastMsg(null), 5000);
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
        setHistory((prev) => {
          const updated = [newEntry, ...prev].slice(0, 100); // Keep last 100 entries
          saveHistory(updated);
          return updated;
        });
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

  const handleTestEmail = async () => {
    console.log("[CryptoIA] Test email déclenché avec settings:", {
      serviceId: notifSettings.emailjsServiceId,
      templateId: notifSettings.emailjsTemplateId,
      publicKey: notifSettings.emailjsPublicKey ? "***" + notifSettings.emailjsPublicKey.slice(-4) : "(vide)",
      emailAddress: notifSettings.emailAddress,
    });
    setTestingEmail(true);
    try {
      const res = await sendEmailNotification(
        notifSettings,
        "🧪 Test CryptoIA — Notification Email",
        "Ceci est un email de test envoyé depuis CryptoIA Platform.\n\nSi vous recevez cet email, vos notifications email sont correctement configurées !\n\n— CryptoIA Platform"
      );
      console.log("[CryptoIA] Résultat test email:", res);
      showToast(res.ok ? "✅ Email de test envoyé avec succès ! Vérifiez votre boîte de réception." : `❌ ${res.error}`, res.ok);
    } catch (err) {
      console.error("[CryptoIA] Erreur inattendue test email:", err);
      showToast(`❌ Erreur inattendue: ${String(err).slice(0, 100)}`, false);
    } finally {
      setTestingEmail(false);
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
    if (formChannel === "email" && (!notifSettings.emailjsServiceId || !notifSettings.emailjsTemplateId || !notifSettings.emailjsPublicKey)) {
      setFormError("Configuration EmailJS manquante. Configurez les notifications email d'abord.");
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
            subtitle="Configurez des alertes personnalisées sur vos cryptos favorites. Recevez des notifications en temps réel via l'application ou par email (EmailJS)."
            accentColor="indigo"
            steps={[
              { n: "1", title: "Configurer les notifications", desc: "Cliquez sur '⚙️ Notifications' pour configurer EmailJS. Un guide étape par étape est inclus pour vous aider." },
              { n: "2", title: "Créer une alerte", desc: "Cliquez sur '+ Nouvelle alerte', sélectionnez votre crypto, le type d'alerte et le canal de notification souhaité." },
              { n: "3", title: "Recevoir les notifications", desc: "Dès qu'une condition est remplie, vous êtes notifié via le canal choisi : in-app ou email." },
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
                {notifSettings.emailEnabled && (
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
              onTest={handleTestEmail}
              testingEmail={testingEmail}
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
                  <div className="grid grid-cols-2 gap-2">
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
                  {formChannel === "email" && (
                    <p className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      Assurez-vous d'avoir configuré EmailJS dans "⚙️ Notifications" ci-dessus
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
                  {activeAlerts.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
                        Actives ({activeAlerts.length})
                      </p>
                      {activeAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} onToggle={handleToggle} onDelete={handleDelete} channelLabel={channelLabel} />)}
                    </div>
                  )}
                  {triggeredAlerts.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-amber-500/70 uppercase tracking-widest mb-2 px-1 mt-4">
                        Déclenchées ({triggeredAlerts.length})
                      </p>
                      {triggeredAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} onToggle={handleToggle} onDelete={handleDelete} channelLabel={channelLabel} />)}
                    </div>
                  )}
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