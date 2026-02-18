import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import TokenScanner from './pages/TokenScanner';
import WhaleWatcher from './pages/WhaleWatcher';
import TechnicalAnalysis from './pages/TechnicalAnalysis';
import PositionSizer from './pages/PositionSizer';
import GemHunter from './pages/GemHunter';
import NotFound from './pages/NotFound';
import AuthCallback from './pages/AuthCallback';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/token-scanner" element={<TokenScanner />} />
          <Route path="/whale-watcher" element={<WhaleWatcher />} />
          <Route path="/technical-analysis" element={<TechnicalAnalysis />} />
          <Route path="/position-sizer" element={<PositionSizer />} />
          <Route path="/gem-hunter" element={<GemHunter />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;