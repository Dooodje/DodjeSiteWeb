import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { sitemapMetaForUrl, readRedirectRules, HUB_DIRS, LEGACY_PREFIX } from '../vite-seo.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const SITE = 'https://dodje.fr'

const errors = []
const warnings = []

function fail(msg) {
  errors.push(msg)
}

function warn(msg) {
  warnings.push(msg)
}

function assertFileExists(relativePath) {
  const full = path.join(distDir, relativePath)
  if (!fs.existsSync(full)) {
    fail(`Missing artifact: ${relativePath}`)
    return false
  }
  return true
}

function validateXml(relativePath) {
  if (!assertFileExists(relativePath)) return
  const content = fs.readFileSync(path.join(distDir, relativePath), 'utf8')
  if (!content.startsWith('<?xml')) {
    fail(`${relativePath}: invalid XML header`)
  }
  if (content.includes('&') && !content.includes('&amp;') && !content.includes('&lt;')) {
    const rawAmp = content.match(/&(?!amp;|lt;|gt;|quot;|apos;)/)
    if (rawAmp) fail(`${relativePath}: unescaped ampersand`)
  }
}

function validateJson(relativePath) {
  if (!assertFileExists(relativePath)) return
  try {
    JSON.parse(fs.readFileSync(path.join(distDir, relativePath), 'utf8'))
  } catch {
    fail(`${relativePath}: invalid JSON`)
  }
}

function extractSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
}

function validateSitemapPriorities() {
  const xml = fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8')
  const urls = extractSitemapUrls(xml)

  for (const url of urls) {
    if (url.includes('/actualites/') && !url.endsWith('/actualites')) {
      const meta = sitemapMetaForUrl(url)
      if (meta.priority !== '0.85') {
        fail(`Sitemap priority wrong for ${url}: expected 0.85, got ${meta.priority}`)
      }
    }
  }

  if (urls.length < 70) {
    warn(`Sitemap has only ${urls.length} URLs (expected ~78)`)
  }
}

// Fichier servi par GitHub Pages pour une URL propre (/x -> x.html, sinon x/index.html).
function distFileForUrl(url) {
  const p = url.replace(SITE, '').replace(/^\//, '')
  if (!p) return path.join(distDir, 'index.html')
  const asFile = path.join(distDir, `${p}.html`)
  if (fs.existsSync(asFile)) return asFile
  return path.join(distDir, p, 'index.html')
}

// Chaque URL du sitemap doit répondre 200 (pas de redirection de dossier), être indexable et se déclarer canonique.
function validateSitemapUrlsServable() {
  const xml = fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8')
  for (const url of extractSitemapUrls(xml)) {
    const file = distFileForUrl(url)
    if (!fs.existsSync(file)) {
      fail(`Sitemap URL sans page servie en 200 : ${url}`)
      continue
    }
    const html = fs.readFileSync(file, 'utf8')
    if (isRedirectStub(html)) fail(`Sitemap URL qui redirige : ${url}`)
    if (/<meta name="robots" content="[^"]*noindex/i.test(html)) fail(`Sitemap URL en noindex : ${url}`)
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
    if (canonical !== url) fail(`Canonique différente de l'URL du sitemap : ${url} -> ${canonical}`)
  }
}

// /outils, /guides, /actualites doivent répondre 200 (et non 301 vers /dossier/) : leur canonique est sans slash.
function validateHubAliases() {
  for (const dir of HUB_DIRS) {
    if (!fs.existsSync(path.join(distDir, `${dir}.html`))) fail(`Alias de hub manquant : ${dir}.html (sinon /${dir} redirige vers /${dir}/)`)
  }
}

// Anciennes URL /DodjeSiteWeb/... (404 dans la Search Console) : une page de redirection par page publique.
function validateLegacyRedirects() {
  for (const sample of ['index.html', 'guides/per-vs-pea-2026.html', 'outils.html', 'actualites/index.html']) {
    const file = path.join(distDir, LEGACY_PREFIX, sample)
    if (!fs.existsSync(file) || !isRedirectStub(fs.readFileSync(file, 'utf8'))) fail(`Redirection héritée manquante : /${LEGACY_PREFIX}/${sample}`)
  }
  const notFound = path.join(distDir, '404.html')
  if (!fs.existsSync(notFound)) fail('dist/404.html manquant (page d\'erreur GitHub Pages)')
  else if (!/noindex/.test(fs.readFileSync(notFound, 'utf8'))) fail('404.html doit être en noindex')
}

