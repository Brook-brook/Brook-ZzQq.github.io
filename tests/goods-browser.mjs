import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.GOODS_SHOT_DIR || 'work/public-goods';
const key = 'brooks-universe.learning.v1';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
async function open(page) {
  await page.goto(base + '/playground/public-goods/');
  await page.waitForFunction(() => !document.getElementById('goods-controls').disabled);
}
async function capture(page, path) {
  await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
  await page.screenshot({ path, fullPage: true });
}
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    await context.addInitScript((theme) => {
      localStorage.setItem('atlas-theme', theme);
      const keys = ['brooks-universe.learning.v1', 'brooks-universe.observatory.v1'];
      for (const k of keys) localStorage.setItem(k, 'GOODS_PRIVATE_SENTINEL');
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      window.goodsReads = []; window.goodsWrites = [];
      Storage.prototype.getItem = function (k) { if (keys.includes(k)) window.goodsReads.push(k); return get.call(this, k); };
      Storage.prototype.setItem = function (k, value) { if (keys.includes(k)) window.goodsWrites.push(k); return set.call(this, k, value); };
    }, theme);
    const page = await context.newPage(), errors = [], missing = [], requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (r) => { if (r.url().startsWith(base) && r.status() >= 400) missing.push(r.url()); });
    page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
    await open(page);
    assert.equal(await page.locator('#goods-payoff').innerText(), '26.0');
    assert.equal(await page.locator('#goods-nash').innerText(), '否');
    assert.equal(await page.locator('[data-goods-total="current"]').innerText(), '104.0');
    assert.equal(await page.locator('#goods-player-rows tr').count(), 4);
    assert.equal(await page.locator('#goods-multiplier').getAttribute('aria-valuetext'), '1.6 倍');
    await capture(page, `${shots}/default-${width}-${theme}.png`);
    await page.locator('#goods-c-P1').focus(); await page.keyboard.press('Home');
    assert.equal(await page.locator('#goods-payoff').innerText(), '32.0');
    assert.equal(await page.locator('[data-goods-total="current"]').innerText(), '98.0');
    assert.ok(await page.locator('#goods-c-P1').evaluate((node) => node === document.activeElement));
    await page.locator('#goods-zero').click();
    assert.equal(await page.locator('#goods-payoff').innerText(), '20.0'); assert.equal(await page.locator('#goods-nash').innerText(), '是');
    assert.equal(await page.locator('#goods-optimum').innerText(), '否');
    await page.locator('#goods-full').click(); assert.equal(await page.locator('#goods-optimum').innerText(), '是');
    await page.locator('#goods-m-equal').click(); await page.locator('#goods-c-P1').focus(); await page.keyboard.press('Home');
    assert.equal(await page.locator('#goods-nash').innerText(), '是'); assert.equal(await page.locator('#goods-optimum').innerText(), '否');
    assert.match(await page.locator('#goods-nash-set').innerText(), /所有纯策略组合都是均衡/);
    assert.match(await page.locator('#goods-player-rows tr').first().innerText(), /任意整数/);
    await capture(page, `${shots}/all-nash-${width}-${theme}.png`);
    await page.locator('#goods-m-one').click();
    assert.equal(await page.locator('[data-goods-total="current"]').innerText(), '80.0');
    assert.equal(await page.locator('#goods-optimum').innerText(), '是'); assert.equal(await page.locator('#goods-nash').innerText(), '否');
    await page.locator('#goods-zero').click(); assert.equal(await page.locator('#goods-nash').innerText(), '是');
    await page.selectOption('#goods-size', '8'); await page.locator('#goods-m-equal').click();
    assert.equal(await page.locator('#goods-nash').innerText(), '是');
    await page.locator('#goods-multiplier').focus(); await page.keyboard.press('End');
    assert.equal(await page.locator('#goods-multiplier-value').innerText(), '10.0 倍');
    await page.locator('#goods-full').click();
    assert.equal(await page.locator('[data-goods-total="current"]').innerText(), '1600.0');
    assert.equal(await page.locator('#goods-nash').innerText(), '是'); assert.equal(await page.locator('#goods-optimum').innerText(), '是');
    await page.locator('.goods-others > summary').click();
    assert.equal(await page.locator('#goods-other-inputs input').count(), 7);
    await page.locator('#goods-c-P8').focus(); await page.keyboard.press('Home');
    assert.match(await page.locator('#goods-feedback-P8').innerText(), /195\.0 点.*5\.0 点/);
    assert.ok(await page.locator('#goods-feedback-P8').evaluate((node) => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), 'active additional player has viewport-visible payoff feedback');
    assert.equal(await page.locator('#goods-player-rows tr').count(), 8);
    assert.equal(await page.locator('#goods-player-rows tr').last().locator('td').last().innerText(), '5.0');
    assert.equal(await page.locator('[data-goods-total="current"]').innerText(), '1420.0');
    assert.equal(await page.locator('#goods-nash').innerText(), '否');
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#goods-export').click()]);
    const report = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.equal(report.empirical, false); assert.equal(report.result.group_size, 8);
    assert.equal(report.result.parameters.multiplier_tenths, 100); assert.equal(report.result.parameters.contributions[7], 0);
    assert.equal(report.result.total_payoff, 1420); assert.equal(report.comparison.full.total_payoff, 1600);
    assert.equal(report.endpoint_slice[0].remaining_contributions[5], 0);
    assert.ok(!JSON.stringify(report).includes('GOODS_PRIVATE_SENTINEL'));
    await page.locator('#goods-reset').click();
    await page.locator('.goods-slice > summary').click();
    assert.deepEqual(await page.locator('#goods-slice-rows td').allTextContents(), ['(28.0, 28.0)', '(36.0, 16.0)', '(16.0, 36.0)', '(24.0, 24.0)']);
    assert.match(await page.locator('#goods-slice-scope').innerText(), /其余 2 人保持当前贡献 \[10, 10\]/);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(';')}`), [], `goods axe ${width} ${theme}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator('#goods-multiplier').focus(); await page.keyboard.press('Home');
    assert.equal(await page.locator('[data-goods-total="full"]').innerText(), '0.0');
    assert.match(await page.locator('#goods-social-set').innerText(), /全员投 0 点/);
    await page.evaluate(() => { const size = document.getElementById('goods-size'); size.add(new Option('invalid', '99')); size.value = '99'; size.dispatchEvent(new Event('change', { bubbles: true })); });
    assert.ok(await page.locator('#goods-export').isDisabled()); assert.match(await page.locator('#goods-status').innerText(), /人数超出/);
    await page.locator('#goods-m-equal').click(); assert.ok(await page.locator('#goods-export').isDisabled());
    await page.locator('#goods-reset').click(); assert.ok(await page.locator('#goods-export').isEnabled());
    assert.deepEqual(await page.evaluate(() => window.goodsReads), []); assert.deepEqual(await page.evaluate(() => window.goodsWrites), []);
    assert.ok(requests.every((r) => r.method === 'GET' && r.url.startsWith(new URL(base).origin) && !r.url.includes('GOODS_PRIVATE_SENTINEL')));
    assert.deepEqual(errors, []); assert.deepEqual(missing, []); await context.close();
  }

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const noPage = await nojs.newPage(); await noPage.goto(base + '/playground/public-goods/');
  assert.ok(await noPage.locator('#goods-c-P1').isDisabled()); assert.equal(await noPage.locator('#goods-payoff').innerText(), '26.0');
  await noPage.locator('.goods-slice > summary').click(); assert.equal(await noPage.locator('#goods-slice-rows td:visible').count(), 4);
  await noPage.goto(base + '/knowledge/public-goods/');
  await noPage.getByRole('link', { name: '查看这篇的阅读联系', exact: true }).click();
  assert.equal(new URL(noPage.url()).hash, '#connection-public-goods');
  assert.ok(await noPage.locator('#connection-public-goods').evaluate((node) => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; }), 'native public anchor reaches the actual no-JS library row');
  await nojs.close();

  const bridge = await browser.newContext({ acceptDownloads: true });
  const previousIds = ['python-values', 'rss-records', 'source-evidence', 'mercator-assumptions', 'map-provenance', 'copy-relations',
    'lifetime-boundaries', 'individual-collective', 'pure-equilibrium', 'classification-denominators', 'spatial-holdout', 'evaluation-evidence',
    'ai-version-scope', 'economy-denominators', 'policy-status', 'tool-contract', 'tool-observation', 'tool-boundaries'];
  const previous = { version: 1, entries: Object.fromEntries(previousIds.map((id) => [id, { completed: true, note: `Original eighteen: ${id}` }])) };
  const raw = JSON.stringify(previous, null, 2);
  await bridge.addInitScript(({ key, raw }) => { if (localStorage.getItem(key) === null) localStorage.setItem(key, raw); }, { key, raw });
  const page = await bridge.newPage(); await page.goto(base + '/study/practice/');
  await page.waitForFunction(() => document.querySelector('[data-practice-workspace]')?.dataset.practiceReady === 'true');
  assert.equal(await page.locator('[data-learning-step]:visible').getAttribute('id'), 'public-goods-incentives');
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), raw);
  const [legacy] = await Promise.all([page.waitForEvent('download'), page.locator('#learning-export').click()]);
  assert.deepEqual(JSON.parse(await readFile(await legacy.path(), 'utf8')), previous);
  await page.locator('[data-learning-step]:visible a[href*="/playground/public-goods/"]').click();
  await page.waitForFunction(() => !document.getElementById('goods-controls').disabled);
  await page.getByRole('link', { name: '留下自己的解释', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-practice-workspace]')?.dataset.practiceReady === 'true');
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), raw, 'lab visits never fabricate completion');
  await page.locator('[data-learning-step]:visible textarea').fill('单方面改变固定别人的贡献；同时改变需要重新计算公共份额。');
  const extended = JSON.parse(await page.evaluate((key) => localStorage.getItem(key), key));
  for (const id of previousIds) assert.deepEqual(extended.entries[id], previous.entries[id]);
  assert.equal(extended.entries['public-goods-incentives'].completed, false);
  await page.goto(base + '/knowledge/public-goods/');
  const icon = await page.locator('.site-search-toggle svg').boundingBox();
  assert.ok(icon.width >= 18 && icon.width <= 24 && Math.abs(icon.width - icon.height) < 1, 'article header keeps a compact square search icon');
  assert.ok(await page.locator('.site-search-toggle span').evaluate((node) => node.getBoundingClientRect().height <= parseFloat(getComputedStyle(node).fontSize) * 2), 'article search label stays on one line');
  await page.getByRole('link', { name: '查看这篇的阅读联系', exact: true }).click();
  await page.waitForFunction(() => document.getElementById('connection-current')?.value === 'public-goods' && document.activeElement === document.querySelector('#connection-note h3'));
  assert.ok(await page.locator('#connection-note h3').evaluate((node) => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
  assert.equal(await page.locator('#connection-public-goods').count(), 1, 'SSR anchor remains unique after enhancement');
  assert.match(await page.locator('[data-connection-group="before"]').innerText(), /纳什均衡/);
  assert.deepEqual(JSON.parse(await page.evaluate((key) => localStorage.getItem(key), key)), extended);
  await bridge.close();

  const normal = await browser.newContext({ viewport: { width: 390, height: 700 }, reducedMotion: 'no-preference' });
  const motionPage = await normal.newPage(); await open(motionPage);
  await motionPage.waitForTimeout(250);
  await motionPage.locator('#goods-c-P1').focus(); await motionPage.keyboard.press('Home');
  await motionPage.waitForFunction(() => document.querySelector('[data-goods-bar="current"]').getAnimations().length > 0);
  await motionPage.evaluate(() => { const m = matchMedia('(prefers-reduced-motion: reduce)'); window.goodsMotionChanged = m.matches; m.addEventListener('change', () => { window.goodsMotionChanged = m.matches; }); });
  await motionPage.emulateMedia({ reducedMotion: 'reduce' });
  await motionPage.waitForFunction(() => window.goodsMotionChanged && document.querySelector('[data-goods-bar="current"]').getAnimations().length === 0);
  for (const viewport of [{ width: 320, height: 640 }, { width: 768, height: 390 }]) {
    await motionPage.setViewportSize(viewport); assert.ok(await motionPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await motionPage.setViewportSize({ width: 390, height: 900 }); await motionPage.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  assert.ok(await motionPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await normal.close();
  console.log('PASS public goods: 390/768/1440 × themes, unilateral vs simultaneous outcomes, both equality boundaries, 8 players, exact ledger/slice, real complete export, guarded stale controls, privacy/axe/no-JS, original18 journal replay/extension, contextual public/native Knowledge anchors, keyboard/reduced-motion/320/short/200% text');
} finally { await browser.close(); }
