#!/usr/bin/env node
/**
 * Image unique par article (Google Discover, Google News, partages, aperçus des moteurs IA).
 * Trois formats recommandés par Google pour les articles : 16:9, 4:3 et 1:1, en 1200 px de large.
 * Style du site : ciel bleu, carte noire, rubrique en jaune, titre en blanc, Boky.
 *
 *   node scripts/article-image.mjs --backfill   : crée les images des articles auto déjà publiés et met à jour leurs pages
 */
import { Resvg } from '@resvg/resvg-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const SITE = 'https://dodje.fr'
const OUT_DIR = 'public/img/articles'
const FONTS = ['Outfit-Bold.ttf', 'Outfit-Medium.ttf'].map((f) => path.join(__dirname, 'assets/fonts', f))
export const FORMATS = [
  { key: '16x9', w: 1200, h: 675 },
  { key: '4x3', w: 1200, h: 900 },
  { key: '1x1', w: 1200, h: 1200 }
]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

let mascotUri = null
function mascot() {
  if (!mascotUri) {
    const svg = fs.readFileSync(path.join(rootDir, 'public/landing/img/MascotteHappy.svg'))
    mascotUri = `data:image/svg+xml;base64,${svg.toString('base64')}`
  }
  return mascotUri
}

// Coupe le titre en lignes (resvg ne fait pas de retour à la ligne) ; largeur moyenne d'un caractère d'Outfit gras ≈ 0,53 em.
function wrap(text, size, maxWidth, maxLines) {
  const perLine = Math.floor(maxWidth / (size * 0.53))
  const lines = []
  let cur = ''
  // Espaces insécables : « 3,4 % », « 1 000 € », « que faire ? » ne se coupent jamais.
  const glued = String(text).replace(/ ([%€:;?!»])/g, '\u00a0$1').replace(/« /g, '«\u00a0').replace(/(\d) (?=\d{3}\b)/g, '$1\u00a0')
  for (const word of glued.split(/[ \t\n]+/)) {
    const next = cur ? `${cur} ${word}` : word
    if (next.length > perLine && cur) {
      lines.push(cur)
      cur = word
    } else cur = next
  }
  if (cur) lines.push(cur)
  return lines.length <= maxLines ? lines : null
}

function fitTitle(title, maxWidth, maxHeight, start = 76) {
  for (let size = start; size >= 40; size -= 4) {
    const maxLines = Math.max(1, Math.floor(maxHeight / (size * 1.12)))
    const lines = wrap(title, size, maxWidth, maxLines)
    if (lines) return { size, lines }
  }
  return { size: 40, lines: wrap(title, 40, maxWidth, 99).slice(0, 5) }
}

export function articleSvg({ kicker, title }, { w, h }) {
  const pad = 44
  const card = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 }
  const inner = 64
  const tall = h > 800
  const boky = Math.round(Math.min(card.h * (tall ? 0.4 : 0.42), tall ? 440 : 300))
  const textW = card.w - inner * 2 - (h > 700 ? 0 : boky * 0.55)
  const top = card.y + inner
  const footerY = card.y + card.h - inner
  const titleTop = top + (h > 800 ? 100 : 70)
  const { size, lines } = fitTitle(title, textW, footerY - titleTop - (h > 700 ? boky : 60), h > 1000 ? 112 : h > 800 ? 96 : 76)
  const lineH = Math.round(size * 1.12)
  const titleSvg = lines
    .map((l, i) => `<text x="${card.x + inner}" y="${titleTop + size + i * lineH}" font-family="Outfit" font-weight="700" font-size="${size}" fill="#FFFFFF" letter-spacing="-1">${esc(l)}</text>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#4A72B5"/>
  <g fill="#F7F9FD" opacity="0.85">
    <circle cx="${w * 0.08}" cy="${h * 0.1}" r="70"/><circle cx="${w * 0.16}" cy="${h * 0.07}" r="90"/><circle cx="${w * 0.25}" cy="${h * 0.11}" r="60"/>
    <circle cx="${w * 0.86}" cy="${h * 0.94}" r="80"/><circle cx="${w * 0.95}" cy="${h * 0.9}" r="100"/>
  </g>
  <rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="40" fill="#0A0A0A"/>
  <text x="${card.x + inner}" y="${top + 30}" font-family="Outfit" font-weight="500" font-size="30" fill="#F3FF90" letter-spacing="3">${esc(String(kicker).toUpperCase())}</text>
  ${titleSvg}
  <text x="${card.x + inner}" y="${footerY}" font-family="Outfit" font-weight="700" font-size="40" fill="#06D001">dodje.fr</text>
  <text x="${card.x + inner + 170}" y="${footerY}" font-family="Outfit" font-weight="500" font-size="26" fill="#9A9A9A">Le jeu gratuit pour comprendre l'argent</text>
  <image x="${card.x + card.w - boky - 24}" y="${card.y + card.h - boky - 8}" width="${boky}" height="${boky}" href="${mascot()}"/>
</svg>`
}

