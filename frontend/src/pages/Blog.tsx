import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { BookOpen, Calendar, Eye, ArrowLeft, ArrowRight, Tag, Sparkles, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import LeadMagnetForm from "@/components/LeadMagnetForm";
import SocialShareButtons from "@/components/SocialShareButtons";

type Article = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  coverImage: string | null;
  language: string;
  publishedAt: string;
  views: number;
};

const BLOG_BANNER_DISMISS_KEY = "cryptoia_blog_banner_dismissed_v1";

export default function Blog() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug?: string }>();
  const lang = i18n.resolvedLanguage?.startsWith("en") ? "en" : "fr";
  const [articles, setArticles] = useState<Article[]>([]);
  const [single, setSingle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return typeof window !== "undefined" && localStorage.getItem(BLOG_BANNER_DISMISS_KEY) === "1"; }
    catch { return false; }
  });

  const dismissBanner = () => {
    setBannerDismissed(true);
    try { localStorage.setItem(BLOG_BANNER_DISMISS_KEY, "1"); } catch {}
  };

  const handleCtaClick = (location: "top_banner" | "inline_end" | "article_card") => {
    trackEvent("blog_cta_clicked", { location, slug: single?.slug || slug || "list" });
  };

  useEffect(() => {
    if (slug) {
      setLoading(true);
      fetch(`/api/v1/blog/article/${encodeURIComponent(slug)}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.ok) {
            setSingle(j.article);
            trackEvent("blog_article_viewed", { slug: j.article.slug, tags: j.article.tags });
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      setSingle(null);
      fetch("/api/v1/blog/list?limit=30")
        .then((r) => r.json())
        .then((j) => { if (j.ok) setArticles(j.articles || []); })
        .finally(() => setLoading(false));
    }
  }, [slug]);

  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "fr-FR", { year: "numeric", month: "long", day: "numeric" }); }
    catch { return iso?.slice(0, 10) || ""; }
  };

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] p-4 md:p-7 pt-[72px] md:pt-7 max-w-5xl mx-auto">
        {/* Sticky CTA banner — only on blog (list + single), dismissable */}
        {!bannerDismissed && (
          <div
            data-testid="blog-sticky-banner"
            className="sticky top-0 z-40 -mx-4 md:-mx-7 mb-4 px-4 md:px-7 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg"
          >
            <div className="flex items-center justify-between gap-3 max-w-5xl mx-auto">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Sparkles className="w-4 h-4 flex-shrink-0 animate-pulse" />
                <p className="text-xs md:text-sm font-medium truncate">
                  {lang === "en"
                    ? "🎯 Try AI signals free for 7 days — no credit card required"
                    : "🎯 Essai gratuit 7 jours des signaux IA — sans carte bancaire"}
                </p>
              </div>
              <Link
                to="/abonnements"
                onClick={() => handleCtaClick("top_banner")}
                data-testid="blog-banner-cta"
                className="flex-shrink-0 px-3 md:px-4 py-1.5 rounded-full bg-white text-indigo-600 text-xs md:text-sm font-black hover:scale-105 transition-transform whitespace-nowrap"
              >
                {lang === "en" ? "Start free" : "Commencer"} →
              </Link>
              <button
                onClick={dismissBanner}
                data-testid="blog-banner-dismiss"
                aria-label="Dismiss"
                className="flex-shrink-0 p-1 rounded-full hover:bg-white/15 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <PageHeader
          icon={<BookOpen className="w-6 h-6" />}
          title={single ? single.title : (lang === "en" ? "Blog" : "Blog")}
          subtitle={single
            ? (lang === "en" ? "AI-curated insights on crypto markets" : "Analyses IA-curées du marché crypto")
            : (lang === "en" ? "Daily AI-generated articles on crypto markets, trading strategies, and on-chain insights." : "Articles quotidiens générés par IA sur le marché crypto, les stratégies de trading et les données on-chain.")}
          accentColor="indigo"
          steps={single ? [] : [
            { n: "1", title: lang === "en" ? "Read daily" : "Lis chaque jour", desc: lang === "en" ? "New AI-curated article published every day." : "Nouvel article IA publié chaque jour." },
            { n: "2", title: lang === "en" ? "Stay sharp" : "Reste affûté", desc: lang === "en" ? "Markets analyses, trading setups, narratives." : "Analyses de marché, setups de trading, narratives." },
            { n: "3", title: lang === "en" ? "Share & grow" : "Partage & grandis", desc: lang === "en" ? "Each article shareable on social media." : "Chaque article partageable sur les réseaux." },
          ]}
        />

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
          </div>
        )}

        {/* SINGLE ARTICLE */}
        {!loading && single && (
          <article className="prose prose-invert max-w-none" data-testid="blog-article">
            <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-6">
              <ArrowLeft className="w-3.5 h-3.5" /> {lang === "en" ? "Back to all articles" : "Retour à tous les articles"}
            </Link>
            {single.coverImage && (
              <img src={single.coverImage} alt={single.title} loading="eager" decoding="async" fetchPriority="high" className="w-full rounded-2xl mb-6" />
            )}
            <h1 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              {single.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-6 flex-wrap">
              <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(single.publishedAt)}</span>
              <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {single.views || 0}</span>
              {single.tags?.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                  <Tag className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
            </div>
            <div
              className="text-sm md:text-base text-gray-200 leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: single.content }}
            />

            {/* Social Share buttons — visitors share content for us */}
            <div className="mt-8 pt-6 border-t border-white/[0.06]">
              <SocialShareButtons
                url={typeof window !== "undefined" ? window.location.href : `https://www.cryptoia.ca/blog/${single.slug}`}
                title={single.title}
                slug={single.slug}
              />
            </div>

            {/* Lead Magnet email capture — pre-conversion */}
            <div className="mt-10 not-prose">
              <LeadMagnetForm source={`blog/${single.slug}`} />
            </div>

            {/* In-article conversion CTA */}
            <div
              data-testid="blog-inline-cta"
              className="mt-10 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-6 md:p-8 not-prose"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-300" />
                <span className="text-[10px] uppercase tracking-widest font-black text-indigo-300">
                  {lang === "en" ? "Try CryptoIA" : "Découvre CryptoIA"}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white mb-3 leading-tight">
                {lang === "en"
                  ? "Want to apply this strategy with real-time AI signals?"
                  : "Tu veux appliquer cette stratégie avec des signaux IA en temps réel ?"}
              </h3>
              <p className="text-sm text-gray-300 mb-5 leading-relaxed">
                {lang === "en"
                  ? "Get unlimited access to AI signals scanning 200+ pairs 24/7, Telegram alerts, and our exclusive market analyses. 7-day free trial, no credit card required."
                  : "Accès illimité aux signaux IA scannant 200+ paires 24/7, alertes Telegram, et nos analyses exclusives du marché. Essai gratuit 7 jours, sans carte bancaire."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/abonnements"
                  onClick={() => handleCtaClick("inline_end")}
                  data-testid="blog-inline-cta-primary"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-black hover:scale-105 transition-transform shadow-lg shadow-indigo-500/30"
                >
                  {lang === "en" ? "Start free trial" : "Démarrer l'essai gratuit"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/ai-signals"
                  data-testid="blog-inline-cta-secondary"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.06] border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-colors"
                >
                  {lang === "en" ? "See AI signals" : "Voir les signaux IA"}
                </Link>
              </div>
            </div>
          </article>
        )}

        {/* LIST */}
        {!loading && !single && articles.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {lang === "en" ? "No articles yet. Check back soon!" : "Aucun article pour l'instant. Revenez bientôt !"}
            </p>
          </div>
        )}
        {!loading && !single && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="blog-list">
            {articles.map((a) => (
              <Link
                key={a.slug}
                to={`/blog/${a.slug}`}
                className="group rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-indigo-500/30 overflow-hidden transition-all hover:-translate-y-1"
                data-testid={`blog-card-${a.slug}`}
              >
                {a.coverImage && (
                  <img src={a.coverImage} alt={a.title} loading="lazy" decoding="async" className="w-full h-44 object-cover" />
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2">
                    <Calendar className="w-3 h-3" /> {fmtDate(a.publishedAt)}
                    <span className="text-gray-700">·</span>
                    <Eye className="w-3 h-3" /> {a.views || 0}
                  </div>
                  <h2 className="text-lg font-black text-white mb-2 group-hover:text-indigo-300 transition-colors leading-tight">
                    {a.title}
                  </h2>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{a.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 flex-wrap">
                      {a.tags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-bold">{tag}</span>
                      ))}
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
}
