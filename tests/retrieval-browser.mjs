import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.RETRIEVAL_SHOT_DIR || 'work/retrieval';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
const route = '/playground/retrieval/';
const rows = (page) => page.locator('#retrieval-results > li');
const toggle = (page, id) => page.locator(`[data-fragment-toggle="${id}"]`);
async function open(page) { await page.goto(base + route); await page.waitForFunction(() => !document.getElementById('retrieval-controls').disabled); }
async function options(page) { await page.locator('.retrieval-options').evaluate((node) => { node.open = true; }); }
async function capture(page, file) { await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); }); await page.screenshot({ path: `${shots}/${file}`, fullPage: true }); }
async function report(page) {
  const pending = page.waitForEvent('download'); await page.locator('#retrieval-export').click();
  const downloaded = await pending; assert.equal(downloaded.suggestedFilename(), 'brooks-retrieval-evidence.json');
  return JSON.parse(await readFile(await downloaded.path(), 'utf8'));
}
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const privateReads = [], privateWrites = [];
    await context.exposeFunction('retrievalStorageEvent', (kind, key) => (kind === 'read' ? privateReads : privateWrites).push(key));
    await context.addInitScript((theme) => {
      localStorage.setItem('atlas-theme', theme);
      const keys = ['brooks-universe.learning.v1', 'brooks-universe.observatory.v1'];
      keys.forEach((key) => localStorage.setItem(key, 'RETRIEVAL_PRIVATE_SENTINEL'));
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      Storage.prototype.getItem = function (key) { if (keys.includes(key)) window.retrievalStorageEvent('read', key); return get.call(this, key); };
      Storage.prototype.setItem = function (key, value) { if (keys.includes(key)) window.retrievalStorageEvent('write', key); return set.call(this, key, value); };
    }, theme);
    const page = await context.newPage(), errors = [], missing = [], requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => { if (response.url().startsWith(base) && response.status() >= 400) missing.push(response.url()); });
    page.on('request', (request) => requests.push({ url: request.url(), method: request.method() }));
    await open(page); assert.equal(await rows(page).count(), 2);
    const heights = await page.locator('#retrieval-query, #retrieval-version, #retrieval-run').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
    assert.ok(heights.every((height) => height === 52), 'search-row controls share an actual 52px height');
    assert.deepEqual(await page.locator('.retrieval-metrics dd').allTextContents(), ['0.500', '0.500', '0.500']);
    assert.ok((await rows(page).first().innerText()).includes('/ v1'));
    assert.match(await page.locator('#retrieval-usage').innerText(), /已用0 \/ 220/);
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    await capture(page, `initial-${width}-${theme}.png`);

    await page.selectOption('#retrieval-version', 'v2');
    assert.ok(await page.locator('#retrieval-export').isDisabled()); assert.ok(await toggle(page, 'a-retention-old').isDisabled());
    assert.match(await page.locator('#retrieval-status').innerText(), /上次检索/);
    await page.locator('#retrieval-run').click();
    assert.deepEqual(await page.locator('.retrieval-metrics dd').allTextContents(), ['1.000', '1.000', '1.000']);
    await toggle(page, 'b-retention-trial').click();
    assert.ok(await toggle(page, 'b-retention-trial').evaluate((node) => node === document.activeElement));
    assert.match(await page.locator('#retrieval-context').innerText(), /只适用于试用空间/);
    const jump = rows(page).first().getByRole('link', { name: '查看上下文' });
    assert.ok(await jump.isVisible());
    if (width === 390) {
      const box = await jump.boundingBox(), action = await toggle(page, 'b-retention-trial').boundingBox();
      assert.ok(Math.abs(box.y - action.y) < 10, 'phone context jump shares the actual action row');
      await jump.click(); assert.ok(await page.locator('#retrieval-context-title').evaluate((node) => node === document.activeElement));
    }
    await toggle(page, 'c-retention-full').click();
    assert.match(await page.locator('#retrieval-usage').innerText(), /已用167 \/ 220/);
    let data = await report(page);
    assert.equal(data.model_called, false); assert.equal(data.snapshot.corpus.fragments.length, 8);
    assert.equal(data.snapshot.corpus.documents.length, 4); assert.equal(data.snapshot.corpus.tasks.length, 4);
    assert.deepEqual(data.snapshot.selected_ids, ['b-retention-trial', 'c-retention-full']);
    assert.equal(data.context_characters, 167); assert.equal(Array.from(data.context).length, 167);
    assert.equal(data.context, await page.locator('#retrieval-context').innerText());
    assert.match(data.context, /v2 \| 第2节：正式空间/); assert.match(data.context, /不改变试用空间的7天/);
    assert.equal(data.snapshot.metrics.precision_at_k, 1); assert.ok(!JSON.stringify(data).includes('RETRIEVAL_PRIVATE_SENTINEL'));
    await capture(page, `selected-${width}-${theme}.png`);
    await rows(page).first().getByRole('link', { name: '回看完整出处' }).click();
    assert.ok(await page.locator('#retrieval-source').evaluate((node) => node.open));
    assert.ok(await page.locator('#source-b-retention-trial').evaluate((node) => node === document.activeElement));

    await options(page); await page.fill('#retrieval-budget', '80'); await page.locator('#retrieval-run').click();
    await toggle(page, 'b-retention-trial').click();
    assert.match(await rows(page).first().locator('.retrieval-row-status').innerText(), /82字符.*80.*没有加入或截断/);
    assert.equal(await toggle(page, 'b-retention-trial').getAttribute('aria-pressed'), 'false');
    assert.match(await page.locator('#retrieval-usage').innerText(), /已用0 \/ 80/);
    await capture(page, `budget-${width}-${theme}.png`);
    await page.fill('#retrieval-budget', '82'); await page.locator('#retrieval-run').click();
    await toggle(page, 'b-retention-trial').click(); assert.match(await page.locator('#retrieval-usage').innerText(), /已用82 \/ 82/);
    await toggle(page, 'c-retention-full').click(); assert.equal(await toggle(page, 'b-retention-trial').getAttribute('aria-pressed'), 'true');
    await toggle(page, 'b-retention-trial').click(); assert.match(await page.locator('#retrieval-usage').innerText(), /已用0/);

    await page.fill('#retrieval-k', '9'); await page.locator('#retrieval-run').click();
    assert.match(await page.locator('#retrieval-status').innerText(), /无效.*原检索/); assert.ok(await page.locator('#retrieval-export').isDisabled());
    await page.fill('#retrieval-k', '8'); await page.fill('#retrieval-budget', '220'); await page.selectOption('#retrieval-version', 'v1'); await page.locator('#retrieval-run').click();
    data = await report(page); assert.equal(data.snapshot.ranked.length, 1); assert.equal(data.snapshot.metrics.relevant_total, 2); assert.equal(data.snapshot.metrics.recall_at_k, 0);
    await page.selectOption('#retrieval-task', 'free'); await page.locator('#retrieval-run').click();
    assert.equal(await page.locator('.retrieval-metrics dl').count(), 0);
    data = await report(page); assert.equal(data.snapshot.metrics, null); assert.equal(data.snapshot.corpus.tasks.at(-1).relevant_ids, null);
    await page.fill('#retrieval-query', ''); await page.locator('#retrieval-run').click();
    assert.equal(await rows(page).count(), 0); assert.ok(await page.locator('#retrieval-empty').isVisible());
    assert.match(await page.locator('#retrieval-empty').innerText(), /不表示现实/);
    await page.selectOption('#retrieval-task', 'budgets'); await page.locator('#retrieval-run').click();
    assert.equal(await rows(page).count(), 2); assert.match(await page.locator('#retrieval-question').innerText(), /独立的派发预算/);
    assert.deepEqual((await report(page)).snapshot.ranked.map((f) => f.id), ['e-loop-proposals', 'f-loop-dispatches']);
    await page.selectOption('#retrieval-task', 'timeout'); await page.locator('#retrieval-run').click();
    assert.equal((await report(page)).snapshot.metrics.reciprocal_rank_at_k, .5);
    await page.evaluate(() => { document.querySelector('#retrieval-query').value = 'SILENT_EDIT'; });
    const downloads = []; page.on('download', (download) => downloads.push(download));
    await page.locator('#retrieval-export').click(); assert.equal(downloads.length, 0); assert.ok(await page.locator('#retrieval-export').isDisabled());

    await page.locator('#retrieval-source').evaluate((node) => { node.open = true; });
    const pendingSource = page.waitForEvent('download'); await page.getByRole('link', { name: '下载完整虚构语料 JSON' }).click();
    const source = JSON.parse(await readFile(await (await pendingSource).path(), 'utf8'));
    assert.equal(source.fragments.length, 8); assert.match(source.disclosure, /原创AI辅助教学数据/);
    assert.ok((await page.getByRole('link', { name: '写下自己的证据链' }).getAttribute('href')).endsWith('/study/practice/#agent-context-evidence'));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.deepEqual(privateReads, []); assert.deepEqual(privateWrites, []);
    assert.ok(requests.every((r) => r.method === 'GET' && new URL(r.url).origin === new URL(base).origin && !r.url.includes('RETRIEVAL_PRIVATE_SENTINEL')));
    assert.deepEqual(errors, []); assert.deepEqual(missing, []); await context.close();
  }
  const keyboard = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'no-preference' });
  const p = await keyboard.newPage(); await open(p); await p.keyboard.press('Tab'); await p.keyboard.press('Enter');
  assert.deepEqual(await p.locator('#retrieval-query, #retrieval-version, #retrieval-run').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height)), [52, 52, 52]);
  assert.ok(await p.locator('#main').evaluate((node) => node === document.activeElement));
  await toggle(p, 'a-retention-old').focus(); await p.keyboard.press('Enter');
  assert.equal(await toggle(p, 'a-retention-old').getAttribute('aria-pressed'), 'true');
  await p.emulateMedia({ reducedMotion: 'reduce' }); await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  assert.equal(await p.locator('#retrieval-context').evaluate((node) => node.getAnimations().filter((a) => a.playState === 'running').length), 0);
  await p.setViewportSize({ width: 768, height: 390 }); assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await p.addStyleTag({ content: 'html { font-size: 200% !important }' }); assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const scaled = await p.locator('#retrieval-query, #retrieval-version, #retrieval-run').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
  assert.ok(scaled.every((height) => height === scaled[0] && height > 52), 'large-font controls grow equally');
  await keyboard.close();
  const native = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const n = await native.newPage(); await n.goto(base + route);
  assert.ok(await n.locator('#retrieval-controls').evaluate((node) => node.disabled));
  assert.ok(await n.locator('#retrieval-run').isDisabled()); assert.equal(await n.locator('.retrieval-source-fragment').count(), 8);
  assert.ok(await n.locator('#source-c-retention-full').isVisible());
  assert.match(await n.locator('#retrieval-source').innerText(), /只适用于正式空间/);
  assert.ok(await n.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await native.close();
  for (const mode of ['corrupt', 'literal']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } }), page = await context.newPage();
    await page.route('**/playground/retrieval/', async (route) => {
      const response = await route.fetch(), html = await response.text();
      const body = html.replace(/(<script type="application\/json" data-retrieval-corpus>)([\s\S]*?)(<\/script>)/, (_, start, raw, end) => {
        const data = JSON.parse(raw);
        if (mode === 'corrupt') data.tasks[0].relevant_ids.push('unknown-fragment');
        else data.fragments[0].text = 'LITERAL_SENTINEL <img src=x onerror="window.retrievalInjected=true">';
        return start + JSON.stringify(data).replaceAll('<', '\\u003c') + end;
      });
      await route.fulfill({ response, body });
    });
    if (mode === 'corrupt') {
      await page.goto(base + route); assert.ok(await page.locator('#retrieval-controls').evaluate((node) => node.disabled));
      assert.match(await page.locator('#retrieval-status').innerText(), /未通过检查/); assert.ok(await page.locator('#source-c-retention-full').isVisible());
    } else {
      await open(page); await page.fill('#retrieval-query', 'LITERAL_SENTINEL'); await page.locator('#retrieval-run').click();
      assert.match(await page.locator('#retrieval-results').innerText(), /<img src=x/);
      assert.equal(await page.locator('#retrieval-results img').count(), 0); assert.equal(await page.evaluate(() => window.retrievalInjected), undefined);
    }
    await context.close();
  }
  console.log('PASS retrieval: original versioned corpus, literal ranks/explicit P@k/recall/RR, complete context167/exact and rejected budgets, maintained focus, actual report/source downloads, stale settings, free/empty cases, source anchors, 390/768/1440×themes, axe/keyboard/reduced-motion/320/short/200% text, no-JS, bad/literal data and no private reads/writes/uploads');
} finally { await browser.close(); }
