import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import Sidebar from "@/components/Sidebar";
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface PortfolioAsset {
  symbol: string;
  name: string;
  color: string;
  amount: number;
  price: number;
  weekChange: number;
  allocation: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "cryptoia_assistant_history";

// SECURITY: API key is kept server-side only.
// Frontend ALWAYS calls /api/ai-chat which proxies to Gemini via Vite middleware (dev) or Express server (prod).
// The API key is NEVER exposed to the browser.

const PORTFOLIO: PortfolioAsset[] = [
  { symbol: "BTC",  name: "Bitcoin",   color: "#F7931A", amount: 0.42,  price: 67420, weekChange: +3.8,  allocation: 38 },
  { symbol: "ETH",  name: "Ethereum",  color: "#627EEA", amount: 3.15,  price: 3580,  weekChange: +5.2,  allocation: 26 },
  { symbol: "SOL",  name: "Solana",    color: "#9945FF", amount: 18.5,  price: 162,   weekChange: +11.4, allocation: 16 },
  { symbol: "AVAX", name: "Avalanche", color: "#E84142", amount: 42,    price: 38,    weekChange: -2.1,  allocation: 9  },
  { symbol: "LINK", name: "Chainlink", color: "#375BD2", amount: 95,    price: 15.8,  weekChange: +4.7,  allocation: 8  },
  { symbol: "ARB",  name: "Arbitrum",  color: "#28A0F0", amount: 250,   price: 1.21,  weekChange: +8.3,  allocation: 3  },
];

const TOTAL_VALUE = PORTFOLIO.reduce((s, a) => s + a.amount * a.price, 0);
const WEEK_RETURN = +((PORTFOLIO.reduce((s, a) => s + a.amount * a.price * (a.weekChange / 100), 0) / TOTAL_VALUE) * 100).toFixed(2);

const SUGGESTIONS = [
  { label: "Dois-je vendre mon BTC ?",             icon: "🤔" },
  { label: "Quelle crypto acheter cette semaine ?", icon: "🎯" },
  { label: "Quel est le sentiment du marché ?",     icon: "📊" },
  { label: "Analyse mon portfolio",                 icon: "💼" },
  { label: "Quels sont les risques actuels ?",      icon: "⚠️" },
  { label: "Explique la stratégie DCA",             icon: "📈" },
  { label: "Meilleurs altcoins à surveiller",       icon: "🔭" },
  { label: "Comment lire le RSI et MACD ?",         icon: "📉" },
];

const SYSTEM_PROMPT = `Tu es CryptoIA Assistant, un expert en crypto-monnaies et trading. Tu réponds TOUJOURS en français.

Portfolio de l'utilisateur :
${PORTFOLIO.map(a => `- ${a.symbol} (${a.name}) : ${a.amount} unités @ $${a.price.toLocaleString()} = $${(a.amount * a.price).toLocaleString()} (${a.weekChange >= 0 ? "+" : ""}${a.weekChange}% cette semaine, ${a.allocation}% du portfolio)`).join("\n")}
Valeur totale du portfolio : $${TOTAL_VALUE.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
Performance hebdomadaire : ${WEEK_RETURN >= 0 ? "+" : ""}${WEEK_RETURN}%

Tes domaines d'expertise :
- Analyse technique (RSI, MACD, Bollinger, Fibonacci, supports/résistances)
- Analyse fondamentale des crypto-monnaies
- Stratégies de trading (DCA, swing trading, scalping, position trading)
- DeFi (yield farming, staking, liquidity pools, protocoles)
- Sécurité crypto (wallets, seed phrases, bonnes pratiques)
- NFTs, tokenomics, cycles de marché

Règles :
1. Réponds toujours en français
2. Sois précis, informatif et pédagogique
3. Utilise des emojis pour rendre tes réponses visuelles (📊📈💡🔐💎🪙)
4. Ajoute toujours un avertissement : "⚠️ Ceci n'est pas un conseil financier. Faites vos propres recherches (DYOR)."
5. Structure tes réponses avec des titres en gras et des listes à puces
6. Quand l'utilisateur parle de son portfolio, utilise les données ci-dessus
7. Donne des données et chiffres concrets quand possible
8. Mentionne les risques associés à chaque stratégie ou investissement`;

// ─── Fallback AI responses (when API is unavailable) ─────────────────────────

function getFallbackResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("btc") || q.includes("bitcoin") || q.includes("vendre")) {
    return `**🤖 Analyse Bitcoin (BTC)**\n\nVotre position BTC actuelle :\n• **0.42 BTC** @ $67,420 = **$28,316**\n• Performance hebdomadaire : **+3.8%** 📈\n• Allocation portfolio : **38%**\n\n**📊 Analyse technique :**\n• Le BTC est dans une tendance haussière à moyen terme\n• Support clé : $60,000 — Résistance : $72,000\n• RSI (14) : ~58 — Zone neutre, pas de surachat\n• MACD : Signal haussier en cours\n\n**💡 Points à considérer avant de vendre :**\n• Votre position représente 38% du portfolio — une diversification pourrait être envisagée\n• Le cycle halving 2024 est historiquement favorable\n• Définissez un objectif de prix cible avant de décider\n\n**🎯 Stratégie suggérée :**\n• Si objectif atteint : vente partielle (25-50%) pour sécuriser les gains\n• Conserver le reste en position long terme\n• Utiliser un stop-loss à -15% pour protéger le capital\n\n⚠️ Ceci n'est pas un conseil financier. Faites vos propres recherches (DYOR).`;
  }

  if (q.includes("portfolio") || q.includes("portefeuille") || q.includes("analyse")) {
    return `**💼 Analyse de votre Portfolio**\n\n**📊 Résumé :**\n• Valeur totale : **$${TOTAL_VALUE.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}**\n• Performance hebdomadaire : **${WEEK_RETURN >= 0 ? "+" : ""}${WEEK_RETURN}%** ${WEEK_RETURN >= 0 ? "📈" : "📉"}\n\n**🏆 Meilleures performances cette semaine :**\n${PORTFOLIO.filter(a => a.weekChange > 0).sort((a, b) => b.weekChange - a.weekChange).map(a => `• **${a.symbol}** : +${a.weekChange}%`).join("\n")}\n\n**📉 Performances négatives :**\n${PORTFOLIO.filter(a => a.weekChange < 0).map(a => `• **${a.symbol}** : ${a.weekChange}%`).join("\n") || "• Aucune cette semaine 🎉"}\n\n**⚖️ Analyse de la diversification :**\n• BTC (38%) + ETH (26%) = 64% en large caps — bonne stabilité\n• SOL (16%) — exposition mid-cap avec fort potentiel\n• AVAX, LINK, ARB (20%) — diversification DeFi/L2\n\n**💡 Recommandations :**\n• Portfolio bien diversifié avec un bon équilibre risque/rendement\n• Considérer un rééquilibrage si BTC dépasse 45% d'allocation\n• SOL montre une forte dynamique (+11.4%) — surveiller les niveaux\n\n⚠️ Ceci n'est pas un conseil financier. Faites vos propres recherches (DYOR).`;
  }

  if (q.includes("dca") || q.includes("stratégie") || q.includes("strategie")) {
    return `**📈 Stratégie DCA (Dollar Cost Averaging)**\n\n**🎯 Qu'est-ce que le DCA ?**\nLe DCA consiste à investir un montant fixe à intervalles réguliers, indépendamment du prix du marché.\n\n**✅ Avantages :**\n• Réduit l'impact de la volatilité\n• Élimine le stress du "market timing"\n• Discipline d'investissement automatique\n• Idéal pour les investisseurs long terme\n\n**📊 Exemple pratique avec BTC :**\n• Investissement : $200/semaine\n• Sur 1 an : $10,400 investi\n• Moyenne d'achat lissée sur les hauts et les bas\n• Historiquement profitable sur 4+ ans\n\n**⚙️ Comment appliquer le DCA :**\n1. Choisir un montant fixe (ex: $100-500/mois)\n2. Définir une fréquence (hebdomadaire recommandé)\n3. Sélectionner des actifs de qualité (BTC, ETH en priorité)\n4. Utiliser un exchange avec achats automatiques\n5. Ne pas regarder le prix quotidiennement\n\n**💡 DCA vs Lump Sum :**\n• DCA : moins de risque, rendements légèrement inférieurs en bull market\n• Lump Sum : meilleur en tendance haussière claire\n\n⚠️ Ceci n'est pas un conseil financier. Faites vos propres recherches (DYOR).`;
  }

  if (q.includes("rsi") || q.includes("macd") || q.includes("indicateur") || q.includes("technique")) {
    return `**📉 Guide des Indicateurs Techniques**\n\n**📊 RSI (Relative Strength Index)**\n• Mesure la force d'une tendance (0-100)\n• **< 30** : Zone de survente → Signal d'achat potentiel\n• **> 70** : Zone de surachat → Signal de vente potentiel\n• **50** : Zone neutre\n• Période standard : 14 jours\n\n**📈 MACD (Moving Average Convergence Divergence)**\n• Composé de : Ligne MACD, Signal, Histogramme\n• **Croisement haussier** : MACD passe au-dessus du signal → BUY\n• **Croisement baissier** : MACD passe en-dessous → SELL\n• **Divergence** : Prix monte mais MACD baisse = signal de retournement\n\n**🎯 Bollinger Bands**\n• 3 lignes : Moyenne mobile + 2 écarts-types\n• Prix touche la bande inférieure → potentiel rebond\n• Prix touche la bande supérieure → potentiel retournement\n• Bandes qui se resserrent = forte volatilité à venir\n\n**💡 Combinaison efficace :**\n• RSI < 30 + MACD croisement haussier + Prix sur support = Signal fort\n• Toujours confirmer avec plusieurs indicateurs\n• Ne jamais trader sur un seul signal\n\n⚠️ Ceci n'est pas un conseil financier. Faites vos propres recherches (DYOR).`;
  }

  if (q.includes("altcoin") || q.includes("surveiller") || q.includes("acheter")) {
    return `**🔭 Altcoins à Surveiller**\n\n**🏆 Top picks actuels :**\n\n**1. Solana (SOL) 🟣**\n• Écosystème DeFi/NFT en forte croissance\n• Performances réseau supérieures à ETH\n• Vous avez déjà 16% d'exposition — bonne position\n\n**2. Arbitrum (ARB) 🔵**\n• Layer 2 Ethereum dominant\n• TVL en hausse constante\n• Vous avez 3% — potentiel d'augmentation\n\n**3. Chainlink (LINK) 🔷**\n• Infrastructure critique pour les smart contracts\n• Adoption institutionnelle croissante\n• Vous avez 8% — position solide\n\n**📊 Secteurs porteurs :**\n• **Layer 2** (ARB, OP, BASE) — scalabilité Ethereum\n• **DeFi** (AAVE, UNI, CRV) — finance décentralisée\n• **AI + Crypto** (FET, OCEAN, RNDR) — convergence IA/blockchain\n• **RWA** (tokenisation d'actifs réels) — tendance 2024-2025\n\n**⚠️ Risques à considérer :**\n• Liquidité plus faible que BTC/ETH\n• Volatilité élevée (+/-30% en quelques jours)\n• Toujours limiter les altcoins à 20-30% du portfolio\n\n⚠️ Ceci n'est pas un conseil financier. Faites vos propres recherches (DYOR).`;
  }

  if (q.includes("risque") || q.includes("sentiment") || q.includes("marché") || q.includes("marche")) {
    return `**⚠️ Analyse des Risques & Sentiment du Marché**\n\n**📊 Sentiment actuel :**\n• Fear & Greed Index : ~65/100 — **Avidité** 📈\n• Dominance BTC : ~52% — Marché sain\n• Volume 24h : Élevé — Bonne liquidité\n\n**🔴 Risques principaux :**\n\n**1. Risque réglementaire**\n• Décisions SEC/CFTC aux USA\n• Réglementation MiCA en Europe\n• Impact potentiel sur les exchanges centralisés\n\n**2. Risque macro-économique**\n• Taux d'intérêt de la Fed\n• Inflation et politique monétaire\n• Corrélation croissante avec les marchés traditionnels\n\n**3. Risque technique**\n• Hacks de protocoles DeFi\n• Bugs de smart contracts\n• Attaques 51% sur petites blockchains\n\n**4. Risque de liquidité**\n• Altcoins avec faible volume\n• Spreads élevés en période de stress\n\n**🛡️ Gestion du risque :**\n• Ne jamais investir plus que ce qu'on peut perdre\n• Diversifier entre large caps et mid caps\n• Utiliser des stop-loss systématiques\n• Garder 10-20% en stablecoins pour opportunités\n\n⚠️ Ceci n'est pas un conseil financier. Faites vos propres recherches (DYOR).`;
  }

  // Generic response
  return `**🤖 CryptoIA Assistant**\n\nMerci pour votre question ! Je suis en mode hors-ligne actuellement (l'API IA est temporairement indisponible), mais voici ce que je peux vous dire :\n\n**📊 État de votre portfolio :**\n• Valeur totale : **$${TOTAL_VALUE.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}**\n• Performance hebdomadaire : **${WEEK_RETURN >= 0 ? "+" : ""}${WEEK_RETURN}%** ${WEEK_RETURN >= 0 ? "📈" : "📉"}\n• Actifs : ${PORTFOLIO.length} cryptomonnaies\n\n**💡 Suggestions :**\nPour une réponse plus précise à votre question, essayez :\n• De reformuler avec des mots-clés spécifiques (BTC, portfolio, DCA, RSI, risques)\n• De cliquer sur une suggestion prédéfinie dans le panneau gauche\n• De réessayer dans quelques instants si l'API est temporairement surchargée\n\n**🔄 Sujets disponibles en mode hors-ligne :**\n• Analyse Bitcoin/portfolio\n• Stratégie DCA\n• Indicateurs RSI/MACD\n• Altcoins à surveiller\n• Analyse des risques\n\n⚠️ Ceci n'est pas un conseil financier. Faites vos propres recherches (DYOR).`;
}

