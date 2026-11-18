#!/usr/bin/env node
/**
 * Rédaction quotidienne avec Claude : 1 à 2 articles par jour (une actu + un article de blog).
 *
 * 1. Veille   : flux officiels (indices) + recherche web de Claude, chiffres vérifiés sur les sources primaires.
 * 2. Rédaction : un article structuré par sujet (sortie JSON validée par un schéma).
 * 3. Garde     : longueur, meta, FAQ, sources https, liens internes existants, HTML nettoyé.
 * 4. Rendu     : page HTML dans la charte du site, cartes des hubs, journal, commit.
 *
 *   ANTHROPIC_API_KEY=... node scripts/publish-ai-daily.mjs
 *   DRY_RUN=1        : fait la veille et la rédaction, n'écrit aucun fichier
 *   FIXTURE=f.json   : rend un article JSON déjà rédigé, sans appeler l'API (tests)
 *   AUTO_COMMIT=1    : commit et push des fichiers créés
 *   MAX_ARTICLES=2   : nombre d'articles visés par jour (1 ou 2)
 *
 * Code de sortie : 0 si au moins un article est en ligne pour aujourd'hui, 1 sinon.
 */
import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import { escapeHtml, rootDir, stripHtml, todayFr, todayIso, updateActuHub, updateBlogHub } from './editorial-lib.mjs'
import { footerHtml, headChrome, headerHtml, skyHtml } from './site-chrome.mjs'

const SITE = 'https://dodje.fr'
const OG = `${SITE}/assets/og-dodje-1200x630.png`
const MODEL = 'claude-opus-5-5'
const UA = 'Mozilla/5.0 (compatible; DodjeEditorialBot/1.0; +https://dodje.fr/)'
const MAX_ARTICLES = Math.min(2, Math.max(1, Number(process.env.MAX_ARTICLES || 2)))
const DRY = process.env.DRY_RUN === '1'

const KINDS = {
  actu: { dir: 'actualites', log: 'data/actu-auto-log.json', hub: 'actualites/index.html', schema: 'NewsArticle', nav: 'actus' },
  blog: { dir: 'blog', log: 'data/blog-auto-log.json', hub: 'blog.html', schema: 'Article', nav: 'blog' }
}

// Sources jugées primaires : au moins une par article.
const OFFICIAL = [
  'gouv.fr', 'service-public.fr', 'banque-france.fr', 'insee.fr', 'amf-france.org', 'legifrance.gouv.fr',
  'assemblee-nationale.fr', 'senat.fr', 'urssaf.fr', 'ecb.europa.eu', 'europa.eu', 'acpr.banque-france.fr',
  'caf.fr', 'info-retraite.fr', 'lassuranceretraite.fr', 'francetravail.fr', 'lafinancepourtous.com', 'inc-conso.fr'
]

// Flux lus chaque matin : de simples pistes, Claude vérifie et complète par sa propre recherche.
const FEEDS = [
  { name: 'INSEE', url: 'https://www.insee.fr/fr/flux/1', filter: /prix|inflation|emploi|ch[oô]mage|salaire|revenu|immobili|logement|consommation|[ée]pargne|pouvoir d.achat|PIB|cr[ée]dit|m[ée]nages/i },
  { name: 'La finance pour tous', url: 'https://www.lafinancepourtous.com/feed/' },
  { name: 'Ministère de l\'Économie', url: 'https://www.economie.gouv.fr/rss/toutesactualites', filter: /imp[oô]t|[ée]pargne|livret|cr[ée]dit|consommat|prix|budget|fiscal|retraite|aide|prime|bourse|banque|arnaque|loi de finances/i },
  { name: 'INC (Institut national de la consommation)', url: 'https://www.inc-conso.fr/rss.xml' }
]

/* ---------------------------------------------------------------- utilitaires */

function loadJson(file, fallback) {
  const p = path.join(rootDir, file)
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fallback
}

