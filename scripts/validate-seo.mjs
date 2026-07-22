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
