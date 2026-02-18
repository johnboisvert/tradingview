import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface CryptoEvent {
  id: string;
  title: string;
  date: string;
  category: "launch" | "upgrade" | "halving" | "conference" | "regulation" | "airdrop" | "listing";
  importance: "high" | "medium" | "low";
  description: string;
  coin?: string;
}

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  launch: { emoji: "🚀", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", label: "Lancement" },
  upgrade: { emoji: "⬆️", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", label: "Upgrade" },
  halving: { emoji: "⛏️", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Halving" },
  conference: { emoji: "🎤", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", label: "Conférence" },
  regulation: { emoji: "⚖️", color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Régulation" },
  airdrop: { emoji: "🎁", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Airdrop" },
  listing: { emoji: "📋", color: "text-pink-400 bg-pink-500/10 border-pink-500/20", label: "Listing" },
};

function generateEvents(year: number, month: number): CryptoEvent[] {
  const events: CryptoEvent[] = [];
  const coins = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "LINK", "DOT", "MATIC", "ARB", "OP"];
  const importances: CryptoEvent["importance"][] = ["high", "medium", "low"];

  const eventTemplates: { title: string; category: CryptoEvent["category"] }[] = [
    { title: "Mise à jour réseau {coin}", category: "upgrade" },
    { title: "Conférence Blockchain {coin}", category: "conference" },
    { title: "Airdrop communautaire {coin}", category: "airdrop" },
    { title: "Listing sur exchange majeur — {coin}", category: "listing" },
    { title: "Lancement mainnet {coin}", category: "launch" },
    { title: "Vote gouvernance {coin}", category: "regulation" },
    { title: "Halving prévu {coin}", category: "halving" },
    { title: "Hard fork {coin}", category: "upgrade" },
    { title: "Partenariat stratégique {coin}", category: "launch" },
    { title: "Burn de tokens {coin}", category: "airdrop" },
    { title: "Intégration DeFi {coin}", category: "launch" },
    { title: "Rapport trimestriel {coin}", category: "conference" },
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const numEvents = 12 + Math.floor(Math.random() * 8);

  for (let i = 0; i < numEvents; i++) {
    const day = 1 + Math.floor(Math.random() * daysInMonth);
    const template = eventTemplates[i % eventTemplates.length];
    const coin = coins[Math.floor(Math.random() * coins.length)];
    const importance = importances[Math.floor(Math.random() * importances.length)];

    events.push({
      id: `evt-${i}`,
      title: template.title.replace("{coin}", coin),
      date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      category: template.category,
      importance,
      description: `Événement important pour l'écosystème ${coin}. Surveillez les mouvements de prix autour de cette date.`,
      coin,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export default function Calendrier() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CryptoEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  useEffect(() => {
    setEvents(generateEvents(year, month));
  }, [year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr && (filterCategory === "all" || e.category === filterCategory));
  };

  const selectedEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate && (filterCategory === "all" || e.category === filterCategory))
    : [];

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const filteredEvents = filterCategory === "all" ? events : events.filter((e) => e.category === filterCategory);

  const displayEvents = selectedDate ? selectedEvents : filteredEvents.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Calendar className="w-7 h-7 text-cyan-400" />
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Calendrier Crypto
            </h1>
          </div>
          <p className="text-sm text-gray-400">Événements importants du marché crypto — Lancements, upgrades, airdrops et plus</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              filterCategory === "all" ? "bg-white/[0.1] text-white border-white/[0.2]" : "bg-white/[0.03] text-gray-400 border-white/[0.06]"
            }`}>
            Tous ({events.length})
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const count = events.filter((e) => e.category === key).length;
            return (
              <button key={key} onClick={() => setFilterCategory(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  filterCategory === key ? config.color : "bg-white/[0.03] text-gray-400 border-white/[0.06]"
                }`}>
                {config.emoji} {config.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-all">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold capitalize">{monthName}</h2>
                <button onClick={nextMonth} className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                  <div key={d} className="text-center text-[10px] uppercase tracking-wider text-gray-500 font-semibold py-2">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayEvents = getEventsForDay(day);
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;

                  return (
                    <button key={day} onClick={() => setSelectedDate(dateStr)}
                      className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-start transition-all ${
                        isSelected ? "bg-cyan-500/20 border border-cyan-500/40" :
                        isToday ? "bg-white/[0.06] border border-white/[0.15]" :
                        dayEvents.length > 0 ? "bg-white/[0.02] hover:bg-white/[0.05] border border-transparent" :
                        "hover:bg-white/[0.03] border border-transparent"
                      }`}>
                      <span className={`text-sm font-bold ${isToday ? "text-cyan-400" : isSelected ? "text-white" : "text-gray-300"}`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                          {dayEvents.slice(0, 3).map((e, j) => (
                            <div key={j} className={`w-1.5 h-1.5 rounded-full ${
                              e.importance === "high" ? "bg-red-400" :
                              e.importance === "medium" ? "bg-amber-400" : "bg-blue-400"
                            }`} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Event Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold">
              {selectedDate
                ? `Événements — ${new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
                : "Prochains Événements"}
            </h2>

            {displayEvents.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 text-center">
                <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucun événement pour cette date</p>
              </div>
            ) : (
              displayEvents.map((event) => {
                const config = CATEGORY_CONFIG[event.category];
                return (
                  <div key={event.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-all">
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">{config.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-sm truncate">{event.title}</h3>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            event.importance === "high" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            event.importance === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}>
                            {event.importance === "high" ? "⚡ Important" : event.importance === "medium" ? "📌 Moyen" : "ℹ️ Info"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{event.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-600">
                            📅 {new Date(event.date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </span>
                          {event.coin && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${config.color}`}>
                              {event.coin}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Legend */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-500 mb-2">Légende</h3>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-red-400" /> Important
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-amber-400" /> Moyen
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-blue-400" /> Info
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" /> Aujourd'hui
                </div>
              </div>
            </div>

            {/* How to use */}
            <div className="bg-gradient-to-r from-cyan-500/[0.06] to-blue-500/[0.06] border border-cyan-500/20 rounded-xl p-4">
              <h3 className="text-xs font-bold text-cyan-400 mb-2">💡 Conseils</h3>
              <ul className="space-y-1.5 text-[10px] text-gray-400">
                <li>• Cliquez sur un jour pour voir les événements détaillés</li>
                <li>• Utilisez les filtres pour cibler un type d'événement</li>
                <li>• Les événements ⚡ Important peuvent impacter les prix</li>
                <li>• Planifiez vos trades autour des dates clés</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}