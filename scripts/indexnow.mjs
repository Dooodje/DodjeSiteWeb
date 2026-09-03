import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const SITE = process.env.SITE_URL || 'https://dodje.fr'
const config = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'data/indexnow.json'), 'utf8')
)

function extractSitemapUrls() {
  const sitemapPath = path.join(rootDir, 'dist/sitemap.xml')
  const fallback = path.join(rootDir, 'public/sitemap.xml')
  const file = fs.existsSync(sitemapPath) ? sitemapPath : fallback
  if (!fs.existsSync(file)) {
    throw new Error('sitemap.xml introuvable (dist/ ou public/)')
  }
  const xml = fs.readFileSync(file, 'utf8')
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
}

async function pingIndexNow(urls) {
  const body = {
    host: config.host,
    key: config.key,
    keyLocation: config.keyLocation,
    urlList: urls
  }

  const res = await fetch(config.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body)
  })

  if (!res.ok && res.status !== 202) {
    const text = await res.text()
    throw new Error(`IndexNow ${res.status}: ${text.slice(0, 300)}`)
  }

  return res.status
}

const urls = extractSitemapUrls()
if (!urls.includes(`${SITE}/`)) urls.unshift(`${SITE}/`)

console.log(`IndexNow: ping de ${urls.length} URLs`)

try {
  const status = await pingIndexNow(urls)
  console.log(`IndexNow OK (HTTP ${status})`)
} catch (err) {
  console.warn(`IndexNow ignoré: ${err.message}`)
  process.exit(0)
}
