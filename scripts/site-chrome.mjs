/**
 * Ciel, header et footer des pages internes, alignés sur la landing.
 * Chemins absolus : le même HTML fonctionne à la racine et dans les dossiers.
 */
export const APP_STORE =
  'https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215'
export const PLAY_STORE =
  'https://play.google.com/store/apps/details?id=xyz.dodje.app&hl=fr'

const NAV = [
  ['guides', '/guides', 'Guides'],
  ['outils', '/outils', 'Outils'],
  ['actus', '/actualites', 'Actus'],
  ['blog', '/blog', 'Blog']
]

const CLOUD =
  '<g fill="#F7F9FD"><circle cx="58" cy="66" r="26"/><circle cx="108" cy="50" r="36"/><circle cx="166" cy="40" r="40"/><circle cx="224" cy="56" r="31"/><circle cx="262" cy="70" r="21"/><rect x="30" y="64" width="252" height="28" rx="14"/></g><g fill="#DCE3F4"><circle cx="122" cy="80" r="16"/><circle cx="164" cy="68" r="27"/><circle cx="208" cy="80" r="18"/><rect x="104" y="78" width="124" height="14" rx="7"/></g>'

export function sectionFromRel(rel) {
  const p = String(rel || '').replace(/\\/g, '/')
  if (p.startsWith('guides/') || p.startsWith('glossaire/')) return 'guides'
  if (p.startsWith('outils/')) return 'outils'
  if (p.startsWith('actualites/')) return 'actus'
  if (p === 'blog.html' || p.startsWith('blog/')) return 'blog'
  return ''
}

export function headChrome() {
  return `    <meta name="theme-color" content="#4A72B5">
    <style>html{background:#4A72B5}</style>`
}

export function skyHtml() {
  const clouds = [
    'top:8%;--w:min(36vw,460px);--o:.95;--t:95s;--dl:-20s',
    'top:33%;--w:min(22vw,280px);--o:.7;--t:125s;--dl:-80s',
    'top:56%;--w:min(42vw,540px);--o:.9;--t:110s;--dl:-55s',
    'top:79%;--w:min(28vw,340px);--o:.75;--t:140s;--dl:-110s',
    'top:20%;--w:min(18vw,230px);--o:.6;--t:160s;--dl:-135s'
  ]
    .map(
      (style) =>
        `    <svg class="cloud" viewBox="0 0 300 92" style="${style}">${CLOUD}</svg>`
    )
    .join('\n')
  return `  <div class="sky" aria-hidden="true">\n${clouds}\n  </div>`
}

export function headerHtml(section = '') {
  const links = NAV.map(([id, href, label], i) => {
    const on = id === section
    return `        <a class="navlink${on ? ' cur' : ''}" href="${href}" style="--i:${i + 1}"${on ? ' aria-current="page"' : ''}>${label}</a>`
  }).join('\n')
  return `  <header class="topnav">
    <div class="topnav__bar">
      <a href="/" aria-label="Dodje, accueil" style="display:flex;align-items:center;flex:0 0 auto"><img src="/assets/Logo_degrade_260.webp" alt="Dodje" width="73" height="28" style="height:28px;width:auto"></a>
      <nav class="navlinks" aria-label="Navigation">
${links}
      </nav>
      <a class="cta navcta dlhref" href="${APP_STORE}" target="_blank" rel="noopener noreferrer">Télécharger</a>
    </div>
  </header>`
}

