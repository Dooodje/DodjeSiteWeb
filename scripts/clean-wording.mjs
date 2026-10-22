// Nettoie le wording visible : pas de tirets longs, de points médians, de « ~ », de flèches ni de « recensé ».
// Utilisé au build (vite-seo.mjs) et en ligne de commande : node scripts/clean-wording.mjs <fichiers…>
import fs from 'node:fs'

export function cleanText(t) {
  let s = t
  s = s.replace(/Avertissement YMYL\s*:/g, 'À savoir :')
  s = s.replace(/\s+recensé(?:e|s|es)? par Dodje/g, '')
  s = s.replace(/ est recensée? \?/g, ' retenir ?')
  s = s.replace(/ recensé(?:e|s|es)?(?=[\s,.;:!?)]|$)/g, '')
  s = s.replace(/ · France\b/g, '')
  s = s.replace(/~~/g, '~')
  s = s.replace(/~\s?(?=\d)/g, 'environ ')
  s = s.replace(/\b([Dd])e environ/g, "$1'environ")
  s = s.replace(/(\d)\s?–\s?(\d)/g, '$1 à $2')
  s = s.replace(/\s+[—–]\s+/g, (m, off, str) => {
    const before = str.slice(Math.max(0, off - 50), off)
    const seg = before.split(/[.!?:;\n>]/).pop()
    return seg.trim().length > 0 && seg.length < 45 && !seg.includes(', ') ? ' : ' : ', '
  })
  s = s.replace(/[—–]/g, ', ')
  s = s.replace(/\s·\s/g, ', ')
  s = s.replace(/Brut → Net/g, 'Brut en net').replace(/Net → Brut/g, 'Net en brut')
  s = s.replace(/\s→\s(?=environ)/g, ' font ')
  s = s.replace(/\s→\s/g, ', puis ')
  s = s.replace(/\s?↔\s?/g, ' et ')
  return s
}

// Applique cleanText au texte visible, aux attributs lisibles, au <title> et aux JSON-LD, jamais au code.
export function cleanWording(html) {
  const parts = html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>)/g)
  return parts
    .map((p) => {
      if (!p) return p
      if (p.startsWith('<script')) {
        return /type="application\/ld\+json"/.test(p)
          ? p.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/, (m, a, b, c) => a + cleanText(b) + c)
          : p
      }
      if (p.startsWith('<style')) return p
      if (p.startsWith('<')) {
        return p.replace(/\b(content|alt|title|aria-label|placeholder)="([^"]*)"/g, (m, k, v) => `${k}="${cleanText(v)}"`)
      }
      return cleanText(p)
    })
    .join('')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let changed = 0
  for (const f of process.argv.slice(2)) {
    const src = fs.readFileSync(f, 'utf8')
    const out = f.endsWith('.json') ? cleanText(src) : cleanWording(src)
    if (out !== src) {
      fs.writeFileSync(f, out)
      changed++
    }
  }
  console.log(`${changed} fichier(s) nettoyé(s)`)
}
