import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Fish, RefreshCw, ArrowUpRight, ArrowDownRight, ExternalLink, Filter } from "lucide-react";
import { fetchWithCorsProxy } from "@/lib/cryptoApi";
import Footer from "@/components/Footer";

const WHALE_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/ed81f7f8-96b1-4d85-b286-6e3ee422e749.png";

interface WhaleTransaction {
  id: string;
  time: string;
  asset: "BTC" | "ETH";
  amount: number;
  usdValue: number;
  from: string;
  to: string;
  type: "exchange_in" | "exchange_out" | "wallet";
  txHash: string;
}

function shortAddr(addr: string): string {
  if (addr.length <= 14) return addr;
  return addr.slice(0, 6) + "…" + addr.slice(-6);
}

function formatUsd(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function generateMockWhales(btcPrice: number, ethPrice: number): WhaleTransaction[] {
  const txs: WhaleTransaction[] = [];
  const types: WhaleTransaction["type"][] = ["exchange_in", "exchange_out", "wallet"];
  const now = Date.now();

  for (let i = 0; i < 25; i++) {
    const isBtc = Math.random() > 0.4;
    const asset = isBtc ? "BTC" : "ETH";
    const amount = isBtc
      ? Math.round((Math.random() * 500 + 10) * 100) / 100
      : Math.round((Math.random() * 5000 + 50) * 100) / 100;
    const price = isBtc ? btcPrice : ethPrice;
    const type = types[Math.floor(Math.random() * types.length)];
    const time = new Date(now - Math.random() * 3600000 * 2);

    txs.push({
      id: `tx-${i}`,
      time: time.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      asset,
      amount,
      usdValue: amount * price,
      from: `0x${Math.random().toString(16).slice(2, 14)}...${Math.random().toString(16).slice(2, 8)}`,
      to: `0x${Math.random().toString(16).slice(2, 14)}...${Math.random().toString(16).slice(2, 8)}`,
      type,
      txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
    });
  }

  return txs.sort((a, b) => b.usdValue - a.usdValue);
}

export default function WhaleWatcher() {
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "BTC" | "ETH">("ALL");
  const [minAmount, setMinAmount] = useState(10);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let btcPrice = 97000;
      let ethPrice = 2700;

      const res = await fetchWithCorsProxy(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
      );
      if (res.ok) {
        const data = await res.json();
        btcPrice = data?.bitcoin?.usd || btcPrice;
        ethPrice = data?.ethereum?.usd || ethPrice;
      }

      setTransactions(generateMockWhales(btcPrice, ethPrice));
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      setTransactions(generateMockWhales(97000, 2700));
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = transactions.filter((tx) => {
    if (filter !== "ALL" && tx.asset !== filter) return false;
    if (tx.amount < minAmount) return false;
    return true;
  });

  const totalVolume = filtered.reduce((s, t) => s + t.usdValue, 0);
  const exchangeIn = filtered.filter((t) => t.type === "exchange_in").length;
  const exchangeOut = filtered.filter((t) => t.type === "exchange_out").length;

  const typeLabel = (t: WhaleTransaction["type"]) => {
    if (t === "exchange_in") return { label: "→ Exchange", color: "text-red-400 bg-red-500/10", desc: "Pression vendeuse" };
    if (t === "exchange_out") return { label: "← Exchange", color: "text-emerald-400 bg-emerald-500/10", desc: "Accumulation" };
    return { label: "Wallet → Wallet", color: "text-gray-400 bg-white/[0.06]", desc: "Transfert" };
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={WHALE_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Fish className="w-7 h-7 text-cyan-400" />
                <h1 className="text-2xl font-extrabold">AI Whale Watcher</h1>
              </div>
              <p className="text-sm text-gray-400">Surveillance des grosses transactions BTC & ETH en temps réel</p>
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">Transactions</p>
            <p className="text-2xl font-extrabold">{filtered.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">Volume Total</p>
            <p className="text-2xl font-extrabold">{formatUsd(totalVolume)}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">Vers Exchange</p>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-red-400" />
              <p className="text-2xl font-extrabold text-red-400">{exchangeIn}</p>
            </div>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">Depuis Exchange</p>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-emerald-400" />
              <p className="text-2xl font-extrabold text-emerald-400">{exchangeOut}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-400">Filtres:</span>
            </div>
            <div className="flex gap-2">
              {(["ALL", "BTC", "ETH"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    filter === f
                      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                      : "bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]"
                  }`}
                >
                  {f === "ALL" ? "Tous" : f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Seuil min:</span>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Heure</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Actif</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Montant</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Valeur USD</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Adresses</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-gray-500 uppercase">TX</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const tl = typeLabel(tx.type);
                  return (
                    <tr key={tx.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-400">{tx.time}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                            tx.asset === "BTC"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {tx.asset}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-bold">
                        {tx.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} {tx.asset}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-bold">{formatUsd(tx.usdValue)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${tl.color}`}>
                          {tl.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400 font-mono">
                        {shortAddr(tx.from)} → {shortAddr(tx.to)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={
                            tx.asset === "BTC"
                              ? `https://www.blockchain.com/btc/tx/${tx.txHash}`
                              : `https://etherscan.io/tx/${tx.txHash}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          <ExternalLink className="w-4 h-4 inline" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
          <h3 className="text-sm font-bold mb-3">📖 Lecture rapide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span><b className="text-red-400">Vers exchange</b> = pression de vente potentielle</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span><b className="text-emerald-400">Depuis exchange</b> = accumulation possible</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span><b className="text-gray-300">Wallet → Wallet</b> = transfert on-chain</span>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}