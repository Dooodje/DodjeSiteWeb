#!/usr/bin/env node
/**
 * Génère un HTML guide ou actualité au format Dodje (SSG).
 * Ne publie rien : le fichier est à relire (YMYL) avant merge.
 *
 * Exemple :
 *   node scripts/new-article.mjs --type actualite --slug taux-lep-septembre-2026 \
 *     --title "LEP : ce qui change en septembre 2026" \
 *     --bluf "Le LEP reste plus rémunérateur que le Livret A…" \
 *     --eyebrow "Actualité épargne"
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const SITE = 'https://dodje.fr'
const OG = `${SITE}/assets/og-default-1200x630.png`

function parseArgs(argv) {
  const out = { type: 'actualite', faq: [] }
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i]
    const val = argv[i + 1]
    if (key === '--type') out.type = val
    else if (key === '--slug') out.slug = val
    else if (key === '--title') out.title = val
    else if (key === '--bluf') out.bluf = val
    else if (key === '--eyebrow') out.eyebrow = val
    else if (key === '--description') out.description = val
    else if (key === '--source-title') {
      out.faq.push({ kind: 'sourceTitle', value: val })
    } else if (key === '--source-url') {
      out.faq.push({ kind: 'sourceUrl', value: val })
    } else if (key === '--body') out.body = val
    else if (key === '--force') out.force = true
    else continue
    if (key !== '--force') i++
  }
  return out
}

function slugify(input) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function todayFr() {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date())
}

const args = parseArgs(process.argv)
if (!args.title) {
  console.error('Usage: npm run new-article -- --type guide|actualite --title "…" [--slug …] [--bluf …]')
  process.exit(1)
}

const type = args.type === 'guide' ? 'guide' : 'actualite'
const dir = type === 'guide' ? 'guides' : 'actualites'
const slug = args.slug || slugify(args.title)
const outFile = path.join(rootDir, dir, `${slug}.html`)
const url = `${SITE}/${dir}/${slug}`
const date = todayIso()
const schemaType = type === 'guide' ? 'Article' : 'NewsArticle'
const eyebrow = args.eyebrow || (type === 'guide' ? 'Guide France' : 'Actualité finance')
const bluf =
  args.bluf ||
  'Réponse directe à rédiger (40–120 mots) avec au moins 3 chiffres sourcés. BROUILLON — relecture YMYL obligatoire.'
const description =
  args.description || `${args.title}. Contenu pédagogique Dodje, sources officielles, sans conseil personnalisé.`
const bodyHtml = args.body
  ? `<p>${escapeHtml(args.body)}</p>`
  : `<p><strong>Brouillon automatique.</strong> Complète cet article avec des sources AMF, Banque de France, INSEE, URSSAF ou service-public.fr. Insère au moins trois chiffres datés. Ne pas publier tel quel.</p>
            <p>Pense à : unique H1 (déjà en place), FAQ HTML alignée sur le JSON-LD, disclaimer YMYL, liens internes vers 1 outil + 1 guide + 1 actualité.</p>`

const faq = [
  {
    q: `Que retenir de : ${args.title} ?`,
    a: 'Compléter après relecture. Réponse factuelle, chiffrée, sourcée.'
  },
  {
    q: 'Dodje donne-t-il un conseil personnalisé ?',
    a: 'Non. Contenu éducatif uniquement, sans recommandation d’investissement.'
  },
  {
    q: 'Où vérifier le barème officiel ?',
    a: 'Sur le site de l’organisme source (Banque de France, URSSAF, service-public.fr, AMF) et sur dodje.fr/guides/donnees-finance-france.'
  }
]

if (fs.existsSync(outFile) && !args.force) {
  console.error(`Fichier déjà existant: ${path.relative(rootDir, outFile)} (utilise --force pour écraser)`)
  process.exit(1)
}

const faqJson = faq.map((item) => ({
  '@type': 'Question',
  name: item.q,
  acceptedAnswer: { '@type': 'Answer', text: item.a }
}))

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(args.title)} | Dodje</title>
    <meta name="description" content="${escapeHtml(description.slice(0, 155))}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="author" content="Dodje">
    <meta name="language" content="fr-FR">
    <link rel="canonical" href="${url}">
    <meta property="og:title" content="${escapeHtml(args.title)}">
    <meta property="og:description" content="${escapeHtml(description.slice(0, 155))}">
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
      "@type": "${schemaType}",
      "headline": ${JSON.stringify(args.title)},
      "description": ${JSON.stringify(description)},
      "image": "${OG}",
      "datePublished": "${date}",
      "dateModified": "${date}",
      "inLanguage": "fr-FR",
      "author": { "@type": "Organization", "name": "Dodje" },
      "publisher": { "@id": "https://dodje.fr/#organization" },
      "mainEntityOfPage": "${url}",
      "about": { "@type": "Country", "name": "France" }
    }
    </script>
    <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqJson })}</script>
</head>
<body>
    <video id="background-video" autoplay muted loop playsinline preload="metadata">
        <source src="../assets/anime/FondAnime.mp4" type="video/mp4">
    </video>
    <div id="bg-overlay" aria-hidden="true"></div>
    <nav class="navbar visible" id="navbar-scroll">
        <div class="nav-container">
            <div class="nav-logo">
                <a href="/"><img src="../assets/Logo_degrade_PNG.png" alt="Dodje" class="logo-img"></a>
            </div>
            <div class="nav-menu">
                <a href="/${dir}" class="nav-link">${type === 'guide' ? 'Guides' : 'Actualités'}</a>
                <a href="/#hero" class="cta-button nav-cta">Télécharger l'app</a>
            </div>
        </div>
    </nav>
    <main class="content-page">
        <article class="content-layout">
            <p class="legal-eyebrow">${escapeHtml(eyebrow)}</p>
            <h1>${escapeHtml(args.title)}</h1>
            <p class="content-lead"><strong>En bref :</strong> ${escapeHtml(bluf)}</p>
            <div class="content-note content-ymyl"><p><strong>Brouillon YMYL :</strong> à relire avant publication. Contenu informatif uniquement, sans conseil en investissement personnalisé. Vérifie AMF, URSSAF, Banque de France, service-public.fr.</p></div>
            <h2>À compléter</h2>
            ${bodyHtml}
            <h2>Questions fréquentes</h2>
            ${faq.map((item) => `<h3>${escapeHtml(item.q)}</h3>\n            <p>${escapeHtml(item.a)}</p>`).join('\n            ')}
            <div class="content-links">
                <a href="/guides">Guides</a>
                <a href="/outils">Calculateurs</a>
                <a href="/actualites">Actualités</a>
                <a href="/guides/donnees-finance-france">Données finance France</a>
            </div>
            <aside class="content-sources">
                <h2>Sources</h2>
                <ul>
                    <li><a href="https://www.amf-france.org" rel="noopener noreferrer" target="_blank">AMF</a></li>
                    <li><a href="https://www.banque-france.fr" rel="noopener noreferrer" target="_blank">Banque de France</a></li>
                    <li><a href="https://www.service-public.fr" rel="noopener noreferrer" target="_blank">Service-public.fr</a></li>
                </ul>
            </aside>
            <p class="content-updated">Dernière mise à jour : ${escapeHtml(todayFr())}</p>
        </article>
    </main>
    <footer class="footer">
        <div class="container">
            <div class="footer-bottom"><p>&copy; ${new Date().getFullYear()} Dodje. Tous droits réservés.</p></div>
        </div>
    </footer>
</body>
</html>
`

fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, html, 'utf8')
console.log(`Créé ${path.relative(rootDir, outFile)}`)
console.log('Relire les chiffres et sources avant de merger. Ne pas publier un brouillon tel quel.')
