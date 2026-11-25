// IndexNow (Bing, Yandex, Seznam, Naver…) : https://www.indexnow.org/documentation
//
//   node scripts/indexnow.mjs diff --out indexnow-urls.txt
//     Avant la mise en ligne : compare dist/sitemap.xml au sitemap en ligne et écrit
//     les URL nouvelles, modifiées (lastmod) ou retirées.
//   node scripts/indexnow.mjs submit --in indexnow-urls.txt
//     Après la mise en ligne : attend que la clé et les pages soient servies, puis soumet.
//   node scripts/indexnow.mjs submit --all
//     Soumet toutes les URL du sitemap en ligne (après un changement de clé, par exemple).
//
// Un échec est signalé par une annotation ::error:: et un code de sortie 1.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const SITE = (process.env.SITE_URL || 'https://dodje.fr').replace(/\/$/, '')
const config = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/indexnow.json'), 'utf8'))
const KEY_URL = `${SITE}/${config.key}.txt`
const MAX_URLS = 10000
const inCI = !!process.env.GITHUB_ACTIONS

const args = process.argv.slice(2)
const mode = args[0] || 'submit'
const opt = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? null : args[i + 1]
}

function fail(message) {
  console.error(inCI ? `::error title=IndexNow::${message}` : `IndexNow ERREUR : ${message}`)
  summary(`### IndexNow : échec\n\n${message}\n`)
  process.exit(1)
}

function summary(md) {
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n')
}

function parseSitemap(xml) {
  const map = new Map()
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim()
    if (loc) map.set(loc, m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim() || '')
  }
  return map
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } })
  return { status: res.status, text: res.ok ? await res.text() : '' }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function diff() {
  const out = opt('--out') || 'indexnow-urls.txt'
  const local = parseSitemap(fs.readFileSync(path.join(rootDir, 'dist/sitemap.xml'), 'utf8'))
  let live = new Map()
  try {
    const { status, text } = await fetchText(`${SITE}/sitemap.xml`)
    if (status === 200) live = parseSitemap(text)
    else console.warn(`Sitemap en ligne HTTP ${status} : toutes les URL seront soumises`)
  } catch (err) {
    console.warn(`Sitemap en ligne illisible (${err.message}) : toutes les URL seront soumises`)
  }
  const changed = []
  for (const [loc, lastmod] of local) {
    if (!live.has(loc)) changed.push(loc)
    else if (lastmod && live.get(loc) !== lastmod) changed.push(loc)
  }
  // Pages retirées : IndexNow accepte aussi les URL supprimées (le moteur constate le 404/la redirection).
  const removed = [...live.keys()].filter((loc) => !local.has(loc))
  const urls = [...changed, ...removed].filter((u) => u.startsWith(`${SITE}/`) || u === SITE)
  fs.writeFileSync(out, urls.join('\n') + (urls.length ? '\n' : ''))
  console.log(`IndexNow diff : ${changed.length} nouvelle(s)/modifiée(s), ${removed.length} retirée(s) → ${out}`)
  for (const u of urls.slice(0, 50)) console.log(`  ${u}`)
}

// GitHub Pages met parfois une minute à servir le nouveau déploiement.
async function waitFor(url, check, label) {
  for (let i = 0; i < 20; i++) {
    try {
      const { status, text } = await fetchText(url)
      if (check(status, text)) return true
    } catch {}
    await sleep(15000)
  }
  console.warn(`${label} : toujours pas servi après 5 min (${url})`)
  return false
}

async function submit() {
  let urls
  if (args.includes('--all')) {
    const { status, text } = await fetchText(`${SITE}/sitemap.xml`)
    if (status !== 200) fail(`sitemap en ligne HTTP ${status}`)
    urls = [...parseSitemap(text).keys()]
  } else {
    const file = opt('--in') || 'indexnow-urls.txt'
    if (!fs.existsSync(file)) fail(`${file} introuvable (lancer d'abord « diff »)`)
    urls = fs.readFileSync(file, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)
  }
  urls = [...new Set(urls)].slice(0, MAX_URLS)
  if (!urls.length) {
    console.log('IndexNow : aucune URL nouvelle ou modifiée, rien à soumettre.')
    summary('### IndexNow\n\nAucune URL nouvelle ou modifiée.')
    return
  }

  const keyOk = await waitFor(KEY_URL, (s, t) => s === 200 && t.trim() === config.key, 'Fichier de clé')
  if (!keyOk) fail(`${KEY_URL} ne renvoie pas la clé : la soumission serait refusée (403)`)
  await waitFor(urls[0], (s) => s === 200 || s === 404 || s === 410, 'Première URL')

  const body = { host: config.host, key: config.key, keyLocation: KEY_URL, urlList: urls }
  let res, text
  for (let attempt = 1; attempt <= 3; attempt++) {
    res = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body)
    })
    text = (await res.text()).slice(0, 400)
    if (res.status < 500 && res.status !== 429) break
    await sleep(attempt * 20000)
  }
  // 200 : reçu. 202 : reçu, validation de la clé en attente (normal juste après un changement de clé).
  if (res.status === 200 || res.status === 202) {
    console.log(`IndexNow OK (HTTP ${res.status}) : ${urls.length} URL soumise(s) à ${config.endpoint}`)
    for (const u of urls.slice(0, 50)) console.log(`  ${u}`)
    summary(`### IndexNow : HTTP ${res.status}\n\n${urls.length} URL soumise(s).\n\n${urls.slice(0, 50).map((u) => `- ${u}`).join('\n')}`)
    return
  }
  const hints = {
    400: 'requête mal formée',
    403: 'clé refusée : fichier de clé absent ou contenu différent',
    422: "URL hors de l'hôte ou clé hors format",
    429: 'trop de soumissions (spam présumé)'
  }
  fail(`HTTP ${res.status} (${hints[res.status] || 'erreur inattendue'}) : ${text}`)
}

if (mode === 'diff') await diff()
else if (mode === 'submit') await submit()
else fail(`mode inconnu « ${mode} » (diff | submit)`)