// Toute page indexable d'une rubrique doit être liée depuis son hub (sinon Google la découvre mal : « Détectée, non indexée »).
function validateHubCoverage() {
  const hubs = { actualites: 'actualites/index.html', histoire: 'histoire/index.html', blog: 'blog.html', guides: 'guides/index.html', outils: 'outils/index.html' }
  const xml = fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8')
  const urls = new Set(extractSitemapUrls(xml))
  for (const [dir, hubFile] of Object.entries(hubs)) {
    const hub = fs.readFileSync(path.join(distDir, hubFile), 'utf8')
    for (const url of urls) {
      const p = url.replace(SITE, '')
      if (!p.startsWith(`/${dir}/`)) continue
      if (!hub.includes(`href="${p}"`)) fail(`Page absente de son hub ${hubFile} : ${p}`)
    }
  }
}

// Aucun lien interne vers une adresse redirigée (chaîne inutile pour Google).
function validateNoLinksToRedirects() {
  const sources = new Set(readRedirectRules(rootDir).map((r) => r.from))
  let count = 0
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (['assets', LEGACY_PREFIX].includes(entry.name)) continue
        walk(full)
      } else if (entry.name.endsWith('.html')) {
        const html = fs.readFileSync(full, 'utf8')
        if (isRedirectStub(html)) continue
        for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
          if (sources.has(m[1])) {
            count++
            if (count <= 10) fail(`Lien interne vers une redirection : ${path.relative(distDir, full)} -> ${m[1]}`)
          }
        }
      }
    }
  }
  walk(distDir)
}

// Google News n'accepte que des articles d'actualité de moins de 2 jours.
function validateNewsSitemap() {
  const file = path.join(distDir, 'sitemap-news.xml')
  if (!assertFileExists('sitemap-news.xml')) return
  const xml = fs.readFileSync(file, 'utf8')
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>[\s\S]*?<news:publication_date>([^<]+)</g)) {
    if (!m[1].startsWith(`${SITE}/actualites/`)) fail(`sitemap-news : URL hors actualités ${m[1]}`)
    const age = Date.now() - Date.parse(m[2])
    if (age > 2 * 86400000 + 3600000 || age < -3600000) fail(`sitemap-news : date hors fenêtre de 2 jours ${m[1]} (${m[2]})`)
  }
}

function validateBlufInDist() {
  const htmlFiles = []
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.html') && entry.name !== 'index.html') htmlFiles.push(full)
    }
  }
  walk(distDir)

  let missingBluf = 0
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8')
    if (!html.includes('content-lead')) continue
    if (!/En bref|Verdict/.test(html)) {
      missingBluf++
      const rel = path.relative(distDir, file)
      if (missingBluf <= 5) warn(`Missing BLUF marker: ${rel}`)
    }
  }
  if (missingBluf > 0) {
    warn(`${missingBluf} pages still missing BLUF marker after build`)
  }
}

function validateHreflangPaths() {
  const sample = path.join(distDir, 'guides/top-5-courtiers-bourse-2026.html')
  if (!fs.existsSync(sample)) return
  const html = fs.readFileSync(sample, 'utf8')
  if (!html.includes('href="https://dodje.fr/guides/top-5-courtiers-bourse-2026"')) {
    fail('hreflang URLs missing /guides/ prefix — relativePathFromRoot may be broken')
  }
}

function validateBreadcrumbs() {
  const sample = path.join(distDir, 'guides/top-5-courtiers-bourse-2026.html')
  if (!fs.existsSync(sample)) return
  const html = fs.readFileSync(sample, 'utf8')
  if (html.includes('seo-breadcrumbs')) {
    fail('Visible breadcrumbs should not be injected')
  }
  if (!html.includes('BreadcrumbList')) {
    fail('BreadcrumbList JSON-LD not injected in sample guide page')
  }
}

