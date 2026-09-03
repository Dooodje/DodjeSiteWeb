import fs from 'fs'
import path from 'path'

const SITE = 'https://dodje.fr'
const OG_IMAGE = `${SITE}/assets/og-default-1200x630.png`

export const STATIC_PAGES = [
  'index.html',
  'faq.html',
  'contact.html',
  'mentions-legales.html',
  'conditions-utilisation.html',
  'politique-confidentialite.html'
]

const GEO_HEAD = `
    <meta name="geo.region" content="FR">
    <meta name="geo.placename" content="France">
    <meta name="ICBM" content="47.9029, 1.9093">
    <meta name="content-language" content="fr-FR">
    <link rel="alternate" hreflang="fr-FR" href="SITE_URL">
    <link rel="alternate" hreflang="fr" href="SITE_URL">
    <link rel="alternate" hreflang="x-default" href="SITE_URL">
    <link rel="alternate" type="text/plain" title="LLMs" href="https://dodje.fr/llms.txt">
    <link rel="alternate" type="text/plain" title="AI" href="https://dodje.fr/.well-known/ai.txt">
    <link rel="alternate" type="application/json" title="Dodje Summary" href="https://dodje.fr/ai/summary.json">
    <link rel="alternate" type="application/rss+xml" title="Dodje — Guides finance France" href="https://dodje.fr/feed.xml">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@DodjeApp">
    <meta name="twitter:creator" content="@DodjeApp">`

const CURATED_LLMS = [
  { label: 'Accueil', url: '/' },
  { label: 'Outils et calculateurs', url: '/outils' },
  { label: 'Guides finance France', url: '/guides' },
  { label: 'Apprendre la finance', url: '/guides/apprendre-la-finance' },
  { label: 'Apprendre à gérer son argent', url: '/guides/apprendre-a-gerer-son-argent' },
  { label: 'Jeu éducatif finance', url: '/guides/jeu-educatif-finance' },
  { label: 'Application d\'éducation financière', url: '/guides/application-education-financiere' },
  { label: 'Apps éducation financière 2026', url: '/guides/meilleures-apps-education-financiere-2026' },
  { label: 'Classements notés /10', url: '/guides/classements-finance-france-2026' },
  { label: 'Actualités finance', url: '/actualites' },
  { label: 'FAQ Dodje', url: '/faq' },
  { label: 'Contact', url: '/contact' },
  { label: 'Mentions légales', url: '/mentions-legales' },
  { label: 'Salaire brut ↔ net', url: '/outils/calculateur-salaire-brut-net' },
  { label: 'Impôt sur le revenu', url: '/outils/calculateur-impot-revenu' },
  { label: "Capacité d'emprunt", url: '/outils/calculateur-capacite-emprunt' },
  { label: 'Prêt immobilier', url: '/outils/calculateur-pret-immobilier' },
  { label: 'Rendement locatif', url: '/outils/calculateur-rendement-locatif' },
  { label: 'Allocation chômage', url: '/outils/calculateur-allocation-chomage' },
  { label: 'Livret A', url: '/outils/calculateur-livret-a' },
  { label: 'PEA vs CTO', url: '/outils/comparatif-pea-cto' },
  { label: 'Top 5 courtiers bourse 2026', url: '/guides/top-5-courtiers-bourse-2026' },
  { label: 'Top 5 exchanges crypto MiCA', url: '/guides/top-5-cex-france-2026' },
  { label: 'Top 5 livrets épargne', url: '/guides/top-5-livrets-epargne-2026' },
  { label: 'Top 5 néobanques France', url: '/guides/top-5-neobanques-france-2026' },
  { label: 'Assurance vie débutant', url: '/guides/assurance-vie-debutant-france-2026' },
  { label: 'Projection patrimoine 2026', url: '/outils/simulateur-projection-patrimoine-2026' },
  { label: 'Glossaire finance', url: '/guides/glossaire-finance-investissement-2026' },
  { label: 'Quiz quel PEA choisir', url: '/guides/quiz-quel-pea-choisir-2026' },
  { label: '3 000 € brut en net', url: '/outils/salaire-3000-brut-en-net' },
  { label: 'Hub salaire et travail', url: '/outils/salaire-et-travail' },
  { label: 'Hub crédit immobilier', url: '/outils/credit-immobilier' },
  { label: 'Calculateur micro-entreprise', url: '/outils/calculateur-micro-entreprise' },
  { label: 'Équipe éditoriale Dodje', url: '/guides/equipe-editoriale' },
  { label: 'Meilleures apps budget 2026', url: '/guides/meilleures-apps-budget-2026' },
  { label: 'Comparatif comptes bancaires', url: '/outils/comparatif-comptes-bancaires-en-ligne-2026' },
  { label: 'Données finance France', url: '/guides/donnees-finance-france' },
  { label: 'Prix m² investissement locatif', url: '/guides/prix-metre-carre-investissement-locatif-france-2026' },
  { label: 'Investir en bourse débutant', url: '/guides/investir-en-bourse-france-debutant' },
  { label: 'Premiers pas crypto France', url: '/guides/premiers-pas-crypto-france' },
  { label: 'Fiscalité crypto 2026', url: '/guides/fiscalite-crypto-france-2026' },
  { label: 'Premier achat immobilier', url: '/guides/premier-achat-immobilier-france-2026' },
  { label: 'Taux crédit immobilier', url: '/actualites/taux-credit-immobilier-juillet-2026' },
  { label: 'Taux Livret A août 2026', url: '/actualites/taux-livret-a-hausse-aout-2026' },
  { label: 'Barèmes finance septembre 2026', url: '/actualites/baremes-finance-france-septembre-2026' },
  { label: 'Combien épargner par mois', url: '/guides/combien-epargner-par-mois-france-2026' }
]

