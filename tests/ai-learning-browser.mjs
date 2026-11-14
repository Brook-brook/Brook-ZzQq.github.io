import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { expectedLearningIds } from './expected-learning.mjs';
const expectedLearning = await expectedLearningIds();
const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const prefix = new URL(base).pathname.replace(/\/$/, '');
const shots = process.env.AI_LEARNING_SHOT_DIR || 'work/ai-learning';
const key = 'brooks-universe.learning.v1';
const notes = ['ai-app-foundations', 'model-request-contracts', 'agent-loop-basics', 'retrieval-evidence', 'agent-evaluation'];
const newSteps = ['ai-model-boundaries', 'ai-request-failures', 'ai-output-contract', 'ai-task-evaluation', 'agent-control-loop', 'agent-context-evidence', 'agent-permission-boundaries', 'agent-trace-evaluation'];
const priorSteps = ['python-values', 'rss-records', 'source-evidence', 'mercator-assumptions', 'map-provenance', 'copy-relations', 'lifetime-boundaries', 'individual-collective', 'pure-equilibrium', 'classification-denominators', 'spatial-holdout', 'evaluation-evidence', 'ai-version-scope', 'economy-denominators', 'policy-status', 'tool-contract', 'tool-observation', 'tool-boundaries', 'public-goods-incentives', 'public-goods-boundaries'];
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
async function layout(page) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'page has no horizontal overflow');
}
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const privateReads = [], privateWrites = [];
    await context.exposeFunction('aiStorageEvent', (kind, key) => (kind === 'read' ? privateReads : privateWrites).push(key));
    await context.addInitScript((theme) => {
      localStorage.setItem('atlas-theme', theme);
      const keys = ['brooks-universe.learning.v1', 'brooks-universe.observatory.v1'];
      keys.forEach((k) => localStorage.setItem(k, 'AI_LEARNING_PRIVATE_SENTINEL'));
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      Storage.prototype.getItem = function (k) { if (keys.includes(k)) window.aiStorageEvent('read', k); return get.call(this, k); };
      Storage.prototype.setItem = function (k, value) { if (keys.includes(k)) window.aiStorageEvent('write', k); return set.call(this, k, value); };
    }, theme);
    const page = await context.newPage(), errors = [], missing = [], requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (r) => { if (r.url().startsWith(base) && r.status() >= 400) missing.push(r.url()); });
    page.on('request', (r) => requests.push({ method: r.method(), url: r.url() }));
    await page.goto(base + '/study/ai/');
    assert.equal(await page.locator('[data-ai-route]').count(), 2);
    assert.deepEqual(await page.locator('[data-ai-step]').evaluateAll((nodes) => nodes.map((node) => node.dataset.aiStep)), newSteps);
    assert.equal(await page.locator('[data-ai-step] h3 a[href]').count(), 8);
    await layout(page);
    const violations = (await new AxeBuilder({ page }).analyze()).violations;
    assert.deepEqual(violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), []);
    await page.screenshot({ path: `${shots}/entry-${width}-${theme}.png`, fullPage: true });
    await page.locator('.ai-learning-jumps a[href="#agent-development"]').click();
    assert.ok(await page.locator('#heading-agent-development').evaluate((node) => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; }));
    const details = page.locator('[data-ai-step="agent-control-loop"] details');
    await details.locator('summary').focus(); await page.keyboard.press('Enter');
    assert.match(await details.innerText(), /轮数限制为什么不等于工具次数/);
    await page.locator('[data-ai-step="agent-control-loop"] h3 a').click();
    assert.equal(new URL(page.url()).pathname, prefix + '/knowledge/agent-loop-basics/');
    assert.match(await page.locator('.prose').innerText(), /隐藏的内部思考全文/);
    for (const slug of notes) {
      await page.goto(base + '/knowledge/' + slug + '/');
      await layout(page);
      assert.equal(await page.locator('.note h1').count(), 1);
      assert.match(await page.locator('.prose').innerText(), /AI 辅助/);
      assert.ok((await page.locator('.prose a[href*="/blob/"]').count()) >= 2);
      assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0, `${slug} accessibility`);
      assert.ok((await page.locator('nav[aria-label="相关学习路线"] a[href*="/study/"]').count()) >= 2);
    }
    await page.screenshot({ path: `${shots}/note-${width}-${theme}.png`, fullPage: true });
    await page.goto(base + '/knowledge/model-request-contracts/#example');
    const waiting = page.waitForEvent('download');
    await page.getByRole('link', { name: '下载原创 ai_request.py' }).click();
    const download = await waiting, source = await readFile(await download.path(), 'utf8');
    assert.equal(download.suggestedFilename(), 'ai_request.py');
    assert.match(source, /def ask_once\(/); assert.match(source, /max_retries=0/); assert.match(source, /store=False/);
    await page.goto(base + '/study/');
    await page.getByRole('link', { name: 'AI 与 Agent 开发路径', exact: true }).click();
    assert.ok(page.url().endsWith('/study/ai/'));
    await page.locator('[data-open-site-search]').click();
    const dialog = page.locator('[data-site-search-dialog]');
    for (const query of ['Agent 开发', 'Agent开发', '智能体开发', '检索增强生成']) {
      await dialog.locator('#site-search-query').fill(query);
      await page.waitForTimeout(250);
      assert.ok((await dialog.locator('[data-search-results] a[href$="/study/ai/"]').count()) >= 1, `explicit public keywords find the curriculum: ${query}`);
    }
    await page.keyboard.press('Escape');
    assert.deepEqual(privateReads, []);
    assert.deepEqual(privateWrites, []);
    assert.ok(requests.length > 0 && requests.every((r) => r.method === 'GET' && new URL(r.url).origin === new URL(base).origin && !r.url.includes('AI_LEARNING_PRIVATE_SENTINEL')));
    assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    await context.close();
  }

  for (const route of ['paths', 'practice']) {
    const previous = { version: 1, entries: Object.fromEntries(priorSteps.map((id, i) => [id, { completed: true, note: `Original20 ${i}: <literal> 🪻` }])) };
    const raw = JSON.stringify(previous), context = await browser.newContext({ acceptDownloads: true });
    await context.addInitScript(({ key, raw }) => { if (localStorage.getItem(key) === null) localStorage.setItem(key, raw); }, { key, raw });
    const page = await context.newPage(); await page.goto(base + '/study/' + route + '/');
    await page.waitForFunction(() => !document.getElementById('learning-export').closest('[hidden]'));
    assert.equal(await page.locator('[data-learning-step]').count(), expectedLearning.steps.length);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), raw, 'initial render never rewrites the prior raw backup');
    if (route === 'practice') await page.locator('.practice-resume-details > summary').click();
    assert.match(await page.locator('#learning-progress').innerText(), new RegExp('20 / ' + expectedLearning.steps.length));
    assert.match(await page.locator('#learning-continue').getAttribute('href'), /ai-model-boundaries/);
    let waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    assert.deepEqual(JSON.parse(await readFile(await (await waiting).path(), 'utf8')), previous);
    await page.goto(base + '/study/' + route + '/#ai-model-boundaries');
    const step = page.locator('[data-learning-step="ai-model-boundaries"]');
    if (route === 'paths') await step.locator('.learning-entry summary').click();
    await step.locator('textarea').fill('先让程序正确计算，再用证据约束模型解释。');
    await step.locator('[data-step-complete]').check();
    waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    const current = JSON.parse(await readFile(await (await waiting).path(), 'utf8'));
    for (const id of priorSteps) assert.deepEqual(current.entries[id], previous.entries[id]);
    assert.equal(Object.keys(current.entries).length, 21, 'unvisited new steps do not become automatic records');
    assert.equal(current.entries['ai-model-boundaries'].completed, true);
    assert.equal(current.entries['ai-model-boundaries'].note, '先让程序正确计算，再用证据约束模型解释。');
    assert.ok(Object.keys(current.entries).every((id) => [...priorSteps, ...newSteps].includes(id)));
    await page.reload();
    assert.equal(await page.locator('[data-learning-step="ai-model-boundaries"] textarea').inputValue(), current.entries['ai-model-boundaries'].note);
    await context.close();
  }

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const native = await nojs.newPage(); await native.goto(base + '/study/ai/');
  assert.equal(await native.locator('[data-ai-step]:visible').count(), 8);
  await native.locator('[data-ai-step]').first().locator('summary').click();
  assert.match(await native.locator('[data-ai-step]').first().innerText(), /模型参数/);
  await native.locator('[data-ai-step]').first().locator('h3 a').click();
  assert.match(await native.locator('.prose').innerText(), /本次输入/);
  await layout(native); await nojs.close();
  const context = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'no-preference' });
  const page = await context.newPage(); await page.goto(base + '/study/ai/'); await layout(page);
  await page.keyboard.press('Tab'); assert.equal(await page.locator('.skip').evaluate((node) => node === document.activeElement), true);
  await page.keyboard.press('Enter'); assert.equal(await page.locator('#main').evaluate((node) => node === document.activeElement), true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length), 0);
  await page.setViewportSize({ width: 768, height: 390 }); await layout(page);
  await page.setViewportSize({ width: 390, height: 900 }); await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; }); await layout(page);
  await context.close();
  console.log('PASS AI learning: two native routes/eight exact steps, five actual sourced notes, real Python download, public search and Study navigation, 390/768/1440 × themes, axe/keyboard/no-JS/reduced-motion/320/short/200% text, no private reads/writes/network, original20 raw backup/resume/explicit extension on paths and practice');
} finally { await browser.close(); }
