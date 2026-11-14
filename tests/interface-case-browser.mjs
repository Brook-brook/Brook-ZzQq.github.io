import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { interfaceCaseInputs, validateInterfaceCase } from '../tools/interface-case.mjs';
const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.INTERFACE_CASE_SHOT_DIR || 'work/interface-case';
await mkdir(shots, { recursive: true });
const expected = await interfaceCaseInputs();
const saved = JSON.parse(await readFile('assets/examples/agent-interface-case.json', 'utf8'));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const accesses = [], requests = [], errors = [];
    await context.exposeFunction('casePrivateAccess', (key) => accesses.push(key));
    await context.addInitScript((theme) => {
      localStorage.setItem('atlas-theme', theme);
      for (const method of ['getItem', 'setItem', 'removeItem']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (key, ...rest) {
          if (['brooks-universe.learning.v1', 'brooks-universe.observatory.v1'].includes(key)) window.casePrivateAccess(method + ':' + key);
          return original.call(this, key, ...rest);
        };
      }
    }, theme);
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    await page.goto(base + '/knowledge/agent-testing-contracts/');
    await page.getByRole('link', { name: '同一距离，三层证据', exact: true }).click();
    await page.waitForURL(base + '/knowledge/agent-interface-evidence/');
    assert.ok(requests.every((request) => !request.url.includes('agent-interface-case.json') && !request.url.endsWith('.zip')), 'reference stays lazy until explicit download');
    assert.match(await page.locator('.prose').innerText(), /1020.225507/);
    assert.equal(await page.locator('#note-learning-questions').count(), 0, 'supplement has no invented journal question');
    assert.ok((await page.getByRole('link', { name: '既有验收题', exact: true }).getAttribute('href')).endsWith('/study/practice/#agent-build-acceptance'));
    const region = page.getByRole('group', { name: '三条路径比较，可横向滚动', exact: true });
    if (width === 390) {
      await region.focus(); await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => document.querySelector('.note-evidence-scroll').scrollLeft > 0);
      assert.ok(await region.evaluate((node) => node === document.activeElement && parseFloat(getComputedStyle(node).outlineWidth) >= 2));
    }
    const waiting = page.waitForEvent('download'); await page.getByRole('link', { name: '下载公开案例记录', exact: true }).click();
    const download = await waiting; assert.equal(download.suggestedFilename(), 'brook-agent-interface-case.json');
    const actual = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.deepEqual(actual, saved); validateInterfaceCase(actual, expected);
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${shots}/case-${width}-${theme}.png`, fullPage: true });
    if (width === 390) {
      const before = await page.locator('.prose p').first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
      await page.evaluate(() => {
        const sizes = [...document.querySelectorAll('.prose, .prose *')].map((node) => [node, parseFloat(getComputedStyle(node).fontSize)]);
        for (const [node, size] of sizes) node.style.fontSize = `${size * 2}px`;
      });
      assert.equal(await page.locator('.prose p').first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize)), before * 2);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    assert.deepEqual(accesses, []); assert.deepEqual(errors, []);
    assert.ok(requests.every((request) => request.method === 'GET' && new URL(request.url).origin === new URL(base).origin));
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 }, acceptDownloads: true });
  const page = await context.newPage(); await page.goto(base + '/knowledge/agent-interface-evidence/');
  await page.getByRole('link', { name: '下载公开案例记录', exact: true }).focus();
  assert.ok(await page.getByRole('link', { name: '下载公开案例记录', exact: true }).evaluate((node) => node === document.activeElement));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const comparison = page.locator('.prose table:not([role="presentation"])');
  assert.equal(await comparison.count(), 1, 'one semantic comparison, distinct from Rouge code layout');
  assert.deepEqual(await comparison.locator('thead th').allTextContents(), ['路径', '本次整段CLI实际记录', '不能据此推断什么']);
  assert.equal(await comparison.locator('tbody > tr').count(), 3);
  const region = page.getByRole('group', { name: '三条路径比较，可横向滚动', exact: true });
  await page.keyboard.press('Tab');
  assert.ok(await region.evaluate((node) => node === document.activeElement), 'native Tab moves from the preceding download to the scroll group');
  await region.scrollIntoViewIfNeeded(); await page.keyboard.press('ArrowRight');
  // No page timers/rAF in this script-disabled context. The Node test runner
  // checks the real native scroll; it neither sets scrollLeft nor executes UI code.
  let left = await region.evaluate((node) => node.scrollLeft);
  for (let attempt = 0; attempt < 40 && left === 0; attempt++) {
    await delay(50); left = await region.evaluate((node) => node.scrollLeft);
  }
  assert.ok(left > 0, 'native ArrowRight really scrolls with page scripts disabled');
  assert.ok(await region.evaluate((node) => node === document.activeElement));
  await context.close();
  console.log('PASS interface case: actual saved-evidence JSON download, no automatic collection/private access, linked existing acceptance question, 390/768/1440×themes, axe/no-JS/320, real ArrowRight table scroll/focus and2×prose text; honest differing counters');
} finally { await browser.close(); }
