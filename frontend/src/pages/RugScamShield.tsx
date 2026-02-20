import { useState } from "react";
import Sidebar from "../components/Sidebar";

interface TokenSecurityData {
  is_open_source: string;
  is_proxy: string;
  is_mintable: string;
  can_take_back_ownership: string;
  owner_change_balance: string;
  hidden_owner: string;
  selfdestruct: string;
  external_call: string;
  buy_tax: string;
  sell_tax: string;
  is_honeypot: string;
  transfer_pausable: string;
  is_blacklisted: string;
  is_whitelisted: string;
  is_anti_whale: string;
  trading_cooldown: string;
  cannot_sell_all: string;
  holder_count: string;
  total_supply: string;
  lp_holder_count: string;
  lp_total_supply: string;
  is_true_token: string;
  is_airdrop_scam: string;
  token_name: string;
  token_symbol: string;
  holders?: { address: string; balance: string; percent: string; is_locked: number; is_contract: number }[];
  lp_holders?: { address: string; balance: string; percent: string; is_locked: number }[];
  dex?: { name: string; liquidity: string; pair: string }[];
}

interface AuditResult {
  score: number;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  tokenName: string;
  tokenSymbol: string;
  checks: { name: string; status: "pass" | "warn" | "fail"; detail: string }[];
  holders: number;
  liquidity: string;
  buyTax: string;
  sellTax: string;
}

