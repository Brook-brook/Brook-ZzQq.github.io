import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { expectedLearningIds } from './expected-learning.mjs';

const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const prefix = new URL(base).pathname.replace(/\/$/, '');
const shots = process.env.FOUNDATIONS_SHOT_DIR || 'work/ai-foundations';
const journalKey = 'brooks-universe.learning.v1', legacyRaw = await readFile('tests/fixtures/learning-v1-44.json', 'utf8');
const legacy = JSON.parse(legacyRaw), current = await expectedLearningIds();
const newIds = ['ml-feature-target', 'ml-gradient-update', 'ml-learning-rate', 'ml-validation-split', 'neural-chain-rule'];
assert.deepEqual(current.steps.slice(0, 44), Object.keys(legacy.entries), 'the fixed historical44 keep their exact order');
assert.deepEqual(current.steps.slice(44, 49), newIds);
const manifest = JSON.parse(await readFile('assets/examples/linear-regression-starter.manifest.json', 'utf8'));
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const accesses = [], errors = [], requests = [], missing = [];
    await context.exposeFunction('foundationPrivateAccess', (name) => accesses.push(name));
    await context.addInitScript(({ theme, journalKey, legacyRaw }) => {
      localStorage.setItem('atlas-theme', theme); localStorage.setItem(journalKey, legacyRaw);
      for (const method of ['getItem', 'setItem', 'removeItem']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (key, ...rest) {
          if ([journalKey, 'brooks-universe.observatory.v1'].includes(key)) window.foundationPrivateAccess(method + ':' + key);
          return original.call(this, key, ...rest);
        };
      }
    }, { theme, journalKey, legacyRaw });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    page.on('response', (response) => { if (response.status() >= 400) missing.push(response.url()); });
    await page.goto(base + '/study/ai/');
    await page.getByRole('link', { name: '补机器学习基础', exact: true }).click();
    await page.waitForURL(base + '/study/ai-foundations/');
    assert.equal(await page.locator('[data-foundation-topic]').count(), 13);
    assert.equal(await page.locator('[data-foundation-state="planned"]').count(), 4);
    assert.equal(await page.locator('[data-foundation-state="planned"] a').count(), 0, 'gaps do not advertise unimplemented resources');
    assert.equal(await page.locator('.foundations-section').count(), 4);
    assert.ok(await page.locator('.foundations-page a').evaluateAll((nodes) => nodes.every((node) => new URL(node.href).origin === location.origin && new URL(node.href).pathname.startsWith(location.pathname.split('/study/')[0] + '/'))));
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${shots}/map-${width}-${theme}.png`, fullPage: true });
    const topic = page.locator('[data-foundation-topic="regression-classification"]');
    await topic.getByRole('link', { name: '逐步训练一条直线', exact: true }).click();
    await page.waitForURL(base + '/playground/linear-regression/');
    await page.locator('#gradient-step').waitFor({ state: 'visible' });
    assert.ok(await page.locator('#gradient-step').isEnabled());
    for (const slug of ['ml-task-loss', 'linear-regression-gradient']) {
      await page.goto(base + `/knowledge/${slug}/`);
      assert.ok(await page.locator('.note-main h1').isVisible());
      assert.ok(await page.locator('.note-end a').filter({ hasText: '打开对应实验' }).isVisible());
      assert.equal(await page.locator('.note-end a').filter({ hasText: '打开对应实验' }).getAttribute('href'), prefix + '/playground/linear-regression/');
      assert.equal(await page.locator('[data-note-question]').count(), 2, 'two distinct authored self-explanation angles');
      assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `${shots}/${slug}-${width}-${theme}.png` });
      if (slug === 'linear-regression-gradient') {
        const waiting = page.waitForEvent('download'); await page.getByRole('link', { name: '下载原创梯度练习', exact: true }).click();
        const download = await waiting, bytes = await readFile(await download.path());
        assert.equal(download.suggestedFilename(), 'brook-linear-regression.zip');
        assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.archive.sha256);
        assert.equal(bytes.length, manifest.archive.bytes);
      }
    }
    assert.deepEqual(accesses, []); assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    assert.ok(requests.every((r) => r.method === 'GET' && new URL(r.url).origin === new URL(base).origin), 'reading starts no interpreter, network write or private index');
    await context.close();
  }

  for (const route of ['paths', 'practice']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    await context.addInitScript(({ journalKey, legacyRaw }) => { if (localStorage.getItem(journalKey) === null) localStorage.setItem(journalKey, legacyRaw); }, { journalKey, legacyRaw });
    const page = await context.newPage(); await page.goto(base + `/study/${route}/#ml-feature-target`);
    await page.waitForFunction(() => !document.getElementById('learning-export').closest('[hidden]'));
    assert.deepEqual(await page.locator('[data-learning-step]').evaluateAll((nodes) => nodes.map((node) => node.dataset.learningStep)), current.steps);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), journalKey), legacyRaw, 'opening preserves all44 original raw bytes');
    let waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    assert.deepEqual(JSON.parse(await readFile(await (await waiting).path(), 'utf8')), legacy);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), journalKey), legacyRaw, 'export does not rewrite the historical record');
    for (const id of newIds) {
      await page.goto(base + `/study/${route}/#${id}`);
      const step = page.locator(`[data-learning-step="${id}"]`); await step.waitFor({ state: 'visible' });
      if (route === 'paths') await step.locator('.learning-entry summary').click();
      await step.locator('textarea').fill(`Synthetic explicit foundation ${id}: <literal> 🪻`);
      await step.locator('[data-step-complete]').check();
    }
    waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    const extended = JSON.parse(await readFile(await (await waiting).path(), 'utf8'));
    assert.equal(Object.keys(extended.entries).length, 49);
    for (const [id, record] of Object.entries(legacy.entries)) assert.deepEqual(extended.entries[id], record);
    for (const id of newIds) assert.deepEqual(extended.entries[id], { completed: true, note: `Synthetic explicit foundation ${id}: <literal> 🪻` });
    await context.close();
  }

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 } });
  const page = await nojs.newPage(); await page.goto(base + '/study/ai-foundations/');
  assert.equal(await page.locator('[data-foundation-topic]:visible').count(), 13);
  assert.ok(await page.getByRole('link', { name: '从一条直线开始', exact: true }).isVisible());
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${shots}/map-no-js-320.png`, fullPage: true });
  await page.goto(base + '/knowledge/linear-regression-gradient/');
  assert.ok(await page.getByRole('link', { name: '下载原创梯度练习', exact: true }).isVisible());
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await nojs.close();
  const large = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce' });
  const largePage = await large.newPage(); await largePage.goto(base + '/study/ai-foundations/');
  await largePage.evaluate(() => document.documentElement.style.fontSize = '32px');
  assert.ok(await largePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.equal(await largePage.locator('.foundations-detail p').first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize)), 32);
  await largePage.screenshot({ path: `${shots}/map-double-text-320.png`, fullPage: true }); await large.close();
  console.log('PASS foundations: actual13-topic/four-gap native map, two connected notes, exact ZIP download,390/768/1440×themes, axe/no-JS/320/doubled DOM text; original44 raw/export and five explicit additions preserve v1 on both worksheets; no private reads or implicit completion.');
} finally { await browser.close(); }
