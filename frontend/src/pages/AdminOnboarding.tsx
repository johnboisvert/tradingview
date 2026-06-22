import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";
import { Mail, RefreshCw, Send, CheckCircle2, XCircle, Eye, ExternalLink, TrendingUp, Users, AlertCircle, FlaskConical, Trophy } from "lucide-react";

type FunnelStep = {
  step: number;
  days: number;
  key: string;
  sent_total: number;
  sent_success: number;
  sent_failed: number;
  unique_recipients: number;
  converted_to_paid: number;
  conversion_rate_pct: number;
};
type Totals = {
  total_users: number;
  total_users_with_email: number;
  total_free_users_with_email: number;
  total_paid_users: number;
};
type Stats = {
  ok: true;
  sequence: Array<{ step: number; days: number; key: string }>;
  totals: Totals;
  funnel: FunnelStep[];
  ab_test_j7?: {
    variant_A: { label: string; recipients: number; converted: number; conversion_rate_pct: number };
    variant_B: { label: string; recipients: number; converted: number; conversion_rate_pct: number };
    winner: 'A' | 'B' | null;
  };
  sent_total: number;
  last_5_events: Array<{
    ts: string;
    username: string;
    email: string;
    step: number;
    key: string;
    ok: boolean;
    variant?: string;
    error?: string;
  }>;
};

