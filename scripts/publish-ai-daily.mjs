#!/usr/bin/env node
/**
 * Rédaction quotidienne avec Claude : 1 article par jour, moins de 15 centimes de dollar par article.
 *
 * 1. Veille   : gratuite. Flux officiels + 591 fiches service-public.gouv.fr, pages lues par ce script (pas de recherche web payante).
 *    Claude Haiku 5.5 choisit le sujet et les sources (environ 0,003 $).
 * 2. Rédaction : Claude Sonnet 5.5 rédige à partir du texte des sources lues (sortie JSON validée par un schéma, environ 0,10 $).
 *    Une correction éventuelle est faite par Haiku (environ 0,01 $).
 *    Plafond dur : EDITION_BUDGET_USD (0,15 $ par défaut) pour toute l'édition, tous passages confondus.
 * 3. Garde     : longueur, meta, FAQ, sources https, liens internes existants, HTML nettoyé,
 *               pas de doublon d'une page existante (cannibalisation : Google n'indexe qu'une des deux).
 * 4. Rendu     : page HTML dans la charte du site, date de publication réelle (jamais dans le futur),
 *               carte en tête du hub, « À lire aussi » choisi par sujet, journal, commit.
 *
 *   ANTHROPIC_API_KEY=... node scripts/publish-ai-daily.mjs
 *   DRY_RUN=1        : fait la veille et la rédaction, n'écrit aucun fichier
 *   PICK_ONLY=1      : s'arrête après le choix du sujet et la lecture des sources (aucun appel à Sonnet)
 *   FIXTURE=f.json   : rend un article JSON déjà rédigé, sans appeler l'API (tests)
 *   AUTO_COMMIT=1    : commit et push des fichiers créés
 *   MAX_ARTICLES=1   : nombre d'articles visés par jour (1 ou 2)
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
import { heroFigure, renderArticleImages } from './article-image.mjs'

const SITE = 'https://dodje.fr'
const OG = `${SITE}/assets/og-dodje-1200x630.png`
// Sonnet 5.5 rédige ; Haiku 5.5 (20 fois moins cher) choisit le sujet et corrige. Plus aucune recherche web payante.
const MODEL = 'claude-sonnet-5-5'
const CHEAP_MODEL = 'claude-haiku-5-5'
// Tarifs (dollars par million de tokens) pour suivre et plafonner le coût de chaque passage.
const PRICES = {
  [MODEL]: { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 },
  [CHEAP_MODEL]: { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 }
}
// Plafond de l'édition, tous passages confondus (les passages ratés comptent aussi).
const EDITION_BUDGET = Number(process.env.EDITION_BUDGET_USD || 0.15)
const spend = { usd: 0 }
const RUNS_LOG = 'data/ai-runs.json'
function track(label, usage, model = MODEL) {
  if (!usage) return
  const P = PRICES[model]
  const usd =
    ((usage.input_tokens || 0) * P.input +
      (usage.output_tokens || 0) * P.output +
      (usage.cache_read_input_tokens || 0) * P.cacheRead +
      (usage.cache_creation_input_tokens || 0) * P.cacheWrite) / 1e6
  spend.usd += usd
  console.log(`[coût] ${label} : ${usage.input_tokens} entrée, ${usage.cache_read_input_tokens || 0} cache, ${usage.output_tokens} sortie, environ ${usd.toFixed(4)} $`)
}
const UA = 'Mozilla/5.0 (compatible; DodjeEditorialBot/1.0; +https://dodje.fr/)'
const MAX_ARTICLES = Math.min(2, Math.max(1, Number(process.env.MAX_ARTICLES || 1)))
const DRY = process.env.DRY_RUN === '1'

// Les tâches planifiées de GitHub partent avec 4 à 10 h de retard : la rédaction tourne donc la veille au soir.
// Après 15 h (heure de Paris), on prépare l'édition du lendemain matin. EDITION_DATE=AAAA-MM-JJ force une date.
function parisHour(now) {
  return Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Europe/Paris' }).format(now))
}
const EDITION = process.env.EDITION_DATE
  ? new Date(`${process.env.EDITION_DATE}T12:00:00Z`)
  : parisHour(new Date()) >= 15 ? new Date(Date.now() + 86400000) : new Date()
const ed = () => todayIso(EDITION)
const edFr = () => todayFr(EDITION)

const KINDS = {
  actu: { dir: 'actualites', log: 'data/actu-auto-log.json', hub: 'actualites/index.html', schema: 'NewsArticle', nav: 'actus' },
  blog: { dir: 'blog', log: 'data/blog-auto-log.json', hub: 'blog.html', schema: 'Article', nav: 'blog' }
}

// Sources jugées primaires : au moins une par article.
const OFFICIAL = [
  'gouv.fr', 'service-public.fr', 'banque-france.fr', 'insee.fr', 'amf-france.org', 'legifrance.gouv.fr',
  'assemblee-nationale.fr', 'senat.fr', 'urssaf.fr', 'ecb.europa.eu', 'europa.eu', 'acpr.banque-france.fr',
  'caf.fr', 'info-retraite.fr', 'lassuranceretraite.fr', 'francetravail.fr', 'lafinancepourtous.com', 'inc-conso.fr',
  // Sources primaires : régulateur de l'énergie, gestionnaire du réseau, dépôts officiels des sociétés cotées
  'cre.fr', 'enedis.fr', 'sec.gov'
]

// Flux lus chaque matin : de simples pistes, Claude vérifie et complète par sa propre recherche.
// economie.gouv.fr bloque les robots sur ses pages (403) : ses titres servent d'indice, la source lue sera une autre page.
const FEEDS = [
  { name: 'INSEE', url: 'https://www.insee.fr/fr/flux/1', filter: /prix|inflation|emploi|ch[oô]mage|salaire|revenu|immobili|logement|consommation|[ée]pargne|pouvoir d.achat|PIB|cr[ée]dit|m[ée]nages/i },
  { name: 'La finance pour tous', url: 'https://www.lafinancepourtous.com/feed/' },
  { name: 'Ministère de l\'Économie', url: 'https://www.economie.gouv.fr/rss/toutesactualites', filter: /imp[oô]t|[ée]pargne|livret|cr[ée]dit|consommat|prix|budget|fiscal|retraite|aide|prime|bourse|banque|arnaque|loi de finances/i },
  { name: 'INC (Institut national de la consommation)', url: 'https://www.inc-conso.fr/rss.xml' },
  { name: 'Service-Public.fr', url: 'https://www.service-public.gouv.fr/abonnements/rss/actu-actualites-particuliers.rss' }
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
  const today = ed()
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
      // Pas de lien vers une page en noindex ou une redirection : Google ne doit trouver que des pages indexables.
      if (/http-equiv="refresh"|<meta name="robots" content="[^"]*noindex/i.test(html)) continue
      const title = html.match(/<title>([^<|]*)/)?.[1]?.trim() || href
      out.push({ href, title })
    }
  }
  return out
}

// Mots significatifs d'un titre, sans accents ni mots outils : sert à repérer un sujet déjà traité.
const STOP = new Set(('le la les un une des de du d l et ou a au aux en dans sur pour par avec sans ce ces cet cette son sa ses ton ta tes ' +
  'qui que quoi quel quelle quels quelles comment combien pourquoi est sont faut faire ca peut plus moins tout tous toute ' +
  'ne pas se sa france francais dodje guide 2025 2026 2027 ans an mois euros euro ' +
  'janvier fevrier mars avril mai juin juillet aout septembre octobre novembre decembre date dates').split(' '))
export function topicWords(text) {
  return new Set(
    String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').split(' ')
      .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w))
  )
}
export function overlap(a, b) {
  const A = topicWords(a)
  const B = topicWords(b)
  if (!A.size || !B.size) return 0
  let common = 0
  for (const w of A) if (B.has(w)) common++
  return common / Math.min(A.size, B.size)
}
// Page existante la plus proche d'un sujet (score de 0 à 1).
export function closestPage(text, inventory) {
  let best = { score: 0, page: null }
  for (const page of inventory) {
    const score = overlap(text, page.title)
    if (score > best.score) best = { score, page }
  }
  return best
}
// Mot-clé principal déjà porté par le titre d'une page (tous ses mots significatifs, au moins 2) :
// pour un article de blog intemporel, c'est de la cannibalisation.
export function keywordOwner(keyword, inventory) {
  const words = [...topicWords(keyword)]
  if (words.length < 2) return null
  return inventory.find((p) => {
    const t = topicWords(p.title)
    return words.every((w) => t.has(w))
  }) || null
}
// Au-delà, le sujet double une page du site : Google n'indexerait qu'une des deux (« Explorée, non indexée »).
const DUPLICATE_SCORE = 0.75

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

const TopicSchema = z.object({
  kind: z.enum(['actu', 'blog']).describe('actu : information datée des 7 derniers jours ; blog : sujet pratique intemporel'),
  angle: z.string().describe("Titre de travail et question précise à laquelle l'article répond"),
  why: z.string().describe('Qui est concerné et ce que ça change pour lui, en une phrase'),
  queries: z.array(z.string()).describe('3 à 5 recherches que les gens tapent vraiment sur ce sujet'),
  urls: z.array(z.string()).describe('2 à 4 URL copiées exactement des listes fournies, dont au moins une officielle')
})

export function referenceTopics() {
  return loadJson('data/sujets-reference.json', { fiches: [] }).fiches || []
}

// Haiku lit les pistes et choisit un seul sujet avec ses sources. Coût : environ 0,003 $.
async function pickTopic(client, hints, refs, titles, avoid, evergreen = []) {
  const prompt = `Nous sommes le ${todayFr()}. Choisis LE sujet de l'article de l'édition du ${edFr()} (publié ce matin-là).

Priorité 1, "actu" : une piste des flux de moins de 7 jours qui change concrètement quelque chose pour l'argent d'un particulier en France
(taux, barème, loi, date limite, aide, alerte arnaque...). La plus utile, pas la plus spectaculaire.
Sinon, "blog" : une fiche de référence sur une question que les 18-35 ans tapent vraiment sur Google ou posent à une IA,
rattachée si possible à la saison (fin d'année, Noël, impôts, soldes...).

Sources : choisis 2 à 4 URL, copiées exactement des listes ci-dessous, qui traitent vraiment du sujet.
Au moins une doit venir de service-public.gouv.fr, insee.fr, amf-france.org ou d'un site en gouv.fr (hors economie.gouv.fr, illisible).
Pour une actu, ajoute la ou les fiches service-public qui expliquent la règle de fond.

Déjà publiés (ne refais aucun de ces sujets, ni sous un angle trop proche) :
${titles.map((t) => `- ${t}`).join('\n')}
${evergreen.length ? `\nGuides et calculateurs déjà en ligne (ne fais pas un article qui répète l'une de ces pages ; un sujet voisin doit apporter un fait nouveau et daté) :\n${evergreen.map((t) => `- ${t}`).join('\n')}\n` : ''}${avoid.length ? `\nSujets écartés lors des derniers essais (sources illisibles ou faits invérifiables, n'y reviens pas) :\n${avoid.map((t) => `- ${t}`).join('\n')}\n` : ''}
Pistes des flux (moins de 10 jours) :
${hints.length ? hints.map((h) => `- [${h.source}, ${h.date.toISOString().slice(0, 10)}] ${h.title} : ${h.link}`).join('\n') : '- aucune'}

Fiches de référence service-public.gouv.fr (rubrique Argent, impôts, consommation) :
${refs.map((r) => `- ${r.titre} : ${r.url}`).join('\n')}`

  const response = await client.beta.messages.parse({
    model: CHEAP_MODEL,
    max_tokens: 4000,
    system: CHARTER,
    output_config: { effort: 'low', format: betaZodOutputFormat(TopicSchema) },
    messages: [{ role: 'user', content: prompt }]
  })
  track('choix du sujet (Haiku)', response.usage, CHEAP_MODEL)
  if (response.stop_reason === 'refusal') throw new Error('Choix du sujet refusé')
  if (!response.parsed_output) throw new Error('Choix du sujet : sortie JSON invalide')
  return response.parsed_output
}

// Texte principal d'une page, sans menus ni pied de page.
function pageText(html) {
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] || html.match(/<article[\s\S]*?<\/article>/i)?.[0] || html
  return stripHtml(main.replace(/<(nav|header|footer|aside|form|svg|button)[\s\S]*?<\/\1>/gi, ' '))
    .replace(/&nbsp;/g, ' ').replace(/&#39;|&rsquo;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim()
}

// Lit les sources choisies (gratuit). Garde celles qui s'ouvrent et contiennent un vrai texte.
export async function readSources(urls) {
  const out = []
  for (const url of [...new Set(urls)].slice(0, 4)) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const html = await res.text()
      const text = pageText(html)
      if (text.length < 600) throw new Error('page sans texte')
      const title = stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || url).trim()
      out.push({ url, title, text: text.slice(0, 9000) })
    } catch (err) {
      console.warn(`Source illisible (${err.message}) : ${url}`)
    }
  }
  return out
}

export function buildDossier(topic, sources) {
  return `Type : ${topic.kind}
Angle : ${topic.angle}
Pourquoi c'est utile : ${topic.why}
Requêtes visées : ${topic.queries.join(' ; ')}

Sources lues ce jour (les seuls faits utilisables ; cite ces URL exactes) :
${sources.map((src, i) => `### Source ${i + 1} : ${src.title}\nURL : ${src.url}\n${src.text}`).join('\n\n')}`
}

/* ---------------------------------------------------------------- 2. rédaction */

