#!/usr/bin/env node
/**
 * Moteur éditorial Dodje, sans aucune dépendance (Node 20+ suffit) : il tourne dans les tâches planifiées Claude,
 * qui n'ont pas accès à npm, et dans GitHub Actions.
 *
 *   node scripts/contenu.mjs verifier content/actualites/mon-article.json   contrôle sans rien écrire
 *   node scripts/contenu.mjs publier  content/actualites/mon-article.json   contrôle, crée la page, met à jour les hubs
 *   node scripts/contenu.mjs hubs                                           régénère les grilles des hubs et le bloc de l'accueil
 *   node scripts/contenu.mjs sujets histoire                                titres déjà publiés (pour éviter les doublons)
 *
 * Format d'un article : docs/format-article.md. Règles de ton : docs/charte-editoriale.md.
 * Une page publiée a toujours un titre « … | Dodje », l'auteur Dodje Solutions, une image dédiée
 * (créée au déploiement par scripts/article-image.mjs --missing) et un lien depuis son hub et depuis l'accueil.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const rootDir = path.resolve(__dirname, '..')
const SITE = 'https://dodje.fr'
const APP_STORE = 'https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215'
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=xyz.dodje.app&hl=fr'
const AUTHOR = 'Dodje Solutions'

export const KINDS = {
  actu: {
    dir: 'actualites', hub: 'actualites/index.html', gridId: 'actu-latest', log: 'data/actu-auto-log.json',
    schema: 'NewsArticle', nav: 'actus', back: 'Toutes les actualités', label: 'Actualités'
  },
  histoire: {
    dir: 'histoire', hub: 'histoire/index.html', gridId: 'histoire-latest', log: 'data/histoire-log.json',
    schema: 'Article', nav: 'histoire', back: 'Toutes les histoires', label: 'Histoire'
  },
  // Le blog n'a plus de nouvelles publications automatiques, mais son hub garde le même design.
  blog: { dir: 'blog', hub: 'blog.html', gridId: 'blog-latest', log: 'data/blog-auto-log.json', schema: 'Article', nav: 'blog', back: 'Tous les articles', label: 'Blog' }
}

// Sources primaires reconnues (au moins une par actu).
const OFFICIAL = [
  'gouv.fr', 'service-public.fr', 'banque-france.fr', 'insee.fr', 'amf-france.org', 'legifrance.gouv.fr',
  'assemblee-nationale.fr', 'senat.fr', 'urssaf.fr', 'ecb.europa.eu', 'europa.eu', 'caf.fr', 'info-retraite.fr',
  'lassuranceretraite.fr', 'francetravail.fr', 'lafinancepourtous.com', 'inc-conso.fr', 'cre.fr', 'sec.gov',
  'caissedesdepots.fr', 'bis.org', 'imf.org', 'oecd.org', 'federalreserve.gov', 'bnf.fr', 'gallica.bnf.fr',
  'citeco.fr', 'abe-infoservice.fr', 'esma.europa.eu', 'acpr.banque-france.fr'
]

// Tournures qui sonnent « texte généré » : refusées (voir docs/charte-editoriale.md).
export const BANNED = [
  'dans un monde où', 'il est important de noter', 'il convient de noter', 'il est crucial', 'il est essentiel de',
  'plongeons', 'plongeon dans', 'en conclusion', 'en somme', 'en résumé,', 'dans cet article', 'cet article explore',
  'nous allons voir', 'force est de constater', 'à l\'ère de', 'véritable game changer', 'game-changer',
  'révolutionnaire', 'incontournable', 'sans plus attendre', 'n\'hésite pas à', 'n\'hésitez pas',
  'que tu sois', 'que vous soyez', 'embarquons', 'décortiquons', 'le monde fascinant', 'fascinant monde',
  'paysage financier', 'au cœur de', 'il était une fois', 'tapisserie', 'naviguer dans', 'dans le paysage'
]

const ALLOWED_TAGS = new Set(['p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'br', 'blockquote'])

/* ------------------------------------------------------------------ utilitaires */

export const escapeHtml = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const stripHtml = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&#39;|&rsquo;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()
const words = (s) => stripHtml(s).split(/\s+/).filter(Boolean).length
const read = (rel, fallback = null) => {
  const p = path.join(rootDir, rel)
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : fallback
}
const readJson = (rel, fallback) => {
  const t = read(rel)
  return t ? JSON.parse(t) : fallback
}
const writeFile = (rel, content) => {
  const p = path.join(rootDir, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content, 'utf8')
}

