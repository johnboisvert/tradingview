import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Bot, Send, Trash2, Loader2, Sparkles, AlertTriangle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `Tu es CryptoIA Assistant, un expert en crypto-monnaies et trading. Tu parles en français.

Tes domaines d'expertise:
- Analyse de marché crypto (Bitcoin, Ethereum, altcoins, DeFi, NFT)
- Stratégies de trading (DCA, swing trading, scalping, position trading)
- Indicateurs techniques (RSI, MACD, Bollinger Bands, EMA, supports/résistances)
- Fondamentaux crypto (halving, staking, yield farming, tokenomics)
- Gestion du risque et du portfolio
- Actualités et tendances du marché

Règles:
- Réponds toujours en français
- Sois précis et informatif
- Ajoute des emojis pertinents pour rendre tes réponses engageantes
- Mentionne toujours que ce ne sont pas des conseils financiers quand tu parles d'investissement
- Utilise des exemples concrets et des chiffres quand possible
- Structure tes réponses avec des bullet points pour la lisibilité`;

// Pre-built knowledge base for common crypto questions (offline fallback)
const KNOWLEDGE_BASE: Record<string, string> = {
  bitcoin: `📊 **Analyse Bitcoin (BTC)**

Le Bitcoin est la première et la plus grande crypto-monnaie par capitalisation boursière.

**Points clés à surveiller :**
• 🎯 **Prix actuel** : Consultez CoinGecko ou CoinMarketCap pour le prix en temps réel
• 📈 **Indicateurs techniques** : RSI, MACD, moyennes mobiles (EMA 50/200)
• 🔄 **Halving** : Événement tous les ~4 ans qui réduit la récompense des mineurs de 50%
• 📊 **Dominance BTC** : Mesure la part de marché de Bitcoin vs les altcoins
• 💰 **Support/Résistance** : Niveaux clés à identifier sur les graphiques

**Facteurs fondamentaux :**
• Adoption institutionnelle (ETF, entreprises)
• Régulation mondiale
• Taux d'intérêt et politique monétaire
• Sentiment du marché (Fear & Greed Index)

⚠️ *Ceci n'est pas un conseil financier. Faites toujours vos propres recherches (DYOR).*`,

  dca: `💡 **Stratégie DCA (Dollar Cost Averaging)**

Le DCA est une stratégie d'investissement qui consiste à investir un montant fixe à intervalles réguliers, quel que soit le prix.

**Comment ça marche :**
• 📅 Choisissez une fréquence (hebdomadaire, mensuelle)
• 💵 Définissez un montant fixe (ex: 100€/semaine)
• 🔄 Achetez automatiquement, sans regarder le prix
• ⏰ Continuez sur le long terme (minimum 1-2 ans)

**Avantages :**
• ✅ Réduit l'impact de la volatilité
• ✅ Élimine le stress du "timing" du marché
• ✅ Discipline d'investissement automatique
• ✅ Idéal pour les débutants

**Exemple concret :**
Si vous investissez 100€/semaine en BTC pendant 1 an :
- Semaine 1 : BTC à 60 000€ → 0.00167 BTC
- Semaine 10 : BTC à 50 000€ → 0.00200 BTC
- Semaine 20 : BTC à 70 000€ → 0.00143 BTC
→ Votre prix moyen sera lissé sur toute la période

⚠️ *Ceci n'est pas un conseil financier. Le DCA ne garantit pas de profits.*`,

  rsi: `📈 **RSI (Relative Strength Index) & MACD**

**RSI — Relative Strength Index :**
• 📊 Oscillateur entre 0 et 100
• 🔴 **Au-dessus de 70** = Surachat (potentiel retournement baissier)
• 🟢 **En-dessous de 30** = Survente (potentiel retournement haussier)
• ⚖️ **Zone 40-60** = Neutre
• 📐 Période standard : 14 périodes

**MACD — Moving Average Convergence Divergence :**
• 📊 Composé de 3 éléments :
  - Ligne MACD (EMA 12 - EMA 26)
  - Ligne Signal (EMA 9 du MACD)
  - Histogramme (MACD - Signal)
• 🟢 **Signal d'achat** : MACD croise au-dessus de la ligne Signal
• 🔴 **Signal de vente** : MACD croise en-dessous de la ligne Signal
• 📈 **Divergence** : Prix monte mais MACD descend = signal baissier

**Bollinger Bands :**
• 📊 3 bandes autour d'une moyenne mobile (SMA 20)
• Bande supérieure = SMA + 2 écarts-types
• Bande inférieure = SMA - 2 écarts-types
• 🔄 Squeeze = volatilité faible, mouvement imminent

⚠️ *Utilisez toujours plusieurs indicateurs ensemble, jamais un seul.*`,

  defi: `🔐 **DeFi (Finance Décentralisée)**

La DeFi est un écosystème de services financiers construits sur la blockchain, sans intermédiaires traditionnels.

**Principaux services DeFi :**
• 💰 **Lending/Borrowing** : Prêter/emprunter des cryptos (Aave, Compound)
• 🔄 **DEX** : Échanges décentralisés (Uniswap, SushiSwap, Curve)
• 🌾 **Yield Farming** : Fournir de la liquidité pour gagner des récompenses
• 🥩 **Staking** : Verrouiller des tokens pour sécuriser le réseau
• 🏦 **Stablecoins** : USDT, USDC, DAI — cryptos indexées au dollar

**Risques à connaître :**
• ⚠️ **Smart contract risk** : Bugs ou failles dans le code
• ⚠️ **Impermanent loss** : Perte temporaire en fournissant de la liquidité
• ⚠️ **Rug pulls** : Projets frauduleux
• ⚠️ **Volatilité** : Les rendements peuvent changer rapidement

**Conseils pour débuter :**
1. Commencez avec des protocoles établis (Aave, Uniswap)
2. Ne mettez jamais plus que ce que vous pouvez perdre
3. Vérifiez les audits de sécurité
4. Diversifiez vos positions

⚠️ *Ceci n'est pas un conseil financier. La DeFi comporte des risques importants.*`,

  securite: `🔐 **Sécuriser vos Crypto-monnaies**

**Types de wallets :**
• 🔒 **Hardware wallet** (Ledger, Trezor) — Le plus sécurisé
• 📱 **Software wallet** (MetaMask, Trust Wallet) — Pratique mais moins sûr
• 🏦 **Exchange** (Binance, Coinbase) — Pratique mais vous ne contrôlez pas vos clés

**Règles d'or de sécurité :**
• ✅ **"Not your keys, not your coins"** — Utilisez un hardware wallet
• ✅ **Seed phrase** : Notez-la sur papier, JAMAIS en ligne
• ✅ **2FA** : Activez l'authentification à deux facteurs partout
• ✅ **Diversifiez** : Ne gardez pas tout sur un seul wallet/exchange
• ❌ **JAMAIS** partager votre seed phrase ou clé privée
• ❌ **JAMAIS** cliquer sur des liens suspects
• ❌ **JAMAIS** connecter votre wallet à des sites non vérifiés

**Checklist sécurité :**
1. Hardware wallet pour les gros montants
2. 2FA sur tous les exchanges
3. Email dédié pour la crypto
4. VPN pour les transactions
5. Vérifier les adresses avant d'envoyer

⚠️ *La sécurité est votre responsabilité. Prenez-la au sérieux.*`,

  halving: `🔄 **Le Halving Bitcoin**

Le halving est un événement programmé dans le code de Bitcoin qui réduit de moitié la récompense des mineurs.

**Historique des halvings :**
• 📅 **2012** : Récompense 50 → 25 BTC (prix ~$12 → $1,000+)
• 📅 **2016** : Récompense 25 → 12.5 BTC (prix ~$650 → $20,000+)
• 📅 **2020** : Récompense 12.5 → 6.25 BTC (prix ~$8,500 → $69,000+)
• 📅 **2024** : Récompense 6.25 → 3.125 BTC

**Impact sur le prix :**
• 📉 Réduction de l'offre nouvelle de 50%
• 📈 Historiquement suivi d'un bull run 12-18 mois après
• 💰 Effet de rareté accru (offre limitée à 21 millions BTC)
• 🔄 Cycle de ~4 ans

**Prochain halving :**
• Le prochain halving réduira la récompense à 1.5625 BTC
• Prévu vers 2028

⚠️ *Les performances passées ne garantissent pas les résultats futurs. DYOR.*`,

  bear: `📉 **Stratégie pour un Bear Market**

Un bear market est une période prolongée de baisse des prix (généralement -20% ou plus depuis le sommet).

**Stratégies recommandées :**

**1. 💰 DCA (Dollar Cost Averaging)**
• Continuez à acheter régulièrement à prix réduit
• Concentrez-vous sur BTC et ETH (blue chips)
• Réduisez les montants si nécessaire

**2. 🎯 Accumulation sélective**
• Identifiez les projets solides avec de bons fondamentaux
• Évitez les altcoins spéculatifs
• Cherchez les projets avec revenus réels

**3. 💵 Stablecoins & Yield**
• Gardez une partie en stablecoins (USDC, USDT)
• Utilisez le lending pour générer du yield (Aave, Compound)
• Préparez du capital pour le prochain bull run

**4. 📚 Éducation**
• Apprenez l'analyse technique
• Étudiez les fondamentaux des projets
• Développez votre stratégie pour le prochain cycle

**Ce qu'il faut ÉVITER :**
• ❌ Vendre en panique au plus bas
• ❌ Utiliser du levier/margin trading
• ❌ Investir plus que ce que vous pouvez perdre
• ❌ Suivre les "influenceurs" qui promettent des gains rapides

⚠️ *Ceci n'est pas un conseil financier. Chaque situation est unique.*`,

  altcoins: `🔍 **Altcoins à Surveiller**

**Blue Chips (Top 10) :**
• 💎 **Ethereum (ETH)** — Smart contracts, DeFi, NFT
• ☀️ **Solana (SOL)** — Blockchain rapide et peu coûteuse
• 🔵 **Cardano (ADA)** — Approche académique et peer-reviewed
• 🟡 **BNB** — Écosystème Binance
• ⚡ **Avalanche (AVAX)** — Subnets et interopérabilité

**Critères d'évaluation :**
• 📊 **Capitalisation** : Préférez les top 100
• 👥 **Équipe** : Vérifiez l'expérience et la transparence
• 🔧 **Technologie** : Innovation réelle vs marketing
• 📈 **Adoption** : Utilisateurs actifs, TVL, transactions
• 💰 **Tokenomics** : Distribution, inflation, utilité du token
• 🔒 **Sécurité** : Audits, historique de hacks

**Signaux d'alerte (Red Flags) :**
• ❌ Promesses de rendements garantis
• ❌ Équipe anonyme sans track record
• ❌ Pas de produit fonctionnel (vaporware)
• ❌ Tokenomics favorisant les insiders
• ❌ Marketing agressif sans substance

⚠️ *Ceci n'est pas un conseil financier. Faites toujours vos propres recherches (DYOR).*`,
};

