// Generates PWA icon PNGs from the Skilly bracket wordmark design using Playwright.
// Run: node scripts/generate-icons.mjs
// Run: node scripts/generate-icons.mjs --preview   (renders 256px preview for inspection)
//
// Design rationale:
//   SkillySvgLogo.tsx uses viewBox="0 0 160 40" with bracket arms at x=6/154 (outer)
//   and x=18/142 (arm tips), text at font-size=26, stroke-width=2.5.
//   We scale that 160×40 logo at ×3 (= 480×120px, centred in 512×512) so the
//   bracket-to-text ratio is pixel-identical to the sidebar logo.
//   x-offset = (512-480)/2 = 16,  y-offset = (512-120)/2 = 196
//   stroke-width is increased from 7.5 (proportional) to 12 for icon visibility.
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '../public/icons');

// SVG body — no background rect; the HTML page supplies the dark fill for PNGs.
// Coordinates are in the 512×512 viewBox; the SVG width/height attrs do the scaling.
function svgBody(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Left bracket [  (SkillySvgLogo ×3, x+16, y+196) -->
    <path d="M70 214 L34 214 L34 298 L70 298"
      stroke="#F59E0B" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Right bracket ] -->
    <path d="M442 214 L478 214 L478 298 L442 298"
      stroke="#F59E0B" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- "skilly" wordmark: font-size=26×3=78, centred at (256,256) -->
    <text
      x="256" y="256"
      font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
      font-weight="700"
      font-size="78"
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
  } catch {
    // Font CDN timeout — system fallback will be used
  }
  const filename = PREVIEW ? `icon-preview-${size}x${size}.png` : `icon-${size}x${size}.png`;
  const outputPath = path.join(iconsDir, filename);
  fs.writeFileSync(outputPath, await page.screenshot({ type: 'png' }));
  const kb = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`✓ ${filename}  (${size}×${size}, ${kb} KB)`);
}

await browser.close();
console.log('Done.');
