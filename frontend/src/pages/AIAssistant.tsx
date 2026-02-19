import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Bot, Send, Trash2, Sparkles, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GEMINI_API_KEY = "AIzaSyB2w7Gmrzk9HxwyxCabKZIdR8Kq7KvI1Hg";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Tu es CryptoIA Assistant, un expert en crypto-monnaies et trading. Tu réponds TOUJOURS en français.

Tes domaines d'expertise :
- Analyse technique (RSI, MACD, Bollinger, Fibonacci, supports/résistances)
- Analyse fondamentale des crypto-monnaies (Bitcoin, Ethereum, altcoins)
- Stratégies de trading (DCA, swing trading, scalping, position trading)
- DeFi (yield farming, staking, liquidity pools, protocoles)
- Sécurité crypto (wallets, seed phrases, bonnes pratiques)
- NFTs, tokenomics, cycles de marché
- Actualités et tendances du marché crypto

Règles :
1. Réponds toujours en français
2. Sois précis, informatif et pédagogique
3. Utilise des emojis pour rendre tes réponses visuelles (📊📈💡🔐💎🪙)
4. Ajoute toujours un avertissement : "⚠️ Ceci n'est pas un conseil financier. Faites vos propres recherches (DYOR)."
5. Structure tes réponses avec des titres en gras et des listes à puces
6. Si on te pose une question hors sujet crypto, réponds brièvement puis redirige vers la crypto
7. Donne des données et chiffres concrets quand possible
8. Mentionne les risques associés à chaque stratégie ou investissement`;

async function callGeminiAPI(messages: Message[]): Promise<string> {
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  // Add system instruction as the first user message if not present
  if (contents.length > 0 && contents[0].parts[0].text !== SYSTEM_PROMPT) {
    contents.unshift({
      role: "user",
      parts: [{ text: SYSTEM_PROMPT }],
    });
    contents.splice(1, 0, {
      role: "model",
      parts: [{ text: "Compris ! Je suis CryptoIA Assistant, prêt à vous aider avec toutes vos questions crypto en français. 🚀" }],
    });
  }

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Gemini API error:", errorData);
    throw new Error(`Erreur API: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Réponse vide de l'API");
  return text;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Bonjour ! 👋 Je suis **CryptoIA Assistant**, propulsé par **Google Gemini AI** 🧠

Je suis un vrai assistant IA capable de répondre à toutes vos questions crypto en temps réel :

• 📊 **Analyse de marché** — Bitcoin, Ethereum, altcoins, tendances actuelles
• 💡 **Stratégies de trading** — DCA, swing, scalping, gestion du risque
• 📈 **Indicateurs techniques** — RSI, MACD, Bollinger, Fibonacci, supports/résistances
• 🔐 **Sécurité** — Wallets, seed phrases, bonnes pratiques
• 💰 **DeFi & Staking** — Yield farming, APY, protocoles
• 📚 **Éducation** — Fondamentaux, tokenomics, cycles de marché
• 🌐 **Actualités** — Tendances, régulations, événements importants

Posez-moi n'importe quelle question ! 🚀`,
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
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await callGeminiAPI(updatedMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ **Erreur de connexion à l'IA**

Désolé, je n'ai pas pu obtenir une réponse. Cela peut être dû à :
• Une limite de requêtes atteinte (15/minute pour l'API gratuite)
• Un problème de connexion réseau

Veuillez réessayer dans quelques secondes ! 🔄

*Si le problème persiste, rafraîchissez la page.*`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat réinitialisé 🔄. Je suis prêt ! Posez-moi vos questions crypto ! 🤖🚀",
      },
    ]);
  };

  const suggestions = [
    "Analyse le Bitcoin en 2025",
    "Explique la stratégie DCA",
    "Comment lire le RSI et MACD ?",
    "Qu'est-ce que la DeFi ?",
    "Comment sécuriser mes cryptos ?",
    "Prédictions Ethereum 2025",
    "Meilleurs altcoins à surveiller",
    "Stratégie en bear market",
  ];

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      let processed = line;
      // Bold
      processed = processed.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="text-white font-semibold">$1</strong>'
      );
      // Italic
      processed = processed.replace(
        /\*(.*?)\*/g,
        '<em class="text-gray-400 italic">$1</em>'
      );
      // Code inline
      processed = processed.replace(
        /`(.*?)`/g,
        '<code class="bg-white/10 px-1 rounded text-cyan-300 text-xs">$1</code>'
      );

      if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
        return <p key={i} className="ml-2 my-0.5" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      if (/^\d+\./.test(line.trim())) {
        return <p key={i} className="ml-2 my-0.5" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 flex flex-col" style={{ height: "100vh" }}>
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-4 flex-shrink-0 bg-gradient-to-r from-indigo-900/40 to-purple-900/40" style={{ height: "80px" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/90 via-[#0A0E1A]/60 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Bot className="w-6 h-6 text-indigo-400" />
                <h1 className="text-xl font-extrabold">Assistant IA Crypto</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> GOOGLE GEMINI AI
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Intelligence artificielle Google Gemini • Réponses en temps réel • Expert crypto
              </p>
            </div>
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all"
            >
              <Trash2 className="w-4 h-4" /> Effacer
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-[#111827] border border-white/[0.06] rounded-2xl flex flex-col overflow-hidden" style={{ minHeight: "0" }}>
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
                      <span className="text-[9px] text-gray-600">• Gemini AI</span>
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
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    <span className="text-xs text-gray-400">Gemini AI analyse votre question...</span>
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
                placeholder="Posez votre question crypto à l'IA... (ex: Analyse le Bitcoin, Prédictions ETH 2025)"
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
              Propulsé par Google Gemini AI • Les réponses ne constituent pas des conseils financiers
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}