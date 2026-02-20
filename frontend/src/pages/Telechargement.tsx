import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { getEbooks, incrementEbookDownloads, type Ebook } from "@/lib/api";
import PageHeader from "@/components/PageHeader";

const CATEGORIES = ["Tous", "Guides", "Cheat Sheets", "Templates", "Calendriers", "Infographies", "Extras"];

const FORMAT_COLORS: Record<string, string> = {
  PDF: "bg-red-500/10 text-red-400",
  XLSX: "bg-emerald-500/10 text-emerald-400",
  PNG: "bg-blue-500/10 text-blue-400",
  ZIP: "bg-purple-500/10 text-purple-400",
  DOCX: "bg-indigo-500/10 text-indigo-400",
};

const PLAN_HIERARCHY = ["free", "premium", "advanced", "pro", "elite"];

const PLAN_BADGE_COLORS: Record<string, string> = {
  free: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  premium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  advanced: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  pro: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  elite: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const ICON_MAP: Record<string, string> = {
  Guides: "📘",
  "Cheat Sheets": "📊",
  Templates: "📋",
  Calendriers: "📅",
  Infographies: "🏦",
  Extras: "🖼️",
};

export default function Telechargement() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("Tous");

  useEffect(() => {
    getEbooks()
      .then((data) => setEbooks((data.ebooks || []).filter((e) => e.active)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = catFilter === "Tous" ? ebooks : ebooks.filter((d) => d.category === catFilter);

  const handleDownload = async (item: Ebook) => {
    // Increment download count
    await incrementEbookDownloads(item.id);
    setEbooks((prev) =>
      prev.map((e) => (e.id === item.id ? { ...e, downloads: e.downloads + 1 } : e))
    );

    // Create a placeholder download
    const content = `${item.title}\n\n${item.description}\n\nFormat: ${item.format || "PDF"}\nTaille: ${item.size || "N/A"}\nCatégorie: ${item.category || "Guides"}\nPlan requis: ${item.plan_required}\n\n---\nCette ressource sera bientôt disponible en téléchargement complet.\nMerci de votre patience ! — CryptoIA Platform`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.title.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    if (cat === "Tous") {
      acc[cat] = ebooks.length;
    } else {
      acc[cat] = ebooks.filter((e) => e.category === cat).length;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
      <PageHeader
          icon={<span className="text-lg">📥</span>}
          title="Téléchargements"
          subtitle="Accédez à notre bibliothèque de ressources premium : guides PDF, cheat sheets, templates de trading, calendriers et infographies pour améliorer votre trading."
          accentColor="purple"
          steps={[
            { n: "1", title: "Parcourez la bibliothèque", desc: "Filtrez par catégorie (Guides, Cheat Sheets, Templates...) pour trouver rapidement les ressources dont vous avez besoin." },
            { n: "2", title: "Téléchargez vos ressources", desc: "Cliquez sur Télécharger pour obtenir le fichier. Les ressources premium sont disponibles avec votre abonnement actif." },
            { n: "3", title: "Appliquez les connaissances", desc: "Utilisez les cheat sheets comme référence rapide pendant vos sessions de trading et les templates pour structurer vos analyses." },
          ]}
        />
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              📥 Téléchargements
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Guides, templates et ressources pour le trading crypto</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Ressources", value: ebooks.length.toString(), icon: "📚" },
                  { label: "Guides", value: ebooks.filter((d) => d.category === "Guides").length.toString(), icon: "📘" },
                  { label: "Templates", value: ebooks.filter((d) => d.category === "Templates").length.toString(), icon: "📋" },
                  { label: "Téléchargements", value: ebooks.reduce((s, e) => s + e.downloads, 0).toLocaleString(), icon: "📥" },
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
                {CATEGORIES.filter((cat) => cat === "Tous" || categoryCounts[cat] > 0).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCatFilter(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      catFilter === cat
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/5"
                    }`}
                  >
                    {cat} ({categoryCounts[cat] || 0})
                  </button>
                ))}
              </div>

              {/* Downloads Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((item) => (
                  <div key={item.id} className="bg-slate-900/70 border border-white/5 rounded-2xl p-6 hover:border-purple-500/20 transition-all hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{ICON_MAP[item.category || "Guides"] || "📄"}</span>
                      <div className="flex items-center gap-2">
                        {item.format && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${FORMAT_COLORS[item.format] || "bg-gray-500/10 text-gray-400"}`}>
                            {item.format}
                          </span>
                        )}
                        {item.size && <span className="text-xs text-gray-500">{item.size}</span>}
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-xs text-gray-400 mb-3 leading-relaxed line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {item.category && (
                          <span className="text-xs bg-white/[0.04] text-gray-500 px-2 py-1 rounded-lg">{item.category}</span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PLAN_BADGE_COLORS[item.plan_required] || PLAN_BADGE_COLORS.free}`}>
                          {item.plan_required === "free" ? "🆓 Gratuit" : `🔒 ${item.plan_required.charAt(0).toUpperCase() + item.plan_required.slice(1)}`}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-600">{item.downloads} DL</span>
                    </div>
                    <button
                      onClick={() => handleDownload(item)}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all opacity-80 group-hover:opacity-100"
                    >
                      📥 Télécharger
                    </button>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">Aucune ressource dans cette catégorie.</p>
                </div>
              )}

              {/* Info */}
              <div className="mt-6 bg-slate-900/50 border border-white/5 rounded-2xl p-6 text-center">
                <p className="text-sm text-gray-400">
                  💡 Les ressources sont disponibles selon votre plan d'abonnement. De nouvelles ressources sont ajoutées chaque semaine.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}