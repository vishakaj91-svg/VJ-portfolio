import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const outDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Find next N
const existing = fs.readdirSync(outDir).filter((f) => /^screenshot-\d+(-.*)?\.png$/.test(f));
const nums = existing.map((f) => parseInt(f.match(/^screenshot-(\d+)/)[1], 10));
const next = nums.length ? Math.max(...nums) + 1 : 1;
const filename = label
  ? `screenshot-${next}-${label}.png`
  : `screenshot-${next}.png`;
const outPath = path.join(outDir, filename);

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
// Give fonts and webfonts an extra beat to settle
await new Promise((r) => setTimeout(r, 1200));
// Force all scroll-reveal elements visible (IO won't fire during full-page capture)
await page.evaluate(() => {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  document.querySelectorAll('.stagger > *').forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.animation = 'none';
  });
});
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: outPath, fullPage: true, timeout: 120000 });
await browser.close();

console.log(`Saved: ${outPath}`);
