# CryptoIA Trading Platform - Development Plan

## Design Guidelines

### Design References
- **Binance.com**: Dark trading interface, data-dense layouts
- **TradingView.com**: Clean charts, professional trading tools
- **Style**: Dark Premium Trading + Glassmorphism + Neon Accents

### Color Palette
- Background: #0A0E1A (Deep Navy)
- Card: #111827 (Dark Charcoal)
- Card Hover: #1F2937 (Lighter Charcoal)
- Accent Primary: #6366F1 (Indigo)
- Accent Secondary: #06B6D4 (Cyan)
- Accent Tertiary: #8B5CF6 (Purple)
- Success: #10B981 (Emerald)
- Danger: #EF4444 (Red)
- Warning: #F59E0B (Amber)
- Text Primary: #F1F5F9
- Text Secondary: #94A3B8
- Text Muted: #64748B
- Border: rgba(255,255,255,0.06)

### Typography
- Font: Inter (already loaded)
- H1: 32px, font-weight 800
- H2: 20px, font-weight 700
- Body: 14px, font-weight 400
- Small: 12px, font-weight 500

### Key Component Styles
- Cards: bg-[#111827] border border-white/[0.06] rounded-2xl
- Buttons: gradient backgrounds, rounded-xl
- Inputs: bg-black/20 border border-white/10 rounded-xl
- Tables: striped rows with hover effects

### Images to Generate
1. **hero-crypto-dashboard.jpg** - Futuristic crypto trading dashboard with holographic charts and neon blue/purple lights, dark background
2. **whale-tracker-bg.jpg** - Deep ocean scene with a glowing whale silhouette and blockchain data streams, dark blue tones
3. **gem-hunter-bg.jpg** - Sparkling diamonds and gems floating in a dark space with purple/cyan light rays
4. **technical-analysis-bg.jpg** - Abstract financial chart patterns with candlesticks and indicators in neon green/blue on dark background

---

## Development Tasks

### Files to Create/Modify (8 file limit)
1. **src/components/Sidebar.tsx** - Main navigation sidebar with all pages
2. **src/pages/Index.tsx** - REWRITE: Trading Dashboard homepage with live crypto data
3. **src/pages/TokenScanner.tsx** - AI Token Scanner with search and analysis
4. **src/pages/WhaleWatcher.tsx** - Whale transaction monitoring
5. **src/pages/TechnicalAnalysis.tsx** - Technical analysis with indicators
6. **src/pages/PositionSizer.tsx** - Position size calculator
7. **src/pages/GemHunter.tsx** - Crypto gems discovery
8. **src/App.tsx** - UPDATE: Add all routes

### Data Strategy
- Use CoinGecko public API for real crypto data
- Fallback to realistic mock data if API fails
- Client-side calculations for indicators (RSI, EMA, etc.)