// Crypto comparison page — /compare (list) + /compare/:slug (detail)
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import TrialBanner from "@/components/TrialBanner";
import { Scale, ArrowRight, ArrowLeft, Trophy, HelpCircle } from "lucide-react";

type CompareItem = {
  slug: string;
  a: string;
  b: string;
  title: string;
  meta_description?: string;
  intro?: string;
  criteria?: { name: string; a: string; b: string; winner: string }[];
  verdict?: string;
  faq?: { q: string; a: string }[];
};

export default function Compare() {
  const { slug } = useParams<{ slug?: string }>();
  if (slug) return <CompareDetail slug={slug} />;
  return <CompareList />;
}

function CompareList() {
  const { t } = useTranslation();
  const [items, setItems] = useState<CompareItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/v1/compare").then(r => r.json()).then(d => { if (d?.ok) setItems(d.items || []); setLoading(false); }).catch(() => setLoading(false));
    document.title = t("pages.compare.seoTitle");
  }, [t]);
  return (
    <div className="flex min-h-screen bg-[#0a0e1a] text-white">
      <Sidebar />
      <main className="flex-1 px-6 py-10 max-w-5xl mx-auto" data-testid="compare-list">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 mb-4">
            <Scale className="w-3.5 h-3.5 text-purple-300" />
            <span className="text-[11px] uppercase tracking-widest font-black text-purple-300">{t("pages.compare.title")}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-3 bg-gradient-to-r from-purple-300 via-pink-300 to-rose-300 bg-clip-text text-transparent">{t("pages.compare.title")}</h1>
          <p className="text-base text-gray-400 max-w-2xl mx-auto">{t("pages.compare.subtitle")}</p>
        </div>
        {loading && <p className="text-center text-gray-500 py-12">{t("pages.compareExtra.loading")}</p>}
        {!loading && items.length === 0 && (
          <p className="text-center text-gray-500 py-12" data-testid="compare-empty">
            {t("pages.compareExtra.empty")} <Link to="/admin/seo-content" className="text-purple-400 hover:underline">{t("pages.compareExtra.emptyAdminLink")}</Link>
          </p>
        )}
        <div className="grid md:grid-cols-2 gap-3">
          {items.map(item => (
            <Link key={item.slug} to={`/compare/${item.slug}`} data-testid={`compare-item-${item.slug}`}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-purple-500/30 transition-all p-5">
              <div className="flex items-center gap-3 text-white font-black mb-2">
                <span className="text-base">{item.a}</span>
                <span className="text-gray-500 text-xs">VS</span>
                <span className="text-base">{item.b}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform ml-auto" />
              </div>
              <p className="text-xs text-gray-400">{item.title}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8"><TrialBanner source="compare-list" /></div>
        <Footer />
      </main>
    </div>
  );
}

function CompareDetail({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const [item, setItem] = useState<CompareItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    fetch(`/api/v1/compare/${slug}`).then(r => { if (r.status === 404) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then(d => { if (d?.ok) { setItem(d.item); document.title = `${d.item.title} — CryptoIA`; } setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  return (
    <div className="flex min-h-screen bg-[#0a0e1a] text-white">
      <Sidebar />
      <main className="flex-1 px-6 py-10 max-w-4xl mx-auto" data-testid={item ? "compare-detail" : notFound ? "compare-not-found-wrap" : "compare-loading"}>
        <Link to="/compare" className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 mb-6"><ArrowLeft className="w-4 h-4" /> {t("pages.compareExtra.allComparisons")}</Link>
        {loading && <p className="text-center text-gray-500 py-12">{t("pages.compareExtra.loading")}</p>}
        {notFound && !item && <p className="text-center text-gray-500 py-12" data-testid="compare-not-found">{t("pages.compareExtra.notFound")}</p>}
        {item && (
          <article>
            <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{item.title}</h1>
            {item.intro && <div className="text-gray-300 leading-relaxed border-l-2 border-purple-500/50 pl-4 italic mb-8" dangerouslySetInnerHTML={{ __html: markdownToHtml(item.intro) }} />}
            {item.criteria && item.criteria.length > 0 && (
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-sm border-collapse" data-testid="compare-criteria-table">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider font-black text-gray-400">{t("pages.compareExtra.criterion")}</th>
                      <th className="text-left py-3 px-3 font-black text-white">{item.a}</th>
                      <th className="text-left py-3 px-3 font-black text-white">{item.b}</th>
                      <th className="text-center py-3 px-3 text-[11px] uppercase tracking-wider font-black text-gray-400">{t("pages.compareExtra.winner")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.criteria.map((c, i) => (
                      <tr key={i} className="border-b border-white/[0.04] align-top">
                        <td className="py-3 px-3 font-bold text-gray-300 whitespace-nowrap">{c.name}</td>
                        <td className="py-3 px-3 text-gray-300">{c.a}</td>
                        <td className="py-3 px-3 text-gray-300">{c.b}</td>
                        <td className="py-3 px-3 text-center">
                          {c.winner === item.a && <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold"><Trophy className="w-3 h-3" /> {item.a}</span>}
                          {c.winner === item.b && <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold"><Trophy className="w-3 h-3" /> {item.b}</span>}
                          {(c.winner === 'égalité' || c.winner === 'egalité' || !c.winner) && <span className="text-gray-500 text-xs">{t("pages.compareExtra.tie")}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {item.verdict && (
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/[0.07] p-6 mb-8">
                <h2 className="text-lg font-black text-purple-200 mb-3 flex items-center gap-2"><Trophy className="w-4 h-4" /> {t("pages.compareExtra.verdict")}</h2>
                <div className="text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: markdownToHtml(item.verdict) }} />
              </div>
            )}
            {item.faq && item.faq.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm uppercase tracking-wider text-gray-400 font-black mb-3 flex items-center gap-2"><HelpCircle className="w-4 h-4" /> {t("pages.compareExtra.faq")}</h3>
                <div className="space-y-3">
                  {item.faq.map((f, i) => (
                    <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <p className="font-bold text-white mb-2">{f.q}</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{f.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
        <div className="mt-8"><TrialBanner source="compare-detail" /></div>
        <Footer />
      </main>
    </div>
  );
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.*)$/gm, '<h3 class="text-lg font-black mt-6 mb-2 text-white">$1</h3>')
    .replace(/^## (.*)$/gm, '<h2 class="text-xl font-black mt-8 mb-3 text-purple-200">$1</h2>')
    .replace(/^- (.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\n\n/g, '</p><p class="mt-4">')
    .replace(/^/, '<p>')
    .concat('</p>');
}
