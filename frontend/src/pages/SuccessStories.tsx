import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/Sidebar";
import { Award, Star, Quote, Send, Lock, BarChart3, Globe, Clock } from "lucide-react";
import Footer from "@/components/Footer";

type Story = {
  name: string;
  role: string;
  location: string;
  avatar?: string;
  profit?: string;
  period?: string;
  rating?: number;
  quote: string;
  strategy?: string;
  highlight?: string;
  published_at?: string;
};

type PublicStats = {
  articles_count?: number;
  leaderboard_count?: number;
  active_subscribers?: number;
  crypto_pairs_scanned?: number;
  indicators_tracked?: number;
  languages_supported?: number;
};

export default function SuccessStories() {
  const { t } = useTranslation();
  const [stories, setStories] = useState<Story[]>([]);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "", quote: "" });
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  useEffect(() => {
    // Fetch verified stories (admin-curated) and real product stats — no fake data
    fetch("/api/v1/success-stories")
      .then((r) => r.json())
      .then((j) => { if (j.ok && Array.isArray(j.stories)) setStories(j.stories); })
      .catch(() => {});
    fetch("/api/v1/stats/public")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setStats(j); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.quote) return;
    setSubmitStatus("submitting");
    try {
      const res = await fetch("/api/v1/success-stories/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Erreur");
      setSubmitStatus("success");
      setForm({ name: "", email: "", role: "", quote: "" });
    } catch {
      setSubmitStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Award className="w-8 h-8 text-amber-400" />
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              {t("successStories.title")}
            </h1>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {t("successStories.intro")}
          </p>
        </div>

        {/* Real product facts — verified by backend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10" data-testid="success-stories-stats">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <BarChart3 className="w-5 h-5 text-indigo-300 mx-auto mb-2" />
            <div className="text-2xl font-black text-white">{stats?.crypto_pairs_scanned ?? "—"}+</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">{t("successStories.pairsScanned")}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <Star className="w-5 h-5 text-amber-300 mx-auto mb-2" />
            <div className="text-2xl font-black text-white">{stats?.indicators_tracked ?? "—"}+</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">{t("successStories.indicators")}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <Clock className="w-5 h-5 text-emerald-300 mx-auto mb-2" />
            <div className="text-2xl font-black text-white">24/7</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">{t("successStories.realtime")}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <Globe className="w-5 h-5 text-pink-300 mx-auto mb-2" />
            <div className="text-2xl font-black text-white">{stats?.languages_supported ?? "—"}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">{t("successStories.languages")}</div>
          </div>
        </div>

        {/* Stories list */}
        {stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            {stories.map((s, i) => (
              <article
                key={i}
                data-testid={`story-${i}`}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-6"
              >
                <Quote className="w-6 h-6 text-amber-400/60 mb-3" />
                <p className="text-sm text-gray-200 leading-relaxed mb-4">{s.quote}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  {s.avatar && <div className="text-2xl">{s.avatar}</div>}
                  <div className="flex-1">
                    <div className="font-bold text-white">{s.name}</div>
                    {s.role && <div className="text-xs text-gray-400">{s.role}{s.location ? ` · ${s.location}` : ""}</div>}
                  </div>
                  {s.rating && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: s.rating }).map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div
            data-testid="success-stories-empty"
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/5 via-white/[0.02] to-pink-500/5 p-10 text-center mb-10"
          >
            <Lock className="w-10 h-10 text-indigo-300 mx-auto mb-4" />
            <h3 className="text-xl font-black text-white mb-2">{t("successStories.emptyTitle")}</h3>
            <p className="text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
              {t("successStories.emptyBody")}
            </p>
          </div>
        )}

        {/* Submit your story */}
        <div className="max-w-2xl mx-auto rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] to-orange-500/[0.04] p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-4 h-4 text-amber-300" />
            <span className="text-[10px] uppercase tracking-widest font-black text-amber-300">{t("successStories.shareEyebrow")}</span>
          </div>
          <h3 className="text-xl font-black text-white mb-2">{t("successStories.shareTitle")}</h3>
          <p className="text-sm text-gray-300 mb-5 leading-relaxed">
            {t("successStories.shareBody")}
          </p>
          {submitStatus === "success" ? (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
              <div className="text-emerald-400 font-bold mb-1">✓ {t("successStories.thanks")}</div>
              <p className="text-sm text-gray-300">{t("successStories.thanksBody")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3" data-testid="story-submit-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  required
                  placeholder={t("successStories.placeholderName")}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="story-name"
                  className="px-3 py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-400/50"
                />
                <input
                  required
                  type="email"
                  placeholder={t("successStories.placeholderEmail")}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  data-testid="story-email"
                  className="px-3 py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>
              <input
                placeholder={t("successStories.placeholderRole")}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                data-testid="story-role"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-400/50"
              />
              <textarea
                required
                rows={4}
                placeholder={t("successStories.placeholderQuote")}
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
                data-testid="story-quote"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-400/50 resize-none"
              />
              <button
                type="submit"
                disabled={submitStatus === "submitting"}
                data-testid="story-submit"
                className="w-full px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60"
              >
                {submitStatus === "submitting" ? t("successStories.submitting") : t("successStories.submit")}
              </button>
              {submitStatus === "error" && (
                <p className="text-xs text-red-400" data-testid="story-error">{t("successStories.errorLine")}</p>
              )}
            </form>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}