// ─── Gemini API ───────────────────────────────────────────────────────────────

async function callGeminiAPI(messages: Message[]): Promise<string> {
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  contents.unshift({ role: "user", parts: [{ text: SYSTEM_PROMPT }] });
  contents.splice(1, 0, {
    role: "model",
    parts: [{ text: "Compris ! Je suis CryptoIA Assistant avec accès au portfolio de l'utilisateur. Prêt à aider ! 🚀" }],
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    // Always use the backend proxy — API key stays server-side
    const proxyRes = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ contents }),
    });
    clearTimeout(timeout);

    if (!proxyRes.ok) {
      const errData = await proxyRes.json().catch(() => ({}));
      console.warn("Gemini proxy error:", proxyRes.status, errData);
      throw new Error(`PROXY_ERROR:${proxyRes.status}`);
    }

    const data = await proxyRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.text;
    if (!text) throw new Error("EMPTY_RESPONSE");
    return text;
  } catch (err: unknown) {
    clearTimeout(timeout);
    throw err;
  }
}

// ─── Render markdown-like content ────────────────────────────────────────────

// Sanitize HTML to prevent XSS attacks from AI-generated content
function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["strong", "em", "code", "br", "span"],
    ALLOWED_ATTR: ["class"],
  });
}

function renderContent(content: string) {
  return content.split("\n").map((line, i) => {
    let processed = line;
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em class="text-gray-400 italic">$1</em>');
    processed = processed.replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-cyan-300 text-xs">$1</code>');

    // Sanitize all HTML before rendering
    const sanitized = sanitizeHTML(processed);

    if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
      return <p key={i} className="ml-2 my-0.5 text-sm" dangerouslySetInnerHTML={{ __html: sanitized }} />;
    }
    if (/^\d+\./.test(line.trim())) {
      return <p key={i} className="ml-2 my-0.5 text-sm" dangerouslySetInnerHTML={{ __html: sanitized }} />;
    }
    if (line.trim() === "") return <br key={i} />;
    return <p key={i} className="my-0.5 text-sm" dangerouslySetInnerHTML={{ __html: sanitized }} />;
  });
}

