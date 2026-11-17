import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { createVectorRun, vectorReport } from '../assets/js/atlas/vector-models.js';
import { expectNativeHorizontalScroll } from './native-scroll.mjs';

const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const lab = base + '/playground/vector-retrieval/';
const shots = process.env.VECTOR_SHOT_DIR || 'work/vector-retrieval';
const corpus = JSON.parse(await readFile('_data/retrieval_samples.json', 'utf8'));
const registry = JSON.parse(await readFile('_data/vector_terms.json', 'utf8'));
const defaults = { query: '保留 空间', weighting: 'tfidf', version: 'all', k: 2 };
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });

function same(expected, actual, path = 'record') {
  if (typeof expected === 'number') {
    assert.equal(typeof actual, 'number', path); assert.ok(Number.isFinite(actual));
    assert.ok(Math.abs(expected - actual) < 1e-12 * Math.max(1, Math.abs(expected)), `${path}: ${expected} vs ${actual}`);
  } else if (Array.isArray(expected)) {
    assert.ok(Array.isArray(actual), path); assert.equal(actual.length, expected.length, path);
    expected.forEach((value, i) => same(value, actual[i], `${path}[${i}]`));
  } else if (expected && typeof expected === 'object') {
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), path);
    for (const key of Object.keys(expected)) same(expected[key], actual[key], `${path}.${key}`);
  } else assert.equal(actual, expected, path);
}
async function download(page) {
  const waiting = page.waitForEvent('download'); await page.locator('#vector-export').click();
  const file = await waiting; assert.equal(file.suggestedFilename(), 'brook-vector-record.json');
  return JSON.parse(await readFile(await file.path(), 'utf8'));
}
async function apply(page, settings) {
  if (await page.locator('.vector-options').getAttribute('open') === null) await page.locator('.vector-options > summary').click();
  await page.locator('#vector-query').fill(settings.query);
  await page.locator('#vector-weighting').selectOption(settings.weighting);
  await page.locator('#vector-version').selectOption(settings.version);
  await page.locator('#vector-k').fill(String(settings.k));
  await page.locator('#vector-run').click();
}
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const privateAccess = [], requests = [], errors = [], missing = [];
    await context.exposeFunction('vectorPrivateAccess', value => privateAccess.push(value));
    await context.addInitScript(theme => {
      localStorage.setItem('atlas-theme', theme);
      localStorage.setItem('brooks-universe.learning.v1', '{"version":1,"entries":{},"private_canary":"LEARNING_PRIVATE_CANARY_31"}');
      localStorage.setItem('brooks-universe.observatory.v1', 'OBSERVE_PRIVATE_CANARY_31');
      for (const method of ['getItem', 'setItem', 'removeItem']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (key, ...rest) {
          if (['brooks-universe.learning.v1', 'brooks-universe.observatory.v1'].includes(key)) window.vectorPrivateAccess(method + ':' + key);
          return original.call(this, key, ...rest);
        };
      }
    }, theme);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => requests.push({ method: request.method(), url: request.url() }));
    page.on('response', response => { if (response.status() >= 400) missing.push(response.url()); });
    await page.goto(lab); await page.waitForFunction(() => !document.getElementById('vector-controls').disabled);
    let expected = createVectorRun(corpus, registry, defaults);
    same(vectorReport(expected), await download(page));
    assert.equal(await page.locator('#vector-results > li').count(), 2);
    assert.equal(await page.locator('#vector-contributions meter').count(), 2);
    assert.equal(await page.locator('#vector-zero-terms li').count(), 12);
    assert.equal(await page.locator('#vector-term-table tr').count(), 14);
    assert.equal(await page.locator('#vector-count-table tr').count(), 8);
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${shots}/default-${width}-${theme}.png`, fullPage: true });

    const secondId = expected.ranked_ids[1], second = page.locator(`button[data-vector-id="${secondId}"]`);
    await second.click();
    assert.equal(await second.getAttribute('aria-pressed'), 'true');
    assert.match(await page.locator('#vector-selected-source').innerText(), new RegExp(secondId));
    assert.match(await page.locator('#vector-term-caption').textContent(), new RegExp(secondId));
    if (width <= 900) assert.equal(await page.evaluate(() => document.activeElement.id), 'vector-evidence-title');
    else assert.ok(await second.evaluate(node => node === document.activeElement));
    same(vectorReport(expected), await download(page));
    await page.locator('#vector-source-link').click();
    assert.ok(await page.locator('#vector-source').evaluate(node => node.open));
    assert.equal(await page.evaluate(() => document.activeElement.id), 'vector-source-' + secondId);
    await page.locator('#vector-back-results').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'vector-results-title');
    await page.locator('#vector-input-jump').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'vector-query');

    const prior = await page.locator('#vector-applied').innerText();
    await page.locator('#vector-query').fill('预算 调用');
    assert.ok(await page.locator('#vector-export').isDisabled());
    assert.equal(await page.locator('#vector-applied').innerText(), prior, 'a draft does not rewrite the applied snapshot');
    if (await page.locator('.vector-options').getAttribute('open') === null) await page.locator('.vector-options > summary').click();
    await page.locator('#vector-k').fill('0');
    assert.ok(await page.locator('#vector-run').isDisabled()); assert.ok(await page.locator('#vector-error').isVisible());
    assert.equal(await page.locator('#vector-k').getAttribute('aria-invalid'), 'true');
    await apply(page, { ...defaults, version: 'v2' });
    expected = createVectorRun(corpus, registry, { ...defaults, version: 'v2' });
    same(vectorReport(expected), await download(page));
    assert.match(await page.locator('#vector-count-table tr').filter({ hasText: 'a-retention-old' }).textContent(), /已过滤/);
    assert.deepEqual(expected.index, createVectorRun(corpus, registry, defaults).index);
    await apply(page, { ...defaults, weighting: 'count' });
    same(vectorReport(createVectorRun(corpus, registry, { ...defaults, weighting: 'count' })), await download(page));
    await apply(page, defaults);

    await page.locator('[data-vector-query="7天"]').click();
    assert.equal(await page.locator('#vector-query').inputValue(), '7天');
    assert.ok(await page.locator('#vector-export').isDisabled());
    await page.locator('#vector-run').click();
    expected = createVectorRun(corpus, registry, { ...defaults, query: '7天' });
    same(vectorReport(expected), await download(page));
    assert.equal(await page.locator('#vector-results > li').count(), 0);
    assert.ok(await page.locator('#vector-empty').isVisible());
    assert.match(await page.locator('#vector-empty-detail').innerText(), /余弦未定义/);
    assert.equal(await page.locator('#vector-baseline-results > li').count(), 2);
    await page.screenshot({ path: `${shots}/gap-${width}-${theme}.png`, fullPage: true });
    await page.locator('#vector-recover').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'vector-query');
    assert.ok(await page.locator('#vector-export').isDisabled());
    await page.locator('#vector-run').click();
    await page.locator('[data-vector-query="保留 保留 空间"]').click();
    await page.locator('#vector-run').click();
    expected = createVectorRun(corpus, registry, { ...defaults, query: '保留 保留 空间' });
    assert.equal(expected.ranked_ids[0], 'a-retention-old');
    same(vectorReport(expected), await download(page));
    assert.match(await page.locator('#vector-results > li').first().innerText(), /v1/);

    await page.locator('#vector-query').dispatchEvent('compositionstart');
    await page.locator('#vector-query').fill('预算 调用');
    const composing = await page.locator('#vector-applied').innerText();
    await page.locator('#vector-form').dispatchEvent('submit');
    assert.equal(await page.locator('#vector-applied').innerText(), composing);
    assert.ok(await page.locator('#vector-run').isDisabled());
    await page.locator('#vector-query').dispatchEvent('compositionend');
    await page.locator('#vector-run').click();
    same(vectorReport(createVectorRun(corpus, registry, { ...defaults, query: '预算 调用' })), await download(page));
    await apply(page, { ...defaults, query: '<literal> 🪻' });
    assert.match(await page.locator('#vector-applied').innerText(), /<literal> 🪻/);
    assert.equal(await page.locator('#vector-applied literal').count(), 0);
    same(vectorReport(createVectorRun(corpus, registry, { ...defaults, query: '<literal> 🪻' })), await download(page));
    await apply(page, defaults);
    await page.locator('#vector-matrix > summary').click();
    const matrix = page.getByRole('group', { name: '完整词项计数矩阵，可横向滚动', exact: true });
    await matrix.focus();
    if (width === 390) await expectNativeHorizontalScroll(page, matrix, 'actual vector count matrix');
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.deepEqual(privateAccess, []); assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    assert.ok(requests.every(request => request.method === 'GET' && new URL(request.url).origin === new URL(base).origin));
    assert.ok(requests.every(request => !request.url.includes('CANARY') && !request.url.includes('literal')), 'query text never becomes a request or URL history');
    assert.ok(!JSON.stringify(await download(page)).includes('PRIVATE_CANARY'));
    await context.close();
  }

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 }, acceptDownloads: true });
  const native = await nojs.newPage(); await native.goto(lab);
  assert.ok(await native.locator('#vector-controls').evaluate(node => node.disabled));
  assert.ok(await native.locator('#vector-run').isDisabled());
  assert.ok(await native.locator('#vector-query').isDisabled());
  assert.ok(await native.locator('#vector-export').isDisabled()); assert.ok(await native.locator('#vector-visual').isHidden());
  assert.ok(await native.locator('#vector-matrix').isHidden());
  assert.equal(await native.locator('[id^="vector-source-"]').count(), 9, 'eight fragment headings plus one ordinary source link');
  assert.equal(await native.locator('#vector-source section section h3:visible').count(), 8);
  assert.ok(await native.getByRole('link', { name: '下载Python向量练习', exact: true }).isVisible());
  assert.ok(await native.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await native.screenshot({ path: `${shots}/no-js-320.png`, fullPage: true }); await nojs.close();

  const large = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce' });
  const largePage = await large.newPage(); await largePage.goto(lab);
  await largePage.waitForFunction(() => !document.getElementById('vector-controls').disabled);
  const sizes = await largePage.evaluate(() => {
    const nodes = [document.querySelector('.vector-page'), ...document.querySelectorAll('.vector-page *')];
    const fonts = nodes.map(node => [node, parseFloat(getComputedStyle(node).fontSize)]);
    document.documentElement.style.fontSize = '32px';
    for (const [node, font] of fonts) if (Number.isFinite(font)) node.style.setProperty('font-size', font * 2 + 'px', 'important');
    return fonts.filter(([node]) => ['vector-query', 'vector-run', 'vector-score'].includes(node.id)).map(([node, original]) => ({ original, actual: parseFloat(getComputedStyle(node).fontSize) }));
  });
  assert.ok(sizes.every(row => row.actual === row.original * 2), 'actual computed fonts double, including inherited px values');
  assert.ok(await largePage.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= innerWidth), 'the shell and its footer must fit too, not only a clipped root');
  const bars = await largePage.locator('.vector-contributions meter').evaluateAll(nodes => nodes.map(node => node.clientWidth));
  assert.ok(bars.every(width => width >= 120), 'large text keeps a meaningful bar length rather than turning contributions into dots');
  const numbers = await largePage.locator('.vector-contribution-value').evaluateAll(nodes => nodes.map(node => { const range = document.createRange(); range.selectNodeContents(node); return range.getClientRects().length; }));
  assert.ok(numbers.every(lines => lines === 1), 'decimals remain on one line');
  await largePage.screenshot({ path: `${shots}/actual-double-text-320.png`, fullPage: true });
  await large.close();

  const motion = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' });
  const motionPage = await motion.newPage(); await motionPage.goto(lab);
  const first = await motionPage.locator('#vector-run').boundingBox();
  const score = await motionPage.locator('#vector-score').boundingBox();
  assert.ok(first.y + first.height <= 800 && score.y + score.height <= 800, 'the operation and its real numerical signature share the short desktop screen');
  await motionPage.locator('#vector-query').fill('预算 调用'); await motionPage.locator('#vector-run').click();
  assert.ok(await motionPage.locator('#vector-visual').evaluate(node => node.getAnimations().length > 0));
  await motionPage.emulateMedia({ reducedMotion: 'reduce' });
  await motionPage.waitForFunction(() => document.getElementById('vector-visual').getAnimations().length === 0);
  await motion.close();

  for (const mode of ['bad-registry', 'bad-corpus', 'oversize']) {
    const context = await browser.newContext();
    await context.route(lab, async route => {
      const response = await route.fetch(); let html = await response.text();
      const id = mode === 'bad-corpus' ? 'vector-corpus-data' : 'vector-registry-data';
      html = html.replace(new RegExp('(<script type="application/json" id="' + id + '">)[\\s\\S]*?(</script>)'), (_, before, after) => before + (mode === 'oversize' ? ' '.repeat(16001) : '{}') + after);
      await route.fulfill({ response, body: html });
    });
    const page = await context.newPage(); await page.goto(lab);
    assert.ok(await page.locator('#vector-controls').evaluate(node => node.disabled)); assert.ok(await page.locator('#vector-run').isDisabled()); assert.ok(await page.locator('#vector-export').isDisabled());
    assert.match(await page.locator('#vector-status').innerText(), /未通过检查/);
    assert.ok(await page.locator('#vector-source').evaluate(node => node.open));
    await context.close();
  }
  console.log('PASS lexical vectors: actual count/TFIDF/filter/repeat/zero cases, full exports, selected-factor table and source/phone focus, drafts/invalid/composition events, same-query literal baseline,390/768/1440×themes, axe/no-JS/320/actual2x fonts and readable bars, native table keyboard, live reduced-motion and malformed-source fallback; no private storage/model/network writes. DOM scaling is not full browser zoom or OS IME.');
} finally { await browser.close(); }
