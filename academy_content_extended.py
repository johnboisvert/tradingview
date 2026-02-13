"""
Contenu étendu des modules 4-22 de l'Academy Trading
Ce fichier contient les leçons détaillées pour les modules avancés
"""

# ============================================
# MODULE 4: Types d'Ordres
# ============================================
MODULE_4_LESSONS = {
    (4, 1): {
        "title": "Les ordres Market",
        "video_url": "",
        "content": """
            <h3>🎯 Qu'est-ce qu'un Ordre Market ?</h3>
            <p>Un ordre market (ou ordre au marché) s'exécute <strong>immédiatement</strong> au meilleur prix disponible sur le marché. C'est l'ordre le plus simple et le plus rapide.</p>
            
            <h3>✅ Avantages</h3>
            <ul>
                <li><strong>Exécution garantie</strong> : Votre ordre sera toujours exécuté</li>
                <li><strong>Instantané</strong> : Parfait pour les situations urgentes</li>
                <li><strong>Simple</strong> : Facile à utiliser pour les débutants</li>
            </ul>
            
            <h3>❌ Inconvénients</h3>
            <ul>
                <li><strong>Pas de contrôle sur le prix</strong> : Vous acceptez le prix du marché</li>
                <li><strong>Slippage possible</strong> : En cas de faible liquidité, le prix peut varier</li>
                <li><strong>Frais "taker"</strong> : Généralement plus élevés que les frais "maker"</li>
            </ul>
            
            <h3>📊 Quand Utiliser un Ordre Market ?</h3>
            <ul>
                <li>Entrée urgente sur un breakout confirmé</li>
                <li>Sortie rapide en cas de retournement</li>
                <li>Marchés très liquides (BTC, ETH) où le slippage est minimal</li>
                <li>Quand la vitesse prime sur le prix exact</li>
            </ul>
            
            <h3>💡 Conseil Pro</h3>
            <p>Évitez les ordres market sur les cryptos à faible liquidité ou pendant les périodes de forte volatilité.</p>
        """,
        "key_points": [
            "Ordre market = exécution immédiate au prix du marché",
            "Pas de contrôle sur le prix exact d'exécution",
            "Risque de slippage sur les marchés peu liquides",
            "Idéal pour les situations urgentes sur marchés liquides"
        ],
        "quiz": []
    },
    (4, 2): {
        "title": "Les ordres Limit",
        "video_url": "",
        "content": """
            <h3>📋 Qu'est-ce qu'un Ordre Limit ?</h3>
            <p>Un ordre limit s'exécute <strong>uniquement</strong> au prix que vous avez spécifié ou à un meilleur prix. Il vous donne un contrôle total sur votre prix d'entrée ou de sortie.</p>
            
            <h3>🔹 Limit d'Achat (Buy Limit)</h3>
            <ul>
                <li>Placé <strong>EN DESSOUS</strong> du prix actuel</li>
                <li>S'exécute si le prix descend jusqu'à votre niveau</li>
                <li><strong>Exemple</strong> : BTC à 50 000$, vous placez un buy limit à 48 000$</li>
            </ul>
            
            <h3>🔸 Limit de Vente (Sell Limit)</h3>
            <ul>
                <li>Placé <strong>AU-DESSUS</strong> du prix actuel</li>
                <li>S'exécute si le prix monte jusqu'à votre niveau</li>
                <li><strong>Exemple</strong> : BTC à 50 000$, vous placez un sell limit à 52 000$</li>
            </ul>
            
            <h3>✅ Avantages</h3>
            <ul>
                <li><strong>Contrôle total</strong> du prix d'entrée/sortie</li>
                <li><strong>Frais "maker"</strong> moins élevés (vous ajoutez de la liquidité)</li>
                <li><strong>Pas de slippage</strong> : Prix garanti ou mieux</li>
                <li><strong>Planification</strong> : Placez vos ordres à l'avance</li>
            </ul>
            
            <h3>❌ Inconvénients</h3>
            <ul>
                <li><strong>Exécution non garantie</strong> : Le prix peut ne jamais atteindre votre niveau</li>
                <li><strong>Opportunités manquées</strong> : Le marché peut partir sans vous</li>
            </ul>
        """,
        "key_points": [
            "Ordre limit = prix garanti ou mieux",
            "Buy limit sous le prix actuel, Sell limit au-dessus",
            "Frais maker moins élevés que les frais taker",
            "Exécution non garantie si le prix n'atteint pas le niveau"
        ],
        "quiz": []
    },
    (4, 3): {
        "title": "Les ordres Stop-Loss",
        "video_url": "",
        "content": """
            <h3>🛡️ Le Stop-Loss : Votre Protection Essentielle</h3>
            <p>Un stop-loss est un ordre qui ferme automatiquement votre position lorsque le prix atteint un niveau défini, limitant ainsi vos pertes.</p>
            
            <h3>📍 Types de Stop-Loss</h3>
            
            <h4>1. Stop Market</h4>
            <ul>
                <li>Devient un ordre market quand le prix trigger est atteint</li>
                <li><strong>Avantage</strong> : Exécution garantie</li>
                <li><strong>Inconvénient</strong> : Prix d'exécution variable (slippage possible)</li>
            </ul>
            
            <h4>2. Stop Limit</h4>
            <ul>
                <li>Devient un ordre limit quand le prix trigger est atteint</li>
                <li><strong>Avantage</strong> : Prix garanti</li>
                <li><strong>Inconvénient</strong> : Exécution non garantie si le marché gap</li>
            </ul>
            
            <h3>📊 Placement du Stop-Loss</h3>
            <ul>
                <li><strong>Pour un Long</strong> : Sous le support le plus proche</li>
                <li><strong>Pour un Short</strong> : Au-dessus de la résistance la plus proche</li>
                <li>Laissez une marge de 0.5-1% pour le "bruit" du marché</li>
            </ul>
            
            <h3>⚠️ Règles d'Or</h3>
            <ul>
                <li>TOUJOURS placer un stop-loss sur chaque trade</li>
                <li>Ne JAMAIS déplacer le stop dans le sens de la perte</li>
                <li>Calculez votre taille de position en fonction du stop</li>
            </ul>
        """,
        "key_points": [
            "Stop-loss = protection obligatoire sur chaque trade",
            "Stop market vs Stop limit : exécution garantie vs prix garanti",
            "Placez sous le support pour un long, au-dessus de la résistance pour un short",
            "Ne jamais déplacer le stop vers plus de perte"
        ],
        "quiz": []
    },
    (4, 4): {
        "title": "Les ordres Take-Profit",
        "video_url": "",
        "content": """
            <h3>🎯 Le Take-Profit : Sécuriser vos Gains</h3>
            <p>Un take-profit est un ordre qui ferme automatiquement votre position lorsque votre objectif de profit est atteint.</p>
            
            <h3>📊 Stratégies de Take-Profit</h3>
            
            <h4>1. TP Unique</h4>
            <ul>
                <li>Un seul niveau de sortie pour toute la position</li>
                <li><strong>Avantage</strong> : Simple à gérer</li>
                <li><strong>Inconvénient</strong> : Peut rater des gains supplémentaires</li>
            </ul>
            
            <h4>2. TP Multiple (Scaling Out)</h4>
            <ul>
                <li><strong>TP1</strong> : 50% de la position à R:R 1:1</li>
                <li><strong>TP2</strong> : 30% à R:R 1:2</li>
                <li><strong>TP3</strong> : 20% à R:R 1:3 ou trailing stop</li>
            </ul>
            
            <h3>💡 Où Placer le Take-Profit ?</h3>
            <ul>
                <li>Juste avant une résistance majeure (pour un long)</li>
                <li>Juste avant un support majeur (pour un short)</li>
                <li>À un niveau de Fibonacci (38.2%, 61.8%)</li>
                <li>Selon le ratio Risk/Reward souhaité (minimum 1:2)</li>
            </ul>
            
            <h3>⚖️ Risk/Reward Ratio</h3>
            <p>Visez toujours un R:R minimum de 1:2, idéalement 1:3. Cela signifie que pour chaque euro risqué, vous visez 2-3 euros de gain.</p>
        """,
        "key_points": [
            "Take-profit sécurise les gains automatiquement",
            "Utilisez plusieurs niveaux de TP pour optimiser",
            "Placez avant les résistances/supports majeurs",
            "Visez un R:R minimum de 1:2"
        ],
        "quiz": []
    },
    (4, 5): {
        "title": "Comprendre le slippage",
        "video_url": "",
        "content": """
            <h3>📉 Qu'est-ce que le Slippage ?</h3>
            <p>Le slippage est la différence entre le prix attendu d'un ordre et le prix réel d'exécution. C'est un phénomène normal mais qui peut impacter vos résultats.</p>
            
            <h3>🔍 Causes du Slippage</h3>
            <ul>
                <li><strong>Faible liquidité</strong> : Pas assez d'ordres au prix souhaité</li>
                <li><strong>Volatilité élevée</strong> : Prix qui bouge rapidement</li>
                <li><strong>Gros ordres</strong> : Qui consomment plusieurs niveaux du carnet d'ordres</li>
                <li><strong>News/Événements</strong> : Mouvements soudains du marché</li>
            </ul>
            
            <h3>🛡️ Comment Réduire le Slippage ?</h3>
            <ul>
                <li><strong>Trader des paires liquides</strong> : BTC, ETH, principales altcoins</li>
                <li><strong>Utiliser des ordres limit</strong> : Prix garanti</li>
                <li><strong>Éviter les périodes de forte volatilité</strong> : Annonces, ouvertures de marché</li>
                <li><strong>Fractionner les gros ordres</strong> : Plusieurs petits ordres</li>
                <li><strong>Choisir des exchanges liquides</strong> : Binance, Coinbase Pro</li>
            </ul>
            
            <h3>📊 Exemple de Slippage</h3>
            <p>Vous voulez acheter BTC à 50 000$, mais votre ordre market s'exécute à 50 050$ = 0.1% de slippage négatif.</p>
        """,
        "key_points": [
            "Slippage = différence entre prix attendu et prix réel",
            "Causé par faible liquidité, volatilité, gros ordres",
            "Utilisez des ordres limit pour l'éviter",
            "Tradez des paires liquides sur des exchanges majeurs"
        ],
        "quiz": []
    },
    (4, 6): {
        "title": "Ordres avancés : OCO et Trailing Stop",
        "video_url": "",
        "content": """
            <h3>🔄 Ordre OCO (One Cancels Other)</h3>
            <p>Un OCO est un ensemble de deux ordres liés : quand l'un s'exécute, l'autre est automatiquement annulé.</p>
            
            <h4>Utilisation Courante</h4>
            <ul>
                <li><strong>Stop-Loss + Take-Profit</strong> : Gestion automatique de la position</li>
                <li><strong>Breakout haussier OU baissier</strong> : Entrée dans la direction du breakout</li>
            </ul>
            
            <h3>📈 Trailing Stop (Stop Suiveur)</h3>
            <p>Un trailing stop est un stop-loss qui suit automatiquement le prix en votre faveur.</p>
            
            <h4>Fonctionnement</h4>
            <ul>
                <li>Définissez une distance (ex: 2% ou 1000$)</li>
                <li>Le stop suit le prix quand il monte (pour un long)</li>
                <li>Le stop reste fixe quand le prix baisse</li>
                <li>Vous êtes sorti si le prix recule de la distance définie</li>
            </ul>
            
            <h4>Avantages du Trailing Stop</h4>
            <ul>
                <li><strong>Laisse courir les gains</strong> : Pas de sortie prématurée</li>
                <li><strong>Protège les profits</strong> : Le stop monte avec le prix</li>
                <li><strong>Automatisé</strong> : Pas besoin de surveiller constamment</li>
            </ul>
            
            <h3>💡 Conseil</h3>
            <p>Utilisez le trailing stop après avoir atteint votre premier objectif (TP1) pour laisser courir le reste de la position.</p>
        """,
        "key_points": [
            "OCO = deux ordres liés, un annule l'autre",
            "Trailing stop suit le prix en votre faveur",
            "Idéal pour laisser courir les gains tout en protégeant",
            "Automatise la gestion de position"
        ],
        "quiz": []
    },
}

