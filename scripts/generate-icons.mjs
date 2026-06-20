// Generates PWA icon PNGs from the Skilly bracket wordmark design using Playwright.
// Run: node scripts/generate-icons.mjs
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '../public/icons');

// Preview mode: renders a larger version for manual inspection
const PREVIEW = process.argv.includes('--preview');

// Bracket + wordmark SVG body (no background rect — body supplies it for PNGs)
// Outer bracket edges: x=44 / x=468  (8.6% from each side)
// Arm depth: 46px → arm tips at x=90 / x=422
// Inner clear width between tips: 332px
// Full-height brackets: y=64 → y=448 (392px tall, 12.5% top/bottom margin)
// "skilly" in Plus Jakarta Sans 700 at 108px ≈ ~280px wide → fits with ~26px margin
// stroke-width=24 → round caps add ±12px, effective inner = ~308px
function svgBody(size) {
  // All coordinates are in the 512×512 viewBox and scale via width/height attrs
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Left bracket [ -->
    <path d="M90 64 L44 64 L44 448 L90 448"
      stroke="#F59E0B" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Right bracket ] -->
    <path d="M422 64 L468 64 L468 448 L422 448"
      stroke="#F59E0B" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- "skilly" wordmark centered between brackets -->
    <text
      x="256" y="256"
      font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
      font-weight="700"
      font-size="108"
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

const browser = await chromium.launch();
const page = await browser.newPage();

const sizes = PREVIEW ? [256] : [512, 192];

for (const size of sizes) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(makeHtml(size));
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch {
    // Font CDN timeout — system fallback will render
  }

  const filename = PREVIEW
    ? `icon-preview-${size}x${size}.png`
    : `icon-${size}x${size}.png`;
  const outputPath = path.join(iconsDir, filename);
  const buffer = await page.screenshot({ type: 'png' });
  fs.writeFileSync(outputPath, buffer);
  const kb = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`✓ ${filename}  (${size}x${size}, ${kb} KB)`);
}

await browser.close();
console.log('Done.');