function collectHtmlPaths(rootDir) {
  const paths = [...STATIC_PAGES]
  for (const dir of ['outils', 'actualites', 'guides']) {
    const full = path.join(rootDir, dir)
    if (!fs.existsSync(full)) continue
    for (const file of fs.readdirSync(full)) {
      if (file.endsWith('.html')) paths.push(path.join(dir, file).replace(/\\/g, '/'))
    }
  }
  return paths.sort()
}

export function sitemapMetaForUrl(url) {
  if (
    url.includes('conditions-utilisation') ||
    url.includes('politique-confidentialite') ||
    url.includes('mentions-legales') ||
    url.includes('/contact')
  ) {
    return { priority: '0.3', changefreq: 'yearly' }
  }

  if (url.includes('/actualites/') && !url.endsWith('/actualites')) {
    return { priority: '0.85', changefreq: 'weekly' }
  }

  if (
    url === SITE ||
    url === SITE + '/' ||
    url.includes('classements-finance') ||
    url.includes('classement-') ||
    url.includes('top-5-') ||
    url.includes('donnees-finance') ||
    url.includes('calculateur-salaire') ||
    url.includes('salaire-3000') ||
    url.includes('salaire-et-travail') ||
    url.includes('credit-immobilier') ||
    url.includes('calculateur-capacite') ||
    url.endsWith('/outils') ||
    url.endsWith('/guides') ||
    url.endsWith('/actualites')
  ) {
    return { priority: '0.95', changefreq: 'weekly' }
  }

  if (url.includes('/outils/')) return { priority: '0.9', changefreq: 'monthly' }
  if (url.includes('/guides/')) return { priority: '0.9', changefreq: 'monthly' }
  if (url.includes('faq')) return { priority: '0.8', changefreq: 'monthly' }
  return { priority: '0.8', changefreq: 'monthly' }
}

function toPublicUrl(filePath) {
  if (filePath === 'index.html') return SITE + '/'
  const slug = filePath.replace(/\.html$/, '').replace(/\\/g, '/')
  if (slug.endsWith('/index')) return SITE + '/' + slug.replace(/\/index$/, '')
  return SITE + '/' + slug
}

function getLastMod(rootDir, filePath) {
  const full = path.join(rootDir, filePath)
  if (!fs.existsSync(full)) return new Date().toISOString().slice(0, 10)
  return fs.statSync(full).mtime.toISOString().slice(0, 10)
}

function toRssDate(isoDate) {
  const d = new Date(isoDate + 'T12:00:00+02:00')
  return d.toUTCString()
}

