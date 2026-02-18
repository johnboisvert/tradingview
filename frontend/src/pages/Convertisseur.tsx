import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { ArrowLeftRight, RefreshCw } from "lucide-react";

const CONV_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

interface CoinPrice { id: string; symbol: string; name: string; price: number; image: string; }

export default function Convertisseur() {
  const [coins, setCoins] = useState<CoinPrice[]>([]);
  const [from, setFrom] = useState("bitcoin");
  const [to, setTo] = useState("ethereum");
  const [amount, setAmount] = useState("1");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false"
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCoins(data.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            symbol: ((c.symbol as string) || "").toUpperCase(),
            name: c.name as string,
            price: (c.current_price as number) || 0,
            image: c.image as string,
          })));
        }
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 60000); return () => clearInterval(i); }, [fetchData]);

  const fromCoin = coins.find((c) => c.id === from);
  const toCoin = coins.find((c) => c.id === to);
  const numAmount = parseFloat(amount) || 0;
  const fromUSD = numAmount * (fromCoin?.price || 0);
  const result = toCoin && toCoin.price > 0 ? fromUSD / toCoin.price : 0;
  const rate = fromCoin && toCoin && toCoin.price > 0 ? fromCoin.price / toCoin.price : 0;

  const swap = () => { setFrom(to); setTo(from); };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={CONV_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <ArrowLeftRight className="w-7 h-7 text-cyan-400" />
                <h1 className="text-2xl font-extrabold">Convertisseur Crypto</h1>
              </div>
              <p className="text-sm text-gray-400">Convertissez entre les top 50 cryptos en temps réel</p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* Converter */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-8 mb-6 max-w-2xl mx-auto">
          <div className="space-y-6">
            {/* From */}
            <div>
              <label className="text-xs text-gray-500 font-semibold mb-2 block">De</label>
              <div className="flex gap-3">
                <select value={from} onChange={(e) => setFrom(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-cyan-500/50">
                  {coins.map((c) => (
                    <option key={c.id} value={c.id}>{c.symbol} — {c.name}</option>
                  ))}
                </select>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-40 px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white text-right focus:outline-none focus:border-cyan-500/50"
                  placeholder="Montant" />
              </div>
              {fromCoin && <p className="text-xs text-gray-500 mt-1">1 {fromCoin.symbol} = ${fromCoin.price.toLocaleString("en-US", { maximumFractionDigits: 6 })}</p>}
            </div>

            {/* Swap */}
            <div className="flex justify-center">
              <button onClick={swap}
                className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 transition-all">
                <ArrowLeftRight className="w-5 h-5" />
              </button>
            </div>

            {/* To */}
            <div>
              <label className="text-xs text-gray-500 font-semibold mb-2 block">Vers</label>
              <div className="flex gap-3">
                <select value={to} onChange={(e) => setTo(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-cyan-500/50">
                  {coins.map((c) => (
                    <option key={c.id} value={c.id}>{c.symbol} — {c.name}</option>
                  ))}
                </select>
                <div className="w-40 px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white text-right">
                  {result >= 0.000001 ? result.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "0"}
                </div>
              </div>
              {toCoin && <p className="text-xs text-gray-500 mt-1">1 {toCoin.symbol} = ${toCoin.price.toLocaleString("en-US", { maximumFractionDigits: 6 })}</p>}
            </div>

            {/* Result */}
            <div className="bg-black/20 rounded-xl p-5 border border-white/[0.04] text-center">
              <p className="text-gray-400 text-sm mb-2">Résultat de la conversion</p>
              <p className="text-3xl font-extrabold">
                {numAmount} {fromCoin?.symbol || ""} = <span className="text-cyan-400">{result >= 0.000001 ? result.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "0"}</span> {toCoin?.symbol || ""}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Taux: 1 {fromCoin?.symbol} = {rate.toLocaleString("en-US", { maximumFractionDigits: 8 })} {toCoin?.symbol}
              </p>
              <p className="text-xs text-gray-600 mt-1">Valeur USD: ${fromUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">💱 Référence Rapide — Top 50 Prix</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {coins.slice(0, 50).map((c) => (
              <div key={c.id} className="bg-black/20 rounded-xl p-3 border border-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer"
                onClick={() => setFrom(c.id)}>
                <div className="flex items-center gap-2 mb-1">
                  {c.image && <img src={c.image} alt={c.symbol} className="w-5 h-5 rounded-full" />}
                  <span className="text-xs font-bold">{c.symbol}</span>
                </div>
                <p className="text-sm font-extrabold">${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}