function analyzeSecurityData(data: TokenSecurityData): AuditResult {
  const checks: AuditResult["checks"] = [];
  let score = 100;

  // Open Source
  if (data.is_open_source === "1") {
    checks.push({ name: "Contrat vérifié (Open Source)", status: "pass", detail: "Le code source du contrat est vérifié et public" });
  } else {
    checks.push({ name: "Contrat vérifié (Open Source)", status: "fail", detail: "⚠️ Code source NON vérifié — Risque élevé, impossible d'auditer" });
    score -= 25;
  }

  // Proxy Contract
  if (data.is_proxy === "0") {
    checks.push({ name: "Contrat Proxy", status: "pass", detail: "Pas de contrat proxy — le code ne peut pas être modifié" });
  } else {
    checks.push({ name: "Contrat Proxy", status: "warn", detail: "⚠️ Contrat proxy détecté — le code peut être modifié par le propriétaire" });
    score -= 15;
  }

  // Mintable
  if (data.is_mintable === "0") {
    checks.push({ name: "Fonction Mint", status: "pass", detail: "Pas de fonction mint — l'offre totale est fixe" });
  } else {
    checks.push({ name: "Fonction Mint", status: "fail", detail: "⚠️ Le propriétaire peut créer de nouveaux tokens (mint) — dilution possible" });
    score -= 20;
  }

  // Honeypot
  if (data.is_honeypot === "0") {
    checks.push({ name: "Honeypot Check", status: "pass", detail: "Pas de honeypot détecté — vous pouvez acheter ET vendre" });
  } else {
    checks.push({ name: "Honeypot Check", status: "fail", detail: "🚨 HONEYPOT DÉTECTÉ — Impossible de vendre ce token!" });
    score -= 40;
  }

  // Buy/Sell Tax
  const buyTax = parseFloat(data.buy_tax || "0") * 100;
  const sellTax = parseFloat(data.sell_tax || "0") * 100;
  if (buyTax <= 5 && sellTax <= 5) {
    checks.push({ name: "Taxes (Buy/Sell)", status: "pass", detail: `Buy: ${buyTax.toFixed(1)}% | Sell: ${sellTax.toFixed(1)}% — Taxes raisonnables` });
  } else if (buyTax <= 10 && sellTax <= 10) {
    checks.push({ name: "Taxes (Buy/Sell)", status: "warn", detail: `Buy: ${buyTax.toFixed(1)}% | Sell: ${sellTax.toFixed(1)}% — Taxes modérées` });
    score -= 10;
  } else {
    checks.push({ name: "Taxes (Buy/Sell)", status: "fail", detail: `Buy: ${buyTax.toFixed(1)}% | Sell: ${sellTax.toFixed(1)}% — ⚠️ Taxes très élevées!` });
    score -= 20;
  }

  // Transfer Pausable
  if (data.transfer_pausable === "0") {
    checks.push({ name: "Transfert Pausable", status: "pass", detail: "Les transferts ne peuvent pas être suspendus" });
  } else {
    checks.push({ name: "Transfert Pausable", status: "warn", detail: "⚠️ Le propriétaire peut suspendre les transferts" });
    score -= 10;
  }

  // Blacklist
  if (data.is_blacklisted === "0") {
    checks.push({ name: "Fonction Blacklist", status: "pass", detail: "Pas de fonction blacklist détectée" });
  } else {
    checks.push({ name: "Fonction Blacklist", status: "warn", detail: "⚠️ Le propriétaire peut blacklister des adresses" });
    score -= 10;
  }

  // Hidden Owner
  if (data.hidden_owner === "0") {
    checks.push({ name: "Propriétaire caché", status: "pass", detail: "Pas de propriétaire caché détecté" });
  } else {
    checks.push({ name: "Propriétaire caché", status: "fail", detail: "⚠️ Propriétaire caché — contrôle dissimulé du contrat" });
    score -= 15;
  }

  // Can take back ownership
  if (data.can_take_back_ownership === "0") {
    checks.push({ name: "Ownership récupérable", status: "pass", detail: "Le propriétaire ne peut pas récupérer la propriété après renonciation" });
  } else {
    checks.push({ name: "Ownership récupérable", status: "warn", detail: "⚠️ Le propriétaire peut récupérer la propriété du contrat" });
    score -= 10;
  }

  // Cannot sell all
  if (data.cannot_sell_all === "0") {
    checks.push({ name: "Vente complète", status: "pass", detail: "Vous pouvez vendre la totalité de vos tokens" });
  } else {
    checks.push({ name: "Vente complète", status: "fail", detail: "⚠️ Impossible de vendre tous vos tokens en une fois" });
    score -= 15;
  }

  // LP Locked
  const lpLocked = data.lp_holders?.some((h) => h.is_locked === 1);
  if (lpLocked) {
    checks.push({ name: "Liquidité verrouillée", status: "pass", detail: "La liquidité est partiellement ou totalement verrouillée" });
  } else if (data.lp_holders && data.lp_holders.length > 0) {
    checks.push({ name: "Liquidité verrouillée", status: "warn", detail: "⚠️ La liquidité n'est PAS verrouillée — risque de rug pull" });
    score -= 15;
  }

  score = Math.max(0, Math.min(100, score));
  const risk: AuditResult["risk"] = score > 80 ? "LOW" : score > 60 ? "MEDIUM" : score > 35 ? "HIGH" : "CRITICAL";

  const totalLiquidity = data.dex?.reduce((sum, d) => sum + parseFloat(d.liquidity || "0"), 0) || 0;

  return {
    score,
    risk,
    tokenName: data.token_name || "Unknown",
    tokenSymbol: data.token_symbol || "???",
    checks,
    holders: parseInt(data.holder_count || "0"),
    liquidity: totalLiquidity > 0 ? `$${(totalLiquidity).toLocaleString()}` : "N/A",
    buyTax: `${buyTax.toFixed(1)}%`,
    sellTax: `${sellTax.toFixed(1)}%`,
  };
}

const RISK_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  LOW: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  MEDIUM: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  HIGH: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  CRITICAL: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
};

const RISK_LABELS: Record<string, string> = {
  LOW: "✅ Risque Faible",
  MEDIUM: "⚠️ Risque Modéré",
  HIGH: "🔶 Risque Élevé",
  CRITICAL: "🚨 CRITIQUE",
};

