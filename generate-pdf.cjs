const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 50, right: 50 },
  info: {
    Title: 'CryptoIA — Recommandations Forfaits & Accès Pages',
    Author: 'CryptoIA',
    Subject: 'Plan tarifaire et accès pages',
    CreationDate: new Date('2026-02-20'),
  },
});

const outputPath = path.join(__dirname, 'frontend', 'public', 'docs', 'cryptoia-recommandations-forfaits.pdf');
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Colors
const colors = {
  darkBg: '#0F172A',
  primary: '#3B82F6',
  accent: '#F59E0B',
  green: '#10B981',
  purple: '#8B5CF6',
  red: '#EF4444',
  orange: '#F97316',
  cyan: '#06B6D4',
  gray: '#64748B',
  lightGray: '#E2E8F0',
  darkText: '#1E293B',
  mediumText: '#475569',
  white: '#FFFFFF',
  // Plan colors
  free: '#6B7280',
  premium: '#3B82F6',
  advanced: '#8B5CF6',
  pro: '#F59E0B',
  elite: '#EF4444',
};

const pageWidth = 495; // usable width
let currentY = 40;

function checkPageBreak(needed = 80) {
  if (currentY + needed > 760) {
    doc.addPage();
    currentY = 40;
    return true;
  }
  return false;
}

function drawRect(x, y, w, h, color, radius = 0) {
  doc.save();
  doc.fillColor(color);
  if (radius > 0) {
    doc.roundedRect(x, y, w, h, radius).fill();
  } else {
    doc.rect(x, y, w, h).fill();
  }
  doc.restore();
}

function drawLine(x1, y1, x2, y2, color = colors.lightGray, width = 1) {
  doc.save();
  doc.strokeColor(color).lineWidth(width).moveTo(x1, y1).lineTo(x2, y2).stroke();
  doc.restore();
}

