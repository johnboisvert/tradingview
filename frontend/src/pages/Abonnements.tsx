import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { getPlanPrices, getAnnualPlanPrices, getAnnualDiscount, type PlanPrices } from "@/lib/api";
import { getPlanAccess } from "@/lib/store";
import { getUserPlan } from "@/lib/subscription";
import {
  CreditCard, Check, Star, Zap, Crown, Rocket, ArrowRight,
  X, Bitcoin, Banknote, Loader2, Copy, CheckCheck, ExternalLink,
} from "lucide-react";
import Footer from "@/components/Footer";

// ─── FAQ ────────────────────────────────────────────────────────────────────
const FAQ = [
  { q: "Puis-je annuler à tout moment ?", a: "Oui, vous pouvez annuler votre abonnement à tout moment depuis le portail Stripe. Votre accès reste actif jusqu'à la fin de la période payée." },
  { q: "Y a-t-il un essai gratuit ?", a: "Oui ! Le plan Premium inclut un essai gratuit de 7 jours. Aucune carte bancaire requise pour commencer." },
  { q: "Quels moyens de paiement acceptez-vous ?", a: "Nous acceptons Visa, Mastercard, American Express via Stripe, les virements Interac e-Transfer, ainsi que les paiements en crypto via NOWPayments (300+ cryptos)." },
  { q: "Les données sont-elles en temps réel ?", a: "Oui, toutes nos données proviennent d'APIs en temps réel (CoinGecko, Binance, Alternative.me) avec des mises à jour automatiques." },
  { q: "Comment fonctionne le paiement Interac ?", a: "Envoyez le montant exact à cryptoia2026@gmail.com avec votre nom d'utilisateur en message. Votre plan sera activé sous 24h ouvrables." },
  { q: "Comment payer en crypto ?", a: "Cliquez sur 'Crypto (NOWPayments)', vous serez redirigé vers une page de paiement sécurisée supportant 300+ cryptos (BTC, ETH, USDT, SOL, BNB, etc.). Activation automatique après confirmation blockchain." },
  { q: "Combien de temps pour l'activation crypto ?", a: "L'activation est automatique après confirmation blockchain, généralement entre 1 et 30 minutes selon la crypto choisie." },
  { q: "Comment fonctionne l'abonnement annuel ?", a: "L'abonnement annuel vous offre une réduction significative par rapport au prix mensuel. Vous payez une fois par an et économisez sur le long terme. Le pourcentage de réduction est configurable par l'administrateur." },
];

type PaymentMethod = "stripe" | "interac" | "crypto";
type BillingPeriod = "monthly" | "annual";

interface Plan {
  name: string;
  key: string;
  price: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  annualTotalPrice: number;
  annualSavings: number;
  period: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  features: string[];
  cta: string;
  popular: boolean;
  disabled: boolean;
}

// ─── Slug → Label lisible ────────────────────────────────────────────────────
const SLUG_LABELS: Record<string, string> = {
  "dashboard": "Dashboard de base",
  "fear-greed": "Fear & Greed Index",
  "heatmap": "Heatmap crypto",
  "altcoin-season": "Altcoin Season Index",
  "dominance": "Dominance Bitcoin",
  "convertisseur": "Convertisseur de devises",
  "calculatrice": "Calculatrice de trading",
  "calendrier": "Calendrier économique",
  "nouvelles": "Actualités crypto",
  "support": "Support prioritaire",
  "strategie": "Stratégies de trading",
  "portfolio": "Portfolio Tracker",
  "market-simulation": "Simulation de marché",
  "bullrun": "Bullrun Phase",
  "technical-analyzer": "Analyse Technique (Timeframe)",
  "crypto-journal": "Journal de Trading",
  "screener-technique": "Screener Technique",
  "ai-market-regime": "AI Market Regime",
  "ai-signals": "Alertes IA & Score Confiance IA",
  "ai-whale-tracker": "Whale Tracker",
  "ai-news-analyzer": "AI News Analyzer",
  "ai-coach": "My CryptoIA + Assistant IA + Rapport Hebdomadaire",
  "ai-swarm": "AI Swarm",
  "setup-builder": "Simulateur Stratégie IA",
  "backtesting-visuel": "Backtesting Visuel des Signaux IA",
  "gamification": "Gamification & Badges Exclusifs + PWA Installable",
  "crypto-pepites": "Crypto Pépites",
  "token-scanner": "Token Scanner",
  "narrative-radar": "Narrative Radar",
  "scam-shield": "Rug & Scam Shield",
  "altseason-copilot": "Altseason Copilot",
  "onchain": "On-Chain Metrics",
  "defi-yield": "DeFi Yield",
  "academy": "Trading Academy",
  "downloads": "Téléchargements",
  "dtrading-ia-pro": "DTrading IA Pro",
  "scalp-trading": "Scalp Trading (Stoch RSI + MACD)",
};

