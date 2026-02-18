import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Bot, Send, Trash2 } from "lucide-react";

const AI_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/4b6e1138-5e13-42c7-9e5d-95ba3808c41a.png";

interface Message { role: "user" | "assistant"; content: string; }

const CRYPTO_KNOWLEDGE: Record<string, string> = {
  "bitcoin": "Bitcoin (BTC) est la première et plus grande crypto-monnaie par capitalisation. Créé en 2009 par Satoshi Nakamoto, il utilise la preuve de travail (PoW). Supply max: 21M BTC. Utilisé comme réserve de valeur ('or numérique').",
  "ethereum": "Ethereum (ETH) est la 2ème plus grande crypto. Plateforme de smart contracts créée par Vitalik Buterin en 2015. Passé en Proof of Stake (PoS) avec The Merge. Utilisé pour DeFi, NFTs, et dApps.",
  "solana": "Solana (SOL) est une blockchain haute performance avec ~65,000 TPS. Utilise Proof of History (PoH) + PoS. Populaire pour DeFi et NFTs grâce à ses frais très bas.",
  "dca": "Le DCA (Dollar Cost Averaging) consiste à investir un montant fixe à intervalles réguliers, réduisant l'impact de la volatilité. Stratégie recommandée pour les débutants.",
  "rsi": "Le RSI (Relative Strength Index) est un indicateur technique oscillant entre 0-100. RSI < 30 = survendu (signal d'achat potentiel). RSI > 70 = suracheté (signal de vente potentiel).",
  "defi": "DeFi (Finance Décentralisée) désigne les services financiers sur blockchain sans intermédiaires. Inclut: lending, borrowing, DEX, yield farming. TVL total > $100B.",
  "nft": "Les NFTs (Non-Fungible Tokens) sont des tokens uniques sur blockchain représentant la propriété d'actifs numériques: art, musique, gaming, immobilier virtuel.",
  "staking": "Le staking consiste à verrouiller ses cryptos pour sécuriser un réseau PoS et recevoir des récompenses. Rendements typiques: 3-15% APY selon le réseau.",
  "halving": "Le halving Bitcoin réduit de moitié la récompense des mineurs tous les ~4 ans. Historiquement suivi de bull runs. Prochain halving prévu en 2028.",
  "altcoin": "Les altcoins sont toutes les cryptos autres que Bitcoin. Incluent ETH, SOL, ADA, etc. Souvent plus volatils que BTC avec un potentiel de gains (et pertes) plus élevé.",
  "bull": "Un bull market (marché haussier) est caractérisé par des prix en hausse prolongée. Indicateurs: volumes élevés, sentiment positif, nouveaux ATH fréquents.",
  "bear": "Un bear market (marché baissier) est caractérisé par des baisses prolongées (-20%+ depuis l'ATH). Stratégie: DCA, accumulation, réduction du risque.",
  "wallet": "Un wallet crypto stocke vos clés privées. Types: hot wallet (connecté internet, pratique) et cold wallet (hors ligne, plus sécurisé). Exemples: MetaMask, Ledger.",
  "leverage": "Le trading avec levier amplifie gains ET pertes. Levier 10x = un mouvement de 10% donne 100%. Risque de liquidation élevé. Déconseillé aux débutants.",
  "support": "Un support est un niveau de prix où la demande est suffisamment forte pour empêcher une baisse. Utilisé en analyse technique pour identifier les points d'entrée.",
  "resistance": "Une résistance est un niveau de prix où l'offre empêche une hausse. La cassure d'une résistance est souvent un signal haussier (breakout).",
};