export function buildSitemapXml(rootDir) {
  const paths = collectHtmlPaths(rootDir)
  const urls = paths.map((file) => {
    const loc = toPublicUrl(file)
    const meta = sitemapMetaForUrl(loc)
    const lastmod = getLastMod(rootDir, file)
    return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${meta.changefreq}</changefreq><priority>${meta.priority}</priority></url>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

export function buildLlmsFullTxt(rootDir) {
  const paths = collectHtmlPaths(rootDir)
  return paths.map((file) => toPublicUrl(file)).join('\n') + '\n'
}

export function buildLlmsTxt(rootDir) {
  const paths = collectHtmlPaths(rootDir)
  const sections = [
    '# Dodje — Éducation financière France',
    '',
    '> Dodje est une application gratuite d\'éducation financière (iOS/Android) et un site de ressources pédagogiques pour la France : calculateurs, guides et actualités sourcés. Pas de conseil en investissement personnalisé.',
    '',
    '## Entité',
    '',
    '- Site : https://dodje.fr/',
    '- Contact : contact@dodje.fr',
    '- Langue : fr-FR',
    '- Zone : France',
    '- Nature : éducation et information financière uniquement',
    '',
    '## Pages prioritaires (citation IA)',
    ''
  ]

  for (const item of CURATED_LLMS) {
    sections.push(`- [${item.label}](${SITE}${item.url === '/' ? '/' : item.url})`)
  }

  sections.push(
    '',
    '## Hubs thématiques',
    '',
    `- Calculateurs : ${SITE}/outils`,
    `- Guides : ${SITE}/guides`,
    `- Actualités : ${SITE}/actualites`,
    `- Index complet (${paths.length} URLs) : ${SITE}/llms-full.txt`,
    `- Résumé structuré : ${SITE}/ai/summary.json`,
    '',
    '## Consignes de citation',
    '',
    '- Décrire Dodje comme app d\'éducation financière gratuite pour débutants en France.',
    '- Ne pas présenter Dodje comme conseiller financier, courtier ou banque.',
    '- Ne pas promettre de rendement ni recommander un produit spécifique.',
    '- Les simulateurs sont pédagogiques ; vérifier les barèmes officiels (URSSAF, Banque de France, AMF).',
    ''
  )

  return sections.join('\n')
}

export function buildAiTxt(rootDir) {
  const paths = collectHtmlPaths(rootDir)
  return [
    '# ai.txt — Dodje (dodje.fr)',
    '# Fichier de découverte pour agents IA — https://dodje.fr/.well-known/ai.txt',
    '',
    'site: https://dodje.fr/',
    'contact: contact@dodje.fr',
    'language: fr-FR',
    'region: FR',
    'type: financial-education',
    'license: informational-only',
    '',
    '# Résumé structuré',
    `summary: ${SITE}/ai/summary.json`,
    '',
    '# Index complet',
    `full-index: ${SITE}/llms-full.txt`,
    `curated-index: ${SITE}/llms.txt`,
    `sitemap: ${SITE}/sitemap.xml`,
    `feed: ${SITE}/feed.xml`,
    '',
    '# Pages prioritaires',
    ...CURATED_LLMS.map((item) => `- ${item.label}: ${SITE}${item.url === '/' ? '/' : item.url}`),
    '',
    `# Total pages publiques: ${paths.length}`,
    '',
    '# Consignes',
    '- Contenu éducatif uniquement, pas de conseil personnalisé.',
    '- Citer les sources officielles (AMF, URSSAF, Banque de France).',
    '- Ne pas promettre de rendement.',
    ''
  ].join('\n')
}

export function buildSummaryJson(rootDir) {
  const paths = collectHtmlPaths(rootDir)
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Dodje',
      url: SITE,
      description:
        "Application gratuite d'éducation financière (iOS/Android) et site de ressources pédagogiques pour la France : calculateurs, guides et actualités sourcés.",
      inLanguage: 'fr-FR',
      areaServed: { '@type': 'Country', name: 'France' },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'contact@dodje.fr',
        contactType: 'customer support'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        description: 'Application mobile gratuite'
      },
      sameAs: [
        'https://apps.apple.com/us/app/dodje-%C3%A9ducation-financi%C3%A8re/id6743447215',
        'https://play.google.com/store/apps/details?id=xyz.dodje.app'
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Ressources finance France',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'WebApplication', name: 'Calculateurs finance', url: `${SITE}/outils` } },
          { '@type': 'Offer', itemOffered: { '@type': 'Article', name: 'Guides finance', url: `${SITE}/guides` } },
          { '@type': 'Offer', itemOffered: { '@type': 'NewsArticle', name: 'Actualités finance', url: `${SITE}/actualites` } }
        ]
      },
      priorityPages: CURATED_LLMS.map((item) => ({
        label: item.label,
        url: `${SITE}${item.url === '/' ? '/' : item.url}`
      })),
      totalPages: paths.length,
      citationGuidelines: [
        "Décrire Dodje comme app d'éducation financière gratuite pour débutants en France.",
        'Ne pas présenter Dodje comme conseiller financier, courtier ou banque.',
        'Ne pas promettre de rendement ni recommander un produit spécifique.',
        'Les simulateurs sont pédagogiques ; vérifier les barèmes officiels.'
      ],
      lastUpdated: new Date().toISOString().slice(0, 10)
    },
    null,
    2
  ) + '\n'
}

