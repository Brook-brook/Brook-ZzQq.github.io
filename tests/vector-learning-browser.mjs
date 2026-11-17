import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { expectedLearningIds } from './expected-learning.mjs';
import { expectNativeHorizontalScroll } from './native-scroll.mjs';

const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const prefix = new URL(base).pathname.replace(/\/$/, '');
const shots = process.env.VECTOR_LEARNING_SHOT_DIR || 'work/vector-learning';
const key = 'brooks-universe.learning.v1';
const legacyRaw = await readFile('tests/fixtures/learning-v1-49.json', 'utf8');
const legacy = JSON.parse(legacyRaw), current = await expectedLearningIds();
const added = ['vector-representation', 'vector-cosine', 'vector-fit-snapshot', 'vector-evidence'];
assert.deepEqual(current.steps.slice(0, 49), Object.keys(legacy.entries), 'the frozen49 permanent IDs retain their order');
assert.deepEqual(current.steps.slice(49), added);
const manifest = JSON.parse(await readFile('assets/examples/retrieval-vectors.manifest.json', 'utf8'));
const vectorCore = (await readFile('_includes/retrieval-vectors/vectors.py', 'utf8')).trim();
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const accesses = [], errors = [], requests = [], missing = [];
    await context.exposeFunction('vectorLearningAccess', name => accesses.push(name));
    await context.addInitScript(({ key, legacyRaw, theme }) => {
      localStorage.setItem('atlas-theme', theme); localStorage.setItem(key, legacyRaw);
      for (const method of ['getItem', 'setItem', 'removeItem']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (name, ...rest) {
          if ([key, 'brooks-universe.observatory.v1'].includes(name)) window.vectorLearningAccess(method + ':' + name);
          return original.call(this, name, ...rest);
        };
      }
    }, { key, legacyRaw, theme });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => requests.push({ method: request.method(), url: request.url() }));
    page.on('response', response => { if (response.status() >= 400) missing.push(response.url()); });
    await page.goto(base + '/study/ai/');
    await page.getByRole('link', { name: '逐项计算TF-IDF与余弦', exact: true }).click();
    await page.waitForURL(base + '/playground/vector-retrieval/');
    assert.ok(await page.locator('#vector-run').isEnabled());
    await page.goto(base + '/study/ai-foundations/');
    const topic = page.locator('[data-foundation-topic="language-representation"]');
    assert.equal(await topic.getAttribute('data-foundation-state'), 'practice');
    assert.equal(await topic.getByRole('link', { name: '拆开向量检索分数', exact: true }).getAttribute('href'), prefix + '/playground/vector-retrieval/');
    assert.equal(await page.locator('[data-foundation-state="planned"]').count(), 4, 'unbuilt topics remain honest gaps');

    for (const slug of ['lexical-vector-foundations', 'retrieval-index-boundaries']) {
      await page.goto(base + `/knowledge/${slug}/`);
      assert.ok(await page.locator('.note-main h1').isVisible());
      assert.equal(await page.locator('[data-note-question]').count(), 2, 'two authored angles per new note');
      assert.equal(await page.locator('.note-end a').filter({ hasText: '打开对应实验' }).getAttribute('href'), prefix + '/playground/vector-retrieval/');
      if (slug === 'lexical-vector-foundations') {
        const link = page.getByRole('link', { name: '下载向量练习', exact: true });
        assert.ok(await link.evaluate(node => node.getBoundingClientRect().bottom <= innerHeight), 'the real project action is visible in the initial viewport');
        const waiting = page.waitForEvent('download'); await link.click();
        const file = await waiting, bytes = await readFile(await file.path());
        assert.equal(file.suggestedFilename(), 'brook-retrieval-vectors.zip');
        assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.archive.sha256);
        assert.equal(bytes.length, manifest.archive.bytes);
        await page.getByRole('link', { name: '预选词项向量的Python实验', exact: true }).click();
        await page.waitForURL(base + '/playground/python/#lexical-vectors');
        assert.equal(await page.locator('#python-example').inputValue(), 'vectors');
        assert.ok((await page.locator('#python-code').inputValue()).includes(vectorCore), 'the safely rendered preset shares the canonical core');
        assert.ok(await page.locator('#python-load').isEnabled()); assert.ok(await page.locator('#python-run').isDisabled());
        assert.equal(await page.locator('#python-example option').count(), 7, 'all six older sources remain alongside the seventh');
        await page.locator('#python-code').fill('print("synthetic local draft")'); await page.locator('#python-reset').click();
        assert.ok((await page.locator('#python-code').inputValue()).includes(vectorCore));
        await page.goBack();
      }
      assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `${shots}/${slug}-${width}-${theme}.png`, fullPage: true });
      await page.locator('.note-end a').filter({ hasText: '打开对应实验' }).click();
      await page.waitForURL(base + '/playground/vector-retrieval/');
      assert.ok(await page.locator('#vector-run').isEnabled());
    }
    await page.goto(base + '/search/');
    await page.locator('[data-open-site-search]').click();
    await page.locator('#site-search-query').fill('TF-IDF');
    const dialog = page.locator('[data-site-search-dialog]');
    await dialog.locator('[data-search-kind="lab"]').click();
    assert.equal(await dialog.getByRole('link', { name: '向量检索与词项实验', exact: true }).getAttribute('href'), prefix + '/playground/vector-retrieval/');
    assert.deepEqual(accesses, []); assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    assert.ok(requests.every(request => request.method === 'GET' && new URL(request.url).origin === new URL(base).origin), 'public reading and search create no runtime requests or network writes');
    await context.close();
  }

  for (const route of ['paths', 'practice']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    await context.addInitScript(({ key, legacyRaw }) => { if (localStorage.getItem(key) === null) localStorage.setItem(key, legacyRaw); }, { key, legacyRaw });
    const page = await context.newPage(); await page.goto(base + `/study/${route}/#vector-representation`);
    await page.waitForFunction(() => !document.getElementById('learning-export').closest('[hidden]'));
    assert.deepEqual(await page.locator('[data-learning-step]').evaluateAll(nodes => nodes.map(node => node.dataset.learningStep)), current.steps);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), legacyRaw, 'opening retains exact historical49 bytes');
    let waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    assert.deepEqual(JSON.parse(await readFile(await (await waiting).path(), 'utf8')), legacy);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), legacyRaw, 'backup does not rewrite old records');
    for (const id of added) {
      await page.goto(base + `/study/${route}/#${id}`);
      const step = page.locator(`[data-learning-step="${id}"]`); await step.waitFor({ state: 'visible' });
      if (route === 'paths') await step.locator('.learning-entry summary').click();
      await step.locator('textarea').fill(`Synthetic explicit vector ${id}: <literal> 🪻`);
      await step.locator('[data-step-complete]').check();
    }
    waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    const extended = JSON.parse(await readFile(await (await waiting).path(), 'utf8'));
    assert.equal(Object.keys(extended.entries).length, 53);
    for (const [id, entry] of Object.entries(legacy.entries)) assert.deepEqual(extended.entries[id], entry);
    for (const id of added) assert.deepEqual(extended.entries[id], { completed: true, note: `Synthetic explicit vector ${id}: <literal> 🪻` });
    await context.close();
  }

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 } });
  const page = await nojs.newPage(); await page.goto(base + '/knowledge/lexical-vector-foundations/');
  assert.ok(await page.getByRole('link', { name: '下载向量练习', exact: true }).isVisible());
  const code = page.getByRole('group', { name: '代码，可横向滚动', exact: true }).first();
  await expectNativeHorizontalScroll(page, code);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${shots}/no-js-320.png`, fullPage: true });
  await page.goto(base + '/study/paths/');
  assert.equal(await page.locator('#retrieval-vectors [data-learning-step]:visible').count(), 4);
  await nojs.close();

  const large = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce' });
  const largePage = await large.newPage();
  for (const slug of ['lexical-vector-foundations', 'retrieval-index-boundaries']) {
    await largePage.goto(base + `/knowledge/${slug}/`);
    const before = await largePage.locator('.prose p').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize));
    await largePage.evaluate(() => {
      const fonts = [...document.querySelectorAll('.prose, .prose *')].map(node => [node, parseFloat(getComputedStyle(node).fontSize)]);
      document.documentElement.style.fontSize = '32px';
      for (const [node, size] of fonts) node.style.setProperty('font-size', size * 2 + 'px', 'important');
    });
    assert.equal(await largePage.locator('.prose p').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize)), before * 2);
    assert.ok(await largePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await largePage.screenshot({ path: `${shots}/${slug}-actual-double-text-320.png`, fullPage: true });
  }
  await large.close();
  console.log('PASS vector learning: two actual notes/native lab actions, exact10-entry ZIP download/hash, native AI/foundations/search entry,390/768/1440×themes and axe; exact old49 raw/export plus four explicit additions on paths/practice, no-JS/320 native code scrolling and actual computed-font doubling; public pages never access private stores or start a runtime. DOM scaling is not full browser zoom.');
} finally { await browser.close(); }
