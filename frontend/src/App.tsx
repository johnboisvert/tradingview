import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { Suspense } from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import PageTracker from "./components/PageTracker";

// ── Lazy-loaded pages ────────────────────────────────────────────────────────
const Index = React.lazy(() => import("./pages/Index"));
const TokenScanner = React.lazy(() => import("./pages/TokenScanner"));
const WhaleWatcher = React.lazy(() => import("./pages/WhaleWatcher"));
const TechnicalAnalysis = React.lazy(() => import("./pages/TechnicalAnalysis"));
const PositionSizer = React.lazy(() => import("./pages/PositionSizer"));
const GemHunter = React.lazy(() => import("./pages/GemHunter"));
const FearGreed = React.lazy(() => import("./pages/FearGreed"));
const Dominance = React.lazy(() => import("./pages/Dominance"));
const AltcoinSeason = React.lazy(() => import("./pages/AltcoinSeason"));
const Heatmap = React.lazy(() => import("./pages/Heatmap"));
const Strategy = React.lazy(() => import("./pages/Strategy"));
const SpotTrading = React.lazy(() => import("./pages/SpotTrading"));
const Calculatrice = React.lazy(() => import("./pages/Calculatrice"));
const News = React.lazy(() => import("./pages/News"));
const Trades = React.lazy(() => import("./pages/Trades"));
const RiskManagement = React.lazy(() => import("./pages/RiskManagement"));
const Watchlist = React.lazy(() => import("./pages/Watchlist"));
const AIAssistant = React.lazy(() => import("./pages/AIAssistant"));
const PredictionIA = React.lazy(() => import("./pages/PredictionIA"));
const CryptoIA = React.lazy(() => import("./pages/CryptoIA"));
const CryptoJournal = React.lazy(() => import("./pages/CryptoJournal"));
const ScreenerTechnique = React.lazy(() => import("./pages/ScreenerTechnique"));
const MarketRegime = React.lazy(() => import("./pages/MarketRegime"));
const StatsAvancees = React.lazy(() => import("./pages/StatsAvancees"));
const Simulation = React.lazy(() => import("./pages/Simulation"));
const SuccessStories = React.lazy(() => import("./pages/SuccessStories"));
const Convertisseur = React.lazy(() => import("./pages/Convertisseur"));
const Calendrier = React.lazy(() => import("./pages/Calendrier"));
const BullrunPhase = React.lazy(() => import("./pages/BullrunPhase"));
const Graphiques = React.lazy(() => import("./pages/Graphiques"));
const TelegramSetup = React.lazy(() => import("./pages/TelegramSetup"));
const Abonnements = React.lazy(() => import("./pages/Abonnements"));
const MonCompte = React.lazy(() => import("./pages/MonCompte"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const Pricing = React.lazy(() => import("./pages/Pricing"));
const Promos = React.lazy(() => import("./pages/Promos"));
const Messages = React.lazy(() => import("./pages/Messages"));
const Users = React.lazy(() => import("./pages/Users"));
const Contact = React.lazy(() => import("./pages/Contact"));
const Backtesting = React.lazy(() => import("./pages/Backtesting"));
const OnChainMetrics = React.lazy(() => import("./pages/OnChainMetrics"));
const PortfolioTracker = React.lazy(() => import("./pages/PortfolioTracker"));
const DefiYield = React.lazy(() => import("./pages/DefiYield"));
const AISignals = React.lazy(() => import("./pages/AISignals"));
const NarrativeRadar = React.lazy(() => import("./pages/NarrativeRadar"));
const RugScamShield = React.lazy(() => import("./pages/RugScamShield"));
const OpportunityScanner = React.lazy(() => import("./pages/OpportunityScanner"));
const AIPatterns = React.lazy(() => import("./pages/AIPatterns"));
const AISentiment = React.lazy(() => import("./pages/AISentiment"));
const TimeframeAnalysis = React.lazy(() => import("./pages/TimeframeAnalysis"));
const AISetupBuilder = React.lazy(() => import("./pages/AISetupBuilder"));
const PepitesCrypto = React.lazy(() => import("./pages/PepitesCrypto"));
const TradingAcademy = React.lazy(() => import("./pages/TradingAcademy"));
const Telechargement = React.lazy(() => import("./pages/Telechargement"));
const Visitors = React.lazy(() => import("./pages/Visitors"));
const AdminLogin = React.lazy(() => import("./pages/AdminLogin"));
const Login = React.lazy(() => import("./pages/Login"));
const MyCryptoIA = React.lazy(() => import("./pages/MyCryptoIA"));
const AlertesIA = React.lazy(() => import("./pages/AlertesIA"));
const ScoreConfianceIA = React.lazy(() => import("./pages/ScoreConfianceIA"));
const SimulateurStrategieIA = React.lazy(() => import("./pages/SimulateurStrategieIA"));
const RapportHebdomadaireIA = React.lazy(() => import("./pages/RapportHebdomadaireIA"));
const Gamification = React.lazy(() => import("./pages/Gamification"));
const BacktestingVisuel = React.lazy(() => import("./pages/BacktestingVisuel"));
const DtradingIaPro = React.lazy(() => import("./pages/DtradingIaPro"));
const AlertesTelegram = React.lazy(() => import("./pages/AlertesTelegram"));
const PaymentSuccess = React.lazy(() => import("./pages/PaymentSuccess"));
const Predictions = React.lazy(() => import("./pages/Predictions"));
const PredictionCrypto = React.lazy(() => import("./pages/PredictionCrypto"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// ── Non-lazy components (needed immediately for route protection) ─────────────
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedPlanRoute from "./components/ProtectedPlanRoute";

// Helper to wrap a page component with plan protection
function PlanProtected({ path, children }: { path: string; children: React.ReactNode }) {
  return <ProtectedPlanRoute routePath={path}>{children}</ProtectedPlanRoute>;
}

function App() {
  return (
    <Router>
      <PageTracker />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Main Pages - Marché */}
          <Route path="/" element={<Index />} />
          <Route path="/fear-greed" element={<PlanProtected path="/fear-greed"><FearGreed /></PlanProtected>} />
          <Route path="/dominance" element={<PlanProtected path="/dominance"><Dominance /></PlanProtected>} />
          <Route path="/altcoin-season" element={<PlanProtected path="/altcoin-season"><AltcoinSeason /></PlanProtected>} />
          <Route path="/heatmap" element={<PlanProtected path="/heatmap"><Heatmap /></PlanProtected>} />
          <Route path="/bullrun-phase" element={<PlanProtected path="/bullrun-phase"><BullrunPhase /></PlanProtected>} />
          <Route path="/market-regime" element={<PlanProtected path="/market-regime"><MarketRegime /></PlanProtected>} />

          {/* Trading */}
          <Route path="/strategy" element={<PlanProtected path="/strategy"><Strategy /></PlanProtected>} />
          <Route path="/spot-trading" element={<PlanProtected path="/spot-trading"><SpotTrading /></PlanProtected>} />
          <Route path="/calculatrice" element={<PlanProtected path="/calculatrice"><Calculatrice /></PlanProtected>} />
          <Route path="/trades" element={<PlanProtected path="/trades"><Trades /></PlanProtected>} />
          <Route path="/risk-management" element={<PlanProtected path="/risk-management"><RiskManagement /></PlanProtected>} />
          <Route path="/watchlist" element={<PlanProtected path="/watchlist"><Watchlist /></PlanProtected>} />
          <Route path="/graphiques" element={<PlanProtected path="/graphiques"><Graphiques /></PlanProtected>} />
          <Route path="/backtesting" element={<PlanProtected path="/backtesting"><Backtesting /></PlanProtected>} />
          <Route path="/portfolio-tracker" element={<PlanProtected path="/portfolio-tracker"><PortfolioTracker /></PlanProtected>} />
          <Route path="/timeframe-analysis" element={<PlanProtected path="/timeframe-analysis"><TimeframeAnalysis /></PlanProtected>} />

          {/* Intelligence IA */}
          <Route path="/ai-assistant" element={<PlanProtected path="/ai-assistant"><AIAssistant /></PlanProtected>} />
          <Route path="/assistant-ia" element={<PlanProtected path="/assistant-ia"><AIAssistant /></PlanProtected>} />
          <Route path="/gamification" element={<PlanProtected path="/gamification"><Gamification /></PlanProtected>} />
          <Route path="/backtesting-visuel" element={<PlanProtected path="/backtesting-visuel"><BacktestingVisuel /></PlanProtected>} />
          <Route path="/prediction-ia" element={<PlanProtected path="/prediction-ia"><PredictionIA /></PlanProtected>} />
          <Route path="/crypto-ia" element={<PlanProtected path="/crypto-ia"><CryptoIA /></PlanProtected>} />
          <Route path="/crypto-journal" element={<PlanProtected path="/crypto-journal"><CryptoJournal /></PlanProtected>} />
          <Route path="/screener-technique" element={<PlanProtected path="/screener-technique"><ScreenerTechnique /></PlanProtected>} />
          <Route path="/token-scanner" element={<PlanProtected path="/token-scanner"><TokenScanner /></PlanProtected>} />
          <Route path="/opportunity-scanner" element={<PlanProtected path="/opportunity-scanner"><OpportunityScanner /></PlanProtected>} />
          <Route path="/whale-watcher" element={<PlanProtected path="/whale-watcher"><WhaleWatcher /></PlanProtected>} />
          <Route path="/technical-analysis" element={<PlanProtected path="/technical-analysis"><TechnicalAnalysis /></PlanProtected>} />
          <Route path="/gem-hunter" element={<PlanProtected path="/gem-hunter"><GemHunter /></PlanProtected>} />
          <Route path="/position-sizer" element={<PlanProtected path="/position-sizer"><PositionSizer /></PlanProtected>} />
          <Route path="/ai-signals" element={<PlanProtected path="/ai-signals"><AISignals /></PlanProtected>} />
          <Route path="/ai-patterns" element={<PlanProtected path="/ai-patterns"><AIPatterns /></PlanProtected>} />
          <Route path="/ai-sentiment" element={<PlanProtected path="/ai-sentiment"><AISentiment /></PlanProtected>} />
          <Route path="/ai-setup-builder" element={<PlanProtected path="/ai-setup-builder"><AISetupBuilder /></PlanProtected>} />
          <Route path="/narrative-radar" element={<PlanProtected path="/narrative-radar"><NarrativeRadar /></PlanProtected>} />
          <Route path="/pepites-crypto" element={<PlanProtected path="/pepites-crypto"><PepitesCrypto /></PlanProtected>} />
          <Route path="/rug-scam-shield" element={<PlanProtected path="/rug-scam-shield"><RugScamShield /></PlanProtected>} />
          <Route path="/dtrading-ia-pro" element={<PlanProtected path="/dtrading-ia-pro"><DtradingIaPro /></PlanProtected>} />

          {/* Outils */}
          <Route path="/stats-avancees" element={<PlanProtected path="/stats-avancees"><StatsAvancees /></PlanProtected>} />
          <Route path="/simulation" element={<PlanProtected path="/simulation"><Simulation /></PlanProtected>} />
          <Route path="/convertisseur" element={<PlanProtected path="/convertisseur"><Convertisseur /></PlanProtected>} />
          <Route path="/calendrier" element={<PlanProtected path="/calendrier"><Calendrier /></PlanProtected>} />
          <Route path="/news" element={<PlanProtected path="/news"><News /></PlanProtected>} />
          <Route path="/success-stories" element={<SuccessStories />} />
          <Route path="/onchain-metrics" element={<PlanProtected path="/onchain-metrics"><OnChainMetrics /></PlanProtected>} />
          <Route path="/defi-yield" element={<PlanProtected path="/defi-yield"><DefiYield /></PlanProtected>} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/trading-academy" element={<PlanProtected path="/trading-academy"><TradingAcademy /></PlanProtected>} />
          <Route path="/telechargement" element={<PlanProtected path="/telechargement"><Telechargement /></PlanProtected>} />

          {/* Mon Espace */}
          <Route path="/my-cryptoia" element={<PlanProtected path="/my-cryptoia"><MyCryptoIA /></PlanProtected>} />
          <Route path="/alertes-ia" element={<PlanProtected path="/alertes-ia"><AlertesIA /></PlanProtected>} />
          <Route path="/score-confiance-ia" element={<PlanProtected path="/score-confiance-ia"><ScoreConfianceIA /></PlanProtected>} />
          <Route path="/simulateur-strategie-ia" element={<PlanProtected path="/simulateur-strategie-ia"><SimulateurStrategieIA /></PlanProtected>} />
          <Route path="/rapport-hebdomadaire-ia" element={<PlanProtected path="/rapport-hebdomadaire-ia"><RapportHebdomadaireIA /></PlanProtected>} />
          <Route path="/alertes-telegram" element={<PlanProtected path="/alertes-telegram"><AlertesTelegram /></PlanProtected>} />

          {/* SEO Prediction Pages - publicly accessible for SEO */}
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/prediction/:cryptoId" element={<PredictionCrypto />} />

          {/* Compte - always accessible */}
          <Route path="/abonnements" element={<Abonnements />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/mon-compte" element={<MonCompte />} />

          {/* User Login */}
          <Route path="/login" element={<Login />} />

          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin - Protected */}
          <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="/admin/analytics" element={<ProtectedAdminRoute><Analytics /></ProtectedAdminRoute>} />
          <Route path="/admin/pricing" element={<ProtectedAdminRoute><Pricing /></ProtectedAdminRoute>} />
          <Route path="/admin/promos" element={<ProtectedAdminRoute><Promos /></ProtectedAdminRoute>} />
          <Route path="/admin/messages" element={<ProtectedAdminRoute><Messages /></ProtectedAdminRoute>} />
          <Route path="/admin/users" element={<ProtectedAdminRoute><Users /></ProtectedAdminRoute>} />
          <Route path="/admin/visitors" element={<ProtectedAdminRoute><Visitors /></ProtectedAdminRoute>} />
          <Route path="/admin/telegram" element={<ProtectedAdminRoute><TelegramSetup /></ProtectedAdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;