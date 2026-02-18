import Sidebar from "@/components/Sidebar";
import { CreditCard, Check, Star, Zap, Crown, Shield, Rocket, ArrowRight } from "lucide-react";

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
    name: "Pro",
    price: "29",
    period: "/mois",
    icon: Zap,
    color: "from-blue-500 to-indigo-600",
    borderColor: "border-blue-500/30",
    features: [
      "Tout du plan Gratuit",
      "AI Assistant illimité",
      "Prédictions IA avancées",
      "Whale Watcher en temps réel",
      "Analyse Technique complète",
      "Gem Hunter & Token Scanner",
      "Alertes Telegram illimitées",
      "Stats Avancées",
      "Support prioritaire",
    ],
    cta: "Commencer l'essai gratuit",
    popular: true,
    disabled: false,
  },
  {
    name: "Enterprise",
    price: "99",
    period: "/mois",
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    borderColor: "border-amber-500/30",
    features: [
      "Tout du plan Pro",
      "API accès complet",
      "Signaux IA exclusifs",
      "Portfolio Tracker avancé",
      "Backtesting illimité",
      "Webhook TradingView",
      "DeFi Yield Aggregator",
      "On-Chain Metrics",
      "Support dédié 24/7",
      "Accès bêta nouvelles fonctionnalités",
    ],
    cta: "Contacter l'équipe",
    popular: false,
    disabled: false,
  },
];

const FAQ = [
  { q: "Puis-je annuler à tout moment ?", a: "Oui, vous pouvez annuler votre abonnement à tout moment. Votre accès reste actif jusqu'à la fin de la période payée." },
  { q: "Y a-t-il un essai gratuit ?", a: "Oui ! Le plan Pro inclut un essai gratuit de 7 jours. Aucune carte bancaire requise pour commencer." },
  { q: "Quels moyens de paiement acceptez-vous ?", a: "Nous acceptons Visa, Mastercard, American Express via Stripe, ainsi que les paiements en crypto (BTC, ETH, USDT)." },
  { q: "Les données sont-elles en temps réel ?", a: "Oui, toutes nos données proviennent d'APIs en temps réel (CoinGecko, Binance, Alternative.me) avec des mises à jour automatiques." },
];

export default function Abonnements() {
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
        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div key={plan.name}
                className={`relative bg-white/[0.03] border ${plan.borderColor} rounded-2xl p-6 hover:bg-white/[0.05] transition-all ${
                  plan.popular ? "ring-2 ring-blue-500/40 scale-[1.02]" : ""
                }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-xs font-bold">
                    ⭐ Plus Populaire
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black">${plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={plan.disabled}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    plan.disabled
                      ? "bg-white/[0.05] text-gray-500 cursor-default"
                      : plan.popular
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 text-white"
                      : "bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-white"
                  }`}>
                  {plan.cta}
                  {!plan.disabled && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">Comparaison Détaillée</h2>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Fonctionnalité</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-400">Gratuit</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-blue-400">Pro</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-amber-400">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Dashboard & Marché", "✅", "✅", "✅"],
                  ["AI Assistant", "5/jour", "Illimité", "Illimité"],
                  ["Prédictions IA", "Basique", "Avancé", "Premium"],
                  ["Whale Watcher", "❌", "✅", "✅"],
                  ["Alertes Telegram", "5/jour", "Illimité", "Illimité"],
                  ["Analyse Technique", "Basique", "Complète", "Complète"],
                  ["Gem Hunter", "❌", "✅", "✅"],
                  ["API Accès", "❌", "❌", "✅"],
                  ["Backtesting", "❌", "Limité", "Illimité"],
                  ["Support", "Community", "Prioritaire", "Dédié 24/7"],
                ].map(([feature, free, pro, enterprise], i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-6 py-3 text-sm font-medium">{feature}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-400">{free}</td>
                    <td className="px-4 py-3 text-center text-sm">{pro}</td>
                    <td className="px-4 py-3 text-center text-sm">{enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <p className="text-sm text-gray-400 mb-4">Essayez le plan Pro gratuitement pendant 7 jours. Aucune carte bancaire requise.</p>
            <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-sm hover:brightness-110 transition-all">
              Commencer l'essai gratuit →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}