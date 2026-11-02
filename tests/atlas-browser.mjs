import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'),
  headless: true,
  args: ['--no-sandbox']
});
const base = process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173';
try {
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce'
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.status() >= 400 && new URL(r.url()).origin === new URL(base).origin)
        errors.push(`${r.status()} ${r.url()}`);
    });
    for (const path of [
      '/atlas/',
      '/atlas/projects/',
      '/atlas/knowledge/',
      '/atlas/playground/'
    ]) {
      await page.goto(base + path);
      assert.equal(await page.locator('header nav a[aria-current="page"]').count(), 1);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        ),
        `overflow ${width} ${path}`
      );
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      assert.deepEqual(
        results.violations.map((v) => `${v.id}: ${v.nodes.length}`),
        [],
        `axe ${width} ${path}`
      );
      const links = await page
        .locator('a[href]')
        .evaluateAll((links) =>
          links.map((a) => a.href).filter((h) => h.startsWith(location.origin))
        );
      for (const link of links) {
        const r = await page.request.get(link);
        assert.ok(r.ok(), `broken ${link}`);
      }
    }
    await page.selectOption('#row-choice', '1');
    await page.selectOption('#col-choice', '1');
    assert.match(await page.locator('#game-result').innerText(), /总收益 2/);
    await page.selectOption('#game-kind', 'stag');
    assert.equal(await page.locator('#matrix td[aria-label]').count(), 2);
    for (let i = 0; i < 3; i++) await page.click('#copy-next');
    assert.match(await page.locator('#memory').innerText(), /悬空/);
    assert.ok(await page.locator('#copy-next').isDisabled());
    await page.selectOption('#copy-kind', 'deep');
    for (let i = 0; i < 3; i++) await page.click('#copy-next');
    assert.match(await page.locator('#memory').innerText(), /H2 → 7/);
    await page.locator('#latitude').fill('60');
    assert.match(await page.locator('#geo-result').innerText(), /2.000/);
    await page.goto(base + '/atlas/');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').innerText(), '跳至正文');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
    await page.screenshot({ path: `work/atlas-${width}.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      `PASS ${width}px: pages, links, axe, interactions, keyboard, no overflow or JS errors`
    );
  }
} finally {
  await browser.close();
}
