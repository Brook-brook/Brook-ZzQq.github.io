import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { expectedLearningIds } from './expected-learning.mjs';
const expected = await expectedLearningIds();
const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.ASYNC_LEARNING_SHOT_DIR || 'work/async-learning';
await mkdir(shots, { recursive: true });
const canonical = (await readFile('_includes/python-async-starter/async_wait.py', 'utf8')).trim();
const key = 'brooks-universe.learning.v1';
// Explicit old36 fixture: changing today's routes must never change this history.
const oldIds = ['python-values', 'rss-records', 'source-evidence', 'mercator-assumptions', 'map-provenance', 'copy-relations', 'lifetime-boundaries', 'individual-collective', 'pure-equilibrium', 'classification-denominators', 'spatial-holdout', 'evaluation-evidence', 'ai-version-scope', 'economy-denominators', 'policy-status', 'tool-contract', 'tool-observation', 'tool-boundaries', 'public-goods-incentives', 'public-goods-boundaries', 'ai-model-boundaries', 'ai-request-failures', 'ai-output-contract', 'ai-task-evaluation', 'agent-control-loop', 'agent-context-evidence', 'agent-permission-boundaries', 'agent-trace-evaluation', 'agent-build-project', 'agent-build-adapter', 'agent-build-budgets', 'agent-build-acceptance', 'agent-mcp-discovery', 'agent-mcp-validation', 'agent-bridge-envelope', 'agent-bridge-stop'];
const prior = { version: 1, entries: Object.fromEntries(oldIds.map((id, i) => [id, { completed: true, note: `Original36 ${i}: <literal> 🪻` }])) }, raw = JSON.stringify(prior);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const accesses = [], requests = [], errors = [];
    await context.exposeFunction('asyncPrivateAccess', (name) => accesses.push(name));
    await context.addInitScript(({ key, raw, theme }) => {
      localStorage.setItem('atlas-theme', theme); localStorage.setItem(key, raw);
      for (const method of ['getItem', 'setItem', 'removeItem']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (name, ...rest) {
          if ([key, 'brooks-universe.observatory.v1'].includes(name)) window.asyncPrivateAccess(method + ':' + name);
          return original.call(this, name, ...rest);
        };
      }
    }, { key, raw, theme });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    await page.goto(base + '/study/ai/');
    await page.getByRole('link', { name: '补一块 async / await 基础', exact: true }).click();
    await page.waitForURL(base + '/knowledge/python-async-boundaries/');
    assert.ok(await page.locator('[data-note-download] a').evaluate((node) => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
    let waiting = page.waitForEvent('download'); await page.getByRole('link', { name: '下载原创 Python 异步练习', exact: true }).click();
    const download = await waiting, bytes = await readFile(await download.path());
    assert.equal(download.suggestedFilename(), 'brook-python-async.zip');
    const manifest = await (await page.request.get(base + '/assets/examples/python-async-starter.manifest.json')).json();
    assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.archive.sha256);
    assert.equal(bytes.length, manifest.archive.bytes);
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    await page.screenshot({ path: `${shots}/guide-${width}-${theme}.png`, fullPage: true });
    await page.getByRole('link', { name: '预选异步示例的Python实验', exact: true }).click();
    await page.waitForURL(base + '/playground/python/#async-wait');
    assert.equal(await page.locator('#python-example').inputValue(), 'async');
    assert.ok((await page.locator('#python-code').inputValue()).includes(canonical), 'real rendered template preserves the same canonical source used in the ZIP');
    assert.ok(await page.locator('#python-load').isEnabled()); assert.ok(await page.locator('#python-run').isDisabled());
    for (const [id, text] of [['basics', 'Brook'], ['loops', 'def mean'], ['dict', 'Spherical Mercator'], ['async', 'asyncio.TaskGroup']]) {
      await page.selectOption('#python-example', id); assert.ok((await page.locator('#python-code').inputValue()).includes(text));
    }
    await page.locator('#python-code').fill('print("temporary edit")'); await page.locator('#python-reset').click();
    assert.ok((await page.locator('#python-code').inputValue()).includes(canonical));
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${shots}/python-${width}-${theme}.png`, fullPage: true });
    assert.deepEqual(accesses, []); assert.deepEqual(errors, []);
    assert.ok(requests.every((request) => request.method === 'GET' && new URL(request.url).origin === new URL(base).origin && !request.url.includes('Original36')), 'preset never loads a CDN, executes or uploads');
    await context.close();
  }
  for (const route of ['paths', 'practice']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    await context.addInitScript(({ key, raw }) => { if (localStorage.getItem(key) === null) localStorage.setItem(key, raw); }, { key, raw });
    const page = await context.newPage(); await page.goto(base + `/study/${route}/#async-scheduling`);
    await page.waitForFunction(() => !document.getElementById('learning-export').closest('[hidden]'));
    assert.equal(await page.locator('[data-learning-step]').count(), expected.steps.length);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), raw);
    if (route === 'practice') await page.locator('.practice-resume-details > summary').click();
    assert.match(await page.locator('#learning-continue').getAttribute('href'), /async-scheduling/);
    let waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    assert.deepEqual(JSON.parse(await readFile(await (await waiting).path(), 'utf8')), prior);
    const step = page.locator('[data-learning-step="async-scheduling"]');
    if (route === 'paths') await step.locator('.learning-entry summary').click();
    await step.locator('textarea').fill('协程调用先创建对象，Task安排执行，Event协调等待；不是CPU并行。');
    await step.locator('[data-step-complete]').check();
    waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    const current = JSON.parse(await readFile(await (await waiting).path(), 'utf8'));
    for (const id of oldIds) assert.deepEqual(current.entries[id], prior.entries[id]);
    assert.equal(Object.keys(current.entries).length, 37); assert.equal(Object.hasOwn(current.entries, 'async-cancellation'), false);
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 } });
  const page = await context.newPage(); await page.goto(base + '/knowledge/python-async-boundaries/');
  await page.locator('[data-note-download] a').focus(); assert.ok(await page.locator('[data-note-download] a').evaluate((node) => node === document.activeElement));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.goto(base + '/playground/python/'); assert.ok(await page.locator('#python-load').isDisabled());
  assert.ok(await page.locator('noscript a[href$="/knowledge/python-async-boundaries/"]').isVisible());
  await context.close();
  console.log(`PASS async learning: native preset and canonical code, no automatic CDN/load/run/private-store access, actual ZIP/hash, 390/768/1440×themes, original36 raw/export and explicit-only ${expected.steps.length}-step extension, axe/keyboard/no-JS/320; actual interpreter tested separately`);
} finally { await browser.close(); }
