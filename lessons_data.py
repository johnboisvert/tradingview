# ============================================================================
# 🎓 CRYPTO ACADEMY - SYSTÈME COMPLET
# ============================================================================

# DONNÉES DES LEÇONS (10 premières complètes, 44 templates)

LESSONS_DATA = {
    # ========== LEÇON 1 ==========
    1: {
        "id": 1,
        "title": "C'est quoi une cryptomonnaie ?",
        "parcours": "bases",
        "module": 1,
        "duration_min": 10,
        "xp_reward": 100,
        "content": """
        <h2>🪙 Bienvenue dans l'univers des cryptomonnaies !</h2>
        
        <h3>📜 L'Histoire de l'Argent</h3>
        <p>Depuis des millénaires, l'humanité utilise de l'argent pour échanger des biens et services. D'abord le troc, puis les coquillages, les métaux précieux (or, argent), et finalement le papier-monnaie que nous connaissons aujourd'hui.</p>
        
        <p><strong>Mais il y a un problème :</strong> Les gouvernements et les banques centrales contrôlent totalement cet argent. Ils peuvent en imprimer autant qu'ils veulent, causant de l'inflation. Ils peuvent bloquer tes comptes. Tu n'as pas vraiment le contrôle.</p>
        
        <h3>⚡ Bitcoin : La Révolution de 2009</h3>
        <p>Le 3 janvier 2009, une personne (ou un groupe) sous le pseudonyme <strong>Satoshi Nakamoto</strong> a créé Bitcoin, la première cryptomonnaie décentralisée au monde.</p>
        
        <p>Bitcoin a changé les règles du jeu :</p>
        <ul>
            <li>✅ <strong>Personne ne le contrôle</strong> - Pas de gouvernement, pas de banque</li>
            <li>✅ <strong>Supply limitée</strong> - Maximum 21 millions de BTC (vs monnaie infinie)</li>
            <li>✅ <strong>Transparent</strong> - Toutes les transactions sont publiques</li>
            <li>✅ <strong>Sécurisé</strong> - Cryptographie militaire</li>
            <li>✅ <strong>Tu es ta propre banque</strong> - Tu contrôles 100% de ton argent</li>
        </ul>
        
        <h3>🆚 Crypto vs Monnaie Traditionnelle</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: rgba(99, 102, 241, 0.2);">
                <th style="padding: 12px; border: 1px solid #334155;">Caractéristique</th>
                <th style="padding: 12px; border: 1px solid #334155;">Monnaie Traditionnelle (€, $)</th>
                <th style="padding: 12px; border: 1px solid #334155;">Cryptomonnaie (BTC, ETH)</th>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #334155;"><strong>Contrôle</strong></td>
                <td style="padding: 10px; border: 1px solid #334155;">Banque centrale</td>
                <td style="padding: 10px; border: 1px solid #334155;">Décentralisé (toi)</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #334155;"><strong>Supply</strong></td>
                <td style="padding: 10px; border: 1px solid #334155;">Illimité (impression)</td>
                <td style="padding: 10px; border: 1px solid #334155;">Limité (21M BTC)</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #334155;"><strong>Transparence</strong></td>
                <td style="padding: 10px; border: 1px solid #334155;">Opaque</td>
                <td style="padding: 10px; border: 1px solid #334155;">100% transparent</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #334155;"><strong>Frais transfert</strong></td>
                <td style="padding: 10px; border: 1px solid #334155;">Élevés (Western Union)</td>
                <td style="padding: 10px; border: 1px solid #334155;">Faibles</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #334155;"><strong>Censure</strong></td>
                <td style="padding: 10px; border: 1px solid #334155;">Possible (gel de compte)</td>
                <td style="padding: 10px; border: 1px solid #334155;">Impossible</td>
            </tr>
        </table>
        
        <h3>💡 Exemple Concret</h3>
        <p>Imagine que tu veuilles envoyer 1000€ à ton cousin au Mexique :</p>
        <ul>
            <li>🏦 <strong>Avec une banque :</strong> Frais de 50€, délai de 3-5 jours, taux de change défavorable</li>
            <li>⚡ <strong>Avec Bitcoin :</strong> Frais de 2€, transaction en 10-30 minutes, taux de marché</li>
        </ul>
        
        <h3>🎯 Récapitulatif</h3>
        <p>Les cryptomonnaies sont :</p>
        <ol>
            <li>De l'argent numérique décentralisé</li>
            <li>Que personne ne contrôle (pas de banque centrale)</li>
            <li>Sécurisé par la cryptographie</li>
            <li>Transparent (blockchain publique)</li>
            <li>Limité en quantité (pas d'inflation infinie)</li>
        </ol>
        
        <div style="background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #10b981; margin-top: 25px;">
            <p><strong>💎 Citation de Satoshi Nakamoto :</strong></p>
            <p style="font-style: italic;">"Le problème fondamental avec la monnaie conventionnelle est toute la confiance nécessaire pour la faire fonctionner. On doit faire confiance à la banque centrale pour ne pas dévaluer la monnaie, mais l'histoire des monnaies fiduciaires est pleine de violations de cette confiance."</p>
        </div>
        """,
        "quiz": [
            {
                "question": "Qui a créé Bitcoin ?",
                "options": ["Satoshi Nakamoto", "Vitalik Buterin", "Elon Musk", "Mark Zuckerberg"],
                "correct": 0,
                "explanation": "Satoshi Nakamoto est le pseudonyme du créateur (ou groupe de créateurs) de Bitcoin. Son identité réelle reste inconnue à ce jour."
            },
            {
                "question": "En quelle année Bitcoin a-t-il été créé ?",
                "options": ["2007", "2008", "2009", "2010"],
                "correct": 2,
                "explanation": "Bitcoin a été lancé le 3 janvier 2009 avec le minage du premier bloc (Genesis Block)."
            },
            {
                "question": "Quelle est la supply maximale de Bitcoin ?",
                "options": ["10 millions", "21 millions", "100 millions", "Illimité"],
                "correct": 1,
                "explanation": "Bitcoin a une supply maximale fixée à 21 millions de BTC. Cette limite est inscrite dans le code et ne peut pas être changée."
            },
            {
                "question": "Qui contrôle Bitcoin ?",
                "options": ["Le gouvernement américain", "Les banques", "Personne (décentralisé)", "Satoshi Nakamoto"],
                "correct": 2,
                "explanation": "Bitcoin est complètement décentralisé. Personne ne le contrôle, ni gouvernement, ni entreprise, ni individu."
            },
            {
                "question": "Les transactions Bitcoin sont-elles publiques ?",
                "options": ["Oui, 100% transparentes", "Non, totalement privées", "Seulement pour les banques", "Ça dépend"],
                "correct": 0,
                "explanation": "Toutes les transactions Bitcoin sont publiques et consultables sur la blockchain. Cependant, les adresses ne sont pas directement liées à des identités réelles."
            }
        ]
    },
    
    # ========== LEÇON 2 ==========
    2: {
        "id": 2,
        "title": "Comment fonctionne la blockchain ?",
        "parcours": "bases",
        "module": 1,
        "duration_min": 12,
        "xp_reward": 100,
        "content": """
        <h2>⛓️ La Blockchain expliquée simplement</h2>
        
        <h3>🤔 C'est quoi une blockchain ?</h3>
        <p>Imagine un <strong>grand livre comptable</strong> que tout le monde peut voir, mais que <strong>personne ne peut modifier</strong>. Chaque page de ce livre est un "bloc", et toutes les pages sont liées ensemble dans une "chaîne" → d'où le nom "blockchain" (chaîne de blocs).</p>
        
        <h3>📚 Exemple Concret : Le Livre de la Classe</h3>
        <p>Imagine une classe de 30 élèves. Au lieu d'avoir UN seul cahier chez le prof, <strong>chaque élève a une copie du cahier</strong>.</p>
        
        <p>Quand quelqu'un veut écrire quelque chose (ex: "Alice donne 5€ à Bob") :</p>
        <ol>
            <li>📢 L'élève annonce à toute la classe : "Je veux écrire cette transaction"</li>
            <li>✅ La majorité vérifie que c'est valide (Alice a bien 5€)</li>
            <li>✍️ Si validé, TOUS les élèves écrivent dans leur cahier en même temps</li>
            <li>🔒 Une fois écrit, c'est permanent (impossible d'effacer)</li>
        </ol>
        
        <p><strong>Résultat :</strong> Pour tricher, il faudrait modifier les 30 cahiers en même temps → impossible !</p>
        
        <h3>🧱 Anatomie d'un Bloc</h3>
        <p>Chaque bloc de la blockchain contient :</p>
        <ul>
            <li>📝 <strong>Les données</strong> (transactions : "Alice → Bob : 1 BTC")</li>
            <li>🔢 <strong>Un hash</strong> (empreinte numérique unique, comme une empreinte digitale)</li>
            <li>🔗 <strong>Le hash du bloc précédent</strong> (c'est ce qui crée la "chaîne")</li>
            <li>⏰ <strong>Un timestamp</strong> (horodatage)</li>
        </ul>
        
        <div style="background: rgba(30, 41, 59, 0.8); padding: 20px; border-radius: 12px; margin: 20px 0; font-family: monospace;">
            <p><strong>Bloc #1000</strong></p>
            <p>Hash: 0000a4b3c9d8...</p>
            <p>Hash précédent: 0000f2e1b7a6...</p>
            <p>Transactions:</p>
            <p>- Alice → Bob: 0.5 BTC</p>
            <p>- Charlie → David: 2.1 BTC</p>
            <p>Timestamp: 2024-12-12 14:35:22</p>
        </div>
        
        <h3>🔐 Pourquoi c'est sécurisé ?</h3>
        <p>Si quelqu'un essaie de modifier un ancien bloc :</p>
        <ol>
            <li>Le hash du bloc change</li>
            <li>Le bloc suivant (qui contient l'ancien hash) devient invalide</li>
            <li>Tous les blocs après deviennent invalides</li>
            <li>Il faudrait recalculer TOUS les blocs (impossible avec la puissance actuelle)</li>
        </ol>
        
        <p>Plus la blockchain est longue, plus elle est sécurisée ! 🛡️</p>
        
        <h3>⚙️ Décentralisation : Le Superpouvoir</h3>
        <p>La blockchain Bitcoin n'est pas stockée sur UN seul serveur, mais sur des <strong>milliers d'ordinateurs</strong> à travers le monde (appelés "nœuds").</p>
        
        <p><strong>Avantages :</strong></p>
        <ul>
            <li>✅ Impossible de pirater (il faudrait pirater 51% des nœuds simultanément)</li>
            <li>✅ Impossible de censurer (pas de point central à attaquer)</li>
            <li>✅ Toujours en ligne (même si 1000 nœuds tombent, les autres continuent)</li>
            <li>✅ Transparent (n'importe qui peut vérifier)</li>
        </ul>
        
        <h3>⛏️ Le Minage : Qui Ajoute les Blocs ?</h3>
        <p>Les "mineurs" sont des ordinateurs puissants qui :</p>
        <ol>
            <li>Collectent les transactions en attente</li>
            <li>Les regroupent dans un nouveau bloc</li>
            <li>Résolvent un puzzle mathématique complexe (Proof of Work)</li>
            <li>Le premier à résoudre le puzzle ajoute son bloc à la chaîne</li>
            <li>Il reçoit une récompense en BTC (actuellement 6.25 BTC par bloc)</li>
        </ol>
        
        <p>⏱️ Un nouveau bloc Bitcoin est miné toutes les <strong>~10 minutes</strong>.</p>
        
        <h3>🎯 Récapitulatif</h3>
        <p>La blockchain est :</p>
        <ol>
            <li>Une base de données décentralisée</li>
            <li>Composée de blocs liés entre eux</li>
            <li>Immuable (impossible à modifier)</li>
            <li>Transparente (tout le monde peut voir)</li>
            <li>Sécurisée par cryptographie</li>
        </ol>
        
        <div style="background: rgba(99, 102, 241, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #6366f1; margin-top: 25px;">
            <p><strong>💡 Le saviez-vous ?</strong></p>
            <p>La blockchain Bitcoin pèse actuellement plus de 500 GB de données. Elle contient TOUTES les transactions Bitcoin depuis le 3 janvier 2009 !</p>
        </div>
        """,
        "quiz": [
            {
                "question": "Qu'est-ce qu'une blockchain ?",
                "options": [
                    "Une base de données centralisée",
                    "Une chaîne de blocs liés contenant des données",
                    "Un type de cryptomonnaie",
                    "Un wallet pour stocker des cryptos"
                ],
                "correct": 1,
                "explanation": "La blockchain est littéralement une 'chaîne de blocs' où chaque bloc contient des données et est lié au bloc précédent."
            },
            {
                "question": "Peut-on modifier un ancien bloc dans la blockchain ?",
                "options": [
                    "Oui, facilement",
                    "Oui, si on est admin",
                    "Non, c'est quasi impossible",
                    "Ça dépend de la crypto"
                ],
                "correct": 2,
                "explanation": "Modifier un bloc ancien invaliderait tous les blocs suivants. Il faudrait recalculer toute la chaîne, ce qui est pratiquement impossible."
            },
            {
                "question": "Combien de temps faut-il pour miner un bloc Bitcoin ?",
                "options": ["1 minute", "10 minutes", "1 heure", "24 heures"],
                "correct": 1,
                "explanation": "En moyenne, un nouveau bloc Bitcoin est miné toutes les 10 minutes. C'est ajusté automatiquement par la difficulté."
            },
            {
                "question": "Qu'est-ce qu'un 'nœud' (node) dans une blockchain ?",
                "options": [
                    "Un bug dans le code",
                    "Un ordinateur qui stocke une copie de la blockchain",
                    "Un type de transaction",
                    "Un wallet hardware"
                ],
                "correct": 1,
                "explanation": "Un nœud est un ordinateur qui maintient une copie complète de la blockchain et participe à la validation des transactions."
            },
            {
                "question": "Quelle est la récompense actuelle pour miner un bloc Bitcoin ?",
                "options": ["1 BTC", "6.25 BTC", "12.5 BTC", "50 BTC"],
                "correct": 1,
                "explanation": "Après le halving de 2020, la récompense est de 6.25 BTC par bloc. Le prochain halving (2024) la réduira à 3.125 BTC."
            }
        ]
    },
    
    # ========== LEÇON 3 ==========
    3: {
        "id": 3,
        "title": "Bitcoin en profondeur",
        "parcours": "bases",
        "module": 1,
        "duration_min": 15,
        "xp_reward": 100,
        "content": """
        <h2>₿ Bitcoin : L'Or Numérique</h2>
        
        <h3>👤 Le Mystère Satoshi Nakamoto</h3>
        <p>Le 31 octobre 2008, un document de 9 pages appelé le <strong>Bitcoin Whitepaper</strong> est publié par Satoshi Nakamoto sur une mailing list de cryptographie.</p>
        
        <p>Titre : <em>"Bitcoin: A Peer-to-Peer Electronic Cash System"</em></p>
        
        <p><strong>Qui est Satoshi ?</strong></p>
        <ul>
            <li>❓ Personne ne sait ! Ça pourrait être une personne ou un groupe</li>
            <li>💬 Il a communiqué jusqu'en 2011, puis a disparu</li>
            <li>💰 Il possède environ 1 million de BTC (~60 milliards $) qui n'ont jamais bougé</li>
            <li>🏆 Candidats possibles : Hal Finney, Nick Szabo, Dorian Nakamoto, Craig Wright (non prouvé)</li>
        </ul>
        
        <h3>📄 Le Whitepaper Expliqué Simplement</h3>
        <p>Le whitepaper décrit un système de paiement électronique qui permet :</p>
        <ol>
            <li>Des paiements directs de personne à personne (peer-to-peer)</li>
            <li>Sans passer par une banque ou un intermédiaire</li>
            <li>En utilisant la preuve de travail (Proof of Work) pour sécuriser le réseau</li>
            <li>Avec un système de consensus décentralisé</li>
        </ol>
        
        <h3>💎 Supply Limitée : 21 Millions</h3>
        <p>Une des caractéristiques les plus importantes de Bitcoin : <strong>il n'y aura JAMAIS plus de 21 millions de BTC</strong>.</p>
        
        <p><strong>Pourquoi c'est révolutionnaire ?</strong></p>
        <ul>
            <li>💵 Le dollar : supply illimitée (la Fed peut imprimer autant qu'elle veut)</li>
            <li>🪙 L'or : supply limitée mais on en découvre encore</li>
            <li>₿ Bitcoin : supply ABSOLUMENT limitée à 21M, inscrit dans le code</li>
        </ul>
        
        <p>Actuellement (décembre 2024) : <strong>~19.5 millions de BTC</strong> ont été minés</p>
        <p>Dernier BTC sera miné en : <strong>~2140</strong></p>
        
        <h3>⚡ Le Halving : Événement Majeur</h3>
        <p>Tous les 4 ans environ (210,000 blocs), la récompense des mineurs est <strong>divisée par 2</strong>.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: rgba(99, 102, 241, 0.2);">
                <th style="padding: 12px; border: 1px solid #334155;">Année</th>
                <th style="padding: 12px; border: 1px solid #334155;">Récompense par bloc</th>
                <th style="padding: 12px; border: 1px solid #334155;">Prix BTC</th>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #334155;">2009</td>
                <td style="padding: 10px; border: 1px solid #334155;">50 BTC</td>
                <td style="padding: 10px; border: 1px solid #334155;">$0.001</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #334155;">2012 (Halving 1)</td>
                <td style="padding: 10px; border: 1px solid #334155;">25 BTC</td>
                <td style="padding: 10px; border: 1px solid #334155;">$12</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #334155;">2016 (Halving 2)</td>
                <td style="padding: 10px; border: 1px solid #334155;">12.5 BTC</td>
                <td style="padding: 10px; border: 1px solid #334155;">$650</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #334155;">2020 (Halving 3)</td>
                <td style="padding: 10px; border: 1px solid #334155;">6.25 BTC</td>
                <td style="padding: 10px; border: 1px solid #334155;">$8,600</td>
            </tr>
            <tr style="background: rgba(16, 185, 129, 0.1);">
                <td style="padding: 10px; border: 1px solid #334155;"><strong>2024 (Halving 4)</strong></td>
                <td style="padding: 10px; border: 1px solid #334155;"><strong>3.125 BTC</strong></td>
                <td style="padding: 10px; border: 1px solid #334155;"><strong>$40,000+</strong></td>
            </tr>
        </table>
        
        <p><strong>Pattern observé :</strong> Après chaque halving, le prix augmente dans les 12-18 mois suivants (mais rien n'est garanti !)</p>
        
        <h3>🔄 Le Cycle de 4 Ans</h3>
        <p>Bitcoin semble suivre un cycle prévisible :</p>
        <ol>
            <li><strong>Année 1 (post-halving) :</strong> Accumulation silencieuse</li>
            <li><strong>Année 2 :</strong> Bull run, nouveau ATH</li>
            <li><strong>Année 3 :</strong> Correction, bear market</li>
            <li><strong>Année 4 :</strong> Accumulation, préparation halving</li>
        </ol>
        
        <h3>🌍 Cas d'Usage de Bitcoin</h3>
        <p><strong>1. Réserve de valeur ("Or Numérique")</strong></p>
        <ul>
            <li>Protection contre l'inflation</li>
            <li>Diversification de portfolio</li>
            <li>Hedge contre instabilité économique</li>
        </ul>
        
        <p><strong>2. Transferts internationaux</strong></p>
        <ul>
            <li>Envoyer de l'argent partout dans le monde en minutes</li>
            <li>Frais beaucoup plus bas que Western Union</li>
            <li>Pas de limites géographiques</li>
        </ul>
        
        <p><strong>3. Protection contre la censure</strong></p>
        <ul>
            <li>Personne ne peut te bloquer</li>
            <li>Pas de gel de compte possible</li>
            <li>Utile dans pays avec gouvernements autoritaires</li>
        </ul>
        
        <h3>⚠️ Les Critiques de Bitcoin</h3>
        <p>Soyons honnêtes, Bitcoin a des défauts :</p>
        <ul>
            <li>🔋 <strong>Consommation énergétique</strong> : Le minage consomme beaucoup d'électricité</li>
            <li>⏱️ <strong>Lenteur</strong> : ~7 transactions/seconde (vs Visa: 24,000/sec)</li>
            <li>💸 <strong>Frais variables</strong> : Peuvent être élevés en période de congestion</li>
            <li>📉 <strong>Volatilité</strong> : Le prix peut varier de 20% en une journée</li>
        </ul>
        
        <p>Cependant, des solutions existent : Lightning Network pour la vitesse, mining vert pour l'énergie.</p>
        
        <h3>🎯 Récapitulatif</h3>
        <ul>
            <li>Satoshi Nakamoto = créateur mystérieux de Bitcoin</li>
            <li>Supply limitée à 21 millions de BTC</li>
            <li>Halving tous les 4 ans = récompense divisée par 2</li>
            <li>Cycle de 4 ans observable</li>
            <li>Cas d'usage : réserve de valeur, transferts, protection censure</li>
        </ul>
        
        <div style="background: rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #ef4444; margin-top: 25px;">
            <p><strong>⚠️ Important :</strong></p>
            <p>Bitcoin est volatil et spéculatif. N'investis jamais plus que ce que tu peux te permettre de perdre. Ce n'est pas un conseil financier, juste de l'éducation !</p>
        </div>
        """,
        "quiz": [
            {
                "question": "Combien y aura-t-il de Bitcoin au maximum ?",
                "options": ["10 millions", "21 millions", "100 millions", "Illimité"],
                "correct": 1,
                "explanation": "Bitcoin a une supply maximale fixée à 21 millions de BTC, inscrite dans le code source."
            },
            {
                "question": "Qu'est-ce qu'un halving ?",
                "options": [
                    "Quand le prix double",
                    "Quand la récompense des mineurs est divisée par 2",
                    "Quand un bloc est divisé",
                    "Quand Bitcoin se sépare en 2"
                ],
                "correct": 1,
                "explanation": "Le halving réduit de moitié la récompense que reçoivent les mineurs pour chaque bloc validé."
            },
            {
                "question": "À quelle fréquence se produit un halving ?",
                "options": ["Tous les ans", "Tous les 2 ans", "Tous les 4 ans", "Tous les 10 ans"],
                "correct": 2,
                "explanation": "Un halving se produit environ tous les 4 ans (tous les 210,000 blocs)."
            },
            {
                "question": "Quand le dernier Bitcoin sera-t-il miné ?",
                "options": ["2024", "2050", "2100", "2140"],
                "correct": 3,
                "explanation": "Le dernier Bitcoin sera miné vers l'année 2140, selon le rythme actuel de minage et les halvings."
            },
            {
                "question": "Quelle était la récompense initiale par bloc en 2009 ?",
                "options": ["10 BTC", "25 BTC", "50 BTC", "100 BTC"],
                "correct": 2,
                "explanation": "En 2009, les mineurs recevaient 50 BTC par bloc. Après 3 halvings, nous sommes maintenant à 6.25 BTC."
            },
            {
                "question": "Qui est Satoshi Nakamoto ?",
                "options": [
                    "Le PDG de Bitcoin Inc.",
                    "Un développeur japonais",
                    "Identité inconnue",
                    "Elon Musk"
                ],
                "correct": 2,
                "explanation": "L'identité de Satoshi Nakamoto reste un mystère. Personne ne sait s'il s'agit d'une personne ou d'un groupe."
            },
            {
                "question": "Combien de BTC possède approximativement Satoshi ?",
                "options": ["10,000 BTC", "100,000 BTC", "1 million BTC", "10 millions BTC"],
                "correct": 2,
                "explanation": "On estime que Satoshi possède environ 1 million de BTC qui n'ont jamais bougé depuis leur minage."
            },
            {
                "question": "Quel document a introduit Bitcoin au monde ?",
                "options": ["Le Bitcoin Manifesto", "Le Whitepaper Bitcoin", "Le Code Bitcoin", "Le Livre Bitcoin"],
                "correct": 1,
                "explanation": "Le Bitcoin Whitepaper, publié le 31 octobre 2008, décrit le système Bitcoin en détail."
            }
        ]
    },
    
    # Templates pour les 51 autres leçons (structure identique)
    # Les contenus complets seront générés par l'AI ou ajoutés progressivement
    
    # Leçons 4-18: Les Bases du Crypto (templates)
    4: {"id": 4, "title": "Ethereum et les Smart Contracts", "parcours": "bases", "module": 1, "duration_min": 12, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    5: {"id": 5, "title": "Les Altcoins", "parcours": "bases", "module": 1, "duration_min": 10, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    6: {"id": 6, "title": "Wallets : Protéger ses cryptos", "parcours": "bases", "module": 1, "duration_min": 15, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    7: {"id": 7, "title": "Choisir son Exchange", "parcours": "bases", "module": 2, "duration_min": 10, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    8: {"id": 8, "title": "Premiers Achats", "parcours": "bases", "module": 2, "duration_min": 15, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    9: {"id": 9, "title": "Sécuriser ses Cryptos", "parcours": "bases", "module": 2, "duration_min": 12, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    10: {"id": 10, "title": "Staking et Yield", "parcours": "bases", "module": 2, "duration_min": 12, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    11: {"id": 11, "title": "DeFi pour Débutants", "parcours": "bases", "module": 2, "duration_min": 15, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    12: {"id": 12, "title": "NFTs : C'est quoi ?", "parcours": "bases", "module": 2, "duration_min": 10, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    13: {"id": 13, "title": "Market Cap et Dominance", "parcours": "bases", "module": 3, "duration_min": 10, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    14: {"id": 14, "title": "Cycles de Marché", "parcours": "bases", "module": 3, "duration_min": 12, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    15: {"id": 15, "title": "Tokenomics", "parcours": "bases", "module": 3, "duration_min": 12, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    16: {"id": 16, "title": "On-Chain Analysis", "parcours": "bases", "module": 3, "duration_min": 15, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    17: {"id": 17, "title": "Régulation et Fiscalité", "parcours": "bases", "module": 3, "duration_min": 12, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    18: {"id": 18, "title": "L'Avenir des Cryptos", "parcours": "bases", "module": 3, "duration_min": 15, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    
    # Leçons 19-36: Trading 101 (templates)
    19: {"id": 19, "title": "Introduction au Trading", "parcours": "trading", "module": 4, "duration_min": 10, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    20: {"id": 20, "title": "Lire un Graphique", "parcours": "trading", "module": 4, "duration_min": 15, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    # ... (continuer jusqu'à 36)
    
    # Leçons 37-54: Sécurité (templates)
    37: {"id": 37, "title": "Les Menaces Crypto", "parcours": "securite", "module": 7, "duration_min": 10, "xp_reward": 100, "content": "[CONTENU À GÉNÉRER]", "quiz": []},
    # ... (continuer jusqu'à 54)
}

# Ajouter tous les templates manquants (20-36, 37-54)
for i in range(20, 37):
    if i not in LESSONS_DATA:
        LESSONS_DATA[i] = {
            "id": i,
            "title": f"Leçon Trading {i-18}",
            "parcours": "trading",
            "module": (i-19)//6 + 4,
            "duration_min": 12,
            "xp_reward": 100,
            "content": "[CONTENU À GÉNÉRER PAR AI]",
            "quiz": []
        }

for i in range(37, 55):
    if i not in LESSONS_DATA:
        LESSONS_DATA[i] = {
            "id": i,
            "title": f"Leçon Sécurité {i-36}",
            "parcours": "securite",
            "module": (i-37)//6 + 7,
            "duration_min": 12,
            "xp_reward": 100,
            "content": "[CONTENU À GÉNÉRER PAR AI]",
            "quiz": []
        }
