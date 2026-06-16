import { useState } from "react";
import { Play, Star, Quote, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

/**
 * Testimonials Section
 * - Affiche 6 témoignages clients avec vignettes vidéo + quote courte
 * - Click vignette → ouvre une modal avec lecteur vidéo (YouTube embed)
 * - Pour ajouter un témoignage : ajouter à `TESTIMONIALS` (videoId YouTube, name, role, gain, quote)
 *
 * ⚠️ Les vignettes utilisent une image générée (poster). Pour des photos réelles :
 *    remplacez `avatar` par une URL d'image dans le tableau.
 */

interface Testimonial {
  id: string;
  name: string;
  role: string;
  gain: string;
  quote: string;
  videoId: string | null; // null = pas de vidéo, juste quote
  avatar: string; // Initiales ou URL
  avatarColor: string; // gradient tailwind classes
  starCount: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Maxime D.",
    role: "Trader Indépendant · Montréal",
    gain: "+38% en 4 mois",
    quote: "Les signaux IA m'ont fait économiser des heures d'analyse. J'ai pris des positions que je n'aurais jamais osées sans le Score Confiance. ROI dingue.",
    videoId: null,
    avatar: "MD",
    avatarColor: "from-cyan-400 to-blue-600",
    starCount: 5,
  },
  {
    id: "2",
    name: "Sophie L.",
    role: "Investisseuse Long-Terme · Paris",
    gain: "+24% portfolio",
    quote: "Je suis novice mais l'onboarding et les indicateurs Fear & Greed m'ont vraiment aidée à éviter les pièges du FOMO. Interface ultra claire.",
    videoId: null,
    avatar: "SL",
    avatarColor: "from-fuchsia-400 to-purple-600",
    starCount: 5,
  },
  {
    id: "3",
    name: "Karim B.",
    role: "Trader Pro · Lyon",
    gain: "+12% mensuel",
    quote: "Le backtesting visuel est de qualité institutionnelle. J'ai validé 3 stratégies sur 5 ans avant de mettre du capital. Game changer.",
    videoId: null,
    avatar: "KB",
    avatarColor: "from-amber-400 to-orange-600",
    starCount: 5,
  },
  {
    id: "4",
    name: "Émilie R.",
    role: "Swing Trader · Bordeaux",
    gain: "+45% en 6 mois",
    quote: "Les patterns IA détectés en temps réel sur 200 cryptos = je n'ai plus besoin de surveiller mes graphiques 8h/jour. Énorme gain de temps.",
    videoId: null,
    avatar: "ER",
    avatarColor: "from-emerald-400 to-teal-600",
    starCount: 5,
  },
  {
    id: "5",
    name: "Antoine V.",
    role: "Crypto Holder · Genève",
    gain: "x3 sur altcoins",
    quote: "Le module Bullrun Phase + Altcoin Season m'a fait shifter du BTC vers les alts juste au bon moment. Ce timing n'a pas de prix.",
    videoId: null,
    avatar: "AV",
    avatarColor: "from-rose-400 to-pink-600",
    starCount: 5,
  },
  {
    id: "6",
    name: "Léa M.",
    role: "Scalpeuse · Bruxelles",
    gain: "+18% en 2 mois",
    quote: "Les alertes Telegram instantanées sur les setups M5/M15 sont en or. Tout ce que j'avais en open je n'aurais jamais réussi sans l'IA.",
    videoId: null,
    avatar: "LM",
    avatarColor: "from-violet-400 to-indigo-600",
    starCount: 5,
  },
];

export default function Testimonials() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <section className="relative my-12 md:my-16" data-testid="testimonials-section">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 border border-amber-400/30 bg-amber-400/10">
            <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
              4.9/5 · Plus de 1200 traders satisfaits
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mb-3">
            Ils ont{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              boosté leurs gains
            </span>{" "}
            avec CryptoIA
          </h2>
          <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Découvrez comment des traders comme vous utilisent notre plateforme pour prendre les bonnes décisions au bon moment.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, idx) => (
            <article
              key={t.id}
              data-testid={`testimonial-card-${t.id}`}
              className="group relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] hover:border-white/[0.18] hover:from-white/[0.06] transition-all hover:-translate-y-1 overflow-hidden"
              style={{ animation: "tst-fadeUp 0.6s ease-out both", animationDelay: `${idx * 80}ms` }}
            >
              {/* Glow */}
              <div
                className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity bg-gradient-to-br ${t.avatarColor}`}
              />

              {/* Video thumbnail / avatar */}
              <div className="relative aspect-video overflow-hidden">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${t.avatarColor} opacity-90`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Pattern overlay */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.4) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.4) 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                  }}
                />

                {/* Avatar bubble */}
                <div className="absolute top-4 left-4 w-12 h-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center backdrop-blur-md text-base font-black text-white">
                  {t.avatar}
                </div>

                {/* Gain badge */}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-emerald-400/40">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    {t.gain}
                  </span>
                </div>

                {/* Play button (only if video) */}
                {t.videoId && (
                  <button
                    data-testid={`testimonial-play-${t.id}`}
                    onClick={() => setActiveVideo(t.videoId)}
                    className="absolute inset-0 flex items-center justify-center cursor-pointer group/play"
                    aria-label={`Voir le témoignage de ${t.name}`}
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center group-hover/play:scale-110 group-hover/play:bg-white/30 transition-all">
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                  </button>
                )}

                {/* Quote icon overlay (when no video) */}
                {!t.videoId && (
                  <div className="absolute bottom-3 right-3 opacity-30">
                    <Quote className="w-8 h-8 text-white fill-white" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="relative p-5">
                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < t.starCount ? "text-amber-300 fill-amber-300" : "text-gray-700"}`}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm text-gray-300 leading-relaxed mb-4 italic">
                  « {t.quote} »
                </p>

                {/* Author */}
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-[11px] text-gray-500">{t.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Banner below */}
        <div className="mt-10 relative rounded-3xl border border-white/[0.08] overflow-hidden p-6 md:p-8 text-center"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(99,102,241,0.06) 100%)" }}
        >
          <p className="text-sm md:text-base text-gray-300 mb-4">
            Rejoignez plus de <strong className="text-emerald-300">1 200 traders</strong> qui font déjà confiance à CryptoIA
          </p>
          <a
            href="/abonnements"
            data-testid="testimonials-cta"
            onClick={() => trackEvent("testimonial_cta_click")}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl font-black text-sm uppercase tracking-wider text-white transition-all hover:brightness-110 hover:scale-[1.03]"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
              boxShadow: "0 12px 30px -8px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            Commencer mon essai · Code BIENVENUE20
          </a>
        </div>
      </div>

      {/* Video modal */}
      {activeVideo && (
        <div
          data-testid="testimonial-video-modal"
          className="fixed inset-0 z-[9997] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden border border-white/[0.12]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/[0.2] backdrop-blur-md transition-all"
              aria-label="Fermer la vidéo"
              data-testid="testimonial-video-close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeVideo}?autoplay=1&rel=0`}
              title="Témoignage client CryptoIA"
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes tst-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
