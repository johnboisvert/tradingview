import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import './i18n'; // initialise react-i18next (FR/EN) avant le 1er render
import { loadRuntimeConfig } from './lib/config.ts';
import { registerServiceWorker } from './registerSW.ts';
import { initSentry } from './lib/sentry.ts';

// Initialize Sentry as early as possible (before any other code)
initSentry();

// ── Anti-scraping protection (production only) ──────────────────────────────
function initAntiScraping() {
  if (import.meta.env.DEV) return; // skip in development

  // 1. Disable right-click on sensitive elements
  document.addEventListener('contextmenu', (e) => {
    const target = e.target as HTMLElement;
    // Allow right-click on inputs and textareas for usability
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    e.preventDefault();
  });

  // 2. Styled console warning
  console.log(
    '%c⚠️ ATTENTION',
    'color: #E63946; font-size: 32px; font-weight: bold; text-shadow: 1px 1px 2px #000;'
  );
  console.log(
    '%cCette console est destinée aux développeurs. Si quelqu\'un vous a demandé de coller quelque chose ici, c\'est une arnaque. Fermez cette fenêtre immédiatement.',
    'color: #F59E0B; font-size: 14px; font-weight: bold;'
  );
  console.log(
    '%cCryptoIA — Plateforme de Trading sécurisée 🔐',
    'color: #6366F1; font-size: 12px;'
  );

  // 3. Basic DevTools detection via debugger timing
  let devToolsOpen = false;
  const threshold = 160;
  const checkDevTools = () => {
    const start = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    const end = performance.now();
    if (end - start > threshold && !devToolsOpen) {
      devToolsOpen = true;
      console.log(
        '%c🔒 DevTools détecté — Vos actions sont enregistrées.',
        'color: #EF4444; font-size: 14px; font-weight: bold;'
      );
    }
  };
  // Check periodically (every 5 seconds) — lightweight
  setInterval(checkDevTools, 5000);
}

// ── CSS-based anti-selection for sensitive content ───────────────────────────
function injectAntiSelectCSS() {
  if (import.meta.env.DEV) return;
  const style = document.createElement('style');
  style.textContent = `
    /* Prevent text selection on sensitive data elements */
    [data-sensitive], .crypto-price, .portfolio-value, .api-key-display {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
}

// Load runtime configuration before rendering the app
async function initializeApp() {
  try {
    await loadRuntimeConfig();
  } catch {
    // Runtime config not available, using defaults
  }

  // Render the app with Error Boundary
  createRoot(document.getElementById('root')!).render(
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  );

  // Register PWA Service Worker
  registerServiceWorker();

  // Anti-scraping protections
  initAntiScraping();
  injectAntiSelectCSS();
}

// Initialize the app
initializeApp();