# ============================================
# MODULE 5: Sécurité & Wallets
# ============================================
MODULE_5_LESSONS = {
    (5, 1): {
        "title": "Les bases de la sécurité crypto",
        "video_url": "",
        "content": """
            <h3>🔐 Pourquoi la Sécurité est Cruciale en Crypto</h3>
            <p>En crypto, <strong>vous êtes votre propre banque</strong>. Il n'y a pas de service client pour récupérer vos fonds en cas de vol ou d'erreur. La sécurité est donc primordiale.</p>
            
            <h3>⚠️ Menaces Principales</h3>
            <ul>
                <li><strong>Phishing</strong> : Faux sites qui imitent les vrais pour voler vos identifiants</li>
                <li><strong>Malware</strong> : Logiciels malveillants qui volent vos données</li>
                <li><strong>SIM Swap</strong> : Hackers qui transfèrent votre numéro de téléphone</li>
                <li><strong>Social Engineering</strong> : Manipulation pour obtenir vos informations</li>
                <li><strong>Hacks d'exchange</strong> : Piratage des plateformes centralisées</li>
            </ul>
            
            <h3>🛡️ Règles de Base Essentielles</h3>
            <ul>
                <li><strong>Vérifiez TOUJOURS l'URL</strong> avant de vous connecter</li>
                <li><strong>N'utilisez jamais le même mot de passe</strong> sur plusieurs sites</li>
                <li><strong>Activez le 2FA</strong> sur tous vos comptes</li>
                <li><strong>Ne partagez JAMAIS votre seed phrase</strong> avec personne</li>
                <li><strong>Méfiez-vous des messages non sollicités</strong></li>
            </ul>
            
            <h3>💡 Principe Fondamental</h3>
            <p style="font-size: 1.2em; color: #f59e0b;"><strong>"Not your keys, not your coins"</strong> - Si vous ne contrôlez pas les clés privées, vous ne possédez pas vraiment vos cryptos.</p>
        """,
        "key_points": [
            "En crypto, vous êtes votre propre banque",
            "Le phishing est la menace #1 - vérifiez toujours l'URL",
            "Ne partagez jamais votre seed phrase avec personne",
            "Not your keys, not your coins"
        ],
        "quiz": []
    },
    (5, 2): {
        "title": "Hot wallets vs Cold wallets",
        "video_url": "",
        "content": """
            <h3>🔥 Hot Wallets (Portefeuilles Chauds)</h3>
            <p>Les hot wallets sont connectés à Internet. Ils sont pratiques mais moins sécurisés.</p>
            
            <h4>Types de Hot Wallets</h4>
            <ul>
                <li><strong>Wallets d'exchange</strong> : Binance, Coinbase (vous ne contrôlez pas les clés)</li>
                <li><strong>Wallets mobiles</strong> : Trust Wallet, MetaMask Mobile</li>
                <li><strong>Wallets desktop</strong> : Exodus, Electrum, MetaMask</li>
                <li><strong>Wallets web</strong> : Extensions de navigateur</li>
            </ul>
            
            <h3>❄️ Cold Wallets (Portefeuilles Froids)</h3>
            <p>Les cold wallets sont hors ligne. Ils sont très sécurisés pour le stockage long terme.</p>
            
            <h4>Types de Cold Wallets</h4>
            <ul>
                <li><strong>Hardware wallets</strong> : Ledger, Trezor (recommandé)</li>
                <li><strong>Paper wallets</strong> : Clés imprimées sur papier</li>
                <li><strong>Steel wallets</strong> : Seed phrase gravée sur métal</li>
            </ul>
            
            <h3>📊 Recommandation d'Allocation</h3>
            <table style="width:100%; border-collapse: collapse; margin: 15px 0;">
                <tr style="background: #1a2234;"><th style="padding: 10px; border: 1px solid #333;">Usage</th><th style="padding: 10px; border: 1px solid #333;">Type</th><th style="padding: 10px; border: 1px solid #333;">% du Capital</th></tr>
                <tr><td style="padding: 10px; border: 1px solid #333;">Trading actif</td><td style="padding: 10px; border: 1px solid #333;">Hot wallet / Exchange</td><td style="padding: 10px; border: 1px solid #333;">10-20%</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #333;">Stockage long terme</td><td style="padding: 10px; border: 1px solid #333;">Cold wallet (Ledger)</td><td style="padding: 10px; border: 1px solid #333;">80-90%</td></tr>
            </table>
        """,
        "key_points": [
            "Hot wallet = connecté, pratique, moins sécurisé",
            "Cold wallet = hors ligne, très sécurisé",
            "80-90% de vos cryptos en cold wallet",
            "10-20% en hot wallet pour le trading actif"
        ],
        "quiz": []
    },
    (5, 3): {
        "title": "Configurer un Ledger",
        "video_url": "",
        "content": """
            <h3>🔧 Guide : Configuration d'un Ledger</h3>
            
            <h4>Étape 1 : Achat Sécurisé</h4>
            <ul>
                <li>Achetez <strong>UNIQUEMENT</strong> sur le site officiel ledger.com</li>
                <li><strong>JAMAIS</strong> sur Amazon, eBay ou sites tiers</li>
                <li>Vérifiez que l'emballage est scellé à la réception</li>
            </ul>
            
            <h4>Étape 2 : Initialisation</h4>
            <ol>
                <li>Téléchargez Ledger Live depuis le site officiel</li>
                <li>Connectez le Ledger via USB</li>
                <li>Choisissez "Set up as new device"</li>
                <li>Créez un code PIN (4-8 chiffres)</li>
            </ol>
            
            <h4>Étape 3 : Seed Phrase (CRUCIAL)</h4>
            <div style="background: #ffebee; padding: 15px; border-radius: 8px; border-left: 4px solid #f44336; margin: 15px 0;">
                <strong>⚠️ ATTENTION :</strong>
                <ul>
                    <li>Notez les 24 mots sur PAPIER (pas sur ordinateur)</li>
                    <li>Vérifiez chaque mot attentivement</li>
                    <li>Stockez en lieu sûr (coffre-fort)</li>
                    <li>JAMAIS de photo ou fichier numérique</li>
                    <li>Ne partagez avec PERSONNE</li>
                </ul>
            </div>
            
            <h4>Étape 4 : Installation des Applications</h4>
            <ul>
                <li>Ouvrez Ledger Live</li>
                <li>Installez les apps nécessaires (Bitcoin, Ethereum, etc.)</li>
                <li>Créez des comptes pour chaque crypto</li>
            </ul>
        """,
        "key_points": [
            "Achetez uniquement sur le site officiel Ledger",
            "Notez la seed phrase sur papier, jamais numériquement",
            "Stockez la seed phrase dans un coffre-fort",
            "Ne partagez jamais votre seed phrase"
        ],
        "quiz": []
    },
    (5, 4): {
        "title": "Les arnaques à éviter",
        "video_url": "",
        "content": """
            <h3>🚨 Arnaques Courantes en Crypto</h3>
            
            <h4>1. Phishing</h4>
            <ul>
                <li>Faux sites identiques aux vrais (binance.com vs b1nance.com)</li>
                <li>Emails frauduleux demandant vos identifiants</li>
                <li><strong>Protection</strong> : Vérifiez TOUJOURS l'URL, utilisez des favoris</li>
            </ul>
            
            <h4>2. Faux Support Client</h4>
            <ul>
                <li>Messages sur Telegram/Discord prétendant être le support</li>
                <li><strong>Règle</strong> : Le support ne vous contacte JAMAIS en premier</li>
                <li><strong>Règle</strong> : Le support ne demande JAMAIS votre seed phrase</li>
            </ul>
            
            <h4>3. Pump & Dump</h4>
            <ul>
                <li>Groupes qui "recommandent" des cryptos</li>
                <li>Ils achètent avant, vous faites monter le prix, ils vendent</li>
                <li><strong>Protection</strong> : Faites vos propres recherches</li>
            </ul>
            
            <h4>4. Faux Airdrops</h4>
            <ul>
                <li>Sites demandant de connecter votre wallet pour recevoir des tokens</li>
                <li>Ils vident votre wallet via des smart contracts malveillants</li>
                <li><strong>Protection</strong> : N'approuvez jamais de contrats suspects</li>
            </ul>
            
            <h4>5. Romance Scams</h4>
            <ul>
                <li>Fausses relations amoureuses en ligne</li>
                <li>Demandent d'investir dans "leur" plateforme</li>
                <li><strong>Protection</strong> : Méfiez-vous des inconnus qui parlent d'investissement</li>
            </ul>
            
            <h3>🛡️ Règle d'Or</h3>
            <p style="font-size: 1.1em; color: #f59e0b;"><strong>Si c'est trop beau pour être vrai, c'est une arnaque.</strong></p>
        """,
        "key_points": [
            "Le support ne contacte jamais en premier",
            "Ne partagez jamais votre seed phrase",
            "Vérifiez toujours l'URL avant de vous connecter",
            "Si c'est trop beau pour être vrai, c'est une arnaque"
        ],
        "quiz": []
    },
}

