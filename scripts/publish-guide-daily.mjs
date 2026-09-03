#!/usr/bin/env node
/**
 * Publication d'un guide evergreen (investissement, épargne, immo…).
 * Chiffres uniquement interpolés depuis data/baremes.json (sources officielles).
 *
 *   node scripts/publish-guide-daily.mjs
 *   AUTO_COMMIT=1 node scripts/publish-guide-daily.mjs
 */
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const SITE = 'https://dodje.fr'
const OG = `${SITE}/assets/og-default-1200x630.png`
const TOPICS_PATH = path.join(rootDir, 'data/editorial-topics.json')
const BAREMES_PATH = path.join(rootDir, 'data/baremes.json')
const LOG_PATH = path.join(rootDir, 'data/guide-auto-log.json')

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

function loadJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function saveLog(log) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + '\n', 'utf8')
}

function fill(str, byId) {
  return String(str).replace(/\{\{([a-z0-9_]+)(?:\.(\w+))?\}\}/g, (_, id, prop) => {
    const item = byId[id]
    if (!item) return '—'
    if (!prop || prop === 'display') return item.display
    return item[prop] ?? item.display
  })
}

function publishedGuideToday(log) {
  return (log.published || []).some((row) => row.date === todayIso())
}

function pickTopic(topics, log) {
  const done = new Set((log.published || []).map((row) => row.slug))
  const dir = path.join(rootDir, 'guides')
  return topics.find((topic) => {
    if (done.has(topic.slug)) return false
    if (fs.existsSync(path.join(dir, `${topic.slug}.html`))) return false
    return Array.isArray(topic.baremes) && topic.baremes.length >= 3
  })
}

function buildGuideHtml(topic, byId) {
  const title = fill(topic.title, byId)
  const bluf = fill(topic.bluf, byId)
  const date = todayIso()
  const url = `${SITE}/guides/${topic.slug}`
  const description = `${title}. Chiffres : ${topic.baremes.map((id) => byId[id]?.display).filter(Boolean).slice(0, 3).join(', ')}. Éducation financière, sans conseil personnalisé.`

  const sections = topic.sections
    .map((s) => `<h2>${escapeHtml(fill(s.h2, byId))}</h2>\n            ${fill(s.html, byId)}`)
    .join('\n            ')

  const faq = topic.faq.map((item) => ({
    q: fill(item.q, byId),
    a: fill(item.a, byId)
  }))

  const faqJson = faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a }
  }))

  const factItems = topic.baremes
    .map((id) => byId[id])
    .filter(Boolean)
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.display)}</strong> — ${escapeHtml(item.label)} (${escapeHtml(item.source)}, ${escapeHtml(item.asOf)})</li>`
    )
    .join('\n                ')

  const sourceLinks = [
    ...new Map(
      topic.baremes
        .map((id) => byId[id])
        .filter((item) => item?.sourceUrl)
        .map((item) => [item.sourceUrl, item])
    ).values()
  ]
    .map(
      (item) =>
        `<li><a href="${escapeHtml(item.sourceUrl)}" rel="noopener noreferrer" target="_blank">${escapeHtml(item.source)} — ${escapeHtml(item.label)}</a></li>`
    )
    .join('\n                    ')

  const links = topic.links || {}

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} | Dodje</title>
    <meta name="description" content="${escapeHtml(description.slice(0, 155))}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="author" content="Dodje">
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
      "@type": "Article",
      "headline": ${JSON.stringify(title)},
      "description": ${JSON.stringify(description)},
      "image": "${OG}",
      "datePublished": "${date}",
      "dateModified": "${date}",
      "inLanguage": "fr-FR",
      "author": { "@id": "https://dodje.fr/#editorial-team" },
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
    <nav class="navbar visible">
        <div class="nav-container">
            <div class="nav-logo"><a href="/"><img src="../assets/Logo_degrade_PNG.png" alt="Dodje" class="logo-img"></a></div>
            <div class="nav-menu">
                <a href="/guides" class="nav-link">Guides</a>
                <a href="/actualites" class="nav-link">Actualités</a>
                <a href="/#hero" class="cta-button nav-cta">Télécharger l'app</a>
            </div>
        </div>
    </nav>
    <main class="content-page">
        <article class="content-layout">
            <p class="legal-eyebrow">${escapeHtml(topic.kicker)} · France</p>
            <h1>${escapeHtml(title)}</h1>
            <p class="content-lead"><strong>En bref :</strong> ${fill(topic.bluf, byId)}</p>
            <div class="content-note content-ymyl"><p><strong>Avertissement :</strong> guide pédagogique généré à partir des barèmes officiels recensés par Dodje. Pas de conseil en investissement personnalisé. Vérifie les sources primaires.</p></div>
            <h2>Chiffres utilisés (sources)</h2>
            <ul>
                ${factItems}
            </ul>
            ${sections}
            <h2>Questions fréquentes</h2>
            ${faq.map((item) => `<h3>${escapeHtml(item.q)}</h3>\n            <p>${escapeHtml(item.a)}</p>`).join('\n            ')}
            <div class="content-links">
                ${links.tool ? `<a href="${links.tool}">Outil lié</a>` : ''}
                ${links.guide ? `<a href="${links.guide}">Guide lié</a>` : ''}
                ${links.actu ? `<a href="${links.actu}">Actualités</a>` : ''}
                <a href="/guides/donnees-finance-france">Données finance France</a>
            </div>
            <aside class="content-sources">
                <h2>Sources</h2>
                <ul>
                    ${sourceLinks}
                    <li><a href="/guides/donnees-finance-france">Dodje, données finance France</a></li>
                </ul>
            </aside>
            <p class="content-updated">Dernière mise à jour : ${escapeHtml(todayFr())}</p>
        </article>
    </main>
    <footer class="footer"><div class="container"><div class="footer-bottom"><p>&copy; ${new Date().getFullYear()} Dodje.</p></div></div></footer>
</body>
</html>
`
}

