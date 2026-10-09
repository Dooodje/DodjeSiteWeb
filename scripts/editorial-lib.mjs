/**
 * Publication quotidienne blog + actualités.
 * Un chiffre n'entre dans une page que s'il est nommé : extracteur de tableau
 * officiel, ou identifiant de data/baremes.json. Rien n'est réécrit dans baremes.json.
 */
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const rootDir = path.resolve(__dirname, '..')
const SITE = 'https://dodje.fr'
const OG = `${SITE}/assets/og-default-1200x630.png`
const UA = 'Mozilla/5.0 (compatible; DodjeEditorialBot/1.0; +https://dodje.fr/)'
const BAREMES_PATH = path.join(rootDir, 'data/baremes.json')

const WATCH = {
  smic: {
    url: 'https://www.service-public.fr/particuliers/vosdroits/F2300',
    source: 'Service-public.fr',
    hosts: ['service-public.fr', 'service-public.gouv.fr']
  },
  livret_a: {
    url: 'https://www.service-public.fr/particuliers/vosdroits/F2365',
    source: 'Service-public.fr',
    hosts: ['service-public.fr', 'service-public.gouv.fr']
  }
}

const SP = String.raw`[\s\u00a0\u202f]`
const AMOUNT = String.raw`(\d{1,3}(?:${SP}\d{3})*,\d{2})`
const INT_AMOUNT = String.raw`(\d{1,3}(?:${SP}\d{3})*)`

export function todayIso(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export function todayFr(date = new Date()) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris'
  }).format(date)
}

export function monthYearFr(date = new Date()) {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris'
  }).format(date)
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function stripHtml(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&euro;/gi, '€')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function normAmount(s) {
  return String(s).replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').trim()
}

function euro(s) {
  return `${normAmount(s)} €`
}

function percent(s) {
  return `${normAmount(s).replace('.', ',')} %`
}

function fact(id, label, display, watch) {
  return {
    id,
    label,
    display,
    source: watch.source,
    sourceUrl: watch.url,
    asOf: todayIso()
  }
}

export function extractSmicFacts(text) {
  const watch = WATCH.smic
  const table = text.match(
    new RegExp(
      `Smic horaire${SP}+${AMOUNT}${SP}*€${SP}+${AMOUNT}${SP}*€${SP}+Smic mensuel${SP}+${AMOUNT}${SP}*€${SP}+${AMOUNT}${SP}*€${SP}+Smic annuel${SP}+${AMOUNT}${SP}*€${SP}+${AMOUNT}${SP}*€`,
      'i'
    )
  )
  if (!table) return null
  const out = {
    smic_horaire_brut: fact('smic_horaire_brut', 'SMIC horaire brut', euro(table[1]), watch),
    smic_horaire_net: fact('smic_horaire_net', 'SMIC horaire net', euro(table[2]), watch),
    smic_brut_mensuel: fact('smic_brut_mensuel', 'SMIC brut mensuel', euro(table[3]), watch),
    smic_net_mensuel: fact('smic_net_mensuel', 'SMIC net mensuel', euro(table[4]), watch),
    smic_annuel_brut: fact('smic_annuel_brut', 'SMIC annuel brut', euro(table[5]), watch),
    smic_annuel_net: fact('smic_annuel_net', 'SMIC annuel net', euro(table[6]), watch)
  }
  const minor = text.match(
    new RegExp(`17 ans${SP}+${AMOUNT}${SP}*€${SP}+16 ans${SP}*\\(et moins\\)${SP}+${AMOUNT}${SP}*€`, 'i')
  )
  if (minor) {
    out.smic_mineur_17 = fact('smic_mineur_17', 'SMIC horaire brut minoré, 17 ans', euro(minor[1]), watch)
    out.smic_mineur_16 = fact('smic_mineur_16', 'SMIC horaire brut minoré, 16 ans et moins', euro(minor[2]), watch)
  }
  return out
}

