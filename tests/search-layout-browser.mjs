import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io';
const shots = process.env.SEARCH_SHOT_DIR || 'work/search-layout';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript((theme) => localStorage.setItem('atlas-theme', theme), theme);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base + '/');
    await page.locator('[data-open-site-search]').click();
    const dialog = page.locator('[data-site-search-dialog]');
    await dialog.locator('[data-search-more]').waitFor({ state: 'visible' });
    const original = await dialog.boundingBox();
    await dialog.locator('[data-search-more]').click();
    assert.equal(await dialog.locator('[data-search-results] a').nth(8).evaluate((e) => e === document.activeElement), true);
    await page.fill('#site-search-query', 'CPP');
    assert.equal(await dialog.locator('[data-search-popup]').evaluate((e) => e.scrollTop), 0);
    const heading = await dialog.locator('header').boundingBox();
    const label = await dialog.locator('label').boundingBox();
    assert.ok(label.y >= heading.y + heading.height - 1, 'query label stays below fixed header after loading more');
    await page.screenshot({ path: `${shots}/aliases-${width}-${theme}.png` });
    await dialog.locator('[data-search-kind="page"]').click();
    assert.ok(await dialog.locator('[data-search-empty]').isVisible());
    const emptyBox = await dialog.boundingBox();
    assert.ok(Math.abs(emptyBox.y - original.y) < 1 && Math.abs(emptyBox.height - original.height) < 1, 'empty results do not move the search sheet');
    await page.screenshot({ path: `${shots}/empty-${width}-${theme}.png` });
    await dialog.locator('[data-search-all]').click();
    assert.equal(await page.inputValue('#site-search-query'), 'CPP');
    if (width === 390) {
      await page.setViewportSize({ width, height: 520 });
      const box = await dialog.boundingBox();
      assert.ok(box.y >= 0 && box.y + box.height <= 520, 'short viewport keeps the whole sheet inside the screen');
      const close = await dialog.locator('[data-search-close]').boundingBox();
      assert.ok(close.height >= 44 && close.y >= box.y);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('PASS search layout: 390/768/1440 × two themes; stable sheet across empty/results, visible input label after continuation, original query recovery, 520px short viewport, no overflow/console errors');
} finally { await browser.close(); }