const CHAIN_OPTIONS = [
  { id: "1", label: "Ethereum", emoji: "⟠" },
  { id: "56", label: "BSC", emoji: "🟡" },
  { id: "137", label: "Polygon", emoji: "🟣" },
  { id: "42161", label: "Arbitrum", emoji: "🔵" },
  { id: "43114", label: "Avalanche", emoji: "🔺" },
  { id: "8453", label: "Base", emoji: "🔷" },
  { id: "10", label: "Optimism", emoji: "🔴" },
  { id: "250", label: "Fantom", emoji: "👻" },
];

export default function RugScamShield() {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("1");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
  };

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = address.trim();

    if (!trimmed) {
      setError("Veuillez entrer une adresse de contrat");
      return;
    }

    if (!isValidAddress(trimmed)) {
      setError("❌ Adresse invalide. L'adresse doit commencer par 0x et contenir 42 caractères hexadécimaux (ex: 0x1234...abcd)");
      setResult(null);
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      // GoPlus Security API - Free, no API key required
      const response = await fetch(
        `https://api.gopluslabs.io/api/v1/token_security/${chain}?contract_addresses=${trimmed}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const json = await response.json();

      if (json.code !== 1 || !json.result) {
        throw new Error("Réponse API invalide");
      }

      const tokenData = json.result[trimmed.toLowerCase()];

      if (!tokenData) {
        setError("❌ Token non trouvé sur cette blockchain. Vérifiez l'adresse et la chaîne sélectionnée.");
        setLoading(false);
        return;
      }

      const auditResult = analyzeSecurityData(tokenData as TokenSecurityData);
      setResult(auditResult);
    } catch (err) {
      console.error("Audit error:", err);
      setError("❌ Erreur lors de l'analyse. Vérifiez l'adresse et réessayez. L'API GoPlus peut être temporairement indisponible.");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
      <PageHeader
          icon={<span className="text-lg">🛡️</span>}
          title="Rug & Scam Shield"
          subtitle="Protégez-vous contre les arnaques crypto. Analysez n’importe quel token pour détecter les red flags : honeypot, ownership non renoncé, liquidité verrouillée, etc."
          accentColor="red"
          steps={[
            { n: "1", title: "Entrez l’adresse du token", desc: "Copiez-collez l’adresse du contrat du token que vous souhaitez analyser. Compatible avec Ethereum, BSC et autres EVM." },
            { n: "2", title: "Lisez le score de sécurité", desc: "Score > 80 = token relativement sûr. Score < 40 = risque élevé, évitez. Vérifiez chaque critère individuellement." },
            { n: "3", title: "Vérifiez les red flags", desc: "Honeypot, taxes élevées, ownership non renoncé, liquidité non verrouillée = signaux d’alarme majeurs. Ne jamais ignorer." },
          ]}
        />
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-red-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1000px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-red-400 via-amber-500 to-red-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              🛡️ Rug & Scam Shield
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Audit de sécurité en temps réel via GoPlus Security API</p>
            <div className="inline-flex items-center gap-2 mt-3 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-4 py-1 text-xs text-emerald-400 font-bold">
              🔒 Données réelles — GoPlus Labs
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleAudit} className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 mb-6">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Adresse du contrat (ERC-20)</label>

            {/* Chain Selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              {CHAIN_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChain(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    chain === c.id
                      ? "bg-white/10 text-white border-white/20"
                      : "bg-white/[0.03] text-gray-500 border-white/[0.06] hover:text-white"
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setError(null); }}
                placeholder="0x... (adresse du contrat ERC-20)"
                className="flex-1 px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm font-mono focus:border-red-500 outline-none"
              />
              <button type="submit" disabled={loading} className="px-6 py-3 bg-gradient-to-r from-red-500 to-amber-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50">
                {loading ? "🔍 Analyse..." : "🛡️ Auditer"}
              </button>
            </div>

            {/* Example addresses */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[10px] text-gray-600">Exemples :</span>
              <button type="button" onClick={() => { setAddress("0xdac17f958d2ee523a2206206994597c13d831ec7"); setChain("1"); }}
                className="text-[10px] text-cyan-500 hover:text-cyan-400 font-mono">USDT (ETH)</button>
              <button type="button" onClick={() => { setAddress("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"); setChain("1"); }}
                className="text-[10px] text-cyan-500 hover:text-cyan-400 font-mono">WBTC (ETH)</button>
              <button type="button" onClick={() => { setAddress("0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"); setChain("1"); }}
                className="text-[10px] text-cyan-500 hover:text-cyan-400 font-mono">UNI (ETH)</button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 text-center">
              <p className="text-sm text-red-400 font-semibold">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-red-500/15 border-t-red-400 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400 text-sm">Interrogation de GoPlus Security API...</p>
                <p className="text-gray-600 text-xs mt-1">Analyse du smart contract en cours</p>
              </div>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Token Info + Score */}
              <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-8 mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <h2 className="text-2xl font-black text-white">{result.tokenName}</h2>
                  <span className="text-lg font-bold text-gray-500">${result.tokenSymbol}</span>
                </div>

                <div className="text-center mb-4">
                  <div className="text-6xl font-black font-mono mb-2" style={{ color: result.score > 70 ? "#22c55e" : result.score > 50 ? "#f59e0b" : "#ef4444" }}>
                    {result.score}<span className="text-2xl text-gray-500">/100</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden max-w-md mx-auto mb-4">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${result.score}%`,
                      background: `linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)`,
                    }} />
                  </div>
                  <span className={`text-sm font-bold px-4 py-2 rounded-xl ${RISK_STYLES[result.risk].bg} ${RISK_STYLES[result.risk].text} border ${RISK_STYLES[result.risk].border}`}>
                    {RISK_LABELS[result.risk]}
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Holders</div>
                    <div className="text-lg font-bold text-white">{result.holders.toLocaleString()}</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Liquidité</div>
                    <div className="text-lg font-bold text-white">{result.liquidity}</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Buy Tax</div>
                    <div className="text-lg font-bold text-white">{result.buyTax}</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Sell Tax</div>
                    <div className="text-lg font-bold text-white">{result.sellTax}</div>
                  </div>
                </div>
              </div>

              {/* Checks */}
              <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">🔍 Résultats de l&apos;Audit ({result.checks.length} vérifications)</h2>
                <div className="space-y-3">
                  {result.checks.map((check) => (
                    <div key={check.name} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl">
                      <span className="text-xl">
                        {check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌"}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{check.name}</div>
                        <div className="text-xs text-gray-400">{check.detail}</div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${check.status === "pass" ? "bg-emerald-500/10 text-emerald-400" : check.status === "warn" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                        {check.status === "pass" ? "SAFE" : check.status === "warn" ? "WARN" : "DANGER"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-2xl p-4 mt-6 text-center">
                <p className="text-xs text-amber-400/80">
                  ⚠️ Cet audit utilise les données de GoPlus Security API. Il ne constitue pas un conseil financier.
                  Faites toujours vos propres recherches (DYOR) avant d&apos;investir.
                </p>
              </div>
            </>
          )}

          {/* Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {[
              { icon: "🔍", title: "Vérifiez toujours", items: ["Code source vérifié (open source)", "Liquidité verrouillée (LP locked)", "Audit par un tiers (CertiK, Hacken)", "Équipe doxxée et transparente"] },
              { icon: "🚩", title: "Red Flags", items: ["Rendements irréalistes (>1000% APY)", "Honeypot — impossible de vendre", "Taxes > 10% buy/sell", "Propriétaire peut mint des tokens"] },
            ].map((tip) => (
              <div key={tip.title} className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">{tip.icon} {tip.title}</h3>
                <ul className="space-y-2">
                  {tip.items.map((item) => (
                    <li key={item} className="text-sm text-gray-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}