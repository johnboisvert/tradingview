import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Bot, RefreshCw, Send, Sparkles, CheckCircle2, XCircle, Loader2, FileText, ListChecks, Eye } from "lucide-react";

const ADMIN_AUTH_KEY = "admin_api_key";
function getAdminAuth() { return localStorage.getItem(ADMIN_AUTH_KEY) || "admin123"; }
async function api<T = unknown>(path: string, opts: { method?: "GET" | "POST"; body?: string } = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method || "GET",
    headers: { "x-admin-auth": getAdminAuth(), "Content-Type": "application/json" },
    body: opts.body,
  });
  return res.json();
}

type Status = {
  ok: boolean;
  enabled: boolean;
  model: string;
  publish_hour_utc: number;
  has_run_today: boolean;
  topics_total: number;
  topics_used: number;
  runs_count: number;
  has_llm_key: boolean;
  recent_runs: Array<{ date: string; ts: string; ok: boolean; topic?: string; slug?: string; title?: string; error?: string; tokens?: number | null }>;
};

type Preview = {
  ok: boolean;
  dryRun?: boolean;
  topic?: string;
  preview?: { title: string; excerpt: string; content_chars: number; tags: string[] };
  article?: { slug: string; title: string };
  error?: string;
  usage?: { total_tokens?: number; completion_tokens?: number } | null;
};

export default function AdminBlogCron() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [forcedTopic, setForcedTopic] = useState("");
  const [running, setRunning] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const d = await api<Status>("/api/v1/admin/blog-cron/status");
      if (d?.ok) setStatus(d);
    } catch (e) { setError(String(e)); }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const runNow = async (dry: boolean) => {
    setRunning(true);
    setPreview(null);
    setError("");
    try {
      const url = `/api/v1/admin/blog-cron/run-now${dry ? "?dry=1" : ""}`;
      const d = await api<Preview>(url, { method: "POST", body: JSON.stringify({ topic: forcedTopic || undefined }) });
      setPreview(d);
      if (!d?.ok) setError(d?.error || "Échec de génération");
      if (!dry) await refresh(); // refresh stats after publish
    } catch (e) { setError(String(e)); }
    setRunning(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2"><Bot className="w-6 h-6 text-indigo-400" /> Auto-publication Blog</h1>
            <p className="text-sm text-gray-400 mt-1">Cron quotidien GPT-5.4 — 1 article SEO/jour, indexation Bing & newsletter automatiques.</p>
          </div>
          <button onClick={refresh} disabled={loading} data-testid="refresh-blog-cron-btn" className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-sm font-bold flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Actualiser
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300" data-testid="blog-cron-error">⚠️ {error}</div>
        )}

        {/* Status grid */}
        {status && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Sparkles className="w-4 h-4 text-indigo-400" />} label="État" value={status.enabled ? "Actif" : "Désactivé"} sub={status.enabled ? "Publie 1 article/jour" : "BLOG_AUTOPUBLISH_ENABLED=false"} />
            <StatCard icon={<Bot className="w-4 h-4 text-purple-400" />} label="Modèle" value={status.model} sub={`Publication ~${status.publish_hour_utc}h UTC`} />
            <StatCard icon={<ListChecks className="w-4 h-4 text-emerald-400" />} label="Sujets utilisés" value={`${status.topics_used} / ${status.topics_total}`} sub={`${status.topics_total - status.topics_used} restants`} />
            <StatCard icon={<FileText className="w-4 h-4 text-amber-400" />} label="Total publications" value={String(status.runs_count)} sub={status.has_run_today ? "✅ Publié aujourd'hui" : "⏳ Pas encore aujourd'hui"} />
          </div>
        )}

        {/* LLM key warning */}
        {status && !status.has_llm_key && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200" data-testid="missing-llm-key-warning">
            ⚠️ <strong>EMERGENT_LLM_KEY manquant</strong> — ajoute la variable dans Railway pour activer la génération automatique.
          </div>
        )}

        {/* Manual trigger panel */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h2 className="text-base font-bold flex items-center gap-2 mb-3"><Send className="w-4 h-4 text-indigo-400" /> Déclencher manuellement</h2>
          <p className="text-xs text-gray-400 mb-4">Sujet personnalisé (laisser vide pour rotation auto) :</p>
          <input value={forcedTopic} onChange={(e) => setForcedTopic(e.target.value)} placeholder="ex: Comment fonctionne le staking en 2026"
            data-testid="forced-topic-input"
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.06] text-sm focus:border-indigo-500/50 focus:outline-none mb-3" />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => runNow(true)} disabled={running} data-testid="dry-run-btn" className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-sm font-bold flex items-center gap-2 disabled:opacity-50">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Aperçu (dry run)
            </button>
            <button onClick={() => runNow(false)} disabled={running} data-testid="publish-now-btn" className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-sm font-bold flex items-center gap-2 disabled:opacity-50">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publier maintenant
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-3">⏱️ La génération prend ~30-60s (GPT-5.4 article complet ~1500-2000 mots).</p>
        </div>

        {/* Preview */}
        {preview?.ok && preview.preview && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5" data-testid="preview-result">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2 text-indigo-300"><Eye className="w-4 h-4" /> Aperçu généré</h2>
            <p className="text-[11px] text-gray-500 mb-2">Sujet : <span className="text-gray-300">{preview.topic}</span></p>
            <h3 className="text-lg font-black text-white mb-2">{preview.preview.title}</h3>
            <p className="text-sm text-gray-300 mb-3">{preview.preview.excerpt}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {preview.preview.tags.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">#{t}</span>)}
            </div>
            <p className="text-[11px] text-gray-500">📏 {preview.preview.content_chars.toLocaleString()} caractères · 🪙 {preview.usage?.total_tokens || "n/a"} tokens</p>
          </div>
        )}
        {preview?.ok && preview.article && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5" data-testid="publish-result">
            <h2 className="text-base font-bold text-emerald-300 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Article publié !</h2>
            <p className="text-sm text-white font-bold mb-1">{preview.article.title}</p>
            <a href={`/blog/${preview.article.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 underline" data-testid="published-article-link">
              /blog/{preview.article.slug} ↗
            </a>
            <p className="text-[11px] text-gray-400 mt-2">🚀 IndexNow pingé · 📧 Newsletter envoyée · 🐦 Sera tweeté lors du prochain cycle 10h EST</p>
          </div>
        )}

        {/* Recent runs */}
        {status && status.recent_runs.length > 0 && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h2 className="text-base font-bold mb-3">Historique des dernières exécutions</h2>
            <div className="space-y-2">
              {status.recent_runs.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-black/30 border border-white/[0.04]" data-testid={`run-history-${i}`}>
                  {r.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{r.title || r.topic || "—"}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {new Date(r.ts).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" })}
                      {r.tokens && <span className="ml-2">· {r.tokens} tokens</span>}
                      {r.error && <span className="ml-2 text-red-400">· {r.error}</span>}
                    </p>
                  </div>
                  {r.slug && (
                    <a href={`/blog/${r.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 underline whitespace-nowrap" data-testid={`run-link-${i}`}>Voir ↗</a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-2">{icon}</div>
      <p className="text-xl font-black text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
