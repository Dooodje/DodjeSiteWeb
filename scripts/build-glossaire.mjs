#!/usr/bin/env node
/**
 * Génère les pages /glossaire/[slug].html depuis data/glossaire-termes.json.
 * Relancer après toute modification du JSON : node scripts/build-glossaire.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const SITE = 'https://dodje.fr'
const OG = `${SITE}/assets/og-default-1200x630.png`
const data = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/glossaire-termes.json'), 'utf8'))

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const outDir = path.join(rootDir, 'glossaire')
fs.mkdirSync(outDir, { recursive: true })

const indexCards = []

for (const item of data.terms) {
  const url = `${SITE}/glossaire/${item.slug}`
  const related = (item.related || [])
    .map((href) => {
      const label = href.split('/').pop().replace(/-/g, ' ')
      return `<a href="${href}">${escapeHtml(label)}</a>`
    })
    .join('')

  const faq = [
    { q: item.faqQ, a: item.definition },
    {
      q: `${item.term} : Dodje donne-t-il un conseil personnalisé ?`,
      a: "Non. Définition pédagogique uniquement, sans recommandation d'investissement."
    },
    {
      q: 'Où apprendre ce terme en jouant ?',
      a: "Dans Dodje, un jeu mobile gratuit : leçons d'environ 3 minutes, Dodjis, île à développer. Pas un jeu d'argent."
    }
  ]

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(item.title)} | Glossaire Dodje</title>
    <meta name="description" content="${escapeHtml(item.definition.slice(0, 155))}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="author" content="Dodje">
    <link rel="canonical" href="${url}">
    <meta property="og:title" content="${escapeHtml(item.title)}">
    <meta property="og:description" content="${escapeHtml(item.definition.slice(0, 155))}">
    <meta property="og:image" content="${OG}">
    <meta property="og:url" content="${url}">
    <meta property="og:type" content="article">
    <meta property="og:locale" content="fr_FR">
    <link rel="icon" type="image/png" sizes="48x48" href="../assets/favicon-48.png">
    <link rel="icon" type="image/png" sizes="192x192" href="../assets/favicon-192.png">
    <link rel="stylesheet" href="../styles.css">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      "name": ${JSON.stringify(item.term)},
      "description": ${JSON.stringify(item.definition)},
      "url": "${url}",
      "inLanguage": "fr-FR",
      "inDefinedTermSet": "${SITE}${data.hub}"
    }
    </script>
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    })}</script>
</head>
<body>
    <video id="background-video" autoplay muted loop playsinline preload="metadata">
        <source src="../assets/anime/FondAnime.mp4" type="video/mp4">
    </video>
    <div id="bg-overlay" aria-hidden="true"></div>
    <nav class="navbar visible" id="navbar-scroll">
        <div class="nav-container">
            <div class="nav-logo"><a href="/"><img src="../assets/Logo_degrade_PNG.png" alt="Dodje" class="logo-img"></a></div>
            <div class="nav-menu">
                <a href="/guides/glossaire-finance-investissement-2026" class="nav-link">Glossaire</a>
                <a href="/#hero" class="cta-button nav-cta">Télécharger l'app</a>
            </div>
        </div>
    </nav>
    <main class="content-page">
        <article class="content-layout">
            <p class="legal-eyebrow">Glossaire · ${escapeHtml(item.category)}</p>
            <h1>${escapeHtml(item.title)}</h1>
            <p class="content-lead"><strong>En bref :</strong> ${escapeHtml(item.definition)}</p>
            <h2>Définition</h2>
            <p>${escapeHtml(item.definition)}</p>
            <p>Cette page fait partie du <a href="${data.hub}">glossaire finance Dodje</a>. Pour pratiquer le concept dans un jeu (sans miser d'argent), voir <a href="/jeu">comment on joue à Dodje</a>.</p>
            <h2>Questions fréquentes</h2>
            ${faq.map((f) => `<h3>${escapeHtml(f.q)}</h3>\n            <p>${escapeHtml(f.a)}</p>`).join('\n            ')}
            <div class="content-links">
                <a href="${data.hub}">Glossaire complet</a>
                ${related}
                <a href="/jeu">Le jeu Dodje</a>
            </div>
            <aside class="content-sources">
                <h2>Sources</h2>
                <ul>
                    <li><a href="${item.sourceUrl}" rel="noopener noreferrer" target="_blank">${escapeHtml(item.sourceTitle)}</a></li>
                    <li><a href="https://www.amf-france.org" rel="noopener noreferrer" target="_blank">AMF</a></li>
                </ul>
            </aside>
            <p class="content-updated">Dernière mise à jour : 9 septembre 2026</p>
        </article>
    </main>
    <footer class="footer"><div class="container"><div class="footer-bottom"><p>&copy; 2026 Dodje. Tous droits réservés.</p></div></div></footer>
</body>
</html>
`
  fs.writeFileSync(path.join(outDir, `${item.slug}.html`), html, 'utf8')
  indexCards.push(
    `<a class="seo-hub-card" href="/glossaire/${item.slug}"><span class="seo-kicker">${escapeHtml(item.category)}</span><h3>${escapeHtml(item.term)}</h3><p>${escapeHtml(item.title)}</p></a>`
  )
}

const indexPath = path.join(rootDir, 'guides/glossaire-finance-investissement-2026.html')
if (fs.existsSync(indexPath)) {
  let hub = fs.readFileSync(indexPath, 'utf8')
  const block = `<section id="pages-termes" class="glossaire-section">
                <h2>Pages par terme (longue traîne GEO)</h2>
                <p>Chaque définition a sa propre URL, avec schema DefinedTerm et FAQ, pour les requêtes « comprendre la bourse », « comprendre la crypto », ETF, PEA, MiCA.</p>
                <div class="seo-hub-grid">
                ${indexCards.join('\n                ')}
                </div>
            </section>`
  if (hub.includes('id="pages-termes"')) {
    hub = hub.replace(/<section id="pages-termes"[\s\S]*?<\/section>/, block)
  } else {
    hub = hub.replace(
      /<aside class="content-sources">/,
      `${block}\n            <aside class="content-sources">`
    )
  }
  fs.writeFileSync(indexPath, hub, 'utf8')
}

console.log(`Glossaire : ${data.terms.length} pages dans glossaire/`)
