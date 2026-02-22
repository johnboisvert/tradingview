export { type Module, type Lesson, type SubLesson, type QuizQuestion } from "./types";
export { module1Lessons } from "./module1";
export { module2Lessons } from "./module2";
export { module3Lessons } from "./module3";
export { module4Lessons } from "./module4";
export { module5Lessons } from "./module5";
export { module6Lessons } from "./module6";
export { module7Lessons } from "./module7";
export { module8Lessons } from "./module8";
export { module9Lessons } from "./module9";
export { module10Lessons } from "./module10";
export { module11Lessons } from "./module11";
export { module12Lessons } from "./module12";
export { module13Lessons } from "./module13";
export { module14Lessons } from "./module14";
export { module15Lessons } from "./module15";

import { Module } from "./types";
import { module1Lessons } from "./module1";
import { module2Lessons } from "./module2";
import { module3Lessons } from "./module3";
import { module4Lessons } from "./module4";
import { module5Lessons } from "./module5";
import { module6Lessons } from "./module6";
import { module7Lessons } from "./module7";
import { module8Lessons } from "./module8";
import { module9Lessons } from "./module9";
import { module10Lessons } from "./module10";
import { module11Lessons } from "./module11";
import { module12Lessons } from "./module12";
import { module13Lessons } from "./module13";
import { module14Lessons } from "./module14";
import { module15Lessons } from "./module15";