const ArticleSchema = z.object({
  skip: z.boolean().describe('true seulement si le dossier ne contient aucun sujet exploitable pour ce type'),
  skipReason: z.string(),
  slug: z.string().describe('URL en minuscules, mots séparés par des tirets, sans accents, 3 à 8 mots, contient le mot-clé principal'),
  kicker: z.string().describe('Rubrique courte, par exemple "Actualité épargne" ou "Impôts"'),
  title: z.string().describe('H1 et balise title : 40 à 62 caractères, mot-clé principal au début, chiffre clé si possible'),
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

export function writerRules(inventory) {
  return `${CHARTER}

Tu rédiges un article à partir du texte des sources officielles lues ce jour.

Règles de rédaction :
- Français clair, tutoiement, phrases courtes, aucun jargon sans explication. Ton direct et bienveillant, jamais racoleur.
- Réponse d'abord : le chapô répond à la question en 2 ou 3 phrases, avec le chiffre clé et sa date. Chaque section commence par une phrase
  en <strong> qui répond seule à la question du H2 (citable telle quelle par une IA, avec le chiffre et la source), puis le détail.
- Optimisation SEO et moteurs IA : mot-clé principal dans le titre, le slug, le chapô, un H2 et la meta description ; titres de sections
  formulés comme des questions ou des promesses concrètes ; dates explicites ("en novembre 2026") ; chiffres toujours attribués à leur source
  dans la phrase ("selon l'INSEE...") ; un exemple chiffré concret ; une section "Ce que ça change pour toi" ou "Ce que tu peux faire".
- 800 à 1 300 mots au total. Pas de remplissage. Au moins 3 chiffres précis et sourcés (montants, taux, dates, durées).
- N'invente rien : utilise seulement les faits écrits dans les sources du dossier. Si une mesure n'est pas encore votée ou en vigueur, écris-le clairement.
- Pas de conseil personnalisé ni de promesse de rendement. Pas de tiret cadratin, pas de point médian, pas de tilde.
- Sources : les URL exactes du dossier, au moins une officielle.
- Liens internes : 2 à 5, choisis uniquement dans cette liste (href exact), et place-les aussi dans le texte des sections quand c'est naturel :
${inventory.map((p) => `  ${p.href} : ${p.title}`).join('\n')}`
}

async function writeArticle(client, kind, dossier, inventory, fix = null) {
  let prompt = `Nous sommes le ${todayFr()}. Rédige l'article "${kind}" de l'édition du ${edFr()} à partir du dossier ci-dessous.
Si les sources ne permettent pas d'écrire un article utile avec au moins 3 chiffres précis, renvoie skip = true.

Dossier :
${dossier}`
  if (fix) {
    prompt += `

Ta première version a été refusée par la garde qualité pour ces raisons :
${fix.errors.map((e) => `- ${e}`).join('\n')}
Corrige uniquement ces points et garde tout le reste. Ta première version :
${JSON.stringify(fix.article)}`
  }

  // Rédaction : Sonnet en effort bas (le dossier est déjà prêt). Correction : Haiku, 20 fois moins cher.
  const model = fix ? CHEAP_MODEL : MODEL
  const response = await client.beta.messages.parse({
    model,
    max_tokens: 16000,
    ...(model === MODEL ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}),
    system: writerRules(inventory),
    output_config: { effort: 'low', format: betaZodOutputFormat(ArticleSchema) },
    messages: [{ role: 'user', content: prompt }]
  })
  track(`rédaction ${kind}${fix ? ' (correction Haiku)' : ''}`, response.usage, model)
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
  if (a.title.length < 30 || a.title.length > 66) errors.push(`titre de ${a.title.length} caractères`)
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

// « À lire aussi » : les 3 articles et guides les plus proches du sujet (maillage par thème),
// complétés au besoin par les derniers articles du même type.
function relatedHtml(kind, a) {
  const cfg = KINDS[kind]
  const self = `/${cfg.dir}/${a.slug}`
  const taken = new Set([self, ...a.internalLinks.map((l) => l.href)])
  const pool = siteInventory().filter((p) => /^\/(actualites|blog|guides)\/./.test(p.href) && !taken.has(p.href))
  const subject = `${a.title} ${a.primaryKeyword} ${a.kicker}`
  const rows = pool
    .map((p) => ({ ...p, score: overlap(subject, p.title) }))
    .filter((p) => p.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
  for (const r of [...(loadJson(cfg.log, { published: [] }).published || [])].reverse()) {
    if (rows.length >= 3) break
    const href = `/${cfg.dir}/${r.slug}`
    if (taken.has(href) || rows.some((x) => x.href === href) || !pool.some((p) => p.href === href)) continue
    rows.push({ href, title: r.title })
  }
  if (!rows.length) return ''
  return `<h2>À lire aussi</h2>
            <ul>
                ${rows.map((r) => `<li><a href="${r.href}">${escapeHtml(r.title.replace(/\s*\|\s*Dodje\s*$/, ''))}</a></li>`).join('\n                ')}
            </ul>
`
}

// Date et heure réelles de mise en ligne, avec le fuseau de Paris (jamais une date future :
// le passage du soir prépare l'édition du lendemain, mais la page est déployée tout de suite).
function publicationStamp(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(now).map((x) => [x.type, x.value])
  )
  const offset = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Paris', timeZoneName: 'longOffset' })
    .format(now).match(/GMT([+-]\d{2}:\d{2})/)?.[1] || '+01:00'
  const hour = parts.hour === '24' ? '00' : parts.hour
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:00${offset}`
}

export function renderPage(kind, a, imgs = null) {
  // Image propre à l'article (Discover, News, partages) ; sinon l'image générique du site.
  const main = imgs?.[0] || { url: OG, w: 1200, h: 630 }
  const cfg = KINDS[kind]
  const url = `${SITE}/${cfg.dir}/${a.slug}`
  const now = new Date()
  const stamp = publicationStamp(now)
  const dateFr = todayFr(now)
  const wordCount = words(a.bluf) + a.sections.reduce((n, s) => n + words(s.html), 0) + a.faq.reduce((n, f) => n + words(f.answer), 0)
  const article = {
    '@context': 'https://schema.org',
    '@type': cfg.schema,
    headline: a.title,
    description: a.metaDescription,
    image: imgs ? imgs.map((i) => ({ '@type': 'ImageObject', url: i.url, width: i.w, height: i.h })) : OG,
    datePublished: stamp,
    dateModified: stamp,
    inLanguage: 'fr-FR',
    keywords: a.primaryKeyword,
    articleSection: a.kicker,
    wordCount,
    isAccessibleForFree: true,
    author: { '@type': 'Organization', name: 'Équipe éditoriale Dodje', url: `${SITE}/guides/equipe-editoriale` },
    publisher: { '@id': `${SITE}/#organization` },
    mainEntityOfPage: url,
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.content-lead'] },
    about: [
      { '@type': 'Country', name: 'France' },
      ...a.definitions.map((d) => ({ '@type': 'DefinedTerm', name: d.term, description: d.definition }))
    ],
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
    <meta property="og:image" content="${main.url}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="${main.h}">
    <meta property="og:url" content="${url}">
    <meta property="og:type" content="article">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:image:alt" content="${escapeHtml(a.title)}">
    <meta property="og:site_name" content="Dodje">
    <meta property="article:published_time" content="${stamp}">
    <meta property="article:modified_time" content="${stamp}">
    <meta property="article:section" content="${escapeHtml(a.kicker)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@DodjeApp">
    <meta name="twitter:title" content="${escapeHtml(a.title)}">
    <meta name="twitter:description" content="${escapeHtml(a.metaDescription)}">
    <meta name="twitter:image" content="${main.url}">
    <link rel="icon" type="image/svg+xml" href="../assets/dodje-favicon.svg">
    <link rel="icon" type="image/png" sizes="48x48" href="../assets/dodje-favicon-48.png">
    <link rel="icon" type="image/png" sizes="192x192" href="../assets/dodje-favicon-192.png">
    <link rel="apple-touch-icon" sizes="180x180" href="../assets/dodje-apple-touch.png">
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
            <h1>${escapeHtml(a.title).replace(/ ([%€:;?!])/g, ' $1')}</h1>
            <p class="content-lead"><strong>En bref :</strong> ${escapeHtml(a.bluf)}</p>
            <p class="content-updated">Publié le ${escapeHtml(dateFr)} par l'<a href="/guides/equipe-editoriale">équipe éditoriale Dodje</a></p>
            ${imgs ? heroFigure(imgs[0], a.title) : ''}

            <div class="content-note content-ymyl">
                <p><strong>Rappel :</strong> contenu éducatif et informatif, sans conseil en investissement ni conseil fiscal personnalisé. Vérifie toujours la source officielle avant une décision.</p>
            </div>

            <div class="content-note content-keypoints">
                <p class="content-keypoints-title">À retenir</p>
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

            ${a.sections.map((s) => `<h2>${escapeHtml(s.h2)}</h2>\n            ${s.html.replace(/<table>/g, '<div class="content-table"><table>').replace(/<\/table>/g, '</table></div>')}`).join('\n\n            ')}

            <h2>Questions fréquentes</h2>
            ${a.faq.map((f) => `<h3>${escapeHtml(f.question)}</h3>\n            <p>${escapeHtml(f.answer)}</p>`).join('\n            ')}

            ${relatedHtml(kind, a)}
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
            <p class="content-updated">Dernière mise à jour : ${escapeHtml(dateFr)}</p>
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
  if (exists(slug)) slug = `${slug}-${ed()}`
  if (exists(slug)) throw new Error(`Page déjà existante : ${slug}`)
  const art = { ...a, slug }
  const rel = `${cfg.dir}/${slug}.html`
  const imgs = renderArticleImages({ slug, kicker: art.kicker, title: art.title })
  fs.writeFileSync(path.join(rootDir, rel), renderPage(kind, art, imgs), 'utf8')
  const hubTopic = { slug, kicker: art.kicker }
  const hubCopy = { title: art.title, lead: { display: art.keyPoints[0] || art.metaDescription } }
  if (kind === 'actu') updateActuHub(hubTopic, hubCopy)
  else updateBlogHub(hubTopic, hubCopy)
  const log = loadJson(cfg.log, { published: [] })
  log.published = [...(log.published || []), { slug, date: ed(), title: art.title, engine: 'claude' }].slice(-400)
  fs.writeFileSync(path.join(rootDir, cfg.log), JSON.stringify(log, null, 2) + '\n', 'utf8')
  console.log(`${kind} créé : ${rel}`)
  return [rel, cfg.hub, cfg.log, ...imgs.map((i) => i.rel)]
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

// Sujets abandonnés ou refusés ces 3 derniers jours : la veille ne doit pas retomber dessus à chaque passage
// (le 25/11/2026, quatre passages ont buté sur le même sujet blog dont la source officielle ne s'ouvrait pas).
function abandonedTopics(runs) {
  const since = Date.now() - 3 * 86400000
  const out = []
  for (const r of runs) {
    if (new Date(r.at).getTime() < since) continue
    for (const x of r.results || []) {
      if (x.outcome !== 'skip' && x.outcome !== 'rejected') continue
      const t = (x.title || x.detail || '').replace(/\s+/g, ' ').slice(0, 220)
      if (t && !out.includes(t)) out.push(t)
    }
  }
  return out.slice(-8)
}

async function main() {
  const inventory = siteInventory()
  const internal = new Set(inventory.map((p) => p.href))

  // Mode test : rend un article déjà rédigé, sans appel à l'API.
  if (process.env.FIXTURE) {
    const { kind, article } = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'))
    const a = normalize(article, internal)
    const errors = process.env.SKIP_GATE === '1' ? [] : qualityCheck(a, kind, internal)
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
  const today = ed()
  const runs = loadJson(RUNS_LOG, { runs: [] })
  const editionSpent = (runs.runs || []).filter((r) => r.edition === today).reduce((sum, r) => sum + (r.costUsd || 0), 0)
  const budget = EDITION_BUDGET * MAX_ARTICLES
  // Il faut de quoi payer au moins une rédaction (environ 0,10 $) : sinon on n'entame rien.
  if (editionSpent + 0.08 > budget) {
    console.log(`Budget de l'édition du ${edFr()} atteint (${editionSpent.toFixed(3)} $ sur ${budget.toFixed(2)} $). Stop.`)
    return already.length ? 0 : 1
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY manquante : ajoute-la dans les secrets du dépôt GitHub.')
    return already.length ? 0 : 1
  }
  const client = new Anthropic({ maxRetries: 4 })
  const record = { at: new Date().toISOString(), edition: today, researched: false, results: [], costUsd: 0 }

  const files = []
  const titles = []
  let published = already.length
  try {
    const hints = await feedHints()
    const refs = referenceTopics()
    console.log(`${hints.length} piste(s) dans les flux, ${refs.length} fiches de référence.`)
    const avoid = abandonedTopics(runs.runs || [])
    const done = new Set(recentTitles())
    const evergreen = inventory.filter((p) => /^\/(guides|outils)\/./.test(p.href)).map((p) => p.title)

    // Jusqu'à 3 choix de sujet (0,003 $ chacun) pour en trouver un dont les sources s'ouvrent.
    let topic = null
    let sources = []
    for (let attempt = 0; attempt < 3 && !topic; attempt++) {
      const t = await pickTopic(client, hints, refs, [...done], avoid, evergreen)
      const near = closestPage(t.angle, inventory)
      const owner = t.kind === 'blog' && t.queries[0] ? keywordOwner(t.queries[0], inventory) : null
      if (owner) near.score = 1, near.page = owner
      if (near.score >= DUPLICATE_SCORE) {
        console.warn(`Sujet écarté, déjà traité par ${near.page.href} : ${t.angle}`)
        record.results.push({ kind: t.kind, outcome: 'skip', detail: `doublon de ${near.page.href} : ${t.angle}` })
        avoid.push(t.angle)
        continue
      }
      const read = await readSources(t.urls)
      if (read.length >= 2 && read.some((x) => isOfficial(x.url))) {
        topic = t
        sources = read
      } else {
        console.warn(`Sujet écarté, sources insuffisantes : ${t.angle}`)
        record.results.push({ kind: t.kind, outcome: 'skip', detail: `sources illisibles : ${t.angle}` })
        avoid.push(t.angle)
      }
    }
    if (!topic) throw new Error('Aucun sujet avec au moins 2 sources lisibles dont une officielle')
    record.researched = true
    const kind = topic.kind
    const dossier = buildDossier(topic, sources)
    console.log(`Sujet : [${kind}] ${topic.angle}\nSources : ${sources.map((x) => x.url).join(', ')}`)
    if (process.env.PICK_ONLY === '1') {
      console.log(`Dossier : ${dossier.length} caractères (environ ${Math.round(dossier.length / 3.5)} tokens)`)
      record.results.push({ kind, outcome: 'pick-only', title: topic.angle })
    } else {
      // Garde-fou avant l'appel le plus cher : estimation entrée + sortie de Sonnet.
      const inputTokens = (writerRules(inventory).length + dossier.length) / 3.2
      const estimate = (inputTokens * PRICES[MODEL].input + 7000 * PRICES[MODEL].output) / 1e6
      if (editionSpent + spend.usd + estimate > budget) {
        throw new Error(`Rédaction annulée : ${(editionSpent + spend.usd + estimate).toFixed(3)} $ estimés pour un plafond de ${budget.toFixed(2)} $`)
      }
      let raw = await writeArticle(client, kind, dossier, inventory)
      if (raw.skip) {
        console.log(`${kind} abandonné : ${raw.skipReason}`)
        record.results.push({ kind, outcome: 'skip', detail: `${topic.angle} : ${raw.skipReason}` })
      } else {
        let a = normalize(raw, internal)
        a.sources = await checkSources(a.sources)
        const twin = closestPage(a.title, inventory)
        const owner = kind === 'blog' ? keywordOwner(a.primaryKeyword, inventory) : null
        if (owner) twin.score = 1, twin.page = owner
        let errors = twin.score >= DUPLICATE_SCORE ? [] : qualityCheck(a, kind, internal)
        if (twin.score >= DUPLICATE_SCORE) {
          console.warn(`${kind} écarté : même sujet que ${twin.page.href}`)
          record.results.push({ kind, outcome: 'rejected', detail: `doublon de ${twin.page.href}`, title: a.title })
          errors = null
        }
        if (errors && errors.length) {
          // Une seule correction, par Haiku : souvent un titre trop long ou un chiffre manquant.
          console.warn(`${kind} refusé par la garde, correction demandée : ${errors.join(' ; ')}`)
          raw = await writeArticle(client, kind, dossier, inventory, { errors, article: raw })
          a = normalize(raw, internal)
          a.sources = await checkSources(a.sources)
          errors = raw.skip ? [`abandonné : ${raw.skipReason}`] : qualityCheck(a, kind, internal)
        }
        if (errors === null) {
          // déjà journalisé : doublon d'une page existante
        } else if (errors.length) {
          console.warn(`${kind} écarté par la garde : ${errors.join(' ; ')}`)
          record.results.push({ kind, outcome: 'rejected', detail: errors.join(' ; '), title: a.title })
        } else if (DRY) {
          console.log(`DRY ${kind} : ${a.slug}\n${a.title}\n${a.bluf}`)
          published++
        } else {
          files.push(...writeArticleFiles(kind, a))
          titles.push(a.title)
          record.results.push({ kind, outcome: 'published', slug: a.slug, title: a.title })
          published++
        }
      }
    }
  } catch (err) {
    const detail = err instanceof Anthropic.APIError ? `erreur API ${err.status} ${err.message}` : err.message
    console.error(`Passage : ${detail}`)
    record.results.push({ kind: 'passage', outcome: 'error', detail })
  }

  // Journal des passages, versionné : il permet de suivre les refus et le coût sans accès aux logs GitHub.
  record.costUsd = Number(spend.usd.toFixed(3))
  if (!DRY && process.env.PICK_ONLY !== '1') {
    runs.runs = [...(runs.runs || []), record].slice(-300)
    fs.writeFileSync(path.join(rootDir, RUNS_LOG), JSON.stringify(runs, null, 2) + '\n', 'utf8')
  }

  if (files.length && process.env.AUTO_COMMIT === '1') {
    gitCommit([...new Set([...files, RUNS_LOG])], `contenu(auto): ${titles.join(' + ').slice(0, 90)}`)
  }
  console.log(`${published} article(s) pour l'édition du ${edFr()}.`)
  console.log(`[coût] total du passage : environ ${spend.usd.toFixed(2)} $`)
  return published > 0 ? 0 : 1
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => process.exit(code)).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
