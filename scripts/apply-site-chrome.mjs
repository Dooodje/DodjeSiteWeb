#!/usr/bin/env node
/** Aligne le ciel, le header et le footer des pages internes sur la landing. */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { applyChrome } from './site-chrome.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
function walk(dir, rel = '') {
  const files = []
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.')) continue
    if (rel === '' && (name === 'index.html' || name === 'maquette')) continue
    const abs = path.join(dir, name)
    const child = rel ? `${rel}/${name}` : name
    const stat = fs.statSync(abs)
    if (stat.isDirectory()) {
      if (['node_modules', 'dist', 'maquette', 'public', 'src', 'scripts'].includes(name)) continue
      files.push(...walk(abs, child))
    } else if (name.endsWith('.html')) {
      files.push(child)
    }
  }
  return files
}

let updated = 0
let unchanged = 0
for (const rel of walk(root)) {
  const abs = path.join(root, rel)
  const before = fs.readFileSync(abs, 'utf8')
  const after = applyChrome(before, rel)
  if (after === before) {
    unchanged++
    continue
  }
  fs.writeFileSync(abs, after)
  updated++
}
console.log(`chrome: ${updated} pages mises à jour, ${unchanged} inchangées`)
