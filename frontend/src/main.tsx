import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import { loadRuntimeConfig } from './lib/config.ts';
import { registerServiceWorker } from './registerSW.ts';

// Load runtime configuration before rendering the app
async function initializeApp() {
  try {
    await loadRuntimeConfig();
  } catch {
    // Runtime config not available, using defaults
  }

  // Render the app with Error Boundary
  createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );

  // Register PWA Service Worker
  registerServiceWorker();
}

// Initialize the app
initializeApp();