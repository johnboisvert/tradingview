import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Gem, RefreshCw, TrendingUp, TrendingDown, ArrowUpDown, Search, BookOpen, Shield, Target, AlertTriangle, Clock } from "lucide-react";

const SPOT_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/b3c0b3a0-ae42-46d0-9f3a-9f12780c9e10.png";

interface SpotCoin {
  id: string; symbol: string; name: string; price: number; change24h: number;
  high24h: number; low24h: number; volume: number; market_cap: number;
  image: string; ath: number; athChangePercent: number;
}

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(2)}`;
}

export default function SpotTrading() {
  const [coins, setCoins] = useState<SpotCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"market_cap" | "change24h" | "volume">("market_cap");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h"
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCoins(data.map((c: Record<string, unknown>) => ({
            id: c.id as string, symbol: ((c.symbol as string) || "").toUpperCase(), name: c.name as string,
            price: (c.current_price as number) || 0, change24h: (c.price_change_percentage_24h as number) || 0,
            high24h: (c.high_24h as number) || 0, low24h: (c.low_24h as number) || 0,
            volume: (c.total_volume as number) || 0, market_cap: (c.market_cap as number) || 0,
            image: c.image as string, ath: (c.ath as number) || 0, athChangePercent: (c.ath_change_percentage as number) || 0,
          })));
        }
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 60000); return () => clearInterval(interval); }, [fetchData]);

  const filtered = coins
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => { if (sortBy === "change24h") return b.change24h - a.change24h; if (sortBy === "volume") return b.volume - a.volume; return b.market_cap - a.market_cap; });

  const totalVol = coins.reduce((s, c) => s + c.volume, 0);
  const avgChange = coins.length ? coins.reduce((s, c) => s + c.change24h, 0) / coins.length : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={SPOT_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Gem className="w-7 h-7 text-cyan-400" />
                <h1 className="text-2xl font-extrabold">Spot Trading — Investissement Long Terme</h1>
              </div>
              <p className="text-sm text-gray-400">Achat et détention de cryptos • Pas de levier • Stratégie la plus sûre</p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* What is Spot Trading */}
        <div className="bg-gradient-to-r from-cyan-500/[0.06] to-blue-500/[0.06] border border-cyan-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-cyan-400">Qu'est-ce que le Spot Trading ?</h2>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            Le <strong className="text-white">Spot Trading</strong> (ou trading au comptant) consiste à <strong className="text-cyan-400">acheter et détenir</strong> des crypto-monnaies réelles.
            Contrairement au trading à effet de levier (futures/margin), vous possédez réellement vos actifs. C'est la forme d'investissement la plus simple et la plus sûre en crypto.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-black/20 rounded-xl p-4 border border-white/[0.04]">
              <Shield className="w-5 h-5 text-emerald-400 mb-2" />
              <h3 className="font-bold text-sm mb-1">Pas de Liquidation</h3>
              <p className="text-xs text-gray-400">Contrairement aux futures, vous ne pouvez pas être liquidé. Même si le prix baisse de 90%, vous gardez vos cryptos.</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4 border border-white/[0.04]">
              <Clock className="w-5 h-5 text-blue-400 mb-2" />
              <h3 className="font-bold text-sm mb-1">Vision Long Terme</h3>
              <p className="text-xs text-gray-400">Le spot est idéal pour l'investissement sur 1-5+ ans. Historiquement, BTC et ETH ont toujours atteint de nouveaux ATH sur des cycles de 4 ans.</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4 border border-white/[0.04]">
              <Target className="w-5 h-5 text-amber-400 mb-2" />
              <h3 className="font-bold text-sm mb-1">Propriété Réelle</h3>
              <p className="text-xs text-gray-400">Vous possédez réellement vos cryptos. Vous pouvez les transférer, les staker, les utiliser en DeFi, ou les stocker en cold wallet.</p>
            </div>
          </div>
        </div>

        {/* Investment Guide */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">📚 Guide d'Investissement Spot</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Sur quoi se baser */}
            <div>
              <h3 className="font-bold text-sm text-cyan-400 mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> Sur quoi se baser pour investir ?</h3>
              <div className="space-y-2.5">
                {[
                  { title: "Capitalisation de marché", desc: "Privilégiez les cryptos dans le top 20. Plus la market cap est élevée, plus l'actif est établi et moins volatil.", icon: "📊" },
                  { title: "Fondamentaux du projet", desc: "Étudiez l'équipe, la technologie, les cas d'usage, les partenariats. Un projet solide résiste mieux aux bear markets.", icon: "🔍" },
                  { title: "Volume de trading", desc: "Un volume élevé = liquidité. Évitez les cryptos avec un volume < 10M$/jour pour pouvoir acheter/vendre facilement.", icon: "📈" },
                  { title: "Distance à l'ATH", desc: "Acheter quand une crypto est à -50% ou plus de son ATH peut être une opportunité (si les fondamentaux sont intacts).", icon: "🎯" },
                  { title: "Tokenomics", desc: "Vérifiez l'offre totale, le taux d'inflation, le calendrier de vesting. Une offre limitée (comme BTC) est généralement positive.", icon: "🪙" },
                  { title: "Adoption et écosystème", desc: "Nombre de développeurs, TVL en DeFi, nombre d'utilisateurs actifs. Plus l'écosystème est actif, plus le projet a de valeur.", icon: "🌐" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 bg-black/20 rounded-xl p-3 border border-white/[0.04]">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <h4 className="font-bold text-xs">{item.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conseils */}
            <div>
              <h3 className="font-bold text-sm text-emerald-400 mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Conseils d'Investissement Spot</h3>
              <div className="space-y-2.5">
                {[
                  { title: "Allocation recommandée", desc: "60% BTC + 25% ETH + 10% Altcoins top 10 + 5% Small caps. Ajustez selon votre tolérance au risque.", type: "tip" },
                  { title: "Utilisez le DCA", desc: "N'investissez pas tout d'un coup. Étalez vos achats sur plusieurs semaines/mois pour réduire le risque de timing.", type: "tip" },
                  { title: "Sécurisez vos actifs", desc: "Pour les montants > 1000$, utilisez un cold wallet (Ledger, Trezor). 'Not your keys, not your coins.'", type: "warning" },
                  { title: "Ne vendez pas en panique", desc: "Les baisses de 30-50% sont NORMALES en crypto. Si vos fondamentaux sont intacts, gardez vos positions.", type: "warning" },
                  { title: "Prenez des profits", desc: "Quand votre portfolio fait x2 ou x3, prenez 20-30% de profits. Personne n'a jamais fait faillite en prenant des profits.", type: "tip" },
                  { title: "Diversifiez les secteurs", desc: "Ne mettez pas tout dans un seul secteur. Répartissez entre L1, L2, DeFi, Gaming, AI pour réduire le risque.", type: "tip" },
                  { title: "Évitez le FOMO", desc: "N'achetez pas une crypto qui a déjà fait +200% en une semaine. Attendez un pullback ou cherchez la prochaine opportunité.", type: "warning" },
                  { title: "Faites vos propres recherches (DYOR)", desc: "Ne suivez jamais aveuglément les influenceurs. Analysez vous-même les projets avant d'investir.", type: "warning" },
                ].map((item, i) => (
                  <div key={i} className={`flex gap-3 rounded-xl p-3 border ${
                    item.type === "warning" ? "bg-amber-500/[0.03] border-amber-500/10" : "bg-emerald-500/[0.03] border-emerald-500/10"
                  }`}>
                    <span className="text-sm mt-0.5">{item.type === "warning" ? "⚠️" : "💡"}</span>
                    <div>
                      <h4 className="font-bold text-xs">{item.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Spot vs Futures comparison */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">⚖️ Spot vs Futures — Pourquoi choisir le Spot ?</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase">Critère</th>
                  <th className="py-3 px-4 text-center text-xs font-bold text-emerald-400 uppercase">Spot ✅</th>
                  <th className="py-3 px-4 text-center text-xs font-bold text-red-400 uppercase">Futures ⚠️</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Risque de liquidation", "Aucun", "Oui (perte totale possible)"],
                  ["Propriété des actifs", "Oui, vous possédez réellement", "Non, contrats dérivés"],
                  ["Effet de levier", "Aucun (1x)", "Jusqu'à 125x"],
                  ["Frais", "Frais d'achat uniquement", "Frais + funding rate"],
                  ["Staking possible", "Oui", "Non"],
                  ["Complexité", "Simple", "Complexe"],
                  ["Idéal pour", "Investissement long terme", "Trading court terme"],
                  ["Risque", "Faible à moyen", "Très élevé"],
                ].map(([critere, spot, futures], i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-sm font-medium">{critere}</td>
                    <td className="py-3 px-4 text-center text-sm text-emerald-400">{spot}</td>
                    <td className="py-3 px-4 text-center text-sm text-red-400">{futures}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Paires Disponibles</p>
            <p className="text-2xl font-extrabold">{coins.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Volume Total 24h</p>
            <p className="text-2xl font-extrabold text-cyan-400">{formatNum(totalVol)}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Variation Moyenne</p>
            <p className={`text-2xl font-extrabold ${avgChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
            </p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">En Hausse</p>
            <p className="text-2xl font-extrabold text-emerald-400">{coins.filter((c) => c.change24h > 0).length}/{coins.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une crypto..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              {([
                { key: "market_cap" as const, label: "Market Cap" },
                { key: "change24h" as const, label: "24h %" },
                { key: "volume" as const, label: "Volume" },
              ]).map((s) => (
                <button key={s.key} onClick={() => setSortBy(s.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    sortBy === s.key ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]"
                  }`}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["#", "Paire", "Prix", "24h", "High 24h", "Low 24h", "Volume", "Market Cap", "ATH", "vs ATH"].map((h) => (
                    <th key={h} className={`py-3 px-4 text-xs font-bold text-gray-500 uppercase ${h === "#" || h === "Paire" ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-500 font-semibold">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {c.image ? <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" /> : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold">{c.symbol.slice(0, 2)}</div>}
                        <div><p className="text-sm font-bold">{c.symbol}/USDT</p><p className="text-[10px] text-gray-500">{c.name}</p></div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold">${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}</td>
                    <td className={`py-3 px-4 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {c.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-300">${c.high24h >= 1 ? c.high24h.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.high24h.toFixed(6)}</td>
                    <td className="py-3 px-4 text-right text-sm text-gray-300">${c.low24h >= 1 ? c.low24h.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.low24h.toFixed(6)}</td>
                    <td className="py-3 px-4 text-right text-sm text-gray-300">{formatNum(c.volume)}</td>
                    <td className="py-3 px-4 text-right text-sm text-gray-300">{formatNum(c.market_cap)}</td>
                    <td className="py-3 px-4 text-right text-sm text-gray-300">${c.ath >= 1 ? c.ath.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.ath.toFixed(6)}</td>
                    <td className={`py-3 px-4 text-right text-sm font-bold ${c.athChangePercent >= -10 ? "text-emerald-400" : c.athChangePercent >= -50 ? "text-amber-400" : "text-red-400"}`}>{c.athChangePercent.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-[10px] text-gray-600 leading-relaxed">
            ⚠️ Les informations présentées ne constituent pas des conseils financiers. Le trading de crypto-monnaies comporte des risques significatifs.
            Faites toujours vos propres recherches (DYOR) avant d'investir. N'investissez que ce que vous pouvez vous permettre de perdre.
          </p>
        </div>
      </main>
    </div>
  );
}