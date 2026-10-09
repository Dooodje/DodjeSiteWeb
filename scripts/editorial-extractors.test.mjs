import assert from 'node:assert/strict'
import {
  extractLivretAFacts,
  extractSmicFacts,
  metaDescription,
  qualityGate
} from './editorial-lib.mjs'

const smic = extractSmicFacts(
  "amende d'un montant de 1 500 € s'il verse au salarié une rémunération inférieure au Smic. " +
    'Smic horaire 12,31 € 9,74 € Smic mensuel 1 867,02 € 1 477,93 € Smic annuel 22 404,20 € 17 735,19 € ' +
    '17 ans 11,08 € 16 ans (et moins) 9,85 €'
)
assert.equal(smic.smic_brut_mensuel.display, '1 867,02 €')
assert.equal(smic.smic_net_mensuel.display, '1 477,93 €')
assert.equal(smic.smic_horaire_brut.display, '12,31 €')
assert.equal(smic.smic_mineur_17.display, '11,08 €')
assert.equal(smic.smic_mineur_16.display, '9,85 €')
assert.notEqual(smic.smic_brut_mensuel.display, '1 500 €')

const livret = extractLivretAFacts(
  "amende qui correspond à 2 % de l'encours du deuxième livret. " +
    "Le taux d'intérêt annuel du livret A est de 1,7 % . " +
    "Le montant maximum d'épargne inscrit sur le livret A est de 22 950 € ."
)
assert.equal(livret.livret_a_taux.display, '1,7 %')
assert.equal(livret.livret_a_plafond.display, '22 950 €')
assert.notEqual(livret.livret_a_taux.display, '2 %')

assert.equal(extractSmicFacts('seulement une amende de 1 500 €'), null)

const bluf = 'Le SMIC mensuel brut est 1 867,02 €, soit 1 477,93 € net (Service-public.fr).'
const ok = qualityGate({
  title: 'SMIC mensuel : 1 867,02 € brut (octobre 2026)',
  bluf,
  faq: [{ q: 'Quel est le SMIC ?', a: '1 867,02 € brut.' }],
  leadDisplay: '1 867,02 €',
  sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/F2300',
  description: metaDescription(bluf, '1 867,02 €')
})
assert.deepEqual(ok, [])

const bad = qualityGate({
  title: 'SMIC : barèmes officiels',
  bluf: 'Les premiers montants lus sont 1 500 €, 12,31 €',
  faq: [{ q: 'Quoi retenir ?', a: '1 500 €' }],
  leadDisplay: '1 867,02 €',
  sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/F2300',
  description: '1 500 €, 12,31 €'
})
assert.ok(bad.length > 0)

console.log('editorial extractors ok')