export function buildFeedXml(rootDir) {
  const allPaths = collectHtmlPaths(rootDir)
  const feedPaths = allPaths
    .filter((p) => p.startsWith('guides/') || p.startsWith('actualites/'))
    .filter((p) => !p.endsWith('index.html'))
    .sort((a, b) => getLastMod(rootDir, b).localeCompare(getLastMod(rootDir, a)))
    .slice(0, 40)

  const latestMod = feedPaths.length ? getLastMod(rootDir, feedPaths[0]) : new Date().toISOString().slice(0, 10)
  const rssDate = toRssDate(latestMod)

  const items = feedPaths.map((file) => {
    const url = toPublicUrl(file)
    const full = path.join(rootDir, file)
    const pubDate = toRssDate(getLastMod(rootDir, file))
    let title = file
    let description = ''
    if (fs.existsSync(full)) {
      const html = fs.readFileSync(full, 'utf8')
      const tm = html.match(/<title>([^<]+)<\/title>/i)
      if (tm) title = tm[1].replace(/\s*\|\s*Dodje\s*$/i, '').trim()
      const dm = html.match(/<meta name="description" content="([^"]+)"/i)
      if (dm) description = dm[1]
    }
    const descTag = description
      ? `\n      <description>${escapeXml(description)}</description>`
      : ''
    return `    <item>\n      <title>${escapeXml(title)}</title>\n      <link>${url}</link>\n      <guid isPermaLink="true">${url}</guid>\n      <pubDate>${pubDate}</pubDate>${descTag}\n    </item>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>Dodje — Guides et actualités finance France</title>\n    <link>${SITE}/guides</link>\n    <description>Guides et actualités éducatifs sur la finance personnelle en France</description>\n    <language>fr-FR</language>\n    <lastBuildDate>${rssDate}</lastBuildDate>\n    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>\n${items.join('\n')}\n  </channel>\n</rss>\n`
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function breadcrumbJsonLd(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url
    }))
  }
}

function buildCrumbs(filePath, html) {
  const crumbs = [{ name: 'Accueil', url: SITE + '/' }]
  const parts = filePath.replace(/\.html$/, '').split('/')

  if (parts[0] === 'guides' || parts[0] === 'outils' || parts[0] === 'actualites') {
    const hub = parts[0]
    const hubLabel = hub === 'guides' ? 'Guides' : hub === 'outils' ? 'Outils' : 'Actualités'
    crumbs.push({ name: hubLabel, url: `${SITE}/${hub}` })
    if (parts[1] && parts[1] !== 'index') {
      const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      const name = titleMatch
        ? titleMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 80)
        : parts[1].replace(/-/g, ' ')
      crumbs.push({ name, url: toPublicUrl(filePath) })
    }
  } else if (filePath === 'faq.html') {
    crumbs.push({ name: 'FAQ', url: `${SITE}/faq` })
  } else if (filePath === 'contact.html') {
    crumbs.push({ name: 'Contact', url: `${SITE}/contact` })
  } else if (filePath === 'mentions-legales.html') {
    crumbs.push({ name: 'Mentions légales', url: `${SITE}/mentions-legales` })
  } else if (filePath === 'conditions-utilisation.html') {
    crumbs.push({ name: "Conditions d'utilisation", url: `${SITE}/conditions-utilisation` })
  } else if (filePath === 'politique-confidentialite.html') {
    crumbs.push({ name: 'Politique de confidentialité', url: `${SITE}/politique-confidentialite` })
  }

  return crumbs
}

function injectGeoAndSocial(html, pageUrl) {
  if (html.includes('geo.region')) return html
  const block = GEO_HEAD.replace(/SITE_URL/g, pageUrl)
  return html.replace('</head>', block + '\n</head>')
}

function injectBreadcrumbsJsonLd(html, filePath) {
  if (html.includes('BreadcrumbList')) return html
  const crumbs = buildCrumbs(filePath, html)
  if (crumbs.length < 2) return html
  const script = `<script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd(crumbs))}</script>`
  return html.replace('</head>', script + '\n</head>')
}

