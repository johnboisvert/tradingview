# 📈 CryptoIA — Playbook Croissance 4 Semaines

> **Objectif** : Passer de 0 à 50 abonnés Premium en 30 jours **sans exposition publique du fondateur**.
> Tout est conçu pour être délégué, automatisé, ou exécuté avec un effort minimal.

---

## 🛠 Outils déjà disponibles dans CryptoIA

| Outil | Endroit | Effort |
|---|---|---|
| **Boutons partage** sur les articles | `/blog/:slug` | 0 (les visiteurs partagent) |
| **Social Kit auto-généré** par article | `GET /api/v1/blog/social-kit/:slug` | 30 sec (copier/coller) |
| **OG image dynamique** | `/og/:slug.svg` | 0 (auto) |
| **Lead Magnet email** + drip 5 emails | Auto sur `/blog/:slug` | 0 (auto) |
| **Sitemap.xml** | `/sitemap.xml` (25 URLs + 5 articles) | déjà soumis Google ✅ |

---

## 📅 SEMAINE 1 — Distribution Organique (Soft Launch)

### Lun-Mar : Manual Index Push (~30 min total)
1. **Google Search Console** → Inspection d'URL → Demander l'indexation pour :
   - `https://www.cryptoia.ca/`
   - `https://www.cryptoia.ca/abonnements`
   - `https://www.cryptoia.ca/blog/bitcoin-2026-analyse-predictions-signaux-ia`
   - `https://www.cryptoia.ca/blog/comment-lire-graphique-crypto-debutant`
   - 1-2 autres articles
   ⏰ Limite Google : ~10 URLs/jour

### Mer : Twitter/X Soft Launch (~45 min)
1. Créer compte `@CryptoIA_ca` si pas déjà fait (sans photo de toi)
2. Bio : *"Analyse crypto par IA · FR-CA · Signaux 24/7 · Free trial 7j 👉 cryptoia.ca"*
3. Pour chaque article (5 fois) :
   - GET `/api/v1/blog/social-kit/<slug>` → copier le `twitter_thread`
   - Poster comme thread (8 tweets) à 1 jour d'intervalle
4. Suivre 50-100 comptes crypto FR pertinents (Coinhouse, Cryptoast, etc.)

### Jeu : LinkedIn (~30 min)
1. Sur ton profil LinkedIn perso, poste l'article #1 (texte fourni par social-kit)
2. Tag 2-3 personnes du milieu crypto FR si tu en connais
3. Engage dans les commentaires les 24h suivantes

### Ven : Reddit FR (~20 min)
1. `r/CryptoFR` — poste avec le format `social-kit.reddit`
2. Important : pas de "promotion brute". Ajoute une vraie analyse personnelle de 2-3 phrases
3. Réponds aux commentaires sous 1h les premières heures

### Weekend : Repos / Monitor
- Check `/admin/analytics` → funnel : combien de `pricing_page_viewed` ?
- Note quelle plateforme a converti le mieux

**Objectif S1** : 200 visiteurs blog, 10 leads email, 1-2 essais Premium

---

## 📅 SEMAINE 2 — Backlinks & Communautés (Amplification)

### Lun : Discord Crypto FR (~30 min/jour pendant 5 jours)
1. Rejoindre 3 serveurs : Cryptoast Discord, AlphaShark, ChatBot FR-CA
2. **Règle d'or** : 10 messages utiles AVANT de mentionner CryptoIA
3. Quand quelqu'un demande "comment lire un graphique" → lien article #2 (jamais brut, toujours contextualisé)

### Mar-Mer : Backlinks Directories (~1 h)
1. Soumettre à `producthunt.com/ship` (page coming-soon)
2. Soumettre à `betalist.com` (audience early adopters)
3. Soumettre à `alternativeto.net` (compétiteur de référence : 3commas, TradingView)
4. Soumettre à `cryptodaily.co.uk/submit-news`
5. Soumettre à `coingecko.com/learn/submit-article` (guest posting)

### Jeu : Email outreach (~1 h)
Template à adapter, envoyer à 10 micro-influenceurs crypto FR (1k-10k followers) :
```
Bonjour [prénom],

Je suis [ton prénom], fondateur de CryptoIA (analyse crypto IA, FR-CA).
J'ai vu ta thread sur [sujet récent] — vraiment utile.

J'aimerais t'offrir un accès Premium gratuit (60$/an de valeur) pour que tu testes nos signaux IA et notre Whale Watcher.
Si ça te plait, partage juste un retour authentique. Sinon, no hard feelings.

Voilà le code : VIP-[prénom]-2026 (3 mois Premium offerts)
Le site : cryptoia.ca

À bientôt,
[ton prénom]
```

### Ven : Refresh content (~30 min)
- Re-poste les threads Twitter qui ont marché (avec variations)
- Engage avec les comptes qui t'ont retweeté/liké
- Ajoute leurs commentaires comme preuve sociale future