function validateGhPagesRedirects() {
  const redirectsFile = path.join(rootDir, 'public/_redirects')
  if (!fs.existsSync(redirectsFile)) {
    warn('public/_redirects missing')
    return
  }

  let expected = 0
  for (const line of fs.readFileSync(redirectsFile, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const parts = trimmed.split(/\s+/)
    if (parts.length < 3) continue
    const [from, , status] = parts
    if (status === '200' || from.includes('*') || !from.startsWith('/')) continue
    expected++
    const relative = from.endsWith('/')
      ? path.join(from.slice(1), 'index.html')
      : `${from.slice(1)}.html`
    const full = path.join(distDir, relative)
    if (!fs.existsSync(full)) {
      fail(`Missing GH Pages redirect stub: ${relative}`)
      continue
    }
    const html = fs.readFileSync(full, 'utf8')
    if (!isRedirectStub(html)) {
      fail(`Invalid redirect stub content: ${relative}`)
    }
    if (/name="robots"[^>]*noindex/.test(html)) {
      fail(`Redirect stub must not be noindex (contradicts the canonical): ${relative}`)
    }
  }

  if (expected === 0) warn('No redirect rules found in public/_redirects')
}

function countNumericFacts(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
  const matches = text.match(/\d[\d\s.,]{0,12}\s*(?:%|€|euros?|ans?|mois)/gi) || []
  return matches.length
}

function isRedirectStub(html) {
  return html.includes('http-equiv="refresh"') && html.includes('rel="canonical"')
}

// Le noindex est permis (page 404, désinscription, actualités périmées) tant que la page n'est pas dans le sitemap :
// validateSitemapUrlsServable() le vérifie. Ici on vérifie seulement qu'aucune page de redirection n'est en noindex.
function validateNoindexOnlyOnStubs() {
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (['assets', 'node_modules'].includes(entry.name)) continue
        walk(full)
        continue
      }
      if (!entry.name.endsWith('.html')) continue
      const html = fs.readFileSync(full, 'utf8')
      if (isRedirectStub(html) && /name="robots"[^>]*noindex/i.test(html)) {
        fail(`Page de redirection en noindex : ${path.relative(distDir, full)}`)
      }
    }
  }
  walk(distDir)
}

function validateHomepageGeo() {
  const home = path.join(distDir, 'index.html')
  if (!fs.existsSync(home)) {
    fail('dist/index.html missing')
    return
  }
  const html = fs.readFileSync(home, 'utf8')
  if (html.includes('hero-shell__seo')) fail('Homepage still has clipped .hero-shell__seo')
  if (html.includes('id="chiffres-cles"') || html.includes('id="ressources"')) {
    fail('Homepage still has post-community content blocks')
  }
  if (!html.includes('id="community"')) fail('Homepage missing community block')
  if (!html.includes('og-dodje-1200x630.png')) fail('Homepage OG image is not 1200x630 default')
  if (!/<title>[^<]*jeu[^<]*<\/title>/i.test(html)) fail('Homepage title must contain « jeu »')
  if (!/<h1[^>]*>[\s\S]*jeu[\s\S]*<\/h1>/i.test(html)) fail('Homepage H1 must contain « jeu »')
  if (!html.includes('"VideoGame"')) fail('Homepage JSON-LD missing VideoGame')
  if (!html.includes('/jeu')) fail('Homepage must link to /jeu')
  if (html.includes('apps.apple.com/us/')) fail('Homepage still links to App Store /us/')
}

function validateLlmsGameEntity() {
  const llmsPath = path.join(distDir, 'llms.txt')
  if (!fs.existsSync(llmsPath)) return
  const text = fs.readFileSync(llmsPath, 'utf8')
  if (!/jeu mobile/i.test(text)) fail('llms.txt must describe Dodje as a jeu mobile')
  if (!/Dodjis/i.test(text)) fail('llms.txt missing Dodjis')
  if (/Décrire Dodje comme app d'éducation financière gratuite pour débutants/.test(text)) {
    fail('llms.txt still uses the old « app d\'éducation » citation guideline')
  }
}

