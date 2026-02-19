import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Bot, Send, Trash2, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Comprehensive crypto knowledge base for offline AI
const KNOWLEDGE_BASE: Record<string, string> = {
  // Bitcoin
  "bitcoin|btc|halving": `📊 **Bitcoin (BTC) — Analyse**

• **Qu'est-ce que Bitcoin ?** La première crypto-monnaie décentralisée, créée en 2009 par Satoshi Nakamoto
• **Supply max:** 21 millions de BTC (environ 19.6M déjà minés)
• **Halving:** Réduction de moitié de la récompense de minage tous les ~4 ans. Le dernier halving a eu lieu en avril 2024, réduisant la récompense à 3.125 BTC par bloc
• **Cycles historiques:** Après chaque halving, BTC a historiquement connu un bull run dans les 12-18 mois suivants
• **Dominance:** BTC représente généralement 40-60% de la capitalisation totale du marché crypto

⚠️ *Ceci n'est pas un conseil financier. Faites vos propres recherches (DYOR).*`,

  // Ethereum
  "ethereum|eth|merge|pos": `📊 **Ethereum (ETH) — Analyse**

• **Qu'est-ce qu'Ethereum ?** Plateforme de smart contracts et dApps, créée par Vitalik Buterin en 2015
• **The Merge (2022):** Transition de Proof of Work à Proof of Stake, réduisant la consommation énergétique de ~99.95%
• **EIP-1559:** Mécanisme de burn qui rend ETH potentiellement déflationniste
• **Layer 2:** Arbitrum, Optimism, Base, zkSync réduisent les frais et augmentent le débit
• **Staking:** ~4-5% APY en stakant ETH (32 ETH minimum pour un validateur solo, ou via des pools)
• **Écosystème:** DeFi ($50B+ TVL), NFTs, GameFi, et des milliers de dApps

⚠️ *Ceci n'est pas un conseil financier.*`,

  // DCA Strategy
  "dca|dollar cost|investir régulièrement": `💡 **Stratégie DCA (Dollar Cost Averaging)**

Le DCA consiste à investir un montant fixe à intervalles réguliers, peu importe le prix.

**Avantages:**
• ✅ Réduit l'impact de la volatilité
• ✅ Élimine le stress du "timing" du marché
• ✅ Discipline d'investissement automatique
• ✅ Idéal pour les débutants

**Exemple concret:**
• Investir 100€/semaine en BTC pendant 1 an = 5 200€ investis
• Historiquement, le DCA sur BTC sur 3+ ans a toujours été profitable

**Comment faire:**
1. Choisir un montant fixe (ex: 50-200€/semaine)
2. Choisir une fréquence (hebdomadaire recommandé)
3. Automatiser via un exchange (Binance, Kraken, Coinbase)
4. Ne jamais investir plus que ce que vous pouvez perdre

⚠️ *Ceci n'est pas un conseil financier.*`,

  // RSI & MACD
  "rsi|macd|indicateur|technique|oscillateur": `📈 **Indicateurs Techniques — RSI & MACD**

**RSI (Relative Strength Index):**
• Oscillateur entre 0 et 100
• **> 70** = Zone de surachat (potentiel retournement baissier)
• **< 30** = Zone de survente (potentiel retournement haussier)
• **Divergences:** Si le prix monte mais le RSI baisse → signal baissier
• Période standard: 14 périodes

**MACD (Moving Average Convergence Divergence):**
• Composé de: Ligne MACD, Ligne Signal, Histogramme
• **Signal d'achat:** MACD croise au-dessus de la ligne signal
• **Signal de vente:** MACD croise en dessous de la ligne signal
• **Histogramme positif croissant** = momentum haussier
• Paramètres standard: 12, 26, 9

**Conseils d'utilisation:**
• Ne jamais utiliser un seul indicateur isolément
• Combiner RSI + MACD + Volume pour plus de fiabilité
• Confirmer avec les supports/résistances
• Les signaux sont plus fiables sur les timeframes élevés (4H, Daily)

⚠️ *Les indicateurs techniques ne garantissent pas les résultats futurs.*`,

  // DeFi
  "defi|finance décentralisée|yield|farming|liquidity": `🏦 **DeFi (Finance Décentralisée)**

**Qu'est-ce que la DeFi ?**
Services financiers sans intermédiaire, fonctionnant sur blockchain via des smart contracts.

**Principaux protocoles:**
• **Aave/Compound:** Prêt et emprunt décentralisé (2-8% APY)
• **Uniswap/SushiSwap:** Échanges décentralisés (DEX)
• **Lido/Rocket Pool:** Staking liquide d'ETH
• **Curve Finance:** Échange de stablecoins à faible slippage
• **MakerDAO:** Émission du stablecoin DAI

**Yield Farming:**
• Fournir de la liquidité à un protocole en échange de récompenses
• APY variable: de 2% à 100%+ (attention aux risques!)
• Risques: Impermanent Loss, smart contract bugs, rug pulls

**Sécurité DeFi:**
• ✅ Utiliser uniquement des protocoles audités
• ✅ Commencer avec de petits montants
• ✅ Diversifier entre plusieurs protocoles
• ❌ Éviter les APY irréalistes (>1000%)
• ❌ Ne jamais approuver des contrats inconnus

⚠️ *La DeFi comporte des risques importants. DYOR.*`,

  // Sécurité
  "sécurité|wallet|portefeuille|ledger|seed|phrase": `🔐 **Sécurité Crypto — Guide Essentiel**

**Types de wallets:**
• **Hardware wallet (cold):** Ledger, Trezor — Le plus sécurisé ✅
• **Software wallet (hot):** MetaMask, Trust Wallet — Pratique mais moins sûr
• **Exchange:** Binance, Coinbase — Custodial, vous ne contrôlez pas vos clés

**Règles d'or:**
1. 🔑 **"Not your keys, not your coins"** — Utilisez un hardware wallet pour les gros montants
2. 📝 **Seed phrase:** Notez-la sur papier, JAMAIS en photo ou en ligne
3. 🛡️ **2FA:** Activez l'authentification à deux facteurs partout
4. ⚠️ **Phishing:** Ne cliquez jamais sur des liens suspects
5. 🔒 **Approvals:** Révoquez régulièrement les autorisations de smart contracts (revoke.cash)

**Répartition recommandée:**
• 80%+ sur hardware wallet (long terme)
• 10-15% sur exchange (trading actif)
• 5% max en DeFi (yield farming)

⚠️ *La sécurité est votre responsabilité. Prenez-la au sérieux.*`,

  // Bear market
  "bear|baisse|crash|chute|peur|panique": `🐻 **Stratégie en Bear Market**

**Caractéristiques d'un bear market:**
• Baisse de 50%+ depuis l'ATH
• Sentiment négatif dominant (Fear & Greed < 25)
• Volume en baisse, capitulation des investisseurs

**Stratégies recommandées:**
1. 💰 **DCA renforcé:** Augmenter ses achats réguliers pendant les baisses
2. 📚 **Éducation:** Profiter du calme pour apprendre
3. 🔍 **Recherche:** Identifier les projets solides qui survivront
4. 💎 **HODL:** Ne pas vendre en panique si votre thèse est intacte
5. 🛡️ **Stablecoins:** Garder une réserve pour acheter les dips

**Ce qu'il NE faut PAS faire:**
• ❌ Vendre en panique au plus bas
• ❌ Utiliser du levier/margin
• ❌ Investir de l'argent dont vous avez besoin
• ❌ Suivre les "influenceurs" qui promettent des gains rapides

**Historique:** Chaque bear market crypto a été suivi d'un nouveau ATH. La patience est clé.

⚠️ *Les performances passées ne garantissent pas les résultats futurs.*`,

  // Altcoins
  "altcoin|alt|solana|sol|cardano|ada|polkadot|dot|avax": `🪙 **Altcoins — Guide**

**Qu'est-ce qu'un altcoin ?**
Toute crypto-monnaie autre que Bitcoin. Il en existe des milliers.

**Catégories principales:**
• **Layer 1:** Solana, Cardano, Avalanche, Polkadot — Blockchains alternatives à Ethereum
• **Layer 2:** Arbitrum, Optimism, Polygon — Solutions de scaling pour Ethereum
• **DeFi:** Aave, Uniswap, Curve — Protocoles de finance décentralisée
• **Meme coins:** DOGE, SHIB, PEPE — Spéculatifs, très volatils
• **AI:** Render, Fetch.ai, Ocean — Intelligence artificielle + blockchain

**Comment évaluer un altcoin:**
1. 📋 **Équipe:** Qui sont les fondateurs ? Expérience ?
2. 💻 **Technologie:** Le projet résout-il un vrai problème ?
3. 📊 **Tokenomics:** Distribution, inflation, utilité du token
4. 🤝 **Communauté:** Taille et engagement de la communauté
5. 💰 **Funding:** Investisseurs et partenariats

**Risques des altcoins:**
• Volatilité 2-5x supérieure à BTC
• 90%+ des altcoins perdent leur valeur à long terme
• Risque de rug pull sur les petits projets

⚠️ *Diversifiez et ne mettez jamais tous vos œufs dans le même panier.*`,

  // Trading
  "trading|scalping|swing|position|levier|leverage|futures": `📊 **Styles de Trading Crypto**

**Scalping (minutes-heures):**
• Trades très courts, petits profits fréquents
• Nécessite: Expérience, rapidité, faibles frais
• Risque: Élevé, stress intense
• Profit cible: 0.5-2% par trade

**Day Trading (heures-1 jour):**
• Positions ouvertes et fermées dans la journée
• Analyse technique intensive
• Nécessite: 4-8h/jour minimum devant les écrans

**Swing Trading (jours-semaines):**
• Capture les "swings" du marché
• Bon équilibre temps/profit
• Idéal pour les traders à temps partiel
• Profit cible: 5-20% par trade

**Position Trading (semaines-mois):**
• Basé sur les tendances macro
• Peu de trades, gros mouvements
• Combine analyse technique et fondamentale

**⚠️ Levier/Futures:**
• Amplifie gains ET pertes
• 90%+ des traders en levier perdent de l'argent
• Risque de liquidation totale
• **Déconseillé aux débutants**

**Gestion du risque:**
• Ne risquer que 1-2% du capital par trade
• Toujours utiliser un stop-loss
• Ratio risque/récompense minimum 1:2

⚠️ *Le trading comporte des risques élevés de perte en capital.*`,

  // Supports & Résistances
  "support|résistance|niveau|zone|breakout|cassure": `📐 **Supports & Résistances**

**Support:** Niveau de prix où la demande est suffisamment forte pour empêcher une baisse supplémentaire.
**Résistance:** Niveau de prix où l'offre est suffisamment forte pour empêcher une hausse supplémentaire.

**Comment les identifier:**
• 🔍 Zones de rebond/rejet historiques
• 📊 Moyennes mobiles (EMA 50, 100, 200)
• 🔢 Niveaux de Fibonacci (0.382, 0.5, 0.618)
• 📈 Lignes de tendance

**Règles clés:**
• Un support cassé devient résistance (et vice versa)
• Plus un niveau est testé, plus il est significatif
• Le volume confirme la validité d'un breakout
• Les niveaux ronds (10K, 50K, 100K) sont psychologiquement importants

⚠️ *Les niveaux techniques sont des zones, pas des prix exacts.*`,

  // NFT
  "nft|non fungible|collection|art|digital": `🎨 **NFTs (Non-Fungible Tokens)**

**Qu'est-ce qu'un NFT ?**
Token unique sur blockchain représentant la propriété d'un actif numérique.

**Cas d'usage:**
• 🎨 Art digital et collectibles
• 🎮 Items de jeux vidéo
• 🎵 Musique et droits d'auteur
• 🏠 Immobilier tokenisé
• 🎫 Billets d'événements

**Plateformes principales:**
• OpenSea, Blur, Magic Eden (Solana)

**Conseils:**
• Recherchez l'artiste/équipe derrière le projet
• Vérifiez le volume de trading et le floor price
• 95%+ des NFTs perdent leur valeur — soyez sélectif

⚠️ *Le marché NFT est très spéculatif.*`,

  // Staking
  "staking|stake|récompense|apy|apr|validateur": `💎 **Staking Crypto**

**Qu'est-ce que le staking ?**
Verrouiller vos cryptos pour sécuriser un réseau Proof of Stake et gagner des récompenses.

**APY approximatifs (variables):**
• ETH: 3-5% APY
• SOL: 6-8% APY
• ADA: 3-5% APY
• DOT: 10-14% APY
• ATOM: 15-20% APY

**Types de staking:**
• **Solo:** Faire tourner son propre validateur (technique, capital élevé)
• **Délégué:** Déléguer à un validateur existant (simple)
• **Liquide:** Lido (stETH), Rocket Pool (rETH) — Garder la liquidité
• **Exchange:** Binance, Kraken — Le plus simple mais custodial

**Risques:**
• Slashing (pénalité si le validateur est malveillant)
• Période de déblocage (7-28 jours selon le réseau)
• Risque de smart contract (staking liquide)

⚠️ *Les APY sont variables et ne sont pas garantis.*`,
};

