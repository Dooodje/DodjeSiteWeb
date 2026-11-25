// Audit hors ligne de dist/ selon les règles de Site Scan (Bing Webmaster Tools).
// Usage : npm run build && node scripts/bing-audit.mjs [--json]
// Seuils repris des messages de Site Scan :
//   titre 1..70 car., meta description 25..160 car., un seul <h1>, alt sur chaque <img>,
//   HTML < 125 Ko, canonical présent, lang déclaré, pas de lien interne cassé.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.resolve(__dirname, '..', 'dist')
const SITE = 'https://dodje.fr'

if (!fs.existsSync(dist)) {
  console.error('dist/ absent : lancez npm run build')
  process.exit(1)
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return ['assets', 'node_modules'].includes(e.name) ? [] : walk(p)
    return e.name.endsWith('.html') ? [p] : []
  })
}

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'))
  return m ? decode(m[2] ?? m[3] ?? '') : null
}

// Pages servies : fichier dist → chemin public (GitHub Pages sert /x pour x.html).
function urlPathOf(file) {
  let rel = path.relative(dist, file).split(path.sep).join('/')
  if (rel === 'index.html') return '/'
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length)
  return '/' + rel.replace(/\.html$/, '')
}

function exists(p) {
  const clean = decodeURIComponent(p.split('#')[0].split('?')[0])
  if (clean === '/' || clean === '') return true
  const f = path.join(dist, clean)
  return (
    fs.existsSync(f) && fs.statSync(f).isFile() ||
    fs.existsSync(f + '.html') ||
    fs.existsSync(path.join(f, 'index.html'))
  )
}

const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))

const issues = {}
const add = (kind, page, detail = '') => (issues[kind] ||= []).push(detail ? `${page} — ${detail}` : page)
const titles = new Map()
const descs = new Map()

const files = walk(dist)
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8')
  const page = urlPathOf(file)
  const robots = (html.match(/<meta[^>]+name=["']robots["'][^>]*>/i) || [''])[0]
  const noindex = /noindex/i.test(robots)
  const redirect = /http-equiv=["']refresh["']/i.test(html)
  if (redirect) continue

  const size = Buffer.byteLength(html)
  if (size > 125 * 1024) add('HTML > 125 Ko', page, `${Math.round(size / 1024)} Ko`)

  const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ''])[1])
  if (!title) add('Titre manquant', page)
  else if (title.length > 70) add('Titre > 70 car.', page, `${title.length} : ${title}`)
  if (title && !noindex) titles.set(title, [...(titles.get(title) || []), page])

  const dTag = (html.match(/<meta[^>]+name=["']description["'][^>]*>/i) || [''])[0]
  const desc = dTag ? attr(dTag, 'content') || '' : ''
  if (!desc) add('Meta description manquante', page)
  else if (desc.length > 160) add('Description > 160 car.', page, `${desc.length}`)
  else if (desc.length < 25) add('Description < 25 car.', page, `${desc.length}`)
  if (desc && !noindex) descs.set(desc, [...(descs.get(desc) || []), page])

  const h1 = (html.match(/<h1[\s>]/gi) || []).length
  if (h1 === 0) add('H1 manquant', page)
  if (h1 > 1) add('Plusieurs H1', page, `${h1}`)

  for (const img of html.match(/<img\b[^>]*>/gi) || []) {
    if (attr(img, 'alt') === null) add('Image sans alt', page, attr(img, 'src') || '')
  }

  if (!/<html[^>]+lang=/i.test(html)) add('Langue (lang) absente', page)
  if (!noindex && !/hreflang=["']fr-FR["']/i.test(html)) add('hreflang fr-FR absent', page)

  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1])
      const nodes = [data, ...(Array.isArray(data['@graph']) ? data['@graph'] : [])].flat()
      if (!nodes.some((n) => n && n['@type'])) add('JSON-LD sans @type', page)
    } catch (err) {
      add('JSON-LD invalide', page, err.message.slice(0, 80))
    }
  }

  const canTag = (html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i) || [''])[0]
  const canonical = canTag ? attr(canTag, 'href') : null
  if (!noindex) {
    if (!canonical) add('Canonical manquant', page)
    else if (!sitemapUrls.has(canonical)) add('Canonical hors sitemap', page, canonical)
  }

  const links = [...html.matchAll(/<a\b[^>]*\shref=["']([^"'#][^"']*)["']/gi)].map((m) => m[1])
  for (const href of links) {
    let p = null
    if (href.startsWith(SITE)) p = href.slice(SITE.length) || '/'
    else if (href.startsWith('/') && !href.startsWith('//')) p = href
    else if (!/^[a-z]+:/i.test(href) && !href.startsWith('//')) p = path.posix.join(path.posix.dirname(page.endsWith('/') ? page + 'x' : page), href)
    if (p && !exists(p)) add('Lien interne cassé', page, href)
  }
}

for (const [t, pages] of titles) if (pages.length > 1) add('Titre dupliqué', pages.join(', '), t)
for (const [d, pages] of descs) if (pages.length > 1) add('Description dupliquée', pages.join(', '), d.slice(0, 60) + '…')

for (const u of sitemapUrls) {
  const p = u.slice(SITE.length) || '/'
  if (!exists(p)) add('URL du sitemap sans page', u)
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(issues, null, 2))
} else {
  console.log(`Audit Bing : ${files.length} fichiers HTML, ${sitemapUrls.size} URL dans le sitemap\n`)
  const kinds = Object.keys(issues)
  if (!kinds.length) console.log('Aucun problème.')
  for (const k of kinds) {
    console.log(`## ${k} (${issues[k].length})`)
    for (const line of issues[k].slice(0, 15)) console.log(`  - ${line}`)
    if (issues[k].length > 15) console.log(`  … +${issues[k].length - 15}`)
  }
}
process.exitCode = 0
