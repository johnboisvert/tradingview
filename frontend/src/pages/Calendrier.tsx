import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/Sidebar";
import { Calendar, ChevronLeft, ChevronRight, Globe, Landmark, TrendingUp, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

type CryptoImpact = "bullish" | "bearish" | "volatile" | "neutral";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  category: "fed" | "ecb" | "crypto" | "economic" | "regulation" | "earnings" | "conference";
  importance: "high" | "medium" | "low";
  description: string;
  country?: string;
  cryptoImpact: CryptoImpact;
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

const IMPACT_CONFIG: Record<CryptoImpact, { emoji: string; label: string; color: string; short: string }> = {
  bullish: { emoji: "🟢", label: "Haussier crypto", short: "Haussier", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  bearish: { emoji: "🔴", label: "Baissier crypto", short: "Baissier", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  volatile: { emoji: "⚡", label: "Volatilité élevée", short: "Volatil", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  neutral: { emoji: "⚪", label: "Impact neutre", short: "Neutre", color: "text-gray-400 bg-white/[0.04] border-white/[0.08]" },
};

// ====================== DATE HELPERS ======================
const pad = (n: number) => String(n).padStart(2, "0");
const dateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Returns the date of the n-th given weekday (0=Sun..6=Sat) of month, or null if out of range */
function nthWeekday(y: number, m: number, weekday: number, n: number): string | null {
  const firstDow = new Date(y, m, 1).getDay();
  const offset = (weekday - firstDow + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  const dim = new Date(y, m + 1, 0).getDate();
  if (day < 1 || day > dim) return null;
  return dateStr(y, m, day);
}

/** Last given weekday of month */
function lastWeekday(y: number, m: number, weekday: number): string {
  const dim = new Date(y, m + 1, 0).getDate();
  const lastDow = new Date(y, m, dim).getDay();
  const day = dim - ((lastDow - weekday + 7) % 7);
  return dateStr(y, m, day);
}

/** Day clamped to month length */
function fixedDay(y: number, m: number, d: number): string {
  const dim = new Date(y, m + 1, 0).getDate();
  return dateStr(y, m, Math.min(d, dim));
}

// ====================== EVENT GENERATORS ======================
type RecurringTemplate = {
  idPrefix: string;
  title: string;
  category: CalendarEvent["category"];
  importance: CalendarEvent["importance"];
  description: string;
  country?: string;
  cryptoImpact: CryptoImpact;
  skipMonths?: number[];
  onlyMonths?: number[];
  date: (y: number, m: number) => string | null;
};

function generateRecurring(t: RecurringTemplate, startYear: number, endYear: number): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 0; m < 12; m++) {
      if (t.skipMonths?.includes(m)) continue;
      if (t.onlyMonths && !t.onlyMonths.includes(m)) continue;
      const d = t.date(y, m);
      if (!d) continue;
      out.push({
        id: `${t.idPrefix}-${y}-${pad(m + 1)}`,
        title: t.title,
        date: d,
        category: t.category,
        importance: t.importance,
        description: t.description,
        country: t.country,
        cryptoImpact: t.cryptoImpact,
      });
    }
  }
  return out;
}

// ====================== STATIC EVENTS (precise dates) ======================
const STATIC_EVENTS: CalendarEvent[] = [
  // ===== FED FOMC 2025 =====
  { id: "fed-25-jan", title: "Réunion FOMC — Décision taux FED", date: "2025-01-29", category: "fed", importance: "high", description: "Réunion du Federal Open Market Committee. Décision sur les taux directeurs américains.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "fed-25-mar", title: "Réunion FOMC — Décision taux FED + Projections", date: "2025-03-19", category: "fed", importance: "high", description: "Réunion FOMC avec dot plot et conférence de presse de Jerome Powell.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "fed-25-may", title: "Réunion FOMC — Décision taux FED", date: "2025-05-07", category: "fed", importance: "high", description: "Réunion de politique monétaire.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "fed-25-jun", title: "Réunion FOMC — Décision taux FED + Projections", date: "2025-06-18", category: "fed", importance: "high", description: "Réunion FOMC avec Summary of Economic Projections.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "fed-25-jul", title: "Réunion FOMC — Décision taux FED", date: "2025-07-30", category: "fed", importance: "high", description: "Réunion de politique monétaire.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "fed-25-sep", title: "Réunion FOMC — Décision taux FED + Projections", date: "2025-09-17", category: "fed", importance: "high", description: "Réunion FOMC avec projections.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "fed-25-oct", title: "Réunion FOMC — Décision taux FED", date: "2025-10-29", category: "fed", importance: "high", description: "Réunion de politique monétaire.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "fed-25-dec", title: "Réunion FOMC — Décision taux FED + Projections", date: "2025-12-17", category: "fed", importance: "high", description: "Dernière réunion FOMC 2025.", country: "🇺🇸", cryptoImpact: "volatile" },

  // ===== FED FOMC 2026 =====
  { id: "fed-26-jan", title: "Réunion FOMC — Décision taux FED", date: "2026-01-28", category: "fed", importance: "high", description: "Première réunion FOMC 2026. Forte volatilité attendue.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "fed-26-mar", title: "Réunion FOMC — Décision taux FED + Projections", date: "2026-03-18", category: "fed", importance: "high", description: "Réunion FOMC avec dot plot et conférence de presse.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "fed-26-apr", title: "Réunion FOMC — Décision taux FED", date: "2026-04-29", category: "fed", importance: "high", description: "Évaluation inflation et emploi.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "fed-26-jun", title: "Réunion FOMC — Décision taux FED + Projections", date: "2026-06-17", category: "fed", importance: "high", description: "Réunion FOMC avec Summary of Economic Projections.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "fed-26-jul", title: "Réunion FOMC — Décision taux FED", date: "2026-07-29", category: "fed", importance: "high", description: "Réunion de politique monétaire.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "fed-26-sep", title: "Réunion FOMC — Décision taux FED + Projections", date: "2026-09-16", category: "fed", importance: "high", description: "Réunion FOMC avec projections.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "fed-26-nov", title: "Réunion FOMC — Décision taux FED", date: "2026-11-04", category: "fed", importance: "high", description: "Réunion de politique monétaire.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "fed-26-dec", title: "Réunion FOMC — Décision taux FED + Projections", date: "2026-12-16", category: "fed", importance: "high", description: "Dernière réunion FOMC 2026.", country: "🇺🇸", cryptoImpact: "volatile" },

  // ===== ECB 2025 =====
  { id: "ecb-25-jan", title: "Réunion BCE — Décision taux directeurs", date: "2025-01-30", category: "ecb", importance: "high", description: "Banque Centrale Européenne — Décision sur les taux directeurs zone euro.", country: "🇪🇺", cryptoImpact: "volatile" },
  { id: "ecb-25-mar", title: "Réunion BCE — Décision taux + Projections", date: "2025-03-06", category: "ecb", importance: "high", description: "Réunion BCE avec projections macroéconomiques.", country: "🇪🇺", cryptoImpact: "volatile" },
  { id: "ecb-25-apr", title: "Réunion BCE — Décision taux directeurs", date: "2025-04-17", category: "ecb", importance: "high", description: "Conférence de presse de Christine Lagarde.", country: "🇪🇺", cryptoImpact: "volatile" },
  { id: "ecb-25-jun", title: "Réunion BCE — Décision taux + Projections", date: "2025-06-05", category: "ecb", importance: "high", description: "Politique monétaire BCE avec projections.", country: "🇪🇺", cryptoImpact: "volatile" },
  { id: "ecb-25-jul", title: "Réunion BCE — Décision taux directeurs", date: "2025-07-24", category: "ecb", importance: "high", description: "Politique monétaire BCE.", country: "🇪🇺", cryptoImpact: "volatile" },
  { id: "ecb-25-sep", title: "Réunion BCE — Décision taux + Projections", date: "2025-09-11", category: "ecb", importance: "high", description: "Réunion avec projections macroéconomiques.", country: "🇪🇺", cryptoImpact: "volatile" },
  { id: "ecb-25-oct", title: "Réunion BCE — Décision taux directeurs", date: "2025-10-30", category: "ecb", importance: "high", description: "Politique monétaire.", country: "🇪🇺", cryptoImpact: "volatile" },
  { id: "ecb-25-dec", title: "Réunion BCE — Décision taux + Projections", date: "2025-12-18", category: "ecb", importance: "high", description: "Dernière BCE 2025 avec projections.", country: "🇪🇺", cryptoImpact: "volatile" },

  // ===== ECB 2026 =====
  { id: "ecb-26-jan", title: "Réunion BCE — Décision taux directeurs", date: "2026-01-22", category: "ecb", importance: "high", description: "Première BCE 2026.", country: "🇪🇺", cryptoImpact: "volatile" },
  { id: "ecb-26-mar", title: "Réunion BCE — Décision taux + Projections", date: "2026-03-12", category: "ecb", importance: "high", description: "Projections macro mises à jour.", country: "🇪🇺", cryptoImpact: "volatile" },
  { id: "ecb-26-apr", title: "Réunion BCE — Décision taux directeurs", date: "2026-04-16", category: "ecb", importance: "high", description: "Politique monétaire.", country: "🇪🇺", cryptoImpact: "volatile" },
  { id: "ecb-26-jun", title: "Réunion BCE — Décision taux + Projections", date: "2026-06-04", category: "ecb", importance: "high", description: "Projections.", country: "🇪🇺", cryptoImpact: "volatile" },
  { id: "ecb-26-jul", title: "Réunion BCE — Décision taux directeurs", date: "2026-07-23", category: "ecb", importance: "high", description: "Politique monétaire.", country: "🇪🇺", cryptoImpact: "volatile" },
  { id: "ecb-26-sep", title: "Réunion BCE — Décision taux + Projections", date: "2026-09-10", category: "ecb", importance: "high", description: "Projections.", country: "🇪🇺", cryptoImpact: "volatile" },
  { id: "ecb-26-oct", title: "Réunion BCE — Décision taux directeurs", date: "2026-10-29", category: "ecb", importance: "high", description: "Politique monétaire.", country: "🇪🇺", cryptoImpact: "volatile" },
  { id: "ecb-26-dec", title: "Réunion BCE — Décision taux + Projections", date: "2026-12-17", category: "ecb", importance: "high", description: "Dernière BCE 2026.", country: "🇪🇺", cryptoImpact: "volatile" },

  // ===== Bank of Japan =====
  { id: "boj-25-jan", title: "Réunion Banque du Japon — Taux directeurs", date: "2025-01-24", category: "economic", importance: "high", description: "BoJ — Hausse de taux = unwinding du carry trade JPY = pression baissière crypto/risk assets.", country: "🇯🇵", cryptoImpact: "bearish" },
  { id: "boj-25-mar", title: "Réunion Banque du Japon — Taux directeurs", date: "2025-03-19", category: "economic", importance: "high", description: "Décision BoJ. Surveiller le yen et le carry trade.", country: "🇯🇵", cryptoImpact: "bearish" },
  { id: "boj-25-may", title: "Réunion Banque du Japon — Taux directeurs", date: "2025-05-01", category: "economic", importance: "medium", description: "Décision politique monétaire japonaise.", country: "🇯🇵", cryptoImpact: "volatile" },
  { id: "boj-25-jun", title: "Réunion Banque du Japon — Taux directeurs", date: "2025-06-17", category: "economic", importance: "high", description: "BoJ — surveillance yen et risk-off.", country: "🇯🇵", cryptoImpact: "volatile" },
  { id: "boj-25-jul", title: "Réunion Banque du Japon — Taux directeurs", date: "2025-07-31", category: "economic", importance: "high", description: "Décision BoJ.", country: "🇯🇵", cryptoImpact: "volatile" },
  { id: "boj-25-sep", title: "Réunion Banque du Japon — Taux directeurs", date: "2025-09-19", category: "economic", importance: "medium", description: "Décision BoJ.", country: "🇯🇵", cryptoImpact: "volatile" },
  { id: "boj-25-oct", title: "Réunion Banque du Japon — Taux directeurs", date: "2025-10-30", category: "economic", importance: "high", description: "Décision BoJ avec rapport perspectives.", country: "🇯🇵", cryptoImpact: "volatile" },
  { id: "boj-25-dec", title: "Réunion Banque du Japon — Taux directeurs", date: "2025-12-19", category: "economic", importance: "high", description: "Dernière BoJ 2025.", country: "🇯🇵", cryptoImpact: "volatile" },
  { id: "boj-26-jan", title: "Réunion Banque du Japon — Taux directeurs", date: "2026-01-23", category: "economic", importance: "high", description: "Première BoJ 2026.", country: "🇯🇵", cryptoImpact: "volatile" },
  { id: "boj-26-mar", title: "Réunion Banque du Japon — Taux directeurs", date: "2026-03-19", category: "economic", importance: "high", description: "BoJ.", country: "🇯🇵", cryptoImpact: "volatile" },
  { id: "boj-26-apr", title: "Réunion Banque du Japon — Taux directeurs", date: "2026-04-28", category: "economic", importance: "high", description: "BoJ avec rapport perspectives.", country: "🇯🇵", cryptoImpact: "volatile" },
  { id: "boj-26-jun", title: "Réunion Banque du Japon — Taux directeurs", date: "2026-06-17", category: "economic", importance: "high", description: "BoJ.", country: "🇯🇵", cryptoImpact: "volatile" },
  { id: "boj-26-jul", title: "Réunion Banque du Japon — Taux directeurs", date: "2026-07-31", category: "economic", importance: "high", description: "BoJ.", country: "🇯🇵", cryptoImpact: "volatile" },
  { id: "boj-26-sep", title: "Réunion Banque du Japon — Taux directeurs", date: "2026-09-18", category: "economic", importance: "medium", description: "BoJ.", country: "🇯🇵", cryptoImpact: "volatile" },
  { id: "boj-26-oct", title: "Réunion Banque du Japon — Taux directeurs", date: "2026-10-30", category: "economic", importance: "high", description: "BoJ.", country: "🇯🇵", cryptoImpact: "volatile" },
  { id: "boj-26-dec", title: "Réunion Banque du Japon — Taux directeurs", date: "2026-12-18", category: "economic", importance: "high", description: "Dernière BoJ 2026.", country: "🇯🇵", cryptoImpact: "volatile" },

  // ===== Bank of England =====
  { id: "boe-25-feb", title: "Réunion Bank of England — Taux directeurs", date: "2025-02-06", category: "economic", importance: "medium", description: "BoE — Politique monétaire UK.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-25-mar", title: "Réunion Bank of England — Taux directeurs", date: "2025-03-20", category: "economic", importance: "medium", description: "Décision BoE.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-25-may", title: "Réunion Bank of England — Taux directeurs", date: "2025-05-08", category: "economic", importance: "high", description: "BoE avec rapport sur la politique monétaire.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-25-jun", title: "Réunion Bank of England — Taux directeurs", date: "2025-06-19", category: "economic", importance: "medium", description: "Décision BoE.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-25-aug", title: "Réunion Bank of England — Taux directeurs", date: "2025-08-07", category: "economic", importance: "high", description: "BoE avec rapport.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-25-sep", title: "Réunion Bank of England — Taux directeurs", date: "2025-09-18", category: "economic", importance: "medium", description: "BoE.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-25-nov", title: "Réunion Bank of England — Taux directeurs", date: "2025-11-06", category: "economic", importance: "high", description: "BoE avec rapport.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-25-dec", title: "Réunion Bank of England — Taux directeurs", date: "2025-12-18", category: "economic", importance: "medium", description: "Dernière BoE 2025.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-26-feb", title: "Réunion Bank of England — Taux directeurs", date: "2026-02-05", category: "economic", importance: "high", description: "BoE.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-26-mar", title: "Réunion Bank of England — Taux directeurs", date: "2026-03-19", category: "economic", importance: "medium", description: "BoE.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-26-may", title: "Réunion Bank of England — Taux directeurs", date: "2026-05-07", category: "economic", importance: "high", description: "BoE avec rapport.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-26-jun", title: "Réunion Bank of England — Taux directeurs", date: "2026-06-18", category: "economic", importance: "medium", description: "BoE.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-26-aug", title: "Réunion Bank of England — Taux directeurs", date: "2026-08-06", category: "economic", importance: "high", description: "BoE avec rapport.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-26-sep", title: "Réunion Bank of England — Taux directeurs", date: "2026-09-17", category: "economic", importance: "medium", description: "BoE.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-26-nov", title: "Réunion Bank of England — Taux directeurs", date: "2026-11-05", category: "economic", importance: "high", description: "BoE.", country: "🇬🇧", cryptoImpact: "volatile" },
  { id: "boe-26-dec", title: "Réunion Bank of England — Taux directeurs", date: "2026-12-17", category: "economic", importance: "medium", description: "Dernière BoE 2026.", country: "🇬🇧", cryptoImpact: "volatile" },

  // ===== Bank of Canada =====
  { id: "boc-25-jan", title: "Réunion Banque du Canada — Taux directeurs", date: "2025-01-29", category: "economic", importance: "medium", description: "Politique monétaire BoC.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-25-mar", title: "Réunion Banque du Canada — Taux directeurs", date: "2025-03-12", category: "economic", importance: "medium", description: "Décision BoC.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-25-apr", title: "Réunion Banque du Canada — Taux directeurs", date: "2025-04-16", category: "economic", importance: "medium", description: "Décision BoC.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-25-jun", title: "Réunion Banque du Canada — Taux directeurs", date: "2025-06-04", category: "economic", importance: "medium", description: "Décision BoC.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-25-jul", title: "Réunion Banque du Canada — Taux directeurs", date: "2025-07-30", category: "economic", importance: "medium", description: "Décision BoC.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-25-sep", title: "Réunion Banque du Canada — Taux directeurs", date: "2025-09-17", category: "economic", importance: "medium", description: "Décision BoC.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-25-oct", title: "Réunion Banque du Canada — Taux directeurs", date: "2025-10-29", category: "economic", importance: "medium", description: "Décision BoC.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-25-dec", title: "Réunion Banque du Canada — Taux directeurs", date: "2025-12-10", category: "economic", importance: "medium", description: "Dernière BoC 2025.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-26-jan", title: "Réunion Banque du Canada — Taux directeurs", date: "2026-01-28", category: "economic", importance: "medium", description: "Première BoC 2026.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-26-mar", title: "Réunion Banque du Canada — Taux directeurs", date: "2026-03-11", category: "economic", importance: "medium", description: "Décision BoC.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-26-apr", title: "Réunion Banque du Canada — Taux directeurs", date: "2026-04-22", category: "economic", importance: "medium", description: "Décision BoC.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-26-jun", title: "Réunion Banque du Canada — Taux directeurs", date: "2026-06-03", category: "economic", importance: "medium", description: "Décision BoC.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-26-jul", title: "Réunion Banque du Canada — Taux directeurs", date: "2026-07-29", category: "economic", importance: "medium", description: "Décision BoC.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-26-sep", title: "Réunion Banque du Canada — Taux directeurs", date: "2026-09-09", category: "economic", importance: "medium", description: "Décision BoC.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-26-oct", title: "Réunion Banque du Canada — Taux directeurs", date: "2026-10-28", category: "economic", importance: "medium", description: "Décision BoC.", country: "🇨🇦", cryptoImpact: "volatile" },
  { id: "boc-26-dec", title: "Réunion Banque du Canada — Taux directeurs", date: "2026-12-09", category: "economic", importance: "medium", description: "Dernière BoC 2026.", country: "🇨🇦", cryptoImpact: "volatile" },

  // ===== SNB =====
  { id: "snb-25-mar", title: "Réunion BNS — Taux directeurs Suisse", date: "2025-03-20", category: "economic", importance: "medium", description: "Banque Nationale Suisse — Décision politique monétaire.", country: "🇨🇭", cryptoImpact: "neutral" },
  { id: "snb-25-jun", title: "Réunion BNS — Taux directeurs Suisse", date: "2025-06-19", category: "economic", importance: "medium", description: "BNS.", country: "🇨🇭", cryptoImpact: "neutral" },
  { id: "snb-25-sep", title: "Réunion BNS — Taux directeurs Suisse", date: "2025-09-25", category: "economic", importance: "medium", description: "BNS.", country: "🇨🇭", cryptoImpact: "neutral" },
  { id: "snb-25-dec", title: "Réunion BNS — Taux directeurs Suisse", date: "2025-12-11", category: "economic", importance: "medium", description: "Dernière BNS 2025.", country: "🇨🇭", cryptoImpact: "neutral" },
  { id: "snb-26-mar", title: "Réunion BNS — Taux directeurs Suisse", date: "2026-03-19", category: "economic", importance: "medium", description: "BNS.", country: "🇨🇭", cryptoImpact: "neutral" },
  { id: "snb-26-jun", title: "Réunion BNS — Taux directeurs Suisse", date: "2026-06-18", category: "economic", importance: "medium", description: "BNS.", country: "🇨🇭", cryptoImpact: "neutral" },
  { id: "snb-26-sep", title: "Réunion BNS — Taux directeurs Suisse", date: "2026-09-24", category: "economic", importance: "medium", description: "BNS.", country: "🇨🇭", cryptoImpact: "neutral" },
  { id: "snb-26-dec", title: "Réunion BNS — Taux directeurs Suisse", date: "2026-12-17", category: "economic", importance: "medium", description: "Dernière BNS 2026.", country: "🇨🇭", cryptoImpact: "neutral" },

  // ===== RBA Australia =====
  { id: "rba-25-feb", title: "Réunion RBA — Taux directeurs Australie", date: "2025-02-18", category: "economic", importance: "medium", description: "Reserve Bank of Australia.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-25-apr", title: "Réunion RBA — Taux directeurs Australie", date: "2025-04-01", category: "economic", importance: "medium", description: "RBA.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-25-may", title: "Réunion RBA — Taux directeurs Australie", date: "2025-05-20", category: "economic", importance: "medium", description: "RBA avec projections.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-25-jul", title: "Réunion RBA — Taux directeurs Australie", date: "2025-07-08", category: "economic", importance: "medium", description: "RBA.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-25-aug", title: "Réunion RBA — Taux directeurs Australie", date: "2025-08-12", category: "economic", importance: "medium", description: "RBA.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-25-sep", title: "Réunion RBA — Taux directeurs Australie", date: "2025-09-30", category: "economic", importance: "medium", description: "RBA.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-25-nov", title: "Réunion RBA — Taux directeurs Australie", date: "2025-11-04", category: "economic", importance: "medium", description: "RBA.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-25-dec", title: "Réunion RBA — Taux directeurs Australie", date: "2025-12-09", category: "economic", importance: "medium", description: "Dernière RBA 2025.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-26-feb", title: "Réunion RBA — Taux directeurs Australie", date: "2026-02-10", category: "economic", importance: "medium", description: "RBA.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-26-mar", title: "Réunion RBA — Taux directeurs Australie", date: "2026-03-31", category: "economic", importance: "medium", description: "RBA.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-26-may", title: "Réunion RBA — Taux directeurs Australie", date: "2026-05-12", category: "economic", importance: "medium", description: "RBA avec projections.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-26-jun", title: "Réunion RBA — Taux directeurs Australie", date: "2026-06-23", category: "economic", importance: "medium", description: "RBA.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-26-aug", title: "Réunion RBA — Taux directeurs Australie", date: "2026-08-04", category: "economic", importance: "medium", description: "RBA.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-26-sep", title: "Réunion RBA — Taux directeurs Australie", date: "2026-09-29", category: "economic", importance: "medium", description: "RBA.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-26-nov", title: "Réunion RBA — Taux directeurs Australie", date: "2026-11-10", category: "economic", importance: "medium", description: "RBA.", country: "🇦🇺", cryptoImpact: "volatile" },
  { id: "rba-26-dec", title: "Réunion RBA — Taux directeurs Australie", date: "2026-12-15", category: "economic", importance: "medium", description: "Dernière RBA 2026.", country: "🇦🇺", cryptoImpact: "volatile" },

  // ===== Summits & Symposiums =====
  { id: "jackson-25", title: "Symposium de Jackson Hole", date: "2025-08-21", category: "economic", importance: "high", description: "Symposium économique annuel de la FED. Discours clé du président de la FED — souvent catalyseur majeur.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "jackson-26", title: "Symposium de Jackson Hole", date: "2026-08-20", category: "economic", importance: "high", description: "Symposium annuel FED.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "davos-25", title: "World Economic Forum — Davos", date: "2025-01-20", category: "conference", importance: "medium", description: "Forum économique mondial. Annonces géopolitiques et économiques majeures.", country: "🇨🇭", cryptoImpact: "neutral" },
  { id: "davos-26", title: "World Economic Forum — Davos", date: "2026-01-19", category: "conference", importance: "medium", description: "Forum économique mondial.", country: "🇨🇭", cryptoImpact: "neutral" },
  { id: "g7-25", title: "Sommet G7 — Kananaskis (Canada)", date: "2025-06-15", category: "regulation", importance: "medium", description: "Sommet G7. Discussions économiques et géopolitiques internationales.", country: "🇨🇦", cryptoImpact: "neutral" },
  { id: "g7-26", title: "Sommet G7 — France", date: "2026-06-14", category: "regulation", importance: "medium", description: "Sommet G7.", country: "🇫🇷", cryptoImpact: "neutral" },
  { id: "g20-25", title: "Sommet G20 — Afrique du Sud", date: "2025-11-22", category: "regulation", importance: "high", description: "Sommet G20. Cadre réglementaire crypto mondial et stablecoins.", country: "🌍", cryptoImpact: "volatile" },
  { id: "g20-26", title: "Sommet G20 — États-Unis", date: "2026-11-21", category: "regulation", importance: "high", description: "Sommet G20.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "imf-25", title: "Réunions annuelles FMI & Banque mondiale", date: "2025-10-13", category: "regulation", importance: "medium", description: "Réunions annuelles FMI/Banque mondiale.", country: "🌍", cryptoImpact: "neutral" },
  { id: "imf-26", title: "Réunions annuelles FMI & Banque mondiale", date: "2026-10-12", category: "regulation", importance: "medium", description: "Réunions annuelles FMI.", country: "🌍", cryptoImpact: "neutral" },

  // ===== Crypto =====
  { id: "btc-halving-28", title: "Bitcoin Halving (estimé)", date: "2028-04-15", category: "crypto", importance: "high", description: "Prochain halving Bitcoin — récompense bloc 3.125→1.5625 BTC. Historiquement très haussier sur 12-18 mois.", country: "🌍", cryptoImpact: "bullish" },
  { id: "eth-pectra", title: "Ethereum Pectra Upgrade", date: "2025-05-07", category: "crypto", importance: "high", description: "Upgrade majeur Ethereum (Prague + Electra). Amélioration staking & UX. Catalyseur ETH.", country: "🌍", cryptoImpact: "bullish" },
  { id: "eth-fusaka", title: "Ethereum Fusaka Upgrade (estimé)", date: "2025-11-15", category: "crypto", importance: "high", description: "Upgrade Ethereum Fusaka (Fulu + Osaka). PeerDAS, scaling L1.", country: "🌍", cryptoImpact: "bullish" },
  { id: "eth-glamsterdam", title: "Ethereum Glamsterdam Upgrade (estimé)", date: "2026-06-01", category: "crypto", importance: "high", description: "Upgrade Ethereum 2026. Améliorations majeures.", country: "🌍", cryptoImpact: "bullish" },
  { id: "consensus-25", title: "Consensus 2025 — Toronto", date: "2025-05-14", category: "conference", importance: "medium", description: "Plus grande conférence crypto mondiale. Annonces majeures attendues.", country: "🇨🇦", cryptoImpact: "bullish" },
  { id: "consensus-26", title: "Consensus 2026 — Miami", date: "2026-05-13", category: "conference", importance: "medium", description: "Conférence crypto majeure annuelle.", country: "🇺🇸", cryptoImpact: "bullish" },
  { id: "bitcoin-25", title: "Bitcoin Conference 2025 — Las Vegas", date: "2025-05-27", category: "conference", importance: "high", description: "Conférence Bitcoin annuelle. Souvent suivie de rallyes BTC.", country: "🇺🇸", cryptoImpact: "bullish" },
  { id: "bitcoin-26", title: "Bitcoin Conference 2026 — Las Vegas", date: "2026-06-09", category: "conference", importance: "high", description: "Conférence Bitcoin annuelle.", country: "🇺🇸", cryptoImpact: "bullish" },
  { id: "ethcc-25", title: "EthCC 2025 — Cannes", date: "2025-07-01", category: "conference", importance: "medium", description: "Plus grande conférence Ethereum en Europe.", country: "🇫🇷", cryptoImpact: "bullish" },
  { id: "ethcc-26", title: "EthCC 2026 — Cannes", date: "2026-06-30", category: "conference", importance: "medium", description: "EthCC.", country: "🇫🇷", cryptoImpact: "bullish" },
  { id: "token2049-25-sg", title: "Token2049 — Singapour", date: "2025-10-01", category: "conference", importance: "medium", description: "Conférence crypto majeure en Asie.", country: "🇸🇬", cryptoImpact: "bullish" },
  { id: "token2049-26-du", title: "Token2049 — Dubaï", date: "2026-04-29", category: "conference", importance: "medium", description: "Token2049 édition Dubaï.", country: "🇦🇪", cryptoImpact: "bullish" },
  { id: "token2049-26-sg", title: "Token2049 — Singapour", date: "2026-10-01", category: "conference", importance: "medium", description: "Conférence crypto majeure en Asie.", country: "🇸🇬", cryptoImpact: "bullish" },
  { id: "sol-breakpoint-25", title: "Solana Breakpoint 2025 — Abu Dhabi", date: "2025-12-11", category: "conference", importance: "medium", description: "Conférence annuelle écosystème Solana.", country: "🇦🇪", cryptoImpact: "bullish" },
  { id: "sol-breakpoint-26", title: "Solana Breakpoint 2026", date: "2026-12-10", category: "conference", importance: "medium", description: "Conférence Solana.", country: "🌍", cryptoImpact: "bullish" },
  { id: "devcon-26", title: "Devconnect 2026 — Buenos Aires", date: "2026-11-17", category: "conference", importance: "medium", description: "Devconnect Ethereum.", country: "🇦🇷", cryptoImpact: "bullish" },
  { id: "permissionless-26", title: "Permissionless 2026", date: "2026-06-22", category: "conference", importance: "medium", description: "Permissionless Conference DeFi.", country: "🇺🇸", cryptoImpact: "bullish" },

  // ===== Regulation =====
  { id: "mica-25", title: "MiCA Phase 2 — Régulation crypto EU", date: "2025-06-30", category: "regulation", importance: "high", description: "Entrée en vigueur complète MiCA (Markets in Crypto-Assets) dans l'UE. Cadre réglementaire harmonisé.", country: "🇪🇺", cryptoImpact: "neutral" },
  { id: "sec-etf-25", title: "SEC — Décisions ETF altcoins (Solana, XRP, etc.)", date: "2025-05-15", category: "regulation", importance: "high", description: "Dates limites SEC pour ETF spot Solana, XRP, Litecoin, etc. Approbation = très haussier.", country: "🇺🇸", cryptoImpact: "bullish" },
  { id: "sec-eth-staking", title: "SEC — Décision Ethereum ETF staking", date: "2025-10-15", category: "regulation", importance: "high", description: "Décision SEC sur le staking dans les ETF Ethereum spot.", country: "🇺🇸", cryptoImpact: "bullish" },
  { id: "us-stablecoin-act", title: "GENIUS Act — Régulation stablecoins USA", date: "2025-09-01", category: "regulation", importance: "high", description: "Cadre régulation stablecoins aux USA. Légitime USDC/USDT et impacte le marché crypto.", country: "🇺🇸", cryptoImpact: "bullish" },
  { id: "uk-crypto-reg", title: "UK Crypto Regulation Framework", date: "2026-01-15", category: "regulation", importance: "medium", description: "Entrée en vigueur cadre réglementaire crypto UK.", country: "🇬🇧", cryptoImpact: "neutral" },

  // ===== Earnings =====
  { id: "coin-q1-25", title: "Coinbase — Résultats Q4 2024", date: "2025-02-13", category: "earnings", importance: "medium", description: "Indicateur de la santé du marché crypto retail.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "coin-q2-25", title: "Coinbase — Résultats Q1 2025", date: "2025-05-08", category: "earnings", importance: "medium", description: "Résultats trimestriels Coinbase.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "coin-q3-25", title: "Coinbase — Résultats Q2 2025", date: "2025-08-07", category: "earnings", importance: "medium", description: "Résultats Coinbase.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "coin-q4-25", title: "Coinbase — Résultats Q3 2025", date: "2025-11-06", category: "earnings", importance: "medium", description: "Résultats Coinbase.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "coin-q1-26", title: "Coinbase — Résultats Q4 2025", date: "2026-02-12", category: "earnings", importance: "medium", description: "Résultats Coinbase.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "coin-q2-26", title: "Coinbase — Résultats Q1 2026", date: "2026-05-07", category: "earnings", importance: "medium", description: "Résultats Coinbase.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "coin-q3-26", title: "Coinbase — Résultats Q2 2026", date: "2026-08-06", category: "earnings", importance: "medium", description: "Résultats Coinbase.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "coin-q4-26", title: "Coinbase — Résultats Q3 2026", date: "2026-11-05", category: "earnings", importance: "medium", description: "Résultats Coinbase.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "mstr-q1-25", title: "MicroStrategy — Résultats Q4 2024", date: "2025-02-05", category: "earnings", importance: "medium", description: "Mise à jour avoirs BTC de Strategy/MicroStrategy.", country: "🇺🇸", cryptoImpact: "bullish" },
  { id: "mstr-q2-25", title: "MicroStrategy — Résultats Q1 2025", date: "2025-04-29", category: "earnings", importance: "medium", description: "Avoirs BTC Strategy.", country: "🇺🇸", cryptoImpact: "bullish" },
  { id: "mstr-q3-25", title: "MicroStrategy — Résultats Q2 2025", date: "2025-07-31", category: "earnings", importance: "medium", description: "Avoirs BTC.", country: "🇺🇸", cryptoImpact: "bullish" },
  { id: "mstr-q4-25", title: "MicroStrategy — Résultats Q3 2025", date: "2025-10-30", category: "earnings", importance: "medium", description: "Avoirs BTC.", country: "🇺🇸", cryptoImpact: "bullish" },
  { id: "nvda-q1-25", title: "NVIDIA — Résultats Q4 FY2025", date: "2025-02-26", category: "earnings", importance: "high", description: "Impact sur secteur IA et mining crypto.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "nvda-q2-25", title: "NVIDIA — Résultats Q1 FY2026", date: "2025-05-28", category: "earnings", importance: "high", description: "IA + GPU mining.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "nvda-q3-25", title: "NVIDIA — Résultats Q2 FY2026", date: "2025-08-27", category: "earnings", importance: "high", description: "Résultats NVIDIA.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "nvda-q4-25", title: "NVIDIA — Résultats Q3 FY2026", date: "2025-11-19", category: "earnings", importance: "high", description: "Résultats NVIDIA.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "tsla-q1-25", title: "Tesla — Résultats Q4 2024", date: "2025-01-29", category: "earnings", importance: "medium", description: "Tesla détient du BTC sur son bilan.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "tsla-q2-25", title: "Tesla — Résultats Q1 2025", date: "2025-04-22", category: "earnings", importance: "medium", description: "Bilan BTC Tesla.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "tsla-q3-25", title: "Tesla — Résultats Q2 2025", date: "2025-07-23", category: "earnings", importance: "medium", description: "Bilan BTC Tesla.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "tsla-q4-25", title: "Tesla — Résultats Q3 2025", date: "2025-10-22", category: "earnings", importance: "medium", description: "Bilan BTC Tesla.", country: "🇺🇸", cryptoImpact: "volatile" },

  // ===== Geopolitical =====
  { id: "us-midterm-26", title: "Élections de mi-mandat USA", date: "2026-11-03", category: "regulation", importance: "high", description: "Élections de mi-mandat. Résultat = orientation politique crypto (pro/anti).", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "us-debt-ceiling-25", title: "Plafond de la dette USA (limite estimée)", date: "2025-08-15", category: "economic", importance: "high", description: "Limite estimée du plafond de la dette US. Risque de défaut = très volatile.", country: "🇺🇸", cryptoImpact: "volatile" },
  { id: "opec-25-jun", title: "Réunion OPEC+ — Quotas pétroliers", date: "2025-06-01", category: "economic", importance: "medium", description: "Décision quotas pétrole. Impact inflation = crypto.", country: "🌍", cryptoImpact: "volatile" },
  { id: "opec-25-dec", title: "Réunion OPEC+ — Quotas pétroliers", date: "2025-12-01", category: "economic", importance: "medium", description: "Décision quotas pétrole.", country: "🌍", cryptoImpact: "volatile" },
  { id: "opec-26-jun", title: "Réunion OPEC+ — Quotas pétroliers", date: "2026-06-01", category: "economic", importance: "medium", description: "Décision quotas pétrole.", country: "🌍", cryptoImpact: "volatile" },
];

// ====================== RECURRING TEMPLATES ======================
const RECURRING_TEMPLATES: RecurringTemplate[] = [
  {
    idPrefix: "nfp-us",
    title: "NFP — Emplois non-agricoles USA",
    category: "economic",
    importance: "high",
    description: "Non-Farm Payrolls. NFP fort = retarde baisses de taux = baissier crypto. NFP faible = haussier crypto.",
    country: "🇺🇸",
    cryptoImpact: "volatile",
    date: (y, m) => nthWeekday(y, m, 5, 1),
  },
  {
    idPrefix: "cpi-us",
    title: "CPI USA — Indice des prix à la consommation",
    category: "economic",
    importance: "high",
    description: "Inflation USA. CPI < attentes = haussier crypto. CPI > attentes = baissier.",
    country: "🇺🇸",
    cryptoImpact: "volatile",
    date: (y, m) => fixedDay(y, m, 13),
  },
  {
    idPrefix: "pce-us",
    title: "Core PCE — Inflation préférée FED",
    category: "economic",
    importance: "high",
    description: "Personal Consumption Expenditures. Indicateur préféré de la FED. PCE faible = haussier crypto.",
    country: "🇺🇸",
    cryptoImpact: "volatile",
    date: (y, m) => fixedDay(y, m, 28),
  },
  {
    idPrefix: "ppi-us",
    title: "PPI USA — Prix à la production",
    category: "economic",
    importance: "medium",
    description: "Indice prix production. Indicateur avancé d'inflation.",
    country: "🇺🇸",
    cryptoImpact: "volatile",
    date: (y, m) => fixedDay(y, m, 14),
  },
  {
    idPrefix: "retail-us",
    title: "Ventes au détail USA",
    category: "economic",
    importance: "medium",
    description: "Indicateur clé consommation. Ventes fortes = retarde baisses de taux.",
    country: "🇺🇸",
    cryptoImpact: "volatile",
    date: (y, m) => fixedDay(y, m, 16),
  },
  {
    idPrefix: "ism-mfg-us",
    title: "ISM Manufacturier PMI USA",
    category: "economic",
    importance: "medium",
    description: "Activité manufacturière USA. < 50 = contraction.",
    country: "🇺🇸",
    cryptoImpact: "volatile",
    date: (y, m) => {
      let d = 1;
      while (d <= 7) {
        const dow = new Date(y, m, d).getDay();
        if (dow !== 0 && dow !== 6) return dateStr(y, m, d);
        d++;
      }
      return dateStr(y, m, 1);
    },
  },
  {
    idPrefix: "ism-svc-us",
    title: "ISM Services PMI USA",
    category: "economic",
    importance: "medium",
    description: "Activité services USA — secteur dominant.",
    country: "🇺🇸",
    cryptoImpact: "volatile",
    date: (y, m) => fixedDay(y, m, 3),
  },
  {
    idPrefix: "conf-us",
    title: "Indice de confiance consommateur USA",
    category: "economic",
    importance: "low",
    description: "Indice CB Consumer Confidence.",
    country: "🇺🇸",
    cryptoImpact: "neutral",
    date: (y, m) => lastWeekday(y, m, 2),
  },
  {
    idPrefix: "gdp-us",
    title: "PIB USA — Estimation trimestrielle",
    category: "economic",
    importance: "high",
    description: "Première estimation PIB américain.",
    country: "🇺🇸",
    cryptoImpact: "volatile",
    onlyMonths: [0, 3, 6, 9],
    date: (y, m) => fixedDay(y, m, 30),
  },
  {
    idPrefix: "cpi-eu",
    title: "CPI Zone Euro — Flash",
    category: "economic",
    importance: "high",
    description: "Première estimation inflation zone euro. Influence décisions BCE.",
    country: "🇪🇺",
    cryptoImpact: "volatile",
    date: (y, m) => fixedDay(y, m, 30),
  },
  {
    idPrefix: "pmi-eu",
    title: "PMI Flash Zone Euro",
    category: "economic",
    importance: "medium",
    description: "Indicateur avancé d'activité économique zone euro.",
    country: "🇪🇺",
    cryptoImpact: "volatile",
    date: (y, m) => fixedDay(y, m, 22),
  },
  {
    idPrefix: "zew-de",
    title: "Indice ZEW — Sentiment économique Allemagne",
    category: "economic",
    importance: "low",
    description: "Sentiment économique allemand.",
    country: "🇩🇪",
    cryptoImpact: "neutral",
    date: (y, m) => fixedDay(y, m, 15),
  },
  {
    idPrefix: "cpi-uk",
    title: "CPI UK — Inflation",
    category: "economic",
    importance: "medium",
    description: "Inflation UK. Influence décisions BoE.",
    country: "🇬🇧",
    cryptoImpact: "volatile",
    date: (y, m) => fixedDay(y, m, 17),
  },
  {
    idPrefix: "gdp-uk",
    title: "PIB UK — Mensuel",
    category: "economic",
    importance: "low",
    description: "PIB mensuel UK.",
    country: "🇬🇧",
    cryptoImpact: "neutral",
    date: (y, m) => fixedDay(y, m, 12),
  },
  {
    idPrefix: "cpi-jp",
    title: "CPI Japon — Inflation nationale",
    category: "economic",
    importance: "medium",
    description: "Inflation Japon. Influence BoJ et carry trade JPY.",
    country: "🇯🇵",
    cryptoImpact: "volatile",
    date: (y, m) => fixedDay(y, m, 25),
  },
  {
    idPrefix: "cpi-cn",
    title: "CPI Chine — Inflation",
    category: "economic",
    importance: "medium",
    description: "Inflation Chine. Si déflation/stimulus PBOC = haussier crypto.",
    country: "🇨🇳",
    cryptoImpact: "volatile",
    date: (y, m) => fixedDay(y, m, 9),
  },
  {
    idPrefix: "pmi-cn",
    title: "PMI Manufacturier Chine (NBS)",
    category: "economic",
    importance: "medium",
    description: "Activité manuf Chine. PMI fort = appétit pour le risque mondial.",
    country: "🇨🇳",
    cryptoImpact: "volatile",
    date: (y, m) => fixedDay(y, m, 1),
  },
  {
    idPrefix: "lpr-cn",
    title: "PBOC — Loan Prime Rate Chine",
    category: "economic",
    importance: "medium",
    description: "Taux prêts chinois. Baisse = stimulus = liquidité = haussier crypto.",
    country: "🇨🇳",
    cryptoImpact: "volatile",
    date: (y, m) => fixedDay(y, m, 20),
  },
  {
    idPrefix: "trade-cn",
    title: "Balance commerciale Chine",
    category: "economic",
    importance: "low",
    description: "Exports/imports Chine.",
    country: "🇨🇳",
    cryptoImpact: "neutral",
    date: (y, m) => fixedDay(y, m, 7),
  },
  {
    idPrefix: "cpi-in",
    title: "CPI Inde — Inflation",
    category: "economic",
    importance: "low",
    description: "Inflation Inde.",
    country: "🇮🇳",
    cryptoImpact: "neutral",
    date: (y, m) => fixedDay(y, m, 12),
  },
  {
    idPrefix: "opex-crypto",
    title: "Expiration mensuelle options BTC & ETH (Deribit)",
    category: "crypto",
    importance: "high",
    description: "Expiration mensuelle géante des options Bitcoin & Ethereum sur Deribit. Volume notionnel souvent >$5B. Catalyseur de volatilité.",
    country: "🌍",
    cryptoImpact: "volatile",
    date: (y, m) => lastWeekday(y, m, 5),
  },
];

function buildAllEvents(): CalendarEvent[] {
  const recurring: CalendarEvent[] = [];
  for (const t of RECURRING_TEMPLATES) {
    recurring.push(...generateRecurring(t, 2025, 2027));
  }
  const map = new Map<string, CalendarEvent>();
  for (const e of [...STATIC_EVENTS, ...recurring]) {
    map.set(e.id, e);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export default function Calendrier() {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterImpact, setFilterImpact] = useState<string>("all");

  const allEvents = useMemo(() => buildAllEvents(), []);

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

  const prevMonth = () => { setSelectedDate(null); setCurrentDate(new Date(year, month - 1, 1)); };
  const nextMonth = () => { setSelectedDate(null); setCurrentDate(new Date(year, month + 1, 1)); };

  const passesFilters = (e: CalendarEvent) =>
    (filterCategory === "all" || e.category === filterCategory) &&
    (filterImpact === "all" || e.cryptoImpact === filterImpact);

  const getEventsForDay = (day: number) => {
    const ds = dateStr(year, month, day);
    return monthEvents.filter((e) => e.date === ds && passesFilters(e));
  };

  const selectedEvents = selectedDate
    ? monthEvents.filter((e) => e.date === selectedDate && passesFilters(e))
    : [];

  const today = new Date();
  const todayStr = dateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const filteredEvents = monthEvents.filter(passesFilters);
  const displayEvents = selectedDate ? selectedEvents : filteredEvents.slice(0, 10);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const nowStr = dateStr(now.getFullYear(), now.getMonth(), now.getDate());
    return allEvents
      .filter((e) => e.date >= nowStr && e.importance === "high")
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [allEvents]);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
        <PageHeader
          icon={<Calendar className="w-6 h-6" />}
          title={t("pages.calendrier.title")}
          subtitle={t("pages.calendrier.subtitle")}
          accentColor="cyan"
          steps={[
            { n: "1", title: "Naviguez dans le calendrier", desc: "Utilisez les flèches pour naviguer entre les mois. Les jours avec des événements sont mis en évidence." },
            { n: "2", title: "Consultez les événements", desc: "Cliquez sur un jour pour voir tous les événements prévus : leur type, importance et impact potentiel sur le marché." },
            { n: "3", title: "Anticipez les mouvements", desc: "Les grands événements (halvings, expirations d'options, décisions Fed) créent souvent de la volatilité. Préparez-vous à l'avance." },
          ]}
        />
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Calendar className="w-7 h-7 text-cyan-400" />
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Calendrier Économique & Crypto Mondial
            </h1>
          </div>
          <p className="text-sm text-gray-400">
            FED, BCE, BoJ, BoE, BoC, RBA, PBOC, données macro (CPI, NFP, PCE, PMI, GDP), événements crypto — Avec analyse d'impact sur Bitcoin & altcoins
          </p>
          <div className="inline-flex items-center gap-2 mt-2 bg-cyan-500/10 border border-cyan-500/25 rounded-full px-4 py-1 text-xs text-cyan-400 font-bold uppercase tracking-widest">
            <Globe className="w-3 h-3" /> Calendrier Mondial
          </div>
        </div>

        {upcomingEvents.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/[0.08] to-red-500/[0.08] border border-amber-500/20 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-amber-400">Prochains événements majeurs</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {upcomingEvents.map((e) => {
                const config = CATEGORY_CONFIG[e.category];
                const impact = IMPACT_CONFIG[e.cryptoImpact];
                return (
                  <div key={e.id} className="flex items-center gap-2 bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.06]">
                    <span className="text-sm">{config.emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-white truncate max-w-[220px]">{e.title}</div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                        <span>{e.country} {new Date(e.date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${impact.color}`}>
                          {impact.emoji} {impact.short}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              filterCategory === "all" ? "bg-white/[0.1] text-white border-white/[0.2]" : "bg-white/[0.03] text-gray-400 border-white/[0.06]"
            }`}>
            Tous ({monthEvents.filter((e) => filterImpact === "all" || e.cryptoImpact === filterImpact).length})
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const count = monthEvents.filter((e) => e.category === key && (filterImpact === "all" || e.cryptoImpact === filterImpact)).length;
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

        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mr-1">Impact crypto :</span>
          <button onClick={() => setFilterImpact("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              filterImpact === "all" ? "bg-white/[0.1] text-white border-white/[0.2]" : "bg-white/[0.03] text-gray-400 border-white/[0.06]"
            }`}>
            Tous
          </button>
          {(["bullish", "bearish", "volatile", "neutral"] as CryptoImpact[]).map((k) => {
            const c = IMPACT_CONFIG[k];
            const count = monthEvents.filter((e) => e.cryptoImpact === k && (filterCategory === "all" || e.category === filterCategory)).length;
            return (
              <button key={k} onClick={() => setFilterImpact(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  filterImpact === k ? c.color : "bg-white/[0.03] text-gray-400 border-white/[0.06]"
                }`}>
                {c.emoji} {c.short} ({count})
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
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
                  const ds = dateStr(year, month, day);
                  const dayEvents = getEventsForDay(day);
                  const isToday = ds === todayStr;
                  const isSelected = ds === selectedDate;

                  return (
                    <button key={day} onClick={() => setSelectedDate(ds)}
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
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] text-gray-500 leading-none">+{dayEvents.length - 3}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

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
                        <th className="text-left text-[10px] text-gray-500 uppercase py-2 px-2">Impact crypto</th>
                        <th className="text-left text-[10px] text-gray-500 uppercase py-2 px-2">Importance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((event) => {
                        const config = CATEGORY_CONFIG[event.category];
                        const impact = IMPACT_CONFIG[event.cryptoImpact];
                        return (
                          <tr key={event.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                            <td className="py-2.5 px-2 text-xs text-gray-400 whitespace-nowrap">
                              {event.country} {new Date(event.date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </td>
                            <td className="py-2.5 px-2 text-xs font-semibold text-white">{event.title}</td>
                            <td className="py-2.5 px-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${config.color}`}>
                                {config.emoji} {config.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${impact.color}`}>
                                {impact.emoji} {impact.short}
                              </span>
                            </td>
                            <td className="py-2.5 px-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
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
                const impact = IMPACT_CONFIG[event.cryptoImpact];
                return (
                  <div key={event.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-all">
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">{config.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-sm">{event.title}</h3>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap ${
                            event.importance === "high" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            event.importance === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}>
                            {event.importance === "high" ? "⚡ Important" : event.importance === "medium" ? "📌 Moyen" : "ℹ️ Info"}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap ${impact.color}`}>
                            {impact.emoji} {impact.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{event.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
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

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Sources & Légende
              </h3>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-red-400" /> Importance élevée
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-amber-400" /> Importance moyenne
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-blue-400" /> Info
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" /> Aujourd&apos;hui
                </div>
              </div>
              <div className="border-t border-white/[0.06] pt-2 mb-2">
                <div className="text-[10px] font-bold text-gray-400 mb-1.5">Impact crypto attendu :</div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-400">
                  <div>🟢 Haussier</div>
                  <div>🔴 Baissier</div>
                  <div>⚡ Volatil</div>
                  <div>⚪ Neutre</div>
                </div>
              </div>
              <div className="text-[10px] text-gray-600 space-y-1">
                <p>📌 FOMC : federalreserve.gov</p>
                <p>📌 BCE : ecb.europa.eu</p>
                <p>📌 Données macro : bls.gov, bea.gov, eurostat</p>
                <p>📌 BoJ : boj.or.jp · BoE : bankofengland.co.uk</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/[0.06] to-blue-500/[0.06] border border-cyan-500/20 rounded-xl p-4">
              <h3 className="text-xs font-bold text-cyan-400 mb-2">💡 Conseils Trading</h3>
              <ul className="space-y-1.5 text-[10px] text-gray-400">
                <li>• 🟢 Baisse de taux FED/BCE, halving, ETF approuvé = haussier BTC/alts</li>
                <li>• 🔴 Hausse de taux, BoJ hawkish (carry trade unwind), CPI &gt; attentes = baissier</li>
                <li>• ⚡ FOMC, NFP, CPI, expirations options = forte volatilité — réduisez levier</li>
                <li>• Les conférences crypto sont souvent suivies de rallyes sentimentaux</li>
                <li>• Évitez les trades à fort levier lors des annonces majeures</li>
              </ul>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