// Typographie française et nettoyage des tics d'IA (tirets cadratins, points médians, tildes).
export function cleanText(s) {
  return String(s ?? '')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s*·\s*/g, ', ')
    .replace(/~\s*/g, 'environ ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ([:;?!%»])/g, ' $1')
    .replace(/« /g, '« ')
    .replace(/(\d) (€|\$)/g, '$1 $2')
    .trim()
}

function cleanUrl(url) {
  try {
    const u = new URL(url)
    for (const k of [...u.searchParams.keys()]) if (/^(utm_|xtor|at_|fbclid|gclid|mc_)/i.test(k)) u.searchParams.delete(k)
    u.hash = ''
    return u.toString().replace(/\?$/, '')
  } catch {
    return url
  }
}
const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' } }
export const isOfficial = (url) => OFFICIAL.some((d) => host(url) === d || host(url).endsWith(`.${d}`))

export function formatDateFr(iso) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }).format(d)
}
function formatDateShort(iso) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' }).format(new Date(iso))
}

// Date et heure réelles, fuseau de Paris (jamais dans le futur).
export function nowStamp(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(now).map((x) => [x.type, x.value])
  )
  const offset = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Paris', timeZoneName: 'longOffset' }).format(now).match(/GMT([+-]\d{2}:\d{2})/)?.[1] || '+01:00'
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}:00${offset}`
}

/* ------------------------------------------------------------------ inventaire du site */

// Métadonnées d'une page de contenu, lues dans son HTML.
export function pageMeta(dir, file) {
  const html = read(`${dir}/${file}`, '')
  const slug = file.replace(/\.html$/, '')
  if (/http-equiv="refresh"|<meta name="robots" content="[^"]*noindex/i.test(html)) return null
  const title = stripHtml(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '') || stripHtml(html.match(/<title>([^<|]*)/)?.[1] || slug)
  const description = stripHtml(html.match(/<meta name="description" content="([^"]*)"/i)?.[1] || '')
  const kicker = stripHtml(html.match(/class="legal-eyebrow"[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '')
  const date = html.match(/article:published_time" content="([^"]+)"/)?.[1] || html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] || ''
  return { dir, slug, href: `/${dir}/${slug}`, title, description, kicker, date }
}

export function listPages(dir) {
  const full = path.join(rootDir, dir)
  if (!fs.existsSync(full)) return []
  return fs.readdirSync(full).filter((f) => f.endsWith('.html') && f !== 'index.html').map((f) => pageMeta(dir, f)).filter(Boolean)
}

// Pages internes qu'un article peut lier.
export function inventory() {
  const out = []
  for (const dir of ['actualites', 'histoire', 'blog', 'guides', 'outils']) {
    for (const p of listPages(dir)) out.push({ href: p.href, title: p.title })
    if (fs.existsSync(path.join(rootDir, dir, 'index.html'))) out.push({ href: `/${dir}`, title: KINDS[Object.keys(KINDS).find((k) => KINDS[k].dir === dir)]?.label || dir })
  }
  out.push({ href: '/blog', title: 'Blog' }, { href: '/jeu', title: 'Comment on joue à Dodje' }, { href: '/faq', title: 'FAQ Dodje' }, { href: '/', title: 'Dodje' })
  return out
}

// Mots significatifs d'un titre : sert à repérer un sujet déjà traité.
const STOP = new Set(('le la les un une des de du d l et ou a au aux en dans sur pour par avec sans ce ces cet cette son sa ses ton ta tes ' +
  'qui que quoi quel quelle quels quelles comment combien pourquoi est sont faut faire ca peut plus moins tout tous toute ' +
  'ne pas se france francais dodje guide ans an mois euros euro histoire vraie quand valait vaut avant apres ce que qu ton tes ta toi fait ' +
  'janvier fevrier mars avril mai juin juillet aout septembre octobre novembre decembre').split(' '))
export function topicWords(text) {
  return new Set(String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ')
    .split(' ').filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w)))
}
export function overlap(a, b) {
  const A = topicWords(a)
  const B = topicWords(b)
  if (!A.size || !B.size) return 0
  let n = 0
  for (const w of A) if (B.has(w)) n++
  return n / Math.min(A.size, B.size)
}

/* ------------------------------------------------------------------ contrôle des faits */

// Nombres écrits de façon comparable : « 1 300,5 » et « 1300.5 » donnent « 1300.5 ».
function normNumber(raw) {
  let s = String(raw).replace(/[\s  ]/g, '')
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '') // 1.300,5 (format FR avec points)
  s = s.replace(',', '.')
  if (/^\d+\.0+$/.test(s)) s = s.replace(/\.0+$/, '')
  return s
}
function numbersIn(text) {
  const out = new Set()
  for (const m of String(text).matchAll(/(?:\d{1,3}(?:[\s  ]\d{3})+|\d+)(?:[.,]\d+)?/g)) {
    const n = normNumber(m[0].trim())
    if (n) out.add(n)
    // « 1 300 » peut aussi être lu « 1 » et « 300 » : on garde aussi chaque groupe
    for (const part of m[0].trim().split(/[\s  ]+/)) out.add(normNumber(part))
  }
  return out
}
// Chiffres à vérifier : montants, pourcentages, quantités, et années.
const FACT_RE = /((?:\d{1,3}(?:[\s  ]\d{3})+|\d+)(?:[.,]\d+)?)\s?(%|€|\$|euros?|dollars?|milliards?|millions?|Md|M€|points?|ans?\b|mois\b|jours?\b|heures?\b|fois\b|bitcoins?|BTC|florins?|livres?\b|francs?\b|tonnes?\b)/gi
export function factsIn(text) {
  const facts = []
  for (const m of String(text).matchAll(FACT_RE)) facts.push({ raw: m[0].trim(), n: normNumber(m[1].trim()) })
  for (const m of String(text).matchAll(/\b(1[0-9]{3}|20[0-9]{2})\b/g)) facts.push({ raw: m[1], n: m[1], year: true })
  return facts
}

/* ------------------------------------------------------------------ normalisation et garde */

function sanitizeHtml(html, links) {
  return String(html ?? '')
    .replace(/<\s*(script|style|iframe|img|svg)[\s\S]*?(<\/\s*\1\s*>|\/>)/gi, '')
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, name, attrs) => {
      const n = name.toLowerCase()
      if (!ALLOWED_TAGS.has(n)) return ''
      if (tag.startsWith('</')) return `</${n}>`
      if (n !== 'a') return `<${n}>`
      const href = attrs.match(/href\s*=\s*"([^"]*)"/i)?.[1] || ''
      if (href.startsWith('/')) {
        const clean = href.replace(/[?#].*$/, '').replace(/\/$/, '') || '/'
        return links.has(clean) ? `<a href="${escapeHtml(clean)}">` : '<a>'
      }
      if (/^https:\/\//.test(href)) return `<a href="${escapeHtml(cleanUrl(href))}" rel="noopener" target="_blank">`
      return '<a>'
    })
    .replace(/<a>([\s\S]*?)<\/a>/g, '$1')
    .replace(/[—–]/g, ',')
    .replace(/·/g, ',')
}

export function normalize(raw, links) {
  const t = cleanText
  const a = { ...raw }
  a.slug = String(a.slug || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  for (const k of ['kicker', 'title', 'metaDescription', 'bluf', 'lesson', 'primaryKeyword']) if (a[k] != null) a[k] = t(a[k])
  a.title = String(a.title || '').replace(/\s*\|\s*Dodje\s*$/i, '')
  a.keyPoints = (a.keyPoints || []).map(t)
  a.keyFigures = (a.keyFigures || []).map((f) => ({ value: t(f.value), label: t(f.label) })).slice(0, 4)
  a.definitions = (a.definitions || []).map((d) => ({ term: t(d.term), definition: t(d.definition) }))
  a.sections = (a.sections || []).map((s) => ({ h2: t(s.h2), html: sanitizeHtml(s.html, links) }))
  a.faq = (a.faq || []).map((f) => ({ question: t(f.question), answer: t(f.answer) }))
  a.internalLinks = (a.internalLinks || []).map((l) => ({ href: String(l.href).replace(/\/$/, '') || '/', label: t(l.label) })).filter((l) => links.has(l.href))
  a.sources = (a.sources || []).map((s) => ({ label: t(s.label), url: cleanUrl(String(s.url || '').trim()), extrait: String(s.extrait || '') }))
  a.calculs = (a.calculs || []).map(String)
  return a
}

/**
 * Garde qualité. Renvoie { errors, warnings }. Une seule erreur bloque la publication.
 * Le contrôle des chiffres compare chaque chiffre de l'article aux extraits des sources (et aux calculs déclarés) :
 * un chiffre absent des sources est très probablement inventé.
 */
export function gate(kind, a, { links = new Set(), pages = [], allowExisting = false } = {}) {
  const errors = []
  const warnings = []
  const cfg = KINDS[kind]
  if (!cfg || kind === 'blog') return { errors: [`type inconnu : ${kind} (actu ou histoire)`], warnings }

  if (!/^[a-z0-9]+(-[a-z0-9]+){2,11}$/.test(a.slug)) errors.push(`slug invalide (3 à 12 mots en minuscules) : « ${a.slug} »`)
  const exists = ['actualites', 'histoire', 'blog', 'guides'].some((d) => fs.existsSync(path.join(rootDir, d, `${a.slug}.html`)))
  if (exists && !allowExisting) errors.push(`une page ${a.slug}.html existe déjà`)
  if (a.title.length < 30 || a.title.length > 62) errors.push(`titre de ${a.title.length} caractères (30 à 62 ; « | Dodje » est ajouté automatiquement)`)
  if (!a.metaDescription || a.metaDescription.length < 110 || a.metaDescription.length > 158) errors.push(`meta description de ${a.metaDescription?.length || 0} caractères (110 à 158)`)
  if (!/[.!?]$/.test(a.metaDescription || '')) errors.push('la meta description doit finir par un point')
  if (!a.kicker || a.kicker.length > 32) errors.push('rubrique (kicker) absente ou trop longue (32 caractères max)')
  if (!a.primaryKeyword) errors.push('mot-clé principal absent')
  else {
    const kw = topicWords(a.primaryKeyword)
    const inTitle = [...kw].filter((w) => topicWords(a.title).has(w)).length
    if (kw.size && inTitle / kw.size < 0.5) warnings.push(`le titre ne reprend pas le mot-clé principal « ${a.primaryKeyword} »`)
  }
  if (!a.bluf || words(a.bluf) < 25 || words(a.bluf) > 80) errors.push('chapô « En bref » : 25 à 80 mots')
  if (a.keyPoints.length < 3 || a.keyPoints.length > 5) errors.push('3 à 5 points à retenir')
  if (a.sections.length < 4 || a.sections.length > 8) errors.push(`${a.sections.length} sections (4 à 8)`)
  if (a.faq.length < 3 || a.faq.length > 6) errors.push(`${a.faq.length} questions de FAQ (3 à 6)`)
  if (kind === 'histoire' && (!a.lesson || words(a.lesson) < 15)) errors.push('histoire : la leçon pour ton argent (lesson) est obligatoire (15 mots minimum)')
  if (a.internalLinks.length < 2) errors.push('au moins 2 liens internes valides (href pris dans la liste des pages du site)')

  const total = words(a.bluf) + a.sections.reduce((n, s) => n + words(s.html), 0) + a.faq.reduce((n, f) => n + words(f.answer), 0) + words(a.lesson || '')
  const [min, max] = kind === 'histoire' ? [800, 2000] : [650, 1600]
  if (total < min || total > max) errors.push(`${total} mots (${min} à ${max})`)

  // Sources
  const https = a.sources.filter((s) => /^https:\/\//.test(s.url))
  if (https.length < 2) errors.push('au moins 2 sources en https')
  if (kind === 'actu' && !https.some((s) => isOfficial(s.url))) errors.push('une actu cite au moins une source officielle (service-public, impots.gouv, INSEE, Banque de France, AMF...)')
  for (const s of a.sources) if (words(s.extrait) < 15) errors.push(`source sans extrait suffisant (15 mots minimum, copiés de la page) : ${s.url}`)

  // Chiffres : tous doivent venir des sources ou des calculs déclarés
  const evidence = new Set([...numbersIn(a.sources.map((s) => s.extrait).join(' ')), ...numbersIn(a.calculs.join(' '))])
  const body = [a.bluf, a.lesson || '', ...a.keyPoints, ...a.keyFigures.map((f) => `${f.value} : ${f.label}`), ...a.sections.map((s) => stripHtml(s.html)), ...a.faq.map((f) => f.answer)].join(' | ')
  const facts = factsIn(body)
  const unsourced = [...new Set(facts.filter((f) => !evidence.has(f.n)).map((f) => f.raw))]
  const yearsMissing = unsourced.filter((r) => /^\d{4}$/.test(r))
  const otherMissing = unsourced.filter((r) => !/^\d{4}$/.test(r))
  if (otherMissing.length) errors.push(`chiffres absents des extraits de sources et des calculs : ${otherMissing.slice(0, 12).join(' ; ')}`)
  if (yearsMissing.length) (kind === 'histoire' ? errors : warnings).push(`années absentes des extraits : ${yearsMissing.slice(0, 12).join(', ')}`)
  const unitFacts = facts.filter((f) => !f.year)
  if (unitFacts.length < 3) errors.push(`${unitFacts.length} chiffre(s) précis seulement (3 minimum)`)

  // Ton
  const fullText = `${a.title} ${a.metaDescription} ${body} ${a.sections.map((s) => s.h2).join(' ')} ${a.faq.map((f) => f.question).join(' ')}`.toLowerCase()
  const banned = BANNED.filter((b) => fullText.includes(b))
  if (banned.length) errors.push(`tournures interdites (charte éditoriale) : ${banned.join(' ; ')}`)
  if (/\bvous\b/i.test(body)) warnings.push('vouvoiement détecté : Dodje tutoie')
  const exclam = (body.match(/!/g) || []).length
  if (exclam > 4) warnings.push(`${exclam} points d'exclamation : c'est beaucoup`)

  // Doublons
  for (const p of pages) {
    if (p.slug === a.slug) continue
    const score = overlap(a.title, p.title)
    if (score >= 0.75) errors.push(`sujet trop proche de ${p.href} (« ${p.title} »)`)
  }
  return { errors, warnings }
}

/* ------------------------------------------------------------------ rendu */

export const imageUrl = (slug, key = '16x9') => `/img/articles/${slug}-${key}.png`

function relatedLinks(kind, a, pages) {
  const taken = new Set([`/${KINDS[kind].dir}/${a.slug}`, ...a.internalLinks.map((l) => l.href)])
  const subject = `${a.title} ${a.primaryKeyword} ${a.kicker}`
  return pages
    .filter((p) => !taken.has(p.href) && /^\/(actualites|histoire|blog|guides)\//.test(p.href))
    .map((p) => ({ ...p, score: overlap(subject, p.title) }))
    .filter((p) => p.score >= 0.25)
    .sort((x, y) => y.score - x.score || (y.href.startsWith(`/${KINDS[kind].dir}/`) ? 1 : 0) - (x.href.startsWith(`/${KINDS[kind].dir}/`) ? 1 : 0))
    .slice(0, 3)
}

export function renderArticle(kind, a, { published, modified, pages = [] } = {}) {
  const cfg = KINDS[kind]
  const url = `${SITE}/${cfg.dir}/${a.slug}`
  const img = (k) => `${SITE}${imageUrl(a.slug, k)}`
  const wordCount = words(a.bluf) + a.sections.reduce((n, s) => n + words(s.html), 0) + a.faq.reduce((n, f) => n + words(f.answer), 0) + words(a.lesson || '')
  const minutes = Math.max(2, Math.round(wordCount / 220))
  const modifiedIso = modified || published
  const ld = {
    '@context': 'https://schema.org',
    '@type': cfg.schema,
    headline: a.title,
    description: a.metaDescription,
    image: [['16x9', 1200, 675], ['4x3', 1200, 900], ['1x1', 1200, 1200]].map(([k, w, h]) => ({ '@type': 'ImageObject', url: img(k), width: w, height: h })),
    datePublished: published,
    dateModified: modifiedIso,
    inLanguage: 'fr-FR',
    keywords: a.primaryKeyword,
    articleSection: a.kicker,
    wordCount,
    timeRequired: `PT${minutes}M`,
    isAccessibleForFree: true,
    author: { '@type': 'Organization', '@id': `${SITE}/#editorial-team`, name: AUTHOR, url: `${SITE}/guides/equipe-editoriale` },
    publisher: { '@id': `${SITE}/#organization` },
    mainEntityOfPage: url,
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.content-lead'] },
    about: [
      ...(kind === 'actu' ? [{ '@type': 'Country', name: 'France' }] : []),
      ...a.definitions.map((d) => ({ '@type': 'DefinedTerm', name: d.term, description: d.definition }))
    ],
    citation: a.sources.map((s) => s.url),
    ...(kind === 'histoire' && a.eventDate ? { temporalCoverage: a.eventDate } : {})
  }
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: a.faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } }))
  }
  const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c')
  const e = escapeHtml
  const related = relatedLinks(kind, a, pages)

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${e(a.title)} | Dodje</title>
    <meta name="description" content="${e(a.metaDescription)}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="author" content="${AUTHOR}">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Dodje">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:title" content="${e(a.title)}">
    <meta property="og:description" content="${e(a.metaDescription)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${img('16x9')}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="675">
    <meta property="article:published_time" content="${published}">
    <meta property="article:modified_time" content="${modifiedIso}">
    <meta property="article:section" content="${e(a.kicker)}">
    <meta property="article:author" content="${AUTHOR}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@DodjeApp">
    <meta name="twitter:title" content="${e(a.title)}">
    <meta name="twitter:description" content="${e(a.metaDescription)}">
    <meta name="twitter:image" content="${img('16x9')}">
    <link rel="icon" type="image/svg+xml" href="/assets/dodje-favicon.svg">
    <link rel="icon" type="image/png" sizes="48x48" href="/assets/dodje-favicon-48.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/dodje-apple-touch.png">
    <link rel="stylesheet" href="../styles.css">
    <script type="application/ld+json">${json(ld)}</script>
    <script type="application/ld+json">${json(faqLd)}</script>
