import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Bot, Send, Trash2, Loader2 } from "lucide-react";

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
- Ajoute des emojis pertinents
- Mentionne toujours que ce ne sont pas des conseils financiers
- Utilise des exemples concrets
- Structure tes réponses avec des bullet points`;

// Predefined responses for common questions when AI is unavailable
const FALLBACK_RESPONSES: Record<string, string> = {
  bitcoin: "📊 **Bitcoin (BTC)** est la première et plus grande cryptomonnaie par capitalisation.\n\n• 💰 Offre limitée à **21 millions** de BTC\n• ⛏️ Le dernier halving a eu lieu en **avril 2024** (récompense: 3.125 BTC/bloc)\n• 📈 Historiquement, BTC atteint un nouvel ATH **12-18 mois** après chaque halving\n• 👑 Représente environ **50-60%** de la capitalisation totale du marché crypto\n\nPour suivre le prix en temps réel, consultez notre page **Graphiques** ! 📈\n\n⚠️ Ceci n'est pas un conseil financier. Faites vos propres recherches (DYOR).",
  dca: "📊 **La stratégie DCA (Dollar Cost Averaging)**\n\nLe DCA consiste à investir un **montant fixe** à **intervalles réguliers**, peu importe le prix.\n\n• ✅ **Avantages** :\n  - Élimine le stress du timing\n  - Réduit l'impact de la volatilité\n  - Discipline d'investissement\n  - Historiquement très rentable sur 4+ ans\n\n• 📋 **Comment faire** :\n  1. Choisissez un montant fixe (ex: 100$/semaine)\n  2. Choisissez un intervalle (hebdomadaire recommandé)\n  3. Achetez automatiquement, peu importe le prix\n  4. N'arrêtez JAMAIS en bear market !\n\n• 💡 **DCA Intelligent** : Investissez plus quand le RSI < 30, moins quand RSI > 70\n\n⚠️ Ceci n'est pas un conseil financier.",
  rsi: "📈 **RSI (Relative Strength Index)** et **MACD**\n\n**RSI (14)** :\n• Échelle 0-100\n• > 70 = **Suracheté** (potentiel retournement baissier)\n• < 30 = **Survendu** (potentiel rebond)\n• Les **divergences** sont les signaux les plus puissants\n• En bull market, achetez quand RSI revient à 40-45\n\n**MACD (12, 26, 9)** :\n• Croisement MACD/Signal = signal d'achat/vente\n• L'histogramme montre la force du momentum\n• Utilisez-le pour CONFIRMER, pas pour initier\n\n💡 Consultez notre page **Graphiques** pour voir ces indicateurs en temps réel !\n\n⚠️ Ceci n'est pas un conseil financier.",
  defi: "🏦 **La DeFi (Finance Décentralisée)**\n\nLa DeFi reproduit les services financiers via des smart contracts.\n\n• 🔄 **DEX** (Uniswap, Jupiter) : Échanges décentralisés\n• 💰 **Lending** (Aave, Compound) : Prêts/emprunts\n• 🌾 **Yield Farming** : Fournir de la liquidité pour des récompenses\n• 🥩 **Staking** : Verrouiller des tokens pour sécuriser le réseau\n\n**Risques** :\n• ⚠️ Smart contract risk (bugs, hacks)\n• ⚠️ Impermanent Loss pour les LPs\n• ⚠️ Rug pulls sur les nouveaux protocoles\n\n💡 Commencez par les protocoles établis (Aave, Uniswap) !\n\n⚠️ Ceci n'est pas un conseil financier.",
  securite: "🔐 **Sécuriser vos cryptos**\n\n**Règles essentielles** :\n\n• 🔑 **Hardware Wallet** (Ledger, Trezor) pour le long terme\n• 🔒 **2FA** activé sur TOUS vos comptes (Google Authenticator, pas SMS)\n• 📝 **Seed phrase** : notée sur papier, JAMAIS en photo/cloud\n• 🏦 **Ne laissez JAMAIS** plus que nécessaire sur un exchange\n\n**Bonnes pratiques** :\n• Utilisez un email dédié pour les exchanges\n• Vérifiez toujours les URLs (phishing)\n• Ne cliquez JAMAIS sur des liens dans les DMs\n• Diversifiez entre plusieurs wallets\n\n💡 'Not your keys, not your coins' — FTX (2022) l'a prouvé.\n\n⚠️ Ceci n'est pas un conseil financier.",
  halving: "⛏️ **Le Halving Bitcoin**\n\nLe halving divise la récompense des mineurs par 2 tous les ~4 ans.\n\n• 2012 : 50 → 25 BTC (prix: ~$12 → ATH $1,100)\n• 2016 : 25 → 12.5 BTC (prix: ~$650 → ATH $20,000)\n• 2020 : 12.5 → 6.25 BTC (prix: ~$8,700 → ATH $69,000)\n• 2024 : 6.25 → 3.125 BTC (prix: ~$64,000 → ???)\n\n**Impact** :\n• Réduit l'offre de nouveaux BTC\n• Historiquement suivi d'un bull market 12-18 mois après\n• Rendements décroissants à chaque cycle\n• Le dernier BTC sera miné vers 2140\n\n💡 Consultez notre page **Bull Run Phase** pour suivre le cycle !\n\n⚠️ Ceci n'est pas un conseil financier.",
  default: "Merci pour votre question ! 🤖\n\nJe suis CryptoIA Assistant, spécialisé en crypto et trading. Voici ce que je peux vous aider avec :\n\n• 📊 **Analyse de marché** — Bitcoin, Ethereum, altcoins\n• 💡 **Stratégies** — DCA, swing trading, scalping\n• 📈 **Indicateurs** — RSI, MACD, Bollinger, EMA\n• 🔐 **Sécurité** — Wallets, 2FA, seed phrases\n• 🏦 **DeFi** — Staking, yield farming, lending\n• ⛏️ **Fondamentaux** — Halving, tokenomics\n\nPosez-moi une question plus spécifique et je ferai de mon mieux pour vous aider ! 🚀\n\n⚠️ Rappel : mes réponses ne constituent pas des conseils financiers.",
};

function getFallbackResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("bitcoin") || lower.includes("btc")) return FALLBACK_RESPONSES.bitcoin;
  if (lower.includes("dca") || lower.includes("dollar cost")) return FALLBACK_RESPONSES.dca;
  if (lower.includes("rsi") || lower.includes("macd") || lower.includes("indicateur")) return FALLBACK_RESPONSES.rsi;
  if (lower.includes("defi") || lower.includes("yield") || lower.includes("staking")) return FALLBACK_RESPONSES.defi;
  if (lower.includes("sécuri") || lower.includes("wallet") || lower.includes("ledger") || lower.includes("hack")) return FALLBACK_RESPONSES.securite;
  if (lower.includes("halving") || lower.includes("cycle")) return FALLBACK_RESPONSES.halving;
  return FALLBACK_RESPONSES.default;
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
  const [streamingContent, setStreamingContent] = useState("");
  const [aiAvailable, setAiAvailable] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const currentInput = input.trim();
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setStreamingContent("");

    // Try AI first, fallback to predefined responses
    if (aiAvailable) {
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
          model: "deepseek-v3.2",
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
              { role: "assistant", content: fullContent || getFallbackResponse(currentInput) },
            ]);
            setStreamingContent("");
            setIsTyping(false);
          },
          onError: () => {
            // AI failed, use fallback
            setAiAvailable(false);
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: getFallbackResponse(currentInput) },
            ]);
            setStreamingContent("");
            setIsTyping(false);
          },
          timeout: 30000,
        });
      } catch {
        // AI not available, use fallback
        setAiAvailable(false);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: getFallbackResponse(currentInput) },
        ]);
        setStreamingContent("");
        setIsTyping(false);
      }
    } else {
      // Use fallback responses
      await new Promise((r) => setTimeout(r, 800));
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: getFallbackResponse(currentInput) },
      ]);
      setStreamingContent("");
      setIsTyping(false);
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
    "Comment sécuriser mes cryptos ?",
    "Explique le halving Bitcoin",
    "Meilleurs altcoins à surveiller ?",
    "Stratégie pour un bear market",
  ];

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
      if (line.startsWith("• ") || line.startsWith("- ")) {
        return <p key={i} className="ml-2 my-0.5" dangerouslySetInnerHTML={{ __html: boldLine }} />;
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
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${aiAvailable ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {aiAvailable ? "AI POWERED" : "MODE LOCAL"}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {aiAvailable ? "Propulsé par DeepSeek V3 • Réponses intelligentes en temps réel" : "Réponses pré-configurées • Base de connaissances crypto intégrée"}
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
                    <span className="text-xs text-gray-500 ml-2">Réflexion en cours...</span>
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
              {aiAvailable ? "Propulsé par DeepSeek V3" : "Mode local — Base de connaissances intégrée"} • Les réponses ne constituent pas des conseils financiers
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}