function validateNoUsStoreLinks() {
  const home = path.join(distDir, 'index.html')
  const summary = path.join(distDir, 'ai/summary.json')
  const llms = path.join(distDir, 'llms.txt')
  for (const file of [home, summary, llms]) {
    if (!fs.existsSync(file)) continue
    const text = fs.readFileSync(file, 'utf8')
    if (text.includes('apps.apple.com/us/')) {
      fail(`${path.relative(distDir, file)} still links to App Store /us/`)
    }
  }
}

function validateHomepageFaqSync() {
  const home = path.join(distDir, 'index.html')
  if (!fs.existsSync(home)) return
  const html = fs.readFileSync(home, 'utf8')
  if (!html.includes('id="home-seo-crawl"')) {
    fail('Homepage missing #home-seo-crawl (SEO/GEO copy off the visual landing)')
  }
  const faqSection = html.match(/<section id="faq-home"[\s\S]*?<\/section>/)
  if (!faqSection) {
    fail('Homepage missing #faq-home (kept in #home-seo-crawl for crawlers)')
    return
  }
  const summaries = [...faqSection[0].matchAll(/<summary>([^<]+)<\/summary>/g)].map((m) => m[1].trim())
  if (summaries.length !== 4) fail(`Homepage FAQ should show exactly 4 questions, found ${summaries.length}`)
  if (!faqSection[0].includes('href="/faq"')) fail('Homepage FAQ must link to /faq')
  for (const q of summaries) {
    if (!html.includes(`"name": "${q}"`) && !html.includes(`"name":"${q}"`)) {
      fail(`Homepage FAQ JSON-LD missing question: ${q}`)
    }
  }
}

function validateMarkdownRoutes() {
  const sample = path.join(distDir, 'guides/jeu-educatif-finance.md')
  if (!fs.existsSync(sample)) {
    fail('Missing markdown route: guides/jeu-educatif-finance.md')
    return
  }
  const md = fs.readFileSync(sample, 'utf8')
  if (!md.startsWith('#')) fail('Markdown route does not start with a heading')
  if (!/jeu/i.test(md)) fail('jeu-educatif-finance.md should mention jeu')
}

function validateRobotsGrouping() {
  const robots = path.join(distDir, 'robots.txt')
  if (!fs.existsSync(robots)) return
  const text = fs.readFileSync(robots, 'utf8')
  const starBlock = text.split(/User-agent:/i)[1] || ''
  if (!starBlock.includes('Disallow: /src/')) {
    fail('robots.txt: Disallow /src/ must live in the User-agent: * group')
  }
  const afterBytespider = text.split(/User-agent:\s*Bytespider/i)[1] || ''
  const orphan = afterBytespider.split(/User-agent:/i)[0]
  if (/Disallow:\s*\/src\//.test(orphan)) {
    fail('robots.txt: trailing Disallow after Bytespider (orphan group)')
  }
}

function validateIndexNowKey() {
  const keyPath = path.join(rootDir, 'data/indexnow.json')
  if (!fs.existsSync(keyPath)) {
    warn('data/indexnow.json missing')
    return
  }
  const config = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
  assertFileExists(`${config.key}.txt`)
  const keyFile = path.join(distDir, `${config.key}.txt`)
  if (!/^[A-Za-z0-9-]{8,128}$/.test(config.key)) fail('IndexNow: clé hors format (8 à 128 caractères a-z, A-Z, 0-9, -)')
  if (fs.existsSync(keyFile) && fs.readFileSync(keyFile, 'utf8').trim() !== config.key) {
    fail(`IndexNow: ${config.key}.txt ne contient pas exactement la clé`)
  }
}

