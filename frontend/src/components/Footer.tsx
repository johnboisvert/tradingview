export default function Footer() {
  return (
    <footer className="mt-12 border-t border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-sm">
      <div className="px-6 py-8">
        {/* Copyright */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-300">
            Tous droits réservés © 2026 CryptoIA
          </p>
        </div>

        {/* Legal Disclaimer */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="inline-block w-4 h-[2px] bg-indigo-400 rounded-full"></span>
            Avertissement Juridique &amp; Politique de Confidentialité
            <span className="inline-block w-4 h-[2px] bg-indigo-400 rounded-full"></span>
          </h3>

          <div className="space-y-4 text-[11px] leading-relaxed text-gray-500">
            <p>
              <span className="text-gray-400 font-semibold">Notre engagement envers votre vie privée —</span>{" "}
              Nous accordons la plus haute importance à la protection de vos renseignements personnels. CryptoIA s'engage à traiter vos données avec transparence, intégrité et dans le strict respect des lois applicables en matière de confidentialité.
            </p>

            <p>
              <span className="text-gray-400 font-semibold">Aucune offre financière —</span>{" "}
              CryptoIA n'offre, ne promeut ni ne vend aucun investissement, assurance, bien immobilier, titre ou tout autre produit financier. Nous ne garantissons aucun résultat spécifique, y compris le succès financier, découlant de votre utilisation de nos Services. L'ensemble des informations diffusées sur cette plateforme sont exclusivement à des fins éducatives, basées sur l'intelligence artificielle, et ne sauraient être interprétées comme une recommandation d'achat ou de vente de titres.
            </p>

            <p>
              <span className="text-gray-400 font-semibold">Aucun conseil d'investissement —</span>{" "}
              Les services proposés par CryptoIA sont strictement à titre informatif et ne constituent en aucun cas des conseils juridiques, fiscaux, d'investissement, financiers ou de toute autre nature professionnelle. Nous ne sollicitons, ne recommandons, n'approuvons ni ne proposons d'acheter ou de vendre des titres, des devises ou des instruments financiers. Tout contenu fourni est de nature générale et peut ne pas correspondre à votre situation personnelle. Aucune information publiée sur cette plateforme ne constitue un conseil professionnel ou financier. CryptoIA n'est pas votre fiduciaire.
            </p>

            <p>
              <span className="text-gray-400 font-semibold">Avis relatif aux témoignages —</span>{" "}
              Les témoignages partagés par CryptoIA ne sont pas représentatifs de l'expérience type et ne doivent pas être interprétés comme une garantie de performance. Tous les résultats présentés illustrent des expériences individuelles de personnes ayant utilisé certains éléments de nos Services. Les résultats varient d'un individu à l'autre. Les performances passées ne garantissent pas les résultats futurs. Les exemples de gains et de revenus mentionnés sont de nature aspirationnelle et ne constituent pas une promesse de résultats identiques ou similaires.
            </p>

            <p>
              <span className="text-gray-400 font-semibold">Risques inhérents —</span>{" "}
              Avant d'appliquer les principes ou stratégies pédagogiques évoqués sur cette plateforme, il est impératif de comprendre que tout investissement comporte des risques inhérents. Nous vous encourageons vivement à obtenir des conseils financiers indépendants et personnalisés auprès d'un professionnel qualifié avant toute prise de décision.
            </p>

            <p>
              <span className="text-gray-400 font-semibold">Acceptation des conditions —</span>{" "}
              En accédant à tout contenu de ce site ou de sites associés, vous reconnaissez et acceptez d'être lié par nos conditions de service et notre politique de confidentialité. Vous comprenez et acceptez que l'ensemble des analyses, signaux et recommandations sont générés par intelligence artificielle, sans intervention humaine directe, et qu'ils ne sauraient se substituer à un jugement professionnel qualifié.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}