function host(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

function isOfficial(url) {
  const h = host(url)
  return OFFICIAL.some((d) => h === d || h.endsWith(`.${d}`))
}

function publishedToday() {
  const today = todayIso()
  return Object.values(KINDS).flatMap((k) => (loadJson(k.log, { published: [] }).published || []).filter((r) => r.date === today))
}

function recentTitles(limit = 80) {
  const rows = Object.values(KINDS).flatMap((k) => loadJson(k.log, { published: [] }).published || [])
  const fromLogs = rows.map((r) => r.title)
  const fromFiles = Object.values(KINDS).flatMap((k) =>
    fs.readdirSync(path.join(rootDir, k.dir)).filter((f) => f.endsWith('.html') && f !== 'index.html').map((f) => {
      const html = fs.readFileSync(path.join(rootDir, k.dir, f), 'utf8')
      return html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, '').trim() || f
    })
  )
  return [...new Set([...fromLogs, ...fromFiles])].slice(-limit)
}

// Pages internes que l'article a le droit de lier (outils, guides, actus, blog, glossaire).
function siteInventory() {
  const out = []
  for (const dir of ['outils', 'guides', 'actualites', 'blog', 'glossaire']) {
    const full = path.join(rootDir, dir)
    if (!fs.existsSync(full)) continue
    for (const f of fs.readdirSync(full)) {
      if (!f.endsWith('.html')) continue
      const href = f === 'index.html' ? `/${dir}` : `/${dir}/${f.replace(/\.html$/, '')}`
      const html = fs.readFileSync(path.join(full, f), 'utf8')
      const title = html.match(/<title>([^<|]*)/)?.[1]?.trim() || href
      out.push({ href, title })
    }
  }
  return out
}

/* ---------------------------------------------------------------- 1. veille */

function parseFeed(xml) {
  const items = []
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/g)) {
    const block = m[0]
    const pick = (tag) => block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`))?.[1]?.trim() || ''
    items.push({ title: stripHtml(pick('title')), link: stripHtml(pick('link')), date: new Date(pick('pubDate') || pick('dc:date') || 0) })
  }
  return items
}

export async function feedHints() {
  const since = Date.now() - 10 * 86400000
  const hints = []
  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const items = parseFeed(await res.text())
        .filter((i) => i.title && i.link && +i.date >= since)
        .filter((i) => !feed.filter || feed.filter.test(i.title))
        .slice(0, 8)
      hints.push(...items.map((i) => ({ ...i, source: feed.name })))
    } catch (err) {
      console.warn(`Flux ${feed.name} ignoré : ${err.message}`)
    }
  }
  return hints
}

const CHARTER = `Tu travailles pour Dodje (dodje.fr), un jeu mobile gratuit qui apprend l'argent aux 18-35 ans en France.
Le site publie chaque matin des articles d'actualité et de blog sur les finances personnelles : budget, épargne et livrets,
impôts, salaire, aides et prestations, crédit et immobilier, bourse, ETF, PEA, assurance-vie, retraite, crypto et régulation,
consommation, arnaques financières. Le lecteur n'est pas un expert : il veut savoir ce qui change pour lui et quoi faire.`

async function research(client, hints, titles, wanted) {
  const today = todayFr()
  const prompt = `Nous sommes le ${today}. Prépare le dossier de recherche des articles du jour.

Sujets à préparer : ${wanted.join(' et ')}.
- "actu" : une information des 7 derniers jours qui change concrètement quelque chose pour l'argent d'un particulier en France
  (nouveau taux, barème, loi votée ou en discussion, chiffre officiel publié, date limite, mesure annoncée, alerte AMF...).
  Choisis la plus utile pour le lecteur, pas la plus spectaculaire.
- "blog" : un sujet pratique et intemporel, rattaché si possible à l'actualité ou à la saison (fin d'année, impôts, soldes, rentrée...),
  qui répond à une question que les jeunes adultes tapent vraiment sur Google ou posent à une IA.

Déjà publiés sur le site (ne refais aucun de ces sujets, ni sous un autre angle trop proche) :
${titles.map((t) => `- ${t}`).join('\n')}

Pistes des flux officiels de ces derniers jours (à vérifier, à ignorer si elles ne concernent pas l'argent des particuliers) :
${hints.length ? hints.map((h) => `- [${h.source}] ${h.title} (${h.date.toISOString().slice(0, 10)}) ${h.link}`).join('\n') : '- aucune'}

Méthode :
1. Cherche sur le web les actualités du moment, puis ouvre les sources primaires (sites en gouv.fr, service-public.fr, Banque de France,
   INSEE, AMF, Légifrance, Assemblée nationale, Sénat, Urssaf, BCE...) pour vérifier chaque chiffre et chaque date.
2. Ne retiens un chiffre que si tu l'as lu sur une source que tu cites. Si une mesure n'est pas encore votée ou en vigueur, dis-le.
3. Si aucune actu des 7 derniers jours n'est assez utile et vérifiable, écris AUCUN pour l'actu plutôt que d'en forcer une.

Rends le dossier en texte, exactement sous cette forme, une section par sujet demandé :

## SUJET ACTU
Angle : (le titre de travail et la question à laquelle l'article répond)
Pourquoi c'est utile : (qui est concerné, ce que ça change)
Faits vérifiés : (une ligne par fait : le fait, le chiffre, la date, l'URL exacte de la source)
Contexte utile : (les notions à expliquer, les erreurs fréquentes, les cas concrets)
Requêtes visées : (3 à 5 recherches que les gens tapent sur ce sujet)

## SUJET BLOG
(même forme)`

  const messages = [{ role: 'user', content: prompt }]
  let response
  for (let turn = 0; turn < 6; turn++) {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: CHARTER,
      output_config: { effort: 'high' },
      tools: [
        { type: 'web_search_20260209', name: 'web_search', max_uses: 8, user_location: { type: 'approximate', country: 'FR', timezone: 'Europe/Paris' } },
        { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 10, max_content_tokens: 8000 }
      ],
      messages
    })
    if (response.stop_reason !== 'pause_turn') break
    messages.push({ role: 'assistant', content: response.content })
  }
  if (response.stop_reason === 'refusal') throw new Error(`Veille refusée (${response.stop_details?.category ?? 'sans catégorie'})`)
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  if (!/## SUJET/.test(text)) throw new Error('Dossier de veille vide ou mal formé')
  return text
}

