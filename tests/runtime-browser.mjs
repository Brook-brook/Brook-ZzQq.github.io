import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.RUNTIME_SHOT_DIR || 'work/runtime';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
const key = 'brooks-universe.learning.v1';
async function open(page) { await page.goto(base + '/playground/agent-runtime/'); await page.waitForFunction(() => !document.getElementById('runtime-controls').disabled); }
async function scenario(page, value, decisions = 4, dispatches = 3) {
  await page.selectOption('#runtime-scenario', value); await page.fill('#runtime-decisions', String(decisions)); await page.fill('#runtime-dispatches', String(dispatches));
  await page.locator('#runtime-apply').click();
}
async function step(page, times = 1) { for (let i = 0; i < times; i++) await page.locator('#runtime-step').click(); }
async function finish(page) { for (let i = 0; i < 64 && !await page.locator('#runtime-step').isDisabled(); i++) await step(page); assert.ok(await page.locator('#runtime-step').isDisabled()); }
async function report(page) { const waiting = page.waitForEvent('download'); await page.locator('#runtime-export').click(); const download = await waiting; assert.equal(download.suggestedFilename(), 'brooks-scripted-runtime.json'); return JSON.parse(await readFile(await download.path(), 'utf8')); }
async function capture(page, path) { await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); }); await page.screenshot({ path, fullPage: true }); }
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const privateReads = [], privateWrites = [];
    await context.exposeFunction('runtimeStorageEvent', (kind, key) => (kind === 'read' ? privateReads : privateWrites).push(key));
    await context.addInitScript((theme) => {
      localStorage.setItem('atlas-theme', theme);
      const keys = ['brooks-universe.learning.v1', 'brooks-universe.observatory.v1'];
      keys.forEach((k) => localStorage.setItem(k, 'RUNTIME_PRIVATE_SENTINEL'));
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      Storage.prototype.getItem = function (k) { if (keys.includes(k)) window.runtimeStorageEvent('read', k); return get.call(this, k); };
      Storage.prototype.setItem = function (k, value) { if (keys.includes(k)) window.runtimeStorageEvent('write', k); return set.call(this, k, value); };
    }, theme);
    const page = await context.newPage(), errors = [], missing = [], requests = [];
    page.on('pageerror', (e) => errors.push(e.message)); page.on('response', (r) => { if (r.url().startsWith(base) && r.status() >= 400) missing.push(r.url()); });
    page.on('request', (r) => requests.push({ method: r.method(), url: r.url() }));
    await open(page); assert.equal(await page.locator('#runtime-export').isDisabled(), true);
    assert.equal(await page.locator('#runtime-proposal-count').innerText(), '0 / 4');
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    await capture(page, `${shots}/initial-${width}-${theme}.png`);
    await step(page); assert.equal(await page.locator('#runtime-dispatch-count').innerText(), '0 / 3');
    await step(page); assert.equal(await page.locator('#runtime-dispatch-count').innerText(), '0 / 3');
    await step(page); assert.match(await page.locator('#runtime-execution-title').innerText(), /已真实执行/);
    assert.equal(await page.locator('#runtime-observations li').count(), 0);
    assert.equal(await page.locator('#runtime-receipt-count').innerText(), '0');
    assert.ok(await page.locator('.runtime-control #runtime-result-jump').isVisible());
    if (width === 390) {
      const jump = await page.locator('#runtime-result-jump').boundingBox();
      assert.ok(jump.y >= 0 && jump.y + jump.height <= 900, 'phone evidence jump stays beside the current action');
      await page.locator('#runtime-result-jump').click();
      assert.ok(await page.locator('#runtime-evidence-title').evaluate((node) => node === document.activeElement));
    }
    await step(page); assert.equal(await page.locator('#runtime-observations li').count(), 1);
    await finish(page); assert.match(await page.locator('#runtime-answer-text').innerText(), /1020\.2 米/);
    assert.ok(await page.locator('#runtime-answer-title').evaluate((node) => node === document.activeElement));
    let data = await report(page);
    assert.equal(data.model_called, false); assert.equal(data.snapshot.status, 'completed');
    assert.equal(data.snapshot.counters.decisions, 3); assert.equal(data.snapshot.counters.dispatch_attempts, 2);
    assert.equal(data.snapshot.catalog.places.length, 6); assert.equal(data.snapshot.catalog.checked, '2026-11-02');
    assert.equal(data.snapshot.catalog.license, 'ODbL-1.0');
    assert.ok(Math.abs(data.snapshot.observations[1].output.result.distance_m - 1020.2255073097381) < 1e-6);
    await capture(page, `${shots}/completed-${width}-${theme}.png`);

    await scenario(page, 'batch', 4, 1); await finish(page); data = await report(page);
    assert.equal(data.snapshot.status, 'budget_exhausted'); assert.equal(data.snapshot.terminal_reason, 'dispatch_budget');
    assert.equal(data.snapshot.counters.decisions, 1); assert.equal(data.snapshot.observations.length, 1);
    assert.equal(data.snapshot.pending_index, 1); assert.equal(data.snapshot.answer, null);
    assert.ok(await page.locator('#runtime-answer').isHidden());
    assert.match(await page.locator('#runtime-terminal').innerText(), /尚未完成/);
    await capture(page, `${shots}/partial-${width}-${theme}.png`);

    await scenario(page, 'receipt'); await step(page, 4);
    assert.match(await page.locator('#runtime-status').innerText(), /run ID/);
    assert.equal(await page.locator('#runtime-observations li').count(), 0);
    assert.equal(await page.locator('#runtime-step').innerText(), '重交当前回执');
    await step(page); assert.equal(await page.locator('#runtime-observations li').count(), 1);
    assert.equal(await page.locator('#runtime-dispatch-count').innerText(), '1 / 3');
    await finish(page); data = await report(page); assert.equal(data.snapshot.counters.receipts_rejected, 1);

    await scenario(page, 'failed-once'); await finish(page); data = await report(page);
    assert.equal(data.snapshot.status, 'completed'); assert.equal(data.snapshot.counters.dispatch_attempts, 3);
    assert.equal(data.snapshot.counters.dispatch_succeeded, 2); assert.equal(data.snapshot.observations[0].status, 'error');
    assert.match(await page.locator('#runtime-observations li').first().innerText(), /模拟错误/);

    await scenario(page, 'forbidden'); await finish(page); data = await report(page);
    assert.equal(data.snapshot.status, 'failed'); assert.equal(data.snapshot.counters.dispatch_attempts, 0);
    assert.equal(data.snapshot.terminal_reason, 'contract_rejected');

    await scenario(page, 'repeat', 1, 8); await finish(page); data = await report(page);
    assert.equal(data.snapshot.terminal_reason, 'decision_budget'); assert.equal(data.snapshot.counters.decisions, 1);
    await scenario(page, 'distance'); await step(page, 3); await page.locator('#runtime-stop').click(); data = await report(page);
    assert.equal(data.snapshot.status, 'cancelled'); assert.equal(data.snapshot.counters.dispatch_succeeded, 1);
    assert.equal(data.snapshot.counters.receipts_accepted, 0); assert.ok(data.snapshot.execution.output);

    await page.fill('#runtime-decisions', '9'); assert.ok(await page.locator('#runtime-export').isDisabled());
    await page.locator('#runtime-apply').click(); assert.match(await page.locator('#runtime-parameters-status').innerText(), /1到8/);
    assert.match(await page.locator('#runtime-phase').innerText(), /已由你停止/);
    await scenario(page, 'distance'); await step(page);
    await page.evaluate(() => { document.getElementById('runtime-dispatches').value = '1'; });
    const downloads = []; page.on('download', (d) => downloads.push(d));
    await page.locator('#runtime-export').click(); assert.equal(downloads.length, 0);
    assert.ok(await page.locator('#runtime-export').isDisabled());
    await scenario(page, 'distance');
    await page.locator('.runtime-source > summary').click();
    const waiting = page.waitForEvent('download'); await page.getByRole('link', { name: '下载完整公开目录 JSON' }).click();
    const source = JSON.parse(await readFile(await (await waiting).path(), 'utf8'));
    assert.equal(source.version, 1); assert.equal(source.places.length, 6); assert.equal(source.coordinateSystem, 'WGS84');
    assert.ok(source.places.every((p) => p.source.startsWith('https://mapcarta.com/')));
    assert.equal(await page.locator('.runtime-source tbody tr').count(), 6);
    await page.locator('.runtime-code > summary').click();
    const pythonWaiting = page.waitForEvent('download'); await page.getByRole('link', { name: '下载 agent_loop.py' }).click();
    const pythonDownload = await pythonWaiting, python = await readFile(await pythonDownload.path(), 'utf8');
    assert.equal(pythonDownload.suggestedFilename(), 'agent_loop.py'); assert.match(python, /def run_agent\(/);
    assert.match(python, /function_call_output/); assert.match(python, /answer_fact_checked/);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.deepEqual(privateReads, []); assert.deepEqual(privateWrites, []);
    assert.ok(requests.every((r) => r.method === 'GET' && new URL(r.url).origin === new URL(base).origin && !r.url.includes('RUNTIME_PRIVATE_SENTINEL')));
    assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    await context.close();
  }
  const foldContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const fold = await foldContext.newPage(); await open(fold);
  const firstAction = await fold.locator('#runtime-step').boundingBox();
  assert.ok(firstAction.y + firstAction.height <= 780, 'initial action fits the actual desktop fold');
  await foldContext.close();
  const context = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'no-preference' });
  const page = await context.newPage(); await open(page);
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); assert.ok(await page.locator('#main').evaluate((node) => node === document.activeElement));
  await page.locator('#runtime-step').focus(); await page.keyboard.press('Enter');
  assert.ok(await page.locator('#runtime-step').evaluate((node) => node === document.activeElement));
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  assert.equal(await page.locator('#runtime-evidence').evaluate((node) => node.getAnimations().filter((a) => a.playState === 'running').length), 0);
  await page.setViewportSize({ width: 768, height: 390 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.setViewportSize({ width: 390, height: 900 }); await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await context.close();
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const native = await nojs.newPage(); await native.goto(base + '/playground/agent-runtime/');
  assert.equal(await native.locator('#runtime-controls').evaluate((node) => node.disabled), true);
  assert.ok(await native.locator('#runtime-step').isDisabled()); assert.ok(await native.locator('#runtime-result-jump').isHidden());
  assert.match(await native.locator('main').innerText(), /正常需要3次提议、2次真实派发/);
  await native.locator('.runtime-source > summary').click(); assert.equal(await native.locator('.runtime-source tbody tr:visible').count(), 6);
  await nojs.close();
  const invalid = await browser.newContext();
  await invalid.route('**/playground/agent-runtime/', async (route) => {
    const response = await route.fetch(); const text = (await response.text()).replace(/(<script type="application\/json" data-runtime-catalog>)[\s\S]*?(<\/script>)/, '$1{"broken":true}$2');
    await route.fulfill({ response, body: text });
  });
  const broken = await invalid.newPage(); await broken.goto(base + '/playground/agent-runtime/');
  await broken.waitForFunction(() => document.getElementById('runtime-status').dataset.error === 'true');
  assert.equal(await broken.locator('#runtime-controls').evaluate((node) => node.disabled), true);
  assert.ok(await broken.locator('#runtime-step').isDisabled()); assert.match(await broken.locator('#runtime-status').innerText(), /交互未启用/);
  assert.equal(await broken.evaluate((key) => localStorage.getItem(key), key), null); await invalid.close();
  console.log('PASS runtime: all six scripted scenarios, actual GIS execution/1020.2m/source, separate proposal/dispatch/receipt, partial budgets, simulated retry, old-run rejection, forbidden/cancelled/stale controls, complete downloads, 390/768/1440×themes, axe/keyboard/reduced-motion/320/short/200% text, no-JS, bad catalog and no private reads/writes/uploads');
} finally { await browser.close(); }