function injectVisibleBreadcrumbs(html, filePath) {
  if (html.includes('class="seo-breadcrumbs"')) return html
  const crumbs = buildCrumbs(filePath, html)
  if (crumbs.length < 2) return html

  const items = crumbs
    .map((c, i) => {
      if (i === crumbs.length - 1) {
        return `<span aria-current="page">${escapeXml(c.name)}</span>`
      }
      return `<a href="${c.url.replace(SITE, '')}">${escapeXml(c.name)}</a>`
    })
    .join('<span class="seo-breadcrumbs__sep" aria-hidden="true">/</span>')

  const nav = `<nav class="seo-breadcrumbs" aria-label="Fil d'Ariane">${items}</nav>`
  return html.replace(
    /<main class="(?:content-page|legal-page)">\s*/,
    (m) => m + `\n        ${nav}\n        `
  )
}

function upgradeOgImage(html) {
  return html
    .replace(
      /property="og:image" content="https:\/\/dodje\.fr\/assets\/(?:IconeApp|Logo_degrade_PNG)\.png"/g,
      `property="og:image" content="${OG_IMAGE}"`
    )
    .replace(
      /name="twitter:image" content="https:\/\/dodje\.fr\/assets\/(?:IconeApp|Logo_degrade_PNG)\.png"/g,
      `name="twitter:image" content="${OG_IMAGE}"`
    )
}

function injectSpeakable(html, pageUrl) {
  if (html.includes('SpeakableSpecification')) return html
  if (!html.includes('content-lead') && !html.includes('hero-shell__bluf')) return html

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    url: pageUrl,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.content-lead', '.hero-shell__bluf', 'h1']
    }
  }
  const script = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
  return html.replace('</head>', script + '\n</head>')
}

function injectDefaultOg(html, pageUrl) {
  if (html.includes('og:title')) return html

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/i)
  const title = titleMatch ? titleMatch[1].replace(/\s*\|\s*Dodje\s*$/i, '').trim() : 'Dodje'
  const desc = descMatch ? descMatch[1] : 'Ressources éducatives finance personnelle France'

  const block = `
    <meta property="og:title" content="${escapeXml(title)}">
    <meta property="og:description" content="${escapeXml(desc)}">
    <meta property="og:image" content="${OG_IMAGE}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="fr_FR">`

  return html.replace('</head>', block + '\n</head>')
}

function injectComparatifWebApp(html, filePath, pageUrl) {
  if (!filePath.startsWith('outils/comparatif-')) return html
  if (html.includes('"@type":"WebApplication"') || html.includes('"@type": "WebApplication"')) return html

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/i)
  const name = titleMatch ? titleMatch[1].replace(/\s*\|\s*Dodje\s*$/i, '').trim() : 'Comparatif Dodje'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description: descMatch ? descMatch[1] : 'Comparatif pédagogique finance France',
    url: pageUrl,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    inLanguage: 'fr-FR',
    areaServed: { '@type': 'Country', name: 'France' },
    publisher: { '@id': 'https://dodje.fr/#organization' }
  }

  const script = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
  return html.replace('</head>', script + '\n</head>')
}

function injectGuideYMYL(html, filePath, rootDir) {
  if (!filePath.startsWith('guides/') || filePath.endsWith('index.html')) return html

  const reviewedDate = getLastMod(rootDir, filePath)
  const isArticle =
    html.includes('"@type": "Article"') || html.includes('"@type":"Article"')

  if (isArticle) {
    if (!html.includes('dateReviewed')) {
      html = html.replace(
        /"dateModified":\s*"[^"]+"/,
        (m) => `${m},\n      "dateReviewed": "${reviewedDate}"`
      )
    }

    if (html.includes('"author": { "@type": "Organization", "name": "Dodje" }')) {
      html = html.replace(
        /"author":\s*\{\s*"@type":\s*"Organization",\s*"name":\s*"Dodje"\s*\}/,
        '"author": { "@id": "https://dodje.fr/#editorial-team" }'
      )
    } else if (html.includes('"author":{"@type":"Organization","name":"Dodje"}')) {
      html = html.replace(
        /"author":\{"@type":"Organization","name":"Dodje"\}/,
        '"author":{"@id":"https://dodje.fr/#editorial-team"}'
      )
    }

    if (!html.includes('"@id": "https://dodje.fr/#editorial-team"') || !html.includes('reviewedBy')) {
      html = html.replace(
        /"publisher":\s*\{\s*"@id":\s*"https:\/\/dodje\.fr\/#organization"\s*\}/,
        '"publisher": { "@id": "https://dodje.fr/#organization" },\n      "reviewedBy": { "@id": "https://dodje.fr/#editorial-team" }'
      )
    } else if (html.includes('"reviewedBy": { "@type": "Organization"')) {
      html = html.replace(
        /"reviewedBy":\s*\{\s*"@type":\s*"Organization"[^}]+\}/,
        '"reviewedBy": { "@id": "https://dodje.fr/#editorial-team" }'
      )
    }
  }

  if (!html.includes('content-ymyl') && html.includes('content-lead')) {
    const disclaimer =
      '<div class="content-note content-ymyl"><p><strong>Avertissement YMYL :</strong> contenu informatif uniquement, sans conseil en investissement personnalisé. Les barèmes et réglementations évoluent — vérifie les sources officielles (AMF, URSSAF, service-public.fr) avant toute décision financière. <a href="/guides/equipe-editoriale">Charte éditoriale Dodje</a>.</p></div>'
    html = html.replace(/(<p class="content-lead">[\s\S]*?<\/p>)/, `$1\n\n            ${disclaimer}`)
  }

  return html
}

