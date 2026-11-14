import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { expectedLearningIds } from './expected-learning.mjs';
const expectedLearning = await expectedLearningIds();
const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.AGENT_BUILDING_SHOT_DIR || 'work/agent-building';
await mkdir(shots, { recursive: true });
const key = 'brooks-universe.learning.v1';
const oldIds = ['python-values', 'rss-records', 'source-evidence', 'mercator-assumptions', 'map-provenance', 'copy-relations', 'lifetime-boundaries', 'individual-collective', 'pure-equilibrium', 'classification-denominators', 'spatial-holdout', 'evaluation-evidence', 'ai-version-scope', 'economy-denominators', 'policy-status', 'tool-contract', 'tool-observation', 'tool-boundaries', 'public-goods-incentives', 'public-goods-boundaries', 'ai-model-boundaries', 'ai-request-failures', 'ai-output-contract', 'ai-task-evaluation', 'agent-control-loop', 'agent-context-evidence', 'agent-permission-boundaries', 'agent-trace-evaluation'];
const newIds = ['agent-build-project', 'agent-build-adapter', 'agent-build-budgets', 'agent-build-acceptance'];
const prior = { version: 1, entries: Object.fromEntries(oldIds.map((id, i) => [id, { completed: true, note: `Original28 ${i}: <literal> 🪻` }])) }, raw = JSON.stringify(prior);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const privateReads = [], privateWrites = [];
    await context.exposeFunction('starterStorageEvent', (kind, name) => (kind === 'read' ? privateReads : privateWrites).push(name));
    await context.addInitScript(({ key, raw, theme }) => {
      localStorage.setItem('atlas-theme', theme); localStorage.setItem(key, raw);
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      const keys = [key, 'brooks-universe.observatory.v1'];
      Storage.prototype.getItem = function (name) { if (keys.includes(name)) window.starterStorageEvent('read', name); return get.call(this, name); };
      Storage.prototype.setItem = function (name, value) { if (keys.includes(name)) window.starterStorageEvent('write', name); return set.call(this, name, value); };
    }, { key, raw, theme });
    const page = await context.newPage(), errors = [], missing = [], requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => { if (response.url().startsWith(base) && response.status() >= 400) missing.push(response.url()); });
    page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    await page.goto(base + '/study/ai/');
    await page.locator('.ai-learning-jumps a[href="#agent-workshop"]').click();
    assert.ok(await page.locator('#agent-workshop-title').evaluate((node) => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; }));
    await page.getByRole('link', { name: '从搭建手册开始', exact: true }).click();
    await page.waitForURL(base + '/knowledge/agent-project-starter/');
    assert.match(await page.locator('.prose').innerText(), /预写假回包/);
    assert.ok(await page.locator('[data-note-download] a').evaluate((node) => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), 'real download stays in the initial reading viewport');
    assert.match(await page.locator('[data-note-download]').innerText(), /Python 3.11/);
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('link', { name: '下载原创 Agent 搭建练习包', exact: true }).click();
    const download = await downloadEvent;
    assert.equal(download.suggestedFilename(), 'brook-agent-starter.zip');
    const actual = await readFile(await download.path());
    const response = await page.request.get(base + '/assets/examples/agent-starter.manifest.json');
    assert.equal(response.status(), 200); const manifest = await response.json();
    assert.equal(createHash('sha256').update(actual).digest('hex'), manifest.archive.sha256);
    assert.equal(actual.length, manifest.archive.bytes);
    for (const slug of ['agent-project-starter', 'agent-testing-contracts']) {
      await page.goto(base + '/knowledge/' + slug + '/');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0, `${slug} ${width} ${theme}`);
      assert.ok((await page.locator('.prose a[href]').count()) > 3);
      await page.screenshot({ path: `${shots}/${slug}-${width}-${theme}.png`, fullPage: true });
    }
    await page.locator('[data-open-site-search]').click();
    const dialog = page.locator('[data-site-search-dialog]');
    for (const query of ['Agent搭建', '智能体搭建']) {
      await dialog.locator('#site-search-query').fill(query);
      await page.waitForFunction(() => [...document.querySelectorAll('[data-search-results] a')].some((node) => node.href.endsWith('/knowledge/agent-project-starter/')));
    }
    await page.keyboard.press('Escape');
    assert.deepEqual(privateReads, []);
    assert.deepEqual(privateWrites, []);
    assert.ok(requests.every((request) => request.method === 'GET' && new URL(request.url).origin === new URL(base).origin && !request.url.includes('Original28')));
    assert.deepEqual(errors, []); assert.deepEqual(missing, []); await context.close();
  }
  for (const route of ['paths', 'practice']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    await context.addInitScript(({ key, raw }) => { if (localStorage.getItem(key) === null) localStorage.setItem(key, raw); }, { key, raw });
    const page = await context.newPage(); await page.goto(base + `/study/${route}/#agent-build-project`);
    await page.waitForFunction(() => !document.getElementById('learning-export').closest('[hidden]'));
    assert.equal(await page.locator('[data-learning-step]').count(), expectedLearning.steps.length);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), raw, 'new route does not rewrite old28 raw records');
    for (const id of newIds) assert.equal(await page.locator(`[data-learning-step="${id}"]`).count(), 1);
    if (route === 'practice') await page.locator('.practice-resume-details > summary').click();
    assert.match(await page.locator('#learning-progress').innerText(), new RegExp('28 / ' + expectedLearning.steps.length));
    assert.match(await page.locator('#learning-continue').getAttribute('href'), /agent-build-project/);
    let waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    assert.deepEqual(JSON.parse(await readFile(await (await waiting).path(), 'utf8')), prior);
    const step = page.locator('[data-learning-step="agent-build-project"]');
    if (route === 'paths') await step.locator('.learning-entry summary').click();
    await step.locator('textarea').fill('先区分脚本假回包、真实只读函数和任务核查。');
    await step.locator('[data-step-complete]').check();
    waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    const current = JSON.parse(await readFile(await (await waiting).path(), 'utf8'));
    for (const id of oldIds) assert.deepEqual(current.entries[id], prior.entries[id]);
    assert.equal(Object.keys(current.entries).length, 29);
    assert.equal(current.entries['agent-build-project'].completed, true);
    assert.ok(newIds.slice(1).every((id) => !Object.hasOwn(current.entries, id)));
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 }, acceptDownloads: true });
  const page = await context.newPage();
  await page.goto(base + '/knowledge/agent-project-starter/');
  assert.ok(await page.getByRole('link', { name: '下载原创 Agent 搭建练习包', exact: true }).isVisible());
  await page.locator('a[href="#note-learning-questions"]').click();
  await page.locator('.note-practice-alternatives > summary').focus(); await page.keyboard.press('Enter');
  assert.ok(await page.locator('[data-note-question="agent-build-adapter"]').isVisible());
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.goto(base + '/knowledge/agent-project-starter/');
  const scaled = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('main, main *')];
    const sizes = nodes.map((node) => parseFloat(getComputedStyle(node).fontSize));
    const paragraph = document.querySelector('.prose p');
    const before = parseFloat(getComputedStyle(paragraph).fontSize);
    nodes.forEach((node, i) => node.style.setProperty('font-size', sizes[i] * 2 + 'px', 'important'));
    const link = document.querySelector('[data-note-download] a'), box = link.getBoundingClientRect();
    return { before, after: parseFloat(getComputedStyle(paragraph).fontSize), linkFont: parseFloat(getComputedStyle(link).fontSize), left: box.left, right: box.right, width: innerWidth, documentWidth: document.documentElement.scrollWidth };
  });
  assert.equal(scaled.after, scaled.before * 2, 'the paragraph itself, not only the root, really doubles');
  assert.equal(scaled.linkFont, 32);
  assert.ok(scaled.left >= 0 && scaled.right <= scaled.width && scaled.documentWidth <= scaled.width);
  await context.close();
  console.log(`PASS Agent building: actual ZIP/hash/download, two original guides, 390/768/1440×themes, workshop/native links, axe/keyboard/no-JS/320, no article private reads/writes/uploads, original28 exact raw/export and manual-only${expectedLearning.steps.length}-step extension on paths/practice`);
} finally { await browser.close(); }