# ============================================
# MODULE 6: Psychologie du Trader
# ============================================
MODULE_6_LESSONS = {
    (6, 1): {
        "title": "L'importance de la psychologie",
        "video_url": "",
        "content": """
            <h3>🧠 La Psychologie : 80% du Succès en Trading</h3>
            <p>La psychologie représente environ <strong>80% du succès</strong> en trading. Les meilleurs traders ne sont pas ceux qui ont les meilleures stratégies, mais ceux qui maîtrisent leurs émotions.</p>
            
            <h3>😰 Émotions Dangereuses en Trading</h3>
            <ul>
                <li><strong>Peur</strong> : Vous fait sortir trop tôt ou ne pas entrer du tout</li>
                <li><strong>Cupidité</strong> : Vous fait rester trop longtemps ou risquer trop</li>
                <li><strong>Espoir</strong> : Vous empêche de couper les pertes</li>
                <li><strong>Frustration</strong> : Mène au revenge trading</li>
                <li><strong>Euphorie</strong> : Vous fait prendre des risques excessifs après des gains</li>
            </ul>
            
            <h3>🎯 État d'Esprit du Trader Gagnant</h3>
            <ul>
                <li><strong>Acceptation</strong> : Les pertes font partie du jeu</li>
                <li><strong>Focus sur le processus</strong> : Pas sur le résultat individuel</li>
                <li><strong>Discipline</strong> : Suivre son plan quoi qu'il arrive</li>
                <li><strong>Apprentissage continu</strong> : Chaque trade est une leçon</li>
                <li><strong>Patience</strong> : Attendre les bonnes opportunités</li>
            </ul>
            
            <h3>📊 Statistique Importante</h3>
            <p>Un trader avec un taux de réussite de 40% peut être très rentable avec un bon R:R et une bonne gestion du risque.</p>
        """,
        "key_points": [
            "La psychologie représente 80% du succès en trading",
            "Peur et cupidité sont les principaux ennemis",
            "Acceptez que les pertes font partie du jeu",
            "Concentrez-vous sur le processus, pas sur le résultat"
        ],
        "quiz": []
    },
    (6, 2): {
        "title": "Le FOMO expliqué",
        "video_url": "",
        "content": """
            <h3>😱 FOMO : Fear Of Missing Out</h3>
            <p>Le FOMO est la <strong>peur de rater une opportunité</strong>. C'est l'une des émotions les plus destructrices en trading.</p>
            
            <h3>🔍 Signes que vous êtes en FOMO</h3>
            <ul>
                <li>Vous achetez parce que "tout le monde achète"</li>
                <li>Vous entrez après une forte hausse sans analyse</li>
                <li>Vous ne respectez pas votre plan de trading</li>
                <li>Vous ressentez une urgence irrationnelle d'agir</li>
                <li>Vous regardez constamment les réseaux sociaux</li>
            </ul>
            
            <h3>📉 Conséquences du FOMO</h3>
            <ul>
                <li><strong>Acheter au plus haut</strong> : Entrée au pire moment</li>
                <li><strong>Pertes importantes</strong> : Le prix corrige après votre entrée</li>
                <li><strong>Frustration</strong> : Mène au revenge trading</li>
                <li><strong>Cycle vicieux</strong> : FOMO → Perte → Frustration → FOMO</li>
            </ul>
            
            <h3>🛡️ Comment Combattre le FOMO</h3>
            <ul>
                <li><strong>Ayez un plan</strong> et respectez-le strictement</li>
                <li><strong>Acceptez de rater des opportunités</strong> : Il y en aura d'autres</li>
                <li><strong>Rappelez-vous</strong> : "Il y aura toujours un autre trade"</li>
                <li><strong>Limitez les réseaux sociaux</strong> pendant le trading</li>
                <li><strong>Analysez avant d'agir</strong> : Jamais d'achat impulsif</li>
            </ul>
        """,
        "key_points": [
            "FOMO = peur de rater une opportunité",
            "Mène souvent à acheter au plus haut",
            "Ayez un plan et respectez-le",
            "Il y aura toujours d'autres opportunités"
        ],
        "quiz": []
    },
    (6, 3): {
        "title": "Gérer la peur et la cupidité",
        "video_url": "",
        "content": """
            <h3>😨 La Peur en Trading</h3>
            <p>La peur vous fait prendre de mauvaises décisions : sortir trop tôt d'un trade gagnant, ne pas entrer sur un bon setup, ou déplacer votre stop loss.</p>
            
            <h4>Solutions contre la Peur</h4>
            <ul>
                <li><strong>Risquez un montant confortable</strong> : Si vous stressez, vous risquez trop</li>
                <li><strong>Ayez confiance en votre analyse</strong> : Backtestez votre stratégie</li>
                <li><strong>Acceptez les pertes</strong> : Elles sont normales et inévitables</li>
                <li><strong>Utilisez des stops</strong> : Vous savez exactement ce que vous risquez</li>
            </ul>
            
            <h3>🤑 La Cupidité en Trading</h3>
            <p>La cupidité vous fait rester trop longtemps dans un trade, ne pas prendre de profits, ou augmenter le risque après des gains.</p>
            
            <h4>Solutions contre la Cupidité</h4>
            <ul>
                <li><strong>Définissez vos objectifs à l'avance</strong> : Avant d'entrer</li>
                <li><strong>Utilisez des take-profits automatiques</strong></li>
                <li><strong>Prenez des profits partiels</strong> : Sécurisez une partie</li>
                <li><strong>Rappelez-vous</strong> : "Les arbres ne montent pas jusqu'au ciel"</li>
            </ul>
            
            <h3>⚖️ Trouver l'Équilibre</h3>
            <p>Le trader gagnant trouve l'équilibre entre peur (qui protège) et cupidité (qui motive). Ni l'un ni l'autre ne doit dominer.</p>
        """,
        "key_points": [
            "La peur fait sortir trop tôt ou ne pas entrer",
            "La cupidité fait rester trop longtemps",
            "Risquez un montant qui vous permet de dormir tranquille",
            "Définissez vos objectifs avant d'entrer en position"
        ],
        "quiz": []
    },
    (6, 4): {
        "title": "Créer un journal de trading",
        "video_url": "",
        "content": """
            <h3>📓 Pourquoi un Journal de Trading ?</h3>
            <p>Le journal de trading est l'outil #1 pour progresser. Il vous permet d'analyser vos trades, identifier vos erreurs et améliorer votre stratégie.</p>
            
            <h3>📝 Que Noter dans votre Journal ?</h3>
            <ul>
                <li><strong>Date et heure</strong> du trade</li>
                <li><strong>Paire tradée</strong> (ex: BTC/USDT)</li>
                <li><strong>Direction</strong> : Long ou Short</li>
                <li><strong>Prix d'entrée et de sortie</strong></li>
                <li><strong>Stop loss et take profit</strong></li>
                <li><strong>Taille de position</strong></li>
                <li><strong>Raison de l'entrée</strong> (setup, indicateurs)</li>
                <li><strong>Raison de la sortie</strong></li>
                <li><strong>Émotions ressenties</strong> (avant, pendant, après)</li>
                <li><strong>Résultat</strong> (gain/perte en € et %)</li>
                <li><strong>Screenshot du graphique</strong></li>
                <li><strong>Leçons apprises</strong></li>
            </ul>
            
            <h3>📊 Analyse Hebdomadaire</h3>
            <ul>
                <li>Revoyez tous vos trades de la semaine</li>
                <li>Identifiez les patterns d'erreurs récurrentes</li>
                <li>Calculez vos statistiques (winrate, R:R moyen)</li>
                <li>Notez les améliorations à apporter</li>
            </ul>
            
            <h3>🛠️ Outils Recommandés</h3>
            <ul>
                <li>Notion ou Google Sheets (gratuit)</li>
                <li>Tradervue, Edgewonk (payant, avancé)</li>
            </ul>
        """,
        "key_points": [
            "Le journal est essentiel pour progresser",
            "Notez tous les détails de chaque trade",
            "Incluez vos émotions - elles révèlent beaucoup",
            "Analysez vos trades chaque semaine"
        ],
        "quiz": []
    },
    (6, 5): {
        "title": "Routine du trader gagnant",
        "video_url": "",
        "content": """
            <h3>🌅 Routine Matinale</h3>
            <ul>
                <li><strong>Réveil à heure fixe</strong> : Discipline commence le matin</li>
                <li><strong>Pas de trading immédiat</strong> : Attendez 30 min minimum</li>
                <li><strong>Analyse des marchés</strong> : Tendances, news importantes</li>
                <li><strong>Définition des opportunités</strong> : Quels setups surveiller ?</li>
                <li><strong>Revue du plan de trading</strong> : Rappel des règles</li>
            </ul>
            
            <h3>📊 Pendant le Trading</h3>
            <ul>
                <li><strong>Suivez votre plan</strong> : Pas de décisions impulsives</li>
                <li><strong>Pauses régulières</strong> : Toutes les 2 heures</li>
                <li><strong>Hydratation et alimentation</strong> : Corps sain, esprit sain</li>
                <li><strong>Notez vos trades</strong> : Journal en temps réel</li>
                <li><strong>Limitez le nombre de trades</strong> : Qualité > Quantité</li>
            </ul>
            
            <h3>🌙 Routine du Soir</h3>
            <ul>
                <li><strong>Revue des trades du jour</strong></li>
                <li><strong>Mise à jour du journal</strong></li>
                <li><strong>Préparation du lendemain</strong> : Niveaux à surveiller</li>
                <li><strong>Déconnexion des écrans</strong> : 1h avant de dormir</li>
            </ul>
            
            <h3>🏋️ Hygiène de Vie</h3>
            <ul>
                <li><strong>Sommeil</strong> : 7-8h minimum</li>
                <li><strong>Exercice physique</strong> : Réduit le stress</li>
                <li><strong>Alimentation équilibrée</strong></li>
                <li><strong>Vie sociale</strong> : Ne vous isolez pas</li>
            </ul>
        """,
        "key_points": [
            "Une routine fixe développe la discipline",
            "Analysez les marchés avant de trader",
            "Prenez des pauses régulières",
            "L'hygiène de vie impacte directement vos performances"
        ],
        "quiz": []
    },
}