// Helper: draw a simple table
function drawTable(headers, rows, colWidths, options = {}) {
  const { headerBg = colors.darkBg, headerColor = colors.white, rowHeight = 26 } = options;
  const colStarts = [50];
  for (let i = 1; i < colWidths.length; i++) colStarts.push(colStarts[i - 1] + colWidths[i - 1]);

  // Header
  checkPageBreak(rowHeight + rows.length * rowHeight + 10);
  drawRect(50, currentY, pageWidth, rowHeight + 2, headerBg, 4);
  headers.forEach((h, i) => {
    doc.fontSize(8).fillColor(headerColor).font('Helvetica-Bold');
    doc.text(h, colStarts[i] + 8, currentY + 8, { width: colWidths[i] - 16 });
  });
  currentY += rowHeight + 2;

  // Rows
  rows.forEach((row, idx) => {
    checkPageBreak(rowHeight + 5);
    drawRect(50, currentY, pageWidth, rowHeight, row.bg || (idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF'));
    if (row.barColor) {
      drawRect(50, currentY, 4, rowHeight, row.barColor);
    }
    row.values.forEach((v, i) => {
      const isFirst = i === 0;
      doc.fontSize(8.5).fillColor(isFirst ? colors.darkText : colors.mediumText).font(isFirst ? 'Helvetica-Bold' : 'Helvetica');
      doc.text(v, colStarts[i] + 8, currentY + 7, { width: colWidths[i] - 16 });
    });
    if (idx < rows.length - 1) {
      drawLine(50, currentY + rowHeight, 50 + pageWidth, currentY + rowHeight, colors.lightGray, 0.5);
    }
    currentY += rowHeight;
  });

  // Border
  doc.save();
  doc.strokeColor(colors.lightGray).lineWidth(0.5).roundedRect(50, currentY - rowHeight * rows.length, pageWidth, rowHeight * rows.length, 4).stroke();
  doc.restore();
  currentY += 15;
}

// ============================================================
// HEADER
// ============================================================
drawRect(0, 0, 612, 100, colors.darkBg);

doc.fontSize(28).fillColor(colors.white).font('Helvetica-Bold');
doc.text('CryptoIA', 50, 25, { continued: false });

doc.fontSize(11).fillColor(colors.primary).font('Helvetica');
doc.text('Recommandations Forfaits & Accès Pages', 50, 58);

doc.fontSize(9).fillColor(colors.gray);
doc.text('Document confidentiel — 20 février 2026', 50, 78);

// Version badge
drawRect(400, 30, 80, 24, colors.primary, 12);
doc.fontSize(9).fillColor(colors.white).font('Helvetica-Bold');
doc.text('v3.0', 400, 37, { width: 80, align: 'center' });

currentY = 115;

// ============================================================
// SECTION 1: INTRODUCTION
// ============================================================
doc.fontSize(16).fillColor(colors.darkText).font('Helvetica-Bold');
doc.text('📋  Vue d\'ensemble', 50, currentY);
currentY += 25;

drawRect(50, currentY, pageWidth, 55, '#F0F9FF', 6);
doc.fontSize(9.5).fillColor(colors.mediumText).font('Helvetica');
doc.text(
  'Ce document présente nos recommandations pour structurer les 5 forfaits de CryptoIA. ' +
  'L\'objectif est de maximiser la conversion tout en offrant une progression logique de valeur. ' +
  'Chaque forfait cible un profil utilisateur spécifique avec un accès progressif aux fonctionnalités IA.',
  60, currentY + 10, { width: pageWidth - 20, lineGap: 3 }
);
currentY += 70;

// ============================================================
// SECTION 2: PAGES PUBLIQUES
// ============================================================
doc.fontSize(16).fillColor(colors.darkText).font('Helvetica-Bold');
doc.text('🌐  Pages publiques (sans forfait)', 50, currentY);
currentY += 25;

drawRect(50, currentY, pageWidth, 45, '#F8FAFC', 6);
doc.save();
doc.strokeColor(colors.lightGray).lineWidth(1).roundedRect(50, currentY, pageWidth, 45, 6).stroke();
doc.restore();

const publicPages = [
  'Page d\'accueil', 'Connexion / Inscription', 'Abonnements',
  'Mon compte', 'Contact', 'Success Stories', 'Confirmation paiement'
];
doc.fontSize(9).fillColor(colors.mediumText).font('Helvetica');
let xPos = 60;
let yPos = currentY + 10;
publicPages.forEach((page, i) => {
  const badge = `  ${page}  `;
  const w = doc.widthOfString(badge) + 12;
  if (xPos + w > 530) {
    xPos = 60;
    yPos += 20;
  }
  drawRect(xPos, yPos, w, 18, colors.lightGray, 9);
  doc.fontSize(8).fillColor(colors.darkText).font('Helvetica');
  doc.text(page, xPos + 6, yPos + 4);
  xPos += w + 6;
});
currentY += 60;

// ============================================================
// SECTION 3: FORFAITS
// ============================================================
const plans = [
  {
    name: 'GRATUIT',
    icon: '🆓',
    price: '0$',
    priceNote: 'Gratuit pour toujours',
    color: colors.free,
    bgColor: '#F9FAFB',
    target: 'Appât / Découverte',
    pages: [
      'Fear & Greed Index',
      'Heatmap',
      'Convertisseur crypto',
      'Calculatrice crypto',
      'News crypto',
    ],
    alerts: '0 alerte',
    conseil: 'Garder très limité (5-6 pages max). Inclure les News pour fidéliser les visiteurs et les inciter à revenir. L\'objectif est de montrer la qualité de la plateforme sans donner trop de valeur gratuite.',
  },
  {
    name: 'PREMIUM',
    icon: '⭐',
    price: '24.99$/mois',
    priceNote: 'Recommandé (actuel: 29.99$)',
    color: colors.premium,
    bgColor: '#EFF6FF',
    target: 'Trader débutant / intermédiaire',
    pages: [
      'Tout du Gratuit +',
      'Altcoin Season Index',
      'Dominance Bitcoin',
      'Calendrier économique',
      'Bullrun Phase Tracker',
      'Graphiques avancés',
      'Trading Academy',
      'Téléchargements',
      'Stratégies de trading',
      'Journal de Trading',
      'Analyse Technique',
      'Alertes IA (max 5)',
      'Score Confiance IA (lecture seule)',
    ],
    alerts: '5 alertes max',
    conseil: 'Inclure les outils éducatifs et les indicateurs de base. Limiter l\'accès IA pour créer un désir de passer au niveau supérieur. Le prix de 24.99$ est un seuil psychologique important.',
  },
  {
    name: 'ADVANCED',
    icon: '🚀',
    price: '59.99$/mois',
    priceNote: 'Recommandé (actuel: 69.99$)',
    color: colors.advanced,
    bgColor: '#F5F3FF',
    target: 'Trader actif avec outils IA',
    pages: [
      'Tout du Premium +',
      'Market Regime IA',
      'Screener Technique',
      'Portfolio Tracker',
      'Simulation de portfolio',
      'Backtesting Visuel',
      'Simulateur Stratégie IA',
      'My CryptoIA (dashboard)',
      'Assistant IA',
      'Rapport Hebdomadaire IA',
      'Alertes IA illimitées',
    ],
    alerts: '20 alertes max',
    conseil: 'C\'est le plan "sweet spot" — le plus rentable pour vous. La majorité des utilisateurs actifs devraient être sur ce plan. Mettre en avant avec un badge "Meilleur rapport qualité-prix".',
  },
  {
    name: 'PRO',
    icon: '👑',
    price: '99.99$/mois',
    priceNote: 'Recommandé (actuel: 119.99$)',
    color: colors.pro,
    bgColor: '#FFFBEB',
    target: 'Trader professionnel',
    pages: [
      'Tout du Advanced +',
      'Whale Watcher',
      'AI News Analyzer',
      'Crypto Pépites',
      'Token Scanner',
      'DeFi Yield Optimizer',
      'On-Chain Metrics',
      'AI Patterns Recognition',
      'AI Sentiment Analysis',
      'Gamification / Récompenses',
      'Support prioritaire',
    ],
    alerts: 'Illimitées',
    conseil: 'Marquer comme "Plus Populaire" dans la page d\'abonnements. Ce plan attire les traders sérieux qui veulent un avantage compétitif. Le support prioritaire justifie le prix.',
  },
  {
    name: 'ELITE',
    icon: '💎',
    price: '179.99$/mois',
    priceNote: 'Recommandé (actuel: 199.99$)',
    color: colors.elite,
    bgColor: '#FEF2F2',
    target: 'VIP / Institutionnel',
    pages: [
      'Tout du Pro +',
      'Narrative Radar',
      'Rug & Scam Shield',
      'Opportunity Scanner',
      'AI Setup Builder',
      'AI Swarm Intelligence',
      'Spot Trading Integration',
      'Gem Hunter',
      'Position Sizer',
      'Risk Management avancé',
      'Watchlist intelligente',
      'Backtesting avancé multi-stratégie',
    ],
    alerts: 'Illimitées + prioritaires',
    conseil: 'Garder exclusif et premium. Ce plan doit donner un sentiment d\'appartenance à un club VIP. Envisager des fonctionnalités exclusives comme des webinaires privés ou un accès anticipé aux nouvelles fonctionnalités.',
  },
];

doc.fontSize(16).fillColor(colors.darkText).font('Helvetica-Bold');
doc.text('💰  Détail des forfaits', 50, currentY);
currentY += 30;

plans.forEach((plan) => {
  // Calculate needed height
  const pagesCount = plan.pages.length;
  const pagesRows = Math.ceil(pagesCount / 2);
  const neededHeight = 130 + pagesRows * 16 + 60;
  checkPageBreak(neededHeight);

  // Plan header bar
  drawRect(50, currentY, pageWidth, 36, plan.color, 6);
  doc.fontSize(14).fillColor(colors.white).font('Helvetica-Bold');
  doc.text(`${plan.icon}  ${plan.name}`, 62, currentY + 10);

  // Price badge
  const priceText = plan.price;
  const priceW = doc.widthOfString(priceText) + 20;
  drawRect(545 - priceW - 10, currentY + 6, priceW, 24, 'rgba(255,255,255,0.25)', 12);
  doc.fontSize(11).fillColor(colors.white).font('Helvetica-Bold');
  doc.text(priceText, 545 - priceW - 10, currentY + 11, { width: priceW, align: 'center' });

  currentY += 42;

  // Plan body
  drawRect(50, currentY, pageWidth, neededHeight - 50, plan.bgColor, 6);
  doc.save();
  doc.strokeColor(plan.color).lineWidth(0.5).roundedRect(50, currentY, pageWidth, neededHeight - 50, 6).stroke();
  doc.restore();

  let innerY = currentY + 12;

  // Target & price note
  doc.fontSize(9).fillColor(colors.gray).font('Helvetica');
  doc.text(`Cible : ${plan.target}  •  ${plan.priceNote}  •  Alertes : ${plan.alerts}`, 62, innerY);
  innerY += 20;

  // Pages title
  doc.fontSize(10).fillColor(colors.darkText).font('Helvetica-Bold');
  doc.text('Pages incluses :', 62, innerY);
  innerY += 16;

  // Pages list in 2 columns
  const colWidth = (pageWidth - 30) / 2;
  plan.pages.forEach((page, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const px = 62 + col * colWidth;
    const py = innerY + row * 16;

    const isInherited = page.startsWith('Tout du');
    doc.fontSize(8.5).font(isInherited ? 'Helvetica-BoldOblique' : 'Helvetica');
    doc.fillColor(isInherited ? plan.color : colors.mediumText);
    doc.text(`${isInherited ? '↗' : '✓'}  ${page}`, px, py);
  });

  innerY += pagesRows * 16 + 10;

  // Conseil
  drawRect(62, innerY, pageWidth - 24, 40, colors.white, 4);
  doc.fontSize(8).fillColor(plan.color).font('Helvetica-Bold');
  doc.text('💡 Conseil :', 70, innerY + 6);
  doc.fontSize(8).fillColor(colors.mediumText).font('Helvetica');
  doc.text(plan.conseil, 118, innerY + 6, { width: pageWidth - 80, lineGap: 2 });

  currentY += neededHeight - 40;
  currentY += 15;
});

// ============================================================
// SECTION 4: TABLEAU RÉCAPITULATIF (original)
// ============================================================
checkPageBreak(200);

doc.fontSize(16).fillColor(colors.darkText).font('Helvetica-Bold');
doc.text('📊  Tableau récapitulatif des prix', 50, currentY);
currentY += 30;

// Table header
drawRect(50, currentY, pageWidth, 28, colors.darkBg, 4);
const colWidths = [120, 95, 95, 95, 95];
const colStarts = [50];
for (let i = 1; i < 5; i++) colStarts.push(colStarts[i - 1] + colWidths[i - 1]);

const headers = ['Forfait', 'Prix mensuel', 'Prix annuel (-20%)', 'Alertes IA', 'Nb pages'];
headers.forEach((h, i) => {
  doc.fontSize(8).fillColor(colors.white).font('Helvetica-Bold');
  doc.text(h, colStarts[i] + 8, currentY + 8, { width: colWidths[i] - 16 });
});
currentY += 28;

const tableData = [
  { plan: '🆓 Gratuit', price: '0$', annual: '0$', alerts: '0', pages: '5', color: colors.free, bg: '#F9FAFB' },
  { plan: '⭐ Premium', price: '24.99$', annual: '19.99$', alerts: '5', pages: '~18', color: colors.premium, bg: '#EFF6FF' },
  { plan: '🚀 Advanced', price: '59.99$', annual: '47.99$', alerts: '20', pages: '~29', color: colors.advanced, bg: '#F5F3FF' },
  { plan: '👑 Pro', price: '99.99$', annual: '79.99$', alerts: '∞', pages: '~40', color: colors.pro, bg: '#FFFBEB' },
  { plan: '💎 Elite', price: '179.99$', annual: '143.99$', alerts: '∞+', pages: 'Toutes', color: colors.elite, bg: '#FEF2F2' },
];

tableData.forEach((row, idx) => {
  const rowH = 26;
  drawRect(50, currentY, pageWidth, rowH, row.bg);
  // Left color bar
  drawRect(50, currentY, 4, rowH, row.color);

  const vals = [row.plan, row.price, row.annual, row.alerts, row.pages];
  vals.forEach((v, i) => {
    doc.fontSize(9).fillColor(i === 0 ? colors.darkText : colors.mediumText).font(i === 0 ? 'Helvetica-Bold' : 'Helvetica');
    doc.text(v, colStarts[i] + 8, currentY + 7, { width: colWidths[i] - 16 });
  });

  if (idx < tableData.length - 1) {
    drawLine(50, currentY + rowH, 50 + pageWidth, currentY + rowH, colors.lightGray, 0.5);
  }
  currentY += rowH;
});

// Table border
doc.save();
doc.strokeColor(colors.lightGray).lineWidth(0.5).roundedRect(50, currentY - 26 * 5, pageWidth, 26 * 5, 4).stroke();
doc.restore();

currentY += 20;

// ============================================================
// SECTION 5: CONSEILS STRATÉGIQUES
// ============================================================
checkPageBreak(220);

doc.fontSize(16).fillColor(colors.darkText).font('Helvetica-Bold');
doc.text('🎯  Conseils stratégiques', 50, currentY);
currentY += 28;

const strategies = [
  {
    icon: '🎁',
    title: 'Essai gratuit 7 jours sur Premium',
    desc: 'Offrir un essai gratuit de 7 jours sur le plan Premium permet aux utilisateurs de découvrir la valeur ajoutée et augmente le taux de conversion de 35-45%.',
  },
  {
    icon: '📅',
    title: 'Réduction annuelle de -20%',
    desc: 'Proposer une réduction de 20% sur les abonnements annuels encourage l\'engagement à long terme et réduit le taux de désabonnement (churn).',
  },
  {
    icon: '👀',
    title: 'Pages "teaser" avec aperçu flou',
    desc: 'Montrer un aperçu flou des pages premium aux utilisateurs gratuits crée un effet FOMO (Fear Of Missing Out) et incite à l\'upgrade.',
  },
  {
    icon: '🔔',
    title: 'Limiter les alertes par plan',
    desc: 'Gratuit: 0 | Premium: 5 | Advanced: 20 | Pro: illimitées | Elite: illimitées + prioritaires. Cette progression motive les upgrades.',
  },
  {
    icon: '🎯',
    title: 'Advanced = cible principale',
    desc: 'Le plan Advanced à 59.99$ est votre "sweet spot". Concentrez vos efforts marketing dessus. Il offre le meilleur ratio valeur/prix et la meilleure marge.',
  },
  {
    icon: '🏷️',
    title: 'Effet d\'ancrage avec le plan Elite',
    desc: 'Le plan Elite à 179.99$ sert d\'ancrage psychologique : il fait paraître le plan Pro à 99.99$ comme une "bonne affaire" en comparaison.',
  },
];

strategies.forEach((s) => {
  checkPageBreak(65);
  drawRect(50, currentY, pageWidth, 55, '#F8FAFC', 6);
  doc.save();
  doc.strokeColor(colors.lightGray).lineWidth(0.5).roundedRect(50, currentY, pageWidth, 55, 6).stroke();
  doc.restore();

  doc.fontSize(10).fillColor(colors.darkText).font('Helvetica-Bold');
  doc.text(`${s.icon}  ${s.title}`, 62, currentY + 8);

  doc.fontSize(8.5).fillColor(colors.mediumText).font('Helvetica');
  doc.text(s.desc, 62, currentY + 24, { width: pageWidth - 24, lineGap: 2 });

  currentY += 62;
});

// ============================================================
// NEW SECTION 6: ANALYSE COMPARATIVE DU MARCHÉ CRYPTO SaaS
// ============================================================
checkPageBreak(200);
currentY += 10;

// Section divider
drawRect(50, currentY, pageWidth, 4, colors.primary, 2);
currentY += 20;

doc.fontSize(18).fillColor(colors.darkText).font('Helvetica-Bold');
doc.text('📈  Analyse comparative du marché crypto SaaS', 50, currentY);
currentY += 30;

// Intro text
drawRect(50, currentY, pageWidth, 50, '#F0F9FF', 6);
doc.fontSize(9.5).fillColor(colors.mediumText).font('Helvetica');
doc.text(
  'Les plateformes similaires (TradingView, CoinGecko Premium, Glassnode, LunarCrush) ' +
  'se positionnent dans les fourchettes de prix suivantes. Notre stratégie de prix doit ' +
  's\'aligner sur ces références tout en offrant un avantage compétitif.',
  60, currentY + 10, { width: pageWidth - 20, lineGap: 3 }
);
currentY += 60;

// Market comparison cards
const marketSegments = [
  { tier: 'Basique', range: '15 - 30$/mois', icon: '🟢', color: colors.green, examples: 'CoinGecko Pro, LunarCrush Free+' },
  { tier: 'Intermédiaire', range: '40 - 70$/mois', icon: '🔵', color: colors.primary, examples: 'TradingView Plus/Premium, Santiment Pro' },
  { tier: 'Pro', range: '80 - 130$/mois', icon: '🟣', color: colors.purple, examples: 'TradingView Premium+, Glassnode Advanced' },
  { tier: 'Enterprise', range: '150 - 300$/mois', icon: '🔴', color: colors.red, examples: 'Glassnode Professional, Nansen Pro' },
];

marketSegments.forEach((seg) => {
  checkPageBreak(50);
  drawRect(50, currentY, pageWidth, 40, '#FFFFFF', 6);
  doc.save();
  doc.strokeColor(seg.color).lineWidth(1).roundedRect(50, currentY, pageWidth, 40, 6).stroke();
  doc.restore();

  // Left color accent
  drawRect(50, currentY, 6, 40, seg.color, 3);

  doc.fontSize(11).fillColor(colors.darkText).font('Helvetica-Bold');
  doc.text(`${seg.icon}  ${seg.tier}`, 66, currentY + 6);

  doc.fontSize(13).fillColor(seg.color).font('Helvetica-Bold');
  doc.text(seg.range, 250, currentY + 5, { width: 200 });

  doc.fontSize(7.5).fillColor(colors.gray).font('Helvetica');
  doc.text(`Ex: ${seg.examples}`, 66, currentY + 24, { width: pageWidth - 30 });

  currentY += 48;
});

currentY += 10;

// ============================================================
// NEW SECTION 7: RECOMMANDATIONS DE PRIX
// ============================================================
checkPageBreak(250);

doc.fontSize(18).fillColor(colors.darkText).font('Helvetica-Bold');
doc.text('💡  Recommandations de prix', 50, currentY);
currentY += 28;

// Highlight box
drawRect(50, currentY, pageWidth, 35, '#FEF3C7', 6);
doc.save();
doc.strokeColor(colors.accent).lineWidth(1).roundedRect(50, currentY, pageWidth, 35, 6).stroke();
doc.restore();
doc.fontSize(9).fillColor(colors.darkText).font('Helvetica-Bold');
doc.text('⚡ Objectif : Maximiser les conversions en positionnant chaque forfait sous les seuils psychologiques clés (20$, 50$, 100$).', 62, currentY + 10, { width: pageWidth - 24, lineGap: 2 });
currentY += 45;

// Price recommendations table
drawTable(
  ['Forfait', 'Prix actuel', 'Prix recommandé', 'Raison'],
  [
    {
      values: ['🆓 Gratuit', '0$', '0$', 'Pas de changement, essentiel pour l\'acquisition'],
      barColor: colors.free,
      bg: '#F9FAFB',
    },
    {
      values: ['⭐ Premium', '29.99$/mois', '19.99$/mois', 'Sous la barre des 20$ = plus accessible, conversion ~2x'],
      barColor: colors.premium,
      bg: '#EFF6FF',
    },
    {
      values: ['🚀 Advanced', '69.99$/mois', '49.99$/mois', 'Sous 50$ = beaucoup plus attractif. Plan cible!'],
      barColor: colors.advanced,
      bg: '#F5F3FF',
    },
    {
      values: ['👑 Pro', '119.99$/mois', '89.99$/mois', 'Sous 100$ = perception "accessible" pour traders sérieux'],
      barColor: colors.pro,
      bg: '#FFFBEB',
    },
    {
      values: ['💎 Elite', '199.99$/mois', '149.99$ ou 199.99$', 'Deux options selon la stratégie (voir ci-dessous)'],
      barColor: colors.elite,
      bg: '#FEF2F2',
    },
  ],
  [110, 100, 110, 175]
);

currentY += 5;

// ============================================================
// NEW SECTION 8: JUSTIFICATION DES PRIX
// ============================================================
checkPageBreak(300);

doc.fontSize(16).fillColor(colors.darkText).font('Helvetica-Bold');
doc.text('🧠  Justification des prix', 50, currentY);
currentY += 25;

const justifications = [
  {
    plan: 'Premium à 19.99$',
    color: colors.premium,
    icon: '⭐',
    points: [
      'Psychologie : "Moins de 20$/mois" — un seuil psychologique majeur',
      'Conversion estimée ~2x plus élevée qu\'à 29.99$',
      'C\'est la porte d\'entrée, pas la source de revenus principale',
      'Objectif : convertir un maximum d\'utilisateurs gratuits',
    ],
  },
  {
    plan: 'Advanced à 49.99$',
    color: colors.advanced,
    icon: '🚀',
    points: [
      'Plan le plus important — c\'est votre "cash cow"',
      'Ancrage Premium → Advanced = +30$ pour beaucoup plus de valeur',
      'Excellent rapport qualité/prix perçu par les utilisateurs',
      'Sous la barre des 50$ = décision d\'achat plus facile',
    ],
  },
  {
    plan: 'Pro à 89.99$',
    color: colors.pro,
    icon: '👑',
    points: [
      'Sous 100$ = "je peux me le permettre" pour les traders actifs',
      'Upsell justifié par whale tracking + on-chain metrics',
      'Support prioritaire = valeur perçue élevée',
      'Cible les traders qui génèrent déjà des revenus',
    ],
  },
  {
    plan: 'Elite : deux options stratégiques',
    color: colors.elite,
    icon: '💎',
    points: [
      'Option A — 149.99$/mois : Plus de volume, sous la barre des 150$',
      'Option B — 199.99$/mois : Plus exclusif, effet "club VIP"',
      'Option A recommandée si vous visez la croissance rapide',
      'Option B recommandée si vous visez le positionnement premium',
    ],
  },
];

justifications.forEach((j) => {
  const cardHeight = 20 + j.points.length * 15 + 15;
  checkPageBreak(cardHeight + 10);

  // Card background
  drawRect(50, currentY, pageWidth, cardHeight, '#FFFFFF', 6);
  doc.save();
  doc.strokeColor(j.color).lineWidth(1).roundedRect(50, currentY, pageWidth, cardHeight, 6).stroke();
  doc.restore();

  // Left accent bar
  drawRect(50, currentY, 6, cardHeight, j.color, 3);

  // Plan name header
  doc.fontSize(11).fillColor(j.color).font('Helvetica-Bold');
  doc.text(`${j.icon}  ${j.plan}`, 66, currentY + 8);

  // Points
  let pointY = currentY + 26;
  j.points.forEach((point) => {
    doc.fontSize(8.5).fillColor(colors.mediumText).font('Helvetica');
    doc.text(`  •  ${point}`, 66, pointY, { width: pageWidth - 40 });
    pointY += 15;
  });

  currentY += cardHeight + 8;
});

currentY += 5;

// ============================================================
// NEW SECTION 9: OFFRES ANNUELLES RECOMMANDÉES
// ============================================================
checkPageBreak(220);

doc.fontSize(16).fillColor(colors.darkText).font('Helvetica-Bold');
doc.text('📅  Offres annuelles recommandées (-20%)', 50, currentY);
currentY += 25;

// Info box
drawRect(50, currentY, pageWidth, 30, '#ECFDF5', 6);
doc.save();
doc.strokeColor(colors.green).lineWidth(1).roundedRect(50, currentY, pageWidth, 30, 6).stroke();
doc.restore();
doc.fontSize(9).fillColor(colors.green).font('Helvetica-Bold');
doc.text('💰 Les abonnements annuels réduisent le churn de 40-60% et augmentent le LTV (Lifetime Value) de chaque client.', 62, currentY + 8, { width: pageWidth - 24 });
currentY += 40;

// Annual pricing table
drawTable(
  ['Forfait', 'Mensuel', 'Annuel (-20%)', 'Prix/mois (annuel)', 'Économie/an'],
  [
    {
      values: ['⭐ Premium', '19.99$', '191.90$/an', '15.99$/mois', '47.98$'],
      barColor: colors.premium,
      bg: '#EFF6FF',
    },
    {
      values: ['🚀 Advanced', '49.99$', '479.90$/an', '39.99$/mois', '119.98$'],
      barColor: colors.advanced,
      bg: '#F5F3FF',
    },
    {
      values: ['👑 Pro', '89.99$', '863.90$/an', '71.99$/mois', '215.98$'],
      barColor: colors.pro,
      bg: '#FFFBEB',
    },
    {
      values: ['💎 Elite', '199.99$', '1,919.90$/an', '159.99$/mois', '479.98$'],
      barColor: colors.elite,
      bg: '#FEF2F2',
    },
  ],
  [100, 85, 105, 105, 100]
);

currentY += 5;

// ============================================================
// NEW SECTION 10: STRATÉGIE DE LANCEMENT RECOMMANDÉE
// ============================================================
checkPageBreak(250);

doc.fontSize(16).fillColor(colors.darkText).font('Helvetica-Bold');
doc.text('🚀  Stratégie de lancement recommandée', 50, currentY);
currentY += 28;

const launchPhases = [
  {
    phase: 'Phase 1 — Mois 1 à 3',
    icon: '🎉',
    color: colors.green,
    title: 'Prix de lancement -30%',
    details: [
      'Code promo : LAUNCH30 (valide 90 jours)',
      'Premium : 13.99$/mois au lieu de 19.99$',
      'Advanced : 34.99$/mois au lieu de 49.99$',
      'Pro : 62.99$/mois au lieu de 89.99$',
      'Objectif : Acquérir une base d\'utilisateurs payants rapidement',
      'Communiquer massivement sur les réseaux sociaux et forums crypto',
    ],
  },
  {
    phase: 'Phase 2 — Mois 4+',
    icon: '📈',
    color: colors.primary,
    title: 'Prix normaux + essai gratuit',
    details: [
      'Retour aux prix normaux recommandés',
      'Essai gratuit 7 jours sur le plan Premium',
      'Email de bienvenue automatique avec onboarding',
      'Notification push avant fin de l\'essai (J5 et J7)',
      'Objectif : Conversion organique via la qualité du produit',
    ],
  },
  {
    phase: 'Phase 3 — Promos saisonnières',
    icon: '🎁',
    color: colors.accent,
    title: 'Événements marketing récurrents',
    details: [
      'Black Friday / Cyber Monday : -50% sur tous les plans annuels',
      'Nouvel An crypto (janvier) : -25% avec code NEWYEAR25',
      'Bitcoin Halving (événement spécial) : -30% pendant 1 semaine',
      'Anniversaire CryptoIA : -20% + fonctionnalité bonus exclusive',
      'Objectif : Pics de conversion planifiés tout au long de l\'année',
    ],
  },
];

launchPhases.forEach((phase) => {
  const cardHeight = 30 + phase.details.length * 14 + 20;
  checkPageBreak(cardHeight + 15);

  // Card
  drawRect(50, currentY, pageWidth, cardHeight, '#FFFFFF', 8);
  doc.save();
  doc.strokeColor(phase.color).lineWidth(1.5).roundedRect(50, currentY, pageWidth, cardHeight, 8).stroke();
  doc.restore();

  // Top color bar
  drawRect(50, currentY, pageWidth, 30, phase.color, 8);
  // Fix bottom corners of top bar
  drawRect(50, currentY + 20, pageWidth, 10, phase.color);

  doc.fontSize(11).fillColor(colors.white).font('Helvetica-Bold');
  doc.text(`${phase.icon}  ${phase.phase} : ${phase.title}`, 62, currentY + 8);

  let detailY = currentY + 38;
  phase.details.forEach((detail) => {
    doc.fontSize(8.5).fillColor(colors.mediumText).font('Helvetica');
    doc.text(`  •  ${detail}`, 66, detailY, { width: pageWidth - 40 });
    detailY += 14;
  });

  currentY += cardHeight + 12;
});

// ============================================================
// FINAL SUMMARY BOX
// ============================================================
checkPageBreak(100);
currentY += 5;

drawRect(50, currentY, pageWidth, 70, colors.darkBg, 8);
doc.fontSize(12).fillColor(colors.white).font('Helvetica-Bold');
doc.text('📌  Résumé des actions prioritaires', 62, currentY + 10);

doc.fontSize(8.5).fillColor(colors.lightGray).font('Helvetica');
const summaryItems = [
  '1. Ajuster les prix : Premium 19.99$ | Advanced 49.99$ | Pro 89.99$ | Elite 149.99$ ou 199.99$',
  '2. Lancer avec le code promo LAUNCH30 (-30%) pendant les 3 premiers mois',
  '3. Activer l\'essai gratuit 7 jours sur Premium dès le mois 4',
  '4. Planifier les promos saisonnières (Black Friday -50%, Nouvel An -25%)',
];
let sumY = currentY + 26;
summaryItems.forEach((item) => {
  doc.text(item, 62, sumY, { width: pageWidth - 24 });
  sumY += 12;
});

currentY += 80;

// ============================================================
// FOOTER
// ============================================================
checkPageBreak(60);
currentY += 10;
drawLine(50, currentY, 50 + pageWidth, currentY, colors.primary, 2);
currentY += 15;

doc.fontSize(9).fillColor(colors.primary).font('Helvetica-Bold');
doc.text('CryptoIA © 2026', 50, currentY);
doc.fontSize(8).fillColor(colors.gray).font('Helvetica');
doc.text('Document généré le 20 février 2026 — Usage interne uniquement', 50, currentY + 14);
doc.text('www.cryptoia.ca', 50, currentY + 26);

// Finalize
doc.end();

stream.on('finish', () => {
  console.log(`✅ PDF généré avec succès: ${outputPath}`);
  const stats = fs.statSync(outputPath);
  console.log(`📄 Taille: ${(stats.size / 1024).toFixed(1)} KB`);
});