export function extractLivretAFacts(text) {
  const watch = WATCH.livret_a
  const apo = "['’]"
  const rate = text.match(
    new RegExp(`taux d${apo}intérêt annuel du livret A est de${SP}+(\\d{1,2},\\d+)${SP}*%`, 'i')
  )
  const cap = text.match(
    new RegExp(
      `montant maximum d${apo}épargne inscrit sur le livret A est de${SP}+${INT_AMOUNT}${SP}*€`,
      'i'
    )
  )
  if (!rate && !cap) return null
  const out = {}
  if (rate) out.livret_a_taux = fact('livret_a_taux', 'Taux du Livret A', percent(rate[1]), watch)
  if (cap) out.livret_a_plafond = fact('livret_a_plafond', 'Plafond du Livret A', euro(cap[1]), watch)
  return out
}

function hostAllowed(url, hosts) {
  const list = Array.isArray(hosts) ? hosts : [hosts]
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return list.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
  } catch {
    return false
  }
}

async function fetchWatch(name) {
  const watch = WATCH[name]
  const res = await fetch(watch.url, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000)
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${watch.url}`)
  if (!hostAllowed(res.url, watch.hosts)) throw new Error(`Hôte final refusé : ${res.url}`)
  return stripHtml(await res.text())
}

const EXTRACTORS = {
  smic: extractSmicFacts,
  livret_a: extractLivretAFacts
}

function lookup(byId, id, prop) {
  const item = byId[id]
  if (!item) return '—'
  if (!prop || prop === 'display') return item.display
  return item[prop] ?? item.display
}

export function fill(str, byId) {
  return String(str).replace(/\{\{([a-z0-9_]+)(?:\.(\w+))?\}\}/g, (_, id, prop) => lookup(byId, id, prop))
}

export function fillHtml(str, byId) {
  return String(str).replace(/\{\{([a-z0-9_]+)(?:\.(\w+))?\}\}/g, (_, id, prop) =>
    escapeHtml(lookup(byId, id, prop))
  )
}

export function metaDescription(bluf, leadDisplay, max = 155) {
  const clean = String(bluf).replace(/\s+/g, ' ').trim()
  if (!clean.includes(leadDisplay)) return null
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max + 1)
  const word = cut.replace(/\s+\S*$/, '').trim()
  if (!word.includes(leadDisplay) || word.length < 40) return null
  return word
}

export function qualityGate({ title, bluf, faq, leadDisplay, sourceUrl, description }) {
  const errors = []
  if (!leadDisplay || leadDisplay === '—') errors.push('chiffre nommé manquant')
  if (!title?.includes(leadDisplay)) errors.push('le titre ne contient pas le chiffre')
  if (!bluf?.includes(leadDisplay)) errors.push('le chapô ne contient pas le chiffre')
  if (!/[.!?]$/.test(String(bluf || '').trim())) errors.push('chapô coupé avant la fin de la phrase')
  const answers = (faq || []).map((item) => item.a).join(' ')
  if (!answers.includes(leadDisplay)) errors.push('la FAQ ne répète pas le chiffre')
  for (const part of [bluf, ...(faq || []).map((item) => item.a)]) {
    if (!/[.!?]$/.test(String(part || '').trim())) errors.push('phrase coupée au milieu')
  }
  if (!sourceUrl || !/^https:\/\//.test(sourceUrl)) errors.push('source officielle absente')
  if (!description || !description.includes(leadDisplay)) errors.push('meta description sans le chiffre')
  if (description && description.length > 155) errors.push('meta description trop longue')
  return errors
}

function loadJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function loadBaremes() {
  const data = loadJson(BAREMES_PATH, { items: [] })
  return Object.fromEntries((data.items || []).map((item) => [item.id, item]))
}

async function resolveFacts(topic, byId, cache) {
  let merged = { ...byId }
  if (topic.extractor) {
    if (!cache.has(topic.extractor)) {
      try {
        const text = await fetchWatch(topic.extractor)
        const parsed = EXTRACTORS[topic.extractor]?.(text) || null
        cache.set(topic.extractor, parsed)
      } catch (err) {
        console.warn(`Extracteur ${topic.extractor} ignoré : ${err.message}`)
        cache.set(topic.extractor, null)
      }
    }
    const live = cache.get(topic.extractor)
    if (!live) return null
    for (const id of topic.requireLive || []) {
      if (!live[id]?.display) return null
    }
    merged = { ...merged, ...live }
  }
  const needed = [...(topic.baremes || []), topic.leadFact]
  if (needed.some((id) => !merged[id]?.display || merged[id].display === '—')) return null
  return merged
}

function buildCopy(topic, byId) {
  const title = `${fill(topic.title, byId)} (${monthYearFr()})`
  const bluf = fill(topic.bluf, byId)
  const faq = (topic.faq || []).map((item) => ({
    q: fill(item.q, byId),
    a: fill(item.a, byId)
  }))
  const lead = byId[topic.leadFact]
  const description = metaDescription(bluf, lead.display)
  return { title, bluf, faq, description, lead }
}

function factItems(topic, byId) {
  return topic.baremes
    .map((id) => byId[id])
    .filter(Boolean)
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.display)}</strong> — ${escapeHtml(item.label)} (${escapeHtml(item.source)}, ${escapeHtml(item.asOf)})</li>`
    )
    .join('\n                ')
}