/* ---------------------------------------------------------------- 2. rédaction */

const ArticleSchema = z.object({
  skip: z.boolean().describe('true seulement si le dossier ne contient aucun sujet exploitable pour ce type'),
  skipReason: z.string(),
  slug: z.string().describe('URL en minuscules, mots séparés par des tirets, sans accents, 3 à 8 mots, contient le mot-clé principal'),
  kicker: z.string().describe('Rubrique courte, par exemple "Actualité épargne" ou "Impôts"'),
  title: z.string().describe('H1 et balise title : 45 à 70 caractères, mot-clé principal au début, chiffre clé si possible'),
  metaDescription: z.string().describe('120 à 155 caractères, donne la réponse et le chiffre clé, se termine par un point'),
  primaryKeyword: z.string(),
  bluf: z.string().describe('Chapô "En bref" : 2 ou 3 phrases qui répondent directement à la question, avec le chiffre clé et la date'),
  keyPoints: z.array(z.string()).describe('3 à 5 points à retenir, une phrase chacun'),
  definitions: z.array(z.object({ term: z.string(), definition: z.string() })).describe('2 à 4 notions expliquées simplement'),
  sections: z.array(z.object({ h2: z.string(), html: z.string() })).describe('4 à 7 sections. html : p, ul, ol, li, strong, em, a, table, thead, tbody, tr, th, td uniquement'),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).describe('3 à 6 questions formulées comme de vraies recherches, réponses autonomes de 1 à 3 phrases'),
  internalLinks: z.array(z.object({ href: z.string(), label: z.string() })).describe('2 à 5 liens choisis UNIQUEMENT dans la liste fournie'),
  sources: z.array(z.object({ label: z.string(), url: z.string() })).describe('2 à 6 sources réellement utilisées, URL https exactes, au moins une source officielle')
})