function validateAppEducationFinanciereQuery() {
  const page = path.join(distDir, 'guides/application-education-financiere.html')
  if (!fs.existsSync(page)) {
    fail('Missing guides/application-education-financiere.html')
    return
  }
  const html = fs.readFileSync(page, 'utf8')
  if (!html.includes('app éducation financière')) {
    fail('App page missing exact query « app éducation financière »')
  }
  if (!html.includes('app éducation financiere')) {
    fail('App page missing exact query « app éducation financiere »')
  }
  if (!/<title>[^<]*app éducation financière[^<]*app éducation financiere/i.test(html)) {
    fail('App page title must contain both « app éducation financière » and « app éducation financiere »')
  }
  const home = path.join(distDir, 'index.html')
  if (fs.existsSync(home)) {
    const homeHtml = fs.readFileSync(home, 'utf8')
    if (!homeHtml.includes('app éducation financière')) {
      fail('Homepage missing exact query « app éducation financière »')
    }
    if (!homeHtml.includes('app éducation financiere')) {
      fail('Homepage missing exact query « app éducation financiere »')
    }
  }
}

function validateContentPagesGeo() {
  const dirs = ['guides', 'actualites', 'histoire', 'blog']
  for (const dir of dirs) {
    const fullDir = path.join(distDir, dir)
    if (!fs.existsSync(fullDir)) continue
    for (const file of fs.readdirSync(fullDir)) {
      if (!file.endsWith('.html') || file === 'index.html') continue
      const html = fs.readFileSync(path.join(fullDir, file), 'utf8')
      if (isRedirectStub(html)) continue
      if (html.includes('content-lead') && !/En bref|Verdict/.test(html)) {
        fail(`Missing BLUF: ${dir}/${file}`)
      }
      if (dir === 'actualites' && !html.includes('NewsArticle') && !html.includes('"Article"')) {
        fail(`Missing Article/NewsArticle JSON-LD: ${dir}/${file}`)
      }
      if ((dir === 'blog' || dir === 'histoire') && !html.includes('"Article"') && !html.includes('"@type": "Article"')) {
        fail(`Missing Article JSON-LD: ${dir}/${file}`)
      }
      const facts = countNumericFacts(html)
      if (facts < 3) {
        warn(`${dir}/${file}: only ${facts} numeric facts detected (target ≥ 3)`)
      }
    }
  }
}

function validateOgDefaultAsset() {
  const pub = path.join(rootDir, 'public/assets/og-dodje-1200x630.png')
  if (!fs.existsSync(pub)) fail('Missing public/assets/og-dodje-1200x630.png')
}

// --- Run validations ---

if (!fs.existsSync(distDir)) {
  console.error('dist/ not found — run npm run build first')
  process.exit(1)
}

assertFileExists('sitemap.xml')
assertFileExists('robots.txt')
assertFileExists('llms.txt')
assertFileExists('llms-full.txt')
assertFileExists('feed.xml')
assertFileExists('.well-known/ai.txt')
assertFileExists('ai/summary.json')

validateXml('sitemap.xml')
validateXml('feed.xml')
validateJson('ai/summary.json')
validateSitemapPriorities()
validateSitemapUrlsServable()
validateHubAliases()
validateLegacyRedirects()
validateHubCoverage()
validateNoLinksToRedirects()
validateNewsSitemap()
validateHreflangPaths()
validateBreadcrumbs()
validateBlufInDist()
validateGhPagesRedirects()
validateNoindexOnlyOnStubs()
validateHomepageGeo()
validateLlmsGameEntity()
validateNoUsStoreLinks()
validateHomepageFaqSync()
validateMarkdownRoutes()
validateRobotsGrouping()
validateIndexNowKey()
validateAppEducationFinanciereQuery()
validateContentPagesGeo()
validateOgDefaultAsset()

console.log('\n=== SEO Validation Report ===\n')

if (warnings.length) {
  console.log('Warnings:')
  warnings.forEach((w) => console.log(`  ⚠ ${w}`))
  console.log('')
}

if (errors.length) {
  console.log('Errors:')
  errors.forEach((e) => console.log(`  ✗ ${e}`))
  console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)\n`)
  process.exit(1)
}

console.log(`✓ All SEO artifacts valid (${warnings.length} warning(s))\n`)