function sourceLinks(topic, byId) {
  const byUrl = new Map()
  for (const id of topic.baremes || []) {
    const item = byId[id]
    if (!item?.sourceUrl || byUrl.has(item.sourceUrl)) continue
    byUrl.set(item.sourceUrl, item)
  }
  return [...byUrl.values()]
    .map(
      (item) =>
        `<li><a href="${escapeHtml(item.sourceUrl)}" rel="noopener noreferrer" target="_blank">${escapeHtml(item.source)} — ${escapeHtml(item.label)}</a></li>`
    )
    .join('\n                    ')
}

export function buildPageHtml({ kind, topic, byId, copy }) {
  const dir = kind === 'blog' ? 'blog' : 'actualites'
  const url = `${SITE}/${dir}/${topic.slug}`
  const date = todayIso()
  const schemaType = kind === 'blog' ? 'Article' : 'NewsArticle'
  const sections = (topic.sections || [])
    .map((s) => `<h2>${escapeHtml(fill(s.h2, byId))}</h2>\n            ${fillHtml(s.html, byId)}`)
    .join('\n            ')
  const faqJson = copy.faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a }
  }))
  const links = topic.links || {}
  const linkHtml = [
    links.tool ? `<a href="${escapeHtml(links.tool)}">Outil lié</a>` : '',
    links.guide ? `<a href="${escapeHtml(links.guide)}">Guide lié</a>` : '',
    kind === 'blog' ? '<a href="/actualites">Actualités</a>' : '<a href="/blog">Blog</a>',
    `<a href="/${dir}">${kind === 'blog' ? 'Tous les articles' : 'Toutes les actualités'}</a>`
  ]
    .filter(Boolean)
    .join('\n                ')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(copy.title)} | Dodje</title>
    <meta name="description" content="${escapeHtml(copy.description)}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="author" content="Dodje">
    <meta name="language" content="fr-FR">
    <link rel="canonical" href="${url}">
    <meta property="og:title" content="${escapeHtml(copy.title)}">
    <meta property="og:description" content="${escapeHtml(copy.description)}">
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
      "headline": ${JSON.stringify(copy.title)},
      "description": ${JSON.stringify(copy.description)},
      "image": "${OG}",
      "datePublished": "${date}",
      "dateModified": "${date}",
      "inLanguage": "fr-FR",
      "author": { "@id": "https://dodje.fr/#editorial-team" },
      "publisher": { "@id": "https://dodje.fr/#organization" },
      "mainEntityOfPage": "${url}",
      "about": { "@type": "Country", "name": "France" },
      "citation": ${JSON.stringify(copy.lead.sourceUrl)}
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
                <a href="/${dir}" class="nav-link">${kind === 'blog' ? 'Blog' : 'Actualités'}</a>
                <a href="/#hero" class="cta-button nav-cta">Télécharger l'app</a>
            </div>
        </div>
    </nav>
    <main class="content-page">
        <article class="content-layout" data-editorial="auto">
            <p class="legal-eyebrow">${escapeHtml(topic.kicker)} · France</p>
            <h1>${escapeHtml(copy.title)}</h1>
            <p class="content-lead"><strong>En bref :</strong> ${escapeHtml(copy.bluf)}</p>
            <div class="content-note content-ymyl"><p><strong>Avertissement :</strong> contenu pédagogique généré à partir de barèmes nommés (source officielle ou fichier Dodje). Pas de conseil personnalisé. Vérifie la source primaire avant une décision.</p></div>
            <h2>Le chiffre à retenir</h2>
            <ul>
                ${factItems(topic, byId)}
            </ul>
            ${sections}
            <h2>Questions fréquentes</h2>
            ${copy.faq.map((item) => `<h3>${escapeHtml(item.q)}</h3>\n            <p>${escapeHtml(item.a)}</p>`).join('\n            ')}
            <div class="content-links">
                ${linkHtml}
            </div>
            <aside class="content-sources">
                <h2>Sources</h2>
                <ul>
                    ${sourceLinks(topic, byId)}
                </ul>
            </aside>
            <p class="content-updated">Publié le ${escapeHtml(todayFr())}.</p>
        </article>
    </main>
    <footer class="footer"><div class="container"><div class="footer-bottom"><p>&copy; ${new Date().getFullYear()} Dodje. Tous droits réservés.</p></div></div></footer>
