import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.NOTE_PRACTICE_SHOT_DIR || 'work/note-practice';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
const key = 'brooks-universe.learning.v1';
const raw = JSON.stringify({ version: 1, entries: { 'python-values': { completed: true, note: 'ARTICLE_PRIVATE_SENTINEL <literal>' } } });
const cases = [
  ['python-first-steps', ['python-values']],
  ['cpp-copy', ['copy-relations', 'lifetime-boundaries']],
  ['tool-calling-boundaries', ['tool-contract', 'tool-observation', 'tool-boundaries']],
  ['model-request-contracts', ['ai-request-failures', 'ai-output-contract']],
  ['agent-loop-basics', ['agent-control-loop', 'agent-permission-boundaries', 'agent-build-budgets']],
  ['retrieval-evidence', ['agent-context-evidence']],
  ['agent-evaluation', ['ai-task-evaluation', 'agent-trace-evaluation']],
  ['agent-project-starter', ['agent-build-project', 'agent-build-adapter']],
  ['agent-testing-contracts', ['agent-build-acceptance']],
  ['agent-mcp-server', ['agent-mcp-discovery', 'agent-mcp-validation']],
  ['agent-mcp-bridge', ['agent-bridge-envelope', 'agent-bridge-stop']],
  ['python-async-boundaries', ['async-scheduling', 'async-cancellation']],
  ['skills-mcp-boundaries', []]
];
async function visit(page, slug) { await page.goto(base + `/knowledge/${slug}/`); }
async function capture(page, filename, fullPage = false) { await page.evaluate(() => document.activeElement?.blur()); await page.screenshot({ path: `${shots}/${filename}`, fullPage }); }
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const reads = [], writes = [], requests = [];
    await context.exposeFunction('articleStorageEvent', (kind, item, path) => (kind === 'read' ? reads : writes).push({ key: item, path }));
    await context.addInitScript(({ theme, raw, key }) => {
      localStorage.setItem('atlas-theme', theme); localStorage.setItem(key, raw);
      localStorage.setItem('brooks-universe.observatory.v1', 'ARTICLE_OBSERVATORY_SENTINEL');
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      window.readOriginalJournalForTest = () => get.call(localStorage, key);
      const keys = [key, 'brooks-universe.observatory.v1'];
      Storage.prototype.getItem = function (item) { if (keys.includes(item)) window.articleStorageEvent('read', item, location.pathname); return get.call(this, item); };
      Storage.prototype.setItem = function (item, value) { if (keys.includes(item)) window.articleStorageEvent('write', item, location.pathname); return set.call(this, item, value); };
    }, { theme, raw, key });
    const page = await context.newPage(), errors = [], missing = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => { if (response.url().startsWith(base) && response.status() >= 400) missing.push(response.url()); });
    page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    for (const [slug, ids] of cases) {
      await visit(page, slug);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug} ${width} overflow`);
      assert.equal(await page.evaluate(() => window.readOriginalJournalForTest()), raw);
      const nav = page.locator('#note-learning-questions');
      if (!ids.length) {
        assert.equal(await nav.count(), 0); assert.equal(await page.locator('a[href="#note-learning-questions"]').count(), 0);
        assert.equal(await page.getByRole('link', { name: '打开对应实验', exact: true }).count(), 0);
      } else {
        assert.equal(await nav.count(), 1);
        assert.deepEqual(await nav.locator('[data-note-question]').evaluateAll((nodes) => nodes.map((node) => node.dataset.noteQuestion)), ids);
        assert.ok(await nav.locator(`a[href$="/study/paths/#${ids[0]}"]`).isVisible(), 'original route remains visible');
        const jump = page.locator('a[href="#note-learning-questions"]'); assert.equal(await jump.innerText(), `本篇自解释问题（${ids.length}）`);
        await jump.click(); assert.ok(await nav.evaluate((node) => node === document.activeElement), 'native article jump focuses the practice landmark');
        assert.ok(await nav.locator('.note-practice-title').first().isVisible());
        if (ids.length > 1) {
          const summary = nav.locator('.note-practice-alternatives > summary'); await summary.focus(); await page.keyboard.press('Enter');
          assert.ok(await nav.locator(`[data-note-question="${ids[1]}"]`).isVisible());
          assert.ok(await summary.evaluate((node) => node === document.activeElement));
        }
        for (const id of ids) assert.ok((await nav.locator(`[data-note-question="${id}"] .note-practice-title`).getAttribute('href')).endsWith('/study/practice/#' + id));
      }
      for (const block of await page.locator('.prose div.highlighter-rouge').all()) {
        assert.equal(await block.locator('[tabindex="0"]').count(), 1, 'one keyboard region per real code block');
        assert.equal(await block.locator('.note-code-scroll').getAttribute('role'), 'group');
        assert.equal(await block.locator('pre table, code table').count(), 0, 'a layout table is not phrasing content inside pre/code');
        assert.equal(await block.locator('.rouge-table').getAttribute('role'), 'presentation');
        assert.equal(await block.locator('.rouge-gutter').getAttribute('aria-hidden'), 'true');
        assert.equal(await block.locator('.rouge-code pre').getAttribute('tabindex'), null);
        assert.ok((await block.locator('.rouge-code pre').textContent()).trim().length > 0);
        assert.equal(await block.locator('.rouge-code').evaluate((node) => getComputedStyle(node).borderTopWidth), '0px');
      }
      assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0, slug);
      if (slug === 'agent-loop-basics') await capture(page, `choices-${width}-${theme}.png`);
      if (slug === 'skills-mcp-boundaries') {
        await page.evaluate(() => scrollTo(0, 0)); await capture(page, `interfaces-${width}-${theme}.png`, true);
        await page.locator('.prose div.highlighter-rouge').scrollIntoViewIfNeeded(); await capture(page, `code-${width}-${theme}.png`);
        const pending = page.waitForEvent('download'); await page.getByRole('link', { name: '下载完整示例', exact: true }).click();
        const download = await pending; assert.equal(download.suggestedFilename(), 'SKILL.md');
        const actual = await readFile(await download.path(), 'utf8'), source = await readFile(new URL('../_includes/skill-examples/catalog-evidence-guide/SKILL.md', import.meta.url), 'utf8');
        assert.equal(actual.trim(), source.trim()); assert.match(actual, /^---\nname: catalog-evidence-guide\n/);
        assert.ok(!actual.includes('{%') && !actual.includes('ARTICLE_PRIVATE_SENTINEL'));
      }
    }
    await visit(page, 'ai-app-foundations');
    const waiting = page.waitForEvent('download'); await page.getByRole('link', { name: '下载原创小任务设计卡' }).click();
    const card = await readFile(await (await waiting).path(), 'utf8');
    assert.match(card, /^# 从一个能核对的小任务开始/); assert.equal([...card.matchAll(/```json/g)].length, 5);
    assert.match(card, /1020\.225507/); assert.match(card, /未运行\/未评测/); assert.match(card, /OpenStreetMap contributors/);
    assert.deepEqual(reads, [], 'article choices and source reading never read private records');
    assert.deepEqual(writes, []); assert.equal(await page.evaluate(() => window.readOriginalJournalForTest()), raw);

    await visit(page, 'agent-loop-basics'); await page.locator('.note-practice-alternatives').evaluate((node) => { node.open = true; });
    await page.locator('[data-note-question="agent-permission-boundaries"] .note-practice-title').click();
    await page.waitForFunction(() => document.querySelector('[data-practice-workspace]')?.dataset.practiceReady === 'true');
    assert.ok(page.url().endsWith('/study/practice/#agent-permission-boundaries'));
    assert.ok(await page.locator('[data-learning-step="agent-permission-boundaries"]').isVisible());
    assert.equal(await page.evaluate(() => window.readOriginalJournalForTest()), raw, 'opening the explicit question does not write a new record');
    assert.deepEqual(writes, []); assert.ok(reads.every((event) => event.path.endsWith('/study/practice/') && event.key === key));
    await page.goBack(); assert.ok(page.url().includes('/knowledge/agent-loop-basics/'));
    assert.equal(await page.evaluate(() => window.readOriginalJournalForTest()), raw);
    assert.ok(requests.every((request) => request.method === 'GET' && new URL(request.url).origin === new URL(base).origin && !request.url.includes('ARTICLE_PRIVATE_SENTINEL')));
    assert.deepEqual(errors, []); assert.deepEqual(missing, []); await context.close();
  }
  const small = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'no-preference' }), page = await small.newPage();
  await visit(page, 'model-request-contracts');
  const blocks = await page.locator('.prose .note-code-scroll').all(); let scrollable;
  for (const block of blocks) if (await block.evaluate((node) => node.scrollWidth > node.clientWidth + 1)) { scrollable = block; break; }
  assert.ok(scrollable, 'actual long code is horizontally scrollable at320');
  await scrollable.focus(); await page.keyboard.press('ArrowRight');
  await page.waitForFunction((node) => node.scrollLeft > 0, await scrollable.elementHandle());
  await visit(page, 'agent-loop-basics'); const summary = page.locator('.note-practice-alternatives > summary'); await summary.scrollIntoViewIfNeeded();
  const box = await summary.boundingBox(); await page.mouse.move(box.x + 8, box.y + 8); await page.mouse.down();
  assert.notEqual(await summary.evaluate((node) => getComputedStyle(node).transform), 'none');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  assert.equal(await summary.evaluate((node) => getComputedStyle(node).transform), 'none'); await page.mouse.up();
  await page.setViewportSize({ width: 768, height: 390 }); await visit(page, 'skills-mcp-boundaries');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.addStyleTag({ content: 'html { font-size: 200% !important }' });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await small.close();
  const native = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } }), n = await native.newPage();
  for (const slug of ['python-first-steps', 'cpp-copy', 'agent-loop-basics', 'skills-mcp-boundaries']) {
    await visit(n, slug);
    if (await n.locator('.note-practice-alternatives').count()) { await n.locator('.note-practice-alternatives > summary').click(); assert.ok(await n.locator('.note-practice-alternatives [data-note-question]').first().isVisible()); }
    assert.ok(await n.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok((await n.locator('.prose').innerText()).length > 200);
  }
  await native.close();
  console.log('PASS article practice: exact native questions/route anchors, explicit alternate navigation/back, unchanged v1 raw records, no article private reads/writes/uploads, original Skill and five-case task-card downloads, real code/text/line numbers with one keyboard scroll region, 390/768/1440×themes, axe/no-JS/320/short/200% text and live reduced-motion press fallback');
} finally { await browser.close(); }