function getAIResponse(query: string): string {
  const q = query.toLowerCase();

  for (const [key, value] of Object.entries(CRYPTO_KNOWLEDGE)) {
    if (q.includes(key)) return value;
  }

  if (q.includes("bonjour") || q.includes("salut") || q.includes("hello"))
    return "Bonjour ! 👋 Je suis votre assistant IA crypto. Posez-moi des questions sur Bitcoin, Ethereum, le DCA, le RSI, la DeFi, le staking, ou toute autre question crypto !";

  if (q.includes("investir") || q.includes("acheter") || q.includes("commencer"))
    return "Pour commencer en crypto: 1) Éduquez-vous sur les fondamentaux 2) N'investissez que ce que vous pouvez perdre 3) Commencez par BTC/ETH 4) Utilisez le DCA 5) Sécurisez vos cryptos avec un cold wallet 6) Diversifiez votre portfolio. ⚠️ Ceci n'est pas un conseil financier.";

  if (q.includes("meilleur") || q.includes("top") || q.includes("recommand"))
    return "Les cryptos les plus établies sont BTC et ETH. Pour les altcoins prometteurs, regardez: SOL (haute performance), LINK (oracles), AAVE (DeFi), ARB/OP (Layer 2). Faites toujours vos propres recherches (DYOR). ⚠️ Ceci n'est pas un conseil financier.";

  if (q.includes("risque") || q.includes("danger") || q.includes("perte"))
    return "Risques principaux en crypto: 1) Volatilité extrême 2) Piratage/scams 3) Régulation 4) Perte de clés privées 5) Liquidation (levier). Règles: ne jamais investir plus que ce qu'on peut perdre, utiliser un stop loss, diversifier.";

  if (q.includes("2026") || q.includes("prédiction") || q.includes("futur"))
    return "Personne ne peut prédire le marché avec certitude. Facteurs à surveiller: adoption institutionnelle, régulation, halving BTC 2028, développement DeFi/L2, macro-économie. Utilisez notre page Prédictions IA pour des analyses basées sur les données. ⚠️ Ceci n'est pas un conseil financier.";

  return `Merci pour votre question ! Voici ce que je peux vous dire:\n\nLe marché crypto est en constante évolution. Pour des analyses détaillées, utilisez nos outils:\n• 📊 Dashboard - Vue d'ensemble du marché\n• 🔮 Prédictions IA - Analyses prédictives\n• 😨 Fear & Greed - Sentiment du marché\n• 📈 Analyse Technique - Indicateurs RSI, MACD\n\nPosez-moi des questions sur: Bitcoin, Ethereum, Solana, DCA, RSI, DeFi, NFT, staking, halving, altcoins, bull/bear market, wallets, leverage, support/résistance.`;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Bonjour ! 👋 Je suis votre assistant IA crypto. Je peux vous aider avec:\n\n• 📊 Analyse de marché et tendances\n• 💡 Stratégies de trading (DCA, swing, scalping)\n• 📈 Indicateurs techniques (RSI, MACD, supports)\n• 🔐 Sécurité et wallets\n• 📚 Éducation crypto\n\nQue souhaitez-vous savoir ?" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(userMsg.content);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: "Chat réinitialisé. Comment puis-je vous aider ? 🤖" }]);
  };

  const suggestions = ["Qu'est-ce que le Bitcoin ?", "Comment fonctionne le DCA ?", "Explique le RSI", "C'est quoi la DeFi ?", "Comment commencer en crypto ?", "Qu'est-ce que le staking ?"];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen flex flex-col">
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[120px] flex-shrink-0">
          <img src={AI_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Bot className="w-7 h-7 text-indigo-400" />
                <h1 className="text-2xl font-extrabold">Assistant IA Crypto</h1>
              </div>
              <p className="text-sm text-gray-400">Posez vos questions sur le marché crypto, les stratégies et l'analyse</p>
            </div>
            <button onClick={clearChat}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <Trash2 className="w-4 h-4" /> Effacer
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-[#111827] border border-white/[0.06] rounded-2xl flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    : "bg-white/[0.05] border border-white/[0.06]"
                }`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-400">CryptoIA Assistant</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
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
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="px-6 pb-3">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => { setInput(s); }}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-semibold text-gray-400 hover:text-white transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/[0.06]">
            <div className="flex gap-3">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Posez votre question crypto..."
                className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50" />
              <button onClick={sendMessage} disabled={!input.trim() || isTyping}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 transition-all disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}