import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Bot, Send, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@metagptx/web-sdk";

const client = createClient();

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

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour ! 👋 Je suis votre assistant IA crypto propulsé par **Google Gemini**. Je peux vous aider avec:\n\n• 📊 **Analyse de marché** et tendances en temps réel\n• 💡 **Stratégies de trading** (DCA, swing, scalping)\n• 📈 **Indicateurs techniques** (RSI, MACD, Bollinger, EMA)\n• 🔐 **Sécurité** et wallets\n• 💰 **DeFi**, staking et yield farming\n• 📚 **Éducation crypto** pour tous niveaux\n\nQue souhaitez-vous savoir ? 🚀",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setStreamingContent("");

    const chatHistory = [...messages, userMsg].map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const recentHistory = chatHistory.slice(-20);
    let fullContent = "";

    try {
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
            { role: "assistant", content: fullContent || "Désolé, je n'ai pas pu générer de réponse. Veuillez réessayer." },
          ]);
          setStreamingContent("");
          setIsTyping(false);
        },
        onError: (error: { message?: string }) => {
          console.error("AI Error:", error);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `⚠️ Erreur de connexion IA: ${error?.message || "Erreur inconnue"}. Veuillez réessayer dans quelques instants.`,
            },
          ]);
          setStreamingContent("");
          setIsTyping(false);
        },
        timeout: 60000,
      });
    } catch (err) {
      console.error("AI Error:", err);
      const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Erreur: ${errorMsg}. Veuillez réessayer.`,
        },
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
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                  GOOGLE GEMINI
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Propulsé par Google Gemini 2.5 Pro • Réponses intelligentes en streaming
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
                    <span className="text-xs text-gray-500 ml-2">Gemini réfléchit...</span>
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
              Propulsé par Google Gemini 2.5 Pro • Les réponses ne constituent pas des conseils financiers
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}