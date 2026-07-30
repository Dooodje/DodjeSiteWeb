import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'
import react from '@vitejs/plugin-react'
import {
  STATIC_PAGES,
  injectSeoHeadPlugin,
  writeSeoArtifacts
} from './vite-seo.mjs'

function collectHtmlInputs(rootDir) {
  const inputs = {}
  STATIC_PAGES.forEach((file) => {
    const key = file.replace('.html', '').replace(/-/g, '_')
    inputs[key] = resolve(rootDir, file)
  })
  ;['outils', 'actualites', 'guides'].forEach((dir) => {
    const fullDir = resolve(rootDir, dir)
    if (!fs.existsSync(fullDir)) return
    fs.readdirSync(fullDir).forEach((file) => {
      if (!file.endsWith('.html')) return
      const slug = file.replace('.html', '')
      const key = `${dir}_${slug}`.replace(/-/g, '_')
      inputs[key] = resolve(fullDir, file)
    })
  })
  return inputs
}

const seoBuildPlugin = (rootDir) => ({
  name: 'seo-build',
  closeBundle() {
    writeSeoArtifacts(rootDir)
  }
})

function appPromoScriptPath(filename) {
  const normalized = filename.replace(/\\/g, '/')
  if (
    normalized.includes('/guides/') ||
    normalized.includes('/outils/') ||
    normalized.includes('/actualites/')
  ) {
    return '../app-promo.js'
  }
  return 'app-promo.js'
}

const injectAppPromoPlugin = () => ({
  name: 'inject-app-promo',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      if (!ctx.filename.endsWith('.html')) return html
      if (html.includes('app-promo.js')) return html
      const src = appPromoScriptPath(ctx.filename)
      return html.replace('</body>', `    <script src="${src}"></script>\n</body>`)
    }
  }
})

const cleanUrlsDev = () => ({
  name: 'clean-urls-dev',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const [pathname, query] = (req.url || '/').split('?')
      if (
        pathname === '/' ||
        pathname.endsWith('/') ||
        pathname.startsWith('/@') ||
        pathname.startsWith('/node_modules') ||
        /\.[a-zA-Z0-9]+$/.test(pathname)
      ) {
        return next()
      }
      const basePath = pathname.slice(1)
      const htmlCandidate = resolve(__dirname, basePath + '.html')
      const indexCandidate = resolve(__dirname, basePath, 'index.html')
      if (fs.existsSync(htmlCandidate)) {
        req.url = pathname + '.html' + (query ? '?' + query : '')
      } else if (fs.existsSync(indexCandidate)) {
        req.url = pathname + '/index.html' + (query ? '?' + query : '')
      }
      next()
    })
  }
})

const CRITICAL_ASSETS_MARKER = '<!-- vite:critical-assets -->'

const extractTag = (html, pattern) => {
  const tags = []
  const cleaned = html.replace(pattern, (match) => {
    tags.push(match.trim())
    return ''
  })
  return { cleaned, tags }
}

const copyBackgroundVideos = () => ({
  name: 'copy-background-videos',
  closeBundle() {
    const srcDir = resolve(__dirname, 'assets/anime')
    const destDir = resolve(__dirname, 'dist/assets/anime')
    if (!fs.existsSync(srcDir)) return

    fs.mkdirSync(destDir, { recursive: true })
    for (const entry of fs.readdirSync(srcDir)) {
      if (!entry.startsWith('FondAnime-optimized.')) continue
      fs.copyFileSync(resolve(srcDir, entry), resolve(destDir, entry))
    }
  }
})

const earlyCriticalAssets = () => ({
  name: 'early-critical-assets',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      if (!html.includes(CRITICAL_ASSETS_MARKER)) return html

      const stylesheetPattern = /\n\s*<link rel="stylesheet" crossorigin href="\/assets\/[^"]+\.css">/g
      const modulepreloadPattern = /\n\s*<link rel="modulepreload" crossorigin href="\/assets\/[^"]+">/g
      const moduleScriptPattern = /\n\s*<script type="module" crossorigin src="\/assets\/[^"]+"><\/script>/g

      let result = html
      const stylesheets = extractTag(result, stylesheetPattern)
      result = stylesheets.cleaned
      const modulepreloads = extractTag(result, modulepreloadPattern)
      result = modulepreloads.cleaned
      const moduleScripts = extractTag(result, moduleScriptPattern)
      result = moduleScripts.cleaned

      // Keep entry CSS render-blocking. Async preload caused FOUC because the
      // critical bundle is named index-*.css (not main-*), and below-fold
      // styles.css is already deferred via requestIdleCallback in main.tsx.
      const bundle = [
        ...stylesheets.tags,
        ...modulepreloads.tags,
        ...moduleScripts.tags
      ].join('\n    ')

      if (!bundle) {
        return result.replace(CRITICAL_ASSETS_MARKER, '')
      }

      return result.replace(
        CRITICAL_ASSETS_MARKER,
        bundle
      )
    }
  }
})

export default defineConfig({
  plugins: [
    react(),
    cleanUrlsDev(),
    injectSeoHeadPlugin(__dirname),
    injectAppPromoPlugin(),
    seoBuildPlugin(__dirname),
    earlyCriticalAssets(),
    copyBackgroundVideos()
  ],
  server: {
    port: 3000,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: collectHtmlInputs(__dirname),
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
              return 'vendor-react'
            }
            if (id.includes('lottie-react') || id.includes('lottie-web')) {
              return 'vendor-lottie'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
          }
        }
      }
    }
  }
})