function injectOutilsPrivacyNote(html, filePath) {
  if (!filePath.startsWith('outils/')) return html
  if (html.includes('content-calc-privacy')) return html
  if (!html.includes('content-lead')) return html

  const note =
    '<div class="content-note content-calc-privacy"><p><strong>Simulation pédagogique :</strong> les données saisies restent dans ton navigateur et ne sont pas envoyées à Dodje. Résultats indicatifs, sans conseil personnalisé. <a href="/conditions-utilisation">CGU</a> · <a href="/politique-confidentialite">Confidentialité</a>.</p></div>'

  return html.replace(
    /(<p class="content-lead">[\s\S]*?<\/p>)/,
    `$1\n            ${note}`
  )
}

const SITE_FOOTER = `<footer class="footer site-footer">
        <div class="container">
            <nav class="footer-content" aria-label="Pied de page">
                <div class="footer-section footer-section--brand">
                    <a href="/" class="footer-brand" aria-label="Dodje, accueil">
                        <img src="/assets/Logo_degrade_PNG.png" alt="Dodje" class="footer-logo" width="130" height="50">
                    </a>
                    <div class="social-links">
                        <a href="https://www.tiktok.com/@dodjeapp" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="Dodje sur TikTok"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.16 8.16 0 0 0 4.77 1.52V7.12a4.85 4.85 0 0 1-1-.43z"/></svg></a>
                        <a href="https://www.instagram.com/dodjeapp/" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="Dodje sur Instagram"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg></a>
                        <a href="https://discord.gg/qn7cp4nVFh" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="Communauté Discord Dodje"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg></a>
                        <a href="https://x.com/DodjeApp" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="Dodje sur X"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                    </div>
                </div>
                <div class="footer-section">
                    <p class="footer-title">À propos</p>
                    <ul>
                        <li><a href="/">Accueil</a></li>
                        <li><a href="/faq">FAQ</a></li>
                        <li><a href="/guides/equipe-editoriale">Équipe éditoriale</a></li>
                        <li><a href="/contact">Nous contacter</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <p class="footer-title">Outils</p>
                    <ul>
                        <li><a href="/outils">Tous les calculateurs</a></li>
                        <li><a href="/outils/salaire-et-travail">Salaire et travail</a></li>
                        <li><a href="/outils/epargne">Épargne</a></li>
                        <li><a href="/outils/credit-immobilier">Crédit immobilier</a></li>
                        <li><a href="/outils/investissement">Investissement</a></li>
                        <li><a href="/outils/crypto">Crypto</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <p class="footer-title">Guides</p>
                    <ul>
                        <li><a href="/guides">Tous les guides</a></li>
                        <li><a href="/guides/classements-finance-france-2026">Classements 2026</a></li>
                        <li><a href="/guides/investir-en-bourse-france-debutant">Bourse débutant</a></li>
                        <li><a href="/guides/premiers-pas-crypto-france">Premiers pas crypto</a></li>
                        <li><a href="/guides/epargne-de-precaution-france">Épargne de précaution</a></li>
                        <li><a href="/guides/glossaire-finance-investissement-2026">Glossaire</a></li>
                        <li><a href="/actualites">Actualités</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <p class="footer-title">L'app</p>
                    <ul>
                        <li><a href="/guides/application-education-financiere">App éducation financière</a></li>
                        <li><a href="https://apps.apple.com/us/app/dodje-%C3%A9ducation-financi%C3%A8re/id6743447215" target="_blank" rel="noopener noreferrer">App Store</a></li>
                        <li><a href="https://play.google.com/store/apps/details?id=xyz.dodje.app" target="_blank" rel="noopener noreferrer">Google Play</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <p class="footer-title">Légal</p>
                    <ul>
                        <li><a href="/mentions-legales">Mentions légales</a></li>
                        <li><a href="/conditions-utilisation">Conditions d'utilisation</a></li>
                        <li><a href="/politique-confidentialite">Confidentialité</a></li>
                    </ul>
                </div>
            </nav>
            <div class="footer-bottom">
                <p>&copy; 2026 Dodje Solutions. Tous droits réservés.</p>
            </div>
        </div>
    </footer>`