</head>
<body>
    <main class="content-page">
        <article class="content-layout" data-editorial="${kind}">
            <p class="legal-eyebrow">${e(a.kicker)}</p>
            <h1>${e(a.title)}</h1>
            <p class="content-lead"><strong>En bref :</strong> ${e(a.bluf)}</p>
            <p class="ed-meta"><a class="ed-by" href="/guides/equipe-editoriale"><img src="/assets/dodje-favicon-48.png" alt="" width="30" height="30">Par ${AUTHOR}</a><span class="ed-dot"></span><time datetime="${published}">${formatDateFr(published)}</time><span class="ed-dot"></span><span>${minutes} min de lecture</span></p>
            <figure class="content-hero"><img src="${imageUrl(a.slug)}" alt="${e(a.title)}" width="1200" height="675" fetchpriority="high" decoding="async"></figure>
${a.keyFigures.length ? `
            <div class="ed-figures ed-wide">
                ${a.keyFigures.map((f) => `<div class="ed-figure"><b>${e(f.value)}</b><span>${e(f.label)}</span></div>`).join('\n                ')}
            </div>
` : ''}
            <div class="content-note content-keypoints">
                <p class="content-keypoints-title">À retenir</p>
                <ul>
                    ${a.keyPoints.map((p) => `<li>${e(p)}</li>`).join('\n                    ')}
                </ul>
            </div>

            ${a.sections.map((s) => `<h2>${e(s.h2)}</h2>\n            ${s.html.replace(/<table>/g, '<div class="content-table"><table>').replace(/<\/table>/g, '</table></div>')}`).join('\n\n            ')}
