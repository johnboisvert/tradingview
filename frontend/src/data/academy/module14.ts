import { Lesson } from "./types";

const m14l1: Lesson = {
  id: "m14-l1",
  title: "Sécurité Crypto et Protection du Capital",
  icon: "🔒",
  duration: "50 min",
  description: "Protéger vos cryptos contre les hacks, arnaques et erreurs humaines.",
  subLessons: [
    {
      title: "Hardware Wallets et Self-Custody",
      content: [
        "La self-custody signifie que VOUS contrôlez vos clés privées. 'Not your keys, not your coins' — FTX, Mt. Gox, Celsius ont prouvé que les exchanges centralisés ne sont pas des banques. Vos fonds peuvent disparaître du jour au lendemain.",
        "Les hardware wallets (Ledger Nano X, Trezor Model T) stockent vos clés privées hors ligne, à l'abri des hacks. Même si votre ordinateur est compromis, vos fonds sont en sécurité car la clé privée ne quitte jamais le device.",
        "La seed phrase (12 ou 24 mots) est la clé maîtresse de votre wallet. Si vous la perdez, vous perdez TOUT. Si quelqu'un la trouve, il vole TOUT. Stockez-la sur métal (Cryptosteel, Billfodl), JAMAIS en photo ou en ligne.",
        "Règles de sécurité : (1) Achetez UNIQUEMENT sur le site officiel du fabricant. (2) Vérifiez l'intégrité du device. (3) Seed phrase sur métal, dans un coffre. (4) Testez la restauration avec un petit montant. (5) Utilisez un passphrase (25ème mot) pour une sécurité supplémentaire."
      ],
      keyPoints: [
        "Self-custody = vous contrôlez vos clés",
        "Hardware wallet = clés hors ligne = sécurité maximale",
        "Seed phrase sur métal, JAMAIS en photo/en ligne",
        "Toujours acheter sur le site officiel du fabricant"
      ],
      proTips: ["Utilisez un passphrase (25ème mot) pour créer un wallet caché — même si quelqu'un trouve votre seed, il n'accède pas au wallet principal"],
      commonMistakes: ["Stocker la seed phrase dans un fichier sur l'ordinateur ou dans le cloud — c'est la méthode #1 de vol de cryptos"]
    },
    {
      title: "Sécurité des Comptes et 2FA",
      content: [
        "Le 2FA (Two-Factor Authentication) ajoute une couche de sécurité à vos comptes. Utilisez TOUJOURS Google Authenticator ou Authy — JAMAIS le SMS (vulnérable au SIM swap). Sauvegardez les codes de récupération 2FA.",
        "Le SIM swap : un attaquant convainc votre opérateur de transférer votre numéro sur sa SIM. Il reçoit vos SMS 2FA et accède à vos comptes. Solution : 2FA par app, PIN sur votre compte opérateur, et ne liez JAMAIS votre numéro à vos comptes crypto.",
        "Les mots de passe : utilisez un gestionnaire (Bitwarden, 1Password). Mot de passe unique pour chaque service, minimum 16 caractères. Activez les notifications de connexion sur tous vos exchanges.",
        "Le phishing est l'attaque la plus courante. Vérifiez TOUJOURS l'URL (https://www.binance.com, pas binance-login.com). Ne cliquez JAMAIS sur des liens dans les emails ou DMs. Bookmarkez les sites officiels."
      ],
      keyPoints: [
        "2FA par app (Google Auth/Authy), JAMAIS par SMS",
        "SIM swap = risque majeur avec 2FA SMS",
        "Gestionnaire de mots de passe obligatoire",
        "Phishing = attaque #1 — vérifiez TOUJOURS l'URL"
      ],
      proTips: ["Créez un email dédié uniquement à vos comptes crypto, différent de votre email personnel"],
      commonMistakes: ["Utiliser le même mot de passe sur plusieurs exchanges — si un est compromis, tous le sont"]
    },
    {
      title: "Sécurité DeFi et Wallet Management",
      content: [
        "En DeFi, votre wallet est votre identité. Utilisez des wallets séparés : un wallet 'chaud' pour les interactions DeFi quotidiennes (petit montant), un wallet 'froid' (hardware) pour le stockage long terme.",
        "Les approbations de smart contracts sont un vecteur d'attaque majeur. Quand vous approuvez un contrat, vous lui donnez accès à vos tokens. Utilisez revoke.cash pour révoquer les approbations inutilisées. N'approuvez JAMAIS des montants illimités.",
        "Les airdrops malveillants : des tokens inconnus apparaissent dans votre wallet. N'interagissez JAMAIS avec eux — le simple fait de les approuver peut drainer votre wallet. Ignorez-les.",
        "Le multisig (Gnosis Safe) nécessite plusieurs signatures pour exécuter une transaction. Idéal pour les gros montants : 2/3 ou 3/5 signatures. Même si une clé est compromise, les fonds sont protégés."
      ],
      keyPoints: [
        "Wallets séparés : chaud (DeFi) et froid (stockage)",
        "Révoquer les approbations inutilisées (revoke.cash)",
        "JAMAIS interagir avec des tokens inconnus/airdrops suspects",
        "Multisig pour les gros montants"
      ],
      proTips: ["Créez un wallet 'burner' pour tester les nouveaux protocoles DeFi — ne mettez que le minimum nécessaire"],
      commonMistakes: ["Utiliser le même wallet pour le stockage long terme et les interactions DeFi risquées"]
    },
    {
      title: "Plan de Sécurité et Héritage",
      content: [
        "Créez un plan de sécurité complet : listez tous vos wallets et exchanges, documentez les procédures d'accès, stockez les seed phrases séparément, et prévoyez un plan d'héritage.",
        "Le plan d'héritage crypto est crucial. Si vous décédez, vos proches doivent pouvoir accéder à vos fonds. Options : lettre scellée chez un notaire, Shamir's Secret Sharing (diviser la seed en parties), ou service spécialisé (Casa).",
        "Les assurances crypto existent mais sont limitées. Nexus Mutual offre une couverture contre les hacks de smart contracts. Les exchanges majeurs ont des fonds d'assurance (SAFU de Binance) mais avec des limites.",
        "Checklist de sécurité mensuelle : (1) Vérifier les approbations (revoke.cash). (2) Mettre à jour le firmware du hardware wallet. (3) Vérifier les sessions actives sur les exchanges. (4) Sauvegarder les codes 2FA. (5) Revoir la distribution des fonds."
      ],
      keyPoints: [
        "Plan de sécurité documenté et à jour",
        "Plan d'héritage pour vos proches",
        "Assurances crypto limitées mais existantes",
        "Checklist de sécurité mensuelle"
      ],
      proTips: ["Utilisez Shamir's Secret Sharing pour diviser votre seed en 3 parties dont 2 suffisent pour reconstituer — stockez-les dans 3 lieux différents"],
      commonMistakes: ["Ne pas avoir de plan d'héritage — des milliards de dollars en crypto sont perdus à jamais"],
      exercise: "Créez votre plan de sécurité : listez tous vos wallets/exchanges, vérifiez vos 2FA, révoquez les approbations inutiles, et rédigez un plan d'héritage simplifié."
    }
  ],
  quiz: [
    { question: "Où stocker votre seed phrase ?", options: ["Dans un fichier sur l'ordinateur", "En photo sur le téléphone", "Sur métal dans un coffre", "Dans un email"], correct: 2 },
    { question: "Quel type de 2FA utiliser ?", options: ["SMS", "Email", "Google Authenticator/Authy", "Pas de 2FA"], correct: 2 },
    { question: "Que faire avec des tokens inconnus dans votre wallet ?", options: ["Les vendre", "Les approuver", "Les ignorer complètement", "Les transférer"], correct: 2 },
    { question: "Le multisig nécessite :", options: ["Un seul mot de passe", "Plusieurs signatures pour une transaction", "Un hardware wallet", "Une connexion VPN"], correct: 1 }
  ]
};

export const module14Lessons: Lesson[] = [m14l1];
