import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { ArrowLeftRight, RefreshCw, DollarSign } from "lucide-react";

interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  image: string;
}

interface FiatCurrency {
  id: string;
  symbol: string;
  name: string;
  rate: number;
  flag: string;
}

const FIAT_CURRENCIES: FiatCurrency[] = [
  { id: "usd", symbol: "USD", name: "Dollar US", rate: 1, flag: "🇺🇸" },
  { id: "cad", symbol: "CAD", name: "Dollar Canadien", rate: 1.36, flag: "🇨🇦" },
  { id: "eur", symbol: "EUR", name: "Euro", rate: 0.92, flag: "🇪🇺" },
  { id: "gbp", symbol: "GBP", name: "Livre Sterling", rate: 0.79, flag: "🇬🇧" },
  { id: "jpy", symbol: "JPY", name: "Yen Japonais", rate: 150.5, flag: "🇯🇵" },
  { id: "chf", symbol: "CHF", name: "Franc Suisse", rate: 0.88, flag: "🇨🇭" },
  { id: "aud", symbol: "AUD", name: "Dollar Australien", rate: 1.53, flag: "🇦🇺" },
];

type SelectionType = "crypto" | "fiat";
interface Selection {
  type: SelectionType;
  id: string;
}

export default function Convertisseur() {
  const [coins, setCoins] = useState<CoinPrice[]>([]);
  const [fiatRates, setFiatRates] = useState<FiatCurrency[]>(FIAT_CURRENCIES);
  const [from, setFrom] = useState<Selection>({ type: "crypto", id: "bitcoin" });
  const [to, setTo] = useState<Selection>({ type: "fiat", id: "cad" });
  const [amount, setAmount] = useState("1");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch crypto prices
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false"
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCoins(
            data.map((c: Record<string, unknown>) => ({
              id: c.id as string,
              symbol: ((c.symbol as string) || "").toUpperCase(),
              name: c.name as string,
              price: (c.current_price as number) || 0,
              image: c.image as string,
            }))
          );
        }
      }

      // Fetch fiat rates from a free API
      try {
        const fiatRes = await fetch(
          "https://api.coingecko.com/api/v3/exchange_rates"
        );
        if (fiatRes.ok) {
          const fiatData = await fiatRes.json();
          const rates = fiatData?.rates;
          if (rates) {
            setFiatRates((prev) =>
              prev.map((f) => {
                const rateData = rates[f.id];
                if (rateData && typeof rateData.value === "number") {
                  return { ...f, rate: rateData.value / (rates.usd?.value || 1) };
                }
                return f;
              })
            );
          }
        }
      } catch {
        /* keep default rates */
      }

      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      /* keep */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 60000);
    return () => clearInterval(i);
  }, [fetchData]);

  // Get USD value of selection
  const getUSDValue = (sel: Selection): number => {
    if (sel.type === "crypto") {
      const coin = coins.find((c) => c.id === sel.id);
      return coin?.price || 0;
    } else {
      const fiat = fiatRates.find((f) => f.id === sel.id);
      return fiat && fiat.rate > 0 ? 1 / fiat.rate : 0;
    }
  };

  const getLabel = (sel: Selection): string => {
    if (sel.type === "crypto") {
      const coin = coins.find((c) => c.id === sel.id);
      return coin?.symbol || "";
    } else {
      const fiat = fiatRates.find((f) => f.id === sel.id);
      return fiat?.symbol || "";
    }
  };

  const numAmount = parseFloat(amount) || 0;
  const fromUSD = numAmount * getUSDValue(from);
  const toUSDVal = getUSDValue(to);
  const result = toUSDVal > 0 ? fromUSD / toUSDVal : 0;
  const rate = getUSDValue(from) > 0 && toUSDVal > 0 ? getUSDValue(from) / toUSDVal : 0;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const renderSelector = (
    sel: Selection,
    onChange: (s: Selection) => void,
    label: string
  ) => (
    <div>
      <label className="text-xs text-gray-500 font-semibold mb-2 block">
        {label}
      </label>
      <div className="flex gap-2 mb-2">
        <button
          onClick={() =>
            onChange({
              type: "crypto",
              id: sel.type === "crypto" ? sel.id : "bitcoin",
            })
          }
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            sel.type === "crypto"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "bg-white/[0.04] text-gray-500 border border-white/[0.06]"
          }`}
        >
          Crypto
        </button>
        <button
          onClick={() =>
            onChange({
              type: "fiat",
              id: sel.type === "fiat" ? sel.id : "cad",
            })
          }
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            sel.type === "fiat"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-white/[0.04] text-gray-500 border border-white/[0.06]"
          }`}
        >
          Fiat
        </button>
      </div>
      <select
        value={sel.id}
        onChange={(e) => onChange({ ...sel, id: e.target.value })}
        className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-cyan-500/50"
      >
        {sel.type === "crypto"
          ? coins.map((c) => (
              <option key={c.id} value={c.id}>
                {c.symbol} — {c.name}
              </option>
            ))
          : fiatRates.map((f) => (
              <option key={f.id} value={f.id}>
                {f.flag} {f.symbol} — {f.name}
              </option>
            ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px] bg-gradient-to-r from-cyan-900/40 to-blue-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/90 via-[#0A0E1A]/60 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <ArrowLeftRight className="w-7 h-7 text-cyan-400" />
                <h1 className="text-2xl font-extrabold">Convertisseur Crypto</h1>
              </div>
              <p className="text-sm text-gray-400">
                Crypto ↔ Crypto • Crypto ↔ Fiat (USD, CAD, EUR, GBP, JPY, CHF, AUD)
              </p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* Converter */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-8 mb-6 max-w-2xl mx-auto">
          <div className="space-y-6">
            {/* From */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">{renderSelector(from, setFrom, "De")}</div>
              <div className="w-40">
                <label className="text-xs text-gray-500 font-semibold mb-2 block">
                  Montant
                </label>
                <div className="mt-[34px]">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white text-right focus:outline-none focus:border-cyan-500/50"
                    placeholder="Montant"
                  />
                </div>
              </div>
            </div>

            {/* Swap */}
            <div className="flex justify-center">
              <button
                onClick={swap}
                className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 transition-all hover:scale-110"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>
            </div>

            {/* To */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">{renderSelector(to, setTo, "Vers")}</div>
              <div className="w-40">
                <label className="text-xs text-gray-500 font-semibold mb-2 block">
                  Résultat
                </label>
                <div className="mt-[34px]">
                  <div className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-cyan-400 text-right font-bold">
                    {result >= 0.000001
                      ? result.toLocaleString("en-US", {
                          maximumFractionDigits: 8,
                        })
                      : "0"}
                  </div>
                </div>
              </div>
            </div>

            {/* Result */}
            <div className="bg-black/20 rounded-xl p-5 border border-white/[0.04] text-center">
              <p className="text-gray-400 text-sm mb-2">
                Résultat de la conversion
              </p>
              <p className="text-3xl font-extrabold">
                {numAmount} {getLabel(from)} ={" "}
                <span className="text-cyan-400">
                  {result >= 0.000001
                    ? result.toLocaleString("en-US", {
                        maximumFractionDigits: 8,
                      })
                    : "0"}
                </span>{" "}
                {getLabel(to)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Taux: 1 {getLabel(from)} ={" "}
                {rate.toLocaleString("en-US", { maximumFractionDigits: 8 })}{" "}
                {getLabel(to)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Valeur USD: $
                {fromUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Fiat Rates */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            Taux de change Fiat
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fiatRates.map((f) => (
              <button
                key={f.id}
                onClick={() => setTo({ type: "fiat", id: f.id })}
                className={`bg-black/20 rounded-xl p-3 border transition-all hover:border-white/[0.1] ${
                  to.type === "fiat" && to.id === f.id
                    ? "border-cyan-500/30"
                    : "border-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{f.flag}</span>
                  <span className="text-xs font-bold">{f.symbol}</span>
                </div>
                <p className="text-sm font-extrabold">
                  {f.rate.toLocaleString("en-US", {
                    maximumFractionDigits: 4,
                  })}
                </p>
                <p className="text-[10px] text-gray-500">pour 1 USD</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Reference */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">
            💱 Référence Rapide — Top 50 Prix
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {coins.slice(0, 50).map((c) => (
              <div
                key={c.id}
                className="bg-black/20 rounded-xl p-3 border border-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer"
                onClick={() => setFrom({ type: "crypto", id: c.id })}
              >
                <div className="flex items-center gap-2 mb-1">
                  {c.image && (
                    <img
                      src={c.image}
                      alt={c.symbol}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span className="text-xs font-bold">{c.symbol}</span>
                </div>
                <p className="text-sm font-extrabold">
                  $
                  {c.price >= 1
                    ? c.price.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })
                    : c.price.toFixed(6)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}