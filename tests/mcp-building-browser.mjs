import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { expectedLearningIds } from './expected-learning.mjs';

const expected = await expectedLearningIds();
const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.MCP_BUILDING_SHOT_DIR || 'work/mcp-building';
await mkdir(shots, { recursive: true });
const key = 'brooks-universe.learning.v1';
// Fixed historical fixture: do not derive an old backup from today's routes.
const oldIds = ['python-values', 'rss-records', 'source-evidence', 'mercator-assumptions', 'map-provenance', 'copy-relations', 'lifetime-boundaries', 'individual-collective', 'pure-equilibrium', 'classification-denominators', 'spatial-holdout', 'evaluation-evidence', 'ai-version-scope', 'economy-denominators', 'policy-status', 'tool-contract', 'tool-observation', 'tool-boundaries', 'public-goods-incentives', 'public-goods-boundaries', 'ai-model-boundaries', 'ai-request-failures', 'ai-output-contract', 'ai-task-evaluation', 'agent-control-loop', 'agent-context-evidence', 'agent-permission-boundaries', 'agent-trace-evaluation', 'agent-build-project', 'agent-build-adapter', 'agent-build-budgets', 'agent-build-acceptance'];
const prior = { version: 1, entries: Object.fromEntries(oldIds.map((id, i) => [id, { completed: true, note: `Original32 ${i}: <literal> 🪻` }])) };
const raw = JSON.stringify(prior), slug = '/knowledge/agent-mcp-server/';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const accesses = [];
    await context.exposeFunction('mcpPrivateAccess', (name) => accesses.push(name));
    await context.addInitScript(({ key, raw, theme }) => {
      localStorage.setItem('atlas-theme', theme); localStorage.setItem(key, raw);
      for (const method of ['getItem', 'setItem', 'removeItem']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (name, ...rest) {
          if ([key, 'brooks-universe.observatory.v1'].includes(name)) window.mcpPrivateAccess(method + ':' + name);
          return original.call(this, name, ...rest);
        };
      }
    }, { key, raw, theme });
    const page = await context.newPage(), errors = [], missing = [], requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => { if (response.url().startsWith(base) && response.status() >= 400) missing.push(response.url()); });
    page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    await page.goto(base + '/study/ai/');
    await page.getByRole('link', { name: '把工具接成本机MCP', exact: true }).click();
    await page.waitForURL(base + slug);
    assert.match(await page.locator('[data-note-download]').innerText(), /Python 3.11/);
    assert.ok(await page.locator('[data-note-download] a').evaluate((node) => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
    const waiting = page.waitForEvent('download');
    await page.getByRole('link', { name: '下载原创 MCP 本机练习包', exact: true }).click();
    const download = await waiting;
    assert.equal(download.suggestedFilename(), 'brook-mcp-starter.zip');
    const bytes = await readFile(await download.path());
    const response = await page.request.get(base + '/assets/examples/mcp-starter.manifest.json');
    assert.equal(response.status(), 200); const manifest = await response.json();
    assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.archive.sha256);
    assert.equal(bytes.length, manifest.archive.bytes);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0, `${width} ${theme}`);
    await page.locator('.note-practice-alternatives > summary').click();
    assert.ok(await page.locator('[data-note-question="agent-mcp-validation"]').isVisible());
    await page.screenshot({ path: `${shots}/mcp-guide-${width}-${theme}.png`, fullPage: true });
    await page.locator('[data-open-site-search]').click();
    await page.locator('#site-search-query').fill('MCP');
    await page.waitForFunction(() => [...document.querySelectorAll('[data-search-results] a')].some((node) => node.href.endsWith('/knowledge/agent-mcp-server/')));
    await page.keyboard.press('Escape');
    assert.deepEqual(accesses, [], 'public article/search never accesses private journals');
    assert.ok(requests.every((request) => request.method === 'GET' && new URL(request.url).origin === new URL(base).origin && !request.url.includes('Original32')));
    assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    await context.close();
  }
  for (const route of ['paths', 'practice']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    await context.addInitScript(({ key, raw }) => { if (localStorage.getItem(key) === null) localStorage.setItem(key, raw); }, { key, raw });
    const page = await context.newPage(); await page.goto(base + `/study/${route}/#agent-mcp-discovery`);
    await page.waitForFunction(() => !document.getElementById('learning-export').closest('[hidden]'));
    assert.equal(await page.locator('[data-learning-step]').count(), expected.steps.length);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), raw);
    if (route === 'practice') await page.locator('.practice-resume-details > summary').click();
    assert.match(await page.locator('#learning-progress').innerText(), new RegExp('32 / ' + expected.steps.length));
    assert.match(await page.locator('#learning-continue').getAttribute('href'), /agent-mcp-discovery/);
    let waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    assert.deepEqual(JSON.parse(await readFile(await (await waiting).path(), 'utf8')), prior);
    const step = page.locator('[data-learning-step="agent-mcp-discovery"]');
    if (route === 'paths') await step.locator('.learning-entry summary').click();
    await step.locator('textarea').fill('收到实际发现结果与服务信息，仍不等于认证或模型任务完成。');
    await step.locator('[data-step-complete]').check();
    waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    const current = JSON.parse(await readFile(await (await waiting).path(), 'utf8'));
    for (const id of oldIds) assert.deepEqual(current.entries[id], prior.entries[id]);
    assert.equal(Object.keys(current.entries).length, 33);
    assert.equal(current.entries['agent-mcp-discovery'].completed, true);
    assert.equal(Object.hasOwn(current.entries, 'agent-mcp-validation'), false);
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 }, acceptDownloads: true });
  const page = await context.newPage(); await page.goto(base + slug);
  await page.getByRole('link', { name: '下载原创 MCP 本机练习包', exact: true }).focus();
  assert.ok(await page.locator('[data-note-download] a').evaluate((node) => node === document.activeElement));
  await page.locator('a[href="#note-learning-questions"]').click();
  await page.locator('.note-practice-alternatives > summary').focus(); await page.keyboard.press('Enter');
  assert.ok(await page.locator('[data-note-question="agent-mcp-validation"]').isVisible());
  await page.goto(base + slug);
  const scaled = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('main, main *')], sizes = nodes.map((node) => parseFloat(getComputedStyle(node).fontSize));
    const paragraph = document.querySelector('.prose p'), before = parseFloat(getComputedStyle(paragraph).fontSize);
    nodes.forEach((node, i) => node.style.setProperty('font-size', sizes[i] * 2 + 'px', 'important'));
    const link = document.querySelector('[data-note-download] a'), r = link.getBoundingClientRect();
    return { before, after: parseFloat(getComputedStyle(paragraph).fontSize), link: parseFloat(getComputedStyle(link).fontSize), left: r.left, right: r.right, width: innerWidth, documentWidth: document.documentElement.scrollWidth };
  });
  assert.equal(scaled.after, scaled.before * 2); assert.equal(scaled.link, 32);
  assert.ok(scaled.left >= 0 && scaled.right <= scaled.width && scaled.documentWidth <= scaled.width);
  await context.close();
  console.log(`PASS MCP building: actual ZIP/hash/download, 390/768/1440×themes, native entry/search/axe/no-JS/keyboard/320/real2×text, no public private-store access/upload, exact old32 and manual-only ${expected.steps.length}-step extension`);
} finally { await browser.close(); }
