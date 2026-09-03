#!/usr/bin/env node
/**
 * Publication quotidienne d'une actualité finance.
 *
 * Règle d'or : aucun chiffre n'est inventé. On n'écrit que ce qui a été
 * extrait d'une page officielle (AMF, Banque de France, INSEE, service-public,
 * URSSAF, économie.gouv). Moins de 3 faits sourcés = pas d'article ce jour-là.
 *
 * Usage :
 *   node scripts/publish-actu-daily.mjs
 *   AUTO_COMMIT=1 node scripts/publish-actu-daily.mjs   # commit + push (CI)
 */
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const SITE = 'https://dodje.fr'
const OG = `${SITE}/assets/og-default-1200x630.png`
const UA = 'DodjeEditorialBot/1.0 (contact@dodje.fr; +https://dodje.fr/)'
const LOG_PATH = path.join(rootDir, 'data/actu-auto-log.json')
const BAREMES_PATH = path.join(rootDir, 'data/baremes.json')

const OFFICIAL_HOSTS = [
  'amf-france.org',
  'banque-france.fr',
  'insee.fr',
  'service-public.fr',
  'urssaf.fr',
  'impots.gouv.fr',
  'economie.gouv.fr',
  'legifrance.gouv.fr',
  'travail-emploi.gouv.fr'
]

const FEEDS = [
  { name: 'AMF', url: 'https://www.amf-france.org/fr/rss.xml' },
  { name: 'Banque de France', url: 'https://www.banque-france.fr/fr/rss.xml' },
  { name: 'INSEE', url: 'https://www.insee.fr/fr/rss/a-la-une.xml' },
  { name: 'Service-public', url: 'https://www.service-public.fr/abonnements/rss/actualites.rss' }
]

const WATCH_PAGES = [
  {
    name: 'Service-public · Livret A',
    url: 'https://www.service-public.fr/particuliers/vosdroits/F2365',
    kicker: 'Épargne'
  },
  {
    name: 'Service-public · SMIC',
    url: 'https://www.service-public.fr/particuliers/vosdroits/F2300',
    kicker: 'Salaire'
  }
]

const KEYWORDS =
  /livret|lep|smic|cr[eé]dit|immobilier|pea|crypto|mica|inflation|taux|épargne|epargne|fiscal|impôt|impot|urssaf|lep|ldds|pea/i

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function todayFr() {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris'
  }).format(new Date())
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function slugify(input) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)
}

function isOfficialUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return OFFICIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))
  } catch {
    return false
  }
}

function factsFingerprint(facts) {
  return facts
    .map((f) => f.display.toLowerCase().replace(/\s+/g, ' '))
    .sort()
    .join('|')
}

function lastFingerprint(log, url) {
  const row = (log.fingerprints || []).find((r) => r.url === url)
  return row ? row.fingerprint : ''
}

function rememberFingerprint(log, url, fingerprint) {
  const rest = (log.fingerprints || []).filter((r) => r.url !== url)
  log.fingerprints = [...rest, { url, fingerprint, date: todayIso() }].slice(-80)
}

function loadLog() {
  if (!fs.existsSync(LOG_PATH)) return { seen: [], published: [], fingerprints: [] }
  try {
    return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'))
  } catch {
    return { seen: [], published: [] }
  }
}

function saveLog(log) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true })
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + '\n', 'utf8')
}

