// Admin SEO Content — one dashboard to trigger generation of glossary terms,
// crypto comparisons, per-coin descriptions, AND the daily brief cycle.
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { BookOpen, Scale, Coins, Sun, RefreshCw, Send, Loader2, CheckCircle2 } from "lucide-react";

const ADMIN_AUTH_KEY = "admin_api_key";
function getAuth() { return localStorage.getItem(ADMIN_AUTH_KEY) || "admin123"; }
async function api<T = unknown>(path: string, opts: { method?: "GET" | "POST"; body?: string } = {}): Promise<T> {
  const r = await fetch(path, { method: opts.method || "GET", headers: { "x-admin-auth": getAuth(), "Content-Type": "application/json" }, body: opts.body });
  return r.json();
}

type Status = { total: number; default_pool?: number; remaining_default?: number; remaining_terms?: string[]; remaining_pairs?: [string, string][]; remaining_symbols?: string[]; total_supported?: number; descriptions_generated?: number; has_llm_key: boolean };
type BriefStatus = { ok: boolean; enabled: boolean; send_hour_utc: number; has_run_today: boolean; runs_count: number; recent_runs: Array<{ date: string; ts: string; ok: boolean; headline?: string; sent?: number; failed?: number; recipient_count?: number; error?: string }>; has_llm_key: boolean };

