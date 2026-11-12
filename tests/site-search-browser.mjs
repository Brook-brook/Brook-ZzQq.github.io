import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io';
const prefix = new URL(base).pathname.replace(/\/$/, '');
const shots = process.env.SEARCH_SHOT_DIR || 'work/site-search';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript((theme) => {
      localStorage.setItem('atlas-theme', theme);
      localStorage.setItem('brooks-universe.learning.v1', 'PRIVATE_SEARCH_SENTINEL');
    }, theme);
    const page = await context.newPage();
    const errors = [];
    const requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(base + '/');
    assert.equal(requests.filter((url) => url.includes('/assets/data/site-search.json')).length, 0, 'index stays lazy');
    assert.equal(await page.locator('.home-path-list a').count(), 4);
    for (const link of await page.locator('.home-path-list a').all()) assert.ok((await link.getAttribute('href')).startsWith(prefix + '/study/paths/#'));
    await page.screenshot({ path: `${shots}/home-${width}-${theme}.png`, fullPage: true });
    await page.locator('[data-open-site-search]').click();
    const dialog = page.locator('[data-site-search-dialog]');
    await page.waitForFunction(() => document.querySelector('[data-search-popup] [data-search-results] a'));
    assert.equal(await page.locator('#site-search-query').evaluate((e) => e === document.activeElement), true);
    assert.equal(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth), true);
    await page.fill('#site-search-query', 'C++');
    assert.ok((await dialog.locator('[data-search-results] li').count()) > 0);
    await dialog.locator('[data-search-kind="lab"]').click();
    assert.equal(await dialog.locator('[data-search-results] li').count(), 1);
    assert.ok((await dialog.locator('[data-search-results] a').getAttribute('href')).endsWith('/playground/#copy'));
    await page.fill('#site-search-query', 'nothing-public-search-xyz');
    assert.ok(await dialog.locator('[data-search-empty]').isVisible());
    await page.fill('#site-search-query', 'Python');
    await dialog.locator('[data-search-kind="all"]').click();
    assert.ok(!((await dialog.innerText()).includes('PRIVATE_SEARCH_SENTINEL')));
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(';')}`), [], `search axe ${width} ${theme}`);
    assert.equal(await dialog.evaluate((node) => getComputedStyle(node).animationName), 'none');
    await page.screenshot({ path: `${shots}/search-${width}-${theme}.png` });
    await dialog.locator('[data-search-close]').focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await dialog.locator('footer a').evaluate((e) => e === document.activeElement), true);
    await page.keyboard.press('Tab');
    assert.equal(await dialog.locator('[data-search-close]').evaluate((e) => e === document.activeElement), true);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[data-site-search-dialog]').open);
    assert.equal(await page.locator('[data-open-site-search]').evaluate((e) => e === document.activeElement), true);
    await page.keyboard.press('Control+k');
    assert.equal(await dialog.evaluate((e) => e.open), true);
    await page.keyboard.press('Escape');
    assert.equal(requests.filter((url) => url.includes('/assets/data/site-search.json')).length, 1, 'reuse one public index');
    assert.equal(requests.some((url) => url.includes('nothing-public-search-xyz')), false, 'query is never sent');
    assert.equal(await page.evaluate(() => localStorage.getItem('brooks-universe.learning.v1')), 'PRIVATE_SEARCH_SENTINEL');

    await page.goto(base + '/search/');
    const catalog = page.locator('[data-site-search-page]');
    await page.waitForSelector('[data-search-controls]:not([hidden])');
    const total = await catalog.locator('[data-search-results] li').count();
    assert.ok(total >= 30);
    await page.fill('#page-search-query', 'Python');
    await catalog.locator('[data-search-kind="path"]').click();
    assert.equal(await catalog.locator('[data-search-results] li').count(), 1);
    await page.locator('#page-search-query').focus();
    await page.keyboard.press('Control+k');
    assert.equal(await dialog.evaluate((e) => e.open), false, 'shortcut preserves input editing');
    await page.fill('#page-search-query', '');
    await catalog.locator('[data-search-kind="all"]').click();
    assert.equal(await catalog.locator('[data-search-results] li').count(), total);
    const catalogAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(catalogAxe.violations.map((v) => v.id), []);

    await page.goto(base + '/projects/');
    await page.waitForSelector('[data-project-finder]:not([hidden])');
    const all = await page.locator('[data-project-row]').count();
    for (const status of ['available', 'review', 'planned']) {
      await page.locator(`[data-project-filter="${status}"]`).click();
      const shown = await page.locator('[data-project-row]:visible').evaluateAll((rows) => rows.map((row) => row.dataset.projectStatus));
      assert.ok(shown.length > 0 && shown.every((value) => value === status));
    }
    assert.equal(await page.locator('#project-next a, #project-next button').count(), 0);
    await page.fill('#project-query', 'no-such-project');
    assert.ok(await page.locator('[data-project-empty]').isVisible());
    await page.locator('[data-project-reset]').click();
    assert.equal(await page.locator('[data-project-row]:visible').count(), all);
    await page.fill('#project-query', 'RSS');
    assert.ok((await page.locator('[data-project-row]:visible').count()) > 0);
    await page.locator('[data-project-reset]').click();
    await page.screenshot({ path: `${shots}/projects-${width}-${theme}.png`, fullPage: true });
    await page.locator('[data-project-filter="planned"]').click();
    await page.locator('[data-open-site-search]').click();
    await page.fill('#site-search-query', 'Zijingang');
    await dialog.locator('[data-search-kind="project"]').click();
    await dialog.locator('[data-search-results] a').click();
    await page.waitForFunction(() => !document.querySelector('[data-site-search-dialog]').open);
    assert.ok(await page.locator('#project-zijingang').isVisible(), 'same-page result reveals filtered project');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await context.close();
  }

  // Narrow desktop and smallest phone headers retain non-overlapping controls.
  for (const width of [320, 1051, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(base + '/');
    const boxes = await page.locator('.site-header > .brand, .site-header > .site-search-toggle, .site-header > .theme-toggle, .site-header > .menu-toggle, .site-header > nav').evaluateAll((nodes) => nodes.filter((node) => node.getClientRects().length).map((node) => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom }; }));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `header overflow ${width}`);
    boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => assert.ok(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y, `overlapping header ${width}`)));
    await page.close();
  }
  const fallback = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const nojs = await fallback.newPage();
  await nojs.goto(base + '/search/');
  assert.ok((await nojs.locator('[data-search-entry]:visible').count()) >= 30);
  await nojs.goto(base + '/projects/');
  assert.equal(await nojs.locator('[data-project-row]:visible').count(), 5);
  assert.ok(await nojs.locator('[data-project-finder]').isHidden());
  await fallback.close();

  const page = await browser.newPage();
  await page.route('**/assets/data/site-search.json', (route) => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto(base + '/');
  await page.locator('[data-open-site-search]').click();
  await page.waitForSelector('[data-search-retry]:visible');
  assert.ok(await page.locator('[data-search-error]:visible').isVisible());
  await page.unroute('**/assets/data/site-search.json');
  await page.locator('[data-search-retry]').click();
  await page.waitForFunction(() => document.querySelector('[data-search-popup] [data-search-results] a'));
  assert.ok(await page.locator('[data-search-retry]').isHidden());
  await page.close();

  const unsupported = await browser.newContext();
  await unsupported.addInitScript(() => { HTMLDialogElement.prototype.showModal = undefined; });
  const legacy = await unsupported.newPage();
  await legacy.goto(base + '/');
  await legacy.locator('[data-open-site-search]').click();
  await legacy.waitForURL('**/search/');
  assert.ok(await legacy.locator('[data-site-search-page]').isVisible());
  await unsupported.close();
  console.log('PASS public search/home routes/project filters: 390/768/1440 × two themes, axe, privacy, lazy index, keyboard, no-JS, fallback and retry; headers 320/1051/1280');
} finally { await browser.close(); }