export const modules: Module[] = [
  {
    id: "module-1",
    title: "Les Fondamentaux du Trading Crypto",
    description: "Blockchain, exchanges, wallets, types de cryptos et bases essentielles pour démarrer.",
    icon: "🏗️",
    color: "from-blue-500 to-cyan-500",
    lessons: module1Lessons,
    difficulty: "Débutant",
    estimatedTime: "4h 15min",
  },
  {
    id: "module-2",
    title: "Analyse Technique Fondamentale",
    description: "Supports, résistances, chandeliers, Fibonacci, figures chartistes et structure du marché.",
    icon: "📐",
    color: "from-purple-500 to-pink-500",
    lessons: module2Lessons,
    difficulty: "Débutant-Intermédiaire",
    estimatedTime: "4h 30min",
  },
  {
    id: "module-3",
    title: "Indicateurs Techniques Avancés",
    description: "RSI, MACD, Bollinger, moyennes mobiles, Volume Profile et indicateurs de volume.",
    icon: "📊",
    color: "from-green-500 to-emerald-500",
    lessons: module3Lessons,
    difficulty: "Intermédiaire",
    estimatedTime: "4h 05min",
  },
  {
    id: "module-4",
    title: "Spot Trading Complet",
    description: "DCA, gestion de portefeuille, points d'entrée/sortie et stratégies d'accumulation.",
    icon: "💰",
    color: "from-yellow-500 to-orange-500",
    lessons: module4Lessons,
    difficulty: "Débutant-Intermédiaire",
    estimatedTime: "3h 15min",
  },
  {
    id: "module-5",
    title: "Day Trading Crypto",
    description: "Bases du day trading, stratégies breakout/pullback/range, sessions et outils.",
    icon: "⚡",
    color: "from-red-500 to-rose-500",
    lessons: module5Lessons,
    difficulty: "Intermédiaire",
    estimatedTime: "3h 05min",
  },
  {
    id: "module-6",
    title: "Scalping Crypto",
    description: "Principes du scalping, order flow, micro-niveaux, spot vs futures et gestion du risque.",
    icon: "🎯",
    color: "from-indigo-500 to-violet-500",
    lessons: module6Lessons,
    difficulty: "Avancé",
    estimatedTime: "2h 55min",
  },
  {
    id: "module-7",
    title: "Swing Trading",
    description: "Fondamentaux, identification des swings, stratégies et analyse multi-timeframe.",
    icon: "🔄",
    color: "from-teal-500 to-cyan-500",
    lessons: module7Lessons,
    difficulty: "Intermédiaire",
    estimatedTime: "3h 15min",
  },
  {
    id: "module-8",
    title: "Futures & Effet de Levier",
    description: "Contrats perpétuels, long/short, liquidations, funding rate, hedging et arbitrage.",
    icon: "🔥",
    color: "from-orange-500 to-red-500",
    lessons: module8Lessons,
    difficulty: "Avancé",
    estimatedTime: "4h 05min",
  },
  {
    id: "module-9",
    title: "Gestion du Risque Professionnelle",
    description: "Position sizing, R:R, espérance mathématique, Stop Loss avancés et drawdown.",
    icon: "🛡️",
    color: "from-slate-500 to-zinc-500",
    lessons: module9Lessons,
    difficulty: "Intermédiaire-Avancé",
    estimatedTime: "3h 10min",
  },
  {
    id: "module-10",
    title: "Psychologie du Trading",
    description: "Émotions, discipline, plan de trading, mindset gagnant et erreurs fatales.",
    icon: "🧠",
    color: "from-fuchsia-500 to-purple-500",
    lessons: module10Lessons,
    difficulty: "Tous niveaux",
    estimatedTime: "3h 00min",
  },
  {
    id: "module-11",
    title: "DeFi Complète : AMM, Yield Farming & Risques",
    description: "Finance décentralisée, AMM, lending, yield farming, impermanent loss et protocoles majeurs.",
    icon: "🌐",
    color: "from-emerald-500 to-teal-500",
    lessons: module11Lessons,
    difficulty: "Avancé",
    estimatedTime: "3h 10min",
  },
  {
    id: "module-12",
    title: "Analyse On-Chain & Tokenomics",
    description: "MVRV, NUPL, exchange flows, whale tracking, supply dynamics et valuation de projets.",
    icon: "⛓️",
    color: "from-amber-500 to-yellow-500",
    lessons: module12Lessons,
    difficulty: "Avancé",
    estimatedTime: "1h 45min",
  },
  {
    id: "module-13",
    title: "Trading Algorithmique & Bots",
    description: "Grid trading, DCA bots, backtesting, arbitrage et market making automatisé.",
    icon: "🤖",
    color: "from-cyan-500 to-blue-500",
    lessons: module13Lessons,
    difficulty: "Avancé",
    estimatedTime: "1h 40min",
  },
  {
    id: "module-14",
    title: "Sécurité Crypto & Protection",
    description: "Hardware wallets, 2FA, phishing, sécurité DeFi, multisig et plan d'héritage.",
    icon: "🔒",
    color: "from-rose-500 to-pink-500",
    lessons: module14Lessons,
    difficulty: "Tous niveaux",
    estimatedTime: "50min",
  },
  {
    id: "module-15",
    title: "Fiscalité, Réglementation & Plan de Trading",
    description: "Fiscalité crypto en France, optimisation légale, MiCA et construction d'un plan complet.",
    icon: "📋",
    color: "from-violet-500 to-indigo-500",
    lessons: module15Lessons,
    difficulty: "Tous niveaux",
    estimatedTime: "1h 45min",
  },
];

export const getTotalLessons = (): number => {
  return modules.reduce((total, mod) => total + mod.lessons.length, 0);
};

export const getTotalSubLessons = (): number => {
  return modules.reduce(
    (total, mod) =>
      total + mod.lessons.reduce((lt, lesson) => lt + lesson.subLessons.length, 0),
    0
  );
};

export const getTotalQuizQuestions = (): number => {
  return modules.reduce(
    (total, mod) =>
      total + mod.lessons.reduce((lt, lesson) => lt + lesson.quiz.length, 0),
    0
  );
};

export const findLessonById = (lessonId: string) => {
  for (const mod of modules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) return { module: mod, lesson };
  }
  return null;
};

export const getNextLesson = (currentLessonId: string) => {
  const allLessons = modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
  if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
    return allLessons[currentIndex + 1];
  }
  return null;
};

export const getPreviousLesson = (currentLessonId: string) => {
  const allLessons = modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
  if (currentIndex > 0) {
    return allLessons[currentIndex - 1];
  }
  return null;
};