${a.lesson ? `
            <div class="ed-lesson">
                <p class="ed-lesson-title">La leçon pour ton argent</p>
                <p>${e(a.lesson)}</p>
            </div>
` : ''}${a.definitions.length ? `
            <section class="content-defs" aria-labelledby="defs-title">
                <h2 id="defs-title">Les mots à connaître</h2>
                <dl>
                    ${a.definitions.map((d) => `<dt>${e(d.term)}</dt><dd>${e(d.definition)}</dd>`).join('\n                    ')}
                </dl>
            </section>
` : ''}
            <h2>Questions fréquentes</h2>
            <div class="ed-faq">
                ${a.faq.map((f) => `<details><summary>${e(f.question)}</summary><p>${e(f.answer)}</p></details>`).join('\n                ')}
            </div>

            <div class="ed-cta">
                <p><strong>Et si tu t'entraînais pour de vrai ?</strong>Dans Dodje, tu apprends l'argent en 3 minutes par jour et tu fais grandir ton île. Gratuit sur iPhone et Android.</p>
                <a class="dlhref" href="${APP_STORE}" target="_blank" rel="noopener noreferrer">Jouer à Dodje</a>
            </div>
${related.length ? `
            <h2>À lire aussi</h2>
            <ul>
                ${related.map((r) => `<li><a href="${r.href}">${e(r.title)}</a></li>`).join('\n                ')}
            </ul>
` : ''}
            <div class="content-links">
                ${a.internalLinks.map((l) => `<a href="${e(l.href)}">${e(l.label)}</a>`).join('\n                ')}
                <a href="/${cfg.dir}">${cfg.back}</a>
            </div>

            <aside class="content-sources">
                <h2>Sources</h2>
                <ul>
                    ${a.sources.map((s) => `<li><a href="${e(s.url)}" rel="noopener" target="_blank">${e(s.label)}</a></li>`).join('\n                    ')}
                </ul>
            </aside>
            <div class="content-note content-ymyl">
                <p>Contenu éducatif publié par ${AUTHOR}, éditeur du jeu Dodje. Ce n'est ni un conseil en investissement ni un conseil fiscal personnalisé : vérifie toujours la source officielle avant de décider.</p>
            </div>
            <p class="content-updated">Mis à jour le ${formatDateFr(modifiedIso)}</p>
        </article>
    </main>
