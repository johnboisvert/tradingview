import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Smartphone, Bell, Shield, Zap, CheckCircle, AlertTriangle, ExternalLink, Settings, Wifi, WifiOff } from "lucide-react";
import Footer from "@/components/Footer";

const TELE_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/ed81f7f8-96b1-4d85-b286-6e3ee422e749.png";

const LS_TOKEN_KEY = "telegram_bot_token";
const LS_CHAT_KEY = "telegram_chat_id";
const LS_ALERTS_KEY = "telegram_alerts";

interface AlertSettings {
  priceAlerts: boolean;
  tradeSignals: boolean;
  whaleMovements: boolean;
  fearGreed: boolean;
  dailySummary: boolean;
  portfolioAlerts: boolean;
}

const DEFAULT_ALERTS: AlertSettings = {
  priceAlerts: true,
  tradeSignals: true,
  whaleMovements: false,
  fearGreed: true,
  dailySummary: true,
  portfolioAlerts: false,
};

export default function TelegramSetup() {
  const [botToken, setBotToken] = useState(() => localStorage.getItem(LS_TOKEN_KEY) || "");
  const [chatId, setChatId] = useState(() => localStorage.getItem(LS_CHAT_KEY) || "");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isConnected, setIsConnected] = useState(() => {
    const token = localStorage.getItem(LS_TOKEN_KEY);
    const chat = localStorage.getItem(LS_CHAT_KEY);
    return !!(token && chat);
  });
  const [alerts, setAlerts] = useState<AlertSettings>(() => {
    try {
      const saved = localStorage.getItem(LS_ALERTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_ALERTS;
  });

  // Persist alerts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LS_ALERTS_KEY, JSON.stringify(alerts));
  }, [alerts]);

  const handleTest = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setTestStatus("error");
      setErrorMessage("Veuillez remplir le Bot Token et le Chat ID.");
      setTimeout(() => setTestStatus("idle"), 4000);
      return;
    }
    setTestStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text: "🚀 *CryptoIA* — Test réussi \\!\n\nVotre bot Telegram est correctement configuré\\. Vous recevrez désormais vos alertes crypto ici\\. 🎉\n\n_Envoyé depuis votre plateforme CryptoIA_",
          parse_mode: "MarkdownV2",
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setTestStatus("success");
        // Save credentials to localStorage on success
        localStorage.setItem(LS_TOKEN_KEY, botToken.trim());
        localStorage.setItem(LS_CHAT_KEY, chatId.trim());
        setIsConnected(true);
      } else {
        setTestStatus("error");
        // Extract Telegram error description for user feedback
        const desc = data.description || "Erreur inconnue";
        if (desc.includes("Unauthorized")) {
          setErrorMessage("Token invalide — vérifiez votre Bot Token auprès de @BotFather.");
        } else if (desc.includes("chat not found")) {
          setErrorMessage("Chat ID introuvable — envoyez d'abord un message à votre bot, puis réessayez.");
        } else if (desc.includes("bot was blocked")) {
          setErrorMessage("Le bot a été bloqué par l'utilisateur. Débloquez-le dans Telegram.");
        } else {
          setErrorMessage(`Erreur Telegram : ${desc}`);
        }
      }
    } catch {
      setTestStatus("error");
      setErrorMessage("Impossible de contacter l'API Telegram. Vérifiez votre connexion internet.");
    }

    setTimeout(() => setTestStatus("idle"), 4000);
  };

  const handleDisconnect = () => {
    localStorage.removeItem(LS_TOKEN_KEY);
    localStorage.removeItem(LS_CHAT_KEY);
    setBotToken("");
    setChatId("");
    setIsConnected(false);
    setTestStatus("idle");
    setErrorMessage("");
  };

  const steps = [
    {
      num: "1",
      title: "Créer un Bot Telegram",
      desc: "Ouvrez Telegram et cherchez @BotFather. Envoyez /newbot et suivez les instructions pour créer votre bot.",
      action: "Ouvrir BotFather",
      link: "https://t.me/BotFather",
    },
    {
      num: "2",
      title: "Obtenir le Token",
      desc: "BotFather vous donnera un token API (ex: 123456:ABC-DEF...). Copiez-le et collez-le ci-dessous.",
      action: null,
      link: null,
    },
    {
      num: "3",
      title: "Obtenir votre Chat ID",
      desc: "Envoyez un message à votre bot, puis visitez l'URL ci-dessous pour trouver votre chat_id.",
      action: "Voir le guide",
      link: "https://core.telegram.org/bots/api#getupdates",
    },
    {
      num: "4",
      title: "Tester la connexion",
      desc: "Entrez vos identifiants ci-dessous et cliquez sur 'Tester' pour vérifier que tout fonctionne.",
      action: null,
      link: null,
    },
  ];

  const alertTypes = [
    { key: "priceAlerts" as const, icon: "💰", label: "Alertes de Prix", desc: "Notification quand un prix cible est atteint" },
    { key: "tradeSignals" as const, icon: "📊", label: "Signaux de Trade", desc: "Nouveaux signaux d'achat/vente détectés par l'IA" },
    { key: "whaleMovements" as const, icon: "🐋", label: "Mouvements Baleines", desc: "Transactions > 1M$ détectées sur la blockchain" },
    { key: "fearGreed" as const, icon: "😨", label: "Fear & Greed", desc: "Changements significatifs du sentiment de marché" },
    { key: "dailySummary" as const, icon: "📋", label: "Résumé Quotidien", desc: "Récapitulatif journalier de votre portfolio et du marché" },
    { key: "portfolioAlerts" as const, icon: "📈", label: "Alertes Portfolio", desc: "Variations importantes de votre portfolio (±5%)" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen">
        {/* Header */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={TELE_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/80 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Smartphone className="w-7 h-7 text-blue-400" />
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Configuration Telegram
                </h1>
              </div>
              <p className="text-sm text-gray-400">Recevez vos alertes crypto directement sur Telegram</p>
            </div>
            {/* Connection Status Badge */}
            {isConnected ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400">✅ Connecté</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-500/15 border border-gray-500/30">
                <WifiOff className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-400">Non connecté</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Setup Steps */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" /> Guide de Configuration
            </h2>

            {steps.map((step) => (
              <div key={step.num} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-blue-500/20 transition-all">
                <div className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-lg font-black">
                    {step.num}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm mb-1">{step.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{step.desc}</p>
                    {step.action && step.link && (
                      <a href={step.link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-all">
                        <ExternalLink className="w-3 h-3" /> {step.action}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Config Form */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" /> Vos Identifiants
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 font-semibold mb-1 block">Bot Token</label>
                  <input type="text" value={botToken} onChange={(e) => setBotToken(e.target.value)}
                    placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-semibold mb-1 block">Chat ID</label>
                  <input type="text" value={chatId} onChange={(e) => setChatId(e.target.value)}
                    placeholder="123456789"
                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                </div>

                {/* Test Button */}
                <button onClick={handleTest}
                  disabled={testStatus === "sending"}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    testStatus === "success"
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                      : testStatus === "error"
                      ? "bg-red-500/20 border border-red-500/30 text-red-400"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110"
                  }`}>
                  {testStatus === "sending" && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {testStatus === "success" && <CheckCircle className="w-4 h-4" />}
                  {testStatus === "error" && <AlertTriangle className="w-4 h-4" />}
                  {testStatus === "idle" ? "🔔 Envoyer un Test" : testStatus === "sending" ? "Envoi en cours..." : testStatus === "success" ? "✅ Message envoyé sur Telegram !" : "❌ Échec de l'envoi"}
                </button>

                {/* Error Message Detail */}
                {testStatus === "error" && errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-2">
                    <p className="text-xs text-red-400 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {errorMessage}
                    </p>
                  </div>
                )}

                {/* Disconnect button if connected */}
                {isConnected && (
                  <button onClick={handleDisconnect}
                    className="w-full py-2.5 rounded-xl font-bold text-xs transition-all bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 mt-2">
                    🔌 Déconnecter le bot Telegram
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Alert Configuration */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" /> Types d&apos;Alertes
            </h2>

            {alertTypes.map((alert) => (
              <div key={alert.key}
                className={`bg-white/[0.03] border rounded-xl p-5 transition-all cursor-pointer ${
                  alerts[alert.key] ? "border-blue-500/30 bg-blue-500/[0.03]" : "border-white/[0.06]"
                }`}
                onClick={() => setAlerts((prev) => ({ ...prev, [alert.key]: !prev[alert.key] }))}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{alert.icon}</span>
                    <div>
                      <h3 className="font-bold text-sm">{alert.label}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{alert.desc}</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all relative ${
                    alerts[alert.key] ? "bg-blue-500" : "bg-white/[0.1]"
                  }`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      alerts[alert.key] ? "left-7" : "left-1"
                    }`} />
                  </div>
                </div>
              </div>
            ))}

            {/* Info */}
            <div className="bg-gradient-to-r from-blue-500/[0.06] to-cyan-500/[0.06] border border-blue-500/20 rounded-xl p-5">
              <h3 className="font-bold text-sm text-blue-400 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Conseils Pro
              </h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex gap-2"><span>💡</span> Activez les signaux de trade pour ne manquer aucune opportunité</li>
                <li className="flex gap-2"><span>💡</span> Le résumé quotidien est idéal pour un suivi passif</li>
                <li className="flex gap-2"><span>💡</span> Les alertes baleines peuvent anticiper de gros mouvements</li>
                <li className="flex gap-2"><span>💡</span> Combinez Fear & Greed + signaux pour confirmer vos décisions</li>
              </ul>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}