function findBestResponse(query: string): string | null {
  const q = query.toLowerCase();
  
  if (q.includes("bitcoin") || q.includes("btc") || q.includes("analyse le marché")) return KNOWLEDGE_BASE.bitcoin;
  if (q.includes("dca") || q.includes("dollar cost")) return KNOWLEDGE_BASE.dca;
  if (q.includes("rsi") || q.includes("macd") || q.includes("bollinger") || q.includes("indicateur")) return KNOWLEDGE_BASE.rsi;
  if (q.includes("defi") || q.includes("décentralis") || q.includes("yield") || q.includes("staking")) return KNOWLEDGE_BASE.defi;
  if (q.includes("sécuri") || q.includes("wallet") || q.includes("protéger") || q.includes("sécuriser")) return KNOWLEDGE_BASE.securite;
  if (q.includes("halving") || q.includes("halvening")) return KNOWLEDGE_BASE.halving;
  if (q.includes("bear") || q.includes("baissier") || q.includes("correction") || q.includes("crash")) return KNOWLEDGE_BASE.bear;
  if (q.includes("altcoin") || q.includes("alt coin") || q.includes("meilleur") || q.includes("surveiller")) return KNOWLEDGE_BASE.altcoins;
  
  return null;
}

// Try to fetch live market data to enrich responses
async function fetchLiveContext(): Promise<string> {
  try {
    const [btcRes, fgRes] = await Promise.all([
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true"),
      fetch("https://api.alternative.me/fng/?limit=1"),
    ]);
    
    let context = "\n\n---\n📊 **Données en temps réel :**\n";
    
    if (btcRes.ok) {
      const prices = await btcRes.json();
      if (prices.bitcoin) {
        context += `• BTC: $${prices.bitcoin.usd?.toLocaleString("fr-FR")} (${prices.bitcoin.usd_24h_change >= 0 ? "+" : ""}${prices.bitcoin.usd_24h_change?.toFixed(1)}% 24h)\n`;
      }
      if (prices.ethereum) {
        context += `• ETH: $${prices.ethereum.usd?.toLocaleString("fr-FR")} (${prices.ethereum.usd_24h_change >= 0 ? "+" : ""}${prices.ethereum.usd_24h_change?.toFixed(1)}% 24h)\n`;
      }
      if (prices.solana) {
        context += `• SOL: $${prices.solana.usd?.toLocaleString("fr-FR")} (${prices.solana.usd_24h_change >= 0 ? "+" : ""}${prices.solana.usd_24h_change?.toFixed(1)}% 24h)\n`;
      }
    }
    
    if (fgRes.ok) {
      const fgData = await fgRes.json();
      const fgValue = fgData?.data?.[0]?.value || "N/A";
      const fgClass = fgData?.data?.[0]?.value_classification || "N/A";
      context += `• Fear & Greed: ${fgValue}/100 (${fgClass})\n`;
    }
    
    return context;
  } catch {
    return "";
  }
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour ! 👋 Je suis votre assistant IA crypto. Je peux vous aider avec:\n\n• 📊 **Analyse de marché** — Bitcoin, Ethereum, altcoins\n• 💡 **Stratégies de trading** — DCA, swing, scalping\n• 📈 **Indicateurs techniques** — RSI, MACD, Bollinger, EMA\n• 🔐 **Sécurité** — Wallets, protection des fonds\n• 💰 **DeFi** — Staking, yield farming, lending\n• 📚 **Éducation crypto** — Halving, tokenomics, cycles\n\nCliquez sur une suggestion ci-dessous ou posez votre question ! 🚀",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [aiMode, setAiMode] = useState<"online" | "offline">("offline");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Try to detect if AI SDK is available
  useEffect(() => {
    async function checkAI() {
      try {
        const { createClient } = await import("@metagptx/web-sdk");
        const client = createClient();
        if (client?.ai?.gentxt) {
          setAiMode("online");
        }
      } catch {
        setAiMode("offline");
      }
    }
    checkAI();
  }, []);

  const sendMessageOnline = async (userMsg: Message) => {
    try {
      const { createClient } = await import("@metagptx/web-sdk");
      const client = createClient();

      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const recentHistory = chatHistory.slice(-20);
      let fullContent = "";

      await client.ai.gentxt({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...recentHistory,
        ],
        model: "gemini-2.5-pro",
        stream: true,
        onChunk: (chunk: { content?: string }) => {
          if (chunk.content) {
            fullContent += chunk.content;
            setStreamingContent(fullContent);
          }
        },
        onComplete: () => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: fullContent || "Désolé, je n'ai pas pu générer de réponse." },
          ]);
          setStreamingContent("");
          setIsTyping(false);
        },
        onError: (error: { message?: string }) => {
          console.error("AI Error:", error);
          // Fallback to offline mode
          sendMessageOffline(userMsg);
        },
        timeout: 60000,
      });
    } catch {
      // Fallback to offline mode
      sendMessageOffline(userMsg);
    }
  };

  const sendMessageOffline = async (userMsg: Message) => {
    // Use knowledge base + live data
    const kbResponse = findBestResponse(userMsg.content);
    let response = "";

    if (kbResponse) {
      response = kbResponse;
      // Try to add live data
      const liveData = await fetchLiveContext();
      if (liveData) {
        response += liveData;
      }
    } else {
      // Generic response with live data
      const liveData = await fetchLiveContext();
      response = `🤖 Merci pour votre question ! Voici ce que je peux vous dire :\n\nJe suis spécialisé dans les sujets suivants. Essayez de me poser des questions sur :\n\n• 📊 **"Analyse le marché Bitcoin"** — Analyse BTC complète\n• 💡 **"Explique la stratégie DCA"** — Dollar Cost Averaging\n• 📈 **"Comment lire le RSI et MACD ?"** — Indicateurs techniques\n• 🔐 **"Comment sécuriser mes cryptos ?"** — Sécurité wallets\n• 💰 **"Qu'est-ce que la DeFi ?"** — Finance décentralisée\n• 🔄 **"Explique le halving Bitcoin"** — Cycles Bitcoin\n• 📉 **"Stratégie pour un bear market"** — Gestion de crise\n• 🔍 **"Meilleurs altcoins à surveiller ?"** — Analyse altcoins`;
      if (liveData) {
        response += liveData;
      }
    }

    // Simulate typing effect
    let displayed = "";
    const words = response.split(" ");
    for (let i = 0; i < words.length; i++) {
      displayed += (i > 0 ? " " : "") + words[i];
      setStreamingContent(displayed);
      await new Promise((r) => setTimeout(r, 15));
    }

    setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    setStreamingContent("");
    setIsTyping(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setStreamingContent("");

    if (aiMode === "online") {
      await sendMessageOnline(userMsg);
    } else {
      await sendMessageOffline(userMsg);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat réinitialisé. 🔄 Comment puis-je vous aider ? Posez-moi vos questions crypto ! 🤖",
      },
    ]);
    setStreamingContent("");
  };

  const suggestions = [
    "Analyse le marché Bitcoin actuel",
    "Explique la stratégie DCA",
    "Comment lire le RSI et MACD ?",
    "Qu'est-ce que la DeFi ?",
    "Meilleurs altcoins à surveiller ?",
    "Comment sécuriser mes cryptos ?",
    "Explique le halving Bitcoin",
    "Stratégie pour un bear market",
  ];

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
      if (line.startsWith("• ") || line.startsWith("- ")) {
        return <p key={i} className="ml-2 my-0.5" dangerouslySetInnerHTML={{ __html: boldLine }} />;
      }
      if (line.trim() === "---") {
        return <hr key={i} className="border-white/10 my-3" />;
      }
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: boldLine }} />;
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen flex flex-col">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[120px] flex-shrink-0 bg-gradient-to-r from-indigo-900/40 to-purple-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/90 via-[#0A0E1A]/60 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Bot className="w-7 h-7 text-indigo-400" />
                <h1 className="text-2xl font-extrabold">Assistant IA Crypto</h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  aiMode === "online" 
                    ? "bg-green-500/20 text-green-400" 
                    : "bg-amber-500/20 text-amber-400"
                }`}>
                  {aiMode === "online" ? "🟢 IA EN LIGNE" : "📚 MODE EXPERT"}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {aiMode === "online" 
                  ? "Propulsé par Google Gemini 2.5 Pro • Réponses intelligentes en streaming"
                  : "Base de connaissances experte + données de marché en temps réel"
                }
              </p>
            </div>
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all"
            >
              <Trash2 className="w-4 h-4" /> Effacer
            </button>
          </div>
        </div>

        {/* Mode info banner */}
        {aiMode === "offline" && (
          <div className="mb-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-300">
              <strong>Mode Expert actif</strong> — Réponses basées sur une base de connaissances crypto complète avec données de marché en temps réel (CoinGecko, Fear & Greed Index).
            </p>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 bg-[#111827] border border-white/[0.06] rounded-2xl flex flex-col overflow-hidden" style={{ minHeight: "500px" }}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                      : "bg-white/[0.05] border border-white/[0.06]"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-400">CryptoIA Assistant</span>
                    </div>
                  )}
                  <div className="text-sm leading-relaxed">{renderContent(msg.content)}</div>
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {isTyping && streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl p-4 bg-white/[0.05] border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-400">CryptoIA Assistant</span>
                    <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                  </div>
                  <div className="text-sm leading-relaxed">{renderContent(streamingContent)}</div>
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && !streamingContent && (
              <div className="flex justify-start">
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-gray-500 ml-2">Analyse en cours...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="px-6 pb-3">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">💡 Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-indigo-500/20 border border-white/[0.06] hover:border-indigo-500/30 text-xs font-semibold text-gray-400 hover:text-white transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/[0.06]">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Posez votre question crypto... (ex: Analyse le Bitcoin, Explique le RSI)"
                className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                disabled={isTyping}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-2 text-center">
              {aiMode === "online" 
                ? "Propulsé par Google Gemini 2.5 Pro • Les réponses ne constituent pas des conseils financiers"
                : "Base de connaissances experte + données CoinGecko en temps réel • Les réponses ne constituent pas des conseils financiers"
              }
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}