import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'),
  headless: true,
  args: ['--no-sandbox']
});
const base =
  process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io';
const shots = process.env.ATLAS_SHOT_DIR || 'work/obsidian';
await mkdir(shots, { recursive: true });
try {
  for (const width of [320, 390, 768, 1440, 1920]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.status() >= 400 && r.url().startsWith(base))
        errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(`${base}/explore/`);
    await page.waitForFunction(
      () =>
        document.getElementById('campus-canvas').getAttribute('aria-busy') ===
        'false'
    );
    const bounds = await page.locator('#campus-canvas').boundingBox();
    assert.ok(
      bounds.y < 500 && bounds.y + bounds.height < 900,
      `map in first screen ${width}`
    );
    if (width < 960) {
      const sidebar = await page.locator('#campus-sidebar').boundingBox();
      assert.ok(
        sidebar.y > bounds.y + bounds.height,
        'mobile starts with the map'
      );
    }
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    );
    const pin = page.locator('[data-pin="main-library"]');
    await pin.click();
    await page.locator('#campus-detail').waitFor({ state: 'visible' });
    assert.equal(
      await page.locator(':focus').getAttribute('id'),
      'campus-detail'
    );
    assert.ok(await page.locator('#detail-coordinates').innerText());
    // Selection must not cover its own marker or the zoom controls.
    for (const selector of [
      '[data-pin="main-library"]',
      '#map-zoom-in',
      '#map-zoom-out',
      '#map-reset'
    ]) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      assert.ok(
        await page.locator(selector).evaluate((e) => {
          const r = e.getBoundingClientRect();
          const top = document.elementFromPoint(
            r.x + r.width / 2,
            r.y + r.height / 2
          );
          return e === top || e.contains(top);
        }),
        `${selector} unobstructed ${width}`
      );
    }
    await page.screenshot({
      path: `${shots}/selected-${width}.png`,
      fullPage: true
    });
    await page.locator('#campus-detail').focus();
    await page.keyboard.press('Escape');
    assert.equal(
      await page.locator(':focus').getAttribute('data-pin'),
      'main-library'
    );
    await page.click('[data-layer="labels"]');
    assert.equal(
      await page
        .locator('[data-pin="lake-island"] .pin-label')
        .evaluate((e) => getComputedStyle(e).opacity),
      '1',
      'labels layer is visually effective'
    );
    await page.click('[data-layer="grid"]');
    assert.ok(
      await page.locator('#campus-detail').isHidden(),
      'layer changes do not reopen closed details'
    );
    // A source list remains real navigation; every scrolled-out entry is reachable.
    const last = page.locator('[data-select="lake-island"]');
    await last.click();
    assert.match(await page.locator('#detail-title').innerText(), /湖心岛/);
    await page.click('#map-sidebar-toggle');
    await page.keyboard.press('Escape');
    assert.equal(
      await page.locator(':focus').getAttribute('id'),
      'campus-canvas',
      'closed source list gets a visible focus fallback'
    );
    await page.click('#map-sidebar-toggle');
    // Remove @supports blocks to exercise the actual opaque fallback declarations.
    await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (let i = sheet.cssRules.length - 1; i >= 0; i--)
            if (sheet.cssRules[i].type === CSSRule.SUPPORTS_RULE)
              sheet.deleteRule(i);
        } catch {
          /* only local same-origin styles participate */
        }
      }
    });
    const fallback = await page.locator('#campus-sidebar').evaluate((e) => {
      const s = getComputedStyle(e);
      return { blur: s.backdropFilter, fill: s.backgroundColor };
    });
    assert.equal(fallback.blur, 'none');
    assert.ok(!fallback.fill.startsWith('rgba'), 'fallback is opaque');
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `PASS Obsidian ${width}: map-first, selected controls, keyboard, complete source list, glass fallback`
    );
  }
} finally {
  await browser.close();
}