# ============================================
# MODULE 7: Supports & Résistances
# ============================================
MODULE_7_LESSONS = {
    (7, 1): {
        "title": "Qu'est-ce qu'un support ?",
        "video_url": "",
        "content": """
            <h3>📉 Définition du Support</h3>
            <p>Un support est un niveau de prix où la <strong>demande (acheteurs)</strong> est suffisamment forte pour empêcher le prix de baisser davantage. C'est un "plancher" pour le prix.</p>
            
            <h3>🔍 Comment Identifier un Support ?</h3>
            <ul>
                <li>Zone où le prix a <strong>rebondi plusieurs fois</strong></li>
                <li>Plus il y a de rebonds, plus le support est <strong>fort</strong></li>
                <li>Les <strong>niveaux ronds</strong> sont souvent des supports (50000$, 100$)</li>
                <li>Les anciens <strong>creux significatifs</strong></li>
            </ul>
            
            <h3>📊 Types de Supports</h3>
            <ul>
                <li><strong>Support horizontal</strong> : Niveau de prix fixe</li>
                <li><strong>Support dynamique</strong> : Moyenne mobile, ligne de tendance</li>
                <li><strong>Support psychologique</strong> : Nombres ronds (10000$, 50000$)</li>
            </ul>
            
            <h3>💡 Trading sur Support</h3>
            <ul>
                <li><strong>Achetez</strong> quand le prix touche le support</li>
                <li><strong>Stop loss</strong> sous le support (avec marge)</li>
                <li><strong>Attendez une confirmation</strong> : Chandelier de retournement</li>
                <li><strong>Ne rattrapez pas un couteau qui tombe</strong></li>
            </ul>
        """,
        "key_points": [
            "Support = niveau où les acheteurs dominent",
            "Plus de rebonds = support plus fort",
            "Nombres ronds = supports psychologiques",
            "Achetez sur support avec stop en dessous"
        ],
        "quiz": []
    },
    (7, 2): {
        "title": "Qu'est-ce qu'une résistance ?",
        "video_url": "",
        "content": """
            <h3>📈 Définition de la Résistance</h3>
            <p>Une résistance est un niveau de prix où l'<strong>offre (vendeurs)</strong> est suffisamment forte pour empêcher le prix de monter davantage. C'est un "plafond" pour le prix.</p>
            
            <h3>🔍 Comment Identifier une Résistance ?</h3>
            <ul>
                <li>Zone où le prix a été <strong>rejeté plusieurs fois</strong></li>
                <li><strong>Anciens sommets</strong> significatifs</li>
                <li><strong>Niveaux ronds</strong> (100$, 1000$, 50000$)</li>
                <li>Zones de forte <strong>concentration d'ordres de vente</strong></li>
            </ul>
            
            <h3>📊 Le Flip Support/Résistance</h3>
            <p>Concept clé : Quand un <strong>support est cassé</strong>, il devient souvent une <strong>résistance</strong> (et vice versa).</p>
            
            <h3>💡 Trading sur Résistance</h3>
            <ul>
                <li><strong>Vendez (short)</strong> quand le prix touche la résistance</li>
                <li><strong>Stop loss</strong> au-dessus de la résistance</li>
                <li><strong>Ou attendez la cassure</strong> pour acheter le breakout</li>
            </ul>
        """,
        "key_points": [
            "Résistance = niveau où les vendeurs dominent",
            "Anciens sommets = résistances potentielles",
            "Support cassé devient résistance (flip S/R)",
            "Vendez sur résistance ou achetez la cassure"
        ],
        "quiz": []
    },
    (7, 3): {
        "title": "Tracer des niveaux clés",
        "video_url": "",
        "content": """
            <h3>✏️ Comment Tracer les Niveaux Clés ?</h3>
            
            <h4>Étape 1 : Identifier les Zones</h4>
            <ul>
                <li>Cherchez les zones de <strong>rebonds multiples</strong></li>
                <li>Notez les <strong>anciens sommets et creux</strong></li>
                <li>Identifiez les <strong>niveaux psychologiques</strong></li>
            </ul>
            
            <h4>Étape 2 : Tracer les Lignes</h4>
            <ul>
                <li>Utilisez des <strong>zones</strong> plutôt que des lignes exactes</li>
                <li>Connectez les <strong>mèches ou les corps</strong> selon le contexte</li>
                <li>Les zones de 1-2% sont normales</li>
            </ul>
            
            <h4>Étape 3 : Valider les Niveaux</h4>
            <ul>
                <li>Plus de touches = plus de validité</li>
                <li>Vérifiez sur <strong>plusieurs timeframes</strong></li>
                <li>Les niveaux du Daily/Weekly sont plus forts</li>
            </ul>
            
            <h3>⚠️ Erreurs à Éviter</h3>
            <ul>
                <li><strong>Trop de lignes</strong> = confusion et paralysie</li>
                <li><strong>Lignes trop précises</strong> : Utilisez des zones</li>
                <li><strong>Ignorer le contexte</strong> : Tendance, volume</li>
            </ul>
        """,
        "key_points": [
            "Utilisez des zones, pas des lignes exactes",
            "Plus de touches = plus de validité",
            "Vérifiez sur plusieurs timeframes",
            "Ne tracez pas trop de niveaux"
        ],
        "quiz": []
    },
    (7, 4): {
        "title": "Les lignes de tendance",
        "video_url": "",
        "content": """
            <h3>📐 Qu'est-ce qu'une Ligne de Tendance ?</h3>
            <p>Une ligne de tendance est une ligne droite qui connecte les creux (tendance haussière) ou les sommets (tendance baissière).</p>
            
            <h3>📈 Ligne de Tendance Haussière</h3>
            <ul>
                <li>Connecte les <strong>creux ascendants</strong></li>
                <li>Agit comme <strong>support dynamique</strong></li>
                <li>Minimum <strong>2 points de contact</strong> (3 = plus fiable)</li>
            </ul>
            
            <h3>📉 Ligne de Tendance Baissière</h3>
            <ul>
                <li>Connecte les <strong>sommets descendants</strong></li>
                <li>Agit comme <strong>résistance dynamique</strong></li>
            </ul>
            
            <h3>💡 Trading avec les Lignes de Tendance</h3>
            <ul>
                <li><strong>Achetez</strong> sur la ligne de tendance haussière</li>
                <li><strong>Vendez</strong> sur la ligne de tendance baissière</li>
                <li>La <strong>cassure</strong> signale un changement de tendance potentiel</li>
            </ul>
            
            <h3>⚠️ Attention</h3>
            <p>Les lignes de tendance sont subjectives. Deux traders peuvent tracer des lignes différentes sur le même graphique.</p>
        """,
        "key_points": [
            "Ligne haussière = support dynamique (connecte les creux)",
            "Ligne baissière = résistance dynamique (connecte les sommets)",
            "Minimum 2 points de contact, 3 = plus fiable",
            "La cassure signale un changement de tendance"
        ],
        "quiz": []
    },
    (7, 5): {
        "title": "Trader les rebonds",
        "video_url": "",
        "content": """
            <h3>🎯 Stratégie de Rebond sur Support</h3>
            
            <h4>Conditions d'Entrée</h4>
            <ul>
                <li>Prix atteint un <strong>support identifié</strong></li>
                <li><strong>Chandelier de retournement</strong> (marteau, engulfing)</li>
                <li><strong>Volume en augmentation</strong> sur le rebond</li>
                <li>Tendance générale pas trop baissière</li>
            </ul>
            
            <h4>Gestion de Position</h4>
            <ul>
                <li><strong>Entrée</strong> : Sur confirmation du rebond</li>
                <li><strong>Stop Loss</strong> : Sous le support (1-2% de marge)</li>
                <li><strong>Take Profit</strong> : Prochaine résistance ou R:R 1:2</li>
            </ul>
            
            <h3>📊 Exemple Pratique</h3>
            <ul>
                <li>BTC touche le support à 48000$</li>
                <li>Marteau haussier se forme</li>
                <li>Entrée : 48500$ (après confirmation)</li>
                <li>Stop : 47500$ (sous le support)</li>
                <li>TP : 51000$ (prochaine résistance)</li>
            </ul>
            
            <h3>⚠️ Attention</h3>
            <ul>
                <li>Le support peut <strong>casser</strong></li>
                <li>Attendez <strong>toujours une confirmation</strong></li>
                <li><strong>Ne rattrapez pas un couteau qui tombe</strong></li>
            </ul>
        """,
        "key_points": [
            "Attendez une confirmation avant d'entrer",
            "Stop loss sous le support",
            "Take profit à la prochaine résistance",
            "Le support peut casser - respectez votre stop"
        ],
        "quiz": []
    },
    (7, 6): {
        "title": "Trader les cassures (breakouts)",
        "video_url": "",
        "content": """
            <h3>💥 Stratégie de Breakout</h3>
            
            <h4>Qu'est-ce qu'un Breakout ?</h4>
            <p>Une cassure d'un niveau de support ou résistance avec continuation dans la direction de la cassure.</p>
            
            <h4>Conditions d'un Bon Breakout</h4>
            <ul>
                <li><strong>Volume élevé</strong> sur la cassure</li>
                <li><strong>Clôture au-delà</strong> du niveau (pas juste une mèche)</li>
                <li><strong>Pas de mèche de rejet</strong> importante</li>
                <li>Idéalement après une <strong>consolidation</strong></li>
            </ul>
            
            <h4>Faux Breakout (Fakeout)</h4>
            <ul>
                <li>Cassure temporaire qui <strong>revient dans le range</strong></li>
                <li>Piège pour les traders qui entrent trop tôt</li>
                <li><strong>Solution</strong> : Attendez la confirmation ou le retest</li>
            </ul>
            
            <h4>Stratégies d'Entrée</h4>
            <ul>
                <li><strong>Entrée agressive</strong> : Sur la cassure avec volume</li>
                <li><strong>Entrée conservatrice</strong> : Sur le retest du niveau cassé</li>
            </ul>
            
            <h4>Gestion de Position</h4>
            <ul>
                <li><strong>Stop Loss</strong> : De l'autre côté du niveau cassé</li>
                <li><strong>Take Profit</strong> : Prochain niveau ou projection</li>
            </ul>
        """,
        "key_points": [
            "Breakout = cassure avec continuation",
            "Volume élevé confirme le breakout",
            "Attention aux faux breakouts (fakeouts)",
            "Attendez la confirmation ou le retest"
        ],
        "quiz": []
    },
    (7, 7): {
        "title": "Exercice pratique",
        "video_url": "",
        "content": """
            <h3>📝 Exercice : Identifier les S/R sur Bitcoin</h3>
            
            <h4>Étape 1 : Préparation</h4>
            <p>Ouvrez BTC/USDT sur TradingView en timeframe Daily</p>
            
            <h4>Étape 2 : Identifier les Supports</h4>
            <ul>
                <li>Trouvez les 3 supports majeurs actuels</li>
                <li>Notez les niveaux de prix</li>
                <li>Comptez le nombre de touches</li>
            </ul>
            
            <h4>Étape 3 : Identifier les Résistances</h4>
            <ul>
                <li>Trouvez les 3 résistances majeures actuelles</li>
                <li>Notez les niveaux de prix</li>
                <li>Identifiez les anciens sommets</li>
            </ul>
            
            <h4>Étape 4 : Tracer une Ligne de Tendance</h4>
            <ul>
                <li>Identifiez la tendance actuelle</li>
                <li>Tracez la ligne de tendance appropriée</li>
            </ul>
            
            <h4>Étape 5 : Documentation</h4>
            <ul>
                <li>Notez vos observations dans votre journal</li>
                <li>Prenez un screenshot</li>
            </ul>
            
            <h3>💡 Questions à se Poser</h3>
            <ul>
                <li>Où sont les zones de forte réaction ?</li>
                <li>Quels niveaux ont été testés plusieurs fois ?</li>
                <li>Y a-t-il des niveaux psychologiques importants ?</li>
            </ul>
        """,
        "key_points": [
            "Pratiquez sur des graphiques réels",
            "Identifiez supports et résistances",
            "Notez vos observations",
            "Vérifiez sur plusieurs timeframes"
        ],
        "quiz": []
    },
}

