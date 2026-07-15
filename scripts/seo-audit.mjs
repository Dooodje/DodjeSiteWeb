import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const SITE = process.env.SITE_URL || 'https://dodje.fr'
const RESEND_API_KEY = process.env.RESEND_API_KEY
const AUDIT_EMAIL = process.env.AUDIT_EMAIL || 'contact@dodje.fr'

const errors = []
const warnings = []
const checks = []

function record(name, ok, detail) {
  checks.push({ name, ok, detail })
  if (!ok) errors.push(`${name}: ${detail}`)
}

async function fetchStatus(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    return { status: res.status, ok: res.ok }
  } catch (err) {
    return { status: 0, ok: false, error: err.message }
  }
}

async function checkArtifacts() {
  const artifacts = [
    'sitemap.xml',
    'robots.txt',
    'llms.txt',
    'llms-full.txt',
    'feed.xml',
    '.well-known/ai.txt',
    'ai/summary.json'
  ]

  for (const artifact of artifacts) {
    const url = `${SITE}/${artifact}`
    const result = await fetchStatus(url)
    record(`HTTP ${artifact}`, result.ok, result.ok ? `${result.status}` : `status ${result.status}`)
  }
}

async function checkSitemapUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`)
  if (!res.ok) {
    record('Sitemap parse', false, `HTTP ${res.status}`)
    return
  }

  const xml = await res.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  record('Sitemap URL count', urls.length >= 70, `${urls.length} URLs`)

  let failed = 0
  const sample = urls.filter((_, i) => i % 7 === 0).slice(0, 15)
  for (const url of sample) {
    const result = await fetchStatus(url)
    if (!result.ok) {
      failed++
      warnings.push(`URL check failed: ${url} → ${result.status}`)
    }
  }
  record('Sitemap URL sample', failed === 0, `${sample.length - failed}/${sample.length} OK`)
}

async function checkBlufOnLive() {
  const pages = [
    `${SITE}/guides/investir-en-bourse-france-debutant`,
    `${SITE}/outils/calculateur-impot-revenu`,
    `${SITE}/actualites/mica-france-juillet-2026`
  ]

  let blufOk = 0
  for (const url of pages) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const html = await res.text()
      if (/En bref|Verdict/.test(html)) blufOk++
    } catch {
      /* ignore */
    }
  }
  record('BLUF on live pages', blufOk >= 2, `${blufOk}/${pages.length} pages with BLUF`)
}

async function sendReport() {
  const date = new Date().toISOString().slice(0, 10)
  const status = errors.length === 0 ? 'OK' : 'ISSUES'
  const subject = `[Dodje SEO] Audit ${date} — ${status}`

  const body = [
    `# Audit SEO Dodje — ${date}`,
    '',
    `Site: ${SITE}`,
    `Status: **${status}**`,
    '',
    '## Checks',
    '',
    ...checks.map((c) => `- ${c.ok ? '✓' : '✗'} ${c.name}: ${c.detail}`),
    '',
    ...(warnings.length
      ? ['## Warnings', '', ...warnings.map((w) => `- ${w}`), '']
      : []),
    ...(errors.length
      ? ['## Errors', '', ...errors.map((e) => `- ${e}`), '']
      : []),
    '---',
    'Automated audit via GitHub Actions'
  ].join('\n')

  console.log(body)

  if (!RESEND_API_KEY) {
    console.log('\n(No RESEND_API_KEY — report logged only)')
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Dodje SEO <seo-audit@dodje.fr>',
      to: [AUDIT_EMAIL],
      subject,
      text: body
    })
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
    process.exit(1)
  }

  console.log(`\nReport sent to ${AUDIT_EMAIL}`)
}

await checkArtifacts()
await checkSitemapUrls()
await checkBlufOnLive()
await sendReport()

if (errors.length > 0) {
  process.exit(1)
}