const STEP_LABELS: Record<number, { title: string; sub: string; color: string }> = {
  1: { title: "J+1 — Bienvenue", sub: "Signal IA gratuit en démo", color: "emerald" },
  2: { title: "J+3 — Étude de cas", sub: "Comment gagner +25%", color: "cyan" },
  3: { title: "J+7 — Code promo", sub: "WELCOME20 (-20%, 72h)", color: "amber" },
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

export default function AdminOnboarding() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const d = await api<Stats>("/api/v1/admin/onboarding/stats");
      if (d?.ok) setStats(d);
      else setError("Échec de chargement");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const sendTest = async (step: number) => {
    if (!testEmail.includes("@")) {
      toast.error("Email invalide");
      return;
    }
    setSending(true);
    try {
      const r = await api<{ ok: boolean; reason?: string }>(
        `/api/v1/admin/onboarding/send-test?step=${step}&email=${encodeURIComponent(testEmail)}`,
        "POST"
      );
      if (r.ok) toast.success(`Email J+${[1, 3, 7][step - 1]} envoyé à ${testEmail}`);
      else toast.error(`Échec : ${r.reason}`);
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSending(false);
    }
  };

  const previewUrl = (step: number) => `${window.location.origin}/api/v1/admin/onboarding/preview?step=${step}`;
  const openPreview = async (step: number, variant?: 'A' | 'B') => {
    try {
      const url = variant ? `${previewUrl(step)}&variant=${variant}` : previewUrl(step);
      const res = await fetch(url, {
        method: "POST",
        headers: { "x-admin-auth": getAdminAuth() },
      });
      const html = await res.text();
      const win = window.open("", "_blank");
      if (win) win.document.write(html);
    } catch {
      toast.error("Impossible d'ouvrir l'aperçu");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl" data-testid="admin-onboarding-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Mail className="w-6 h-6 text-cyan-400" /> Funnel Onboarding
            </h1>
            <p className="text-sm text-gray-400 mt-1">Séquence J+1 / J+3 / J+7 — Conversion free → paid</p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-sm flex items-center gap-2 transition"
            data-testid="refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Rafraîchir
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {stats && (
          <>
            {/* Totals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="totals-grid">
              <StatCard icon={<Users className="w-5 h-5 text-cyan-400" />} label="Utilisateurs total" value={String(stats.totals.total_users)} />
              <StatCard icon={<Mail className="w-5 h-5 text-emerald-400" />} label="Avec email" value={String(stats.totals.total_users_with_email)} />
              <StatCard icon={<Users className="w-5 h-5 text-amber-400" />} label="Free actifs" value={String(stats.totals.total_free_users_with_email)} sub="Cibles du funnel" />
              <StatCard icon={<TrendingUp className="w-5 h-5 text-purple-400" />} label="Payants" value={String(stats.totals.total_paid_users)} sub={`${stats.sent_total} emails envoyés`} />
            </div>

            {/* Funnel visualization */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5" data-testid="funnel-card">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Funnel par étape
              </h2>
              <div className="space-y-4">
                {stats.funnel.map((s) => {
                  const label = STEP_LABELS[s.step];
                  // Width proportional to recipients vs the max sent
                  const maxRecipients = Math.max(...stats.funnel.map(f => f.unique_recipients), 1);
                  const barWidth = (s.unique_recipients / maxRecipients) * 100;
                  return (
                    <div key={s.step} className="p-4 rounded-lg bg-black/30 border border-white/[0.04]" data-testid={`funnel-step-${s.step}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-white">{label.title}</p>
                          <p className="text-xs text-gray-400">{label.sub}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> {s.sent_success}</span>
                          {s.sent_failed > 0 && <span className="flex items-center gap-1 text-red-300"><XCircle className="w-3.5 h-3.5" /> {s.sent_failed}</span>}
                          <span className="text-amber-300 font-bold">{s.conversion_rate_pct.toFixed(1)}% conv.</span>
                        </div>
                      </div>
                      <div className="relative h-8 bg-white/[0.03] rounded-lg overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 bg-gradient-to-r from-${label.color}-500/30 to-${label.color}-400/20 border-r border-${label.color}-400/40 transition-all duration-500`}
                          style={{ width: `${Math.max(barWidth, 4)}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-3 text-xs">
                          <span className="text-white font-bold">{s.unique_recipients} destinataires uniques</span>
                          <span className="text-purple-300 font-bold">→ {s.converted_to_paid} payants</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => openPreview(s.step)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2 transition"
                          data-testid={`preview-step-${s.step}`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Aperçu
                        </button>
                        <button
                          onClick={() => sendTest(s.step)}
                          disabled={sending || !testEmail}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 disabled:opacity-50 transition"
                          data-testid={`send-test-step-${s.step}`}
                        >
                          <Send className="w-3.5 h-3.5" /> Envoyer test
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <label className="text-xs font-bold text-gray-400 mb-1 block">Email pour tester :</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="ton@email.com"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  data-testid="test-email-input"
                />
              </div>
            </div>

            {/* A/B Test J+7 */}
            {stats.ab_test_j7 && (
              <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-5" data-testid="ab-test-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-purple-400" /> A/B Test — J+7 Promo
                  </h2>
                  {stats.ab_test_j7.winner && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1" data-testid="ab-winner">
                      <Trophy className="w-3 h-3" /> Gagnant : Variant {stats.ab_test_j7.winner}
                    </span>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {(['A', 'B'] as const).map((v) => {
                    const data = v === 'A' ? stats.ab_test_j7!.variant_A : stats.ab_test_j7!.variant_B;
                    const isWinner = stats.ab_test_j7!.winner === v;
                    return (
                      <div key={v} className={`p-4 rounded-lg border ${isWinner ? 'bg-amber-500/5 border-amber-500/40' : 'bg-black/30 border-white/[0.06]'}`} data-testid={`variant-${v}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-bold ${isWinner ? 'text-amber-300' : 'text-white'}`}>Variant {v} {isWinner && '🏆'}</span>
                          <button
                            onClick={() => openPreview(3, v)}
                            className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-xs text-cyan-300 flex items-center gap-1"
                            data-testid={`preview-variant-${v}`}
                          >
                            <Eye className="w-3 h-3" /> Aperçu
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">{data.label}</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-black text-white">{data.recipients}</p>
                            <p className="text-[10px] text-gray-500">destinataires</p>
                          </div>
                          <div>
                            <p className="text-lg font-black text-emerald-300">{data.converted}</p>
                            <p className="text-[10px] text-gray-500">convertis</p>
                          </div>
                          <div>
                            <p className={`text-lg font-black ${isWinner ? 'text-amber-300' : 'text-purple-300'}`}>{data.conversion_rate_pct.toFixed(1)}%</p>
                            <p className="text-[10px] text-gray-500">taux conv.</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  💡 Le scheduler attribue les variantes de façon déterministe par username (50/50 hash). Patience : il faut au moins 20-50 utilisateurs par variante pour avoir un résultat statistiquement fiable.
                </p>
              </div>
            )}

            {/* Last events */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5" data-testid="last-events">
              <h2 className="text-base font-bold mb-3">Derniers envois</h2>
              {stats.last_5_events.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  Aucun email envoyé pour le moment. Les emails partent automatiquement quand un utilisateur gratuit atteint J+1, J+3 ou J+7 d&apos;inscription.
                </p>
              ) : (
                <ul className="space-y-2">
                  {stats.last_5_events.map((e, i) => (
                    <li key={i} className="p-3 rounded-lg bg-black/30 border border-white/[0.04] flex items-center gap-3" data-testid={`event-${i}`}>
                      {e.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">
                          <span className="text-cyan-300 font-bold">J+{[1, 3, 7][e.step - 1]}</span> → {e.email}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(e.ts).toLocaleString("fr-CA")}{e.error ? ` · ${e.error}` : ""}</p>
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

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-2">{icon}</div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
