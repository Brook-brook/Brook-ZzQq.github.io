import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';

const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.RECOVERY_SHOT_DIR || 'work/recovery-learning';
await mkdir(shots, { recursive: true });
const expected = JSON.parse(await readFile('assets/examples/agent-restart.manifest.json', 'utf8'));
const evidence = JSON.parse(await readFile('assets/examples/agent-restart-case.json', 'utf8'));
async function termStaysOnOneLine(page) {
  return page.locator('.note-main h1').evaluate((heading) => {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT), positions = [];
    let node, text = '';
    while ((node = walker.nextNode())) {
      text += node.textContent;
      for (let offset = 0; offset < node.textContent.length; offset++) positions.push({ node, offset });
    }
    const start = text.indexOf('回执');
    if (start < 0) return false;
    const tops = [start, start + 1].map((i) => {
      const range = document.createRange(), { node, offset } = positions[i];
      range.setStart(node, offset); range.setEnd(node, offset + 1); return range.getBoundingClientRect().top;
    });
    return Math.abs(tops[0] - tops[1]) < 1;
  });
}
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const accesses = [], requests = [], errors = [];
    await context.exposeFunction('recoveryPrivateAccess', (name) => accesses.push(name));
    await context.addInitScript((theme) => {
      localStorage.setItem('atlas-theme', theme);
      for (const method of ['getItem', 'setItem', 'removeItem']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (name, ...rest) {
          if (['brooks-universe.learning.v1', 'brooks-universe.observatory.v1'].includes(name)) window.recoveryPrivateAccess(method + ':' + name);
          return original.call(this, name, ...rest);
        };
      }
    }, theme);
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    await page.goto(base + '/study/ai/');
    await page.getByRole('link', { name: '本机运行说明', exact: true }).click();
    await page.waitForURL(base + '/knowledge/agent-state-recovery/#run');
    await page.goto(base + '/knowledge/agent-state-recovery/');
    assert.equal((await page.locator('.note-main h1').textContent()).trim(), '重启之后，回执还在吗？');
    assert.ok(await termStaysOnOneLine(page), 'the heading keeps its short key term together');
    const link = page.getByRole('link', { name: '下载重启恢复练习', exact: true });
    assert.ok(await link.evaluate((node) => node.getBoundingClientRect().bottom <= innerHeight));
    const waiting = page.waitForEvent('download'); await link.click();
    const download = await waiting, bytes = await readFile(await download.path());
    assert.equal(download.suggestedFilename(), 'brook-agent-restart.zip');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.archive.sha256);
    assert.equal(bytes.length, expected.archive.bytes);
    const recordWaiting = page.waitForEvent('download');
    await page.getByRole('link', { name: '下载这次实际运行记录', exact: true }).click();
    const record = await recordWaiting;
    assert.equal(record.suggestedFilename(), 'brook-agent-restart-case.json');
    assert.deepEqual(JSON.parse(await readFile(await record.path(), 'utf8')), evidence);
    assert.equal(await page.locator('.note-evidence-scroll table tbody > tr').count(), 6);
    assert.equal(await page.locator('.note-evidence-scroll table th').count(), 3);
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${shots}/article-${width}-${theme}.png`, fullPage: true });
    assert.deepEqual(accesses, []); assert.deepEqual(errors, []);
    assert.ok(requests.every((request) => request.method === 'GET' && new URL(request.url).origin === new URL(base).origin), 'reading never starts a DB/child process, loads an interpreter or reads/uploads a journal');
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 } });
  const page = await context.newPage(); await page.goto(base + '/knowledge/agent-state-recovery/');
  const table = page.getByRole('group', { name: '进程退出与事务结果，可横向滚动', exact: true });
  await table.focus(); assert.ok(await table.evaluate((node) => node === document.activeElement));
  await page.keyboard.press('ArrowRight');
  // Node-side polling works even when page JavaScript/rAF is intentionally off.
  let moved = false;
  for (let i = 0; i < 20; i++) {
    if (await table.evaluate((node) => node.scrollLeft > 0)) { moved = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.ok(moved, 'native no-JS keyboard scroll reaches the recovery evidence');
  assert.ok(await page.getByRole('link', { name: '下载重启恢复练习', exact: true }).isVisible());
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${shots}/no-js-320.png`, fullPage: true }); await context.close();

  const textContext = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce' });
  const textPage = await textContext.newPage(); await textPage.goto(base + '/knowledge/agent-state-recovery/');
  const before = await textPage.locator('.prose p').first().evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
  await textPage.evaluate(() => {
    const sizes = [...document.querySelectorAll('.prose, .prose *')].map((node) => [node, Number.parseFloat(getComputedStyle(node).fontSize)]);
    for (const [node, size] of sizes) node.style.setProperty('font-size', `${size * 2}px`, 'important');
  });
  assert.equal(await textPage.locator('.prose p').first().evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize)), before * 2, 'actual prose is doubled; this is not full browser zoom');
  assert.ok(await textPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await textPage.screenshot({ path: `${shots}/text-double-320.png`, fullPage: true }); await textContext.close();
  for (const theme of ['dark', 'light']) {
    const headingContext = await browser.newContext({ viewport: { width: 375, height: 800 }, reducedMotion: 'reduce' });
    await headingContext.addInitScript((theme) => localStorage.setItem('atlas-theme', theme), theme);
    const headingPage = await headingContext.newPage(); await headingPage.goto(base + '/knowledge/agent-state-recovery/');
    for (const width of [320, 375, 390]) {
      await headingPage.setViewportSize({ width, height: 800 });
      for (const scale of [1, 2]) {
        await headingPage.evaluate((scale) => document.documentElement.style.fontSize = `${16 * scale}px`, scale);
        assert.ok(await termStaysOnOneLine(headingPage), `key heading term stays intact at${width}/${scale}×DOM font`);
        assert.ok(await headingPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await headingPage.locator('.note-main h1').scrollIntoViewIfNeeded();
        await headingPage.screenshot({ path: `${shots}/heading-${width}-${scale}-${theme}.png` });
      }
    }
    await headingContext.close();
  }
  console.log('PASS recovery learning: native AI entry, exact ZIP/hash and actual saved-evidence JSON download, six documented cases with semantic table, no private reads/implicit runtime/network writes; 390/768/1440×themes, axe/no-JS/320 native ArrowRight and doubled DOM text (not full zoom). Real SQLite/child processes tested separately.');
} finally { await browser.close(); }
