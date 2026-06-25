// Per-coin SEO landing pages — /crypto (list) + /crypto/:symbol (detail)
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { TrendingUp, TrendingDown, ArrowLeft, Coins, Sparkles, ShieldAlert, Target, HelpCircle, ExternalLink } from "lucide-react";

type CoinListItem = {
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  change_24h_pct: number;
  change_7d_pct: number;
};

type CoinDetail = {
  symbol: string;
  market: {
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    total_volume: number;
    circulating_supply: number;
    max_supply: number;
    ath: number;
    ath_change_percentage: number;
    ath_date: string;
    change_24h_pct: number;
    change_7d_pct: number;
  };
  description: null | {
    tagline?: string;
    what_is?: string;
    how_it_works?: string;
    use_cases?: string[];
    strengths?: string[];
    risks?: string[];
    history?: string;
    faq?: { q: string; a: string }[];
  };
};

function fmt(n: number | undefined | null, digits = 2): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1) return `$${n.toFixed(digits)}`;
  return `$${n.toFixed(4)}`;
}
function fmtSupply(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString();
}

export default function CryptoPages() {
  const { symbol } = useParams<{ symbol?: string }>();
  if (symbol) return <CoinDetailPage symbol={symbol} />;
  return <CoinList />;
}

function CoinList() {
  const [items, setItems] = useState<CoinListItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/v1/coins").then(r => r.json()).then(d => { if (d?.ok) setItems(d.items || []); setLoading(false); }).catch(() => setLoading(false));
    document.title = "Cryptos — Cours, fiches et analyse IA — CryptoIA";
  }, []);
  return (
    <div className="flex min-h-screen bg-[#0a0e1a] text-white">
      <Sidebar />
      <main className="flex-1 px-6 py-10 max-w-6xl mx-auto" data-testid="crypto-list">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4">
            <Coins className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-[11px] uppercase tracking-widest font-black text-cyan-300">Cryptos</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-3 bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">Cryptomonnaies</h1>
          <p className="text-base text-gray-400 max-w-2xl mx-auto">Cours en temps réel, fiches éditoriales et signaux IA des 50+ cryptos majeures.</p>
        </div>
        {loading && <p className="text-center text-gray-500 py-12">Chargement des cours…</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/[0.05]">
                <th className="text-left py-2 px-3 font-black">#</th>
                <th className="text-left py-2 px-3 font-black">Nom</th>
                <th className="text-right py-2 px-3 font-black">Prix</th>
                <th className="text-right py-2 px-3 font-black">24h</th>
                <th className="text-right py-2 px-3 font-black hidden md:table-cell">7j</th>
                <th className="text-right py-2 px-3 font-black hidden md:table-cell">Capitalisation</th>
                <th className="text-center py-2 px-3 font-black"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(c => (
                <tr key={c.symbol} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors" data-testid={`crypto-row-${c.symbol}`}>
                  <td className="py-3 px-3 text-gray-500 text-xs">{c.market_cap_rank}</td>
                  <td className="py-3 px-3">
                    <Link to={`/crypto/${c.symbol}`} className="flex items-center gap-2 hover:text-cyan-300 transition-colors">
                      {c.image && <img src={c.image} alt={c.name} className="w-6 h-6 rounded-full" loading="lazy" />}
                      <span className="font-bold text-white">{c.name}</span>
                      <span className="text-gray-500 text-xs uppercase">{c.symbol}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-right text-white font-bold">{fmt(c.current_price)}</td>
                  <td className={`py-3 px-3 text-right font-bold ${c.change_24h_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {c.change_24h_pct >= 0 ? "+" : ""}{c.change_24h_pct?.toFixed(2) || "—"}%
                  </td>
                  <td className={`py-3 px-3 text-right font-bold hidden md:table-cell ${c.change_7d_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {c.change_7d_pct >= 0 ? "+" : ""}{c.change_7d_pct?.toFixed(2) || "—"}%
                  </td>
                  <td className="py-3 px-3 text-right text-gray-300 hidden md:table-cell">{fmt(c.market_cap, 0)}</td>
                  <td className="py-3 px-3 text-center">
                    <Link to={`/crypto/${c.symbol}`} className="text-cyan-400 hover:text-cyan-300 text-xs font-bold">Voir →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Footer />
      </main>
    </div>
  );
}

function CoinDetailPage({ symbol }: { symbol: string }) {
  const [data, setData] = useState<CoinDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    fetch(`/api/v1/coin/${symbol}`).then(r => {
      if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
      return r.json();
    }).then(d => {
      if (d?.ok) { setData(d); document.title = `${d.market.name} (${symbol.toUpperCase()}) — Cours et analyse — CryptoIA`; }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [symbol]);

  return (
    <div className="flex min-h-screen bg-[#0a0e1a] text-white">
      <Sidebar />
      <main className="flex-1 px-6 py-10 max-w-4xl mx-auto" data-testid="crypto-detail">
        <Link to="/crypto" className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 mb-6"><ArrowLeft className="w-4 h-4" /> Toutes les cryptos</Link>
        {loading && <p className="text-center text-gray-500 py-12">Chargement…</p>}
        {notFound && <p className="text-center text-gray-500 py-12" data-testid="crypto-not-found">Cryptomonnaie non supportée.</p>}
        {data && (
          <>
            <header className="flex items-start gap-4 mb-8 flex-wrap">
              {data.market.image && <img src={data.market.image} alt={data.market.name} className="w-16 h-16 rounded-full" />}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-black text-white">{data.market.name} <span className="text-gray-500 text-xl uppercase">{symbol}</span></h1>
                {data.description?.tagline && <p className="text-base text-gray-400 mt-1">{data.description.tagline}</p>}
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-white" data-testid="crypto-price">{fmt(data.market.current_price)}</p>
                <p className={`text-sm font-bold ${data.market.change_24h_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {data.market.change_24h_pct >= 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                  {" "}{data.market.change_24h_pct >= 0 ? "+" : ""}{data.market.change_24h_pct?.toFixed(2) || "—"}% (24h)
                </p>
              </div>
            </header>
            {/* Market stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              <StatCard label="Capitalisation" value={fmt(data.market.market_cap, 0)} />
              <StatCard label="Volume 24h" value={fmt(data.market.total_volume, 0)} />
              <StatCard label="Supply circulant" value={fmtSupply(data.market.circulating_supply)} />
              <StatCard label="Supply max" value={data.market.max_supply ? fmtSupply(data.market.max_supply) : "∞"} />
              <StatCard label="ATH" value={fmt(data.market.ath)} sub={data.market.ath_date ? new Date(data.market.ath_date).toLocaleDateString("fr-CA") : undefined} />
              <StatCard label="Depuis ATH" value={`${data.market.ath_change_percentage?.toFixed(1) || "—"}%`} sub={data.market.ath_change_percentage < 0 ? "Sous l'ATH" : "Nouveau record"} />
              <StatCard label="Rang #" value={String(data.market.market_cap_rank || "—")} />
              <StatCard label="7 jours" value={`${data.market.change_7d_pct >= 0 ? "+" : ""}${data.market.change_7d_pct?.toFixed(2) || "—"}%`} />
            </div>
            {/* CTA for IA signal */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-5 mb-10 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] uppercase tracking-widest font-black text-white/80 mb-1">⚡ Signal IA disponible</p>
                <p className="text-base font-black text-white">Tu veux savoir si c&apos;est le bon moment pour {data.market.name} ?</p>
              </div>
              <Link to={`/signaux?coin=${symbol}`} className="px-5 py-2.5 rounded-lg bg-white text-indigo-700 font-black text-sm hover:bg-indigo-50 transition-colors whitespace-nowrap">Voir le signal IA →</Link>
            </div>
            {/* Description sections */}
            {data.description ? (
              <article className="space-y-8">
                {data.description.what_is && (
                  <section>
                    <h2 className="text-xl font-black text-cyan-200 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Qu&apos;est-ce que {data.market.name} ?</h2>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{data.description.what_is}</p>
                  </section>
                )}
                {data.description.how_it_works && (
                  <section>
                    <h2 className="text-xl font-black text-cyan-200 mb-3">Comment ça marche ?</h2>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{data.description.how_it_works}</p>
                  </section>
                )}
                {data.description.use_cases && (
                  <section>
                    <h2 className="text-xl font-black text-cyan-200 mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> Cas d&apos;usage</h2>
                    <ul className="space-y-1.5">{data.description.use_cases.map((u, i) => <li key={i} className="text-gray-300 pl-5 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-cyan-400">{u}</li>)}</ul>
                  </section>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  {data.description.strengths && (
                    <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
                      <h3 className="text-sm font-black text-emerald-300 mb-2 uppercase tracking-wider">Forces</h3>
                      <ul className="space-y-1.5">{data.description.strengths.map((s, i) => <li key={i} className="text-sm text-gray-300 pl-4 relative before:absolute before:left-0 before:content-['✓'] before:text-emerald-400">{s}</li>)}</ul>
                    </section>
                  )}
                  {data.description.risks && (
                    <section className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
                      <h3 className="text-sm font-black text-amber-300 mb-2 uppercase tracking-wider flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Risques</h3>
                      <ul className="space-y-1.5">{data.description.risks.map((r, i) => <li key={i} className="text-sm text-gray-300 pl-4 relative before:absolute before:left-0 before:content-['⚠'] before:text-amber-400">{r}</li>)}</ul>
                    </section>
                  )}
                </div>
                {data.description.history && (
                  <section>
                    <h2 className="text-xl font-black text-cyan-200 mb-3">Histoire</h2>
                    <p className="text-gray-300 leading-relaxed">{data.description.history}</p>
                  </section>
                )}
                {data.description.faq && data.description.faq.length > 0 && (
                  <section>
                    <h2 className="text-xl font-black text-cyan-200 mb-3 flex items-center gap-2"><HelpCircle className="w-4 h-4" /> FAQ</h2>
                    <div className="space-y-3">
                      {data.description.faq.map((f, i) => (
                        <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <p className="font-bold text-white mb-2">{f.q}</p>
                          <p className="text-sm text-gray-300 leading-relaxed">{f.a}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </article>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                <p className="text-sm text-gray-400">Fiche éditoriale en cours de génération… Cours en temps réel disponibles ci-dessus.</p>
                <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-cyan-400 hover:text-cyan-300">Plus d&apos;infos sur CoinGecko <ExternalLink className="w-3 h-3" /></a>
              </div>
            )}
          </>
        )}
        <Footer />
      </main>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className="text-base font-black text-white">{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}
