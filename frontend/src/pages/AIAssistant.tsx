import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Bot, Send, Trash2, Loader2, Sparkles } from "lucide-react";

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

// Free AI providers to try in order
const AI_PROVIDERS = [
  {
    name: "DuckDuckGo AI",
    url: "https://duckduckgo.com/duckchat/v1/chat",
    model: "claude-3-haiku-20240307",
    headers: { "x-vqd-accept": "1" },
  },
];

async function getVQDToken(): Promise<string> {
  try {
    const res = await fetch("https://duckduckgo.com/duckchat/v1/status", {
      headers: { "x-vqd-accept": "1" },
    });
    return res.headers.get("x-vqd-4") || "";
  } catch {
    return "";
  }
}

async function callDuckDuckGoAI(messages: { role: string; content: string }[]): Promise<string> {
  const vqd = await getVQDToken();
  if (!vqd) throw new Error("Could not get VQD token");

  const res = await fetch("https://duckduckgo.com/duckchat/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vqd-4": vqd,
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      messages: messages.map((m) => ({
        role: m.role === "system" ? "user" : m.role,
        content: m.content,
      })),
    }),
  });

  if (!res.ok) throw new Error(`DuckDuckGo API error: ${res.status}`);

  const text = await res.text();
  let fullContent = "";
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6).trim();
      if (data === "[DONE]") break;
      try {
        const parsed = JSON.parse(data);
        if (parsed.message) fullContent += parsed.message;
      } catch {
        // skip
      }
    }
  }
  return fullContent;
}

