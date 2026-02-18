import Sidebar from "@/components/Sidebar";
import { useState } from "react";

const SUGGESTIONS = [
  "Quelle est la tendance actuelle du Bitcoin?",
  "Analyse le graphique de SOL/USDT",
  "Quels altcoins surveiller cette semaine?",
  "Explique-moi le RSI et le MACD",
  "Stratégie DCA vs Swing Trading?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour! Je suis votre assistant IA de trading crypto. Comment puis-je vous aider aujourd'hui? 🤖" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev,
      { role: "user", content: text },
      { role: "assistant", content: `Analyse en cours pour: "${text}"...\n\nBasé sur les données actuelles du marché, voici mon analyse:\n\n📊 Le marché montre des signes de force avec un volume en hausse de 15% sur 24h.\n\n🎯 Points clés:\n• Support majeur: $94,500\n• Résistance: $98,200\n• RSI: 62 (zone neutre-haussière)\n\n💡 Recommandation: Maintenir les positions longues avec un stop loss à $93,800.` },
    ]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8 flex flex-col h-screen">
        <h1 className="text-3xl font-bold text-white mb-2">🤖 AI Assistant</h1>
        <p className="text-gray-400 mb-6">Votre assistant intelligent pour le trading crypto</p>

        {/* Chat Area */}
        <div className="flex-1 bg-[#111827] rounded-2xl border border-white/[0.06] flex flex-col overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${m.role === "user" ? "bg-indigo-500 text-white" : "bg-white/[0.05] text-gray-200"}`}>
                  <p className="text-sm whitespace-pre-line">{m.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          <div className="px-6 py-3 border-t border-white/[0.06] flex gap-2 overflow-x-auto">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)}
                className="px-3 py-1.5 rounded-full bg-white/[0.05] text-gray-300 text-xs font-medium hover:bg-white/[0.1] transition-colors whitespace-nowrap flex-shrink-0">
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/[0.06]">
            <div className="flex gap-3">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Posez votre question..."
                className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none" />
              <button onClick={() => sendMessage(input)}
                className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-colors">
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}