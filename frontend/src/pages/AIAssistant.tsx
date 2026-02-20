import { useState, useRef, useEffect, useCallback } from "react";
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

const GEMINI_API_KEY = "AIzaSyB2w7Gmrzk9HxwyxCabKZIdR8Kq7KvI1Hg";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

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
  { label: "Dois-je vendre mon BTC ?",          icon: "🤔" },
  { label: "Quelle crypto acheter cette semaine ?", icon: "🎯" },
  { label: "Quel est le sentiment du marché ?",  icon: "📊" },
  { label: "Analyse mon portfolio",              icon: "💼" },
  { label: "Quels sont les risques actuels ?",   icon: "⚠️" },
  { label: "Explique la stratégie DCA",          icon: "📈" },
  { label: "Meilleurs altcoins à surveiller",    icon: "🔭" },
  { label: "Comment lire le RSI et MACD ?",      icon: "📉" },
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

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error("Gemini API error:", err);
    throw new Error(`Erreur API: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Réponse vide de l'API");
  return text;
}

// ─── Render markdown-like content ────────────────────────────────────────────

function renderContent(content: string) {
  return content.split("\n").map((line, i) => {
    let processed = line;
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em class="text-gray-400 italic">$1</em>');
    processed = processed.replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-cyan-300 text-xs">$1</code>');

    if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
      return <p key={i} className="ml-2 my-0.5 text-sm" dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    if (/^\d+\./.test(line.trim())) {
      return <p key={i} className="ml-2 my-0.5 text-sm" dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    if (line.trim() === "") return <br key={i} />;
    return <p key={i} className="my-0.5 text-sm" dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

// ─── Portfolio Panel ──────────────────────────────────────────────────────────

function PortfolioPanel() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-slate-900/60 border border-white/[0.07] rounded-2xl overflow-hidden flex-shrink-0">
      {/* Header */}
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
          {/* Total */}
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

          {/* Assets */}
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
                  {/* Allocation bar */}
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

          {/* Quick stats */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
            <div className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[10px] font-bold">
                {PORTFOLIO.filter((a) => a.weekChange >= 0).length} en hausse
              </span>
            </div>
            <div className="flex items-center gap-1 text-red-400">
              <TrendingDown className="w-3 h-3" />
              <span className="text-[10px] font-bold">
                {PORTFOLIO.filter((a) => a.weekChange < 0).length} en baisse
              </span>
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Hide suggestions after first user message
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
        setMessages((prev) => [...prev, { role: "assistant", content: response, timestamp: Date.now() }]);
      } catch (error) {
        console.error("AI Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            timestamp: Date.now(),
            content: `❌ **Erreur de connexion à l'IA**\n\nDésolé, je n'ai pas pu obtenir une réponse. Cela peut être dû à :\n• Une limite de requêtes atteinte (15/minute pour l'API gratuite)\n• Un problème de connexion réseau\n\nVeuillez réessayer dans quelques secondes ! 🔄\n\n*Si le problème persiste, rafraîchissez la page.*`,
          },
        ]);
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
    localStorage.removeItem(STORAGE_KEY);
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
        <div className="max-w-[1440px] mx-auto px-6 py-6">
          <PageHeader
            icon={<Bot className="w-6 h-6" />}
            title="Assistant IA Conversationnel"
            subtitle="Votre assistant IA crypto personnel, propulsé par Google Gemini. Il connaît votre portfolio, analyse le marché en temps réel et répond à toutes vos questions en français."
            accentColor="purple"
            steps={[
              { n: "1", title: "Posez votre question ou choisissez une suggestion", desc: "Tapez votre question ou cliquez sur une suggestion prédéfinie. L'IA comprend le contexte de votre portfolio et du marché actuel." },
              { n: "2", title: "L'IA analyse votre portfolio et le marché", desc: "Google Gemini AI analyse votre question en tenant compte de vos positions actuelles, des tendances du marché et des indicateurs techniques." },
              { n: "3", title: "Recevez des conseils personnalisés", desc: "Obtenez des réponses détaillées et personnalisées. Posez des questions de suivi — l'IA garde le contexte de toute la conversation." },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
            {/* ── Left: Portfolio + Suggestions ── */}
            <div className="space-y-4">
              <PortfolioPanel />

              {/* Suggestions panel */}
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

              {/* Clear history */}
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
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-black text-white">CryptoIA Assistant</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Gemini AI
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
                {/* Welcome suggestions overlay */}
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

                {/* Typing indicator */}
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
                  Propulsé par Google Gemini AI • Historique sauvegardé localement • Les réponses ne constituent pas des conseils financiers
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