async function writeArticle(client, kind, dossier, inventory) {
  const label = kind === 'actu' ? 'SUJET ACTU' : 'SUJET BLOG'
  const prompt = `Nous sommes le ${todayFr()}. Rédige l'article "${kind}" du jour à partir de la section "## ${label}" du dossier ci-dessous.
Si cette section dit AUCUN ou n'existe pas, renvoie skip = true.

Règles de rédaction :
- Français clair, tutoiement, phrases courtes, aucun jargon sans explication. Ton direct et bienveillant, jamais racoleur.
- Réponse d'abord : le chapô répond à la question en 2 ou 3 phrases, avec le chiffre clé et sa date. Chaque section commence par l'essentiel.
- Optimisation SEO et moteurs IA : mot-clé principal dans le titre, le slug, le chapô, un H2 et la meta description ; titres de sections
  formulés comme des questions ou des promesses concrètes ; dates explicites ("en novembre 2026") ; chiffres toujours attribués à leur source
  dans la phrase ("selon l'INSEE...") ; un exemple chiffré concret ; une section "Ce que ça change pour toi" ou "Ce que tu peux faire".
- 800 à 1 300 mots au total. Pas de remplissage. Au moins 3 chiffres précis et sourcés (montants, taux, dates, durées).
- N'invente rien : utilise seulement les faits du dossier. Si une mesure n'est pas encore votée ou en vigueur, écris-le clairement.
- Pas de conseil personnalisé ni de promesse de rendement. Pas de tiret cadratin, pas de point médian, pas de tilde.
- Liens internes : 2 à 5, choisis uniquement dans cette liste (href exact), et place-les aussi dans le texte des sections quand c'est naturel :
${inventory.map((p) => `  ${p.href} : ${p.title}`).join('\n')}
- Sources : les URL exactes du dossier, au moins une officielle.

Dossier :
${dossier}`

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: CHARTER,
    output_config: { effort: 'high', format: betaZodOutputFormat(ArticleSchema) },
    messages: [{ role: 'user', content: prompt }]
  })
  if (response.stop_reason === 'refusal') throw new Error(`Rédaction refusée (${response.stop_details?.category ?? 'sans catégorie'})`)
  if (response.stop_reason === 'max_tokens') throw new Error('Rédaction coupée (max_tokens)')
  if (!response.parsed_output) throw new Error('Sortie JSON invalide')
  return response.parsed_output
}

/* ---------------------------------------------------------------- 3. garde qualité */

