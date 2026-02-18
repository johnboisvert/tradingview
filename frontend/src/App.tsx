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
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Pages - Marché */}
        <Route path="/" element={<Index />} />
        <Route path="/fear-greed" element={<FearGreed />} />
        <Route path="/dominance" element={<Dominance />} />
        <Route path="/altcoin-season" element={<AltcoinSeason />} />
        <Route path="/heatmap" element={<Heatmap />} />
        <Route path="/bullrun-phase" element={<BullrunPhase />} />
        <Route path="/market-regime" element={<MarketRegime />} />

        {/* Trading */}
        <Route path="/strategy" element={<Strategy />} />
        <Route path="/spot-trading" element={<SpotTrading />} />
        <Route path="/calculatrice" element={<Calculatrice />} />
        <Route path="/trades" element={<Trades />} />
        <Route path="/risk-management" element={<RiskManagement />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/graphiques" element={<Graphiques />} />
        <Route path="/backtesting" element={<Backtesting />} />
        <Route path="/portfolio-tracker" element={<PortfolioTracker />} />
        <Route path="/timeframe-analysis" element={<TimeframeAnalysis />} />

        {/* Intelligence IA */}
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/prediction-ia" element={<PredictionIA />} />
        <Route path="/token-scanner" element={<TokenScanner />} />
        <Route path="/whale-watcher" element={<WhaleWatcher />} />
        <Route path="/technical-analysis" element={<TechnicalAnalysis />} />
        <Route path="/gem-hunter" element={<GemHunter />} />
        <Route path="/position-sizer" element={<PositionSizer />} />
        <Route path="/ai-signals" element={<AISignals />} />
        <Route path="/ai-patterns" element={<AIPatterns />} />
        <Route path="/ai-sentiment" element={<AISentiment />} />
        <Route path="/ai-setup-builder" element={<AISetupBuilder />} />
        <Route path="/narrative-radar" element={<NarrativeRadar />} />
        <Route path="/rug-scam-shield" element={<RugScamShield />} />
        <Route path="/opportunity-scanner" element={<OpportunityScanner />} />
        <Route path="/pepites-crypto" element={<PepitesCrypto />} />

        {/* Outils */}
        <Route path="/stats-avancees" element={<StatsAvancees />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/convertisseur" element={<Convertisseur />} />
        <Route path="/calendrier" element={<Calendrier />} />
        <Route path="/news" element={<News />} />
        <Route path="/success-stories" element={<SuccessStories />} />
        <Route path="/telegram-setup" element={<TelegramSetup />} />
        <Route path="/onchain-metrics" element={<OnChainMetrics />} />
        <Route path="/defi-yield" element={<DefiYield />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/trading-academy" element={<TradingAcademy />} />
        <Route path="/telechargement" element={<Telechargement />} />

        {/* Compte */}
        <Route path="/abonnements" element={<Abonnements />} />
        <Route path="/mon-compte" element={<MonCompte />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/pricing" element={<Pricing />} />
        <Route path="/admin/promos" element={<Promos />} />
        <Route path="/admin/messages" element={<Messages />} />
        <Route path="/admin/users" element={<Users />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;