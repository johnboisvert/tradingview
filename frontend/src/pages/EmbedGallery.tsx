// Public embed gallery — /embed-gallery
// Showcases copy-paste iframe snippets with a live preview so users can grab
// the code in 1 click and paste it on their blog/Twitter/Discord/Notion.
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Copy, Check, Code2, Sparkles, Trophy, Activity } from "lucide-react";

export default function EmbedGallery() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("QATester");

  function copy(key: string, code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(() => {});
  }

  const widgets = [
    {
      key: "live-feed",
      title: "Live Trade Feed",
      icon: <Activity className="w-4 h-4 text-red-400" />,
      desc: "Auto-refresh 8s · scrolling ticker des trades live de la communauté Pro Challenge",
      src: "https://www.cryptoia.ca/embed/live-feed?theme=dark",
      width: 600,
      height: 80,
    },
    {
      key: "badges",
      title: "Trader Badges",
      icon: <Trophy className="w-4 h-4 text-amber-400" />,
      desc: "Affiche les badges Pro Challenge d'un trader — clic = referral link vers ton profil",
      src: `https://www.cryptoia.ca/embed/badges/${encodeURIComponent(username)}?theme=dark`,
      width: 380,
      height: 240,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <SEOHead
        title="Embed Gallery · Widgets shareables CryptoIA"
        description="Snippets iframe copy-paste pour partager les trades live et badges traders CryptoIA sur ton blog, Twitter, Notion ou Discord."
        path="/embed-gallery"
      />
      <Sidebar />
      <main className="lg:ml-20 px-4 md:px-8 py-10 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            EMBED WIDGETS · COPY-PASTE
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Widgets shareables
          </h1>
          <p className="text-base text-gray-300 max-w-2xl">
            Affiche le flux de trades live ou les badges d&apos;un trader sur ton blog, Twitter, Notion ou Discord. Un seul clic pour copier le snippet.
          </p>
        </div>

        {/* Username input (for badges widget) */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 mb-6">
          <label className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2 block">Pseudo du trader (pour le widget Badges)</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            data-testid="embed-gallery-username"
            className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/[0.08] text-white font-extrabold focus:outline-none focus:border-amber-500/50 font-mono"
            placeholder="QATester"
          />
        </div>

        {/* Widgets grid */}
        <div className="space-y-6">
          {widgets.map((w) => {
            const code = `<iframe\n  src="${w.src}"\n  width="${w.width}"\n  height="${w.height}"\n  frameborder="0"\n  style="border:none;border-radius:16px;"\n  loading="lazy"\n  title="${w.title} - CryptoIA"\n></iframe>`;
            return (
              <div
                key={w.key}
                data-testid={`embed-gallery-${w.key}`}
                className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-3">
                  {w.icon}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base md:text-lg font-extrabold">{w.title}</h2>
                    <p className="text-xs text-gray-500 truncate">{w.desc}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-wider">{w.width}×{w.height}</span>
                </div>

                {/* Live preview */}
                <div className="p-5 bg-gradient-to-br from-[#0a0a0f] to-[#0d0e16] border-b border-white/[0.04]">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Live preview</div>
                  <div className="overflow-x-auto">
                    <iframe
                      src={w.src}
                      width={w.width}
                      height={w.height}
                      frameBorder={0}
                      style={{ border: "none", borderRadius: 16, background: "#0a0a0f" }}
                      loading="lazy"
                      title={`${w.title} preview`}
                      data-testid={`embed-gallery-${w.key}-preview`}
                    />
                  </div>
                </div>

                {/* Code snippet */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[10px] text-cyan-300 font-extrabold uppercase tracking-wider">Snippet HTML</span>
                    </div>
                    <button
                      onClick={() => copy(w.key, code)}
                      data-testid={`embed-gallery-${w.key}-copy`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-extrabold hover:bg-amber-500/20 transition"
                    >
                      {copiedKey === w.key ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copié</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
                    </button>
                  </div>
                  <pre className="bg-black/40 border border-white/[0.05] rounded-lg p-3 text-[11px] font-mono text-cyan-200 overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <h3 className="text-sm font-extrabold mb-2 text-purple-200">💡 Bon à savoir</h3>
          <ul className="text-xs text-gray-300 space-y-1.5">
            <li>• Tous les widgets supportent <code className="text-amber-300">?theme=dark</code> (par défaut) ou <code className="text-amber-300">?theme=transparent</code> (fond hérité du site qui embed)</li>
            <li>• Le widget Badges traque automatiquement le referral : chaque clic = <code className="text-amber-300">/challenge?ref=&lt;username&gt;</code></li>
            <li>• Aucune authentification requise · GET-only · safe pour iframe</li>
          </ul>
        </div>

        <Footer />
      </main>
    </div>
  );
}