const ALLOWED = new Set(['p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'br'])

function cleanText(s) {
  return String(s).replace(/\s*[—–]\s*/g, ', ').replace(/\s*·\s*/g, ', ').replace(/~\s*/g, 'environ ').replace(/\s+/g, ' ').trim()
}

// Garde seulement les balises autorisées ; les liens internes doivent exister, les externes sont en https.
function sanitizeHtml(html, internal) {
  return String(html)
    .replace(/<\s*(script|style|iframe)[\s\S]*?<\/\s*\1\s*>/gi, '')
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, name, attrs) => {
      const n = name.toLowerCase()
      if (!ALLOWED.has(n)) return ''
      const closing = tag.startsWith('</')
      if (closing) return `</${n}>`
      if (n !== 'a') return `<${n}>`
      const href = attrs.match(/href\s*=\s*"([^"]*)"/i)?.[1] || ''
      if (href.startsWith('/')) {
        const clean = href.replace(/[?#].*$/, '').replace(/\/$/, '') || '/'
        return internal.has(clean) || clean === '/' ? `<a href="${escapeHtml(href)}">` : '<a>'
      }
      if (/^https:\/\//.test(href)) return `<a href="${escapeHtml(href)}" rel="noopener noreferrer" target="_blank">`
      return '<a>'
    })
    .replace(/<a>([\s\S]*?)<\/a>/g, '$1')
    .replace(/[—–]/g, ',')
    .replace(/·/g, ',')
}

function words(s) {
  return stripHtml(s).split(/\s+/).filter(Boolean).length
}

export function qualityCheck(a, kind, internal) {
  const errors = []
  if (a.skip) return [`sujet abandonné : ${a.skipReason}`]
  if (!/^[a-z0-9]+(-[a-z0-9]+){1,11}$/.test(a.slug)) errors.push(`slug invalide : ${a.slug}`)
  if (a.title.length < 30 || a.title.length > 80) errors.push(`titre de ${a.title.length} caractères`)
  if (a.metaDescription.length < 90 || a.metaDescription.length > 160) errors.push(`meta description de ${a.metaDescription.length} caractères`)
  if (!/[.!?]$/.test(a.bluf.trim())) errors.push('chapô sans phrase finale')
  if (a.sections.length < 4) errors.push(`${a.sections.length} sections seulement`)
  if (a.faq.length < 3) errors.push(`${a.faq.length} questions de FAQ seulement`)
  if (a.keyPoints.length < 3) errors.push('moins de 3 points à retenir')
  const total = words(a.bluf) + a.sections.reduce((n, s) => n + words(s.html), 0) + a.faq.reduce((n, f) => n + words(f.answer), 0)
  if (total < 650) errors.push(`${total} mots seulement`)
  const body = [a.bluf, ...a.sections.map((s) => stripHtml(s.html))].join(' ')
  const facts = body.match(/\d[\d\s\u00a0\u202f.,]*\s?(?:%|€|euros?|ans?|mois|jours?|points?)/g) || []
  if (facts.length < 3) errors.push(`${facts.length} chiffre(s) seulement`)
  const httpsSources = a.sources.filter((s) => /^https:\/\//.test(s.url))
  if (httpsSources.length < 2) errors.push('moins de 2 sources https')
  if (!httpsSources.some((s) => isOfficial(s.url))) errors.push('aucune source officielle')
  if (!a.internalLinks.some((l) => internal.has(l.href))) errors.push('aucun lien interne valide')
  return errors
}

// Vérifie que les sources répondent (une 404 fait tomber la source, pas l'article).
async function checkSources(sources) {
  const ok = []
  for (const s of sources) {
    try {
      const res = await fetch(s.url, { method: 'GET', headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(15000) })
      if (res.status === 404 || res.status === 410) { console.warn(`Source retirée (${res.status}) : ${s.url}`); continue }
    } catch {
      // réseau ou blocage anti-robot : on garde la source, le lien a été lu par la veille
    }
    ok.push(s)
  }
  return ok
}

/* ---------------------------------------------------------------- 4. rendu */

export function renderPage(kind, a) {
  const cfg = KINDS[kind]
  const url = `${SITE}/${cfg.dir}/${a.slug}`
  const date = todayIso()
  const article = {
    '@context': 'https://schema.org',
    '@type': cfg.schema,
    headline: a.title,
    description: a.metaDescription,
    image: OG,
    datePublished: date,
    dateModified: date,
    inLanguage: 'fr-FR',
    keywords: a.primaryKeyword,
    articleSection: a.kicker,
    author: { '@id': `${SITE}/#editorial-team` },
    publisher: { '@id': `${SITE}/#organization` },
    mainEntityOfPage: url,
    about: { '@type': 'Country', name: 'France' },
    citation: a.sources.map((s) => s.url)
  }
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: a.faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } }))
  }
  const ldJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c')
  const back = kind === 'actu' ? '<a href="/actualites">Toutes les actualités</a>' : '<a href="/blog">Tous les articles</a>'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(a.title)} | Dodje</title>
    <meta name="description" content="${escapeHtml(a.metaDescription)}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="author" content="Dodje">
    <meta name="language" content="fr-FR">
    <link rel="canonical" href="${url}">
    <meta property="og:title" content="${escapeHtml(a.title)}">
    <meta property="og:description" content="${escapeHtml(a.metaDescription)}">
    <meta property="og:image" content="${OG}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${url}">
    <meta property="og:type" content="article">
    <meta property="og:locale" content="fr_FR">
    <meta property="article:published_time" content="${date}">
    <meta property="article:modified_time" content="${date}">
    <meta property="article:section" content="${escapeHtml(a.kicker)}">
    <link rel="icon" type="image/png" sizes="48x48" href="../assets/favicon-48.png">
    <link rel="icon" type="image/png" sizes="192x192" href="../assets/favicon-192.png">
    <link rel="stylesheet" href="../styles.css">
${headChrome()}
    <script type="application/ld+json">${ldJson(article)}</script>
    <script type="application/ld+json">${ldJson(faq)}</script>