</body>
</html>
`
}

/* ------------------------------------------------------------------ hubs */

function card(p, featured = false) {
  const e = escapeHtml
  const date = p.date ? `<time datetime="${e(p.date)}">${formatDateShort(p.date)}</time>` : ''
  return `<a class="seo-hub-card${featured ? ' is-featured' : ''}" href="${p.href}"><img src="${imageUrl(p.slug)}" alt="" width="1200" height="675" loading="${featured ? 'eager' : 'lazy'}" decoding="async"><div class="ed-card-body"><span class="seo-kicker">${e(p.kicker || '')}</span><h3>${e(p.title)}</h3><p>${e(p.description)}</p>${date}</div></a>`
}

function sortedPages(kind) {
  const cfg = KINDS[kind]
  const log = readJson(cfg.log, { published: [] }).published || []
  const logDate = Object.fromEntries(log.map((r) => [r.slug, r.date]))
  return listPages(cfg.dir)
    .map((p) => ({ ...p, date: p.date || (logDate[p.slug] ? `${logDate[p.slug]}T07:00:00+01:00` : '') }))
    .sort((x, y) => String(y.date).localeCompare(String(x.date)) || x.title.localeCompare(y.title))
}

const TABS = [['actus', '/actualites', 'Actus'], ['histoire', '/histoire', 'Histoire'], ['blog', '/blog', 'Blog'], ['guides', '/guides', 'Guides']]
function tabsHtml(current) {
  return `<nav class="ed-tabs" aria-label="Rubriques">${TABS.map(([id, href, label]) => `<a href="${href}"${id === current ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`
}

function replaceBetween(html, name, inner) {
  const start = `<!-- ed:${name}:start -->`
  const end = `<!-- ed:${name}:end -->`
  const block = `${start}\n${inner}\n            ${end}`
  if (html.includes(start)) return html.replace(new RegExp(`${start}[\\s\\S]*?${end}`), block)
  return null
}

export function renderHub(kind) {
  const cfg = KINDS[kind]
  let html = read(cfg.hub)
  if (!html) return false
  const pages = sortedPages(kind)
  const grid = `            <div class="ed-grid" id="${cfg.gridId}">\n                ${pages.map((p, i) => card(p, i === 0)).join('\n                ')}\n            </div>`
  let next = replaceBetween(html, 'grid', grid)
  if (next == null) {
    // Première fois : remplace l'ancienne grille par le bloc balisé.
    const re = new RegExp(`<div class="seo-hub-grid" id="${cfg.gridId}">[\\s\\S]*?</div>`)
    if (!re.test(html)) { console.warn(`Hub ${cfg.hub} : grille #${cfg.gridId} introuvable`); return false }
    next = html.replace(re, `<!-- ed:grid:start -->\n${grid}\n            <!-- ed:grid:end -->`)
  }
  const tabs = replaceBetween(next, 'tabs', `            ${tabsHtml(cfg.nav)}`)
  next = tabs ?? next.replace(/(<article class="content-layout"[^>]*>)/, `$1\n            <!-- ed:tabs:start -->\n            ${tabsHtml(cfg.nav)}\n            <!-- ed:tabs:end -->`)
  if (next !== html) {
    const today = nowStamp().slice(0, 10)
    next = next
      .replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/, `"dateModified":"${today}"`)
      .replace(/Dernière mise à jour : [^<]+</, `Dernière mise à jour : ${formatDateFr(`${today}T12:00:00+01:00`)}<`)
    writeFile(cfg.hub, next)
  }
  return true
}