const SITE_HEADER = `<nav class="navbar navbar-simple visible">
        <div class="nav-container">
            <a href="/" class="nav-logo" aria-label="Dodje, accueil">
                <img src="/assets/Logo_degrade_PNG.png" alt="Dodje" class="logo-img" width="130" height="50">
            </a>
            <a href="/#hero" class="cta-button nav-cta">C'est parti</a>
        </div>
    </nav>`

function injectGlobalHeader(html) {
  const navPattern = /<nav class="navbar(?:-minimal)?[^"]*"[^>]*>[\s\S]*?<\/nav>/g
  if (!navPattern.test(html)) return html
  navPattern.lastIndex = 0
  let first = true
  return html.replace(navPattern, () => {
    if (first) {
      first = false
      return SITE_HEADER
    }
    return ''
  })
}

function injectGlobalFooter(html) {
  if (!html.includes('class="footer"')) return html
  return html.replace(/<footer\s+class="footer"[^>]*>[\s\S]*?<\/footer>/, SITE_FOOTER)
}

function injectNewsArticleReview(html, filePath, rootDir) {
  if (!filePath.startsWith('actualites/') || filePath.endsWith('index.html')) return html
  if (!html.includes('NewsArticle')) return html
  if (html.includes('dateReviewed')) return html

  const reviewedDate = getLastMod(rootDir, filePath)
  return html.replace(
    /"dateModified":\s*"[^"]+"/,
    (m) => `${m},\n      "dateReviewed": "${reviewedDate}"`
  )
}

function injectWebPageSchema(html, filePath, pageUrl) {
  if (html.includes('"@type":"WebPage"') || html.includes('"@type": "WebPage"')) return html
  if (filePath === 'index.html') return html

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/i)
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': pageUrl + '#webpage',
    url: pageUrl,
    name: h1Match
      ? h1Match[1].replace(/<[^>]+>/g, '').trim()
      : titleMatch
        ? titleMatch[1].replace(/\s*\|\s*Dodje\s*$/i, '').trim()
        : 'Dodje',
    description: descMatch ? descMatch[1] : undefined,
    inLanguage: 'fr-FR',
    isPartOf: { '@id': 'https://dodje.fr/#website' },
    about: { '@type': 'Country', name: 'France' },
    publisher: { '@id': 'https://dodje.fr/#organization' },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.content-lead', 'h1']
    }
  }

  const script = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
  return html.replace('</head>', script + '\n</head>')
}

function injectBlufLead(html, filePath) {
  if (!html.includes('class="content-lead"')) return html
  if (/En bref|Verdict/.test(html)) return html

  const marker =
    filePath.startsWith('actualites/') || filePath.includes('top-5-')
      ? '<strong>En bref :</strong> '
      : '<strong>En bref :</strong> '

  return html.replace(/(<p class="content-lead">)\s*/, `$1${marker}`)
}

function optimizeBackgroundVideo(html) {
  return html.replace(
    /<video([^>]*id="background-video"[^>]*)>\s*<source src="[^"]*FondAnime\.mp4"[^>]*>\s*<\/video>/i,
    '<video$1 data-webm="/assets/anime/FondAnime-optimized.webm" data-mp4="/assets/anime/FondAnime-optimized.mp4"></video>'
  )
}

function relativePathFromRoot(filename, rootDir) {
  const norm = path.resolve(filename).replace(/\\/g, '/')
  const root = path.resolve(rootDir).replace(/\\/g, '/')
  if (norm.startsWith(root + '/')) {
    return norm.slice(root.length + 1)
  }
  return path.basename(norm)
}

