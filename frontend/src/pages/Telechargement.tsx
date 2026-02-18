import Sidebar from "../components/Sidebar";

interface DownloadItem {
  title: string;
  icon: string;
  description: string;
  format: string;
  size: string;
  category: string;
  downloadUrl: string;
}

const DOWNLOADS: DownloadItem[] = [
  { title: "Guide du Débutant Crypto", icon: "📘", description: "Guide complet pour débuter dans le trading de cryptomonnaies. Couvre les bases, les exchanges, et les premières stratégies.", format: "PDF", size: "2.4 MB", category: "Guides", downloadUrl: "#" },
  { title: "Cheat Sheet Analyse Technique", icon: "📊", description: "Résumé visuel de tous les indicateurs techniques : RSI, MACD, Bollinger, patterns chartistes.", format: "PDF", size: "1.8 MB", category: "Cheat Sheets", downloadUrl: "#" },
  { title: "Template Journal de Trading", icon: "📝", description: "Spreadsheet pour suivre vos trades, calculer vos performances et analyser vos erreurs.", format: "XLSX", size: "450 KB", category: "Templates", downloadUrl: "#" },
  { title: "Checklist Risk Management", icon: "🛡️", description: "Liste de vérification avant chaque trade : position sizing, stop loss, risk/reward.", format: "PDF", size: "320 KB", category: "Cheat Sheets", downloadUrl: "#" },
  { title: "Glossaire Crypto A-Z", icon: "📖", description: "Dictionnaire complet des termes crypto et trading : de A comme Altcoin à Z comme Zero-Knowledge.", format: "PDF", size: "1.2 MB", category: "Guides", downloadUrl: "#" },
  { title: "Template Plan de Trading", icon: "📋", description: "Modèle de plan de trading professionnel avec objectifs, règles et stratégies.", format: "PDF", size: "580 KB", category: "Templates", downloadUrl: "#" },
  { title: "Patterns Chartistes Illustrés", icon: "🔍", description: "Guide visuel de tous les patterns chartistes avec exemples réels et probabilités.", format: "PDF", size: "3.1 MB", category: "Guides", downloadUrl: "#" },
  { title: "Calculateur Position Size", icon: "🧮", description: "Spreadsheet pour calculer automatiquement la taille de vos positions.", format: "XLSX", size: "280 KB", category: "Templates", downloadUrl: "#" },
  { title: "Calendrier Économique 2025", icon: "📅", description: "Dates clés des événements économiques et crypto pour 2025.", format: "PDF", size: "890 KB", category: "Calendriers", downloadUrl: "#" },
  { title: "Stratégies Backtestées", icon: "📈", description: "Compilation de 10 stratégies de trading backtestées avec résultats détaillés.", format: "PDF", size: "4.2 MB", category: "Guides", downloadUrl: "#" },
  { title: "Infographie DeFi", icon: "🏦", description: "Infographie complète de l'écosystème DeFi : protocoles, TVL, rendements.", format: "PNG", size: "1.5 MB", category: "Infographies", downloadUrl: "#" },
  { title: "Wallpaper CryptoIA", icon: "🖼️", description: "Pack de fonds d'écran CryptoIA pour desktop et mobile.", format: "ZIP", size: "12 MB", category: "Extras", downloadUrl: "#" },
];

const CATEGORIES = ["Tous", "Guides", "Cheat Sheets", "Templates", "Calendriers", "Infographies", "Extras"];

const FORMAT_COLORS: Record<string, string> = {
  PDF: "bg-red-500/10 text-red-400",
  XLSX: "bg-emerald-500/10 text-emerald-400",
  PNG: "bg-blue-500/10 text-blue-400",
  ZIP: "bg-purple-500/10 text-purple-400",
};

export default function Telechargement() {
  const [catFilter, setCatFilter] = useState("Tous");
  const filtered = catFilter === "Tous" ? DOWNLOADS : DOWNLOADS.filter((d) => d.category === catFilter);

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-7">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              📥 Téléchargements
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Guides, templates et ressources gratuites pour le trading crypto</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Ressources", value: DOWNLOADS.length.toString(), icon: "📚" },
              { label: "Guides", value: DOWNLOADS.filter((d) => d.category === "Guides").length.toString(), icon: "📘" },
              { label: "Templates", value: DOWNLOADS.filter((d) => d.category === "Templates").length.toString(), icon: "📋" },
              { label: "Gratuit", value: "100%", icon: "🎁" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-900/70 border border-white/5 rounded-2xl p-5 text-center hover:-translate-y-1 transition-all">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-xl font-black font-mono text-white">{s.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCatFilter(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${catFilter === cat ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/5"}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Downloads Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div key={item.title} className="bg-slate-900/70 border border-white/5 rounded-2xl p-6 hover:border-purple-500/20 transition-all hover:-translate-y-1 group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{item.icon}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${FORMAT_COLORS[item.format] || "bg-gray-500/10 text-gray-400"}`}>{item.format}</span>
                    <span className="text-xs text-gray-500">{item.size}</span>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-white/[0.04] text-gray-500 px-2 py-1 rounded-lg">{item.category}</span>
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all opacity-80 group-hover:opacity-100">
                    📥 Télécharger
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="mt-6 bg-slate-900/50 border border-white/5 rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-400">
              💡 Toutes les ressources sont <strong className="text-white">100% gratuites</strong> pour les membres CryptoIA. De nouvelles ressources sont ajoutées chaque semaine.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}