// ─── Portfolio Panel ──────────────────────────────────────────────────────────

function PortfolioPanel() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-slate-900/60 border border-white/[0.07] rounded-2xl overflow-hidden flex-shrink-0">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-all"
      >
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-black text-white uppercase tracking-widest">Mon Portfolio</span>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-black/20 border border-white/[0.04] text-center">
              <p className="text-[10px] text-gray-500 mb-0.5">Valeur totale</p>
              <p className="text-sm font-black text-white">${TOTAL_VALUE.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}</p>
            </div>
            <div className={`p-2.5 rounded-xl border text-center ${WEEK_RETURN >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
              <p className="text-[10px] text-gray-500 mb-0.5">Cette semaine</p>
              <p className={`text-sm font-black ${WEEK_RETURN >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {WEEK_RETURN >= 0 ? "+" : ""}{WEEK_RETURN}%
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            {PORTFOLIO.map((asset) => (
              <div key={asset.symbol} className="flex items-center gap-2 p-2 rounded-lg bg-black/20 hover:bg-white/[0.02] transition-all">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: asset.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{asset.symbol}</span>
                    <span className={`text-[10px] font-bold ${asset.weekChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {asset.weekChange >= 0 ? "+" : ""}{asset.weekChange}%
                    </span>
                  </div>
                  <div className="w-full h-0.5 bg-white/[0.05] rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${asset.allocation}%`, backgroundColor: asset.color, opacity: 0.7 }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-400 font-bold">{asset.allocation}%</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
            <div className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[10px] font-bold">{PORTFOLIO.filter((a) => a.weekChange >= 0).length} en hausse</span>
            </div>
            <div className="flex items-center gap-1 text-red-400">
              <TrendingDown className="w-3 h-3" />
              <span className="text-[10px] font-bold">{PORTFOLIO.filter((a) => a.weekChange < 0).length} en baisse</span>
            </div>
            <div className="flex items-center gap-1 text-indigo-400">
              <BarChart2 className="w-3 h-3" />
              <span className="text-[10px] font-bold">{PORTFOLIO.length} actifs</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIAssistant() {
  const { t } = useTranslation();
  const loadHistory = (): Message[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [WELCOME_MESSAGE];
  };

  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [apiStatus, setApiStatus] = useState<"online" | "offline" | "unknown">("unknown");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.some((m) => m.role === "user")) setShowSuggestions(false);
  }, [messages]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isTyping) return;

      const userMsg: Message = { role: "user", content, timestamp: Date.now() };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsTyping(true);
      setShowSuggestions(false);

      try {
        const response = await callGeminiAPI(updatedMessages);
        setApiStatus("online");
        setMessages((prev) => [...prev, { role: "assistant", content: response, timestamp: Date.now() }]);
      } catch (error: any) {
        console.warn("AI API unavailable, using fallback:", error?.message);
        setApiStatus("offline");
        // Use smart fallback instead of error message
        const fallback = getFallbackResponse(content);
        setMessages((prev) => [...prev, { role: "assistant", content: fallback, timestamp: Date.now() }]);
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, messages]
  );

  const clearChat = () => {
    const fresh: Message[] = [{ ...WELCOME_MESSAGE, timestamp: Date.now() }];
    setMessages(fresh);
    setShowSuggestions(true);
    setApiStatus("unknown");
    localStorage.removeItem(STORAGE_KEY);
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6">
          <PageHeader
            icon={<Bot className="w-6 h-6" />}
            title={t("pages.aIAssistant.title")}
            subtitle={t("pages.aIAssistant.subtitle")}
            accentColor="purple"
            steps={[
              { n: "1", title: "Posez votre question ou choisissez une suggestion", desc: "Tapez votre question ou cliquez sur une suggestion prédéfinie. L'IA comprend le contexte de votre portfolio et du marché actuel." },
              { n: "2", title: "L'IA analyse votre portfolio et le marché", desc: "Google Gemini AI analyse votre question en tenant compte de vos positions actuelles, des tendances du marché et des indicateurs techniques." },
              { n: "3", title: "Recevez des conseils personnalisés", desc: "Obtenez des réponses détaillées et personnalisées. Posez des questions de suivi — l'IA garde le contexte de toute la conversation." },
            ]}
          />

          {/* API Status Banner */}
          {apiStatus === "offline" && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-400">Mode hors-ligne actif</p>
                <p className="text-[10px] text-amber-400/70">L'API Gemini est temporairement indisponible. Les réponses sont générées localement avec les données de votre portfolio.</p>
              </div>
              <AlertCircle className="w-4 h-4 text-amber-400/50 flex-shrink-0" />
            </div>
          )}
          {apiStatus === "online" && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-xs font-bold text-emerald-400">Connecté à Google Gemini AI ✓</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
            {/* ── Left: Portfolio + Suggestions ── */}
            <div className="space-y-4">
              <PortfolioPanel />

              <div className="bg-slate-900/60 border border-white/[0.07] rounded-2xl p-4">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Questions suggérées
                </p>
                <div className="space-y-1.5">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s.label)}
                      disabled={isTyping}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 hover:bg-indigo-500/10 border border-white/[0.04] hover:border-indigo-500/25 text-left transition-all disabled:opacity-50 group"
                    >
                      <span className="text-base leading-none">{s.icon}</span>
                      <span className="text-xs text-gray-400 group-hover:text-white transition-colors font-medium leading-tight">
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={clearChat}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 text-xs font-bold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Effacer l'historique
              </button>
            </div>

            {/* ── Right: Chat ── */}
            <div className="flex flex-col bg-slate-900/40 border border-white/[0.07] rounded-2xl overflow-hidden" style={{ minHeight: "600px", maxHeight: "calc(100vh - 280px)" }}>
              {/* Chat header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-black/20 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${apiStatus === "offline" ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-black text-white">CryptoIA Assistant</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    {apiStatus === "offline" ? "Mode local" : "Gemini AI"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span>{messages.length - 1} message{messages.length > 2 ? "s" : ""}</span>
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
                    title="Effacer l'historique"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-gray-500 hover:text-white transition-colors" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {showSuggestions && messages.length === 1 && (
                  <div className="mb-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/15">
                    <p className="text-xs text-indigo-400 font-bold mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Suggestions rapides
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.slice(0, 5).map((s, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(s.label)}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-indigo-500/20 border border-white/[0.06] hover:border-indigo-500/30 text-xs font-semibold text-gray-400 hover:text-white transition-all"
                        >
                          {s.icon} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] ${msg.role === "user" ? "" : "w-full"}`}>
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Bot className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[10px] font-bold text-indigo-400">CryptoIA</span>
                          <span className="text-[9px] text-gray-600">{formatTime(msg.timestamp)}</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm"
                            : "bg-white/[0.04] border border-white/[0.06] rounded-tl-sm"
                        }`}
                      >
                        <div className="leading-relaxed">{renderContent(msg.content)}</div>
                      </div>
                      {msg.role === "user" && (
                        <p className="text-[9px] text-gray-600 text-right mt-1">{formatTime(msg.timestamp)}</p>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-3.5 h-3.5 text-indigo-400" />
                        <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                        <span className="text-xs text-gray-400">IA en train d'analyser...</span>
                        <span className="flex gap-0.5">
                          {[0, 1, 2].map((j) => (
                            <span
                              key={j}
                              className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${j * 0.15}s` }}
                            />
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/[0.06] bg-black/10 flex-shrink-0">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Posez votre question crypto... (ex: Dois-je vendre mon BTC ?)"
                    className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                    disabled={isTyping}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isTyping}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 mt-2 text-center">
                  {apiStatus === "offline"
                    ? "Mode hors-ligne • Réponses basées sur les données locales du portfolio"
                    : "Propulsé par Google Gemini AI • Historique sauvegardé localement • Les réponses ne constituent pas des conseils financiers"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}

// ─── Welcome Message (defined after getFallbackResponse) ─────────────────────

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  timestamp: Date.now(),
  content: `Bonjour ! 👋 Je suis **CryptoIA Assistant**, propulsé par **Google Gemini AI** 🧠

Je connais votre portfolio et le marché en temps réel. Je peux vous aider avec :

• 📊 **Analyse de marché** — Bitcoin, Ethereum, altcoins, tendances actuelles
• 💼 **Analyse de votre portfolio** — Performance, risques, rééquilibrage
• 💡 **Stratégies de trading** — DCA, swing, scalping, gestion du risque
• 📈 **Indicateurs techniques** — RSI, MACD, Bollinger, Fibonacci
• 🔐 **Sécurité** — Wallets, seed phrases, bonnes pratiques
• 💰 **DeFi & Staking** — Yield farming, APY, protocoles

Posez-moi n'importe quelle question ! 🚀`,
};