import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { READING_KEY } from '../assets/js/atlas/observatory-models.js';
import { createHash } from 'node:crypto';

const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.OBSERVATORY_SHOT_DIR || 'work/iteration9/observatory';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'),
  headless: true, args: ['--no-sandbox']
});
const saved = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), READING_KEY);
const fixture = JSON.parse(await readFile('_data/observatory_stream.json', 'utf8'));
const status = { schema_version: 1, attempted_at: fixture.attempted_at, last_complete_at: fixture.last_complete_at,
  sources_ok: fixture.sources.filter((source) => ['ok', 'not_modified'].includes(source.status)).length,
  sources_total: fixture.sources.length, total: fixture.total, index_path: 'index.json',
  digest: createHash('sha256').update(JSON.stringify(fixture)).digest('hex') };
async function open(page) {
  await page.route('https://raw.githubusercontent.com/Brook-brook/Brook-ZzQq.github.io/observatory-data/feed/**', (route) => {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(route.request().url().endsWith('status.json') ? status : fixture) });
  });
  assert.ok((await page.goto(base + '/observatory/')).ok());
  await page.locator('.observatory-filters').waitFor({ state: 'visible' });
}
async function exportPlan(page) {
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#reading-export')]);
  assert.equal(download.suggestedFilename(), 'brooks-observatory-reading-plan.md');
  return readFile(await download.path(), 'utf8');
}
async function axe(page, label) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(';')}`), [], label);
}
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript((mode) => {
      localStorage.setItem('atlas-theme', mode);
      localStorage.setItem('brooks-universe.learning.v1', '{"version":1,"entries":{"python-values":{"completed":false,"note":"keep my thought"}}}');
      localStorage.setItem('atlas-campus-favorites-v1', '["library"]');
    }, theme);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400 && new URL(response.url()).origin === new URL(base).origin) errors.push(response.url());
    });
    await open(page);
    assert.equal(await page.locator('#primary-nav [aria-current="page"]').count(), 1);
    assert.equal(await page.locator('#primary-nav [aria-current="page"]').innerText(), 'Observe');
    assert.equal(await page.locator('[data-source-row]').count(), 18);
    assert.equal(await page.locator('[data-item-type="briefing"]').count(), 4);
    assert.equal(await saved(page), null, 'opening a page never invents reading history');
    assert.ok(await page.locator('#reading-export').isDisabled());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(await page.locator('#source-query').evaluate((node) => parseFloat(getComputedStyle(node).fontSize) >= 16));
    await axe(page, `${width} ${theme} initial`);
    await page.screenshot({ path: `${shots}/observatory-${width}-${theme}.png` });

    await page.click('[data-topic-filter="ai"]');
    await page.click('[data-kind-filter="analysis"]');
    await page.locator('#source-query').fill('ＳＴＡＮＦＯＲＤ');
    assert.equal(await page.locator('[data-source-row]:visible').count(), 1);
    assert.ok(await page.locator('#source-ai-index').isVisible());
    await page.locator('#source-query').fill('<img onerror=x>');
    assert.equal(await page.locator('[data-source-row]:visible').count(), 0);
    assert.ok(await page.locator('#source-empty').isVisible());
    await page.click('#source-reset');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'source-query');
    assert.equal(await page.locator('[data-source-row]:visible').count(), 18);
    await page.locator('#source-query').fill('国际政治');
    assert.equal(await page.locator('[data-source-row]:visible').count(), 4, 'topic labels are searchable metadata');
    await page.locator('#source-query').fill('新闻报道');
    assert.equal(await page.locator('[data-source-row]:visible').count(), 2, 'source-type labels are searchable metadata');
    await page.click('#source-reset');

    await page.locator('[data-save-item="contrastive-discovery"]').focus();
    await page.keyboard.press('Space');
    assert.equal((await saved(page)).saved[0].url, 'https://arxiv.org/abs/2611.14514v1');
    await page.click('[data-start-list^="ai-index"]');
    await page.click('[data-start-list^="ai-index"]');
    assert.equal((await saved(page)).saved.length, 4, 'repeated starter selection never duplicates or replaces prior choices');
    await page.click('[data-start-list^="imf-weo"]');
    assert.equal((await saved(page)).saved.length, 8);
    await page.reload();
    assert.equal(await page.locator('#reading-queue li').count(), 8);
    assert.equal(await page.locator('[data-save-item="contrastive-discovery"]').getAttribute('aria-pressed'), 'true');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await axe(page, `${width} ${theme} populated`);
    await page.locator('#source-library').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shots}/library-${width}-${theme}.png` });
    await page.locator('#reading-desk').evaluate((node) => node.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: `${shots}/desk-${width}-${theme}.png` });
    await page.waitForLoadState('networkidle');
    const requests = [];
    page.on('request', (request) => { if (request.url().startsWith('http')) requests.push(request.url()); });
    const plan = await exportPlan(page);
    for (const text of ['https://arxiv.org/abs/2611.14514v1', '2026-11-10', '阅读边界：', '阅读问题：', '我的解释：', '- [ ]']) assert.ok(plan.includes(text));
    assert.equal(plan.includes('- [x]'), false);
    await page.locator('#reading-queue button').first().focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#reading-queue li').count(), 7);
    assert.ok(await page.evaluate(() => !!document.activeElement.closest('#reading-queue')));
    assert.equal(await page.locator('[data-save-item="contrastive-discovery"]').getAttribute('aria-pressed'), 'false');
    await page.getByText('清除本机阅读清单', { exact: true }).click();
    const beforeClear = await saved(page);
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.click('#reading-clear');
    assert.deepEqual(await saved(page), beforeClear);
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('#reading-clear');
    assert.equal(await saved(page), null);
    assert.equal(await page.locator('#reading-queue li').count(), 0);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('brooks-universe.learning.v1')).entries['python-values'].note), 'keep my thought');
    assert.equal(await page.evaluate(() => localStorage.getItem('atlas-campus-favorites-v1')), '["library"]');
    assert.equal(await page.evaluate(() => localStorage.getItem('atlas-theme')), theme);
    assert.deepEqual(requests, [], 'selection, filtering, export and reset never fetch or upload');
    assert.deepEqual(errors, []);
    for (const path of ['/knowledge/reading-ai-evidence/', '/knowledge/reading-world-evidence/']) {
      assert.ok((await page.goto(base + path)).ok());
      assert.equal(await page.locator('#primary-nav [aria-current="page"]').innerText(), 'Study');
      assert.equal(await page.getByRole('link', { name: '打开对应实验', exact: true }).count(), 0);
      const routes = page.locator('nav[aria-label="相关学习路线"]');
      assert.ok(await routes.count() <= 1);
      if (await routes.count()) {
        assert.ok(await routes.locator('a[href*="/study/paths/#"]').count() > 0, 'route navigation contains real matching routes');
        assert.ok((await routes.locator('a').allTextContents()).every((title) => title.trim()));
      }
      if (path.includes('reading-ai-evidence')) assert.ok(await routes.locator('a[href*="/study/paths/"][href$="#evaluation-evidence"]').isVisible());
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await axe(page, `${width} ${theme} ${path}`);
    }
    await context.close();
    console.log(`PASS Observatory ${width} ${theme}: source filters, explicit snapshots, starters/reload, real Markdown export, keyboard/reset/privacy, tutorials, axe and layout`);
  }

  for (const mode of ['blocked', 'corrupt', 'quota']) {
    const context = await browser.newContext();
    await context.addInitScript(({ key, mode }) => {
      if (mode === 'corrupt') localStorage.setItem(key, '{broken');
      const get = Storage.prototype.getItem; const set = Storage.prototype.setItem;
      Storage.prototype.getItem = function (name) {
        if (mode === 'blocked' && name === key) throw new DOMException('Denied', 'SecurityError');
        return get.call(this, name);
      };
      Storage.prototype.setItem = function (name, value) {
        if (['blocked', 'quota'].includes(mode) && name === key) throw new DOMException('Full', 'QuotaExceededError');
        return set.call(this, name, value);
      };
    }, { key: READING_KEY, mode });
    const page = await context.newPage(); await open(page);
    await page.click('[data-save-item="contrastive-discovery"]');
    assert.match(await page.locator('#reading-storage').innerText(), /暂存|无法写入/);
    assert.match(await page.locator('#contrastive-discovery [data-save-feedback]').innerText(), /仅本页暂存，未保存/);
    assert.ok((await exportPlan(page)).includes('https://arxiv.org/abs/2611.14514v1'));
    if (mode === 'corrupt') assert.equal(await page.evaluate((key) => localStorage.getItem(key), READING_KEY), '{broken');
    await context.close();
    console.log(`PASS Observatory ${mode}: inline memory-only feedback, original data preservation and usable export`);
  }

  const history = await browser.newContext();
  await history.addInitScript((key) => localStorage.setItem(key, JSON.stringify({ version: 1, saved: [{
    id: 'old-paper', title: '<img src=x onerror=alert(1)>', url: 'https://example.org/old-v1', topic: 'ai',
    item_type: 'briefing', version: 'v1', checked_on: '2026-10-01', question: 'Keep my original prompt', caveat: 'Old source version'
  }] })), READING_KEY);
  const historyPage = await history.newPage(); await open(historyPage);
  assert.equal(await historyPage.locator('#reading-queue img').count(), 0);
  assert.match(await historyPage.locator('#reading-queue').innerText(), /历史收藏/);
  assert.ok((await exportPlan(historyPage)).includes('https://example.org/old-v1'));
  await history.close();
  console.log('PASS Observatory historical material: safe text/HTTPS rendering and original snapshot export outside current catalog');

  const multi = await browser.newContext();
  const a = await multi.newPage(); const b = await multi.newPage(); await open(a); await open(b);
  await a.click('[data-save-item="contrastive-discovery"]');
  await b.waitForFunction(() => document.getElementById('reading-storage').textContent.includes('标签页'));
  await b.click('[data-start-list^="ai-index"]');
  assert.equal((await saved(a)).saved.length, 1);
  assert.ok((await exportPlan(b)).includes('https://openreview.net/'));
  await multi.close();
  console.log('PASS Observatory multiple tabs: external changes pause writes and retain page-memory export');

  const dated = await browser.newContext(); const datePage = await dated.newPage();
  await datePage.clock.install({ time: new Date('2027-01-01T00:00:00Z') }); await open(datePage);
  assert.match(await datePage.locator('#observatory-freshness').innerText(), /超过 30 天/);
  await dated.close();
  console.log('PASS Observatory aging catalog: explicit stale-source reminder, no false live-news status');

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const nojsPage = await nojs.newPage(); await nojsPage.goto(base + '/observatory/');
  assert.equal(await nojsPage.locator('[data-source-row]:visible').count(), 18);
  assert.equal(await nojsPage.locator('[data-observatory-control]:visible').count(), 0);
  await nojsPage.locator('#contrastive-discovery summary').click();
  assert.ok(await nojsPage.locator('#contrastive-discovery [data-item-question]').isVisible());
  assert.ok(await nojsPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await nojs.close();
  console.log('PASS Observatory no-JS: full source directory, native reading disclosures and honest unavailable controls');

  for (const width of [1051, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage(); await open(page);
    assert.ok(await page.evaluate(() => {
      const brand = document.querySelector('.site-header > .brand').getBoundingClientRect();
      const nav = document.getElementById('primary-nav').getBoundingClientRect();
      const theme = document.getElementById('theme-toggle').getBoundingClientRect();
      return brand.right <= nav.left && nav.right <= theme.left && document.documentElement.scrollWidth <= innerWidth;
    }), `navigation overlap ${width}`);
    await context.close();
  }
  console.log('PASS Observatory expanded navigation: 1051/1280px without overlap');
} finally { await browser.close(); }
