// Renders public/icons/icon.svg → PNG icons for the PWA manifest.
// Run: node scripts/generate-icons.mjs
// Run: node scripts/generate-icons.mjs --preview   (renders 256px check image)
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function makeHtml(svgContent, size) {
  // Scale the SVG to the requested pixel size; body has no extra background.
  const scaled = svgContent
    .replace(/width="512"/, `width="${size}"`)
    .replace(/height="512"/, `height="${size}"`);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>* { margin:0; padding:0; } html,body { width:${size}px; height:${size}px; overflow:hidden; background:#0F0A1E; }</style>
</head>
<body>${scaled}</body>
</html>`;
}

const PREVIEW = process.argv.includes('--preview');
const sizes   = PREVIEW ? [256] : [512, 192];

const svgContent = fs.readFileSync(path.join(root, 'public/icons/icon.svg'), 'utf8');

const browser = await chromium.launch();
const page    = await browser.newPage();

for (const size of sizes) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(makeHtml(svgContent, size));
  try { await page.waitForLoadState('networkidle', { timeout: 4000 }); } catch { /* ok */ }

  const filename = PREVIEW ? `icon-preview-${size}x${size}.png` : `icon-${size}x${size}.png`;
  const out = path.join(root, 'public/icons', filename);
  fs.writeFileSync(out, await page.screenshot({ type: 'png' }));
  console.log(`✓ ${filename}  (${size}×${size}, ${(fs.statSync(out).size/1024).toFixed(1)} KB)`);
}

await browser.close();