</head>
<body>
${skyHtml()}
${headerHtml(cfg.nav)}
    <main class="content-page">
        <article class="content-layout" data-editorial="ai">
            <p class="legal-eyebrow">${escapeHtml(a.kicker)}</p>
            <h1>${escapeHtml(a.title)}</h1>
            <p class="content-lead"><strong>En bref :</strong> ${escapeHtml(a.bluf)}</p>
            <p class="content-updated">Publié le ${escapeHtml(todayFr())} par l'<a href="/guides/equipe-editoriale">équipe éditoriale Dodje</a></p>

            <div class="content-note">
                <p><strong>À retenir</strong></p>
                <ul>
                    ${a.keyPoints.map((p) => `<li>${escapeHtml(p)}</li>`).join('\n                    ')}
                </ul>
            </div>

            <section class="content-defs" aria-labelledby="defs-title">
                <h2 id="defs-title">Les mots à connaître</h2>
                <dl>
                    ${a.definitions.map((d) => `<dt>${escapeHtml(d.term)}</dt><dd>${escapeHtml(d.definition)}</dd>`).join('\n                    ')}
                </dl>
            </section>

            ${a.sections.map((s) => `<h2>${escapeHtml(s.h2)}</h2>\n            ${s.html}`).join('\n\n            ')}

            <h2>Questions fréquentes</h2>
            ${a.faq.map((f) => `<h3>${escapeHtml(f.question)}</h3>\n            <p>${escapeHtml(f.answer)}</p>`).join('\n            ')}

            <div class="content-note content-ymyl">
                <p><strong>Rappel :</strong> contenu éducatif et informatif, sans conseil en investissement ni conseil fiscal personnalisé. Vérifie toujours la source officielle avant une décision.</p>
            </div>

            <div class="content-links">
                ${a.internalLinks.map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`).join('\n                ')}
                ${back}
                <a href="/#top">Apprendre avec Dodje</a>
            </div>

            <aside class="content-sources">
                <h2>Sources</h2>
                <ul>
                    ${a.sources.map((s) => `<li><a href="${escapeHtml(s.url)}" rel="noopener noreferrer" target="_blank">${escapeHtml(s.label)}</a></li>`).join('\n                    ')}
                </ul>
            </aside>
            <p class="content-updated">Dernière mise à jour : ${escapeHtml(todayFr())}</p>
        </article>
    </main>
${footerHtml()}
</body>
</html>
`
}

