import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import Index from './pages/Index';
import TokenScanner from './pages/TokenScanner';
import WhaleWatcher from './pages/WhaleWatcher';
import TechnicalAnalysis from './pages/TechnicalAnalysis';
import PositionSizer from './pages/PositionSizer';
import GemHunter from './pages/GemHunter';
import Analytics from './pages/Analytics';
import Pricing from './pages/Pricing';
import Promos from './pages/Promos';
import Messages from './pages/Messages';
import Users from './pages/Users';
import NotFound from './pages/NotFound';
import AuthCallback from './pages/AuthCallback';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Public trading tools */}
            <Route path="/" element={<Index />} />
            <Route path="/token-scanner" element={<TokenScanner />} />
            <Route path="/whale-watcher" element={<WhaleWatcher />} />
            <Route path="/technical-analysis" element={<TechnicalAnalysis />} />
            <Route path="/position-sizer" element={<PositionSizer />} />
            <Route path="/gem-hunter" element={<GemHunter />} />

            {/* Admin pages */}
            <Route path="/admin" element={<ProtectedAdminRoute><Analytics /></ProtectedAdminRoute>} />
            <Route path="/admin/users" element={<ProtectedAdminRoute><Users /></ProtectedAdminRoute>} />
            <Route path="/admin/pricing" element={<ProtectedAdminRoute><Pricing /></ProtectedAdminRoute>} />
            <Route path="/admin/promos" element={<ProtectedAdminRoute><Promos /></ProtectedAdminRoute>} />
            <Route path="/admin/messages" element={<ProtectedAdminRoute><Messages /></ProtectedAdminRoute>} />
            <Route path="/admin/analytics" element={<ProtectedAdminRoute><Analytics /></ProtectedAdminRoute>} />

            {/* Auth */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;