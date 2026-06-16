import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import Confetti from "@/components/Confetti";
import { trackEvent } from "@/lib/analytics";
import { Users, Copy, Check, TrendingUp, DollarSign, Sparkles, Link2, ExternalLink } from "lucide-react";

const REF_STORAGE_KEY = "cryptoia_ref_code";

/**
 * Génère un code d'affiliation unique basé sur un email ou un user id.
 * Format : 6 caractères alphanumériques majuscules.
 */
function generateAffiliateCode(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  let h = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    code += alphabet[h % alphabet.length];
    h = Math.floor(h / alphabet.length) + (i + 1) * 31;
  }
  return code;
}

export default function Affiliation() {
  const [email, setEmail] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [refsCount, setRefsCount] = useState(10);
  const [showConfetti, setShowConfetti] = useState(false);

  // Load stored code on mount if user already generated one
  useEffect(() => {
    const stored = localStorage.getItem(REF_STORAGE_KEY);
    if (stored) {
      const { email: e, code } = JSON.parse(stored);
      setEmail(e || "");
      setAffiliateCode(code || "");
    }
  }, []);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://cryptoia.app";
  const affiliateLink = useMemo(() => `${baseUrl}/?ref=${affiliateCode}`, [baseUrl, affiliateCode]);

  // Estimated earnings calculator
  const monthlyEarnings = useMemo(() => {
    const avgSubscription = 39; // CAD/mois moyen
    const commissionRate = 0.30;
    return Math.round(refsCount * avgSubscription * commissionRate);
  }, [refsCount]);
  const yearlyEarnings = monthlyEarnings * 12;

  const handleGenerate = () => {
    if (!email.trim() || !email.includes("@")) return;
    const code = generateAffiliateCode(email.toLowerCase().trim());
    setAffiliateCode(code);
    localStorage.setItem(REF_STORAGE_KEY, JSON.stringify({ email, code }));
    trackEvent("affiliate_generated", { code });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2800);
  };

  const handleCopy = (text: string, type: "code" | "link") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      if (type === "link") trackEvent("affiliate_link_copied", { code: affiliateCode });
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const stats = [
    { icon: <DollarSign className="w-5 h-5" />, value: "30%", label: "Commission récurrente", color: "from-emerald-400 to-teal-500", glow: "rgba(16,185,129,0.4)" },
    { icon: <TrendingUp className="w-5 h-5" />, value: "À vie", label: "Sur chaque abonnement", color: "from-cyan-400 to-blue-500", glow: "rgba(34,211,238,0.4)" },
    { icon: <Users className="w-5 h-5" />, value: "Illimité", label: "Nombre de filleuls", color: "from-fuchsia-400 to-purple-500", glow: "rgba(217,70,239,0.4)" },
    { icon: <Sparkles className="w-5 h-5" />, value: "Mensuel", label: "Paiement automatique", color: "from-amber-400 to-orange-500", glow: "rgba(245,158,11,0.4)" },
  ];

  const steps = [
    { n: "1", title: "Génère ton lien", desc: "Saisis ton email et reçois ton code unique en 1 clic." },
    { n: "2", title: "Partage", desc: "Diffuse ton lien sur tes réseaux, blog, YouTube, Discord, etc." },
    { n: "3", title: "Encaisse 30%", desc: "Reçois 30% de chaque abonnement de tes filleuls, à vie." },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <Confetti active={showConfetti} count={70} />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen">
        <PageHeader
          icon={<Users className="w-6 h-6" />}
          title="Programme d'Affiliation"
          subtitle="Gagne 30% à vie sur chaque abonnement de tes filleuls. Aucun plafond. Paiement automatique."
          accentColor="emerald"
          steps={steps}
        />

        <div className="max-w-[1300px] mx-auto space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.025] hover:border-white/[0.18] hover:bg-white/[0.04] transition-all hover:-translate-y-1 p-5 overflow-hidden"
                style={{ animation: "aff-fadeUp 0.5s ease-out both", animationDelay: `${i * 80}ms` }}
              >
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity"
                  style={{ background: s.glow }}
                />
                <div
                  className={`relative inline-flex w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} text-white items-center justify-center mb-3`}
                  style={{ boxShadow: `0 8px 20px -6px ${s.glow}` }}
                >
                  {s.icon}
                </div>
                <div className={`relative text-2xl md:text-3xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                  {s.value}
                </div>
                <p className="relative text-xs text-gray-400 mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Generator + Calculator side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Generator */}
            <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

              <h3 className="relative text-lg font-black text-white mb-1 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-emerald-400" /> Ton lien d'affiliation
              </h3>
              <p className="relative text-xs text-gray-400 mb-5">Génère ton lien unique en 5 secondes. Aucune création de compte nécessaire pour le générer.</p>

              {!affiliateCode ? (
                <div className="relative space-y-3">
                  <label className="text-xs font-semibold text-gray-300">Ton email</label>
                  <input
                    data-testid="affiliate-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
                    placeholder="jean@exemple.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40 text-sm text-white placeholder:text-gray-500 outline-none transition-all"
                  />
                  <button
                    data-testid="affiliate-generate-btn"
                    onClick={handleGenerate}
                    disabled={!email.includes("@")}
                    className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider text-white transition-all hover:brightness-110 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
                      boxShadow: "0 8px 24px -6px rgba(16,185,129,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}
                  >
                    Générer mon lien
                  </button>
                </div>
              ) : (
                <div className="relative space-y-4">
                  {/* Code */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ton code affilié</label>
                    <button
                      data-testid="affiliate-copy-code"
                      onClick={() => handleCopy(affiliateCode, "code")}
                      className="mt-1.5 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-emerald-400/40 bg-emerald-400/[0.06] hover:bg-emerald-400/[0.12] transition-all"
                    >
                      <span className="text-xl font-black tracking-[0.2em] text-emerald-300 font-mono">
                        {affiliateCode}
                      </span>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.1] text-[10px] font-bold text-white">
                        {copied === "code" ? <><Check className="w-3 h-3 text-emerald-400" /> Copié</> : <><Copy className="w-3 h-3" /> Copier</>}
                      </span>
                    </button>
                  </div>

                  {/* Link */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ton lien complet</label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-gray-300 font-mono truncate" data-testid="affiliate-link-text">
                        {affiliateLink}
                      </div>
                      <button
                        data-testid="affiliate-copy-link"
                        onClick={() => handleCopy(affiliateLink, "link")}
                        className="px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-xs font-bold text-white transition-all flex items-center gap-1.5"
                      >
                        {copied === "link" ? <><Check className="w-3 h-3 text-emerald-400" /> Copié</> : <><Copy className="w-3 h-3" /> Copier</>}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => { setAffiliateCode(""); setEmail(""); localStorage.removeItem(REF_STORAGE_KEY); }}
                    className="text-[11px] text-gray-500 hover:text-white transition-colors"
                    data-testid="affiliate-reset-btn"
                  >
                    ← Générer un nouveau lien
                  </button>
                </div>
              )}
            </div>

            {/* Calculator */}
            <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 overflow-hidden">
              <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

              <h3 className="relative text-lg font-black text-white mb-1 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-300" /> Combien tu peux gagner ?
              </h3>
              <p className="relative text-xs text-gray-400 mb-5">Estimation basée sur 30% du panier moyen mensuel (39 CAD).</p>

              <div className="relative space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-300">Nombre de filleuls actifs</label>
                    <span data-testid="affiliate-refs-value" className="text-base font-black font-mono text-amber-300">{refsCount}</span>
                  </div>
                  <input
                    data-testid="affiliate-refs-slider"
                    type="range"
                    min={1}
                    max={100}
                    value={refsCount}
                    onChange={(e) => setRefsCount(Number(e.target.value))}
                    className="w-full h-2 rounded-full bg-white/[0.08] accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>1</span><span>25</span><span>50</span><span>75</span><span>100</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300/80 mb-1">Par mois</p>
                    <p data-testid="affiliate-monthly" className="text-2xl md:text-3xl font-black text-emerald-300 font-mono">${monthlyEarnings.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 mt-1">CAD récurrent</p>
                  </div>
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-300/80 mb-1">Par an</p>
                    <p data-testid="affiliate-yearly" className="text-2xl md:text-3xl font-black text-amber-300 font-mono">${yearlyEarnings.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 mt-1">CAD récurrent</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 md:p-8 overflow-hidden">
            <h3 className="text-xl font-black text-white mb-5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" /> Questions fréquentes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { q: "Quand suis-je payé(e) ?", a: "Chaque mois, le 15, par virement bancaire ou crypto (BTC, USDC) à partir de 50$ CAD accumulés." },
                { q: "Combien de temps dure la commission ?", a: "À vie ! Tant que ton filleul reste abonné, tu touches 30% chaque mois — même 5 ans plus tard." },
                { q: "Y a-t-il une limite ?", a: "Aucune. Tu peux parrainer 10 ou 10 000 personnes, la commission de 30% s'applique sur tous." },
                { q: "Comment suivre mes filleuls ?", a: "Connecte-toi pour accéder à ton dashboard d'affiliation : clics, conversions, revenus en temps réel." },
              ].map((f, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.12] transition-all">
                  <p className="text-sm font-bold text-white mb-1.5">{f.q}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <a
                href="mailto:affiliation@cryptoia.app?subject=Question affiliation CryptoIA"
                data-testid="affiliate-contact-link"
                className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Une question spécifique ? Contacte-nous <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <Footer />

        <style>{`
          @keyframes aff-fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </main>
    </div>
  );
}