// Match user input to knowledge base
function findBestResponse(input: string): string {
  const lower = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  let bestMatch = "";
  let bestScore = 0;

  for (const [keywords, response] of Object.entries(KNOWLEDGE_BASE)) {
    const keywordList = keywords.split("|");
    let score = 0;
    for (const kw of keywordList) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length; // Longer matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = response;
    }
  }

  if (bestMatch) return bestMatch;

  // Default response
  return `🤖 **CryptoIA Assistant**

Je n'ai pas trouvé de réponse spécifique à votre question, mais voici ce que je peux vous aider avec:

• 📊 **Bitcoin & Ethereum** — Analyse et fondamentaux
• 💡 **Stratégies** — DCA, swing trading, scalping, gestion du risque
• 📈 **Indicateurs techniques** — RSI, MACD, supports/résistances, Fibonacci
• 🏦 **DeFi** — Yield farming, staking, liquidity pools
• 🔐 **Sécurité** — Wallets, seed phrases, protection
• 🪙 **Altcoins** — Évaluation, catégories, risques
• 🐻 **Bear/Bull market** — Stratégies adaptées
• 🎨 **NFTs** — Comprendre et évaluer
• 💎 **Staking** — APY, types, risques

Essayez de poser une question plus spécifique ! Par exemple:
*"Comment fonctionne le RSI ?"* ou *"Explique la stratégie DCA"*

⚠️ *Je suis un assistant éducatif. Mes réponses ne constituent pas des conseils financiers.*`;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Bonjour ! 👋 Je suis **CryptoIA Assistant**, votre expert crypto intégré.

