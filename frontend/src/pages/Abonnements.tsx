import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { getPlanPrices, type PlanPrices } from "@/lib/api";
import {
  CreditCard, Check, Star, Zap, Crown, Rocket, ArrowRight,
  X, Bitcoin, Banknote, Loader2, Copy, CheckCheck, ExternalLink,
} from "lucide-react";

// ─── FAQ ────────────────────────────────────────────────────────────────────
const FAQ = [
  { q: "Puis-je annuler à tout moment ?", a: "Oui, vous pouvez annuler votre abonnement à tout moment depuis le portail Stripe. Votre accès reste actif jusqu'à la fin de la période payée." },
  { q: "Y a-t-il un essai gratuit ?", a: "Oui ! Le plan Premium inclut un essai gratuit de 7 jours. Aucune carte bancaire requise pour commencer." },
  { q: "Quels moyens de paiement acceptez-vous ?", a: "Nous acceptons Visa, Mastercard, American Express via Stripe, les virements Interac e-Transfer, ainsi que les paiements en crypto (BTC, ETH, USDT)." },
  { q: "Les données sont-elles en temps réel ?", a: "Oui, toutes nos données proviennent d'APIs en temps réel (CoinGecko, Binance, Alternative.me) avec des mises à jour automatiques." },
  { q: "Comment fonctionne le paiement Interac ?", a: "Envoyez le montant exact à cryptoia2026@proton.me avec votre nom d'utilisateur en message. Votre plan sera activé sous 24h ouvrables." },
  { q: "Comment payer en crypto ?", a: "Envoyez le montant en USDT (TRC-20 ou ERC-20) ou BTC à l'adresse indiquée. Partagez le hash de transaction par email pour activation rapide." },
];

// ─── Crypto wallet addresses ─────────────────────────────────────────────────
const CRYPTO_WALLETS = {
  BTC: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  ETH_USDT: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  TRC20_USDT: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
};

type PaymentMethod = "stripe" | "interac" | "crypto";

interface Plan {
  name: string;
  key: string;
  price: string;
  period: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  features: string[];
  cta: string;
  popular: boolean;
  disabled: boolean;
}

