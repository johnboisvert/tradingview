// Admin Social Kits — UI to copy-paste ready-to-post content per article
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { Sparkles, Copy, Check, Twitter, Linkedin, MessageCircle, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";

type Article = { slug: string; title: string; language?: string; publishedAt?: string };

type SocialKit = {
  ok: boolean;
  url: string;
  og_image: string;
  twitter_single: string;
  twitter_thread: string[];
  linkedin: string;
  reddit: { title: string; body: string };
  instagram_caption: string;
};

function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button
      onClick={handle}
      data-testid="copy-button"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/10 text-[11px] font-bold text-gray-200 hover:bg-white/[0.1] transition-colors"
    >
      {copied ? <><Check className="w-3 h-3 text-emerald-400" /> OK</> : <><Copy className="w-3 h-3" /> {label}</>}
    </button>
  );
}

function ArticleKit({ article }: { article: Article }) {
  const [kit, setKit] = useState<SocialKit | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (kit || loading) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/v1/blog/social-kit/${encodeURIComponent(article.slug)}`);
      const j = await r.json();
      if (j.ok) setKit(j);
    } finally { setLoading(false); }
  };

  const toggle = () => {
    setOpen((v) => !v);
    if (!kit) load();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden" data-testid={`kit-${article.slug}`}>
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-white/[0.03] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{article.title}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">/{article.slug}</div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-white/10 p-4 space-y-4">
          {loading && <p className="text-xs text-gray-500">Génération en cours…</p>}
          {kit && (
            <>
              {/* URL + OG */}
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="text-gray-500">URL:</span>
                <code className="px-2 py-0.5 rounded bg-white/[0.06] text-indigo-300 truncate max-w-md">{kit.url}</code>
                <CopyButton text={kit.url} label="URL" />
                <a href={kit.og_image} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]">
                  <ImageIcon className="w-3 h-3" /> OG image
                </a>
              </div>

              {/* Twitter single */}
              <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-300">
                    <Twitter className="w-3.5 h-3.5" /> X / Tweet unique
                  </div>
                  <CopyButton text={kit.twitter_single} />
                </div>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-sans">{kit.twitter_single}</pre>
              </div>

              {/* Twitter thread */}
              <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-300">
                    <Twitter className="w-3.5 h-3.5" /> X / Thread {kit.twitter_thread.length} tweets
                  </div>
                  <CopyButton text={kit.twitter_thread.join("\n\n---\n\n")} label="Tout copier" />
                </div>
                <div className="space-y-2">
                  {kit.twitter_thread.map((t, i) => (
                    <div key={i} className="rounded bg-white/[0.03] p-2 flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-[10px] font-black text-sky-300">{i + 1}</div>
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-sans flex-1">{t}</pre>
                      <CopyButton text={t} label="" />
                    </div>
                  ))}
                </div>
              </div>

              {/* LinkedIn */}
              <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-300">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </div>
                  <CopyButton text={kit.linkedin} />
                </div>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-sans">{kit.linkedin}</pre>
              </div>

              {/* Reddit */}
              <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-300">
                    <MessageCircle className="w-3.5 h-3.5" /> Reddit
                  </div>
                  <CopyButton text={`${kit.reddit.title}\n\n${kit.reddit.body}`} label="Tout" />
                </div>
                <div className="mb-2">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Titre</div>
                  <pre className="text-xs text-gray-200 whitespace-pre-wrap font-sans">{kit.reddit.title}</pre>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Corps</div>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-sans">{kit.reddit.body}</pre>
                </div>
              </div>

              {/* Instagram */}
              <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-pink-300">
                    <Sparkles className="w-3.5 h-3.5" /> Instagram / Threads caption
                  </div>
                  <CopyButton text={kit.instagram_caption} />
                </div>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-sans">{kit.instagram_caption}</pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminSocialKits() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/blog/list?limit=50")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setArticles(j.articles || []); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-7 h-7 text-amber-300" />
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
              Social Media Kits
            </h1>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Contenu prêt-à-coller pour X, LinkedIn, Reddit et Instagram. Un clic = un post.
            <br />Clique sur un article pour révéler son kit complet.
          </p>
        </div>

        {loading ? (
          <p className="text-gray-400">Chargement des articles…</p>
        ) : (
          <div className="space-y-3" data-testid="social-kits-list">
            {articles.map((a) => (
              <ArticleKit key={a.slug} article={a} />
            ))}
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
}
