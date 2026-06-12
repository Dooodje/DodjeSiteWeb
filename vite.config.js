import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'
import react from '@vitejs/plugin-react'

// Plugin: serve clean URLs in dev (e.g. /conditions-utilisation -> conditions-utilisation.html)
// Mirrors Firebase Hosting `cleanUrls: true` behavior so links work in dev and prod.
const cleanUrlsDev = () => ({
  name: 'clean-urls-dev',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const [pathname, query] = (req.url || '/').split('?')
      // Skip root, asset paths, paths with extensions, and trailing-slash paths
      if (
        pathname === '/' ||
        pathname.endsWith('/') ||
        pathname.startsWith('/@') ||
        pathname.startsWith('/node_modules') ||
        /\.[a-zA-Z0-9]+$/.test(pathname)
      ) {
        return next()
      }
      const candidate = resolve(__dirname, pathname.slice(1) + '.html')
      if (fs.existsSync(candidate)) {
        req.url = pathname + '.html' + (query ? '?' + query : '')
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

// Hoist Vite-injected CSS/JS to the top of <head> so the browser discovers
// the entry module before parsing non-critical markup (JSON-LD, etc.).
// Background videos are loaded via data-* attributes in script.js, so Vite's
// HTML asset pipeline never copies them. Mirror assets/anime into dist on build.
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

      const toAsyncStylesheet = (tag) => {
        const href = tag.match(/href="([^"]+)"/)?.[1]
        if (!href) return tag
        return `<link rel="preload" as="style" crossorigin href="${href}" onload="this.onload=null;this.rel='stylesheet'"><noscript>${tag}</noscript>`
      }

      const syncStylesheets = stylesheets.tags.filter((tag) => tag.includes('main-'))
      const deferredStylesheets = stylesheets.tags
        .filter((tag) => !tag.includes('main-'))
        .map(toAsyncStylesheet)

      const bundle = [
        ...syncStylesheets,
        ...deferredStylesheets,
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
  plugins: [react(), cleanUrlsDev(), earlyCriticalAssets(), copyBackgroundVideos()],
  server: {
    port: 3000,
    open: true,
    // Expose dev server on LAN so phones on the same Wi-Fi can connect
    // via http://<your-ip>:3000/ — printed in the terminal as "Network:".
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Bump warning so legitimate vendor chunks (lottie) don't spam the build log.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        educationFinanciere: resolve(__dirname, 'education-financiere.html'),
        apprendreLaBourse: resolve(__dirname, 'apprendre-la-bourse.html'),
        cryptoDebutant: resolve(__dirname, 'crypto-debutant.html'),
        confidentialite: resolve(__dirname, 'politique-confidentialite.html'),
        conditions: resolve(__dirname, 'conditions-utilisation.html'),
        faq: resolve(__dirname, 'faq.html'),
        blog: resolve(__dirname, 'blog.html')
      },
      output: {
        // Split vendor libs so the initial bundle stays lean and below-fold
        // libs (lottie) only load when their islands hydrate.
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