function normalize(a, internal) {
  const t = (s) => cleanText(s)
  return {
    ...a,
    slug: a.slug.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
    kicker: t(a.kicker),
    title: t(a.title),
    metaDescription: t(a.metaDescription),
    bluf: t(a.bluf),
    keyPoints: a.keyPoints.map(t).slice(0, 5),
    definitions: a.definitions.map((d) => ({ term: t(d.term), definition: t(d.definition) })).slice(0, 5),
    sections: a.sections.map((s) => ({ h2: t(s.h2), html: sanitizeHtml(s.html, internal) })),
    faq: a.faq.map((f) => ({ question: t(f.question), answer: t(f.answer) })).slice(0, 6),
    internalLinks: a.internalLinks.filter((l) => internal.has(l.href)).map((l) => ({ href: l.href, label: t(l.label) })).slice(0, 5),
    sources: a.sources.filter((s) => /^https:\/\//.test(s.url)).map((s) => ({ label: t(s.label), url: s.url }))
  }
}

function writeArticleFiles(kind, a) {
  const cfg = KINDS[kind]
  let slug = a.slug
  const exists = (s) => ['actualites', 'blog'].some((d) => fs.existsSync(path.join(rootDir, d, `${s}.html`)))
  if (exists(slug)) slug = `${slug}-${todayIso()}`
  if (exists(slug)) throw new Error(`Page déjà existante : ${slug}`)
  const art = { ...a, slug }
  const rel = `${cfg.dir}/${slug}.html`
  fs.writeFileSync(path.join(rootDir, rel), renderPage(kind, art), 'utf8')
  const hubTopic = { slug, kicker: art.kicker }
  const hubCopy = { title: art.title, lead: { display: art.keyPoints[0] || art.metaDescription } }
  if (kind === 'actu') updateActuHub(hubTopic, hubCopy)
  else updateBlogHub(hubTopic, hubCopy)
  const log = loadJson(cfg.log, { published: [] })
  log.published = [...(log.published || []), { slug, date: todayIso(), title: art.title, engine: 'claude' }].slice(-400)
  fs.writeFileSync(path.join(rootDir, cfg.log), JSON.stringify(log, null, 2) + '\n', 'utf8')
  console.log(`${kind} créé : ${rel}`)
  return [rel, cfg.hub, cfg.log]
}

function gitCommit(files, message) {
  const git = (args, opts = {}) => execFileSync('git', args, { cwd: rootDir, stdio: 'inherit', ...opts })
  git(['add', ...files])
  try {
    execFileSync('git', ['diff', '--cached', '--quiet'], { cwd: rootDir })
    console.log('Rien à committer.')
    return
  } catch {
    // des fichiers sont prêts
  }
  git(['-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com', 'commit', '-m', message])
  git(['pull', '--rebase', 'origin', 'main'])
  git(['push', 'origin', 'HEAD:main'])
}

/* ---------------------------------------------------------------- main */

async function main() {
  const inventory = siteInventory()
  const internal = new Set(inventory.map((p) => p.href))

  // Mode test : rend un article déjà rédigé, sans appel à l'API.
  if (process.env.FIXTURE) {
    const { kind, article } = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'))
    const a = normalize(article, internal)
    const errors = qualityCheck(a, kind, internal)
    if (errors.length) { console.error(`Garde : ${errors.join(' ; ')}`); return 1 }
    if (DRY) { console.log(renderPage(kind, a)); return 0 }
    writeArticleFiles(kind, a)
    return 0
  }

  const already = publishedToday()
  const remaining = MAX_ARTICLES - already.length
  if (remaining <= 0) {
    console.log(`${already.length} article(s) déjà publié(s) aujourd'hui. Stop.`)
    return 0
  }
  const today = todayIso()
  const doneKinds = new Set(
    Object.keys(KINDS).filter((k) => (loadJson(KINDS[k].log, { published: [] }).published || []).some((r) => r.date === today))
  )
  // L'actu passe en premier ; le blog garantit au moins un article quand il n'y a pas d'actu utile.
  // La boucle s'arrête dès que MAX_ARTICLES est atteint.
  const wanted = ['actu', 'blog'].filter((k) => !doneKinds.has(k))
  if (!wanted.length) return 0

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY manquante : ajoute-la dans les secrets du dépôt GitHub.')
    return already.length ? 0 : 1
  }
  const client = new Anthropic({ maxRetries: 4 })

  const hints = await feedHints()
  console.log(`${hints.length} piste(s) dans les flux officiels.`)
  const dossier = await research(client, hints, recentTitles(), wanted)
  console.log('Dossier de veille prêt.')

  const files = []
  const titles = []
  let published = already.length
  for (const kind of wanted) {
    if (published >= MAX_ARTICLES) break
    try {
      const raw = await writeArticle(client, kind, dossier, inventory)
      const a = normalize(raw, internal)
      a.sources = await checkSources(a.sources)
      const errors = qualityCheck(a, kind, internal)
      if (errors.length) { console.warn(`${kind} écarté par la garde : ${errors.join(' ; ')}`); continue }
      if (DRY) { console.log(`DRY ${kind} : ${a.slug}\n${a.title}\n${a.bluf}`); published++; continue }
      files.push(...writeArticleFiles(kind, a))
      titles.push(a.title)
      published++
    } catch (err) {
      if (err instanceof Anthropic.APIError) console.error(`${kind} : erreur API ${err.status} ${err.message}`)
      else console.error(`${kind} : ${err.message}`)
    }
  }

  if (files.length && process.env.AUTO_COMMIT === '1') {
    gitCommit([...new Set(files)], `contenu(auto): ${titles.join(' + ').slice(0, 90)}`)
  }
  console.log(`${published} article(s) pour le ${todayFr()}.`)
  return published > 0 ? 0 : 1
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => process.exit(code)).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
