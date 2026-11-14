import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { expectedLearningIds } from './expected-learning.mjs';

const expected = await expectedLearningIds();
const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.AGENT_BRIDGE_SHOT_DIR || 'work/agent-bridge';
await mkdir(shots, { recursive: true });
const key = 'brooks-universe.learning.v1';
// Fixed historical backup, never inferred from the current ID set.
const oldIds = ['python-values', 'rss-records', 'source-evidence', 'mercator-assumptions', 'map-provenance', 'copy-relations', 'lifetime-boundaries', 'individual-collective', 'pure-equilibrium', 'classification-denominators', 'spatial-holdout', 'evaluation-evidence', 'ai-version-scope', 'economy-denominators', 'policy-status', 'tool-contract', 'tool-observation', 'tool-boundaries', 'public-goods-incentives', 'public-goods-boundaries', 'ai-model-boundaries', 'ai-request-failures', 'ai-output-contract', 'ai-task-evaluation', 'agent-control-loop', 'agent-context-evidence', 'agent-permission-boundaries', 'agent-trace-evaluation', 'agent-build-project', 'agent-build-adapter', 'agent-build-budgets', 'agent-build-acceptance', 'agent-mcp-discovery', 'agent-mcp-validation'];
const prior = { version: 1, entries: Object.fromEntries(oldIds.map((id, i) => [id, { completed: true, note: `Original34 ${i}: <literal> 🪻` }])) }, raw = JSON.stringify(prior);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const accesses = [], requests = [], errors = [], missing = [];
    await context.exposeFunction('bridgePrivateAccess', (name) => accesses.push(name));
    await context.addInitScript(({ key, raw, theme }) => {
      localStorage.setItem('atlas-theme', theme); localStorage.setItem(key, raw);
      for (const method of ['getItem', 'setItem', 'removeItem']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (name, ...rest) {
          if ([key, 'brooks-universe.observatory.v1'].includes(name)) window.bridgePrivateAccess(method + ':' + name);
          return original.call(this, name, ...rest);
        };
      }
    }, { key, raw, theme });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    page.on('response', (response) => { if (response.url().startsWith(base) && response.status() >= 400) missing.push(response.url()); });
    await page.goto(base + '/study/ai/');
    const sequence = page.getByRole('list', { name: '三个可运行的搭建练习' });
    assert.equal(await sequence.locator('li').count(), 3);
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    await page.locator('#agent-workshop').evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.screenshot({ path: `${shots}/workshop-${width}-${theme}.png` });
    await page.getByRole('link', { name: '用宿主连接两端', exact: true }).focus(); await page.keyboard.press('Enter');
    await page.waitForURL(base + '/knowledge/agent-mcp-bridge/');
    assert.match(await page.locator('[data-note-download]').innerText(), /Python 3.11/);
    assert.ok(await page.locator('[data-note-download] a').evaluate((node) => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
    const waiting = page.waitForEvent('download');
    await page.getByRole('link', { name: '下载原创 Agent × MCP 连接练习', exact: true }).click();
    const download = await waiting, bytes = await readFile(await download.path());
    assert.equal(download.suggestedFilename(), 'brook-agent-mcp-bridge.zip');
    const response = await page.request.get(base + '/assets/examples/agent-mcp-bridge.manifest.json');
    assert.equal(response.status(), 200); const manifest = await response.json();
    assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.archive.sha256);
    assert.equal(bytes.length, manifest.archive.bytes);
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${shots}/guide-${width}-${theme}.png`, fullPage: true });
    await page.locator('.note-practice-alternatives > summary').click();
    assert.ok(await page.locator('[data-note-question="agent-bridge-stop"]').isVisible());
    await page.locator('[data-open-site-search]').click(); await page.locator('#site-search-query').fill('MCP');
    await page.waitForFunction(() => [...document.querySelectorAll('[data-search-results] a')].some((node) => node.href.endsWith('/knowledge/agent-mcp-bridge/')));
    await page.keyboard.press('Escape');
    assert.deepEqual(accesses, []);
    assert.ok(requests.every((request) => request.method === 'GET' && new URL(request.url).origin === new URL(base).origin && !request.url.includes('Original34')));
    assert.deepEqual(errors, []); assert.deepEqual(missing, []); await context.close();
  }
  for (const route of ['paths', 'practice']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    await context.addInitScript(({ key, raw }) => { if (localStorage.getItem(key) === null) localStorage.setItem(key, raw); }, { key, raw });
    const page = await context.newPage(); await page.goto(base + `/study/${route}/#agent-bridge-envelope`);
    await page.waitForFunction(() => !document.getElementById('learning-export').closest('[hidden]'));
    assert.equal(await page.locator('[data-learning-step]').count(), expected.steps.length);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), raw);
    if (route === 'practice') await page.locator('.practice-resume-details > summary').click();
    assert.match(await page.locator('#learning-continue').getAttribute('href'), /agent-bridge-envelope/);
    assert.match(await page.locator('#learning-progress').innerText(), new RegExp('34 / ' + expected.steps.length));
    let waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    assert.deepEqual(JSON.parse(await readFile(await (await waiting).path(), 'utf8')), prior);
    const step = page.locator('[data-learning-step="agent-bridge-envelope"]');
    if (route === 'paths') await step.locator('.learning-entry summary').click();
    await step.locator('textarea').fill('宿主对应provider调用ID；协议关联由MCP SDK另行管理，不能把尝试数当执行数。');
    await step.locator('[data-step-complete]').check();
    waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    const current = JSON.parse(await readFile(await (await waiting).path(), 'utf8'));
    for (const id of oldIds) assert.deepEqual(current.entries[id], prior.entries[id]);
    assert.equal(Object.keys(current.entries).length, 35);
    assert.equal(current.entries['agent-bridge-envelope'].completed, true);
    assert.equal(Object.hasOwn(current.entries, 'agent-bridge-stop'), false);
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 } });
  const page = await context.newPage(); await page.goto(base + '/study/ai/');
  assert.equal(await page.getByRole('list', { name: '三个可运行的搭建练习' }).locator('li').count(), 3);
  await page.getByRole('link', { name: '用宿主连接两端', exact: true }).click();
  await page.locator('[data-note-download] a').focus(); assert.ok(await page.locator('[data-note-download] a').evaluate((node) => node === document.activeElement));
  await page.locator('a[href="#note-learning-questions"]').click();
  await page.locator('.note-practice-alternatives > summary').focus(); await page.keyboard.press('Enter');
  assert.ok(await page.locator('[data-note-question="agent-bridge-stop"]').isVisible());
  await page.goto(base + '/knowledge/agent-mcp-bridge/');
  const scaled = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('main, main *')], sizes = nodes.map((node) => parseFloat(getComputedStyle(node).fontSize));
    const paragraph = document.querySelector('.prose p'), before = parseFloat(getComputedStyle(paragraph).fontSize);
    nodes.forEach((node, i) => node.style.setProperty('font-size', sizes[i] * 2 + 'px', 'important'));
    const r = document.querySelector('[data-note-download] a').getBoundingClientRect();
    return { before, after: parseFloat(getComputedStyle(paragraph).fontSize), left: r.left, right: r.right, width: innerWidth, doc: document.documentElement.scrollWidth };
  });
  assert.equal(scaled.after, scaled.before * 2); assert.ok(scaled.left >= 0 && scaled.right <= scaled.width && scaled.doc <= scaled.width);
  await context.close();
  console.log(`PASS Agent–MCP bridge: native three-part workshop, actual ZIP/hash, 390/768/1440×themes, axe/keyboard/no-JS/320/actual2×text, original34 exact raw/export and explicit-only ${expected.steps.length}-step extension, no public private-store accesses/uploads`);
} finally { await browser.close(); }
