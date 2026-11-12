// Optional network smoke: kept separate from deterministic CI/browser fixtures.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const dir = process.env.STREAM_LIVE_SHOT_DIR || 'work/iteration10/actual';
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), headless: true, args: ['--no-sandbox'] });
try {
  for (const [width, theme] of [[1440, 'dark'], [390, 'light']]) {
    const context = await browser.newContext({ viewport: { width, height: 1100 }, reducedMotion: 'reduce' });
    await context.addInitScript((theme) => localStorage.setItem('atlas-theme', theme), theme);
    const page = await context.newPage(); const errors = []; const responses = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', (response) => { if (response.url().includes('/observatory-data/feed/')) responses.push({ url: response.url(), status: response.status() }); });
    assert.ok((await page.goto(base + '/observatory/')).ok());
    await page.locator('.stream-controls').waitFor();
    await page.waitForFunction(() => !document.getElementById('stream-check').hidden && !document.getElementById('stream-check').disabled);
    assert.match(await page.locator('#stream-message').innerText(), /已检查|新快照/);
    if (await page.locator('#stream-apply').isVisible()) await page.click('#stream-apply');
    const publicData = await page.evaluate(async (base) => {
      const { validateStreamIndex, validateStreamStatus } = await import(base + '/assets/js/atlas/stream-models.js');
      const raw = 'https://raw.githubusercontent.com/Brook-brook/Brook-ZzQq.github.io/observatory-data/feed/';
      const read = async (name) => {
        const response = await fetch(raw + name, { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
        if (!response.ok) throw new Error(`Public smoke HTTP ${response.status}`);
        return response.json();
      };
      const index = validateStreamIndex(await read('index.json'));
      const status = validateStreamStatus(await read('status.json'));
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(index)));
      const digest = [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
      if (digest !== status.digest) throw new Error('Public status/index hash differs');
      return { attempted_at: index.attempted_at, total: index.total, sources_ok: status.sources_ok,
        sources_total: status.sources_total, archives: index.archives };
    }, base);
    const day = await page.locator('#stream-day option').nth(1).getAttribute('value');
    await page.selectOption('#stream-day', day);
    await page.waitForFunction(() => document.getElementById('stream-message').textContent.includes('已打开'));
    assert.ok((await page.locator('#stream-count').innerText()).includes(`档案累计 ${publicData.total} 份`));
    assert.ok(responses.some((entry) => entry.url.includes('/archive/') && entry.status === 200));
    assert.equal(await page.evaluate(() => localStorage.getItem('brooks-universe.observatory.v1')), null);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${dir}/intro-${width}-${theme}.png` });
    await page.locator('#updates').evaluate((node) => node.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: `${dir}/updates-${width}-${theme}.png` });
    await page.locator('#stream-health').evaluate((node) => { node.parentElement.open = true; });
    await page.locator('#stream-health').screenshot({ path: `${dir}/health-${width}-${theme}.png` });
    console.log(`PASS live public data ${width} ${theme}: ${JSON.stringify(publicData)}; real status/index/archive HTTP200, digest/schema, source health, no private-record writes or console errors`);
    await context.close();
  }
} finally { await browser.close(); }
