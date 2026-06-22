import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";
import { Twitter, Play, Pause, RefreshCw, Calendar, FileText, Sparkles, AlertCircle, Check, ExternalLink, BookOpen, Pin, Heart, Repeat2, MessageCircle, Eye, Trophy } from "lucide-react";

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

type PinMetrics = {
  like_count?: number;
  retweet_count?: number;
  reply_count?: number;
  impression_count?: number;
};
type PinCandidate = {
  tweetId: string;
  tweetUrl?: string;
  text: string;
  ts: string;
  kind: "blog" | "kit";
  metrics: PinMetrics | null;
  engagement_score: number;
};
type PinStatus = {
  ok: true;
  currentPin: (PinCandidate & { pinnedAt: string }) | null;
  candidates: PinCandidate[];
  window_days: number;
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
  const [pinStatus, setPinStatus] = useState<PinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [pinRefreshing, setPinRefreshing] = useState(false);
  const [error, setError] = useState<string>("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [s, p] = await Promise.all([
        api<Status>("/api/v1/admin/twitter/status"),
        api<PinStatus>("/api/v1/admin/twitter/pin-status").catch(() => null),
      ]);
      if (s && s.ok) setStatus(s);
      else setError("Échec de chargement du statut");
      if (p && p.ok) setPinStatus(p);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const refreshPin = async () => {
    setPinRefreshing(true);
    try {
      const r = await api<{ ok: boolean; changed?: boolean; reason?: string; pinned?: PinCandidate; error?: string }>(
        "/api/v1/admin/twitter/refresh-pin",
        "POST"
      );
      if (r.ok && r.changed) {
        toast.success("Nouveau tweet épinglé ! 🧲");
        await refresh();
      } else if (r.ok && !r.changed) {
        toast.info("Le meilleur tweet est déjà épinglé.");
      } else if (r.error && String(r.error).includes("404")) {
        toast.error("Endpoint pin non disponible sur ton tier Twitter (Basic+ requis). Épingle manuellement sur X.");
      } else {
        toast.error(`Échec : ${r.reason || r.error}`);
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setPinRefreshing(false);
    }
  };

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

            {/* 🧲 Auto-Pin Best Tweet */}
            <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-5" data-testid="auto-pin-section">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Analytics & Top tweets
                  <span className="text-[10px] font-normal text-gray-500 ml-2">14 derniers jours</span>
                </h2>
                <button
                  onClick={refreshPin}
                  disabled={pinRefreshing || !status.configured}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition"
                  data-testid="refresh-pin"
                  title="Essaie d'épingler automatiquement (nécessite tier Basic Twitter)"
                >
                  <Pin className={`w-3.5 h-3.5 ${pinRefreshing ? "animate-pulse" : ""}`} /> Tenter l&apos;auto-pin
                </button>
              </div>

              <div className="mb-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-200/80 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  ℹ️ <strong>Note</strong> : l&apos;épinglage automatique via API nécessite le tier <strong>Basic Twitter ($200/mois)</strong>. Sur le tier &quot;Pay Per Use&quot;, tu peux voir le meilleur tweet ci-dessous et l&apos;épingler <strong>manuellement</strong> sur Twitter (clique sur les 3 points du tweet → &quot;Épingler sur votre profil&quot;).
                </div>
              </div>

              {pinStatus?.currentPin && (
                <div className="p-4 rounded-lg bg-black/40 border border-amber-500/30 mb-4" data-testid="current-pin">
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <Pin className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300 font-bold">Tweet épinglé · Score : {pinStatus.currentPin.engagement_score.toFixed(1)}</span>
                    {pinStatus.currentPin.tweetUrl && (
                      <a href={pinStatus.currentPin.tweetUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1 ml-auto">
                        Voir sur X <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap break-words mb-3">{pinStatus.currentPin.text}</p>
                  <PinMetricsRow metrics={pinStatus.currentPin.metrics} />
                </div>
              )}

              {pinStatus && pinStatus.candidates.length > 0 ? (
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-bold">🏆 Top tweets par engagement :</p>
                  <ol className="space-y-2">
                    {pinStatus.candidates.slice(0, 5).map((c, i) => {
                      const isCurrent = pinStatus.currentPin?.tweetId === c.tweetId;
                      return (
                        <li key={c.tweetId} className={`p-3 rounded-lg ${isCurrent ? "bg-amber-500/10 border border-amber-500/30" : "bg-black/20 border border-white/5"}`}>
                          <div className="flex items-start gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${i === 0 ? "bg-amber-400 text-black" : "bg-white/10 text-gray-300"}`}>{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-200 mb-1 line-clamp-2" title={c.text}>{c.text}</p>
                              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                <PinMetricsRow metrics={c.metrics} compact />
                                {c.tweetUrl && (
                                  <a href={c.tweetUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline ml-auto">
                                    Voir →
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="text-xs font-black text-amber-300">{c.engagement_score.toFixed(1)}</span>
                              <span className="text-[10px] text-gray-500">score</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ) : (
                <p className="text-sm text-gray-500" data-testid="no-pin">
                  Aucun tweet récent à analyser (besoin d&apos;au moins 1 tweet publié via API dans les {pinStatus?.window_days || 14} derniers jours).
                </p>
              )}
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

function PinMetricsRow({ metrics, compact = false }: { metrics: PinMetrics | null; compact?: boolean }) {
  if (!metrics) {
    return <p className={`${compact ? "text-[10px]" : "text-xs"} text-gray-500 italic`}>Pas encore de statistiques.</p>;
  }
  const items = [
    { icon: <Heart className={compact ? "w-3 h-3 text-pink-400" : "w-3.5 h-3.5 text-pink-400"} />, val: metrics.like_count ?? 0 },
    { icon: <Repeat2 className={compact ? "w-3 h-3 text-emerald-400" : "w-3.5 h-3.5 text-emerald-400"} />, val: metrics.retweet_count ?? 0 },
    { icon: <MessageCircle className={compact ? "w-3 h-3 text-cyan-400" : "w-3.5 h-3.5 text-cyan-400"} />, val: metrics.reply_count ?? 0 },
    { icon: <Eye className={compact ? "w-3 h-3 text-purple-400" : "w-3.5 h-3.5 text-purple-400"} />, val: metrics.impression_count ?? 0 },
  ];
  return (
    <div className={`flex flex-wrap gap-${compact ? "2" : "4"} ${compact ? "text-[10px]" : "text-xs"}`}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1 text-gray-300">
          {it.icon}
          <strong className="text-white">{it.val.toLocaleString("fr-CA")}</strong>
        </span>
      ))}
    </div>
  );
}