function decodeXml(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function parseRssItems(xml) {
  const items = []
  const blocks = xml.split(/<item[\s>]/i).slice(1)
  for (const block of blocks) {
    const title = decodeXml((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '')
    const link = decodeXml(
      (block.match(/<link[^>]*>([\s\S]*?)<\/link>/i) ||
        block.match(/<link[^>]*href="([^"]+)"/i) ||
        [])[1] || ''
    )
    if (title) items.push({ title, link: link.trim() })
  }
  return items
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractFacts(text) {
  const re =
    /(\d{1,3}(?:[\s\u00a0.]\d{3})*(?:[.,]\d+)?)\s*(%|€|euros?|milliards?|millions?|Md€|M€|points?)/gi
  const facts = []
  const seen = new Set()
  let match
  while ((match = re.exec(text)) && facts.length < 8) {
    const raw = match[0].replace(/\s+/g, ' ').trim()
    const key = raw.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const start = Math.max(0, match.index - 90)
    const end = Math.min(text.length, match.index + match[0].length + 90)
    const context = text.slice(start, end).replace(/\s+/g, ' ').trim()
    facts.push({ display: raw, context })
  }
  return facts
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/rss+xml,application/xml,text/xml,*/*' },
    redirect: 'follow'
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.text()
}

async function fetchFeed(feed) {
  const xml = await fetchText(feed.url)
  return parseRssItems(xml).map((item) => ({ ...item, source: feed.name }))
}

function kickerFromTitle(title) {
  const t = title.toLowerCase()
  if (/livret|lep|ldds|épargne|epargne/.test(t)) return 'Épargne'
  if (/crédit|credit|immobilier|logement|dpe/.test(t)) return 'Immobilier'
  if (/smic|salaire|emploi/.test(t)) return 'Salaire'
  if (/impôt|impot|fiscal/.test(t)) return 'Fiscalité'
  if (/crypto|mica|bitcoin/.test(t)) return 'Crypto'
  if (/pea|bourse|action/.test(t)) return 'Bourse'
  return 'France'
}

function existingCorpus() {
  const chunks = []
  const dir = path.join(rootDir, 'actualites')
  if (!fs.existsSync(dir)) return ''
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.html')) continue
    chunks.push(fs.readFileSync(path.join(dir, file), 'utf8').toLowerCase())
  }
  return chunks.join('\n')
}

function alreadyCovered(title, corpus) {
  const tokens = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 4)
  if (!tokens.length) return false
  const hits = tokens.filter((t) => corpus.includes(t)).length
  return hits / tokens.length >= 0.7
}

function publishedToday() {
  const stamp = todayIso()
  const dir = path.join(rootDir, 'actualites')
  return fs.readdirSync(dir).some((f) => f.includes(stamp) && f.endsWith('.html'))
}

function buildArticleHtml({ title, slug, kicker, sourceName, sourceUrl, facts, date }) {
  const url = `${SITE}/actualites/${slug}`
  const topFacts = facts.slice(0, 3)
  const bluf = `${sourceName} indique ${topFacts.map((f) => f.display).join(', ')}. Chiffres repris tels quels depuis la source officielle du ${todayFr()}. Pas de conseil personnalisé.`
  const description = `${title} — ${topFacts.map((f) => f.display).join(', ')}. Source : ${sourceName}.`
  const factList = topFacts.map((f) => `<li><strong>${escapeHtml(f.display)}</strong> — ${escapeHtml(f.context)}</li>`).join('\n                ')
  const paragraphs = facts
    .slice(0, 5)
    .map(
      (f) =>
        `<p>La source officielle mentionne <strong>${escapeHtml(f.display)}</strong> : « ${escapeHtml(f.context)} » (<a href="${escapeHtml(sourceUrl)}" rel="noopener noreferrer" target="_blank">${escapeHtml(sourceName)}</a>).</p>`
    )
    .join('\n            ')

  const faq = [
    {
      q: `Quels chiffres retenir dans « ${title} » ?`,
      a: topFacts.map((f) => f.display).join(' ; ') + `. Source : ${sourceName}.`
    },
    {
      q: 'Où vérifier ces barèmes ?',
      a: `Sur la page officielle ${sourceName} : ${sourceUrl}. Dodje ne fait que relayer les chiffres extraits de cette page.`
    },
    {
      q: 'Dodje donne-t-il un conseil personnalisé ?',
      a: 'Non. Contenu éducatif uniquement, sans recommandation d’investissement ni de produit.'
    }
  ]

  const faqJson = faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a }
  }))

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} | Dodje</title>
    <meta name="description" content="${escapeHtml(description.slice(0, 155))}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="author" content="Dodje">
    <meta name="language" content="fr-FR">
    <link rel="canonical" href="${url}">
    <meta property="og:title" content="${escapeHtml(title)}">
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
      "@type": "NewsArticle",
      "headline": ${JSON.stringify(title)},
      "description": ${JSON.stringify(description)},
      "image": "${OG}",
      "datePublished": "${date}",
      "dateModified": "${date}",
      "inLanguage": "fr-FR",
      "author": { "@id": "https://dodje.fr/#editorial-team" },
      "publisher": { "@id": "https://dodje.fr/#organization" },
      "mainEntityOfPage": "${url}",
      "about": { "@type": "Country", "name": "France" },
      "citation": ${JSON.stringify(sourceUrl)}
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
                <a href="/actualites" class="nav-link">Actualités</a>
                <a href="/#hero" class="cta-button nav-cta">Télécharger l'app</a>
            </div>
        </div>
    </nav>
    <main class="content-page">
        <article class="content-layout">
            <p class="legal-eyebrow">${escapeHtml(kicker)} · source officielle</p>
            <h1>${escapeHtml(title)}</h1>
            <p class="content-lead"><strong>En bref :</strong> ${escapeHtml(bluf)}</p>
            <div class="content-note content-ymyl"><p><strong>Avertissement :</strong> article généré automatiquement à partir d'une page officielle. Dodje n'invente aucun taux. Vérifie toujours la source primaire avant une décision. Pas de conseil personnalisé.</p></div>
            <h2>Chiffres extraits de la source</h2>
            <ul>
                ${factList}
            </ul>
            <h2>Ce que dit ${escapeHtml(sourceName)}</h2>
            ${paragraphs}
            <p>Pour le contexte pédagogique (Livret A, SMIC, HCSF), voir aussi <a href="/guides/donnees-finance-france">Données finance France</a>.</p>
            <h2>Questions fréquentes</h2>
            ${faq.map((item) => `<h3>${escapeHtml(item.q)}</h3>\n            <p>${escapeHtml(item.a)}</p>`).join('\n            ')}
            <div class="content-links">
                <a href="/actualites">Toutes les actualités</a>
                <a href="/guides/donnees-finance-france">Chiffres finance France</a>
                <a href="/outils">Calculateurs</a>
                <a href="/guides">Guides</a>
            </div>
            <aside class="content-sources">
                <h2>Source primaire</h2>
                <ul>
                    <li><a href="${escapeHtml(sourceUrl)}" rel="noopener noreferrer" target="_blank">${escapeHtml(sourceName)}</a></li>
                </ul>
            </aside>
            <p class="content-updated">Publié automatiquement le ${escapeHtml(todayFr())} — extraits non réécrits.</p>
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
}

function prependHubCard({ slug, kicker, title, teaser }) {
  const hubPath = path.join(rootDir, 'actualites/index.html')
  let html = fs.readFileSync(hubPath, 'utf8')
  const href = `/actualites/${slug}`
  if (html.includes(href)) return
  const card = `<a class="seo-hub-card" href="${href}"><span class="seo-kicker">${escapeHtml(kicker)}</span><h3>${escapeHtml(title.slice(0, 80))}</h3><p>${escapeHtml(teaser.slice(0, 90))}</p></a>`
  html = html.replace('<div class="seo-hub-grid">', `<div class="seo-hub-grid">\n                ${card}`)
  html = html.replace(
    /<p class="content-updated">[^<]+<\/p>/,
    `<p class="content-updated">Dernière mise à jour : ${todayFr()}</p>`
  )
  html = html.replace(/"dateModified":"[^"]+"/, `"dateModified":"${todayIso()}"`)
  fs.writeFileSync(hubPath, html, 'utf8')
}

function maybeUpdateBaremes(facts) {
  if (!fs.existsSync(BAREMES_PATH)) return
  const data = JSON.parse(fs.readFileSync(BAREMES_PATH, 'utf8'))
  let changed = false
  for (const fact of facts) {
    const pct = fact.display.match(/^([\d.,]+)\s*%$/)
    if (pct && /livret a/i.test(fact.context)) {
      const item = data.items.find((i) => i.id === 'livret_a_taux')
      const value = Number(pct[1].replace(',', '.'))
      if (item && Number.isFinite(value) && item.value !== value) {
        item.value = value
        item.display = fact.display.replace('.', ',')
        item.asOf = todayIso()
        changed = true
      }
    }
  }
  if (changed) {
    data.updated = todayIso()
    fs.writeFileSync(BAREMES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8')
  }
}

function gitCommit(files, message) {
  execFileSync('git', ['add', ...files], { cwd: rootDir, stdio: 'inherit' })
  const status = execFileSync('git', ['status', '--porcelain'], { cwd: rootDir, encoding: 'utf8' })
  if (!status.trim()) {
    console.log('Rien à committer.')
    return false
  }
  execFileSync(
    'git',
    [
      '-c',
      'user.name=github-actions[bot]',
      '-c',
      'user.email=41898282+github-actions[bot]@users.noreply.github.com',
      'commit',
      '-m',
      message
    ],
    { cwd: rootDir, stdio: 'inherit' }
  )
  execFileSync('git', ['push', 'origin', 'HEAD'], { cwd: rootDir, stdio: 'inherit' })
  return true
}

async function pickStory(log, corpus) {
  const candidates = []

  for (const feed of FEEDS) {
    try {
      const items = await fetchFeed(feed)
      for (const item of items.slice(0, 10)) {
        if (!item.link || !isOfficialUrl(item.link)) continue
        if (!KEYWORDS.test(item.title)) continue
        if (log.seen.includes(item.link)) continue
        if (alreadyCovered(item.title, corpus)) continue
        candidates.push(item)
      }
    } catch (err) {
      console.warn(`Feed ${feed.name} ignoré: ${err.message}`)
    }
  }

  for (const page of WATCH_PAGES) {
    candidates.push({
      title: page.name,
      link: page.url,
      source: page.name,
      kicker: page.kicker,
      watchPage: true
    })
  }

  for (const item of candidates) {
    try {
      const html = await fetchText(item.link)
      const facts = extractFacts(stripHtml(html))
      if (facts.length < 3) {
        console.log(`Skip (moins de 3 chiffres) : ${item.title}`)
        continue
      }
      const fingerprint = factsFingerprint(facts)
      if (item.watchPage && lastFingerprint(log, item.link) === fingerprint) {
        console.log(`Skip (barèmes inchangés) : ${item.title}`)
        continue
      }
      return { ...item, facts, fingerprint }
    } catch (err) {
      console.warn(`Page illisible ${item.link}: ${err.message}`)
    }
  }

  return null
}

if (publishedToday()) {
  console.log('Une actualité auto a déjà été publiée aujourd’hui. Stop.')
  process.exit(0)
}

const log = loadLog()
const corpus = existingCorpus()
const story = await pickStory(log, corpus)

if (!story) {
  console.log('Aucun article auto : pas assez de chiffres officiels extraits aujourd’hui.')
  process.exit(0)
}

const date = todayIso()
const title = story.watchPage
  ? `${story.title.replace(/^Service-public · /, '')} : barèmes officiels au ${todayFr()}`
  : story.title
const slug = `${slugify(title)}-${date}`
const outFile = path.join(rootDir, 'actualites', `${slug}.html`)

if (fs.existsSync(outFile)) {
  console.log(`Fichier déjà là: ${slug}`)
  process.exit(0)
}

const kicker = story.kicker || kickerFromTitle(title)
const html = buildArticleHtml({
  title,
  slug,
  kicker,
  sourceName: story.source,
  sourceUrl: story.link,
  facts: story.facts,
  date
})

fs.writeFileSync(outFile, html, 'utf8')
prependHubCard({
  slug,
  kicker,
  title,
  teaser: story.facts.slice(0, 3).map((f) => f.display).join(' · ')
})
maybeUpdateBaremes(story.facts)

log.seen = [...new Set([...log.seen, story.link])].slice(-400)
log.published = [...(log.published || []), { slug, url: story.link, date }].slice(-200)
rememberFingerprint(log, story.link, story.fingerprint)
saveLog(log)

console.log(`Article créé: actualites/${slug}.html (${story.facts.length} chiffres, source ${story.source})`)

if (process.env.AUTO_COMMIT === '1') {
  gitCommit(
    [
      `actualites/${slug}.html`,
      'actualites/index.html',
      'data/actu-auto-log.json',
      'data/baremes.json'
    ],
    `actu(auto): ${title.slice(0, 70)}`
  )
}