export function renderArticleImages({ slug, kicker, title }) {
  fs.mkdirSync(path.join(rootDir, OUT_DIR), { recursive: true })
  const out = []
  for (const f of FORMATS) {
    const svg = articleSvg({ kicker, title }, f)
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: f.w },
      font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Outfit' }
    }).render().asPng()
    const rel = `${OUT_DIR}/${slug}-${f.key}.png`
    fs.writeFileSync(path.join(rootDir, rel), png)
    out.push({ ...f, rel, url: `${SITE}/img/articles/${slug}-${f.key}.png` })
  }
  return out
}

/* ------------------------------------------------ rattrapage des articles déjà publiés */

function backfill() {
  const pages = []
  for (const dir of ['actualites', 'blog']) {
    for (const f of fs.readdirSync(path.join(rootDir, dir))) {
      if (!f.endsWith('.html')) continue
      const file = path.join(rootDir, dir, f)
      const html = fs.readFileSync(file, 'utf8')
      if (!html.includes('data-editorial="ai"') || html.includes('/img/articles/')) continue
      pages.push({ file, html, slug: f.replace(/\.html$/, '') })
    }
  }
  for (const p of pages) {
    const title = p.html.match(/<h1>([\s\S]*?)<\/h1>/)[1].replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    const kicker = p.html.match(/<p class="legal-eyebrow">([\s\S]*?)<\/p>/)[1].replace(/&amp;/g, '&')
    const imgs = renderArticleImages({ slug: p.slug, kicker, title })
    let html = p.html
      .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${imgs[0].url}$2`)
      .replace(/(<meta property="og:image:height" content=")[^"]*(")/, `$1${imgs[0].h}$2`)
      .replace(/(<meta property="og:image:alt" content=")[^"]*(")/, `$1${title.replace(/"/g, '&quot;')}$2`)
      .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${imgs[0].url}$2`)
    html = html.replace(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema\.org","@type":"(?:NewsArticle|Article)".*?)<\/script>/s, (m, json) => {
      const data = JSON.parse(json.replace(/\\u003c/g, '<'))
      data.image = imgs.map((i) => ({ '@type': 'ImageObject', url: i.url, width: i.w, height: i.h }))
      return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
    })
    html = html.replace(/(<p class="content-updated">Publié le[\s\S]*?<\/p>)/, `$1\n\n            ${heroFigure(imgs[0], title)}`)
    fs.writeFileSync(p.file, html, 'utf8')
    console.log(`Image ajoutée : ${p.slug}`)
  }
}

export function heroFigure(img, title) {
  return `<figure class="content-hero"><img src="/img/articles/${path.basename(img.rel)}" alt="${esc(title)}" width="${img.w}" height="${img.h}" fetchpriority="high" decoding="async"></figure>`
}

if (import.meta.url === `file://${process.argv[1]}` && process.argv.includes('--backfill')) backfill()
