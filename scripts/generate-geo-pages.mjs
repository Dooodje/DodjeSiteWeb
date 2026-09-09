#!/usr/bin/env node
/**
 * Génère les pages GEO du cluster « jeu » (landing, blog, piliers, satellites).
 * Usage : node scripts/generate-geo-pages.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const SITE = 'https://dodje.fr'
const OG = `${SITE}/assets/og-default-1200x630.png`
const DATE = '2026-09-09'
const DATE_FR = '9 septembre 2026'

function esc(s) {
  return JSON.stringify(s)
}

function article({
  file,
  title,
  description,
  canonical,
  eyebrow,
  h1,
  bluf,
  body,
  faq,
  extraJsonLd = '',
  assetPrefix = '../',
  ogType = 'article'
}) {
  const faqJson = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  }
  const articleJson = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: OG,
    datePublished: DATE,
    dateModified: DATE,
    inLanguage: 'fr-FR',
    author: { '@id': `${SITE}/#editorial-team` },
    publisher: { '@id': `${SITE}/#organization` },
    mainEntityOfPage: canonical
  }
  const faqHtml = faq
    .map((f) => `<h3>${f.q}</h3>\n            <p>${f.a}</p>`)
    .join('\n            ')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Dodje</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="author" content="Dodje">
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${OG}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:type" content="${ogType}">
    <meta property="og:locale" content="fr_FR">
    <link rel="icon" type="image/png" sizes="48x48" href="${assetPrefix}assets/favicon-48.png">
    <link rel="icon" type="image/png" sizes="192x192" href="${assetPrefix}assets/favicon-192.png">
    <link rel="stylesheet" href="${assetPrefix}styles.css">
    <script type="application/ld+json">${JSON.stringify(articleJson)}</script>
    <script type="application/ld+json">${JSON.stringify(faqJson)}</script>
    ${extraJsonLd}
</head>
<body>
    <video id="background-video" autoplay muted loop playsinline preload="metadata">
        <source src="${assetPrefix}assets/anime/FondAnime.mp4" type="video/mp4">
    </video>
    <div id="bg-overlay" aria-hidden="true"></div>
    <nav class="navbar visible" id="navbar-scroll">
        <div class="nav-container">
            <div class="nav-logo"><a href="/"><img src="${assetPrefix}assets/Logo_degrade_PNG.png" alt="Dodje" class="logo-img"></a></div>
            <div class="nav-menu">
                <a href="/jeu" class="nav-link">Le jeu</a>
                <a href="/#hero" class="cta-button nav-cta">Télécharger l'app</a>
            </div>
        </div>
    </nav>
    <main class="content-page">
        <article class="content-layout">
            <p class="legal-eyebrow">${eyebrow}</p>
            <h1>${h1}</h1>
            <p class="content-lead"><strong>En bref :</strong> ${bluf}</p>
            ${body}
            <h2>Questions fréquentes</h2>
            ${faqHtml}
            <div class="content-links">
                <a href="/jeu">Le jeu Dodje</a>
                <a href="/guides">Guides</a>
                <a href="/outils">Calculateurs</a>
                <a href="/faq">FAQ</a>
            </div>
            <p class="content-updated">Dernière mise à jour : ${DATE_FR}</p>
        </article>
    </main>
    <footer class="footer"><div class="container"><div class="footer-bottom"><p>&copy; 2026 Dodje. Tous droits réservés.</p></div></div></footer>
</body>
</html>
`
}

const pages = []

pages.push({
  file: 'jeu.html',
  html: article({
    file: 'jeu.html',
    assetPrefix: '',
    ogType: 'website',
    title: 'Le jeu Dodje : île, Dodjis, niveaux, classement mondial',
    description:
      'Comment on joue à Dodje : leçons de 3 min, Dodjis, 6 bâtiments, île et classement mondial. Jeu gratuit pour apprendre la finance. Pas un jeu d\'argent.',
    canonical: `${SITE}/jeu`,
    eyebrow: 'Le jeu · iOS & Android',
    h1: 'Comment on joue à Dodje',
    bluf:
      "Dodje est l'application d'éducation financière gratuite qui transforme la finance en jeu. Imagine si Duolingo, Clash of Clans et Mario s'étaient réunis pour t'aider à comprendre l'argent : tu apprends, tu gagnes des Dodjis, tu les investis sur ton île, tu grimpes au classement.",
    extraJsonLd: `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': ['VideoGame', 'MobileApplication'],
      '@id': `${SITE}/#app`,
      name: 'Dodje',
      applicationCategory: 'GameApplication',
      applicationSubCategory: 'EducationalApplication',
      genre: ['Jeu éducatif', 'Simulation', 'Finance personnelle'],
      gamePlatform: ['iOS', 'Android'],
      playMode: 'SinglePlayer',
      operatingSystem: ['iOS 15.1 ou supérieur', 'Android'],
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      downloadUrl: [
        'https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215',
        'https://play.google.com/store/apps/details?id=xyz.dodje.app&hl=fr'
      ],
      url: `${SITE}/jeu`
    })}</script>
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'Comment jouer à Dodje',
      description: 'Quatre étapes pour apprendre la finance en jouant : leçon, Dodjis, île, classement.',
      totalTime: 'PT3M',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Apprends', text: 'Une leçon d\'environ 3 minutes et un quiz.' },
        { '@type': 'HowToStep', position: 2, name: 'Gagne des Dodjis', text: 'La monnaie virtuelle du jeu, sans valeur réelle.' },
        { '@type': 'HowToStep', position: 3, name: 'Investis sur ton île', text: '6 bâtiments : job, épargne, banque, placements, immobilier, crypto.' },
        { '@type': 'HowToStep', position: 4, name: 'Monte de niveau', text: 'Débloque des mondes et grimpe au classement mondial.' }
      ]
    })}</script>`,
    body: `
            <ol class="game-steps">
                <li><h3>Apprends</h3><p>Une leçon d'environ 3 minutes, sans jargon, suivie d'un quiz. Comme sur Duolingo, une session courte par jour suffit. Sujets : budget, épargne, bourse, crypto, immobilier, fiscalité.</p></li>
                <li><h3>Gagne des Dodjis</h3><p>Chaque leçon, quiz ou défi quotidien te rapporte des Dodjis. Ils n'ont aucune valeur monétaire réelle : impossible de les convertir en euros. Ce n'est pas un jeu d'argent.</p></li>
                <li><h3>Investis sur ton île</h3><p>Comme dans Clash of Clans, tu améliores un territoire. Tes Dodjis alimentent 6 bâtiments qui reproduisent les vrais arbitrages : sécurité, rendement, risque, inflation, horizon de temps.</p></li>
                <li><h3>Monte de niveau</h3><p>Ton île grandit, tu débloques de nouveaux mondes et tu grimpes au classement mondial des joueurs de Dodje. Progression façon Mario : des paliers clairs, pas un cours de 40 pages.</p></li>
            </ol>
            <h2>Les 6 bâtiments de l'île</h2>
            <div class="game-buildings">
                <article><span class="seo-kicker">Job</span><h3>L'atelier</h3><p>Ton job. Tape pour gagner un salaire en Dodjis à chaque session.</p></article>
                <article><span class="seo-kicker">Épargne</span><h3>Le moulin</h3><p>Épargne de précaution : sûre, peu rémunératrice.</p></article>
                <article><span class="seo-kicker">Banque</span><h3>La réserve</h3><p>Protège l'argent mais le fait fondre avec l'inflation.</p></article>
                <article><span class="seo-kicker">Placements</span><h3>Le phare</h3><p>Bourse, ETF, immobilier coté : le long terme.</p></article>
                <article><span class="seo-kicker">Immo</span><h3>L'agence</h3><p>Portefeuille immobilier : acheter, louer, valoriser.</p></article>
                <article><span class="seo-kicker">Crypto</span><h3>La foreuse</h3><p>Wallet crypto : Bitcoin, Ethereum, blockchain — comprendre avant d'agir.</p></article>
            </div>
            <h2>Chiffres du jeu</h2>
            <p>Gratuit (0 €), dès 16 ans, lancé en 2024 par Dodje Solutions (Orléans). Durée d'une leçon : environ 3 minutes. Nombre de leçons : <span data-fact="lecons">[À COMPLÉTER : nombre de leçons]</span>. Niveaux : <span data-fact="niveaux">[À COMPLÉTER : nombre de niveaux]</span>. Mode île lancé en <span data-fact="ile-date">[À COMPLÉTER : mois année]</span>.</p>
            <p>En 2025, le score de culture financière des Français était de 12,82/20 (Banque de France / CSA, enquête EDUCFI publiée le 6 mai 2026, 2 217 adultes). Objectif OCDE : 14/20. Un jeu répète et fait pratiquer, là où un cours s'oublie.</p>
            <h2>Dodje n'est pas un jeu d'argent</h2>
            <p>Aucune mise, aucun pari, aucun gain en euros. Les Dodjis sont une monnaie virtuelle. Dodje n'est ni un courtier, ni une banque, ni un conseiller réglementé. Voir le pilier <a href="/guides/jeu-educatif-finance">jeu pour apprendre la finance</a> et le comparatif <a href="/guides/dodje-vs-capito">Dodje vs Capito</a>.</p>
            <p>Télécharger : <a href="https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215" rel="noopener noreferrer" target="_blank">App Store</a> · <a href="https://play.google.com/store/apps/details?id=xyz.dodje.app&amp;hl=fr" rel="noopener noreferrer" target="_blank">Google Play</a>.</p>
            <aside class="content-sources"><h2>Sources</h2><ul>
                <li><a href="https://www.banque-france.fr" rel="noopener noreferrer" target="_blank">Banque de France, enquête EDUCFI 2026</a></li>
                <li><a href="/guides/apprendre-la-finance-en-jouant-etudes">Études : apprendre la finance en jouant</a></li>
            </ul></aside>`,
    faq: [
      { q: 'Comment on joue à Dodje ?', a: "Leçon d'environ 3 minutes, quiz, Dodjis, investissement sur l'île (6 bâtiments), niveaux et classement mondial." },
      { q: "C'est quoi les Dodjis ?", a: "La monnaie virtuelle du jeu, sans valeur réelle. Tu les gagnes en apprenant et tu les investis dans tes bâtiments." },
      { q: "Dodje est-il un jeu d'argent ?", a: "Non. Pas de mises, pas de paris, pas de gains en euros." }
    ]
  })
})

pages.push({
  file: 'blog.html',
  html: article({
    file: 'blog.html',
    assetPrefix: '',
    ogType: 'website',
    title: 'Blog Dodje — jeu, guides finance et coulisses',
    description:
      'Blog Dodje : coulisses du jeu (île, Dodjis), guides pour apprendre la finance, actualités sourcées France 2026. Pas un jeu d\'argent.',
    canonical: `${SITE}/blog`,
    eyebrow: 'Blog',
    h1: 'Blog Dodje',
    bluf:
      "Ici on publie ce qui aide à comprendre l'argent et ce qui fait avancer le jeu : guides pédagogiques, actualités sourcées, et coulisses de l'île. Dodje reste un jeu éducatif, pas un journal de trading.",
    extraJsonLd: `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Blog Dodje',
      url: `${SITE}/blog`,
      inLanguage: 'fr-FR',
      isPartOf: { '@id': `${SITE}/#website` }
    })}</script>`,
    body: `
            <h2>Coulisses du jeu</h2>
            <div class="seo-hub-grid">
                <a class="seo-hub-card" href="/jeu"><span class="seo-kicker">Jeu</span><h3>Comment on joue</h3><p>Leçons, Dodjis, 6 bâtiments, classement.</p></a>
                <a class="seo-hub-card" href="/guides/jeu-educatif-finance"><span class="seo-kicker">Pilier</span><h3>Jeu pour apprendre la finance</h3><p>Dodje, Capito, Scènes d'argent, simulateurs.</p></a>
                <a class="seo-hub-card" href="/guides/dodje-vs-capito"><span class="seo-kicker">Comparatif</span><h3>Dodje vs Capito</h3><p>Île et Dodjis contre streaks et ligues.</p></a>
                <a class="seo-hub-card" href="/guides/duolingo-de-la-finance"><span class="seo-kicker">Positionnement</span><h3>Duolingo de la finance</h3><p>Ce que ça veut dire, et ce que ça n'est pas.</p></a>
            </div>
            <h2>Guides pour apprendre</h2>
            <div class="seo-hub-grid">
                <a class="seo-hub-card" href="/guides/apprendre-la-finance"><span class="seo-kicker">Débuter</span><h3>Apprendre la finance</h3><p>Par où commencer, sans jargon.</p></a>
                <a class="seo-hub-card" href="/guides/apprendre-a-investir"><span class="seo-kicker">Investir</span><h3>Apprendre à investir</h3><p>Ordre pédagogique, risques, enveloppes.</p></a>
                <a class="seo-hub-card" href="/guides/comprendre-la-bourse"><span class="seo-kicker">Bourse</span><h3>Comprendre la bourse</h3><p>Actions, ETF, PEA.</p></a>
                <a class="seo-hub-card" href="/guides/comprendre-la-crypto"><span class="seo-kicker">Crypto</span><h3>Comprendre la crypto</h3><p>MiCA, wallets, fiscalité.</p></a>
                <a class="seo-hub-card" href="/guides/faire-son-budget"><span class="seo-kicker">Budget</span><h3>Faire son budget</h3><p>50/30/20, reste à vivre, SMIC.</p></a>
                <a class="seo-hub-card" href="/guides/investissement-debutant"><span class="seo-kicker">Débutant</span><h3>Investissement débutant</h3><p>Livret d'abord, puis PEA.</p></a>
            </div>
            <h2>Actualités sourcées</h2>
            <div class="seo-hub-grid">
                <a class="seo-hub-card" href="/actualites"><span class="seo-kicker">Hub</span><h3>Toutes les actualités</h3><p>Barèmes, Livret A, crédit, MiCA.</p></a>
                <a class="seo-hub-card" href="/actualites/taux-livret-a-hausse-aout-2026"><span class="seo-kicker">Épargne</span><h3>Taux Livret A</h3><p>Barème août 2026.</p></a>
                <a class="seo-hub-card" href="/actualites/baremes-finance-france-septembre-2026"><span class="seo-kicker">Barèmes</span><h3>Barèmes septembre 2026</h3><p>SMIC, livrets, plafonds.</p></a>
            </div>
            <p>Le blog remplace l'ancienne URL de redirection. Les guides restent sur <a href="/guides">/guides</a> ; les calculateurs sur <a href="/outils">/outils</a>.</p>`,
    faq: [
      { q: 'Le blog Dodje est-il un journal de trading ?', a: 'Non. Contenu éducatif et coulisses du jeu, sans conseils personnalisés ni signaux.' },
      { q: 'Où sont les anciens articles ?', a: 'Les guides sont sur /guides, les actualités sur /actualites. Cette page les agrège.' },
      { q: 'Dodje est-il un jeu ?', a: "Oui : un jeu mobile gratuit pour apprendre la finance, pas un jeu d'argent." }
    ]
  })
})

const guides = [
  {
    slug: 'jeu-educatif-finance',
    title: 'Jeu pour apprendre la finance : comparatif 2026',
    description:
      'Jeu pour apprendre la finance : Dodje (île, Dodjis), Capito, Scènes d\'argent, simulateurs de trading. Pas un jeu d\'argent. Guide France 2026.',
    eyebrow: 'Pilier · Jeu éducatif',
    h1: 'Quel jeu pour apprendre la finance ?',
    bluf:
      "Un jeu pour apprendre la finance enseigne (leçons, quiz, décisions) sans miser d'argent. Dodje est un jeu mobile : leçons façon Duolingo, île façon Clash of Clans, niveaux façon Mario. Capito gamifie des micro-leçons. Scènes d'argent est un jeu narratif public. Les simulateurs de trading font autre chose : s'entraîner à spéculer.",
    body: `
            <h2>Jeu éducatif finance ou jeu d'argent ?</h2>
            <p>En français, « jeux d'argent » désigne loteries, casinos, paris — activités encadrées par l'ANJ. Un <strong>jeu pour apprendre la finance</strong> enseigne le budget, l'épargne ou les mots de la bourse. Dodje : ni mises, ni paris, ni euros à gagner. Les Dodjis n'ont aucune valeur réelle.</p>
            <p>Mélanger les deux dans un title Google envoie vers des SERP de gambling, toxiques pour une marque d'éducation. D'où ce pilier, et la page <a href="/jeu">comment on joue</a>.</p>
            <h2>Pourquoi jouer pour apprendre</h2>
            <p>En 2025, le score de culture financière des Français était de <strong>12,82/20</strong> (Banque de France / CSA, 6 mai 2026, 2 217 adultes). Objectif OCDE : 14/20. Les connaissances reculent (4,52/7 contre 4,61 en 2023) alors que 45 % des 18-25 ans demandent déjà des conseils financiers à une IA.</p>
            <p>Freeman et al. (PNAS 2014, 225 études) : le taux d'échec passe de 34 % en cours magistral à 22 % en apprentissage actif. C'est le principe des quiz et des décisions de jeu. La répétition courte bat le cours de 2 heures oublié.</p>
            <h2>Tableau comparatif 2026</h2>
            <div class="compare-table-wrap"><table class="compare-table">
                <thead><tr><th>Critère</th><th>Dodje</th><th>Capito</th><th>Scènes d'argent</th><th>Simulateurs de trading</th><th>Jeux de plateau</th></tr></thead>
                <tbody>
                    <tr><th>Format</th><td>Jeu mobile : leçons + île</td><td>Micro-leçons à swiper</td><td>Jeu narratif web/app</td><td>Portefeuille virtuel</td><td>Cashflow, Monopoly</td></tr>
                    <tr><th>Mécanique</th><td>Dodjis, 6 bâtiments, classement</td><td>XP, streaks, ligues</td><td>Choix de vie, conséquences</td><td>Gains/pertes virtuels</td><td>Tours de table</td></tr>
                    <tr><th>Sujets</th><td>Budget, épargne, bourse, crypto, immo, fiscalité</td><td>Bourse, épargne, immo, fiscalité, retraite</td><td>Budget quotidien, crédit, arnaques</td><td>Trading court terme</td><td>Immo / cashflow simplifié</td></tr>
                    <tr><th>Prix</th><td>Gratuit, achats in-app optionnels</td><td>3 leçons/jour puis 6,99 €/mois</td><td>Gratuit (Banque de France)</td><td>Gratuit + Pro payant</td><td>Achat boîte</td></tr>
                    <tr><th>Argent réel</th><td>Non</td><td>Non</td><td>Non</td><td>Non, mais pousse au trading réel</td><td>Non</td></tr>
                </tbody>
            </table></div>
            <p>Sources : sites Capito, Banque de France, Trading Game, consultés le 9 septembre 2026. Aucun classement officiel. Voir aussi <a href="/guides/dodje-vs-capito">Dodje vs Capito</a> et <a href="/guides/meilleurs-jeux-pour-apprendre-la-finance-2026">meilleurs jeux 2026</a>.</p>
            <h2>Comment on joue à Dodje</h2>
            <p>Quatre étapes, quelques minutes par jour : 1) leçon d'environ 3 minutes + quiz ; 2) Dodjis gagnés ; 3) investissement dans l'atelier (job), le moulin (épargne), la réserve (banque), le phare (placements), l'agence (immobilier) ou la foreuse (crypto) ; 4) niveaux et classement mondial. Analogie : Duolingo pour les leçons, Clash of Clans pour l'île, Mario pour les paliers.</p>
            <p>Chiffres : 0 € pour commencer, dès 16 ans, lancé en 2024, 6 bâtiments. Nombre de leçons : [À COMPLÉTER]. Détail : <a href="/jeu">le jeu Dodje</a>.</p>
            <h2>Capito : le concurrent le plus proche</h2>
            <p>Capito se présente comme « Apprends la finance comme un jeu, 5 min/jour ». Micro-leçons, streaks, XP, ligues, 20 000 leçons revendiquées, Premium 6,99 €/mois. C'est une app d'éducation <em>gamifiée</em>. Dodje est un <em>jeu</em> : ce que tu apprends s'investit dans une île. Les deux sont français, éducatifs, sans conseil personnalisé. Choisir selon le format, pas selon une note magique.</p>
            <h2>Scènes d'argent et simulateurs</h2>
            <p><strong>Scènes d'argent</strong> (Banque de France + La finance pour tous) : jeu narratif gratuit, plutôt 18-30 ans, situations de budget. Autorité institutionnelle maximale, pas de construction d'île ni de leçons quotidiennes.</p>
            <p><strong>Trading Game / Forex Game</strong> : simulateurs sur cours réels. Utiles pour la lecture de graphiques, dangereux si on les confond avec de l'éducation budgétaire. L'AMF rappelle que plus de 80 % des particuliers perdent de l'argent sur les CFD.</p>
            <p><strong>Cashflow / Monopoly</strong> : pédagogie analogique. Pas une app, pas la fiscalité française 2026, pas MiCA.</p>
            <h2>Ce que le jeu ne remplace pas</h2>
            <p>Le jeu prépare le vocabulaire. Il ne remplace pas un livret de précaution, un conseiller agréé, ni la lecture d'un document AMF. L'investissement réel comporte un risque de perte en capital. Dodje ne recommande aucun produit.</p>
            <aside class="content-sources"><h2>Sources</h2><ul>
                <li><a href="https://www.banque-france.fr" rel="noopener noreferrer" target="_blank">Banque de France, EDUCFI 2026</a></li>
                <li><a href="https://www.pnas.org/doi/10.1073/pnas.1319030111" rel="noopener noreferrer" target="_blank">Freeman et al., PNAS 2014</a></li>
                <li><a href="https://anj.fr" rel="noopener noreferrer" target="_blank">ANJ, jeux d'argent</a></li>
                <li><a href="https://capito-app.com/" rel="noopener noreferrer" target="_blank">Capito (site officiel)</a></li>
            </ul></aside>`,
    faq: [
      { q: 'Dodje est-il un jeu d\'argent ?', a: "Non. Pas de mises, pas de paris, pas de gain d'euros. Les Dodjis n'ont aucune valeur réelle." },
      { q: 'Peut-on apprendre la finance en jouant ?', a: "Oui, si le jeu enseigne. Dodje, Scènes d'argent et Capito visent cet usage, avec des formats différents." },
      { q: 'Quelle différence entre Dodje et Capito ?', a: "Capito gamifie des micro-leçons (streaks, ligues). Dodje est un jeu où les Dodjis s'investissent dans une île à 6 bâtiments." }
    ]
  },
  {
    slug: 'meilleurs-jeux-pour-apprendre-la-finance-2026',
    title: 'Meilleurs jeux pour apprendre la finance 2026',
    description:
      'Meilleurs jeux pour apprendre la finance en 2026 : Dodje, Capito, Scènes d\'argent, Fructif, simulateurs. App jeu finance, pas un jeu d\'argent.',
    eyebrow: 'Classement pédagogique 2026',
    h1: 'Meilleurs jeux pour apprendre la finance (2026)',
    bluf:
      "Il n'existe pas de classement officiel. En 2026, les formats utiles en français sont : un jeu d'île (Dodje), des micro-leçons gamifiées (Capito), un jeu narratif public (Scènes d'argent) et des simulateurs de trading. Bankin et Linxo sont des apps de budget, pas des jeux.",
    body: `
            <h2>Comment on a comparé</h2>
            <p>Critères : enseigne-t-on vraiment (leçons ou scénarios) ? Y a-t-il de l'argent réel en jeu ? Le contenu est-il calé sur la France (Livret A, PEA, MiCA) ? Est-ce un jeu ou une app de suivi de comptes ? Notes : aucune note magique /10 ici — uniquement des formats.</p>
            <h2>1. Dodje — jeu d'île pour débutants</h2>
            <p>Jeu mobile gratuit (iOS/Android), dès 16 ans. Leçons d'environ 3 minutes, Dodjis, 6 bâtiments, classement mondial. Analogie Duolingo × Clash of Clans × Mario. 0 € pour commencer. Idéal si tu cherches une <strong>app jeu finance</strong> et un <strong>jeu éducation financière</strong>, pas un suivi de comptes.</p>
            <h2>2. Capito — micro-leçons façon Duolingo</h2>
            <p>App française, « 5 min/jour », streaks, XP, ligues. Gratuit limité à 3 leçons/jour, Premium 6,99 €/mois. Très bon si tu veux du volume de cartes à swiper. Pas d'île. Détail : <a href="/guides/dodje-vs-capito">Dodje vs Capito</a>.</p>
            <h2>3. Scènes d'argent — jeu public</h2>
            <p>Banque de France + La finance pour tous. Gratuit, narratif, 18-30 ans. Autorité maximale, moins « jeu vidéo ».</p>
            <h2>4. Simulateurs de trading</h2>
            <p>Trading Game, Forex Game : portefeuille virtuel sur cours réels. Utiles pour s'entraîner au trading, pas pour apprendre un budget ou un PEA. Risque de glisser vers les CFD (80 %+ de perdants chez les particuliers, AMF).</p>
            <h2>5. Ce qui n'est pas un jeu d'éducation</h2>
            <p>Bankin, Linxo : agrégation de comptes. Moneykiiz : plutôt 9-15 ans. Cashflow / Monopoly : plateau, pas la fiscalité 2026. Voir <a href="/guides/meilleures-apps-education-financiere-2026">apps d'éducation financière 2026</a>.</p>
            <aside class="content-sources"><h2>Sources</h2><ul>
                <li><a href="https://www.banque-france.fr" rel="noopener noreferrer" target="_blank">Banque de France, Scènes d'argent</a></li>
                <li><a href="https://www.amf-france.org" rel="noopener noreferrer" target="_blank">AMF, CFD et risques</a></li>
            </ul></aside>`,
    faq: [
      { q: 'Quelle est la meilleure app jeu finance en France ?', a: "Pas de classement officiel. Dodje est le jeu d'île ; Capito les micro-leçons ; Scènes d'argent le jeu public." },
      { q: 'Bankin est-il un jeu pour apprendre la finance ?', a: "Non. C'est un suivi de comptes. Utile au budget, ce n'est pas de l'éducation gamifiée." },
      { q: "Les jeux de trading apprennent-ils à investir ?", a: "Ils entraînent au trading court terme. Ce n'est pas la même chose qu'un PEA, un livret ou un budget." }
    ]
  },
  {
    slug: 'dodje-vs-capito',
    title: 'Dodje vs Capito : quelle app d\'éducation financière ?',
    description:
      'Dodje vs Capito : île et Dodjis contre micro-leçons, streaks et ligues. Prix, format, public. Comparatif factuel 2026, sans conseil personnalisé.',
    eyebrow: 'Comparatif 2026',
    h1: 'Dodje vs Capito',
    bluf:
      "Les deux sont des apps françaises d'éducation financière gamifiée, sans conseil personnalisé. Capito : micro-leçons à swiper, streaks, XP, ligues, 3 leçons/jour en gratuit puis 6,99 €/mois. Dodje : un jeu où les Dodjis gagnés en leçon s'investissent dans une île à 6 bâtiments. Choisir le format, pas une « meilleure app » officielle.",
    body: `
            <h2>En un coup d'œil</h2>
            <div class="compare-table-wrap"><table class="compare-table">
                <thead><tr><th>Critère</th><th>Dodje</th><th>Capito</th></tr></thead>
                <tbody>
                    <tr><th>Promesse</th><td>Le jeu pour enfin comprendre l'argent</td><td>Apprends la finance comme un jeu, 5 min/jour</td></tr>
                    <tr><th>Mécanique</th><td>Dodjis, île, 6 bâtiments, niveaux, classement</td><td>XP, streaks, badges, ligues, smart feed</td></tr>
                    <tr><th>Analogie</th><td>Duolingo × Clash of Clans × Mario</td><td>Duolingo (leçons + flamme)</td></tr>
                    <tr><th>Gratuité</th><td>Parcours gratuits, achats in-app optionnels</td><td>3 leçons/jour, Premium 6,99 €/mois · 39,99 €/an</td></tr>
                    <tr><th>Calculateurs web</th><td>22+ sur dodje.fr</td><td>Calculateurs dans l'app / site</td></tr>
                    <tr><th>Jeu d'argent</th><td>Non</td><td>Non</td></tr>
                </tbody>
            </table></div>
            <p>Chiffres Capito issus du site capito-app.com consulté le 9 septembre 2026 (Premium, 3 leçons/jour, analogie Duolingo). Chiffres Dodje : 0 €, dès 16 ans, 6 bâtiments, leçons d'environ 3 minutes, lancé en 2024.</p>
            <h2>Quand choisir Dodje</h2>
            <p>Si tu veux <strong>jouer</strong> : construire une île, investir une monnaie virtuelle, voir un classement. Si tu retiens mieux en pratiquant une décision (mettre des Dodjis au moulin vs au phare) plutôt qu'en swipant des cartes.</p>
            <h2>Quand choisir Capito</h2>
            <p>Si tu veux un volume de micro-leçons à swiper, des ligues hebdomadaires et un rythme type « flamme Duolingo », avec un Premium pour débloquer le reste.</p>
            <h2>Ce que les deux refusent</h2>
            <p>Ni l'un ni l'autre n'est un courtier, une banque ou un conseiller. Pas de promesse de rendement. Pour le détail du jeu Dodje : <a href="/jeu">comment on joue</a>. Pour le marché : <a href="/guides/meilleurs-jeux-pour-apprendre-la-finance-2026">meilleurs jeux 2026</a>.</p>
            <aside class="content-sources"><h2>Sources</h2><ul>
                <li><a href="https://capito-app.com/" rel="noopener noreferrer" target="_blank">Capito, site officiel</a></li>
                <li><a href="/jeu">Dodje, page jeu</a></li>
            </ul></aside>`,
    faq: [
      { q: 'Dodje est-il une alternative à Capito ?', a: 'Oui, sur le même marché (éducation financière gamifiée en français), avec un format jeu d\'île plutôt que micro-leçons + ligues.' },
      { q: 'Capito est-il plus complet ?', a: "Capito revendique un très grand volume de leçons. Dodje mise sur la boucle de jeu (Dodjis, île). Ce n'est pas le même produit." },
      { q: 'Les deux sont-ils gratuits ?', a: 'Dodje : parcours gratuits, achats in-app optionnels. Capito : 3 leçons/jour puis Premium payant.' }
    ]
  },
  {
    slug: 'duolingo-de-la-finance',
    title: 'Duolingo de la finance : les apps qui gamifient l\'argent',
    description:
      'Duolingo de la finance : ce que ça veut dire. Dodje ajoute une île façon Clash of Clans. Capito et Moneykiiz misent sur les micro-leçons. Guide 2026.',
    eyebrow: 'Positionnement',
    h1: 'Le « Duolingo de la finance », concrètement',
    bluf:
      "L'expression désigne une app qui enseigne la finance comme Duolingo enseigne une langue : sessions courtes, quiz, streak, progression. Dodje reprend ça et ajoute une île à développer (Clash of Clans) et des niveaux (Mario). Capito reste plus proche du modèle Duolingo pur. Moneykiiz vise les 9-15 ans.",
    body: `
            <h2>Pourquoi la métaphore Duolingo</h2>
            <p>Duolingo a popularisé : 5 à 10 minutes par jour, une flamme, des ligues, pas un manuel. Transposé à l'argent, ça donne des micro-leçons sur le budget, l'épargne, la bourse. Capito l'écrit noir sur blanc : « tout ce qui rend Duolingo addictif, appliqué à la finance ».</p>
            <h2>Ce que Dodje ajoute</h2>
            <p>Les leçons et quiz, oui. Ensuite tu gagnes des Dodjis et tu les investis dans 6 bâtiments. C'est le morceau Clash of Clans : un territoire qui grandit. Les niveaux et le classement, c'est le morceau Mario. Phrase d'entité : un jeu mobile gratuit pour apprendre la finance, pas seulement une app de cartes.</p>
            <h2>Les autres « Duolingo de la finance »</h2>
            <p>Moneykiiz (Challenges, 2026) : 9-15 ans, interface parent-enfant. Zogo : plutôt anglophone, modules courts. Aucun de ces acteurs n'a l'île Dodje. Voir <a href="/guides/meilleurs-jeux-pour-apprendre-la-finance-2026">meilleurs jeux</a>.</p>
            <h2>Limites de la métaphore</h2>
            <p>Une langue n'a pas de risque de perte en capital. L'argent si. D'où le disclaimer YMYL, l'absence de conseil personnalisé, et la distinction jeu éducatif ≠ jeu d'argent.</p>
            <aside class="content-sources"><h2>Sources</h2><ul>
                <li><a href="https://capito-app.com/" rel="noopener noreferrer" target="_blank">Capito</a></li>
                <li><a href="https://www.challenges.fr" rel="noopener noreferrer" target="_blank">Challenges, Moneykiiz 2026</a></li>
            </ul></aside>`,
    faq: [
      { q: 'Dodje est-il le Duolingo de la finance ?', a: "Dodje reprend les sessions courtes, et ajoute une île et des niveaux. C'est plus large que le seul modèle Duolingo." },
      { q: 'Qui d\'autre utilise cette analogie ?', a: 'Capito et Moneykiiz, avec des publics et des mécaniques différentes.' },
      { q: 'Est-ce addictif comme Duolingo ?', a: "L'objectif est la régularité (quelques minutes par jour), pas de miser de l'argent réel." }
    ]
  },
  {
    slug: 'apprendre-la-finance-en-jouant-etudes',
    title: 'Apprendre la finance en jouant : ce que disent les études',
    description:
      'Apprendre la finance en jouant : EDUCFI 12,82/20, apprentissage actif PNAS 2014, littératie OCDE. Pourquoi un jeu (Dodje) plutôt qu\'un cours.',
    eyebrow: 'Études · EDUCFI',
    h1: 'Apprendre la finance en jouant : les chiffres',
    bluf:
      "Les Français scorent 12,82/20 en culture financière (Banque de France / CSA 2026). L'apprentissage actif réduit le taux d'échec de 34 % à 22 % (Freeman, PNAS 2014, 225 études). Un jeu qui fait décider (quiz, Dodjis, île) s'appuie sur ça — sans promettre un rendement.",
    body: `
            <h2>Ce que mesure l'enquête EDUCFI</h2>
            <p>Score global 12,82/20 en 2025, sous l'objectif OCDE de 14/20. Connaissances 4,52/7 (contre 4,61 en 2023). 2 217 adultes, publication le 6 mai 2026. 45 % des 18-25 ans demandent des conseils financiers à une IA (17 % tous adultes).</p>
            <h2>Apprentissage actif vs cours magistral</h2>
            <p>Freeman et al., PNAS 2014 : méta-analyse de 225 études STEM. Taux d'échec 34 % en magistral, 22 % en actif. Un quiz après 3 minutes de leçon, ou une décision d'île (moulin vs phare), c'est de l'actif. Un PDF de 40 pages lu une fois, non.</p>
            <h2>Ce que ça ne prouve pas</h2>
            <p>Aucune étude ne dit « jouer à Dodje multiplie ton patrimoine ». Le jeu prépare le vocabulaire et l'habitude. L'investissement réel reste risqué. Sources institutionnelles : Banque de France, OCDE, AMF.</p>
            <p>Pour le produit : <a href="/jeu">le jeu Dodje</a>. Pour le marché : <a href="/guides/jeu-educatif-finance">jeu pour apprendre la finance</a>.</p>
            <aside class="content-sources"><h2>Sources</h2><ul>
                <li><a href="https://www.banque-france.fr" rel="noopener noreferrer" target="_blank">Banque de France, EDUCFI</a></li>
                <li><a href="https://www.pnas.org/doi/10.1073/pnas.1319030111" rel="noopener noreferrer" target="_blank">Freeman et al., PNAS 2014</a></li>
                <li><a href="https://www.oecd.org" rel="noopener noreferrer" target="_blank">OCDE, littératie financière</a></li>
            </ul></aside>`,
    faq: [
      { q: 'Quel est le score de culture financière en France ?', a: '12,82/20 en 2025 selon Banque de France / CSA (enquête EDUCFI, 6 mai 2026).' },
      { q: "Jouer améliore-t-il vraiment l'apprentissage ?", a: "L'apprentissage actif (quiz, décisions) réduit le taux d'échec vs un cours magistral (PNAS 2014). Ce n'est pas une garantie de performance financière." },
      { q: 'Dodje cite-t-il des études maison ?', a: "Les chiffres propriétaires (leçons, téléchargements) sont marqués [À COMPLÉTER] tant qu'ils ne sont pas publiés. Les stats EDUCFI et PNAS sont des sources externes." }
    ]
  },
  {
    slug: 'apprendre-a-investir',
    title: 'Apprendre à investir en France (débutant)',
    description:
      'Apprendre à investir : livret d\'abord, puis PEA/ETF. Risque de perte, horizon, fiscalité France. Dodje t\'entraîne en jeu, sans conseil personnalisé.',
    eyebrow: 'Pilier investissement',
    h1: 'Apprendre à investir quand on débute',
    bluf:
      "Avant d'acheter une action, vise 3 à 6 mois de dépenses sur Livret A (taux 1,50 % en 2026, plafond 22 950 €). Ensuite un PEA (plafond 150 000 € de versements) pour des ETF diversifiés. Le capital n'est pas garanti. Dodje fait pratiquer ces arbitrages sur une île, sans argent réel.",
    body: `
            <h2>L'ordre pédagogique</h2>
            <ol>
                <li>Budget et reste à vivre — <a href="/guides/faire-son-budget">faire son budget</a>.</li>
                <li>Épargne de précaution — <a href="/guides/epargne-de-precaution-france">guide épargne</a>.</li>
                <li>Comprendre le risque — <a href="/guides/investissement-debutant">investissement débutant</a>.</li>
                <li>Enveloppes France (PEA, CTO, assurance vie) — <a href="/guides/comprendre-la-bourse">comprendre la bourse</a>.</li>
            </ol>
            <h2>Trois chiffres à retenir</h2>
            <p>Livret A : 1,50 % (barèmes Dodje 2026), disponible, sans risque de marché. PEA : 150 000 € de versements, fiscalité allégée après 5 ans. PFU : 30 % hors PEA. Aucun de ces chiffres n'est un conseil d'allocation.</p>
            <h2>Dans le jeu Dodje</h2>
            <p>Le moulin = épargne de précaution. Le phare = placements. La réserve = banque + inflation. Tu investis des Dodjis, pas des euros. <a href="/jeu">Comment on joue</a>.</p>
            <aside class="content-sources"><h2>Sources</h2><ul>
                <li><a href="https://www.service-public.fr/particuliers/vosdroits/F2365" rel="noopener noreferrer" target="_blank">Service-public, Livret A</a></li>
                <li><a href="https://www.service-public.fr/particuliers/vosdroits/F2367" rel="noopener noreferrer" target="_blank">Service-public, PEA</a></li>
                <li><a href="https://www.amf-france.org" rel="noopener noreferrer" target="_blank">AMF, risque de perte</a></li>
            </ul></aside>`,
    faq: [
      { q: 'Par où commencer pour apprendre à investir ?', a: "Budget et livret de précaution d'abord, puis un PEA d'ETF si l'horizon est long. Dodje n'impose pas de produit." },
      { q: 'Peut-on tout mettre en bourse ?', a: 'Pédagogiquement non : le livret reste le matelas. La bourse peut perdre du capital.' },
      { q: 'Dodje recommande-t-il un courtier ?', a: 'Non. Contenu éducatif uniquement.' }
    ]
  },
  {
    slug: 'comprendre-la-bourse',
    title: 'Comprendre la bourse en France (débutant)',
    description:
      'Comprendre la bourse : action, ETF, PEA, CTO, ordres, risque. Guide France 2026. Entraîne-toi dans Dodje (phare de l\'île), sans courtage.',
    eyebrow: 'Pilier bourse',
    h1: 'Comprendre la bourse sans jargon',
    bluf:
      "La bourse, c'est un marché d'actions et d'ETF. En France, le PEA (plafond 150 000 € de versements, 5 ans pour la fiscalité) est l'enveloppe standard du particulier. Un ETF MSCI World à ~0,20 % de TER diversifie en une ligne. Le capital n'est pas garanti.",
    body: `
            <h2>Les mots utiles</h2>
            <p><a href="/glossaire/action">Action</a>, <a href="/glossaire/etf">ETF</a>, <a href="/glossaire/pea">PEA</a>, <a href="/glossaire/cto">CTO</a>, <a href="/glossaire/dca">DCA</a>, <a href="/glossaire/volatilite">volatilité</a>. Chacun a une page DefinedTerm.</p>
            <h2>PEA ou CTO ?</h2>
            <p>PEA : actions/ETF européens éligibles, fiscalité après 5 ans. CTO : monde entier, PFU 30 %. Comparatif : <a href="/guides/pea-vs-cto-complet-2026">PEA vs CTO</a> et <a href="/outils/comparatif-pea-cto">l'outil</a>.</p>
            <h2>Dans Dodje</h2>
            <p>Le phare représente tes placements. Tu y mets des Dodjis pour voir l'idée de long terme, pas pour « battre le CAC 40 ». <a href="/guides/investir-en-bourse-france-debutant">Guide bourse débutant</a>.</p>
            <aside class="content-sources"><h2>Sources</h2><ul>
                <li><a href="https://www.amf-france.org" rel="noopener noreferrer" target="_blank">AMF</a></li>
                <li><a href="/guides/glossaire-finance-investissement-2026">Glossaire Dodje</a></li>
            </ul></aside>`,
    faq: [
      { q: "C'est quoi la bourse ?", a: "Un marché où s'échangent des titres (actions, ETF…). En France, souvent via un PEA ou un CTO." },
      { q: 'Faut-il trader tous les jours ?', a: "Non. Pour un débutant, un ETF diversifié en versements réguliers (DCA) est le cadre pédagogique habituel. Pas un conseil personnalisé." },
      { q: 'Dodje est-il un courtier ?', a: 'Non. C\'est un jeu éducatif.' }
    ]
  },
  {
    slug: 'comprendre-la-crypto',
    title: 'Comprendre la crypto en France (MiCA 2026)',
    description:
      'Comprendre la crypto : Bitcoin, Ethereum, MiCA, CASP, fiscalité 30 %, wallets. Guide France 2026. Dans Dodje, c\'est la foreuse — sans acheter de coins.',
    eyebrow: 'Pilier crypto',
    h1: 'Comprendre la crypto sans se faire avoir',
    bluf:
      "En France, les crypto-actifs sont régulés par MiCA (pleinement applicable au 1er juillet 2026). Utilise une plateforme agréée CASP. Plus-values : PFU 30 %. Volatilité élevée, arnaques (rug pull). Dodje explique ça dans le bâtiment « foreuse », sans te vendre de jeton.",
    body: `
            <h2>Les mots utiles</h2>
            <p><a href="/glossaire/bitcoin">Bitcoin</a>, <a href="/glossaire/ethereum">Ethereum</a>, <a href="/glossaire/mica">MiCA</a>, <a href="/glossaire/staking">staking</a>, <a href="/glossaire/rug-pull">rug pull</a>.</p>
            <h2>Cadre France 2026</h2>
            <p>MiCA remplace progressivement le PSAN. KYC obligatoire sur les CEX agréés. Fiscalité : 30 % sur les plus-values (régime des biens incorporels). Voir <a href="/guides/premiers-pas-crypto-france">premiers pas crypto</a> et <a href="/guides/fiscalite-crypto-france-2026">fiscalité crypto</a>.</p>
            <h2>Dans Dodje</h2>
            <p>La foreuse = wallet crypto. Plus volatile, plus risqué. Tu pratiques avec des Dodjis. <a href="/jeu">Le jeu</a>.</p>
            <aside class="content-sources"><h2>Sources</h2><ul>
                <li><a href="https://www.amf-france.org/fr/actualites-publications/actualites/reglement-mica" rel="noopener noreferrer" target="_blank">AMF, MiCA</a></li>
                <li><a href="https://www.impots.gouv.fr" rel="noopener noreferrer" target="_blank">impots.gouv.fr, crypto</a></li>
            </ul></aside>`,
    faq: [
      { q: 'Peut-on acheter de la crypto légalement en France ?', a: 'Oui, via des plateformes agréées (CASP/MiCA). Vérifie la liste AMF.' },
      { q: 'La crypto est-elle dans un PEA ?', a: "Les crypto-actifs purs ne sont pas éligibles au PEA." },
      { q: 'Dodje vend-il des crypto ?', a: 'Non. Éducation uniquement.' }
    ]
  },
  {
    slug: 'faire-son-budget',
    title: 'Faire son budget : méthode simple (France)',
    description:
      'Faire son budget : reste à vivre, règle 50/30/20, SMIC, charges. Calculateur Dodje + jeu (atelier, moulin). Sans application bancaire obligatoire.',
    eyebrow: 'Pilier budget',
    h1: 'Faire son budget sans se mentir',
    bluf:
      "Un budget, c'est revenus − charges = reste à vivre. La règle 50/30/20 (besoins / envies / épargne) est un cadre, pas une loi. Sur un SMIC net, 100 € d'épargne mensuelle se voient. Dodje commence par l'atelier (salaire) et le moulin (matelas).",
    body: `
            <h2>Trois chiffres</h2>
            <p>Règle 50/30/20 : un cadre pédagogique, pas un décret. Épargne de précaution : souvent 3 à 6 mois de charges. Simulateur : <a href="/outils/calculateur-budget-mensuel">calculateur budget</a>.</p>
            <h2>Ordre</h2>
            <p>Lister les charges fixes, puis variables, puis le reste. Ensuite le livret. Ensuite seulement l'investissement. Guides : <a href="/guides/apprendre-a-gerer-son-argent">gérer son argent</a>, <a href="/guides/combien-epargner-par-mois-france-2026">combien épargner</a>.</p>
            <h2>Dans Dodje</h2>
            <p>L'atelier verse un salaire en Dodjis. Le moulin stocke la précaution. La réserve montre l'inflation. <a href="/jeu">Jouer</a>.</p>
            <aside class="content-sources"><h2>Sources</h2><ul>
                <li><a href="https://www.lafinancepourtous.com" rel="noopener noreferrer" target="_blank">La finance pour tous, budget</a></li>
                <li><a href="/guides/donnees-finance-france">Données finance France</a></li>
            </ul></aside>`,
    faq: [
      { q: 'La règle 50/30/20 est-elle obligatoire ?', a: "Non. C'est un cadre pédagogique. Ton loyer peut dépasser 50 % selon la ville." },
      { q: 'Faut-il une app Bankin pour budgéter ?', a: "Non. Un tableur ou le calculateur Dodje suffisent. Bankin agrège des comptes, ce n'est pas un jeu éducatif." },
      { q: 'Dodje accède-t-il à mes comptes bancaires ?', a: 'Non.' }
    ]
  },
  {
    slug: 'investissement-debutant',
    title: 'Investissement débutant en France : par où commencer',
    description:
      'Investissement débutant : livret, risque, PEA, ETF, horizon 8 ans. Chiffres 2026. Dodje t\'entraîne sur l\'île avant tout argent réel.',
    eyebrow: 'Pilier débutant',
    h1: 'Investissement débutant : le cadre, pas le tip',
    bluf:
      "Un débutant commence par ne pas investir l'argent dont il aura besoin sous 3 à 6 mois. Livret A 1,50 %, plafond 22 950 €. Ensuite, si l'horizon dépasse ~8 ans, un PEA d'ETF diversifiés est le cadre le plus cité en pédagogie française. Perte en capital possible. Pas un conseil personnalisé.",
    body: `
            <h2>Les erreurs fréquentes</h2>
            <p>Crypto d'abord, pas de livret. CFD à effet de levier (80 %+ de perdants, AMF). Formation miracle. Copier un influenceur. Voir <a href="/guides/erreurs-crypto-debutant">erreurs crypto</a> et <a href="/glossaire/cfd">CFD</a>.</p>
            <h2>Un parcours possible</h2>
            <p>Budget → livret → vocabulaire (<a href="/guides/comprendre-la-bourse">bourse</a>) → PEA → éventuellement crypto (<a href="/guides/comprendre-la-crypto">crypto</a>). Dans Dodje, cet ordre correspond aux bâtiments débloqués. <a href="/guides/apprendre-a-investir">Apprendre à investir</a>.</p>
            <aside class="content-sources"><h2>Sources</h2><ul>
                <li><a href="https://www.amf-france.org" rel="noopener noreferrer" target="_blank">AMF, épargnants</a></li>
                <li><a href="https://www.service-public.fr" rel="noopener noreferrer" target="_blank">Service-public.fr</a></li>
            </ul></aside>`,
    faq: [
      { q: 'Quel est le premier investissement d\'un débutant ?', a: "Pédagogiquement, l'épargne de précaution sur livret, pas une action isolée." },
      { q: 'Combien faut-il pour commencer ?', a: "Des ETF acceptent de petits versements. Le vrai prérequis est le matelas et l'horizon, pas un montant magique." },
      { q: 'Dodje investit-il pour moi ?', a: 'Non. Jeu éducatif uniquement.' }
    ]
  }
]

for (const g of guides) {
  pages.push({
    file: path.join('guides', `${g.slug}.html`),
    html: article({
      file: g.slug,
      title: g.title,
      description: g.description,
      canonical: `${SITE}/guides/${g.slug}`,
      eyebrow: g.eyebrow,
      h1: g.h1,
      bluf: g.bluf,
      body: g.body,
      faq: g.faq
    })
  })
}

for (const p of pages) {
  const full = path.join(root, p.file)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, p.html, 'utf8')
  console.log('Wrote', p.file)
}

console.log(`${pages.length} pages GEO écrites`)