function prependHubCard(topic, title) {
  const hubPath = path.join(rootDir, 'guides/index.html')
  let html = fs.readFileSync(hubPath, 'utf8')
  const href = `/guides/${topic.slug}`
  if (html.includes(href)) return
  const card = `<a class="seo-hub-card" href="${href}"><span class="seo-kicker">${escapeHtml(topic.kicker)}</span><h3>${escapeHtml(title.slice(0, 70))}</h3><p>Barèmes sourcés, sans conseil personnalisé.</p></a>`
  const marker = '<h2>Guides par thème</h2>'
  const headingAt = html.indexOf(marker)
  const gridTag = '<div class="seo-hub-grid">'
  const gridAt = headingAt === -1 ? -1 : html.indexOf(gridTag, headingAt)
  if (gridAt === -1) {
    console.warn('Hub /guides : grille « Guides par thème » introuvable, carte non ajoutée.')
  } else {
    const insertAt = gridAt + gridTag.length
    html = `${html.slice(0, insertAt)}\n                ${card}${html.slice(insertAt)}`
  }
  html = html.replace(
    /<p class="content-updated">[^<]+<\/p>/,
    `<p class="content-updated">Dernière mise à jour : ${todayFr()}</p>`
  )
  html = html.replace(/"dateModified":"[^"]+"/, `"dateModified":"${todayIso()}"`)
  fs.writeFileSync(hubPath, html, 'utf8')
}

function gitCommit(files, message) {
  execFileSync('git', ['add', ...files], { cwd: rootDir, stdio: 'inherit' })
  try {
    execFileSync('git', ['diff', '--cached', '--quiet'], { cwd: rootDir })
    console.log('Rien à committer pour le guide.')
    return
  } catch {
    // git diff --cached --quiet exit 1 = des fichiers sont stagés
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
}

const log = loadJson(LOG_PATH, { published: [] })
if (publishedGuideToday(log)) {
  console.log('Un guide auto a déjà été publié aujourd’hui. Stop.')
  process.exit(0)
}

const pack = loadJson(TOPICS_PATH, { topics: [] })
const baremes = loadJson(BAREMES_PATH, { items: [] })
const byId = Object.fromEntries((baremes.items || []).map((item) => [item.id, item]))

const topic = pickTopic(pack.topics || [], log)
if (!topic) {
  console.log('File d’attente des guides vide (tous les sujets sont déjà en ligne).')
  process.exit(0)
}

const missing = topic.baremes.filter((id) => !byId[id])
if (missing.length) {
  console.error(`Barèmes manquants pour ${topic.slug}: ${missing.join(', ')}`)
  process.exit(1)
}

const outFile = path.join(rootDir, 'guides', `${topic.slug}.html`)
const html = buildGuideHtml(topic, byId)
fs.writeFileSync(outFile, html, 'utf8')

const title = fill(topic.title, byId)
prependHubCard(topic, title)

log.published = [...(log.published || []), { slug: topic.slug, date: todayIso() }]
saveLog(log)

console.log(`Guide créé: guides/${topic.slug}.html`)

if (process.env.AUTO_COMMIT === '1') {
  gitCommit(
    [`guides/${topic.slug}.html`, 'guides/index.html', 'data/guide-auto-log.json'],
    `guide(auto): ${title.slice(0, 70)}`
  )
}
