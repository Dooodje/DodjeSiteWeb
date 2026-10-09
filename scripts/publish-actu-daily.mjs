#!/usr/bin/env node
/**
 * Une actualité par jour : le prochain barème de data/actu-calendar.json
 * dont le chiffre nommé est disponible.
 *
 *   node scripts/publish-actu-daily.mjs
 *   DRY_RUN=1 node scripts/publish-actu-daily.mjs
 *   AUTO_COMMIT=1 node scripts/publish-actu-daily.mjs
 */
import { publishNext } from './editorial-lib.mjs'

const code = await publishNext('actu')
process.exit(code)
