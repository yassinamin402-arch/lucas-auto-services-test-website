// Usage: node screenshot.mjs <url> [label] [--width=1440] [--height=900] [--viewport]
// Saves to "./temporary screenshots/screenshot-N[-label].png" (auto-incremented, never overwritten).
// Full-page by default; pass --viewport to capture only the visible viewport.
import puppeteer from 'puppeteer-core';
import { mkdir, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => {
  const [k, v] = a.slice(2).split('='); return [k, v ?? true];
}));
const [url = 'http://localhost:3000', label] = args.filter(a => !a.startsWith('--'));
const width = Number(flags.width) || 1440;
const height = Number(flags.height) || 900;

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = resolve(import.meta.dirname, 'temporary screenshots');
await mkdir(OUT, { recursive: true });

const nums = (await readdir(OUT)).map(f => f.match(/^screenshot-(\d+)/)?.[1]).filter(Boolean).map(Number);
const n = (nums.length ? Math.max(...nums) : 0) + 1;
const file = join(OUT, `screenshot-${n}${label ? `-${label}` : ''}.png`);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 800)); // let entrance animations settle
  await page.screenshot({ path: file, fullPage: !flags.viewport });
  console.log(file);
} finally {
  await browser.close();
}