// ─── Copy helper ─────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="ml-2 p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0" title="Copier">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
    </button>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({
  plan,
  onClose,
}: {
  plan: Plan;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("stripe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const priceNum = parseFloat(plan.price);

  // ── Stripe checkout ──────────────────────────────────────────────────────
  const handleStripe = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/payment/create_payment_session", {
        method: "POST",
        headers: { "Content-Type": "application/json", "App-Host": window.location.origin },
        body: JSON.stringify({ plan: plan.key, amount_cad: priceNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur Stripe");
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création de la session");
    } finally {
      setLoading(false);
    }
  };

  const METHODS: { id: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
    { id: "stripe", label: "Carte bancaire", icon: CreditCard, color: "text-indigo-400" },
    { id: "interac", label: "Interac e-Transfer", icon: Banknote, color: "text-emerald-400" },
    { id: "crypto", label: "Crypto (BTC/USDT)", icon: Bitcoin, color: "text-amber-400" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative bg-[#0F1525] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-bold">S'abonner — Plan {plan.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              <span className="text-white font-bold text-xl">${plan.price} CAD</span>
              <span className="text-gray-500 text-xs"> /mois</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Method selector */}
        <div className="p-5 border-b border-white/[0.06]">
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Choisir le mode de paiement</p>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                    method === m.id
                      ? "border-indigo-500/60 bg-indigo-500/10 text-white"
                      : "border-white/[0.06] bg-white/[0.02] text-gray-400 hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${method === m.id ? m.color : "text-gray-500"}`} />
                  <span className="text-center leading-tight">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Method content */}
        <div className="p-5">
          {/* ── Stripe ── */}
          {method === "stripe" && (
            <div className="space-y-4">
              <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-xl p-4 text-sm text-gray-300 leading-relaxed">
                <p className="font-semibold text-indigo-300 mb-1">💳 Paiement sécurisé par Stripe</p>
                <p className="text-xs text-gray-400">
                  Vous serez redirigé vers la page de paiement Stripe. Visa, Mastercard et Amex acceptés.
                  Renouvellement automatique mensuel — annulable à tout moment.
                </p>
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400">
                  {error}
                </div>
              )}
              <button
                onClick={handleStripe}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Redirection…</>
                ) : (
                  <>Payer ${plan.price} CAD <ExternalLink className="w-4 h-4" /></>
                )}
              </button>
              <p className="text-center text-xs text-gray-500">
                🔒 Paiement chiffré SSL — Vos données bancaires ne nous sont jamais transmises
              </p>
            </div>
          )}

          {/* ── Interac ── */}
          {method === "interac" && (
            <div className="space-y-4">
              <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-emerald-300 text-sm">🏦 Instructions Interac e-Transfer</p>
                <ol className="space-y-2 text-xs text-gray-300 list-none">
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">1</span>
                    <span>Ouvrez votre application bancaire et sélectionnez <strong>Virement Interac</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">2</span>
                    <span>
                      Envoyez exactement{" "}
                      <strong className="text-white">${plan.price} CAD</strong> à :
                    </span>
                  </li>
                </ol>
                <div className="bg-black/30 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-emerald-300 font-mono text-sm">cryptoia2026@proton.me</span>
                  <CopyButton text="cryptoia2026@proton.me" />
                </div>
                <ol className="space-y-2 text-xs text-gray-300 list-none" start={3}>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">3</span>
                    <span>
                      Dans le champ <strong>message/note</strong>, indiquez :{" "}
                      <span className="text-white font-mono">Plan {plan.name} + votre email</span>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">4</span>
                    <span>Votre plan sera activé <strong className="text-white">sous 24h ouvrables</strong> après réception</span>
                  </li>
                </ol>
              </div>
              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
                ⚠️ Envoyez le montant <strong>exact</strong> (${plan.price} CAD) pour éviter tout délai de traitement.
              </div>
              <a
                href="mailto:cryptoia2026@proton.me"
                className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 font-bold text-sm text-emerald-300 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
              >
                Confirmer par email <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* ── Crypto ── */}
          {method === "crypto" && (
            <div className="space-y-4">
              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-amber-300 text-sm">₿ Instructions paiement crypto</p>
                <p className="text-xs text-gray-400">
                  Envoyez l'équivalent de <strong className="text-white">${plan.price} CAD</strong> en crypto à l'une des adresses ci-dessous.
                </p>

                {/* BTC */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-orange-400">Bitcoin (BTC)</p>
                  <div className="bg-black/30 rounded-lg p-2.5 flex items-center justify-between gap-2">
                    <span className="text-gray-300 font-mono text-xs break-all">{CRYPTO_WALLETS.BTC}</span>
                    <CopyButton text={CRYPTO_WALLETS.BTC} />
                  </div>
                </div>

                {/* ETH/USDT ERC-20 */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-blue-400">USDT / ETH (ERC-20)</p>
                  <div className="bg-black/30 rounded-lg p-2.5 flex items-center justify-between gap-2">
                    <span className="text-gray-300 font-mono text-xs break-all">{CRYPTO_WALLETS.ETH_USDT}</span>
                    <CopyButton text={CRYPTO_WALLETS.ETH_USDT} />
                  </div>
                </div>

                {/* TRC-20 USDT */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-green-400">USDT (TRC-20 / Tron)</p>
                  <div className="bg-black/30 rounded-lg p-2.5 flex items-center justify-between gap-2">
                    <span className="text-gray-300 font-mono text-xs break-all">{CRYPTO_WALLETS.TRC20_USDT}</span>
                    <CopyButton text={CRYPTO_WALLETS.TRC20_USDT} />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-400 pt-1">
                  <p>📧 Après envoi, envoyez le <strong className="text-white">hash de transaction</strong> à :</p>
                  <div className="bg-black/30 rounded-lg p-2 flex items-center justify-between">
                    <span className="text-amber-300 font-mono">cryptoia2026@proton.me</span>
                    <CopyButton text="cryptoia2026@proton.me" />
                  </div>
                  <p>✅ Activation sous <strong className="text-white">2–6h</strong> après confirmation blockchain</p>
                </div>
              </div>

              <a
                href="mailto:cryptoia2026@proton.me"
                className="w-full py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 font-bold text-sm text-amber-300 hover:bg-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                Envoyer le hash de transaction <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Abonnements() {
  const [prices, setPrices] = useState<PlanPrices | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    getPlanPrices().then(setPrices);
  }, []);

  const PLANS: Plan[] = [
    {
      name: "Gratuit",
      key: "free",
      price: "0",
      period: "pour toujours",
      icon: Star,
      color: "from-gray-500 to-gray-600",
      borderColor: "border-gray-500/20",
      features: [
        "Dashboard de base",
        "Fear & Greed Index",
        "Heatmap crypto",
        "Convertisseur",
        "Calculatrice",
        "5 alertes par jour",
      ],
      cta: "Plan Actuel",
      popular: false,
      disabled: true,
    },
    {
      name: "Premium",
      key: "premium",
      price: prices ? prices.premium.toFixed(2) : "...",
      period: "/mois",
      icon: Zap,
      color: "from-blue-500 to-indigo-600",
      borderColor: "border-blue-500/30",
      features: [
        "Tout du plan Gratuit",
        "Altcoin Season Index",
        "Dominance Bitcoin",
        "Calendrier économique",
        "Actualités crypto",
        "Trading Academy",
        "Téléchargements",
        "Support communautaire",
      ],
      cta: "Commencer l'essai gratuit",
      popular: false,
      disabled: false,
    },
    {
      name: "Advanced",
      key: "advanced",
      price: prices ? prices.advanced.toFixed(2) : "...",
      period: "/mois",
      icon: Rocket,
      color: "from-purple-500 to-purple-600",
      borderColor: "border-purple-500/30",
      features: [
        "Tout du plan Premium",
        "AI Market Regime",
        "AI Signals",
        "Stratégies de trading",
        "Analyse Technique",
        "Bullrun Phase",
      ],
      cta: "S'abonner",
      popular: false,
      disabled: false,
    },
    {
      name: "Pro",
      key: "pro",
      price: prices ? prices.pro.toFixed(2) : "...",
      period: "/mois",
      icon: Crown,
      color: "from-amber-500 to-orange-600",
      borderColor: "border-amber-500/30",
      features: [
        "Tout du plan Advanced",
        "Whale Tracker",
        "AI News Analyzer",
        "Crypto Pépites",
        "DeFi Yield",
        "On-Chain Metrics",
        "Portfolio Tracker",
        "Simulation de marché",
        "Support prioritaire",
      ],
      cta: "S'abonner",
      popular: true,
      disabled: false,
    },
    {
      name: "Elite",
      key: "elite",
      price: prices ? prices.elite.toFixed(2) : "...",
      period: "/mois",
      icon: Crown,
      color: "from-emerald-500 to-emerald-600",
      borderColor: "border-emerald-500/30",
      features: [
        "Tout du plan Pro",
        "AI Coach personnel",
        "AI Swarm",
        "Narrative Radar",
        "Scam Shield",
        "Altseason Copilot",
        "Setup Builder",
        "Token Scanner",
        "Support dédié 24/7",
        "Accès bêta nouvelles fonctionnalités",
      ],
      cta: "Contacter l'équipe",
      popular: false,
      disabled: false,
    },
  ];

  const handlePlanClick = (plan: Plan) => {
    if (plan.disabled) return;
    if (plan.key === "elite") {
      window.location.href = "mailto:cryptoia2026@proton.me?subject=Abonnement Elite CryptoIA";
      return;
    }
    setSelectedPlan(plan);
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <CreditCard className="w-8 h-8 text-indigo-400" />
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Abonnements
            </h1>
          </div>
          <p className="text-gray-400 max-w-xl mx-auto">
            Choisissez le plan qui correspond à vos besoins de trading. Tous les plans incluent un accès aux données en temps réel.
          </p>
          {/* Payment badges */}
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
              <CreditCard className="w-3.5 h-3.5" /> Carte bancaire (Stripe)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              <Banknote className="w-3.5 h-3.5" /> Interac e-Transfer
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <Bitcoin className="w-3.5 h-3.5" /> Crypto (BTC / USDT)
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-4 max-w-7xl mx-auto mb-12">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative bg-white/[0.03] border ${plan.borderColor} rounded-2xl p-5 hover:bg-white/[0.05] transition-all ${
                  plan.popular ? "ring-2 ring-amber-500/40 scale-[1.02]" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-xs font-bold whitespace-nowrap">
                    ⭐ Plus Populaire
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-black">${plan.price}</span>
                  <span className="text-xs text-gray-500">{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={plan.disabled}
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    plan.disabled
                      ? "bg-white/[0.05] text-gray-500 cursor-default"
                      : plan.popular
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white"
                      : "bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-white"
                  }`}
                >
                  {plan.cta}
                  {!plan.disabled && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Questions Fréquentes</h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                <h3 className="font-bold text-sm mb-2 text-blue-400">{item.q}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 mb-6">
          <div className="bg-gradient-to-r from-indigo-500/[0.08] to-purple-500/[0.08] border border-indigo-500/20 rounded-2xl p-8 max-w-2xl mx-auto">
            <Rocket className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Prêt à passer au niveau supérieur ?</h3>
            <p className="text-sm text-gray-400 mb-4">
              Essayez le plan Premium gratuitement pendant 7 jours. Aucune carte bancaire requise.
            </p>
            <button
              onClick={() => {
                const premium = PLANS.find((p) => p.key === "premium");
                if (premium) setSelectedPlan(premium);
              }}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-sm hover:brightness-110 transition-all"
            >
              Commencer l'essai gratuit →
            </button>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      )}
    </div>
  );
}