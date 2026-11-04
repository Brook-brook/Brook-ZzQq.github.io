import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { expectedPublicNotes } from './expected-notes.mjs';
const publicNotes = await expectedPublicNotes();
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'),
  headless: true,
  args: ['--no-sandbox']
});
const base =
  process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io';
const paths = [
  '/',
  '/explore/',
  '/explore/geo/',
  '/explore/ai/',
  '/explore/code/',
  '/projects/',
  '/knowledge/',
  '/about/',
  '/playground/',
  '/playground/nash/',
  '/playground/python/',
  '/knowledge/mercator-scale/',
  '/knowledge/cpp-copy/',
  '/knowledge/game-equilibrium/',
  '/knowledge/python-first-steps/'
];
const checked = new Set();
try {
  for (const width of process.env.ATLAS_WIDTHS
    ? process.env.ATLAS_WIDTHS.split(',').map(Number)
    : [390, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.status() >= 400 && new URL(r.url()).origin === new URL(base).origin)
        errors.push(`${r.status()} ${r.url()}`);
    });
    for (const theme of ['dark', 'light']) {
      await page.goto(base + '/');
      await page.evaluate((theme) => {
        localStorage.setItem('atlas-theme', theme);
      }, theme);
      for (const path of paths) {
        const response = await page.goto(base + path);
        assert.ok(response.ok(), path);
        assert.equal(
          await page.locator('header nav a[aria-current="page"]').count(),
          1,
          path
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          ),
          `overflow ${width} ${theme} ${path}`
        );
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        assert.deepEqual(
          results.violations.map(
            (v) => `${v.id}: ${v.nodes.map((n) => n.target).join(';')}`
          ),
          [],
          `axe ${width} ${theme} ${path}`
        );
        const links = await page
          .locator('a[href]')
          .evaluateAll((links) =>
            links
              .map(
                (a) => new URL(a.getAttribute('href'), document.baseURI).href
              )
              .filter((h) => h.startsWith(location.origin))
          );
        for (const link of links) {
          if (checked.has(link)) continue;
          const r = await page.request.get(link);
          assert.ok(r.ok(), `broken ${link}`);
          const url = new URL(link);
          if (url.hash)
            assert.ok(
              (await r.text()).includes(
                `id="${decodeURIComponent(url.hash.slice(1))}"`
              ),
              `missing anchor ${link}`
            );
          checked.add(link);
        }
      }
      await page.goto(base + '/');
      await page.screenshot({
        path: `work/home-${width}-${theme}.png`,
        fullPage: true
      });
    }
    await page.goto(base + '/playground/');
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
    if (width === 1440)
      writeFileSync(
        'work/copy-deep.cpp',
        await page.locator('#copy-code').innerText()
      );
    await page.locator('#latitude').fill('60');
    assert.match(await page.locator('#geo-result').innerText(), /2.000/);
    await page.screenshot({ path: `work/labs-${width}.png`, fullPage: true });
    await page.goto(base + '/playground/nash/');
    await page.click('#nash-matching');
    assert.match(await page.locator('#nash-status').innerText(), /0 个/);
    await page.locator('.nash-input').first().fill('21');
    assert.match(await page.locator('#nash-status').innerText(), /有效/);
    await page.goto(base + '/knowledge/');
    await page.fill('#note-query', 'zzzz-no-match');
    assert.ok(await page.locator('#note-empty').isVisible());
    await page.fill('#note-query', '');
    await page.click('button[data-category="GIS"]');
    assert.equal(await page.locator('[data-note]:visible').count(), 1);
    await page.goto(base + '/');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').innerText(), '跳至正文');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
    if (width < 1051) {
      await page.click('.menu-toggle');
      assert.ok(await page.locator('#primary-nav').isVisible());
      await page.keyboard.press('Escape');
      assert.ok(await page.locator('#primary-nav').isHidden());
      assert.ok(
        await page
          .locator('.menu-toggle')
          .evaluate((e) => e === document.activeElement)
      );
    }
    await page.click('#theme-toggle');
    const selected = await page.locator('html').getAttribute('data-theme');
    await page.reload();
    assert.equal(
      await page.locator('html').getAttribute('data-theme'),
      selected
    );
    // Runtime error path is tested without downloading the interpreter.
    await page.route('https://cdn.jsdelivr.net/**', (route) => route.abort());
    await page.goto(base + '/playground/python/');
    await page.click('#python-load');
    await page.waitForFunction(() =>
      document.getElementById('python-status').textContent.includes('失败')
    );
    assert.ok(await page.locator('#python-load').isEnabled());
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `PASS ${width}px: 15 pages × 2 themes; links, axe, labs, search, keyboard, menu, storage, Python error path`
    );
  }
  const page = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 900 }
  });
  await page.goto(base + '/');
  assert.ok(await page.locator('#primary-nav').isVisible());
  await page.goto(base + '/knowledge/');
  assert.equal(await page.locator('[data-note]:visible').count(), publicNotes.length);
  await page.close();
  console.log('PASS no-JavaScript: navigation and all notes accessible');
} finally {
  await browser.close();
}