</body>
</html>
`
}

function prependCard(html, { gridId, card }) {
  const grid = `<div class="seo-hub-grid" id="${gridId}">`
  if (!html.includes(grid)) return null
  return html.replace(grid, `${grid}\n                ${card}`)
}

function touchHubDates(html) {
  return html
    .replace(/<p class="content-updated">[^<]*<\/p>/, `<p class="content-updated">Dernière mise à jour : ${todayFr()}</p>`)
    .replace(/"dateModified":"[^"]+"/, `"dateModified":"${todayIso()}"`)
}

export function updateActuHub(topic, copy) {
  const hubPath = path.join(rootDir, 'actualites/index.html')
  let html = fs.readFileSync(hubPath, 'utf8')
  const href = `/actualites/${topic.slug}`
  if (html.includes(href)) return
  const card = `<a class="seo-hub-card" href="${href}"><span class="seo-kicker">${escapeHtml(topic.kicker)}</span><h3>${escapeHtml(copy.title)}</h3><p>${escapeHtml(copy.lead.display)}</p></a>`
  const next = prependCard(html, { gridId: 'actu-latest', card })
  if (!next) {
    console.warn('Hub /actualites : grille actu-latest introuvable.')
    return
  }
  fs.writeFileSync(hubPath, touchHubDates(next), 'utf8')
}

export function updateBlogHub(topic, copy) {
  const hubPath = path.join(rootDir, 'blog.html')
  let html = fs.readFileSync(hubPath, 'utf8')
  const href = `/blog/${topic.slug}`
  if (html.includes(href)) return
  const marker = '<h2>Coulisses du jeu</h2>'
  const grid = '<div class="seo-hub-grid" id="blog-latest">'
  if (!html.includes('id="blog-latest"')) {
    if (!html.includes(marker)) {
      console.warn('Hub /blog : section coulisses introuvable.')
      return
    }
    html = html.replace(
      marker,
      `<h2>Derniers articles</h2>\n            ${grid}\n            </div>\n            ${marker}`
    )
  }
  const card = `<a class="seo-hub-card" href="${href}"><span class="seo-kicker">${escapeHtml(topic.kicker)}</span><h3>${escapeHtml(copy.title)}</h3><p>${escapeHtml(copy.lead.display)}</p></a>`
  const next = prependCard(html, { gridId: 'blog-latest', card })
  if (!next) return
  fs.writeFileSync(hubPath, touchHubDates(next), 'utf8')
}

function gitCommit(files, message) {
  execFileSync('git', ['add', ...files], { cwd: rootDir, stdio: 'inherit' })
  try {
    execFileSync('git', ['diff', '--cached', '--quiet'], { cwd: rootDir })
    console.log('Rien à committer.')
    return
  } catch {
    // des fichiers sont stagés
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

const KINDS = {
  actu: {
    calendar: 'data/actu-calendar.json',
    log: 'data/actu-auto-log.json',
    dir: 'actualites',
    hub: 'actualites/index.html'
  },
  blog: {
    calendar: 'data/blog-calendar.json',
    log: 'data/blog-auto-log.json',
    dir: 'blog',
    hub: 'blog.html'
  }
}

export async function publishNext(kind) {
  const cfg = KINDS[kind]
  if (!cfg) throw new Error(`Type inconnu : ${kind}`)
  const logPath = path.join(rootDir, cfg.log)
  const log = loadJson(logPath, { published: [] })
  if ((log.published || []).some((row) => row.date === todayIso())) {
    console.log(`Un ${kind} a déjà été publié aujourd'hui. Stop.`)
    return 0
  }

  const pack = loadJson(path.join(rootDir, cfg.calendar), { topics: [] })
  const topics = pack.topics || []
  const done = new Set((log.published || []).map((row) => row.slug))
  const byId = loadBaremes()
  const cache = new Map()
  let chosen = null

  for (const topic of topics) {
    if (done.has(topic.slug)) continue
    const outFile = path.join(rootDir, cfg.dir, `${topic.slug}.html`)
    if (fs.existsSync(outFile)) continue
    const merged = await resolveFacts(topic, byId, cache)
    if (!merged) {
      console.log(`Skip (chiffre nommé introuvable) : ${topic.slug}`)
      continue
    }
    const copy = buildCopy(topic, merged)
    const errors = qualityGate({
      title: copy.title,
      bluf: copy.bluf,
      faq: copy.faq,
      leadDisplay: copy.lead.display,
      sourceUrl: copy.lead.sourceUrl,
      description: copy.description
    })
    if (errors.length) {
      console.log(`Skip (garde) ${topic.slug} : ${errors.join(' ; ')}`)
      continue
    }
    chosen = { topic, merged, copy, outFile }
    break
  }

  if (!chosen) {
    console.error(`File ${kind} vide ou aucun sujet n'a passé la garde.`)
    return 1
  }

  const { topic, merged, copy, outFile } = chosen
  if (process.env.DRY_RUN === '1') {
    console.log(`DRY ${kind}: ${topic.slug}`)
    console.log(copy.title)
    console.log(copy.bluf)
    return 0
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, buildPageHtml({ kind, topic, byId: merged, copy }), 'utf8')
  if (kind === 'blog') updateBlogHub(topic, copy)
  else updateActuHub(topic, copy)

  log.published = [...(log.published || []), { slug: topic.slug, date: todayIso(), title: copy.title }].slice(-200)
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2) + '\n', 'utf8')
  console.log(`${kind} créé : ${cfg.dir}/${topic.slug}.html`)

  if (process.env.AUTO_COMMIT === '1') {
    gitCommit(
      [`${cfg.dir}/${topic.slug}.html`, cfg.hub, cfg.log],
      `${kind}(auto): ${copy.title.slice(0, 70)}`
    )
  }
  return 0
}
