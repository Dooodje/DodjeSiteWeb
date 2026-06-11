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

export default defineConfig({
  plugins: [react(), cleanUrlsDev()],
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
    // Bump warning so legitimate vendor chunks (framer-motion, lottie) don't
    // spam the build log.
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
            if (id.includes('framer-motion') || id.includes('motion-utils') || id.includes('motion-dom')) {
              return 'vendor-motion'
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
