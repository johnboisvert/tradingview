import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import {
  Send,
  Bell,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  Zap,
  RefreshCw,
  Clock,
  Settings,
  Play,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlertConfig {
  enabled: boolean;
  checkIntervalMs: number;
  alerts: {
    priceChange: { enabled: boolean; threshold: number; coins: string[] };
    rsiExtreme: { enabled: boolean; overbought: number; oversold: number; coins: string[] };
    volumeSpike: { enabled: boolean; multiplier: number; coins: string[] };
  };
  lastCheck: string | null;
  lastAlerts: { type: string; coin: string; [key: string]: unknown }[];
}

const AVAILABLE_COINS = [
  { id: "bitcoin", label: "Bitcoin (BTC)", icon: "₿" },
  { id: "ethereum", label: "Ethereum (ETH)", icon: "Ξ" },
  { id: "solana", label: "Solana (SOL)", icon: "◎" },
  { id: "cardano", label: "Cardano (ADA)", icon: "₳" },
  { id: "xrp", label: "XRP", icon: "✕" },
  { id: "dogecoin", label: "Dogecoin (DOGE)", icon: "Ð" },
  { id: "bnb", label: "BNB", icon: "◆" },
  { id: "avalanche", label: "Avalanche (AVAX)", icon: "▲" },
  { id: "polkadot", label: "Polkadot (DOT)", icon: "●" },
];

const DEFAULT_CONFIG: AlertConfig = {
  enabled: false,
  checkIntervalMs: 300000,
  alerts: {
    priceChange: { enabled: true, threshold: 5, coins: ["bitcoin", "ethereum", "solana"] },
    rsiExtreme: { enabled: true, overbought: 70, oversold: 30, coins: ["bitcoin", "ethereum"] },
    volumeSpike: { enabled: true, multiplier: 3, coins: ["bitcoin", "ethereum", "solana"] },
  },
  lastCheck: null,
  lastAlerts: [],
};

// Determine API base URL
function getApiBase(): string {
  // In production (Railway), use same origin
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "";
  }
  // In dev, server.js runs on port 3001 or same port
  return "";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AlertesTelegram() {
  const [config, setConfig] = useState<AlertConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [checkStatus, setCheckStatus] = useState<"idle" | "checking" | "done">("idle");
  const [checkResult, setCheckResult] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const apiBase = getApiBase();

  const showToast = (text: string, ok: boolean) => {
    setToastMsg({ text, ok });
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Load config from server
  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/telegram/config`);
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Save config to server
  const saveConfig = async (newConfig: AlertConfig) => {
    setConfig(newConfig);
    setSaving(true);
    try {
      await fetch(`${apiBase}/api/telegram/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: newConfig }),
      });
      showToast("✅ Configuration sauvegardée", true);
    } catch {
      showToast("❌ Erreur de sauvegarde", false);
    } finally {
      setSaving(false);
    }
  };

  // Toggle global enable/disable
  const toggleEnabled = async () => {
    const newEnabled = !config.enabled;
    try {
      const res = await fetch(`${apiBase}/api/telegram/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig((prev) => ({ ...prev, enabled: data.enabled }));
        showToast(data.enabled ? "✅ Alertes Telegram activées" : "⏸️ Alertes Telegram désactivées", true);
      }
    } catch {
      showToast("❌ Erreur de connexion au serveur", false);
    }
  };

  // Send test message
  const sendTest = async () => {
    setTestStatus("sending");
    setTestMessage("");
    try {
      const res = await fetch(`${apiBase}/api/telegram/test`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setTestStatus("success");
        setTestMessage("Message test envoyé ! Vérifiez votre groupe Telegram.");
      } else {
        setTestStatus("error");
        setTestMessage(data.message || "Erreur lors de l'envoi");
      }
    } catch {
      setTestStatus("error");
      setTestMessage("Impossible de contacter le serveur. Vérifiez que le serveur est démarré.");
    }
    setTimeout(() => setTestStatus("idle"), 5000);
  };

  // Force check now
  const checkNow = async () => {
    setCheckStatus("checking");
    setCheckResult("");
    try {
      const res = await fetch(`${apiBase}/api/telegram/check-now`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCheckStatus("done");
        if (data.alertsSent > 0) {
          setCheckResult(`✅ ${data.alertsSent} alerte(s) envoyée(s) sur Telegram !`);
        } else {
          setCheckResult("ℹ️ Aucune condition d'alerte remplie actuellement. Les marchés sont calmes.");
        }
        // Reload config to get updated lastCheck
        loadConfig();
      } else {
        setCheckResult(`❌ ${data.message}`);
      }
    } catch {
      setCheckResult("❌ Erreur de connexion au serveur");
    }
    setTimeout(() => setCheckStatus("idle"), 8000);
  };

  // Toggle a coin in an alert category
  const toggleCoin = (category: "priceChange" | "rsiExtreme" | "volumeSpike", coinId: string) => {
    const newConfig = { ...config };
    const coins = [...newConfig.alerts[category].coins];
    const idx = coins.indexOf(coinId);
    if (idx >= 0) {
      coins.splice(idx, 1);
    } else {
      coins.push(coinId);
    }
    newConfig.alerts[category].coins = coins;
    saveConfig(newConfig);
  };

  // Toggle alert category
  const toggleCategory = (category: "priceChange" | "rsiExtreme" | "volumeSpike") => {
    const newConfig = { ...config };
    newConfig.alerts[category].enabled = !newConfig.alerts[category].enabled;
    saveConfig(newConfig);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#030712]">
        <Sidebar />
        <main className="flex-1 md:ml-[260px] pt-14 md:pt-0 bg-[#030712] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </main>
      </div>
    );
  }

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
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
          <PageHeader
            icon={<Send className="w-6 h-6" />}
            title="Alertes Telegram"
            subtitle="Recevez des alertes crypto automatiques sur Telegram basées sur des données RÉELLES de Binance et CoinGecko. Chaque alerte est vérifiée en temps réel — aucune fausse donnée."
            accentColor="blue"
            steps={[
              { n: "1", title: "Testez la connexion", desc: "Cliquez sur 'Tester la connexion' pour vérifier que le bot Telegram fonctionne correctement." },
              { n: "2", title: "Configurez vos alertes", desc: "Activez les types d'alertes souhaités et personnalisez les seuils et les cryptos à surveiller." },
              { n: "3", title: "Activez le système", desc: "Activez les alertes automatiques. Le serveur vérifie les conditions toutes les 5 minutes." },
            ]}
          />

          {/* ── Connection Status & Test ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Status Card */}
            <div className="bg-slate-900/70 border border-white/[0.07] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  {config.enabled ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                      <Wifi className="w-5 h-5 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gray-500/15 border border-gray-500/25 flex items-center justify-center">
                      <WifiOff className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white">Système d&apos;Alertes</h3>
                    <p className={`text-xs font-semibold ${config.enabled ? "text-emerald-400" : "text-gray-500"}`}>
                      {config.enabled ? "✅ Actif — Vérification toutes les 5 min" : "⏸️ Désactivé"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleEnabled}
                  className="transition-colors"
                  title={config.enabled ? "Désactiver" : "Activer"}
                >
                  {config.enabled ? (
                    <ToggleRight className="w-10 h-10 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-600" />
                  )}
                </button>
              </div>

              {config.lastCheck && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-black/20 border border-white/[0.05] mb-4">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-400">
                    Dernière vérification : <span className="text-gray-300 font-semibold">{new Date(config.lastCheck).toLocaleString("fr-FR")}</span>
                  </span>
                </div>
              )}

              {config.lastAlerts && config.lastAlerts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Dernières alertes envoyées :</p>
                  {config.lastAlerts.slice(0, 5).map((alert, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-xs text-gray-300">
                        <span className="font-bold text-white">{alert.coin?.toUpperCase()}</span> — {alert.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test & Manual Check */}
            <div className="bg-slate-900/70 border border-white/[0.07] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" /> Actions
              </h3>

              {/* Test Connection */}
              <button
                onClick={sendTest}
                disabled={testStatus === "sending"}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mb-3 ${
                  testStatus === "success"
                    ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                    : testStatus === "error"
                    ? "bg-red-500/20 border border-red-500/30 text-red-400"
                    : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 text-white"
                }`}
              >
                {testStatus === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
                {testStatus === "success" && <CheckCircle className="w-4 h-4" />}
                {testStatus === "error" && <AlertTriangle className="w-4 h-4" />}
                {testStatus === "idle" ? "🔔 Tester la connexion Telegram" : testStatus === "sending" ? "Envoi en cours..." : testStatus === "success" ? "✅ Test réussi !" : "❌ Échec"}
              </button>

              {testMessage && (
                <div className={`p-3 rounded-xl mb-3 text-xs ${testStatus === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                  {testMessage}
                </div>
              )}

              {/* Force Check */}
              <button
                onClick={checkNow}
                disabled={checkStatus === "checking" || !config.enabled}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed mb-3"
              >
                {checkStatus === "checking" ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Vérification en cours...</>
                ) : (
                  <><Play className="w-4 h-4" /> Vérifier maintenant</>
                )}
              </button>

              {checkResult && (
                <div className="p-3 rounded-xl text-xs bg-slate-800/50 border border-white/[0.05] text-gray-300">
                  {checkResult}
                </div>
              )}

              {!config.enabled && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 mt-3">
                  ⚠️ Activez le système d&apos;alertes pour pouvoir vérifier manuellement ou recevoir des alertes automatiques.
                </div>
              )}
            </div>
          </div>

          {/* ── Alert Configuration ── */}
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" /> Configuration des Alertes
            </h2>

            {/* Price Change Alert */}
            <AlertCategoryCard
              icon={<TrendingUp className="w-5 h-5" />}
              iconColor="text-emerald-400"
              iconBg="bg-emerald-500/15 border-emerald-500/25"
              title="Alertes de Variation de Prix"
              description="Notification quand une crypto varie de plus de X% en 24h. Données réelles CoinGecko."
              enabled={config.alerts.priceChange.enabled}
              onToggle={() => toggleCategory("priceChange")}
              coins={config.alerts.priceChange.coins}
              onToggleCoin={(coinId) => toggleCoin("priceChange", coinId)}
            >
              <div className="mt-4">
                <label className="text-xs text-gray-400 font-bold mb-2 block">Seuil de variation (%)</label>
                <div className="flex items-center gap-3">
                  {[3, 5, 7, 10, 15].map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        const newConfig = { ...config };
                        newConfig.alerts.priceChange.threshold = v;
                        saveConfig(newConfig);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        config.alerts.priceChange.threshold === v
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-black/20 text-gray-500 border border-white/[0.06] hover:text-gray-300"
                      }`}
                    >
                      ±{v}%
                    </button>
                  ))}
                </div>
              </div>
            </AlertCategoryCard>

            {/* RSI Extreme Alert */}
            <AlertCategoryCard
              icon={<Activity className="w-5 h-5" />}
              iconColor="text-purple-400"
              iconBg="bg-purple-500/15 border-purple-500/25"
              title="Alertes RSI Extrême"
              description="Notification quand le RSI(14) atteint des niveaux de surachat ou survente. Données réelles Binance (4h)."
              enabled={config.alerts.rsiExtreme.enabled}
              onToggle={() => toggleCategory("rsiExtreme")}
              coins={config.alerts.rsiExtreme.coins}
              onToggleCoin={(coinId) => toggleCoin("rsiExtreme", coinId)}
            >
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold mb-2 block">
                    Surachat (Overbought) <span className="text-red-400">≥</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[65, 70, 75, 80].map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          const newConfig = { ...config };
                          newConfig.alerts.rsiExtreme.overbought = v;
                          saveConfig(newConfig);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          config.alerts.rsiExtreme.overbought === v
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-black/20 text-gray-500 border border-white/[0.06] hover:text-gray-300"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold mb-2 block">
                    Survente (Oversold) <span className="text-emerald-400">≤</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[20, 25, 30, 35].map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          const newConfig = { ...config };
                          newConfig.alerts.rsiExtreme.oversold = v;
                          saveConfig(newConfig);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          config.alerts.rsiExtreme.oversold === v
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-black/20 text-gray-500 border border-white/[0.06] hover:text-gray-300"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </AlertCategoryCard>

            {/* Volume Spike Alert */}
            <AlertCategoryCard
              icon={<BarChart2 className="w-5 h-5" />}
              iconColor="text-cyan-400"
              iconBg="bg-cyan-500/15 border-cyan-500/25"
              title="Alertes Pic de Volume"
              description="Notification quand le volume horaire dépasse X fois la moyenne. Données réelles Binance (1h)."
              enabled={config.alerts.volumeSpike.enabled}
              onToggle={() => toggleCategory("volumeSpike")}
              coins={config.alerts.volumeSpike.coins}
              onToggleCoin={(coinId) => toggleCoin("volumeSpike", coinId)}
            >
              <div className="mt-4">
                <label className="text-xs text-gray-400 font-bold mb-2 block">Multiplicateur de volume</label>
                <div className="flex items-center gap-3">
                  {[2, 3, 5, 7, 10].map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        const newConfig = { ...config };
                        newConfig.alerts.volumeSpike.multiplier = v;
                        saveConfig(newConfig);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        config.alerts.volumeSpike.multiplier === v
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          : "bg-black/20 text-gray-500 border border-white/[0.06] hover:text-gray-300"
                      }`}
                    >
                      {v}x
                    </button>
                  ))}
                </div>
              </div>
            </AlertCategoryCard>
          </div>

          {/* ── Disclaimer ── */}
          <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-2xl p-6 text-center mt-6">
            <p className="text-sm text-amber-300/80">
              ⚠️ <strong>Avertissement :</strong> Toutes les alertes sont basées sur des données réelles de Binance et CoinGecko.
              Ceci ne constitue pas un conseil financier. Les alertes sont informatives uniquement.
              Faites toujours vos propres recherches (DYOR) avant de prendre des décisions d&apos;investissement.
            </p>
          </div>

          {/* ── How it works ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { icon: "📡", title: "Données Réelles", desc: "Toutes les alertes utilisent les API Binance (klines) et CoinGecko (prix). Aucune donnée simulée.", color: "border-l-emerald-500" },
              { icon: "⏰", title: "Vérification Automatique", desc: "Le serveur vérifie les conditions d'alerte toutes les 5 minutes. Les messages sont envoyés instantanément.", color: "border-l-blue-500" },
              { icon: "🔒", title: "Honnêteté", desc: "Chaque alerte inclut un disclaimer. Nous ne promettons jamais de gains. Les données parlent d'elles-mêmes.", color: "border-l-amber-500" },
            ].map((item) => (
              <div key={item.title} className={`bg-slate-900/50 border border-white/5 ${item.color} border-l-4 rounded-2xl p-6`}>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">{item.icon} {item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {saving && (
            <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-gray-300">
              <Loader2 className="w-3 h-3 animate-spin" /> Sauvegarde...
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}

// ─── Alert Category Card ──────────────────────────────────────────────────────

function AlertCategoryCard({
  icon,
  iconColor,
  iconBg,
  title,
  description,
  enabled,
  onToggle,
  coins,
  onToggleCoin,
  children,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  coins: string[];
  onToggleCoin: (coinId: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={`bg-slate-900/60 border rounded-2xl p-6 transition-all ${enabled ? "border-white/[0.08]" : "border-white/[0.04] opacity-60"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${iconBg} ${iconColor}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
        <button onClick={onToggle} className="transition-colors" title={enabled ? "Désactiver" : "Activer"}>
          {enabled ? (
            <ToggleRight className="w-8 h-8 text-emerald-400" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-gray-600" />
          )}
        </button>
      </div>

      {enabled && (
        <>
          <div>
            <p className="text-xs text-gray-400 font-bold mb-2">Cryptos surveillées :</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COINS.map((coin) => {
                const isSelected = coins.includes(coin.id);
                return (
                  <button
                    key={coin.id}
                    onClick={() => onToggleCoin(coin.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        : "bg-black/20 text-gray-600 border border-white/[0.06] hover:text-gray-400"
                    }`}
                  >
                    <span>{coin.icon}</span>
                    {coin.label}
                  </button>
                );
              })}
            </div>
          </div>
          {children}
        </>
      )}
    </div>
  );
}