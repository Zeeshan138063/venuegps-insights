// Renders the deck to PDF and takes check screenshots.
// Usage: node scripts/export.mjs [baseUrl]   (default http://localhost:8080)
// Needs Playwright: npx playwright install chromium (if not installed).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:8080';
const shots = process.env.SHOTS; // folder for screenshots, optional

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`${base}/deck/index.html`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: 'deck/VenueGPS-Insights.pdf', width: '1920px', height: '1080px', printBackground: true });
console.log('Wrote deck/VenueGPS-Insights.pdf');

if (shots) {
  mkdirSync(shots, { recursive: true });
  const n = await page.locator('.slide').count();
  for (let k = 1; k <= n; k++) {
    await page.goto(`${base}/deck/index.html#${k}`, { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${shots}/slide-${String(k).padStart(2, '0')}.png` });
  }
  for (const [name, url, w, h] of [
    ['home', '/index.html', 1440, 900], ['home-phone', '/index.html', 390, 844],
    ['venue', '/demo/index.html', 1440, 900], ['venue-phone', '/demo/index.html', 390, 844],
    ['admin', '/demo/admin.html', 1440, 900], ['admin-phone', '/demo/admin.html', 390, 844],
  ]) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    try {
      await p.goto(base + url, { waitUntil: 'networkidle' });
      await p.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
      const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      console.log(name, errors.length ? `ERRORS: ${errors.join(' | ')}` : 'ok', over > 0 ? `horizontal overflow ${over}px` : '');
    } catch (e) { console.log(name, 'skipped:', e.message.split('\n')[0]); }
    await p.close();
  }
}
await browser.close();