# ============================================
# MODULE 8: Indicateurs Techniques
# ============================================
MODULE_8_LESSONS = {
    (8, 1): {
        "title": "Introduction aux indicateurs",
        "video_url": "",
        "content": """
            <h3>📊 Qu'est-ce qu'un Indicateur Technique ?</h3>
            <p>Un indicateur technique est un calcul mathématique basé sur le prix et/ou le volume qui aide à analyser le marché et prendre des décisions de trading.</p>
            
            <h3>📈 Catégories d'Indicateurs</h3>
            <ul>
                <li><strong>Indicateurs de tendance</strong> : Moyennes mobiles, MACD, ADX</li>
                <li><strong>Oscillateurs</strong> : RSI, Stochastique, CCI</li>
                <li><strong>Indicateurs de volatilité</strong> : Bollinger Bands, ATR</li>
                <li><strong>Indicateurs de volume</strong> : OBV, Volume Profile, VWAP</li>
            </ul>
            
            <h3>⚠️ Règles Importantes</h3>
            <ul>
                <li>Les indicateurs sont des <strong>OUTILS</strong>, pas des signaux magiques</li>
                <li>Ne surchargez pas vos graphiques : <strong>2-3 indicateurs maximum</strong></li>
                <li>Combinez indicateurs de <strong>différentes catégories</strong></li>
                <li>Confirmez toujours avec l'<strong>action du prix</strong></li>
                <li>Les indicateurs sont <strong>retardés</strong> (basés sur le passé)</li>
            </ul>
            
            <h3>💡 Conseil Pro</h3>
            <p>L'action du prix (price action) reste le meilleur indicateur. Les indicateurs techniques ne font que confirmer ce que le prix vous montre déjà.</p>
        """,
        "key_points": [
            "Indicateurs = outils d'aide à la décision, pas des signaux magiques",
            "4 catégories : tendance, oscillateurs, volatilité, volume",
            "Maximum 2-3 indicateurs sur votre graphique",
            "Toujours confirmer avec l'action du prix"
        ],
        "quiz": []
    },
    (8, 2): {
        "title": "Le RSI en détail",
        "video_url": "",
        "content": """
            <h3>📊 RSI : Relative Strength Index</h3>
            <p>Le RSI est un oscillateur qui mesure la vitesse et l'amplitude des mouvements de prix. Il oscille entre 0 et 100.</p>
            
            <h3>📈 Interprétation de Base</h3>
            <ul>
                <li><strong>RSI > 70</strong> : Zone de surachat (possible retournement baissier)</li>
                <li><strong>RSI < 30</strong> : Zone de survente (possible retournement haussier)</li>
                <li><strong>RSI = 50</strong> : Zone neutre</li>
            </ul>
            
            <h3>🔧 Paramètres</h3>
            <ul>
                <li>Période standard : <strong>14</strong></li>
                <li>Court terme : 7-9</li>
                <li>Long terme : 21-25</li>
            </ul>
            
            <h3>🔍 Utilisation Avancée</h3>
            <ul>
                <li><strong>Divergences</strong> : Prix et RSI vont dans des directions opposées</li>
                <li><strong>Support/Résistance sur RSI</strong> : Le RSI respecte aussi des niveaux</li>
                <li><strong>Failure Swings</strong> : Signaux de retournement</li>
            </ul>
            
            <h3>⚠️ Attention</h3>
            <p>En tendance forte, le RSI peut rester en zone de surachat ou survente pendant longtemps. Ne vendez pas uniquement parce que le RSI est à 80.</p>
        """,
        "key_points": [
            "RSI > 70 = surachat (attention, pas signal de vente automatique)",
            "RSI < 30 = survente (attention, pas signal d'achat automatique)",
            "Les divergences sont des signaux forts",
            "Peut rester en zone extrême en tendance forte"
        ],
        "quiz": []
    },
    (8, 3): {
        "title": "Divergences RSI",
        "video_url": "",
        "content": """
            <h3>🔄 Qu'est-ce qu'une Divergence ?</h3>
            <p>Une divergence se produit quand le prix et l'indicateur vont dans des directions opposées. C'est un signal de faiblesse de la tendance actuelle.</p>
            
            <h3>📈 Divergence Haussière (Bullish)</h3>
            <ul>
                <li>Prix fait des <strong>creux de plus en plus bas</strong></li>
                <li>RSI fait des <strong>creux de plus en plus hauts</strong></li>
                <li>Signal d'<strong>achat potentiel</strong></li>
                <li>Indique que la pression vendeuse s'affaiblit</li>
            </ul>
            
            <h3>📉 Divergence Baissière (Bearish)</h3>
            <ul>
                <li>Prix fait des <strong>sommets de plus en plus hauts</strong></li>
                <li>RSI fait des <strong>sommets de plus en plus bas</strong></li>
                <li>Signal de <strong>vente potentiel</strong></li>
                <li>Indique que la pression acheteuse s'affaiblit</li>
            </ul>
            
            <h3>💡 Conseils d'Utilisation</h3>
            <ul>
                <li>Plus fiable sur les <strong>grands timeframes</strong> (4H, Daily)</li>
                <li>Attendez une <strong>confirmation</strong> avant d'entrer</li>
                <li>Ne tradez pas contre la <strong>tendance principale</strong></li>
                <li>Combinez avec d'autres signaux (S/R, patterns)</li>
            </ul>
        """,
        "key_points": [
            "Divergence = prix et RSI en sens opposés",
            "Divergence haussière = signal d'achat potentiel",
            "Divergence baissière = signal de vente potentiel",
            "Plus fiable sur grands timeframes avec confirmation"
        ],
        "quiz": []
    },
    (8, 4): {
        "title": "Le MACD expliqué",
        "video_url": "",
        "content": """
            <h3>📊 MACD : Moving Average Convergence Divergence</h3>
            <p>Le MACD est un indicateur de tendance et de momentum basé sur la différence entre deux moyennes mobiles exponentielles.</p>
            
            <h3>🔧 Composants du MACD</h3>
            <ul>
                <li><strong>Ligne MACD</strong> : EMA 12 - EMA 26</li>
                <li><strong>Ligne Signal</strong> : EMA 9 de la ligne MACD</li>
                <li><strong>Histogramme</strong> : Différence entre MACD et Signal</li>
            </ul>
            
            <h3>📈 Signaux de Base</h3>
            <ul>
                <li><strong>Croisement haussier</strong> : MACD croise Signal vers le haut → Achat</li>
                <li><strong>Croisement baissier</strong> : MACD croise Signal vers le bas → Vente</li>
                <li><strong>Croisement de zéro</strong> : Confirmation de tendance</li>
            </ul>
            
            <h3>💡 Utilisation</h3>
            <ul>
                <li>Confirmer la tendance</li>
                <li>Identifier les points d'entrée/sortie</li>
                <li>Détecter les divergences (comme le RSI)</li>
            </ul>
        """,
        "key_points": [
            "MACD = indicateur de tendance et momentum",
            "Croisement haussier = signal d'achat",
            "Croisement baissier = signal de vente",
            "Utilisez les divergences pour anticiper les retournements"
        ],
        "quiz": []
    },
    (8, 5): {
        "title": "Signaux MACD",
        "video_url": "",
        "content": """
            <h3>🎯 Signaux de Trading avec le MACD</h3>
            
            <h4>1. Croisement des Lignes</h4>
            <ul>
                <li>MACD croise Signal vers le haut = <strong>Signal d'achat</strong></li>
                <li>MACD croise Signal vers le bas = <strong>Signal de vente</strong></li>
                <li>Plus fiable quand il se produit loin de la ligne zéro</li>
            </ul>
            
            <h4>2. Croisement de la Ligne Zéro</h4>
            <ul>
                <li>MACD passe au-dessus de 0 = <strong>Tendance haussière confirmée</strong></li>
                <li>MACD passe en dessous de 0 = <strong>Tendance baissière confirmée</strong></li>
            </ul>
            
            <h4>3. Analyse de l'Histogramme</h4>
            <ul>
                <li>Barres croissantes = <strong>Momentum en augmentation</strong></li>
                <li>Barres décroissantes = <strong>Momentum en diminution</strong></li>
                <li>Changement de couleur = Possible retournement</li>
            </ul>
            
            <h3>⚠️ Limites du MACD</h3>
            <ul>
                <li><strong>Indicateur retardé</strong> (lagging) : Basé sur des moyennes mobiles</li>
                <li><strong>Faux signaux</strong> en période de range/consolidation</li>
                <li>À combiner avec d'autres outils d'analyse</li>
            </ul>
        """,
        "key_points": [
            "Croisement des lignes = signal principal",
            "Croisement de zéro = confirmation de tendance",
            "Histogramme montre le momentum",
            "Indicateur retardé - attention aux faux signaux en range"
        ],
        "quiz": []
    },
    (8, 6): {
        "title": "Bollinger Bands",
        "video_url": "",
        "content": """
            <h3>📊 Bandes de Bollinger</h3>
            <p>Les Bandes de Bollinger sont un indicateur de volatilité composé de 3 lignes qui s'adaptent aux conditions du marché.</p>
            
            <h3>🔧 Composants</h3>
            <ul>
                <li><strong>Bande médiane</strong> : SMA 20 (moyenne mobile simple)</li>
                <li><strong>Bande supérieure</strong> : SMA + 2 écarts-types</li>
                <li><strong>Bande inférieure</strong> : SMA - 2 écarts-types</li>
            </ul>
            
            <h3>📈 Interprétation</h3>
            <ul>
                <li><strong>Bandes écartées</strong> : Forte volatilité</li>
                <li><strong>Bandes resserrées (squeeze)</strong> : Faible volatilité, mouvement à venir</li>
                <li><strong>Prix touche la bande supérieure</strong> : Possible surachat</li>
                <li><strong>Prix touche la bande inférieure</strong> : Possible survente</li>
            </ul>
            
            <h3>💡 Stratégies</h3>
            <ul>
                <li><strong>Mean Reversion</strong> : Achat sur bande inférieure, vente sur bande supérieure (en range)</li>
                <li><strong>Breakout</strong> : Entrée après un squeeze quand le prix casse une bande</li>
                <li><strong>Walking the bands</strong> : En tendance forte, le prix peut "marcher" le long d'une bande</li>
            </ul>
        """,
        "key_points": [
            "3 bandes : médiane (SMA 20), supérieure et inférieure",
            "Squeeze = faible volatilité, mouvement à venir",
            "Bandes écartées = forte volatilité",
            "Utilisez en combinaison avec d'autres indicateurs"
        ],
        "quiz": []
    },
    (8, 7): {
        "title": "Moyennes mobiles",
        "video_url": "",
        "content": """
            <h3>📊 Les Moyennes Mobiles</h3>
            <p>Les moyennes mobiles sont des indicateurs de tendance qui lissent le prix sur une période donnée.</p>
            
            <h3>📈 Types de Moyennes Mobiles</h3>
            <ul>
                <li><strong>SMA (Simple)</strong> : Moyenne arithmétique simple de N périodes</li>
                <li><strong>EMA (Exponentielle)</strong> : Plus de poids aux prix récents, plus réactive</li>
                <li><strong>WMA (Pondérée)</strong> : Poids linéaire décroissant</li>
            </ul>
            
            <h3>🔢 Périodes Courantes</h3>
            <ul>
                <li><strong>MA 20</strong> : Court terme, tendance récente</li>
                <li><strong>MA 50</strong> : Moyen terme</li>
                <li><strong>MA 200</strong> : Long terme, tendance majeure</li>
            </ul>
            
            <h3>🎯 Signaux Importants</h3>
            <ul>
                <li><strong>Golden Cross</strong> : MA 50 croise MA 200 vers le haut → Signal haussier majeur</li>
                <li><strong>Death Cross</strong> : MA 50 croise MA 200 vers le bas → Signal baissier majeur</li>
                <li><strong>Prix au-dessus de la MA</strong> = tendance haussière</li>
                <li><strong>Prix en dessous de la MA</strong> = tendance baissière</li>
            </ul>
        """,
        "key_points": [
            "SMA = moyenne simple, EMA = plus réactive",
            "MA 20, 50, 200 sont les plus utilisées",
            "Golden Cross = signal haussier (MA50 > MA200)",
            "Death Cross = signal baissier (MA50 < MA200)"
        ],
        "quiz": []
    },
    (8, 8): {
        "title": "Stochastique",
        "video_url": "",
        "content": """
            <h3>📊 Oscillateur Stochastique</h3>
            <p>Le Stochastique compare le prix de clôture actuel à la fourchette de prix sur une période donnée.</p>
            
            <h3>🔧 Composants</h3>
            <ul>
                <li><strong>%K</strong> : Ligne rapide (principale)</li>
                <li><strong>%D</strong> : Ligne lente (signal) - moyenne de %K</li>
            </ul>
            
            <h3>📈 Interprétation</h3>
            <ul>
                <li><strong>> 80</strong> : Zone de surachat</li>
                <li><strong>< 20</strong> : Zone de survente</li>
            </ul>
            
            <h3>🎯 Signaux de Trading</h3>
            <ul>
                <li>%K croise %D vers le haut en zone de survente = <strong>Achat</strong></li>
                <li>%K croise %D vers le bas en zone de surachat = <strong>Vente</strong></li>
                <li>Divergences possibles (comme RSI)</li>
            </ul>
            
            <h3>💡 Différence avec le RSI</h3>
            <ul>
                <li>Stochastique est plus <strong>réactif</strong> (plus de signaux)</li>
                <li>RSI est plus <strong>lissé</strong> (moins de faux signaux)</li>
                <li>Utilisez les deux pour confirmation</li>
            </ul>
        """,
        "key_points": [
            "Stochastique = oscillateur de momentum",
            "> 80 = surachat, < 20 = survente",
            "Croisements %K/%D = signaux de trading",
            "Plus réactif que le RSI"
        ],
        "quiz": []
    },
    (8, 9): {
        "title": "Combiner les indicateurs",
        "video_url": "",
        "content": """
            <h3>🔗 La Confluence : Clé du Succès</h3>
            <p>La confluence consiste à combiner plusieurs indicateurs et outils pour augmenter la fiabilité des signaux.</p>
            
            <h3>📊 Combinaisons Efficaces</h3>
            <ul>
                <li><strong>Tendance + Oscillateur</strong> : MA + RSI</li>
                <li><strong>Tendance + Volatilité</strong> : MACD + Bollinger Bands</li>
                <li><strong>Multiple confirmation</strong> : RSI + MACD + Support/Résistance</li>
            </ul>
            
            <h3>✅ Exemple de Setup Complet</h3>
            <ol>
                <li>Tendance haussière confirmée (prix > MA 200)</li>
                <li>RSI en zone de survente (< 30)</li>
                <li>Prix sur un support majeur</li>
                <li>Chandelier de retournement (marteau)</li>
                <li>MACD qui commence à remonter</li>
            </ol>
            <p>→ Forte confluence = Signal d'achat de haute qualité</p>
            
            <h3>⚠️ Erreurs à Éviter</h3>
            <ul>
                <li><strong>Trop d'indicateurs</strong> = paralysie d'analyse</li>
                <li><strong>Indicateurs redondants</strong> (RSI + Stochastique = même info)</li>
                <li><strong>Ignorer l'action du prix</strong></li>
            </ul>
        """,
        "key_points": [
            "Confluence = plusieurs signaux alignés",
            "Combinez indicateurs de différentes catégories",
            "Maximum 2-3 indicateurs",
            "L'action du prix reste prioritaire"
        ],
        "quiz": []
    },
    (8, 10): {
        "title": "Exercice pratique",
        "video_url": "",
        "content": """
            <h3>📝 Exercice : Analyser BTC avec les Indicateurs</h3>
            
            <h4>Configuration</h4>
            <ul>
                <li>Ouvrez BTC/USDT en timeframe 4H</li>
                <li>Ajoutez : RSI (14), MACD, MA 50 et MA 200</li>
            </ul>
            
            <h4>Questions à Répondre</h4>
            <ol>
                <li>Quelle est la tendance selon les moyennes mobiles ?</li>
                <li>Le RSI est-il en surachat, survente ou neutre ?</li>
                <li>Le MACD montre-t-il un signal (croisement) ?</li>
                <li>Y a-t-il des divergences visibles ?</li>
                <li>Les indicateurs sont-ils en confluence ?</li>
            </ol>
            
            <h4>Conclusion</h4>
            <p>Basé sur votre analyse multi-indicateurs, quel serait votre biais ?</p>
            <ul>
                <li>Haussier (achat)</li>
                <li>Baissier (vente/short)</li>
                <li>Neutre (pas de trade)</li>
            </ul>
        """,
        "key_points": [
            "Pratiquez l'analyse multi-indicateurs",
            "Cherchez la confluence des signaux",
            "Notez vos observations dans votre journal",
            "Développez votre propre système"
        ],
        "quiz": []
    },
    (8, 11): {
        "title": "Exercice avancé",
        "video_url": "",
        "content": """
            <h3>📝 Exercice Avancé : Créer votre Setup de Trading</h3>
            
            <h4>Objectif</h4>
            <p>Créer un setup de trading complet utilisant les indicateurs appris.</p>
            
            <h4>Étapes</h4>
            <ol>
                <li>Choisissez 2-3 indicateurs de catégories différentes</li>
                <li>Définissez les conditions d'entrée précises</li>
                <li>Définissez le placement du stop loss</li>
                <li>Définissez le(s) take profit</li>
                <li>Testez sur l'historique (backtest)</li>
            </ol>
            
            <h4>Exemple de Setup</h4>
            <ul>
                <li><strong>Indicateurs</strong> : RSI + MACD + MA 200</li>
                <li><strong>Entrée Long</strong> : RSI < 30 + Prix sur support + Prix > MA 200 + MACD croisement haussier</li>
                <li><strong>Stop</strong> : Sous le support (1-2%)</li>
                <li><strong>TP1</strong> : R:R 1:1 (50% de la position)</li>
                <li><strong>TP2</strong> : R:R 1:2 (reste de la position)</li>
            </ul>
            
            <h4>Documentation</h4>
            <p>Notez votre setup dans votre journal et suivez ses performances.</p>
        """,
        "key_points": [
            "Créez votre propre système personnalisé",
            "Définissez des règles claires et précises",
            "Testez avant de trader en réel",
            "Documentez tout dans votre journal"
        ],
        "quiz": []
    },
}

# Fonction pour obtenir le contenu étendu
def get_extended_content(module_id: int, lesson_id: int) -> dict:
    """Récupère le contenu étendu pour les modules 4-8."""
    key = (module_id, lesson_id)
    
    if module_id == 4 and key in MODULE_4_LESSONS:
        return MODULE_4_LESSONS[key]
    elif module_id == 5 and key in MODULE_5_LESSONS:
        return MODULE_5_LESSONS[key]
    elif module_id == 6 and key in MODULE_6_LESSONS:
        return MODULE_6_LESSONS[key]
    elif module_id == 7 and key in MODULE_7_LESSONS:
        return MODULE_7_LESSONS[key]
    elif module_id == 8 and key in MODULE_8_LESSONS:
        return MODULE_8_LESSONS[key]
    
    return None