// Generates PWA icon PNGs from the Skilly bracket wordmark design using Playwright.
// Run: node scripts/generate-icons.mjs
// Run: node scripts/generate-icons.mjs --preview   (256px preview for visual check)
//
// Layout in 512×512 viewBox:
//   - brackets span x=16..496 (97% width), y=163..349 (36% height)
//   - arm depth = 45px  →  inner tips at x=61 / x=451  →  inner width = 390px
//   - "skilly" at font-size 140 ≈ 364px wide  →  fills 93% of inner space
//   - text height / bracket height  =  140 / 186  =  75%  ✓
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '../public/icons');

function svgBody(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Left bracket [ -->
    <path d="M61 163 L16 163 L16 349 L61 349"
      stroke="#F59E0B" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Right bracket ] -->
    <path d="M451 163 L496 163 L496 349 L451 349"
      stroke="#F59E0B" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- "skilly" at font-size 140 — fills ~75% of the 186px bracket height -->
    <text
      x="256" y="252"
      font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
      font-weight="700"
      font-size="140"
      fill="#F8F7FF"
      text-anchor="middle"
      dominant-baseline="central"
    >skilly</text>
  </svg>`;
}

function makeHtml(size) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&display=block" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; }
    html, body { width: ${size}px; height: ${size}px; background: #0F0A1E; overflow: hidden; }
  </style>
</head>
<body>${svgBody(size)}</body>
</html>`;
}

const PREVIEW = process.argv.includes('--preview');
const sizes = PREVIEW ? [256] : [512, 192];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const size of sizes) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(makeHtml(size));
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch { /* font CDN timeout — system fallback used */ }

  const filename = PREVIEW ? `icon-preview-${size}x${size}.png` : `icon-${size}x${size}.png`;
  const outputPath = path.join(iconsDir, filename);
  fs.writeFileSync(outputPath, await page.screenshot({ type: 'png' }));
  const kb = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`✓ ${filename}  (${size}×${size}, ${kb} KB)`);
}

await browser.close();
