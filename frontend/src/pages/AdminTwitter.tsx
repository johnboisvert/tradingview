import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";
import { Twitter, Play, Pause, RefreshCw, Calendar, FileText, Sparkles, AlertCircle, Check, ExternalLink, BookOpen } from "lucide-react";

type Status = {
  ok: true;
  configured: boolean;
  paused: boolean;
  next_post_at: string;
  next_post_source: "blog" | "kit";
  total_posted: number;
  blog_articles_remaining: number;
  blog_articles_total: number;
  kit_posts_remaining: number;
  kit_posts_total: number;
  last_5_posts: Array<{
    ts: string;
    kind: "blog" | "kit";
    slug?: string;
    topic?: string;
    variation?: string;
    text: string;
    tweetId?: string;
    tweetUrl?: string;
  }>;
};

const ADMIN_AUTH_KEY = "admin_api_key";

function getAdminAuth() {
  return localStorage.getItem(ADMIN_AUTH_KEY) || "admin123";
}

async function api<T = unknown>(path: string, method: "GET" | "POST" = "GET"): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "x-admin-auth": getAdminAuth(), "Content-Type": "application/json" },
  });
  return res.json();
}

export default function AdminTwitter() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string>("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<Status>("/api/v1/admin/twitter/status");
      if (data && data.ok) setStatus(data);
      else setError("Échec de chargement du statut");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const postNow = async (source: "blog" | "kit", dry = false) => {
    setPosting(true);
    try {
      const r = await api<{ ok: boolean; reason?: string; text?: string; tweetUrl?: string; dryRun?: boolean; meta?: { kind: string; slug?: string; topic?: string } }>(
        `/api/v1/admin/twitter/post-now?source=${source}${dry ? "&dry=1" : ""}`,
        "POST"
      );
      if (r.ok && r.dryRun) {
        toast.success("Aperçu généré (non publié)");
        alert(`📝 APERÇU (non publié):\n\n${r.text}`);
      } else if (r.ok) {
        toast.success("Tweet publié ! 🎉");
        if (r.tweetUrl) window.open(r.tweetUrl, "_blank");
        await refresh();
      } else {
        if (r.reason === "twitter_keys_missing") {
          toast.error("Clés Twitter manquantes — configurer TWITTER_API_KEY dans Railway.");
        } else {
          toast.error(`Échec: ${r.reason}`);
        }
      }
    } catch (e) {
      toast.error("Erreur réseau");
    } finally {
      setPosting(false);
    }
  };

  const togglePause = async () => {
    try {
      const r = await api<{ ok: boolean; paused: boolean }>("/api/v1/admin/twitter/pause", "POST");
      if (r.ok) {
        toast.success(r.paused ? "Bot mis en pause" : "Bot réactivé");
        await refresh();
      }
    } catch {
      toast.error("Erreur");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl" data-testid="admin-twitter-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Twitter className="w-6 h-6 text-cyan-400" /> Bot Twitter
            </h1>
            <p className="text-sm text-gray-400 mt-1">Auto-post quotidien · 10:00 EST · Blog (Lun/Mer/Ven) + Kit Marketing (Mar/Jeu/Sam/Dim)</p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-sm flex items-center gap-2 transition"
            data-testid="refresh-status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Rafraîchir
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Configuration warning */}
        {status && !status.configured && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5" data-testid="config-warning">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <h3 className="text-amber-200 font-bold mb-2">⚠️ Clés Twitter non configurées</h3>
                <p className="text-amber-100/80 mb-3">
                  Le bot fonctionnera dès que tu auras ajouté ces 4 variables dans Railway → Settings → Variables :
                </p>
                <pre className="bg-black/40 p-3 rounded-lg text-xs text-emerald-300 font-mono overflow-x-auto">{`TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...`}</pre>
                <p className="text-amber-100/70 mt-3 text-xs">
                  Obtention des clés : <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer" className="underline text-amber-300">developer.twitter.com</a> → Crée une App → Permissions &quot;Read and Write&quot; → Tab &quot;Keys and tokens&quot; → Génère les 4 valeurs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status grid */}
        {status && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="status-grid">
              <StatCard
                icon={<Check className={`w-5 h-5 ${status.configured ? "text-emerald-400" : "text-red-400"}`} />}
                label="Statut"
                value={status.configured ? (status.paused ? "En pause" : "Actif") : "Non configuré"}
                color={status.configured && !status.paused ? "emerald" : status.paused ? "amber" : "red"}
              />
              <StatCard
                icon={<Calendar className="w-5 h-5 text-cyan-400" />}
                label="Prochain post"
                value={new Date(status.next_post_at).toLocaleString("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                color="cyan"
                sub={`Source : ${status.next_post_source === "blog" ? "Article blog" : "Kit marketing"}`}
              />
              <StatCard
                icon={<FileText className="w-5 h-5 text-purple-400" />}
                label="Tweets publiés"
                value={String(status.total_posted)}
                color="purple"
              />
              <StatCard
                icon={<Sparkles className="w-5 h-5 text-amber-400" />}
                label="Contenu restant"
                value={`${status.blog_articles_remaining + status.kit_posts_remaining}`}
                color="amber"
                sub={`${status.blog_articles_remaining}/${status.blog_articles_total} blog · ${status.kit_posts_remaining}/${status.kit_posts_total} kit`}
              />
            </div>

            {/* Actions */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5" data-testid="actions-card">
              <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" /> Actions manuelles
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => postNow("blog")}
                  disabled={posting || !status.configured}
                  className="px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition"
                  data-testid="post-blog-now"
                >
                  <BookOpen className="w-4 h-4" /> Poster un article blog
                </button>
                <button
                  onClick={() => postNow("kit")}
                  disabled={posting || !status.configured}
                  className="px-4 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition"
                  data-testid="post-kit-now"
                >
                  <Sparkles className="w-4 h-4" /> Poster un post kit
                </button>
                <button
                  onClick={() => postNow("blog", true)}
                  disabled={posting}
                  className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-gray-300 text-sm flex items-center gap-2 disabled:opacity-50 transition"
                  data-testid="dry-run-blog"
                >
                  <FileText className="w-4 h-4" /> Aperçu blog (dry-run)
                </button>
                <button
                  onClick={() => postNow("kit", true)}
                  disabled={posting}
                  className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-gray-300 text-sm flex items-center gap-2 disabled:opacity-50 transition"
                  data-testid="dry-run-kit"
                >
                  <FileText className="w-4 h-4" /> Aperçu kit (dry-run)
                </button>
                <button
                  onClick={togglePause}
                  className={`px-4 py-2 rounded-lg border text-sm font-bold flex items-center gap-2 transition ${status.paused ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300" : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300"}`}
                  data-testid="toggle-pause"
                >
                  {status.paused ? <><Play className="w-4 h-4" /> Réactiver</> : <><Pause className="w-4 h-4" /> Mettre en pause</>}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                💡 Dry-run = affiche le tweet qui serait posté, sans le publier. Utile pour tester.
              </p>
            </div>

            {/* Last 5 posts */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5" data-testid="last-posts">
              <h2 className="text-base font-bold mb-3">Derniers tweets publiés</h2>
              {status.last_5_posts.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun tweet publié pour le moment.</p>
              ) : (
                <ul className="space-y-3">
                  {status.last_5_posts.map((p, i) => (
                    <li key={i} className="p-3 rounded-lg bg-black/30 border border-white/[0.04]" data-testid={`post-row-${i}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.kind === "blog" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-purple-500/10 text-purple-300 border border-purple-500/30"}`}>
                              {p.kind === "blog" ? "Blog" : "Kit"}
                            </span>
                            <span className="text-xs text-gray-500">{new Date(p.ts).toLocaleString("fr-CA")}</span>
                            {p.tweetUrl && (
                              <a href={p.tweetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                                Voir <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{p.text}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  const borderColor = {
    emerald: "border-emerald-500/30 bg-emerald-500/5",
    cyan: "border-cyan-500/30 bg-cyan-500/5",
    purple: "border-purple-500/30 bg-purple-500/5",
    amber: "border-amber-500/30 bg-amber-500/5",
    red: "border-red-500/30 bg-red-500/5",
  }[color] || "border-white/[0.06] bg-white/[0.02]";
  return (
    <div className={`rounded-xl border p-4 ${borderColor}`}>
      <div className="flex items-center justify-between mb-2">{icon}</div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