export default function AdminSeoContent() {
  const [glossary, setGlossary] = useState<Status | null>(null);
  const [compare, setCompare] = useState<Status | null>(null);
  const [coin, setCoin] = useState<Status | null>(null);
  const [brief, setBrief] = useState<BriefStatus | null>(null);
  const [busy, setBusy] = useState<string>("");
  const [msg, setMsg] = useState<string>("");

  const refresh = async () => {
    const [g, c, co, b] = await Promise.all([
      api<{ ok: boolean } & Status>("/api/v1/admin/glossary/status").catch(() => null),
      api<{ ok: boolean } & Status>("/api/v1/admin/compare/status").catch(() => null),
      api<{ ok: boolean } & Status>("/api/v1/admin/coin/status").catch(() => null),
      api<BriefStatus>("/api/v1/admin/daily-brief/status").catch(() => null),
    ]);
    if (g?.ok) setGlossary(g);
    if (c?.ok) setCompare(c);
    if (co?.ok) setCoin(co);
    if (b?.ok) setBrief(b);
  };
  useEffect(() => { refresh(); }, []);

  const generate = async (kind: "glossary" | "compare" | "coin") => {
    setBusy(kind); setMsg("");
    try {
      const path = kind === "glossary" ? "/api/v1/admin/glossary/generate" :
                   kind === "compare" ? "/api/v1/admin/compare/generate" :
                   "/api/v1/admin/coin/generate-description";
      const r = await api<{ ok: boolean; added: number; total: number; message?: string; error?: string }>(path, { method: "POST", body: JSON.stringify({}) });
      if (r.ok) setMsg(`✅ ${kind}: ${r.added} ajoutés (total ${r.total})${r.message ? " — " + r.message : ""}`);
      else setMsg(`❌ ${kind}: ${r.error || "échec"}`);
      await refresh();
    } catch (e) { setMsg(`❌ ${kind}: ${String(e)}`); }
    setBusy("");
  };

  const briefRun = async (dry: boolean) => {
    setBusy("brief"); setMsg("");
    try {
      const r = await api<{ ok: boolean; headline?: string; sent?: number; recipient_count?: number; html_size?: number; error?: string }>(`/api/v1/admin/daily-brief/run-now${dry ? "?dry=1" : ""}`, { method: "POST" });
      if (r.ok) setMsg(dry ? `✅ Dry run: "${r.headline}" (${r.html_size} chars)` : `✅ Envoyé "${r.headline}" à ${r.sent}/${r.recipient_count} users`);
      else setMsg(`❌ ${r.error || "échec"}`);
      await refresh();
    } catch (e) { setMsg(`❌ ${String(e)}`); }
    setBusy("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">🤖 Contenu SEO Auto</h1>
            <p className="text-sm text-gray-400 mt-1">Génération IA en batch : glossaire, comparatifs, fiches crypto et daily brief.</p>
          </div>
          <button onClick={refresh} disabled={!!busy} data-testid="refresh-seo-btn" className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-sm font-bold flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /> Actualiser
          </button>
        </div>

        {msg && <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-sm text-indigo-100" data-testid="seo-msg">{msg}</div>}

        {/* Glossary */}
        <SeoCard
          testId="glossary-card"
          icon={<BookOpen className="w-5 h-5 text-indigo-400" />}
          title="Glossaire"
          status={glossary}
          publicLink="/lexique"
          unitLabel="termes"
          batchInfo="batch=8 termes / appel · ~2min par batch"
          onGenerate={() => generate("glossary")}
          busy={busy === "glossary"}
        />

        {/* Compare */}
        <SeoCard
          testId="compare-card"
          icon={<Scale className="w-5 h-5 text-purple-400" />}
          title="Comparatifs crypto"
          status={compare}
          publicLink="/compare"
          unitLabel="paires"
          batchInfo="batch=5 paires / appel · ~3min par batch"
          onGenerate={() => generate("compare")}
          busy={busy === "compare"}
        />

        {/* Coin descriptions */}
        <SeoCard
          testId="coin-card"
          icon={<Coins className="w-5 h-5 text-cyan-400" />}
          title="Fiches éditoriales crypto"
          status={coin}
          publicLink="/crypto"
          unitLabel="cryptos"
          batchInfo="batch=5 cryptos / appel · ~3min par batch"
          onGenerate={() => generate("coin")}
          busy={busy === "coin"}
          override={coin ? { total: coin.descriptions_generated, total_pool: coin.total_supported } : undefined}
        />

        {/* Daily brief */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5" data-testid="daily-brief-card">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-base font-bold flex items-center gap-2"><Sun className="w-5 h-5 text-amber-400" /> Daily Crypto Brief</h2>
            {brief && (
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${brief.enabled ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-gray-500/15 text-gray-400 border border-gray-500/30"}`} data-testid="brief-status-badge">
                {brief.enabled ? `✅ ${brief.send_hour_utc}h UTC / jour` : "⏸️ Désactivé"}
              </span>
            )}
          </div>
          {brief && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04]">
                <p className="text-xl font-black text-white">{brief.runs_count}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Envois</p>
              </div>
              <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04]">
                <p className={`text-xl font-black ${brief.has_run_today ? "text-emerald-300" : "text-gray-400"}`} data-testid="brief-ran-today">
                  {brief.has_run_today ? "✓" : "—"}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Envoyé aujourd&apos;hui</p>
              </div>
              <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04]">
                <p className={`text-xl font-black ${brief.has_llm_key ? "text-emerald-300" : "text-amber-300"}`}>{brief.has_llm_key ? "✓" : "⚠"}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">EMERGENT_LLM_KEY</p>
              </div>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => briefRun(true)} disabled={busy === "brief"} data-testid="brief-dry-run-btn" className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-sm font-bold flex items-center gap-2 disabled:opacity-50">
              {busy === "brief" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Aperçu (dry run)
            </button>
            <button onClick={() => briefRun(false)} disabled={busy === "brief"} data-testid="brief-send-now-btn" className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50">
              {busy === "brief" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Envoyer maintenant
            </button>
          </div>
          {brief && brief.recent_runs.length > 0 && (
            <div className="mt-4 space-y-1">
              {brief.recent_runs.slice(0, 5).map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] p-2 rounded bg-black/20" data-testid={`brief-run-${i}`}>
                  {r.ok ? <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" /> : <span className="w-3 h-3 text-red-400">✗</span>}
                  <span className="text-gray-300 truncate flex-1">{r.headline || r.error || "—"}</span>
                  {r.sent != null && <span className="text-gray-500 whitespace-nowrap">{r.sent}/{r.recipient_count}</span>}
                  <span className="text-gray-500 whitespace-nowrap">{new Date(r.ts).toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function SeoCard({ testId, icon, title, status, publicLink, unitLabel, batchInfo, onGenerate, busy, override }: {
  testId: string; icon: React.ReactNode; title: string; status: Status | null; publicLink: string; unitLabel: string; batchInfo: string;
  onGenerate: () => void; busy: boolean;
  override?: { total?: number; total_pool?: number };
}) {
  const total = override?.total ?? status?.total ?? 0;
  const pool = override?.total_pool ?? status?.default_pool ?? status?.total_supported ?? 0;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5" data-testid={testId}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-base font-bold flex items-center gap-2">{icon} {title}</h2>
        <a href={publicLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-400 hover:text-indigo-300 underline">Voir la page publique ↗</a>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <p className="text-3xl font-black text-white">{total}<span className="text-base text-gray-500 font-normal"> / {pool}</span></p>
        <p className="text-xs text-gray-400">{unitLabel} générés</p>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${pool > 0 ? Math.min(100, (total / pool) * 100) : 0}%` }} />
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-gray-500">{batchInfo}</p>
        <button onClick={onGenerate} disabled={busy} className="px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Générer un batch
        </button>
      </div>
    </div>
  );
}