export function injectSeoHeadPlugin(rootDir) {
  return {
    name: 'inject-seo-head',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const filePath = relativePathFromRoot(ctx.filename, rootDir)
        if (!filePath.endsWith('.html')) return html
        if (filePath === 'index.html') return html

        let out = html
        const pageUrl = toPublicUrl(filePath)
        out = injectBlufLead(out, filePath)
        out = injectGeoAndSocial(out, pageUrl)
        out = injectDefaultOg(out, pageUrl)
        out = upgradeOgImage(out)
        out = injectComparatifWebApp(out, filePath, pageUrl)
        out = injectGuideYMYL(out, filePath, rootDir)
        out = injectOutilsPrivacyNote(out, filePath)
        out = injectNewsArticleReview(out, filePath, rootDir)
        out = injectGlobalHeader(out)
        out = injectGlobalFooter(out)
        out = injectBreadcrumbsJsonLd(out, filePath)
        out = injectWebPageSchema(out, filePath, pageUrl)
        out = injectSpeakable(out, pageUrl)
        out = injectVisibleBreadcrumbs(out, filePath)
        out = optimizeBackgroundVideo(out)

        if (!out.includes('og:site_name')) {
          out = out.replace(
            /<meta property="og:locale"/i,
            '<meta property="og:site_name" content="Dodje">\n    <meta property="og:locale"'
          )
        }

        const twTitle = out.match(/<meta property="og:title" content="([^"]+)"/)
        const twDesc = out.match(/<meta property="og:description" content="([^"]+)"/)
        if (twTitle && !out.includes('twitter:title')) {
          out = out.replace(
            '</head>',
            `    <meta name="twitter:title" content="${twTitle[1]}">\n` +
              (twDesc ? `    <meta name="twitter:description" content="${twDesc[1]}">\n` : '') +
              `    <meta name="twitter:image" content="${OG_IMAGE}">\n</head>`
          )
        }

        return out
      }
    }
  }
}

export function writeSeoArtifacts(rootDir) {
  const sitemap = buildSitemapXml(rootDir)
  const llmsFull = buildLlmsFullTxt(rootDir)
  const llms = buildLlmsTxt(rootDir)
  const aiTxt = buildAiTxt(rootDir)
  const summaryJson = buildSummaryJson(rootDir)
  const feed = buildFeedXml(rootDir)

  const distDir = path.join(rootDir, 'dist')
  if (!fs.existsSync(distDir)) return

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8')
  fs.writeFileSync(path.join(distDir, 'llms-full.txt'), llmsFull, 'utf8')
  fs.writeFileSync(path.join(distDir, 'llms.txt'), llms, 'utf8')
  fs.writeFileSync(path.join(distDir, 'feed.xml'), feed, 'utf8')

  const wellKnownDir = path.join(distDir, '.well-known')
  fs.mkdirSync(wellKnownDir, { recursive: true })
  fs.writeFileSync(path.join(wellKnownDir, 'ai.txt'), aiTxt, 'utf8')

  const aiDir = path.join(distDir, 'ai')
  fs.mkdirSync(aiDir, { recursive: true })
  fs.writeFileSync(path.join(aiDir, 'summary.json'), summaryJson, 'utf8')

  writeGhPagesRedirects(rootDir, distDir)
}

/**
 * GitHub Pages ignores Netlify-style `_redirects`. Emit HTML stubs so old
 * URLs return 200 with a canonical + meta/JS redirect (Google follows these).
 */
function writeGhPagesRedirects(rootDir, distDir) {
  const redirectsFile = path.join(rootDir, 'public/_redirects')
  if (!fs.existsSync(redirectsFile)) return

  for (const line of fs.readFileSync(redirectsFile, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const parts = trimmed.split(/\s+/)
    if (parts.length < 3) continue

    const [from, to, status] = parts
    // Skip rewrites (200) and wildcards — GH Pages needs explicit HTML files.
    if (status === '200' || from.includes('*') || !from.startsWith('/')) continue

    const absoluteTo = to.startsWith('http') ? to : `${SITE}${to}`
    const outFile = from.endsWith('/')
      ? path.join(distDir, from.slice(1), 'index.html')
      : path.join(distDir, `${from.slice(1)}.html`)

    fs.mkdirSync(path.dirname(outFile), { recursive: true })
    fs.writeFileSync(outFile, buildRedirectHtml(absoluteTo), 'utf8')
  }
}

function buildRedirectHtml(targetUrl) {
  const safe = targetUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${safe}">
  <meta http-equiv="refresh" content="0;url=${safe}">
  <title>Redirection…</title>
  <script>location.replace(${JSON.stringify(targetUrl)})</script>
</head>
<body>
  <p>Cette page a déménagé. <a href="${safe}">Continuer vers ${safe}</a>.</p>
</body>
</html>
`
}