export function footerHtml() {
  return `  <footer class="sitefoot">
    <div class="footcard">
      <div class="foottop">
        <div class="footbrand">
          <img src="/landing/img/MascotteHappy.svg" alt="" width="52" height="52">
          <div><img src="/assets/Logo_degrade_260.webp" alt="Dodje" width="68" height="26" style="height:26px;width:auto;display:block"><p>Le jeu gratuit pour comprendre l'argent.</p></div>
        </div>
        <div class="socials">
          <a class="soc" href="https://www.tiktok.com/@dodje.app" target="_blank" rel="noopener noreferrer" aria-label="Dodje sur TikTok"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.16 8.16 0 0 0 4.77 1.52V7.12a4.85 4.85 0 0 1-1-.43z"/></svg></a>
          <a class="soc" href="https://www.instagram.com/dodje.app/" target="_blank" rel="noopener noreferrer" aria-label="Dodje sur Instagram"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
          <a class="soc" href="https://discord.gg/qn7cp4nVFh" target="_blank" rel="noopener noreferrer" aria-label="Communauté Discord Dodje"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 2.9l-.6 1.2a18.3 18.3 0 0 0-5.5 0l-.6-1.2a19.7 19.7 0 0 0-4.9 1.5C.7 9 -.2 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2a13 13 0 0 1-1.9-.9l.4-.3a14.2 14.2 0 0 0 12.1 0l.4.3c-.6.4-1.2.7-1.9.9l1.3 2a19.8 19.8 0 0 0 6-3c.5-5.2-.8-9.7-3.5-13.7zM8.5 15.3c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4zm7 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4z"/></svg></a>
          <a class="soc" href="https://x.com/DodjeApp" target="_blank" rel="noopener noreferrer" aria-label="Dodje sur X"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
        </div>
      </div>
      <nav class="ftiles" aria-label="Liens utiles">
        <a class="ftile" href="/jeu"><b>Le jeu</b><span>Comment on joue</span></a>
        <a class="ftile" href="/outils"><b>Calculateurs</b><span>Épargne, crédit, salaire</span></a>
        <a class="ftile" href="/guides"><b>Guides</b><span>Apprendre à investir</span></a>
        <a class="ftile" href="/faq"><b>Aide</b><span>FAQ et contact</span></a>
      </nav>
      <div class="footbottom">
        <div class="footlegal">
          <a class="flegal" href="/blog">Blog</a>
          <a class="flegal" href="/actualites">Actualités</a>
          <a class="flegal" href="/mentions-legales">Mentions légales</a>
          <a class="flegal" href="/conditions-utilisation">Conditions d'utilisation</a>
          <a class="flegal" href="/politique-confidentialite">Confidentialité</a>
          <a class="flegal" href="/contact">Nous contacter</a>
        </div>
        <span class="footcopy">© 2026 Dodje Solutions. Service d'éducation financière, pas de conseil en investissement.</span>
      </div>
    </div>
  </footer>`
}

/** Barre de téléchargement fixe en bas, identique à celle de la landing. */
export function dlbarHtml() {
  return `  <aside class="dlwrap" aria-label="Télécharger Dodje">
    <div class="dlbar off">
      <img src="/landing/img/MascotteHappy.svg" alt="" width="44" height="44" class="dlboky">
      <span class="dltxt"><b class="dltitle">Joue à Dodje</b><span>C'est gratuit</span></span>
      <a class="store storew hide-sm dlstore" href="${APP_STORE}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M17.05 12.54c-.03-3.08 2.52-4.56 2.64-4.63-1.44-2.1-3.67-2.39-4.45-2.42-1.9-.19-3.7 1.11-4.66 1.11-.97 0-2.45-1.08-4.03-1.05-2.07.03-3.98 1.2-5.05 3.05-2.16 3.75-.55 9.3 1.55 12.34 1.03 1.49 2.26 3.16 3.87 3.1 1.55-.06 2.14-1 4.02-1 1.87 0 2.41 1 4.04.97 1.67-.03 2.73-1.52 3.75-3.02 1.18-1.73 1.67-3.4 1.7-3.49-.04-.02-3.25-1.25-3.38-4.96zM14 3.49c.85-1.03 1.43-2.46 1.27-3.89-1.23.05-2.72.82-3.6 1.85-.79.91-1.48 2.37-1.29 3.76 1.37.11 2.77-.69 3.62-1.72z"/></svg>App Store</a>
      <a class="store storew hide-sm dlstore" href="${PLAY_STORE}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M3.55 2.18c-.35.2-.55.57-.55 1.02v17.6c0 .45.2.82.55 1.02L13.7 12 3.55 2.18zm11.22 8.78 2.92-2.82L6.08 1.57c-.47-.27-.9-.28-1.23-.09l9.92 9.48zm0 2.08-9.92 9.48c.33.19.76.18 1.23-.09l11.61-6.57-2.92-2.82zm1.08-1.04 3.35 3.2 1.57-.89c1.64-.93 1.64-3.69 0-4.62l-1.57-.89-3.35 3.2z"/></svg>Google Play</a>
      <a class="cta show-sm dlhref dlcta" href="${APP_STORE}" target="_blank" rel="noopener noreferrer">Télécharger</a>
    </div>
  </aside>
  <script src="/site-dlbar.js" defer></script>`
}

