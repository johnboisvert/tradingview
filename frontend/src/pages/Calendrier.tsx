import { useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { Calendar, ChevronLeft, ChevronRight, Globe, Landmark, TrendingUp, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  category: "fed" | "ecb" | "crypto" | "economic" | "regulation" | "earnings" | "conference";
  importance: "high" | "medium" | "low";
  description: string;
  country?: string;
}

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  fed: { emoji: "🏛️", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", label: "FED" },
  ecb: { emoji: "🇪🇺", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", label: "BCE" },
  crypto: { emoji: "₿", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Crypto" },
  economic: { emoji: "📊", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", label: "Économique" },
  regulation: { emoji: "⚖️", color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Régulation" },
  earnings: { emoji: "💰", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Résultats" },
  conference: { emoji: "🎤", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", label: "Conférence" },
};

// Real-world economic & crypto events for 2025-2026
function getRealEvents(): CalendarEvent[] {
  return [
    // FED Meetings 2026 (FOMC scheduled dates)
    { id: "fed-jan", title: "Réunion FOMC — Décision taux FED", date: "2026-01-28", category: "fed", importance: "high", description: "Réunion du Federal Open Market Committee. Décision sur les taux directeurs américains. Impact majeur sur les marchés crypto et actions.", country: "🇺🇸" },
    { id: "fed-mar", title: "Réunion FOMC — Décision taux FED", date: "2026-03-18", category: "fed", importance: "high", description: "Réunion FOMC avec mise à jour des projections économiques (dot plot). Conférence de presse de Jerome Powell.", country: "🇺🇸" },
    { id: "fed-apr", title: "Réunion FOMC — Décision taux FED", date: "2026-04-29", category: "fed", importance: "high", description: "Réunion de politique monétaire. Évaluation de l'inflation et de l'emploi.", country: "🇺🇸" },
    { id: "fed-jun", title: "Réunion FOMC — Décision taux FED + Projections", date: "2026-06-17", category: "fed", importance: "high", description: "Réunion FOMC avec Summary of Economic Projections. Mise à jour du dot plot et conférence de presse.", country: "🇺🇸" },
    { id: "fed-jul", title: "Réunion FOMC — Décision taux FED", date: "2026-07-29", category: "fed", importance: "high", description: "Réunion de politique monétaire de la Réserve fédérale.", country: "🇺🇸" },
    { id: "fed-sep", title: "Réunion FOMC — Décision taux FED + Projections", date: "2026-09-16", category: "fed", importance: "high", description: "Réunion FOMC avec projections économiques mises à jour.", country: "🇺🇸" },
    { id: "fed-nov", title: "Réunion FOMC — Décision taux FED", date: "2026-11-04", category: "fed", importance: "high", description: "Réunion de politique monétaire.", country: "🇺🇸" },
    { id: "fed-dec", title: "Réunion FOMC — Décision taux FED + Projections", date: "2026-12-16", category: "fed", importance: "high", description: "Dernière réunion FOMC de l'année avec projections.", country: "🇺🇸" },

    // FED 2025
    { id: "fed-25-mar", title: "Réunion FOMC — Décision taux FED", date: "2025-03-19", category: "fed", importance: "high", description: "Réunion FOMC avec projections économiques.", country: "🇺🇸" },
    { id: "fed-25-may", title: "Réunion FOMC — Décision taux FED", date: "2025-05-07", category: "fed", importance: "high", description: "Réunion de politique monétaire.", country: "🇺🇸" },
    { id: "fed-25-jun", title: "Réunion FOMC — Décision taux FED + Projections", date: "2025-06-18", category: "fed", importance: "high", description: "Réunion FOMC avec dot plot et conférence de presse.", country: "🇺🇸" },
    { id: "fed-25-jul", title: "Réunion FOMC — Décision taux FED", date: "2025-07-30", category: "fed", importance: "high", description: "Réunion de politique monétaire.", country: "🇺🇸" },
    { id: "fed-25-sep", title: "Réunion FOMC — Décision taux FED + Projections", date: "2025-09-17", category: "fed", importance: "high", description: "Réunion FOMC avec projections.", country: "🇺🇸" },
    { id: "fed-25-oct", title: "Réunion FOMC — Décision taux FED", date: "2025-10-29", category: "fed", importance: "high", description: "Réunion de politique monétaire.", country: "🇺🇸" },
    { id: "fed-25-dec", title: "Réunion FOMC — Décision taux FED + Projections", date: "2025-12-17", category: "fed", importance: "high", description: "Dernière réunion FOMC 2025.", country: "🇺🇸" },

    // ECB Meetings 2025-2026
    { id: "ecb-25-apr", title: "Réunion BCE — Décision taux directeurs", date: "2025-04-17", category: "ecb", importance: "high", description: "Banque Centrale Européenne — Décision sur les taux directeurs de la zone euro. Conférence de presse de Christine Lagarde.", country: "🇪🇺" },
    { id: "ecb-25-jun", title: "Réunion BCE — Décision taux directeurs", date: "2025-06-05", category: "ecb", importance: "high", description: "Réunion de politique monétaire de la BCE avec projections macroéconomiques.", country: "🇪🇺" },
    { id: "ecb-25-jul", title: "Réunion BCE — Décision taux directeurs", date: "2025-07-24", category: "ecb", importance: "high", description: "Réunion de politique monétaire de la BCE.", country: "🇪🇺" },
    { id: "ecb-25-sep", title: "Réunion BCE — Décision taux + Projections", date: "2025-09-11", category: "ecb", importance: "high", description: "Réunion BCE avec projections macroéconomiques mises à jour.", country: "🇪🇺" },
    { id: "ecb-25-oct", title: "Réunion BCE — Décision taux directeurs", date: "2025-10-30", category: "ecb", importance: "high", description: "Réunion de politique monétaire.", country: "🇪🇺" },
    { id: "ecb-25-dec", title: "Réunion BCE — Décision taux + Projections", date: "2025-12-18", category: "ecb", importance: "high", description: "Dernière réunion BCE 2025 avec projections.", country: "🇪🇺" },
    { id: "ecb-26-jan", title: "Réunion BCE — Décision taux directeurs", date: "2026-01-22", category: "ecb", importance: "high", description: "Première réunion BCE 2026.", country: "🇪🇺" },
    { id: "ecb-26-mar", title: "Réunion BCE — Décision taux + Projections", date: "2026-03-12", category: "ecb", importance: "high", description: "Réunion BCE avec projections macroéconomiques.", country: "🇪🇺" },
    { id: "ecb-26-apr", title: "Réunion BCE — Décision taux directeurs", date: "2026-04-16", category: "ecb", importance: "high", description: "Réunion de politique monétaire.", country: "🇪🇺" },
    { id: "ecb-26-jun", title: "Réunion BCE — Décision taux + Projections", date: "2026-06-04", category: "ecb", importance: "high", description: "Réunion BCE avec projections.", country: "🇪🇺" },

    // Major Economic Events
    { id: "cpi-25-mar", title: "CPI USA — Indice des prix à la consommation", date: "2025-03-12", category: "economic", importance: "high", description: "Publication de l'indice des prix à la consommation américain. Indicateur clé d'inflation surveillé par la FED.", country: "🇺🇸" },
    { id: "cpi-25-apr", title: "CPI USA — Indice des prix à la consommation", date: "2025-04-10", category: "economic", importance: "high", description: "Données d'inflation américaine. Impact direct sur les anticipations de taux.", country: "🇺🇸" },
    { id: "cpi-25-may", title: "CPI USA — Indice des prix à la consommation", date: "2025-05-13", category: "economic", importance: "high", description: "Publication CPI. Surveillé de près par les marchés crypto.", country: "🇺🇸" },
    { id: "cpi-25-jun", title: "CPI USA — Indice des prix à la consommation", date: "2025-06-11", category: "economic", importance: "high", description: "Données d'inflation mensuelle.", country: "🇺🇸" },
    { id: "nfp-25-mar", title: "NFP — Emplois non-agricoles USA", date: "2025-03-07", category: "economic", importance: "high", description: "Non-Farm Payrolls. Rapport mensuel sur l'emploi américain. Forte volatilité attendue sur les marchés.", country: "🇺🇸" },
    { id: "nfp-25-apr", title: "NFP — Emplois non-agricoles USA", date: "2025-04-04", category: "economic", importance: "high", description: "Rapport sur l'emploi américain.", country: "🇺🇸" },
    { id: "nfp-25-may", title: "NFP — Emplois non-agricoles USA", date: "2025-05-02", category: "economic", importance: "high", description: "Non-Farm Payrolls mensuel.", country: "🇺🇸" },
    { id: "gdp-25-q1", title: "PIB USA — T1 2025 (première estimation)", date: "2025-04-30", category: "economic", importance: "high", description: "Première estimation du PIB américain pour le premier trimestre 2025.", country: "🇺🇸" },
    { id: "gdp-25-q2", title: "PIB USA — T2 2025 (première estimation)", date: "2025-07-30", category: "economic", importance: "high", description: "Première estimation du PIB américain pour le deuxième trimestre 2025.", country: "🇺🇸" },
    { id: "jackson-25", title: "Symposium de Jackson Hole", date: "2025-08-22", category: "economic", importance: "high", description: "Symposium économique annuel de la FED à Jackson Hole. Discours clé du président de la FED.", country: "🇺🇸" },
    { id: "pmi-25-mar", title: "PMI Manufacturier USA", date: "2025-03-03", category: "economic", importance: "medium", description: "Indice des directeurs d'achat du secteur manufacturier.", country: "🇺🇸" },
    { id: "ppi-25-mar", title: "PPI USA — Indice des prix à la production", date: "2025-03-13", category: "economic", importance: "medium", description: "Indice des prix à la production. Indicateur avancé d'inflation.", country: "🇺🇸" },

    // CPI 2026
    { id: "cpi-26-jan", title: "CPI USA — Indice des prix à la consommation", date: "2026-01-14", category: "economic", importance: "high", description: "Publication CPI américain.", country: "🇺🇸" },
    { id: "cpi-26-feb", title: "CPI USA — Indice des prix à la consommation", date: "2026-02-11", category: "economic", importance: "high", description: "Données d'inflation américaine.", country: "🇺🇸" },
    { id: "cpi-26-mar", title: "CPI USA — Indice des prix à la consommation", date: "2026-03-11", category: "economic", importance: "high", description: "Publication CPI mensuelle.", country: "🇺🇸" },
    { id: "nfp-26-jan", title: "NFP — Emplois non-agricoles USA", date: "2026-01-09", category: "economic", importance: "high", description: "Rapport sur l'emploi américain.", country: "🇺🇸" },
    { id: "nfp-26-feb", title: "NFP — Emplois non-agricoles USA", date: "2026-02-06", category: "economic", importance: "high", description: "Non-Farm Payrolls mensuel.", country: "🇺🇸" },
    { id: "nfp-26-mar", title: "NFP — Emplois non-agricoles USA", date: "2026-03-06", category: "economic", importance: "high", description: "Rapport sur l'emploi.", country: "🇺🇸" },

    // Bank of Japan, Bank of England, Bank of Canada
    { id: "boj-25-mar", title: "Réunion Banque du Japon — Taux directeurs", date: "2025-03-14", category: "economic", importance: "medium", description: "Décision de politique monétaire de la Bank of Japan.", country: "🇯🇵" },
    { id: "boe-25-mar", title: "Réunion Bank of England — Taux directeurs", date: "2025-03-20", category: "economic", importance: "medium", description: "Décision de politique monétaire de la Banque d'Angleterre.", country: "🇬🇧" },
    { id: "boc-25-mar", title: "Réunion Banque du Canada — Taux directeurs", date: "2025-03-12", category: "economic", importance: "medium", description: "Décision de politique monétaire de la Banque du Canada.", country: "🇨🇦" },
    { id: "boc-25-apr", title: "Réunion Banque du Canada — Taux directeurs", date: "2025-04-16", category: "economic", importance: "medium", description: "Décision de politique monétaire.", country: "🇨🇦" },
    { id: "boc-25-jun", title: "Réunion Banque du Canada — Taux directeurs", date: "2025-06-04", category: "economic", importance: "medium", description: "Décision de politique monétaire.", country: "🇨🇦" },

    // Crypto Events
    { id: "btc-halving-28", title: "Prochain Bitcoin Halving (estimé)", date: "2028-04-15", category: "crypto", importance: "high", description: "Prochain halving Bitcoin — réduction de la récompense de bloc de 3.125 à 1.5625 BTC. Événement historiquement haussier.", country: "🌍" },
    { id: "eth-pectra", title: "Ethereum Pectra Upgrade", date: "2025-05-07", category: "crypto", importance: "high", description: "Mise à jour majeure d'Ethereum combinant Prague (EL) et Electra (CL). Amélioration du staking et de l'UX.", country: "🌍" },
    { id: "consensus-25", title: "Consensus 2025 — Toronto", date: "2025-05-14", category: "conference", importance: "medium", description: "Plus grande conférence crypto mondiale. Annonces majeures attendues de l'industrie.", country: "🇨🇦" },
    { id: "bitcoin-25", title: "Bitcoin Conference 2025 — Las Vegas", date: "2025-05-27", category: "conference", importance: "high", description: "Conférence Bitcoin annuelle. Discours de leaders de l'industrie et annonces majeures.", country: "🇺🇸" },
    { id: "ethcc-25", title: "EthCC 2025 — Cannes", date: "2025-07-01", category: "conference", importance: "medium", description: "Ethereum Community Conference. Plus grande conférence Ethereum en Europe.", country: "🇫🇷" },
    { id: "token2049-25", title: "Token2049 — Singapour", date: "2025-10-01", category: "conference", importance: "medium", description: "Conférence crypto majeure en Asie. Networking et annonces de projets.", country: "🇸🇬" },
    { id: "sol-breakpoint", title: "Solana Breakpoint 2025", date: "2025-09-15", category: "conference", importance: "medium", description: "Conférence annuelle de l'écosystème Solana.", country: "🌍" },

    // Regulation Events
    { id: "mica-25", title: "MiCA Phase 2 — Régulation EU Crypto", date: "2025-06-30", category: "regulation", importance: "high", description: "Entrée en vigueur complète de la régulation MiCA pour les crypto-actifs dans l'Union Européenne.", country: "🇪🇺" },
    { id: "sec-etf", title: "SEC — Décisions ETF Crypto (multiples)", date: "2025-05-15", category: "regulation", importance: "high", description: "Dates limites SEC pour les décisions sur les ETF Solana, XRP et autres altcoins.", country: "🇺🇸" },
    { id: "g20-crypto", title: "G20 — Cadre réglementaire crypto mondial", date: "2025-11-15", category: "regulation", importance: "medium", description: "Discussion du G20 sur la régulation mondiale des crypto-actifs et stablecoins.", country: "🌍" },

    // Earnings (Crypto-related companies)
    { id: "coin-q1", title: "Coinbase — Résultats Q1 2025", date: "2025-05-08", category: "earnings", importance: "medium", description: "Publication des résultats trimestriels de Coinbase. Indicateur de la santé du marché crypto.", country: "🇺🇸" },
    { id: "mstr-q1", title: "MicroStrategy — Résultats Q1 2025", date: "2025-04-29", category: "earnings", importance: "medium", description: "Résultats de MicroStrategy. Mise à jour des avoirs en Bitcoin.", country: "🇺🇸" },
    { id: "nvda-q1", title: "NVIDIA — Résultats Q1 2025", date: "2025-05-28", category: "earnings", importance: "medium", description: "Résultats NVIDIA. Impact sur le secteur IA et mining crypto.", country: "🇺🇸" },

    // 2026 Crypto Events
    { id: "consensus-26", title: "Consensus 2026", date: "2026-05-18", category: "conference", importance: "medium", description: "Conférence crypto majeure annuelle.", country: "🌍" },
    { id: "bitcoin-26", title: "Bitcoin Conference 2026", date: "2026-06-01", category: "conference", importance: "high", description: "Conférence Bitcoin annuelle.", country: "🇺🇸" },
  ];
}

export default function Calendrier() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const allEvents = useMemo(() => getRealEvents(), []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const monthEvents = useMemo(() => {
    return allEvents.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [allEvents, year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return monthEvents.filter((e) => e.date === dateStr && (filterCategory === "all" || e.category === filterCategory));
  };

  const selectedEvents = selectedDate
    ? monthEvents.filter((e) => e.date === selectedDate && (filterCategory === "all" || e.category === filterCategory))
    : [];

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const filteredEvents = filterCategory === "all" ? monthEvents : monthEvents.filter((e) => e.category === filterCategory);
  const displayEvents = selectedDate ? selectedEvents : filteredEvents.slice(0, 8);

  // Upcoming events across all months
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return allEvents.filter((e) => e.date >= nowStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  }, [allEvents]);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px]">
      <PageHeader
          icon={<Calendar className="w-6 h-6" />}
          title="Calendrier Crypto"
          subtitle="Ne manquez aucun événement important du marché crypto : halvings, listings, mises à jour de protocoles, expirations d’options et événements macroéconomiques."
          accentColor="cyan"
          steps={[
            { n: "1", title: "Naviguez dans le calendrier", desc: "Utilisez les flèches pour naviguer entre les mois. Les jours avec des événements sont mis en évidence." },
            { n: "2", title: "Consultez les événements", desc: "Cliquez sur un jour pour voir tous les événements prévus : leur type, importance et impact potentiel sur le marché." },
            { n: "3", title: "Anticipez les mouvements", desc: "Les grands événements (halvings, expirations d'options, décisions Fed) créent souvent de la volatilité. Préparez-vous à l'avance." },
          ]}
        />
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Calendar className="w-7 h-7 text-cyan-400" />
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Calendrier Économique & Crypto
            </h1>
          </div>
          <p className="text-sm text-gray-400">
            Réunions FED, BCE, données économiques, événements crypto — Planifiez vos trades
          </p>
          <div className="inline-flex items-center gap-2 mt-2 bg-cyan-500/10 border border-cyan-500/25 rounded-full px-4 py-1 text-xs text-cyan-400 font-bold uppercase tracking-widest">
            <Globe className="w-3 h-3" /> Calendrier Mondial
          </div>
        </div>

        {/* Upcoming Banner */}
        {upcomingEvents.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/[0.08] to-red-500/[0.08] border border-amber-500/20 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-amber-400">Prochains événements majeurs</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {upcomingEvents.map((e) => {
                const config = CATEGORY_CONFIG[e.category];
                return (
                  <div key={e.id} className="flex items-center gap-2 bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.06]">
                    <span className="text-sm">{config.emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-white truncate max-w-[200px]">{e.title}</div>
                      <div className="text-[10px] text-gray-500">
                        {e.country} {new Date(e.date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              filterCategory === "all" ? "bg-white/[0.1] text-white border-white/[0.2]" : "bg-white/[0.03] text-gray-400 border-white/[0.06]"
            }`}>
            Tous ({monthEvents.length})
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const count = monthEvents.filter((e) => e.category === key).length;
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

            {/* Monthly Summary Table */}
            {filteredEvents.length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mt-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-cyan-400" />
                  Événements du mois ({filteredEvents.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-[10px] text-gray-500 uppercase py-2 px-2">Date</th>
                        <th className="text-left text-[10px] text-gray-500 uppercase py-2 px-2">Événement</th>
                        <th className="text-left text-[10px] text-gray-500 uppercase py-2 px-2">Type</th>
                        <th className="text-left text-[10px] text-gray-500 uppercase py-2 px-2">Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((event) => {
                        const config = CATEGORY_CONFIG[event.category];
                        return (
                          <tr key={event.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                            <td className="py-2.5 px-2 text-xs text-gray-400 whitespace-nowrap">
                              {event.country} {new Date(event.date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </td>
                            <td className="py-2.5 px-2 text-xs font-semibold text-white">{event.title}</td>
                            <td className="py-2.5 px-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${config.color}`}>
                                {config.emoji} {config.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                event.importance === "high" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                event.importance === "medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              }`}>
                                {event.importance === "high" ? "⚡ Élevé" : event.importance === "medium" ? "📌 Moyen" : "ℹ️ Faible"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
                          <h3 className="font-bold text-sm">{event.title}</h3>
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
                            📅 {new Date(event.date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Legend */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Sources & Légende
              </h3>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-red-400" /> Impact élevé
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-amber-400" /> Impact moyen
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-blue-400" /> Info
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" /> Aujourd&apos;hui
                </div>
              </div>
              <div className="text-[10px] text-gray-600 space-y-1">
                <p>📌 Dates FOMC : federalreserve.gov</p>
                <p>📌 Dates BCE : ecb.europa.eu</p>
                <p>📌 Données éco : bls.gov, bea.gov</p>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-cyan-500/[0.06] to-blue-500/[0.06] border border-cyan-500/20 rounded-xl p-4">
              <h3 className="text-xs font-bold text-cyan-400 mb-2">💡 Conseils Trading</h3>
              <ul className="space-y-1.5 text-[10px] text-gray-400">
                <li>• Les réunions FED/BCE créent une forte volatilité — réduisez vos positions</li>
                <li>• Le CPI et NFP impactent directement Bitcoin et les altcoins</li>
                <li>• Les conférences crypto sont souvent suivies de rallyes</li>
                <li>• Évitez les trades à effet de levier lors des annonces majeures</li>
              </ul>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}