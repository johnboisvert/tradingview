import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TokenScanner from "./pages/TokenScanner";
import WhaleWatcher from "./pages/WhaleWatcher";
import TechnicalAnalysis from "./pages/TechnicalAnalysis";
import PositionSizer from "./pages/PositionSizer";
import GemHunter from "./pages/GemHunter";
import FearGreed from "./pages/FearGreed";
import Dominance from "./pages/Dominance";
import AltcoinSeason from "./pages/AltcoinSeason";
import Heatmap from "./pages/Heatmap";
import Strategy from "./pages/Strategy";
import SpotTrading from "./pages/SpotTrading";
import Calculatrice from "./pages/Calculatrice";
import News from "./pages/News";
import Trades from "./pages/Trades";
import RiskManagement from "./pages/RiskManagement";
import Watchlist from "./pages/Watchlist";
import AIAssistant from "./pages/AIAssistant";
import PredictionIA from "./pages/PredictionIA";
import MarketRegime from "./pages/MarketRegime";
import StatsAvancees from "./pages/StatsAvancees";
import Simulation from "./pages/Simulation";
import SuccessStories from "./pages/SuccessStories";
import Convertisseur from "./pages/Convertisseur";
import Calendrier from "./pages/Calendrier";
import BullrunPhase from "./pages/BullrunPhase";
import Graphiques from "./pages/Graphiques";
import TelegramSetup from "./pages/TelegramSetup";
import Abonnements from "./pages/Abonnements";
import MonCompte from "./pages/MonCompte";
import AdminDashboard from "./pages/AdminDashboard";
import Analytics from "./pages/Analytics";
import Pricing from "./pages/Pricing";
import Promos from "./pages/Promos";
import Messages from "./pages/Messages";
import Users from "./pages/Users";
import Contact from "./pages/Contact";
import Backtesting from "./pages/Backtesting";
import OnChainMetrics from "./pages/OnChainMetrics";
import PortfolioTracker from "./pages/PortfolioTracker";
import DefiYield from "./pages/DefiYield";
import AISignals from "./pages/AISignals";
import NarrativeRadar from "./pages/NarrativeRadar";
import RugScamShield from "./pages/RugScamShield";
import OpportunityScanner from "./pages/OpportunityScanner";
import AIPatterns from "./pages/AIPatterns";
import AISentiment from "./pages/AISentiment";
import TimeframeAnalysis from "./pages/TimeframeAnalysis";
import AISetupBuilder from "./pages/AISetupBuilder";
import PepitesCrypto from "./pages/PepitesCrypto";
import TradingAcademy from "./pages/TradingAcademy";
import Telechargement from "./pages/Telechargement";
import AdminLogin from "./pages/AdminLogin";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedPlanRoute from "./components/ProtectedPlanRoute";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";

// Helper to wrap a page component with plan protection
function PlanProtected({ path, children }: { path: string; children: React.ReactNode }) {
  return <ProtectedPlanRoute routePath={path}>{children}</ProtectedPlanRoute>;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Pages - Marché (always accessible: dashboard, fear-greed, heatmap) */}
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
        <Route path="/prediction-ia" element={<PlanProtected path="/prediction-ia"><PredictionIA /></PlanProtected>} />
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

        {/* Compte - always accessible */}
        <Route path="/abonnements" element={<Abonnements />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/mon-compte" element={<MonCompte />} />

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin - Protected */}
        <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
        <Route path="/admin/analytics" element={<ProtectedAdminRoute><Analytics /></ProtectedAdminRoute>} />
        <Route path="/admin/pricing" element={<ProtectedAdminRoute><Pricing /></ProtectedAdminRoute>} />
        <Route path="/admin/promos" element={<ProtectedAdminRoute><Promos /></ProtectedAdminRoute>} />
        <Route path="/admin/messages" element={<ProtectedAdminRoute><Messages /></ProtectedAdminRoute>} />
        <Route path="/admin/users" element={<ProtectedAdminRoute><Users /></ProtectedAdminRoute>} />
        <Route path="/admin/telegram" element={<ProtectedAdminRoute><TelegramSetup /></ProtectedAdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;