function classTokens(openTag) {
  const m = openTag.match(/class\s*=\s*["']([^"']*)["']/i)
  return m ? m[1].split(/\s+/).filter(Boolean) : []
}

function hasId(openTag, id) {
  return new RegExp(`\\bid\\s*=\\s*["']${id}["']`, 'i').test(openTag)
}

/** Retire les éléments dont la balise ouvrante passe le prédicat, en respectant l'imbrication. */
function removeElements(html, tag, predicate) {
  const openRe = new RegExp(`<${tag}\\b[^>]*>`, 'gi')
  let result = ''
  let last = 0
  let m
  while ((m = openRe.exec(html))) {
    if (!predicate(m[0])) continue
    const start = m.index
    const token = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi')
    token.lastIndex = start + m[0].length
    let depth = 1
    let end = -1
    let t
    while ((t = token.exec(html))) {
      depth += t[1] ? -1 : 1
      if (depth === 0) {
        end = token.lastIndex
        break
      }
    }
    if (end === -1) {
      openRe.lastIndex = start + m[0].length
      continue
    }
    result += html.slice(last, start)
    last = end
    openRe.lastIndex = end
  }
  result += html.slice(last)
  return result.replace(/[ \t]*\n[ \t]*\n(?=[ \t]*\n)/g, '\n')
}

function ensureHead(html) {
  if (/name=["']theme-color["']/i.test(html)) {
    html = html.replace(
      /<meta\s+name=["']theme-color["'][^>]*>/i,
      '<meta name="theme-color" content="#4A72B5">'
    )
  } else {
    html = html.replace('</head>', `    <meta name="theme-color" content="#4A72B5">\n</head>`)
  }
  if (!html.includes('html{background:#4A72B5}')) {
    html = html.replace('</head>', `    <style>html{background:#4A72B5}</style>\n</head>`)
  }
  return html
}

export function applyChrome(html, rel) {
  if (!/<body[\s>]/i.test(html) || html.includes('data-landing-page')) return html
  let next = html
  next = removeElements(next, 'video', (tag) => hasId(tag, 'background-video'))
  next = removeElements(next, 'div', (tag) => hasId(tag, 'bg-overlay'))
  next = removeElements(next, 'nav', (tag) => {
    const classes = classTokens(tag)
    return classes.includes('navbar') || classes.includes('navbar-minimal')
  })
  next = removeElements(next, 'div', (tag) => {
    const classes = classTokens(tag)
    return classes.includes('mobile-menu') || classes.includes('mobile-menu-overlay')
  })
  next = removeElements(next, 'header', (tag) => classTokens(tag).includes('topnav'))
  next = removeElements(next, 'div', (tag) => classTokens(tag).includes('sky'))
  next = removeElements(next, 'footer', (tag) => {
    const classes = classTokens(tag)
    return classes.includes('footer') || classes.includes('sitefoot')
  })
  next = removeElements(next, 'aside', (tag) => classTokens(tag).includes('dlwrap'))
  next = next.replace(/[ \t]*<script src="\/(?:site-dlbar|app-promo)\.js"[^>]*><\/script>\n?/g, '')

  const chrome = `${skyHtml()}\n${headerHtml(sectionFromRel(rel))}\n`
  next = next.replace(/<body([^>]*)>/i, `<body$1>\n${chrome}`)

  const footer = `\n${footerHtml()}\n${dlbarHtml()}\n`
  const mainEnd = next.lastIndexOf('</main>')
  if (mainEnd !== -1) {
    next = next.slice(0, mainEnd + 7) + footer + next.slice(mainEnd + 7)
  } else {
    next = next.replace(/<\/body>/i, `${footer}</body>`)
  }
  return ensureHead(next)
}