// Bloc « Le journal de l'île » de l'accueil : les 3 derniers articles (actu + histoire), découverts vite par Google.
export function renderHomeLatest() {
  let html = read('index.html')
  const latest = [...sortedPages('actu'), ...sortedPages('histoire')].sort((x, y) => String(y.date).localeCompare(String(x.date))).slice(0, 3)
  const e = escapeHtml
  const inner = `  <section id="journal" class="sec" aria-labelledby="journal-title">
    <div class="in" style="max-width:1000px">
      <div class="center" style="margin:0 auto 20px">
        <h2 id="journal-title" class="h2 j" style="--i:0">Le journal <span class="lime">de l'île</span></h2>
        <p class="lead j" style="--i:1;margin-top:10px">L'actu qui touche ton argent et les grandes histoires de la finance, racontées simplement.</p>
      </div>
      <div class="journal">
        ${latest.map((p, i) => `<a class="journal-card j" style="--i:${i + 1}" href="${p.href}"><img src="${imageUrl(p.slug)}" alt="" width="1200" height="675" loading="lazy" decoding="async"><div><span>${e(p.kicker || (p.dir === 'histoire' ? 'Histoire' : 'Actu'))}</span><b>${e(p.title)}</b></div></a>`).join('\n        ')}
      </div>
      <p class="faqmore j" style="--i:4"><a href="/actualites">Toutes les actus</a><a href="/histoire">Toutes les histoires</a></p>
    </div>
  </section>`
  const block = replaceBetween(html, 'journal', inner)
  const next = block ?? html.replace('  <!-- FAQ visible', `<!-- ed:journal:start -->\n${inner}\n            <!-- ed:journal:end -->\n\n  <!-- FAQ visible`)
  if (next !== html) writeFile('index.html', next)
}

