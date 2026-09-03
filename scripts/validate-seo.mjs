import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildSitemapXml, sitemapMetaForUrl } from '../vite-seo.mjs'

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
  if (!html.includes('seo-breadcrumbs')) {
    fail('Breadcrumbs not injected in sample guide page')
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
    if (!html.includes('http-equiv="refresh"') || !html.includes('noindex')) {
      fail(`Invalid redirect stub content: ${relative}`)
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
  return html.includes('noindex') && html.includes('http-equiv="refresh"')
}

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
      if (!/name="robots"[^>]*noindex/i.test(html) && !html.includes('content="noindex')) continue
      if (!isRedirectStub(html)) {
        fail(`noindex hors stub de redirection: ${path.relative(distDir, full)}`)
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
  if (!html.includes('og-default-1200x630.png')) fail('Homepage OG image is not 1200x630 default')
  if (/href=["']\/?blog["']/.test(html)) fail('Homepage still links to /blog')
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
}

function validateContentPagesGeo() {
  const dirs = ['guides', 'actualites']
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
      const facts = countNumericFacts(html)
      if (facts < 3) {
        warn(`${dir}/${file}: only ${facts} numeric facts detected (target ≥ 3)`)
      }
    }
  }
}

function validateOgDefaultAsset() {
  const pub = path.join(rootDir, 'public/assets/og-default-1200x630.png')
  if (!fs.existsSync(pub)) fail('Missing public/assets/og-default-1200x630.png')
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
validateHreflangPaths()
validateBreadcrumbs()
validateBlufInDist()
validateGhPagesRedirects()
validateNoindexOnlyOnStubs()
validateHomepageGeo()
validateRobotsGrouping()
validateIndexNowKey()
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
