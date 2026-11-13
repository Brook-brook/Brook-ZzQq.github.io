import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const base = process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
await mkdir('work/iteration16/feedback', { recursive: true });
try {
  for (const route of ['paths', 'practice']) for (const mode of ['quota', 'blocked', 'corrupt', 'conflict']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    await context.addInitScript((mode) => {
      const key = 'brooks-universe.learning.v1';
      if (mode === 'corrupt') localStorage.setItem(key, '{broken synthetic recovery fixture');
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      Storage.prototype.getItem = function (name) { if (mode === 'blocked' && name === key) throw new DOMException('Denied', 'SecurityError'); return get.call(this, name); };
      Storage.prototype.setItem = function (name, value) { if (mode === 'quota' && name === key) throw new DOMException('Full', 'QuotaExceededError'); return set.call(this, name, value); };
    }, mode);
    const page = await context.newPage(); await page.goto(base + `/study/${route}/`);
    await page.waitForFunction(() => document.querySelector('[data-learning-workspace]')?.dataset.learningReady === 'true');
    const step = page.locator('[data-learning-step="python-values"]');
    if (route === 'paths') await step.locator('summary').click();
    if (mode === 'conflict') await page.evaluate(() => localStorage.setItem('brooks-universe.learning.v1', JSON.stringify({ version: 1, entries: { 'rss-records': { completed: true, note: 'OTHER_TAB_SYNTHETIC_RECORD' } } })));
    await step.locator('textarea').fill('SYNTHETIC_EXPORTABLE_MEMORY_NOTE');
    const warning = step.locator('[data-storage-warning]');
    assert.ok(await warning.isVisible());
    assert.ok(await warning.locator('span').evaluate((node) => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), `failure stays next to the active editor: ${route}/${mode}`);
    assert.match(await step.locator('textarea').getAttribute('aria-describedby'), /storage-warning-python-values/);
    assert.equal(await warning.getAttribute('aria-live'), null, 'only the original shared status is live, avoiding repeated announcements');
    if (route === 'practice' && mode === 'quota') await page.screenshot({ path: 'work/iteration16/feedback/quota-editor-390-dark.png', fullPage: false });
    await warning.locator('a').click();
    assert.equal(new URL(page.url()).hash, '#learning-backup');
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#learning-export').click()]);
    const state = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.equal(state.entries['python-values'].note, 'SYNTHETIC_EXPORTABLE_MEMORY_NOTE');
    if (mode === 'corrupt') assert.equal(await page.evaluate(() => localStorage.getItem('brooks-universe.learning.v1')), '{broken synthetic recovery fixture');
    if (mode === 'conflict') assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('brooks-universe.learning.v1'))).entries['rss-records'].note, 'OTHER_TAB_SYNTHETIC_RECORD');
    await context.close();
    console.log(`PASS ${route} ${mode}: viewport-visible editor warning, contextual description, explicit backup jump and real memory export`);
  }
} finally { await browser.close(); }
