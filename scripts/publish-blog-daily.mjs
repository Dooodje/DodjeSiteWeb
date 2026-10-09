#!/usr/bin/env node
/**
 * Un article de blog par jour : la prochaine question de data/blog-calendar.json.
 *
 *   node scripts/publish-blog-daily.mjs
 *   DRY_RUN=1 node scripts/publish-blog-daily.mjs
 *   AUTO_COMMIT=1 node scripts/publish-blog-daily.mjs
 */
import { publishNext } from './editorial-lib.mjs'

const code = await publishNext('blog')
process.exit(code)
