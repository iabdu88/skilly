// Generates PWA icon PNGs from the Skilly bracket logo design using Playwright.
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '../public/icons');

function makeHtml(size) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=block" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; }
    html, body { width: ${size}px; height: ${size}px; background: #0F0A1E; overflow: hidden; }
  </style>
</head>
<body>
  <svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M150 60 L60 60 L60 452 L150 452" stroke="#F59E0B" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M362 60 L452 60 L452 452 L362 452" stroke="#F59E0B" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
    <text
      x="256" y="256"
      font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
      font-weight="800"
      font-size="220"
      fill="#F8F7FF"
      text-anchor="middle"
      dominant-baseline="central"
    >S</text>
  </svg>
</body>
</html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage();

for (const size of [512, 192]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(makeHtml(size));
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch {
    // Font CDN timeout is fine — system fallback will be used
  }
  const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  const buffer = await page.screenshot({ type: 'png' });
  fs.writeFileSync(outputPath, buffer);
  const bytes = fs.statSync(outputPath).size;
  console.log(`✓ icon-${size}x${size}.png  (${(bytes / 1024).toFixed(1)} KB)`);
}

await browser.close();
console.log('Done.');