**Objectif S2** : 500 visiteurs cumulés, 30 leads, 3-5 abonnés Premium

---

## 📅 SEMAINE 3 — ProductHunt + Affiliate Push

### Lun-Mer : Préparer ProductHunt Launch (~3 h cumulées)
1. **Tagline** : *"AI crypto analysis platform for French-Canadian traders"*
2. **Description** : 250 mots — focus sur "AI signals 24/7, 200+ pairs, 7-day free trial"
3. **5 screenshots** : Dashboard, AI Signals, Whale Watcher, Blog, Pricing
4. **Maker comment** : Story honnête du build solo, sans inflater
5. **Schedule** : Mardi suivant 00:01 PST (12:01 du matin Eastern)
6. **Préparer 10 "Hunters"** : amis/famille qui voteront le jour J (jamais le matin, espacé sur la journée)

### Mer : Activate Affiliate System (~45 min)
1. Vérifier `/affiliation` fonctionne (créer un code, tester la conv)
2. Email à tous les leads email captés : *"Tu utilises CryptoIA ? Gagne 30% commission récurrente sur tes parrainages"*
3. Ajouter widget affiliate dans `/my-cryptoia` (post-paiement onboarding)

### Jeu : Submit articles to crypto aggregators (~1 h)
- `Hacker News` (Show HN) — l'article #5 "Trading IA vs Manuel" est parfait pour HN audience
- `IndieHackers` — post sur la sous-section #marketing avec lessons learned semaines 1-2
- `r/IndieDev` — focus tech (Express + Vite + Stripe + Resend) et zéro VC

### Ven : ProductHunt Launch Day
1. Post à 00:01 PST mardi prochain (effectif via produit hunt direct submission)
2. Notifier ta liste email captée (utilise un email du Drip personnalisé)
3. Engage 100% des commentaires sous 30 min pendant 24h
4. Cross-post lien PH sur Twitter, LinkedIn, Discord

**Objectif S3** : 1 500 visiteurs cumulés, 75 leads, 8-15 abonnés Premium

---

## 📅 SEMAINE 4 — Itération & Scale

### Lun : Analytics review (~1 h)
- Dans `/admin/analytics` → funnel : où sont les fuites ?
- Si `pricing → checkout < 20%` → améliore la page pricing
- Si `checkout → paid < 30%` → vérifie Stripe friction
- Si `blog_cta_clicked < 5%` → améliore tes CTAs in-article

### Mar-Mer : A/B test landing (~2 h)
- 2 versions du `<h1>` homepage : "Trading crypto par IA" vs "Signaux crypto IA en temps réel"
- Track conversion sur chaque

### Jeu : Content batch (~2 h)
- Écrire 2 nouveaux articles blog (mots-clés haute intent : "calculator crypto profit", "scanner altcoins gratuit")
- Les ajouter dans `data/blog_seed.json` → push → auto-import au reboot Railway
- Re-soumettre sitemap à Google Search Console

### Ven : Email à toute la base (~30 min)
- Newsletter : récap "Bull run 2026 — où on en est"
- Inclure un soft CTA : "Si vous appréciez ces analyses, partagez avec un trader"

**Objectif S4** : 3 000 visiteurs cumulés, 150 leads, 20-50 abonnés Premium

---

## 📊 Métriques à monitorer chaque semaine

Dashboard : `/admin/analytics`

| KPI | S1 | S2 | S3 | S4 |
|---|---|---|---|---|
| Visiteurs uniques | 200 | 500 | 1 500 | 3 000 |
| Leads email | 10 | 30 | 75 | 150 |
| Pricing page views | 50 | 150 | 400 | 800 |
| Checkout started | 5 | 15 | 40 | 80 |
| Payment completed | 1 | 4 | 12 | 30 |
| Revenue MRR (CAD) | 50 | 200 | 600 | 1 500 |

## 🚨 Si bloqué

- Si trafic < cible → augmente la fréquence de posting Twitter (1/jour minimum)
- Si checkout < 20% → simplifie le pricing (peut-être 1 plan unique au lieu de 3)
- Si payment < 30% → ajoute du social proof récent (un seul vrai témoignage validé suffit)

---

## 🔁 Cycle hebdo après S4

Chaque lundi :
- 1 nouvel article blog (préférablement basé sur question fréquente Discord)
- 1 thread Twitter par jour (recyclage articles, screenshots dashboard)
- 1 post LinkedIn par semaine
- Engage 30 min/jour dans Discord/Reddit (réponses utiles, lien naturel)

Chaque vendredi :
- Review analytics (15 min)
- Email outreach 3 micro-influenceurs (15 min)
- Update playbook avec ce qui marche/ne marche pas

**Le but n'est pas la perfection. C'est la consistance.** 🚀
