import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { advanceGradientRun, createGradientRun, gradientReport } from '../assets/js/atlas/gradient-models.js';
import { expectNativeHorizontalScroll } from './native-scroll.mjs';

const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.GRADIENT_SHOT_DIR || 'work/gradient';
const data = JSON.parse(await readFile('_data/gradient_samples.json', 'utf8'));
const lab = base + '/playground/linear-regression/';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
async function download(page) {
  const waiting = page.waitForEvent('download'); await page.locator('#gradient-export').click();
  const file = await waiting; assert.equal(file.suggestedFilename(), 'brook-gradient-record.json');
  return JSON.parse(await readFile(await file.path(), 'utf8'));
}
async function reset(page, w = '0', b = '0') {
  if (await page.locator('.gradient-start').getAttribute('open') === null) await page.locator('.gradient-start > summary').click();
  await page.locator('#gradient-start-w').fill(w); await page.locator('#gradient-start-b').fill(b);
  await page.locator('#gradient-reset').click();
}
async function chartLabelsKeepTheirSize(page) {
  const sizes = await page.locator('.gradient-chart text').evaluateAll((nodes) => nodes.map((node) => ({
    font: parseFloat(getComputedStyle(node).fontSize), effective: parseFloat(getComputedStyle(node).fontSize) * node.getScreenCTM().a
  })));
  assert.ok(sizes.length >= 10);
  assert.ok(sizes.every((n) => n.effective >= 13.99 && Math.abs(n.effective - n.font) < 0.05), 'responsive charts preserve real text size rather than shrinking a desktop viewBox');
}
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const privateAccess = [], requests = [], errors = [], missing = [];
    await context.exposeFunction('gradientPrivateAccess', (name) => privateAccess.push(name));
    await context.addInitScript((theme) => {
      localStorage.setItem('atlas-theme', theme);
      for (const method of ['getItem', 'setItem', 'removeItem']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (key, ...rest) {
          if (['brooks-universe.learning.v1', 'brooks-universe.observatory.v1'].includes(key)) window.gradientPrivateAccess(method + ':' + key);
          return original.call(this, key, ...rest);
        };
      }
    }, theme);
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    page.on('response', (response) => { if (response.status() >= 400) missing.push(response.url()); });
    await page.goto(lab); await page.locator('#gradient-step').waitFor({ state: 'visible' });
    assert.ok(await page.locator('#gradient-step').isEnabled());
    let expected = createGradientRun(data);
    assert.deepEqual(await download(page), gradientReport(expected));
    await page.locator('#gradient-step').click(); expected = advanceGradientRun(expected, 0.05);
    assert.equal(await page.locator('#gradient-w').innerText(), '1.485');
    assert.equal(await page.locator('#gradient-b').innerText(), '0.10625');
    assert.deepEqual(await download(page), gradientReport(expected));
    assert.equal(await page.locator('#gradient-fit-chart .gradient-train-mark').count(), 8);
    assert.equal(await page.locator('#gradient-fit-chart .gradient-validation-mark').count(), 4);
    await chartLabelsKeepTheirSize(page);
    const legend = await page.locator('.gradient-legend span').evaluateAll((nodes) => nodes.map((node) => ({
      width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height,
      svg: node.querySelector('svg').getBoundingClientRect().width
    })));
    assert.ok(legend.every((r) => r.width > r.height && r.svg <= 17), 'legacy SVG rules do not stretch icons or force vertical legend text');
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${shots}/first-${width}-${theme}.png`, fullPage: true });
    await page.locator('#gradient-ten').click(); expected = advanceGradientRun(expected, 0.05, 10);
    await page.locator('#gradient-rate').fill('0.08'); await page.locator('#gradient-step').click(); expected = advanceGradientRun(expected, 0.08);
    assert.deepEqual(await download(page), gradientReport(expected));
    await page.locator('#gradient-reference').check();
    assert.equal(await page.locator('#gradient-fit-chart .gradient-reference-line').count(), 1);
    assert.deepEqual(await download(page), gradientReport(expected), 'reference display is not another training step');
    await page.getByText('拆开一个样本，看看误差从哪来', { exact: true }).click();
    await page.locator('#gradient-sample').selectOption('v-01');
    assert.match(await page.locator('#gradient-sample-contribution').innerText(), /不贡献训练梯度/);
    assert.equal(await page.locator('#gradient-fit-chart .gradient-selected-mark').count(), 1);
    assert.equal(await page.locator('#gradient-fit-chart .gradient-residual-guide').count(), 1);
    assert.deepEqual(await download(page), gradientReport(expected), 'selecting a validation observation does not train, relabel or alter the export');
    await page.locator('#gradient-sample').focus(); await page.locator('#gradient-sample').selectOption('t-01');
    assert.match(await page.locator('#gradient-sample-contribution').innerText(), /累加全部8点/);
    assert.ok(await page.locator('#gradient-sample').evaluate((node) => node === document.activeElement));
    await page.screenshot({ path: `${shots}/sample-${width}-${theme}.png`, fullPage: true });
    await page.locator('#gradient-plot-jump').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'gradient-plots');
    await page.locator('#gradient-action-jump').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'gradient-action-title');

    await page.locator('#gradient-rate').fill('');
    assert.ok(await page.locator('#gradient-step').isDisabled());
    assert.equal(await page.locator('#gradient-rate').getAttribute('aria-invalid'), 'true');
    assert.ok(await page.locator('#gradient-input-message').isVisible());
    assert.deepEqual(await download(page), gradientReport(expected), 'invalid future draft leaves all applied evidence exportable');
    await page.locator('#gradient-rate').fill('0.7'); assert.ok(await page.locator('#gradient-ten').isDisabled());
    await page.locator('#gradient-rate').fill('0.05');
    await page.locator('.gradient-start > summary').click();
    await page.locator('#gradient-start-w').fill('11');
    assert.ok(await page.locator('#gradient-reset').isDisabled());
    assert.deepEqual(await download(page), gradientReport(expected), 'invalid initial draft is not exported as executed state');
    await reset(page, '4', '-1'); expected = createGradientRun(data, { w: 4, b: -1 });
    assert.deepEqual(await download(page), gradientReport(expected));
    await reset(page); await page.locator('#gradient-rate').fill('0.5'); await page.locator('#gradient-ten').click();
    const guarded = await download(page);
    assert.equal(guarded.run.stop, 'numeric_limit');
    assert.ok(guarded.run.rejected.iteration > guarded.run.history.at(-1).iteration);
    assert.ok(await page.locator('#gradient-step').isDisabled());
    // Restore a fresh budget run; downloads remain independent from the worksheet.
    await reset(page); await page.locator('#gradient-rate').fill('0.05');
    for (let i = 0; i < 12; i++) await page.locator('#gradient-ten').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'gradient-status', 'a button becoming disabled transfers focus to its real stop status');
    const budget = await download(page);
    assert.equal(budget.run.stop, 'update_budget'); assert.equal(budget.run.history.length, 121);
    assert.equal(budget.run.rejected, null); assert.ok(await page.locator('#gradient-ten').isDisabled());
    assert.equal(await page.locator('#gradient-history tr').count(), 121);
    await page.getByText('每一步实际发生了什么', { exact: true }).click();
    const table = page.getByRole('group', { name: '完整训练步骤，可横向滚动', exact: true });
    await table.focus();
    if (width === 390) { await page.keyboard.press('ArrowRight'); await page.waitForFunction(() => document.querySelector('.gradient-scroll').scrollLeft > 0); }
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.deepEqual(privateAccess, []); assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    assert.ok(requests.every((r) => r.method === 'GET' && new URL(r.url).origin === new URL(base).origin), 'real linear training remains local and does not request a model, interpreter or private source');
    assert.equal(await page.locator('#gradient-values').evaluate((node) => node.getAnimations().length), 0, 'reduced motion disables numerical settle feedback');
    await context.close();
  }

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 } });
  const page = await nojs.newPage(); await page.goto(lab);
  assert.equal(await page.locator('#gradient-lab button:enabled').count(), 0);
  assert.ok(await page.locator('#gradient-reference').isDisabled());
  await page.getByText('原始样本与当前残差', { exact: true }).click();
  assert.equal(await page.locator('#gradient-samples tr:visible').count(), 12);
  const sampleTable = page.getByRole('group', { name: '12个原始教学样本和残差，可横向滚动', exact: true });
  await expectNativeHorizontalScroll(page, sampleTable);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${shots}/no-js-320.png`, fullPage: true }); await nojs.close();

  const large = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce' });
  const largePage = await large.newPage(); await largePage.goto(lab);
  await largePage.evaluate(() => document.documentElement.style.fontSize = '32px');
  await largePage.waitForFunction(() => Math.abs(document.querySelector('#gradient-fit-chart').viewBox.baseVal.width - document.querySelector('#gradient-fit-chart').clientWidth) < 1);
  await chartLabelsKeepTheirSize(largePage);
  assert.ok(await largePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await largePage.screenshot({ path: `${shots}/double-text-320.png`, fullPage: true }); await large.close();

  const motion = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' });
  const motionPage = await motion.newPage(); await motionPage.goto(lab);
  const active = await motionPage.evaluate(() => { document.querySelector('#gradient-step').click(); return document.querySelector('#gradient-values').getAnimations().length; });
  assert.ok(active > 0, 'an actual update has finite settle feedback');
  await motionPage.emulateMedia({ reducedMotion: 'reduce' });
  await motionPage.waitForFunction(() => document.querySelector('#gradient-values').getAnimations().length === 0);
  assert.ok(await motionPage.locator('#gradient-step').evaluate((node) => node.getBoundingClientRect().bottom <= innerHeight), 'the primary update is visible at1280×800');
  await motionPage.screenshot({ path: `${shots}/desktop-fold-1280.png` }); await motion.close();

  for (const mode of ['malformed', 'oversize', 'no-resize-observer']) {
    const context = await browser.newContext();
    if (mode === 'no-resize-observer') await context.addInitScript(() => { window.ResizeObserver = undefined; });
    else await context.route('**/playground/linear-regression/', async (route) => {
      const response = await route.fetch(); let html = await response.text();
      html = html.replace(/(<script type="application\/json" id="gradient-data">)[\s\S]*?(<\/script>)/, (_, before, after) => before + (mode === 'oversize' ? ' '.repeat(16001) : '{}') + after);
      await route.fulfill({ response, body: html });
    });
    const page = await context.newPage(); await page.goto(lab);
    if (mode === 'no-resize-observer') { await page.locator('#gradient-step').click(); assert.equal(await page.locator('#gradient-w').innerText(), '1.485'); }
    else { assert.ok(await page.locator('#gradient-step').isDisabled()); assert.ok(await page.locator('#gradient-export').isDisabled()); assert.ok(await page.locator('#gradient-reference').isDisabled()); assert.match(await page.locator('#gradient-status').innerText(), /未执行训练/); }
    await context.close();
  }
  console.log('PASS gradient: actual start/one/ten/mixed/reset, full exports without drafts, training/validation/reference, numeric/budget stops and focus, semantic scroll tables,390/768/1440×themes, axe/no-JS/320/doubled DOM text, live reduced-motion cancellation and malformed-data/ResizeObserver fallbacks; no private access or external model.');
} finally { await browser.close(); }