// Slugs exclus de l'affichage (trop basiques ou internes)
const HIDDEN_SLUGS = new Set(["dashboard"]);

function getFeatureLabel(slug: string): string {
  return SLUG_LABELS[slug] || slug;
}

// Génère les features d'un plan en excluant celles du plan précédent
function getPlanFeatures(planKey: string, prevPlanKey: string | null): string[] {
  const current = new Set(getPlanAccess(planKey));
  const prev = prevPlanKey ? new Set(getPlanAccess(prevPlanKey)) : new Set<string>();

  const newSlugs = [...current].filter((s) => !prev.has(s) && !HIDDEN_SLUGS.has(s));
  return newSlugs.map(getFeatureLabel);
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

// ─── Billing Toggle ───────────────────────────────────────────────────────────
function BillingToggle({
  billing,
  onChange,
  discount = 20,
}: {
  billing: BillingPeriod;
  onChange: (b: BillingPeriod) => void;
  discount?: number;
}) {
  return (
    <div className="flex items-center justify-center gap-3 mt-6 mb-2">
      <div className="relative flex items-center bg-white/[0.04] border border-white/[0.08] rounded-2xl p-1.5 backdrop-blur-sm">
        {/* Sliding background */}
        <div
          className={`absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 ease-in-out ${
            billing === "monthly"
              ? "left-1.5 w-[calc(50%-6px)]"
              : "left-[calc(50%+2px)] w-[calc(50%-6px)]"
          }`}
        />

        <button
          onClick={() => onChange("monthly")}
          className={`relative z-10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-300 ${
            billing === "monthly" ? "text-white" : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Mensuel
        </button>

        <button
          onClick={() => onChange("annual")}
          className={`relative z-10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-300 flex items-center gap-2 ${
            billing === "annual" ? "text-white" : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Annuel
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all duration-300 ${
              billing === "annual"
                ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                : "bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20"
            }`}
          >
            -{discount}%
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({
  plan,
  billing,
  onClose,
}: {
  plan: Plan;
  billing: BillingPeriod;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("stripe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAnnual = billing === "annual";
  const displayPrice = isAnnual ? plan.annualMonthlyPrice : plan.monthlyPrice;
  const totalPrice = isAnnual ? plan.annualTotalPrice : plan.monthlyPrice;
  const periodLabel = isAnnual ? "/mois (facturé annuellement)" : "/mois";

  const handleStripe = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/payment/create_payment_session", {
        method: "POST",
        headers: { "Content-Type": "application/json", "App-Host": window.location.origin },
        body: JSON.stringify({
          plan: plan.key,
          amount_cad: totalPrice,
          billing_period: billing,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur Stripe");
      window.location.href = data.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création de la session");
    } finally {
      setLoading(false);
    }
  };

  const handleNowPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/nowpayments/create_payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", "App-Host": window.location.origin },
        body: JSON.stringify({
          plan: plan.key,
          amount_cad: totalPrice,
          billing_period: billing,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur NOWPayments");
      if (!data.payment_url) throw new Error("URL de paiement introuvable");
      window.location.href = data.payment_url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création du paiement crypto");
    } finally {
      setLoading(false);
    }
  };

  const METHODS: { id: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
    { id: "stripe", label: "Carte bancaire", icon: CreditCard, color: "text-indigo-400" },
    { id: "interac", label: "Interac e-Transfer", icon: Banknote, color: "text-emerald-400" },
    { id: "crypto", label: "Crypto (NOWPayments)", icon: Bitcoin, color: "text-amber-400" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative bg-[#0F1525] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-bold">S'abonner — Plan {plan.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white font-bold text-xl">${displayPrice.toFixed(2)} CAD</span>
              <span className="text-gray-500 text-xs">{periodLabel}</span>
            </div>
            {isAnnual && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 line-through">${plan.monthlyPrice.toFixed(2)}/mois</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-bold text-emerald-400">
                  Économisez {plan.annualSavings.toFixed(2)}$/an
                </span>
              </div>
            )}
            {isAnnual && (
              <p className="text-xs text-gray-500 mt-1">
                Total facturé : <span className="text-white font-semibold">${plan.annualTotalPrice.toFixed(2)} CAD/an</span>
              </p>
            )}
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
                  onClick={() => { setMethod(m.id); setError(""); }}
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
                  {isAnnual
                    ? " Facturation annuelle unique — annulable à tout moment."
                    : " Renouvellement automatique mensuel — annulable à tout moment."}
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
                  <>Payer ${isAnnual ? plan.annualTotalPrice.toFixed(2) : displayPrice.toFixed(2)} CAD {isAnnual ? "(annuel)" : ""} <ExternalLink className="w-4 h-4" /></>
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
                      <strong className="text-white">
                        ${isAnnual ? plan.annualTotalPrice.toFixed(2) : displayPrice.toFixed(2)} CAD
                      </strong>
                      {isAnnual ? " (abonnement annuel)" : ""} à :
                    </span>
                  </li>
                </ol>
                <div className="bg-black/30 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-emerald-300 font-mono text-sm">cryptoia2026@gmail.com</span>
                  <CopyButton text="cryptoia2026@gmail.com" />
                </div>
                <ol className="space-y-2 text-xs text-gray-300 list-none">
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">3</span>
                    <span>
                      Dans le champ <strong>message/note</strong>, indiquez :{" "}
                      <span className="text-white font-mono">Plan {plan.name} {isAnnual ? "(Annuel)" : "(Mensuel)"} + votre email</span>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">4</span>
                    <span>
                      Si votre banque demande une <strong>question de sécurité</strong>, utilisez :
                    </span>
                  </li>
                </ol>
                <div className="bg-black/30 border border-emerald-500/20 rounded-xl p-3 space-y-2">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Question de sécurité</p>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-200 text-xs font-mono">Quel est le nom de la plateforme ?</span>
                      <CopyButton text="Quel est le nom de la plateforme ?" />
                    </div>
                  </div>
                  <div className="border-t border-white/[0.05] pt-2 space-y-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Réponse</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-bold font-mono tracking-widest">CryptoIA</span>
                      <CopyButton text="CryptoIA" />
                    </div>
                  </div>
                </div>
                <ol className="space-y-2 text-xs text-gray-300 list-none">
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">5</span>
                    <span>Votre plan sera activé <strong className="text-white">sous 24h ouvrables</strong> après réception</span>
                  </li>
                </ol>
              </div>
              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
                ⚠️ Envoyez le montant <strong>exact</strong> (${isAnnual ? plan.annualTotalPrice.toFixed(2) : displayPrice.toFixed(2)} CAD) pour éviter tout délai de traitement.
              </div>
              <a
                href="mailto:cryptoia2026@gmail.com"
                className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 font-bold text-sm text-emerald-300 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
              >
                Confirmer par email <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* ── NOWPayments Crypto ── */}
          {method === "crypto" && (
            <div className="space-y-4">
              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-amber-300 text-sm">₿ Paiement Crypto via NOWPayments</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {["BTC", "ETH", "USDT", "SOL", "BNB", "LTC"].map((coin) => (
                    <div key={coin} className="bg-black/20 rounded-lg py-1.5 text-xs font-mono text-gray-300 border border-white/[0.04]">
                      {coin}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Vous serez redirigé vers la page de paiement sécurisée NOWPayments.
                  Choisissez votre crypto parmi <strong className="text-white">300+ options</strong>.
                  {isAnnual && <> Montant total : <strong className="text-white">${plan.annualTotalPrice.toFixed(2)} CAD</strong> (abonnement annuel).</>}
                  {" "}Activation automatique après confirmation blockchain.
                </p>
                <div className="space-y-1.5 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
                    <span>Taux de change fixe au moment du paiement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
                    <span>Confirmation automatique (1–30 min)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
                    <span>Aucun compte NOWPayments requis</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={handleNowPayments}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Création du paiement…</>
                ) : (
                  <><Bitcoin className="w-4 h-4" /> Payer ${isAnnual ? plan.annualTotalPrice.toFixed(2) : displayPrice.toFixed(2)} CAD en Crypto <ExternalLink className="w-4 h-4" /></>
                )}
              </button>
              <p className="text-center text-xs text-gray-500">
                🔒 Paiement sécurisé par NOWPayments — Aucune donnée bancaire requise
              </p>
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
  const [annualPrices, setAnnualPrices] = useState<PlanPrices | null>(null);
  const [annualDiscount, setAnnualDiscount] = useState(20);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const currentPlan = getUserPlan();

  useEffect(() => {
    getPlanPrices().then(setPrices);
    getAnnualPlanPrices().then(setAnnualPrices);
    getAnnualDiscount().then(setAnnualDiscount);
  }, []);

  const isAnnual = billing === "annual";

  // ── Génération dynamique des features depuis store.ts ──────────────────────
  const freeFeatures = getPlanAccess("free")
    .filter((s) => !HIDDEN_SLUGS.has(s))
    .map(getFeatureLabel);

  const premiumFeatures = [
    "Tout du plan Gratuit",
    ...getPlanFeatures("premium", "free"),
  ];

  const advancedFeatures = [
    "Tout du plan Premium",
    ...getPlanFeatures("advanced", "premium"),
  ];

  const proFeatures = [
    "Tout du plan Advanced",
    ...getPlanFeatures("pro", "advanced"),
  ];

  const eliteFeatures = [
    "Tout du plan Pro",
    ...getPlanFeatures("elite", "pro"),
  ];

  // Helper to compute pricing using admin-configured annual prices
  const computePricing = (planKey: string, monthlyPrice: number) => {
    const annualMonthlyPrice = annualPrices ? (annualPrices as Record<string, number>)[planKey] || parseFloat((monthlyPrice * (1 - annualDiscount / 100)).toFixed(2)) : parseFloat((monthlyPrice * 0.80).toFixed(2));
    const annualTotalPrice = parseFloat((annualMonthlyPrice * 12).toFixed(2));
    const annualSavings = parseFloat((monthlyPrice * 12 - annualTotalPrice).toFixed(2));
    return { monthlyPrice, annualMonthlyPrice, annualTotalPrice, annualSavings };
  };

  const PLANS: Plan[] = [
    {
      name: "Gratuit",
      key: "free",
      price: "0",
      ...computePricing("free", 0),
      period: "pour toujours",
      icon: Star,
      color: "from-gray-500 to-gray-600",
      borderColor: "border-gray-500/20",
      features: freeFeatures,
      cta: "Plan Actuel",
      popular: false,
      disabled: true,
    },
    {
      name: "Premium",
      key: "premium",
      price: prices ? prices.premium.toFixed(2) : "...",
      ...computePricing("premium", prices ? prices.premium : 0),
      period: "/mois",
      icon: Zap,
      color: "from-blue-500 to-indigo-600",
      borderColor: "border-blue-500/30",
      features: premiumFeatures,
      cta: "Commencer l'essai gratuit",
      popular: false,
      disabled: false,
    },
    {
      name: "Advanced",
      key: "advanced",
      price: prices ? prices.advanced.toFixed(2) : "...",
      ...computePricing("advanced", prices ? prices.advanced : 0),
      period: "/mois",
      icon: Rocket,
      color: "from-purple-500 to-purple-600",
      borderColor: "border-purple-500/30",
      features: advancedFeatures,
      cta: "S'abonner",
      popular: false,
      disabled: false,
    },
    {
      name: "Pro",
      key: "pro",
      price: prices ? prices.pro.toFixed(2) : "...",
      ...computePricing("pro", prices ? prices.pro : 0),
      period: "/mois",
      icon: Crown,
      color: "from-amber-500 to-orange-600",
      borderColor: "border-amber-500/30",
      features: proFeatures,
      cta: "S'abonner",
      popular: true,
      disabled: false,
    },
    {
      name: "Elite",
      key: "elite",
      price: prices ? prices.elite.toFixed(2) : "...",
      ...computePricing("elite", prices ? prices.elite : 0),
      period: "/mois",
      icon: Crown,
      color: "from-emerald-500 to-emerald-600",
      borderColor: "border-emerald-500/30",
      features: eliteFeatures,
      cta: "S'abonner",
      popular: false,
      disabled: false,
    },
  ];

  const isCurrentPlan = (planKey: string) => planKey === currentPlan;

  const handlePlanClick = (plan: Plan) => {
    if (isCurrentPlan(plan.key)) return;
    if (plan.key === "free") return;

    setSelectedPlan(plan);
  };

  const getDisplayPrice = (plan: Plan) => {
    if (plan.key === "free") return "0";
    if (!prices) return "...";
    return isAnnual ? plan.annualMonthlyPrice.toFixed(2) : plan.monthlyPrice.toFixed(2);
  };

  const getPeriodLabel = (plan: Plan) => {
    if (plan.key === "free") return "pour toujours";
    return isAnnual ? "/mois" : "/mois";
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <CreditCard className="w-8 h-8 text-indigo-400" />
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Abonnements
            </h1>
          </div>
          <p className="text-gray-400 max-w-xl mx-auto">
            Choisissez le plan qui correspond à vos besoins de trading. Tous les plans incluent un accès aux données en temps réel.
          </p>

          {/* Marketing value proposition */}
          <div className="mt-4 mb-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20">
            <span className="text-lg">💡</span>
            <span className="text-sm font-semibold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Un seul abonnement remplace 5 outils. Économisez jusqu&apos;à 250$/mois.
            </span>
          </div>

          {/* Payment badges */}
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
              <CreditCard className="w-3.5 h-3.5" /> Carte bancaire (Stripe)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              <Banknote className="w-3.5 h-3.5" /> Interac e-Transfer
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <Bitcoin className="w-3.5 h-3.5" /> Crypto via NOWPayments (300+)
            </span>
          </div>

          {/* Billing Toggle */}
          <BillingToggle billing={billing} onChange={setBilling} discount={annualDiscount} />

          {/* Annual savings hint */}
          {isAnnual && (
            <p className="text-xs text-emerald-400 mt-1 animate-pulse">
              ✨ Économisez {annualDiscount}% avec l'abonnement annuel !
            </p>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-4 max-w-7xl mx-auto mb-12">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const displayPrice = getDisplayPrice(plan);
            const periodLabel = getPeriodLabel(plan);

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

                {/* Annual savings badge */}
                {isAnnual && plan.key !== "free" && plan.annualSavings > 0 && (
                  <div className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 whitespace-nowrap">
                    💰 -{plan.annualSavings.toFixed(2)}$/an
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>

                {/* Price with animation */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span
                    className="text-3xl font-black transition-all duration-500 ease-in-out"
                    key={`${plan.key}-${billing}`}
                  >
                    ${displayPrice}
                  </span>
                  <span className="text-xs text-gray-500">{periodLabel}</span>
                </div>

                {/* Annual billing detail */}
                {isAnnual && plan.key !== "free" && plan.monthlyPrice > 0 && (
                  <div className="mb-3 space-y-0.5">
                    <p className="text-[10px] text-gray-500 line-through">
                      ${plan.monthlyPrice.toFixed(2)}/mois
                    </p>
                    <p className="text-[10px] text-emerald-400/80">
                      Facturé {plan.annualTotalPrice.toFixed(2)}$/an
                    </p>
                  </div>
                )}
                {!isAnnual && <div className="mb-3" />}

                <ul className="space-y-2 mb-5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrentPlan(plan.key) || plan.key === "free"}
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    isCurrentPlan(plan.key)
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default"
                      : plan.key === "free"
                      ? "bg-white/[0.05] text-gray-500 cursor-default"
                      : plan.popular
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white"
                      : "bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-white"
                  }`}
                >
                  {isCurrentPlan(plan.key) ? (
                    <><Check className="w-3.5 h-3.5" /> Plan Actuel</>
                  ) : (
                    <>
                      {plan.cta}
                      {plan.key !== "free" && <ArrowRight className="w-3.5 h-3.5" />}
                    </>
                  )}
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
        <PaymentModal plan={selectedPlan} billing={billing} onClose={() => setSelectedPlan(null)} />
      )}
    <Footer />
    </div>
  );
}