export function renderAllHubs() {
  for (const kind of Object.keys(KINDS)) renderHub(kind)
  renderHomeLatest()
}

/* ------------------------------------------------------------------ publication */

export function loadArticle(file) {
  const raw = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'))
  const kind = raw.kind
  if (!KINDS[kind] || kind === 'blog') throw new Error(`"kind" doit valoir "actu" ou "histoire" (reçu : ${kind})`)
  const inv = inventory()
  const links = new Set(inv.map((p) => p.href))
  return { kind, raw, a: normalize(raw, links), links, inv }
}

export function check(file, { allowExisting = false } = {}) {
  const { kind, a, links } = loadArticle(file)
  const pages = [...listPages('actualites'), ...listPages('histoire'), ...listPages('blog'), ...listPages('guides')]
  return { kind, a, ...gate(kind, a, { links, pages, allowExisting }) }
}

export function publish(file, { now = new Date() } = {}) {
  const { kind, a, errors, warnings } = check(file, { allowExisting: Boolean(JSON.parse(fs.readFileSync(file, 'utf8')).update) })
  warnings.forEach((w) => console.warn(`⚠ ${w}`))
  if (errors.length) {
    errors.forEach((e) => console.error(`✗ ${e}`))
    return { ok: false, errors }
  }
  const cfg = KINDS[kind]
  const rel = `${cfg.dir}/${a.slug}.html`
  const previous = read(rel)
  const published = previous?.match(/article:published_time" content="([^"]+)"/)?.[1] || nowStamp(now)
  const modified = nowStamp(now)
  const pages = [...listPages('actualites'), ...listPages('histoire'), ...listPages('blog'), ...listPages('guides')]
  writeFile(rel, renderArticle(kind, a, { published, modified, pages }))

  // Habillage commun (ciel, en-tête, pied de page, design éditorial)
  return import('./site-chrome.mjs').then(({ applyChrome }) => {
    writeFile(rel, applyChrome(read(rel), rel))
    const log = readJson(cfg.log, { published: [] })
    log.published = (log.published || []).filter((r) => r.slug !== a.slug)
    log.published.push({ slug: a.slug, date: published.slice(0, 10), title: a.title, engine: 'claude-scheduled' })
    writeFile(cfg.log, JSON.stringify(log, null, 2) + '\n')
    renderAllHubs()
    console.log(`✓ Publié : ${rel} (${SITE}/${cfg.dir}/${a.slug})`)
    return { ok: true, rel, url: `${SITE}/${cfg.dir}/${a.slug}` }
  })
}

/* ------------------------------------------------------------------ ligne de commande */

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, arg] = process.argv.slice(2)
  try {
    if (cmd === 'verifier' && arg) {
      const { a, errors, warnings } = check(arg, { allowExisting: Boolean(JSON.parse(fs.readFileSync(arg, 'utf8')).update) })
      warnings.forEach((w) => console.warn(`⚠ ${w}`))
      errors.forEach((e) => console.error(`✗ ${e}`))
      console.log(errors.length ? `\n${errors.length} erreur(s) : corrige le fichier puis relance.` : `\n✓ ${a.slug} est prêt à publier (« ${a.title} | Dodje »).`)
      process.exit(errors.length ? 1 : 0)
    } else if (cmd === 'publier' && arg) {
      const res = await publish(arg)
      process.exit(res.ok ? 0 : 1)
    } else if (cmd === 'hubs') {
      renderAllHubs()
      console.log('✓ Hubs et accueil à jour.')
    } else if (cmd === 'sujets') {
      const kinds = arg ? [arg] : ['actu', 'histoire']
      for (const k of kinds) for (const p of sortedPages(k)) console.log(`${p.date.slice(0, 10) || '????-??-??'}  ${p.href}  ${p.title}`)
      if (!arg || arg === 'actu') for (const p of listPages('blog').concat(listPages('guides'))) console.log(`(page)       ${p.href}  ${p.title}`)
    } else if (cmd === 'liens') {
      for (const p of inventory()) console.log(`${p.href}  ${p.title}`)
    } else {
      console.log('Usage : node scripts/contenu.mjs verifier|publier <fichier.json> | hubs | sujets [actu|histoire] | liens')
      process.exit(2)
    }
  } catch (err) {
    console.error(`✗ ${err.message}`)
    process.exit(1)
  }
}