// Fallback: use a simple knowledge base for common crypto questions
function getOfflineResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("bitcoin") && (q.includes("analyse") || q.includes("marché"))) {
    return `📊 **Analyse Bitcoin**

Le Bitcoin (BTC) est la crypto-monnaie de référence avec la plus grande capitalisation du marché.

• **Indicateurs clés à surveiller:**
  - RSI (Relative Strength Index): >70 = suracheté, <30 = survendu
  - MACD: croisement haussier/baissier pour les tendances
  - Moyennes mobiles: MA50 et MA200 pour les tendances long terme

• **Facteurs fondamentaux:**
  - Halving (réduction de récompense des mineurs tous les ~4 ans)
  - Adoption institutionnelle (ETF Bitcoin, entreprises)
  - Régulation et politique monétaire

• **Niveaux importants:**
  - Consultez la page Graphiques pour les niveaux de support/résistance en temps réel
  - Utilisez la page Fear & Greed pour le sentiment du marché

⚠️ *Ceci n'est pas un conseil financier. Faites toujours vos propres recherches (DYOR).*`;
  }

  if (q.includes("dca") || q.includes("dollar cost")) {
    return `💰 **Stratégie DCA (Dollar Cost Averaging)**

Le DCA consiste à investir un montant fixe à intervalles réguliers, peu importe le prix.

• **Avantages:**
  - ✅ Réduit l'impact de la volatilité
  - ✅ Pas besoin de timer le marché
  - ✅ Discipline d'investissement automatique
  - ✅ Réduit le stress émotionnel

• **Comment appliquer:**
  - Choisissez un montant fixe (ex: 50€/semaine)
  - Définissez une fréquence (hebdomadaire, mensuel)
  - Achetez automatiquement peu importe le prix
  - Restez constant sur le long terme (minimum 1-2 ans)

• **Exemple concret:**
  - 100€/mois en Bitcoin depuis janvier 2020
  - Investissement total: ~6 000€
  - Valeur actuelle: significativement supérieure grâce au DCA

⚠️ *Ceci n'est pas un conseil financier. Le DCA ne garantit pas de profits.*`;
  }

  if (q.includes("rsi") || q.includes("macd") || q.includes("indicateur")) {
    return `📈 **Indicateurs Techniques Essentiels**

**RSI (Relative Strength Index):**
• Mesure la force relative du prix sur 14 périodes
• >70 = Zone de surachat (possible correction)
• <30 = Zone de survente (possible rebond)
• 50 = Zone neutre

**MACD (Moving Average Convergence Divergence):**
• Croisement ligne MACD au-dessus du signal = Signal haussier 🟢
• Croisement ligne MACD en-dessous du signal = Signal baissier 🔴
• Histogramme positif croissant = Momentum haussier

**Bollinger Bands:**
• Prix touche la bande supérieure = Possible surachat
• Prix touche la bande inférieure = Possible survente
• Bandes serrées = Volatilité faible, mouvement fort à venir

**EMA (Exponential Moving Average):**
• EMA 20: Tendance court terme
• EMA 50: Tendance moyen terme
• EMA 200: Tendance long terme
• Golden Cross (EMA50 > EMA200) = Signal très haussier

👉 Consultez la page **Graphiques** pour voir ces indicateurs en temps réel sur TradingView !`;
  }

  if (q.includes("defi") || q.includes("décentralisé")) {
    return `🔗 **DeFi (Finance Décentralisée)**

La DeFi permet d'accéder à des services financiers sans intermédiaire.

• **Principaux protocoles:**
  - 🏦 **Aave/Compound**: Prêts et emprunts décentralisés
  - 🔄 **Uniswap/SushiSwap**: Échanges décentralisés (DEX)
  - 💧 **Curve**: Échange de stablecoins optimisé
  - 🌾 **Yearn Finance**: Optimisation de rendement automatique

• **Concepts clés:**
  - **Yield Farming**: Fournir de la liquidité pour gagner des récompenses
  - **Staking**: Verrouiller des tokens pour sécuriser le réseau
  - **Liquidity Pools**: Pools de liquidité pour les échanges
  - **TVL (Total Value Locked)**: Indicateur de santé DeFi

• **Risques:**
  - ⚠️ Smart contract bugs
  - ⚠️ Impermanent loss
  - ⚠️ Rug pulls sur les nouveaux protocoles
  - ⚠️ Volatilité des rendements

⚠️ *Ceci n'est pas un conseil financier. La DeFi comporte des risques importants.*`;
  }

  if (q.includes("altcoin") || q.includes("surveiller") || q.includes("meilleur")) {
    return `🔍 **Comment Évaluer les Altcoins**

• **Critères fondamentaux:**
  - 📋 Équipe et développeurs (transparence, expérience)
  - 🛠️ Technologie et cas d'usage réel
  - 📊 Tokenomics (supply, distribution, inflation)
  - 🤝 Partenariats et adoption
  - 💻 Activité GitHub et développement

• **Secteurs à surveiller:**
  - 🤖 **IA & Crypto**: Render, Fetch.ai, Ocean Protocol
  - 🎮 **Gaming/Metaverse**: Immutable X, Gala
  - ⚡ **Layer 2**: Arbitrum, Optimism, Polygon
  - 🔗 **Interopérabilité**: Polkadot, Cosmos
  - 💰 **DeFi**: Aave, Uniswap, Lido

• **Signaux d'alerte (Red Flags):**
  - ❌ Promesses de rendements garantis
  - ❌ Équipe anonyme sans track record
  - ❌ Pas de code open source
  - ❌ Marketing agressif sans produit

👉 Consultez la page **Altcoin Season** pour voir quels altcoins surperforment BTC !

⚠️ *Ceci n'est pas un conseil financier. DYOR (Do Your Own Research).*`;
  }

  if (q.includes("sécuri") || q.includes("wallet") || q.includes("protéger")) {
    return `🔐 **Sécuriser vos Cryptos**

• **Types de wallets:**
  - 🏦 **Hardware Wallet** (Ledger, Trezor): Le plus sûr pour le stockage long terme
  - 📱 **Software Wallet** (MetaMask, Trust Wallet): Pratique pour l'usage quotidien
  - 🌐 **Exchange** (Binance, Coinbase): Pratique mais risqué (not your keys, not your coins)

• **Règles de sécurité essentielles:**
  - ✅ Activez toujours le 2FA (Google Authenticator, pas SMS)
  - ✅ Sauvegardez votre seed phrase sur papier (jamais en photo/cloud)
  - ✅ Utilisez un hardware wallet pour les gros montants
  - ✅ Vérifiez toujours les adresses avant d'envoyer
  - ✅ Méfiez-vous des liens et emails de phishing

• **Erreurs courantes:**
  - ❌ Stocker la seed phrase en ligne
  - ❌ Utiliser le même mot de passe partout
  - ❌ Cliquer sur des liens non vérifiés
  - ❌ Laisser tout sur un exchange

💡 *Règle d'or: "Not your keys, not your coins"*`;
  }

  if (q.includes("halving")) {
    return `⛏️ **Le Halving Bitcoin**

Le halving est un événement programmé qui réduit de moitié la récompense des mineurs Bitcoin.

• **Historique des halvings:**
  - 2012: Récompense 50 → 25 BTC (prix: ~12$ → ~1000$ en 1 an)
  - 2016: Récompense 25 → 12.5 BTC (prix: ~650$ → ~20000$ en 18 mois)
  - 2020: Récompense 12.5 → 6.25 BTC (prix: ~8700$ → ~69000$ en 18 mois)
  - 2024: Récompense 6.25 → 3.125 BTC

• **Pourquoi c'est important:**
  - 📉 Réduit l'offre de nouveaux BTC (effet déflationniste)
  - 📈 Historiquement suivi d'un bull run (12-18 mois après)
  - 🔄 Cycle de ~4 ans qui influence tout le marché crypto

• **Impact sur le marché:**
  - Réduction de la pression vendeuse des mineurs
  - Augmentation de la rareté perçue
  - Effet psychologique sur les investisseurs

👉 Consultez la page **Bullrun Phase** pour voir où nous en sommes dans le cycle !

⚠️ *Les performances passées ne garantissent pas les résultats futurs.*`;
  }

  if (q.includes("bear") || q.includes("baiss")) {
    return `🐻 **Stratégies pour un Bear Market**

• **Gestion du portfolio:**
  - 💵 Augmentez votre position en stablecoins (USDC, USDT)
  - 📊 Réduisez l'exposition aux altcoins à haut risque
  - 🎯 Concentrez-vous sur BTC et ETH (blue chips)
  - 💰 Gardez du cash pour acheter les dips

• **Stratégies actives:**
  - 📈 DCA (Dollar Cost Averaging) sur les blue chips
  - 🔒 Staking pour générer des revenus passifs
  - 📚 Éducation et recherche (préparez le prochain bull run)
  - 🎯 Définissez des niveaux d'achat à l'avance

• **Erreurs à éviter:**
  - ❌ Vendre dans la panique
  - ❌ Utiliser du levier/margin trading
  - ❌ Investir plus que ce que vous pouvez perdre
  - ❌ Suivre les "influenceurs" qui promettent des gains

• **Mindset:**
  - "Be fearful when others are greedy, be greedy when others are fearful" — Warren Buffett
  - Les bear markets sont les meilleurs moments pour accumuler

⚠️ *Ceci n'est pas un conseil financier.*`;
  }

  // Default response
  return `🤖 **CryptoIA Assistant**

Merci pour votre question ! Voici ce que je peux vous aider avec:

• 📊 **Analyse de marché** — Demandez-moi d'analyser Bitcoin, Ethereum ou tout altcoin
• 💡 **Stratégies de trading** — DCA, swing trading, scalping, gestion du risque
• 📈 **Indicateurs techniques** — RSI, MACD, Bollinger Bands, EMA
• 🔗 **DeFi & Staking** — Yield farming, liquidity pools, protocoles
• 🔐 **Sécurité** — Wallets, 2FA, bonnes pratiques
• ⛏️ **Fondamentaux** — Halving, tokenomics, cycles de marché
• 🔍 **Évaluation d'altcoins** — Critères, red flags, secteurs prometteurs

💡 **Essayez ces questions:**
- "Analyse le marché Bitcoin actuel"
- "Explique la stratégie DCA"
- "Comment lire le RSI et MACD ?"
- "Qu'est-ce que la DeFi ?"
- "Comment sécuriser mes cryptos ?"

N'hésitez pas à poser votre question de manière précise pour une réponse détaillée ! 🚀

⚠️ *Rappel: Les informations fournies ne constituent pas des conseils financiers.*`;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour ! 👋 Je suis votre assistant IA crypto. Je peux vous aider avec:\n\n• 📊 **Analyse de marché** et tendances\n• 💡 **Stratégies de trading** (DCA, swing, scalping)\n• 📈 **Indicateurs techniques** (RSI, MACD, Bollinger, EMA)\n• 🔐 **Sécurité** et wallets\n• 💰 **DeFi**, staking et yield farming\n• 📚 **Éducation crypto** pour tous niveaux\n\nQue souhaitez-vous savoir ? 🚀",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiMode, setAiMode] = useState<"online" | "offline">("online");
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    const userQuery = input.trim();
    setInput("");
    setIsTyping(true);
    setError("");

    if (aiMode === "offline") {
      // Use offline knowledge base
      await new Promise((r) => setTimeout(r, 800)); // Simulate thinking
      const response = getOfflineResponse(userQuery);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
      return;
    }

    // Try online AI
    const chatHistory = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const recentHistory = chatHistory.slice(-10);

    try {
      const response = await callDuckDuckGoAI([
        { role: "system", content: SYSTEM_PROMPT },
        ...recentHistory,
      ]);

      if (response && response.trim()) {
        setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      } else {
        // Fallback to offline
        const fallback = getOfflineResponse(userQuery);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fallback + "\n\n---\n*💡 Réponse depuis la base de connaissances locale.*" },
        ]);
      }
    } catch (err) {
      console.error("AI call error:", err);
      // Fallback to offline knowledge base
      const fallback = getOfflineResponse(userQuery);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fallback + "\n\n---\n*💡 Réponse depuis la base de connaissances locale (l'IA en ligne n'est pas disponible actuellement).*" },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Chat réinitialisé. 🔄 Comment puis-je vous aider ? Posez-moi vos questions crypto ! 🤖",
      },
    ]);
    setError("");
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
      const boldLine = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="text-white font-semibold">$1</strong>'
      );
      const italicLine = boldLine.replace(
        /\*(.*?)\*/g,
        '<em class="text-gray-400 italic">$1</em>'
      );
      if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("  -")) {
        return (
          <p
            key={i}
            className="ml-2 my-0.5"
            dangerouslySetInnerHTML={{ __html: italicLine }}
          />
        );
      }
      if (line.trim() === "" || line.trim() === "---") return <br key={i} />;
      return (
        <p
          key={i}
          className="my-0.5"
          dangerouslySetInnerHTML={{ __html: italicLine }}
        />
      );
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
                    : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {aiMode === "online" ? "🟢 EN LIGNE" : "📚 BASE LOCALE"}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {aiMode === "online"
                  ? "IA en ligne avec fallback intelligent • Réponses crypto expertes"
                  : "Base de connaissances crypto intégrée • Réponses instantanées"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-white/[0.05] rounded-xl p-1">
                <button
                  onClick={() => setAiMode("online")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    aiMode === "online"
                      ? "bg-indigo-500/30 text-indigo-300"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  IA Online
                </button>
                <button
                  onClick={() => setAiMode("offline")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    aiMode === "offline"
                      ? "bg-yellow-500/30 text-yellow-300"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  📚 Base Locale
                </button>
              </div>
              <button
                onClick={clearChat}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all"
              >
                <Trash2 className="w-4 h-4" /> Effacer
              </button>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <span className="text-red-400 text-xs">⚠️ {error}</span>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-400 hover:text-red-300 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Chat Area */}
        <div
          className="flex-1 bg-[#111827] border border-white/[0.06] rounded-2xl flex flex-col overflow-hidden"
          style={{ minHeight: "500px" }}
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
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
                      <span className="text-xs font-bold text-indigo-400">
                        CryptoIA Assistant
                      </span>
                    </div>
                  )}
                  <div className="text-sm leading-relaxed">
                    {renderContent(msg.content)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      {aiMode === "online" ? "L'IA réfléchit..." : "Recherche en cours..."}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="px-6 pb-3">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">
                💡 Suggestions
              </p>
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
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendMessage()
                }
                placeholder="Posez votre question crypto... (ex: Analyse le Bitcoin, Explique le RSI)"
                className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                disabled={isTyping}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-2 text-center">
              {aiMode === "online"
                ? "IA en ligne avec fallback automatique • Les réponses ne constituent pas des conseils financiers"
                : "Base de connaissances crypto intégrée • Les réponses ne constituent pas des conseils financiers"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}