import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { expectNativeHorizontalScroll } from './native-scroll.mjs';

const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.NEURAL_SHOT_DIR || 'work/neural-learning';
const core = (await readFile('_includes/neural-basics/neural.py', 'utf8')).trim();
const manifest = JSON.parse(await readFile('assets/examples/neural-basics.manifest.json', 'utf8'));
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const accesses = [], requests = [], errors = [], missing = [];
    await context.exposeFunction('neuralPrivateAccess', (name) => accesses.push(name));
    await context.addInitScript((theme) => {
      localStorage.setItem('atlas-theme', theme);
      for (const method of ['getItem', 'setItem', 'removeItem']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (key, ...rest) {
          if (['brooks-universe.learning.v1', 'brooks-universe.observatory.v1'].includes(key)) window.neuralPrivateAccess(method + ':' + key);
          return original.call(this, key, ...rest);
        };
      }
    }, theme);
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    page.on('response', (response) => { if (response.status() >= 400) missing.push(response.url()); });
    await page.goto(base + '/knowledge/neural-chain-rule/');
    assert.equal((await page.locator('.note-main h1').innerText()).replace(/\s/g, ''), '从形状，走到链式梯度');
    assert.equal(await page.locator('.note-evidence-scroll table tbody > tr').count(), 4);
    assert.equal(await page.locator('[data-note-question="neural-chain-rule"]').count(), 1);
    const link = page.getByRole('link', { name: '下载原创链式梯度练习', exact: true });
    assert.ok(await link.evaluate((node) => node.getBoundingClientRect().bottom <= innerHeight), 'the genuine project is discoverable in the initial viewport');
    const waiting = page.waitForEvent('download'); await link.click();
    const download = await waiting, bytes = await readFile(await download.path());
    assert.equal(download.suggestedFilename(), 'brook-neural-basics.zip');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.archive.sha256);
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${shots}/article-${width}-${theme}.png`, fullPage: true });
    await page.locator('.note-end a').filter({ hasText: '打开对应实验' }).click();
    await page.waitForURL(base + '/playground/python/#neural-gradients');
    assert.equal(await page.locator('#python-example').inputValue(), 'neural');
    assert.ok((await page.locator('#python-code').inputValue()).includes(core), 'the canonical original core is rendered, escaped and selected');
    assert.ok(await page.locator('#python-load').isEnabled()); assert.ok(await page.locator('#python-run').isDisabled());
    await page.goBack();
    await page.getByRole('link', { name: '预选链式梯度的Python实验', exact: true }).click();
    await page.waitForURL(base + '/playground/python/#neural-gradients');
    assert.equal(await page.locator('#python-example').inputValue(), 'neural');
    for (const id of ['basics', 'loops', 'dict', 'async', 'json', 'neural']) {
      await page.selectOption('#python-example', id); assert.ok((await page.locator('#python-code').inputValue()).trim());
    }
    await page.locator('#python-code').fill('print("synthetic draft")'); await page.locator('#python-reset').click();
    assert.ok((await page.locator('#python-code').inputValue()).includes(core));
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${shots}/python-${width}-${theme}.png`, fullPage: true });
    assert.deepEqual(accesses, []); assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    assert.ok(requests.every((r) => r.method === 'GET' && new URL(r.url).origin === new URL(base).origin), 'reading and preselection start no interpreter, model or private-state access');
    await context.close();
  }
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 } });
  const page = await nojs.newPage(); await page.goto(base + '/knowledge/neural-chain-rule/');
  const table = page.getByRole('group', { name: '小网络的形状与九个参数，可横向滚动', exact: true });
  await expectNativeHorizontalScroll(page, table);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${shots}/no-js-320.png`, fullPage: true }); await nojs.close();
  const large = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce' });
  const largePage = await large.newPage(); await largePage.goto(base + '/knowledge/neural-chain-rule/');
  const before = await largePage.locator('.prose p').first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
  await largePage.evaluate(() => {
    const sizes = [...document.querySelectorAll('.prose, .prose *')].map((node) => [node, parseFloat(getComputedStyle(node).fontSize)]);
    document.documentElement.style.fontSize = '32px';
    for (const [node, size] of sizes) node.style.setProperty('font-size', size * 2 + 'px', 'important');
  });
  assert.equal(await largePage.locator('.prose p').first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize)), before * 2);
  assert.ok(await largePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await largePage.screenshot({ path: `${shots}/double-text-320.png`, fullPage: true }); await large.close();
  console.log('PASS neural learning: exact eight-entry ZIP, canonical sixth source and both native presets, six choices/reset without implicit run,390/768/1440×themes, axe/no-JS/320/native keyboard table/doubled DOM text; no private access or runtime request. Actual Pyodide is tested separately.');
} finally { await browser.close(); }
