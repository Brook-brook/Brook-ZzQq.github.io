import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.TOOL_SHOT_DIR || 'work/tool-calling';
const learningKey = 'brooks-universe.learning.v1', readingKey = 'brooks-universe.observatory.v1';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
const load = async (page) => { await page.goto(base + '/playground/tool-calling/'); await page.waitForFunction(() => !document.getElementById('tool-controls').disabled); };
const clickNext = async (page) => page.locator('#tool-next').click();
const finish = async (page) => { for (let i = 0; i < 4; i++) await clickNext(page); };
const output = async (page) => JSON.parse(await page.locator('#tool-output').innerText());
const setCall = async (page, name, args) => page.locator('#tool-call').fill(JSON.stringify({ name, arguments: args }, null, 2));
const capture = async (page, path) => {
  // Full-page Chromium paints fixed focus helpers incorrectly after a scrolled
  // control action. Focus behavior is asserted separately; capture from the top.
  await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
  await page.screenshot({ path, fullPage: true });
};
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    await context.addInitScript(({ theme, learningKey, readingKey }) => {
      localStorage.setItem('atlas-theme', theme); localStorage.setItem(learningKey, 'TOOL_PRIVATE_SENTINEL'); localStorage.setItem(readingKey, 'TOOL_PRIVATE_SENTINEL');
      window.toolPrivateReads = []; window.toolPrivateWrites = [];
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      Storage.prototype.getItem = function (key) { if ([learningKey, readingKey].includes(key)) window.toolPrivateReads.push(key); return get.call(this, key); };
      Storage.prototype.setItem = function (key, value) { if ([learningKey, readingKey].includes(key)) window.toolPrivateWrites.push(key); return set.call(this, key, value); };
    }, { theme, learningKey, readingKey });
    const page = await context.newPage(); const errors = [], missing = [], requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => { if (response.url().startsWith(base) && response.status() >= 400) missing.push(response.url()); });
    page.on('request', (request) => requests.push({ url: request.url(), method: request.method() }));
    await load(page);
    assert.equal(await page.locator('#tool-output').innerText(), '');
    assert.ok(await page.locator('#tool-export').isDisabled());
    assert.match(await page.locator('#tool-status').innerText(), /尚未校验或执行/);
    assert.ok(await page.locator('#tool-call').evaluate((node) => parseFloat(getComputedStyle(node).fontSize) >= 16));
    await capture(page, `${shots}/proposal-${width}-${theme}.png`);
    await clickNext(page);
    assert.equal(await page.locator('#tool-next').innerText(), '执行本机工具');
    assert.ok(await page.locator('#tool-result').isHidden(), 'validation does not execute');
    await clickNext(page);
    const calculated = await output(page);
    // Independently computed Python atan2(cross, dot) spherical oracle, same R.
    assert.ok(Math.abs(calculated.result.distance_m - 1020.2255073097381) < 1e-7);
    assert.equal(calculated.source_checked, '2026-11-02');
    assert.equal(calculated.catalog_size, 6);
    assert.ok(await page.locator('#tool-answer').isHidden());
    assert.ok(await page.locator('#tool-export').isDisabled());
    await clickNext(page);
    const observed = await output(page);
    assert.equal(observed.call_id, 'call-1'); assert.equal(observed.tool, 'measure_distance');
    assert.deepEqual(observed.output, calculated);
    await clickNext(page);
    assert.match(await page.locator('#tool-answer-text').innerText(), /1020\.2 米/);
    assert.ok(await page.locator('#tool-answer-title').evaluate((node) => node === document.activeElement));
    assert.ok(await page.locator('#tool-next').isDisabled());
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#tool-export').click()]);
    const report = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.equal(report.model_called, false); assert.equal(report.source.places.length, 6);
    assert.equal(report.source.license, 'ODbL-1.0'); assert.equal(report.explanation.kind, 'fixed-template');
    assert.ok(!JSON.stringify(report).includes('TOOL_PRIVATE_SENTINEL'));
    await capture(page, `${shots}/result-${width}-${theme}.png`);
    await setCall(page, 'nearby_places', { center: 'main-library', radius_m: 200 });
    assert.ok(await page.locator('#tool-result').isHidden());
    assert.equal(await page.locator('#tool-output').innerText(), '');
    assert.ok(await page.locator('#tool-export').isDisabled(), 'editing invalidates exports and prior results');
    assert.ok(await page.locator('#tool-call').evaluate((node) => node === document.activeElement));
    await finish(page);
    assert.deepEqual((await output(page)).output.result.places.map((p) => p.id), ['qiushi', 'lecture-hall']);
    await setCall(page, 'nearby_places', { center: 'main-library', radius_m: 0 }); await finish(page);
    assert.equal((await output(page)).output.result.count, 0);
    assert.match(await page.locator('#tool-answer-text').innerText(), /0 个其他代表点/);
    await page.selectOption('#tool-scenario', 'invalid'); await clickNext(page);
    assert.match(await page.locator('#tool-status').innerText(), /不能是带引号的文字/);
    assert.equal(await page.locator('#tool-call').getAttribute('aria-invalid'), 'true');
    assert.ok(await page.locator('#tool-call').evaluate((node) => node === document.activeElement));
    assert.ok(await page.locator('#tool-export').isDisabled());
    await page.selectOption('#tool-scenario', 'unknown'); await clickNext(page);
    assert.match(await page.locator('#tool-status').innerText(), /工具未开放/);
    await page.selectOption('#tool-scenario', 'receipt'); await clickNext(page); await clickNext(page); await clickNext(page);
    assert.match(await page.locator('#tool-status').innerText(), /调用 ID 或工具名不匹配/);
    assert.equal(await page.locator('#tool-next').innerText(), '重交正确回执');
    assert.ok(await page.locator('#tool-answer').isHidden()); assert.ok(await page.locator('#tool-export').isDisabled());
    await capture(page, `${shots}/receipt-error-${width}-${theme}.png`);
    await clickNext(page); await clickNext(page);
    assert.ok(await page.locator('#tool-export').isEnabled());
    await page.selectOption('#tool-scenario', 'search'); await finish(page);
    assert.deepEqual((await output(page)).output.result.places.map((p) => p.id), ['main-library', 'medical-library']);
    await setCall(page, 'find_places', { query: '图书馆', category: 'dining' }); await finish(page);
    assert.equal((await output(page)).output.result.count, 0);
    await setCall(page, 'find_places', { query: '<img src=x onerror="window.toolXss=1">', category: 'all' }); await finish(page);
    assert.equal((await output(page)).output.result.count, 0); assert.equal(await page.evaluate(() => window.toolXss), undefined);
    await page.locator('#tool-reset').click(); assert.match(await page.inputValue('#tool-call'), /图书馆/);
    await page.locator('#tool-call').fill('{broken'); await clickNext(page); assert.match(await page.locator('#tool-status').innerText(), /JSON 无法解析/);
    await page.locator('#tool-reset').click();
    await page.locator('.tool-contracts > summary').click(); assert.equal(await page.locator('#tool-contract-list h3').count(), 3);
    await page.locator('.tool-source > summary').click(); assert.equal(await page.locator('.tool-source tbody tr').count(), 6);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(';')}`), [], `tool axe ${width} ${theme}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(await page.evaluate(() => window.toolPrivateReads), []); assert.deepEqual(await page.evaluate(() => window.toolPrivateWrites), []);
    assert.ok(requests.every((r) => r.method === 'GET' && r.url.startsWith(new URL(base).origin) && !r.url.includes('TOOL_PRIVATE_SENTINEL')));
    assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    await context.close();
  }

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const noPage = await nojs.newPage(); await noPage.goto(base + '/playground/tool-calling/');
  assert.ok(await noPage.locator('#tool-call').isDisabled()); assert.ok(await noPage.locator('#tool-export').isDisabled());
  await noPage.locator('.tool-source > summary').click(); assert.equal(await noPage.locator('.tool-source tbody tr:visible').count(), 6);
  assert.match(await noPage.locator('main').innerText(), /不是 WGS84 椭球测地线/);
  assert.ok(await noPage.getByRole('link', { name: '先读原理', exact: true }).isVisible()); await nojs.close();

  const broken = await browser.newContext(); const brokenPage = await broken.newPage();
  await brokenPage.route('**/playground/tool-calling/', async (route) => {
    const response = await route.fetch(); const body = (await response.text()).replace(/<div data-tool-catalog hidden>[\s\S]*?<\/div>/, '<div data-tool-catalog hidden>invalid</div>');
    await route.fulfill({ response, body });
  });
  await brokenPage.goto(base + '/playground/tool-calling/');
  await brokenPage.waitForFunction(() => document.getElementById('tool-status').textContent.includes('无法校验'));
  assert.ok(await brokenPage.locator('#tool-call').isDisabled()); await broken.close();

  const bridge = await browser.newContext({ acceptDownloads: true });
  const oldIds = ['python-values', 'rss-records', 'source-evidence', 'mercator-assumptions', 'map-provenance',
    'copy-relations', 'lifetime-boundaries', 'individual-collective', 'pure-equilibrium', 'classification-denominators',
    'spatial-holdout', 'evaluation-evidence', 'ai-version-scope', 'economy-denominators', 'policy-status'];
  const oldBackup = { version: 1, entries: Object.fromEntries(oldIds.map((id) => [id, { completed: true, note: `Original fifteen: ${id}` }])) };
  const oldText = JSON.stringify(oldBackup, null, 2);
  await bridge.addInitScript(({ key, text }) => { if (localStorage.getItem(key) === null) localStorage.setItem(key, text); }, { key: learningKey, text: oldText });
  const bridgePage = await bridge.newPage(); await bridgePage.goto(base + '/study/practice/');
  await bridgePage.waitForFunction(() => document.querySelector('[data-practice-workspace]')?.dataset.practiceReady === 'true');
  assert.equal(await bridgePage.locator('[data-learning-step]:visible').getAttribute('id'), 'tool-contract');
  assert.equal(await bridgePage.evaluate((key) => localStorage.getItem(key), learningKey), oldText, 'fifteen-record opening never rewrites');
  const [oldDownload] = await Promise.all([bridgePage.waitForEvent('download'), bridgePage.locator('#learning-export').click()]);
  assert.deepEqual(JSON.parse(await readFile(await oldDownload.path(), 'utf8')), oldBackup);
  await bridgePage.goto(base + '/explore/ai/');
  await bridgePage.getByRole('link', { name: '亲手执行一次工具调用', exact: true }).click();
  await bridgePage.waitForFunction(() => !document.getElementById('tool-controls').disabled); await finish(bridgePage);
  await bridgePage.getByRole('link', { name: '用自己的话解释一次', exact: true }).click();
  await bridgePage.waitForFunction(() => document.querySelector('[data-practice-workspace]')?.dataset.practiceReady === 'true');
  const activeStep = bridgePage.locator('[data-learning-step]:visible');
  assert.equal(await activeStep.getAttribute('id'), 'tool-observation');
  assert.equal(await bridgePage.evaluate((key) => localStorage.getItem(key), learningKey), oldText, 'lab visits do not record learning');
  await activeStep.locator('textarea').fill('回执匹配是调用的一致性，不是现实资料核验。');
  const extended = JSON.parse(await bridgePage.evaluate((key) => localStorage.getItem(key), learningKey));
  for (const id of oldIds) assert.deepEqual(extended.entries[id], oldBackup.entries[id]);
  assert.equal(extended.entries['tool-observation'].completed, false);
  assert.equal(extended.entries['tool-contract'], undefined, 'unfinished steps are not fabricated');
  await bridge.close();

  const normal = await browser.newContext({ viewport: { width: 390, height: 700 }, reducedMotion: 'no-preference', acceptDownloads: true });
  const normalPage = await normal.newPage(); await load(normalPage);
  await normalPage.keyboard.press('Tab'); await normalPage.keyboard.press('Enter');
  assert.equal(await normalPage.evaluate(() => document.activeElement.id), 'main', 'native skip link remains functional');
  await normalPage.locator('#tool-call').focus(); await normalPage.keyboard.press('Tab');
  assert.equal(await normalPage.evaluate(() => document.activeElement.id), 'tool-next');
  await normalPage.keyboard.press('Enter'); await normalPage.keyboard.press('Enter');
  await normalPage.waitForFunction(() => document.getElementById('tool-result').getAnimations().length > 0);
  await normalPage.evaluate(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    window.toolMotionChanged = media.matches;
    media.addEventListener('change', () => { window.toolMotionChanged = media.matches; });
  });
  await normalPage.emulateMedia({ reducedMotion: 'reduce' });
  await normalPage.waitForFunction(() => window.toolMotionChanged && document.getElementById('tool-result').getAnimations().length === 0);
  await normalPage.locator('#tool-result-jump').click(); assert.equal(await normalPage.evaluate(() => document.activeElement.id), 'tool-result-title');
  for (const viewport of [{ width: 320, height: 640 }, { width: 768, height: 390 }]) {
    await normalPage.setViewportSize(viewport); assert.ok(await normalPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await normalPage.setViewportSize({ width: 390, height: 900 });
  await normalPage.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  assert.ok(await normalPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '200% DOM text scaling');
  await normal.close();
  console.log('PASS Tool Calling: 390/768/1440 × themes, independent distance oracle, execution stages, raw-radius/empty search, invalid/unknown/mismatched cases, stale-state guard, actual complete download, no private reads/writes/network, keyboard, axe, reduced-motion change, 320/short/200% text, no-JS and invalid catalog');
} finally { await browser.close(); }
