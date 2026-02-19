import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { getPlanPrices, type PlanPrices } from "@/lib/api";
import { CreditCard, Check, Star, Zap, Crown, Rocket, ArrowRight } from "lucide-react";

const FAQ = [
  { q: "Puis-je annuler à tout moment ?", a: "Oui, vous pouvez annuler votre abonnement à tout moment. Votre accès reste actif jusqu'à la fin de la période payée." },
  { q: "Y a-t-il un essai gratuit ?", a: "Oui ! Le plan Premium inclut un essai gratuit de 7 jours. Aucune carte bancaire requise pour commencer." },
  { q: "Quels moyens de paiement acceptez-vous ?", a: "Nous acceptons Visa, Mastercard, American Express via Stripe, ainsi que les paiements en crypto (BTC, ETH, USDT)." },
  { q: "Les données sont-elles en temps réel ?", a: "Oui, toutes nos données proviennent d'APIs en temps réel (CoinGecko, Binance, Alternative.me) avec des mises à jour automatiques." },
];

export default function Abonnements() {
  const [prices, setPrices] = useState<PlanPrices | null>(null);

  useEffect(() => {
    getPlanPrices().then(setPrices);
  }, []);

  const PLANS = [
    {
      name: "Gratuit",
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
        </div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-4 max-w-7xl mx-auto mb-12">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div key={plan.name}
                className={`relative bg-white/[0.03] border ${plan.borderColor} rounded-2xl p-5 hover:bg-white/[0.05] transition-all ${
                  plan.popular ? "ring-2 ring-amber-500/40 scale-[1.02]" : ""
                }`}>
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
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    plan.disabled
                      ? "bg-white/[0.05] text-gray-500 cursor-default"
                      : plan.popular
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white"
                      : "bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-white"
                  }`}>
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
            <p className="text-sm text-gray-400 mb-4">Essayez le plan Premium gratuitement pendant 7 jours. Aucune carte bancaire requise.</p>
            <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-sm hover:brightness-110 transition-all">
              Commencer l'essai gratuit →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}