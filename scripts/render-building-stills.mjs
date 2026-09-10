/**
 * One-off helper to snapshot Lottie buildings into static PNGs.
 * Requires: npm i -D puppeteer-core  (not a runtime dependency)
 * Run: node scripts/render-building-stills.mjs
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src/assets/batiments');
const outDir = path.join(srcDir, 'stills');
const lottiePath = path.join(root, 'node_modules/lottie-web/build/player/lottie.min.js');
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const files = [
  'job-1.json',
  'moulin-1.json',
  'ruines.json',
  'phare-1.json',
  'agence-1.json',
  'foreuse-1.json'
];

const SIZE = 1080;
const lottieJs = fs.readFileSync(lottiePath, 'utf8');

fs.mkdirSync(outDir, { recursive: true });

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin: 0; padding: 0; background: transparent; width: ${SIZE}px; height: ${SIZE}px; overflow: hidden; }
    #stage { width: ${SIZE}px; height: ${SIZE}px; }
  </style>
</head>
<body>
  <div id="stage"></div>
  <script>${lottieJs}</script>
  <script>
    window.renderBuilding = (data) => new Promise((resolve, reject) => {
      const stage = document.getElementById('stage');
      stage.innerHTML = '';
      const anim = lottie.loadAnimation({
        container: stage,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: data,
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet' }
      });
      anim.addEventListener('data_failed', () => reject(new Error('lottie failed')));
      anim.addEventListener('DOMLoaded', () => {
        const mid = Math.max(0, Math.floor((anim.totalFrames || 1) * 0.35));
        anim.goToAndStop(mid, true);
        requestAnimationFrame(() => resolve(true));
      });
    });
  </script>
</body>
</html>`;

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars']
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });

  for (const file of files) {
    const json = JSON.parse(fs.readFileSync(path.join(srcDir, file), 'utf8'));
    await page.evaluate(async (data) => {
      await window.renderBuilding(data);
    }, json);

    const outPath = path.join(outDir, file.replace(/\.json$/, '.png'));
    await page.screenshot({
      path: outPath,
      omitBackground: true,
      type: 'png'
    });
    const stat = fs.statSync(outPath);
    console.log(`wrote ${path.relative(root, outPath)} (${Math.round(stat.size / 1024)}k)`);
  }
} finally {
  await browser.close();
}