Je peux vous aider avec:
• 📊 **Analyse de marché** — Bitcoin, Ethereum, altcoins
• 💡 **Stratégies de trading** — DCA, swing, scalping
• 📈 **Indicateurs techniques** — RSI, MACD, Bollinger, supports/résistances
• 🔐 **Sécurité** — Wallets, seed phrases, bonnes pratiques
• 💰 **DeFi & Staking** — Yield farming, APY, protocoles
• 📚 **Éducation** — Fondamentaux, tokenomics, cycles de marché

Posez-moi votre question ! 🚀`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    const query = input.trim();
    setInput("");
    setIsTyping(true);

    // Simulate typing delay for natural feel
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

    const response = findBestResponse(query);
    setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    setIsTyping(false);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat réinitialisé 🔄. Comment puis-je vous aider ? Posez-moi vos questions crypto ! 🤖",
      },
    ]);
  };

  const suggestions = [
    "Analyse le Bitcoin",
    "Explique la stratégie DCA",
    "Comment lire le RSI et MACD ?",
    "Qu'est-ce que la DeFi ?",
    "Comment sécuriser mes cryptos ?",
    "Explique le staking",
    "Stratégie en bear market",
    "C'est quoi les altcoins ?",
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
      if (line.startsWith("• ") || line.startsWith("- ")) {
        return <p key={i} className="ml-2 my-0.5" dangerouslySetInnerHTML={{ __html: italicLine }} />;
      }
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: italicLine }} />;
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen flex flex-col">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[100px] flex-shrink-0 bg-gradient-to-r from-indigo-900/40 to-purple-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/90 via-[#0A0E1A]/60 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Bot className="w-7 h-7 text-indigo-400" />
                <h1 className="text-2xl font-extrabold">Assistant IA Crypto</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> EXPERT INTÉGRÉ
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Base de connaissances crypto complète • Réponses instantanées
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

            {isTyping && (
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
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-2 text-center">
              Base de connaissances intégrée • Les réponses ne constituent pas des conseils financiers
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}