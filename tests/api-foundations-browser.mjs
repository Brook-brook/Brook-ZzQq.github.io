import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { expectedLearningIds } from './expected-learning.mjs';

const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.API_FOUNDATIONS_SHOT_DIR || 'work/api-foundations';
await mkdir(shots, { recursive: true });
const core = (await readFile('_includes/api-foundations/json_contracts.py', 'utf8')).trim();
const cases = (await readFile('_includes/api-foundations/json_cases.py', 'utf8')).trim();
const expected = JSON.parse(await readFile('assets/examples/api-foundations.manifest.json', 'utf8'));
const journalKey = 'brooks-universe.learning.v1';
// This committed historical fixture must remain independent of today's route YAML.
const legacyRaw = await readFile('tests/fixtures/learning-v1-38.json', 'utf8');
const legacy = JSON.parse(legacyRaw), currentIds = await expectedLearningIds();
const newIds = ['api-json-types', 'api-http-layers', 'api-timeout-unknown', 'api-idempotency-payload', 'agent-state-transaction', 'agent-state-recovery'];
assert.equal(Object.keys(legacy.entries).length, 38);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const accesses = [], requests = [], errors = [];
    await context.exposeFunction('apiPrivateAccess', (name) => accesses.push(name));
    await context.addInitScript((theme) => {
      localStorage.setItem('atlas-theme', theme);
      for (const method of ['getItem', 'setItem', 'removeItem']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (name, ...rest) {
          if (['brooks-universe.learning.v1', 'brooks-universe.observatory.v1'].includes(name)) window.apiPrivateAccess(method + ':' + name);
          return original.call(this, name, ...rest);
        };
      }
    }, theme);
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    await page.goto(base + '/knowledge/python-json-contracts/');
    assert.ok(await page.locator('[data-note-download] a').evaluate((node) => node.getBoundingClientRect().bottom <= innerHeight), 'actual starter is discoverable in the initial viewport');
    const waiting = page.waitForEvent('download'); await page.getByRole('link', { name: '下载 API 基础练习', exact: true }).click();
    const download = await waiting, bytes = await readFile(await download.path());
    assert.equal(download.suggestedFilename(), 'brook-api-foundations.zip');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.archive.sha256);
    assert.equal(bytes.length, expected.archive.bytes);
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    await page.screenshot({ path: `${shots}/json-note-${width}-${theme}.png`, fullPage: true });
    await page.getByRole('link', { name: '打开对应实验', exact: true }).click();
    await page.waitForURL(base + '/playground/python/#json-contracts');
    assert.equal(await page.locator('#python-example').inputValue(), 'json', 'the article-end action selects its own lesson, never an unrelated default');
    await page.goBack();
    await page.getByRole('link', { name: '预选JSON例子的Python实验', exact: true }).click();
    await page.waitForURL(base + '/playground/python/#json-contracts');
    assert.equal(await page.locator('#python-example').inputValue(), 'json');
    const source = await page.locator('#python-code').inputValue();
    assert.ok(source.includes(core) && source.includes(cases), 'the exact original core and fixtures are rendered safely, not a second parser');
    assert.ok(await page.locator('#python-load').isEnabled()); assert.ok(await page.locator('#python-run').isDisabled());
    for (const id of ['basics', 'loops', 'dict', 'async', 'json']) {
      await page.selectOption('#python-example', id); assert.ok((await page.locator('#python-code').inputValue()).trim());
    }
    await page.locator('#python-code').fill('print("synthetic temporary edit")'); await page.locator('#python-reset').click();
    assert.ok((await page.locator('#python-code').inputValue()).includes(core));
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${shots}/json-python-${width}-${theme}.png`, fullPage: true });
    await page.goto(base + '/knowledge/http-response-boundaries/');
    assert.equal(await page.locator('.note-evidence-scroll table tbody > tr').count(), 4);
    assert.equal(await page.locator('.note-evidence-scroll table th').count(), 3);
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${shots}/http-note-${width}-${theme}.png`, fullPage: true });
    assert.deepEqual(accesses, []); assert.deepEqual(errors, []);
    assert.ok(requests.every((request) => request.method === 'GET' && new URL(request.url).origin === new URL(base).origin), 'public preset does not fetch an interpreter, call localhost HTTP fixtures or upload anything');
    await context.close();
  }
  for (const route of ['paths', 'practice']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    await context.addInitScript(({ journalKey, legacyRaw }) => { if (localStorage.getItem(journalKey) === null) localStorage.setItem(journalKey, legacyRaw); }, { journalKey, legacyRaw });
    const page = await context.newPage(); await page.goto(base + `/study/${route}/#api-json-types`);
    await page.waitForFunction(() => !document.getElementById('learning-export').closest('[hidden]'));
    assert.equal(await page.locator('[data-learning-step]').count(), currentIds.steps.length);
    assert.deepEqual(await page.locator('[data-learning-step]').evaluateAll((nodes) => nodes.map((node) => node.dataset.learningStep)), currentIds.steps);
    assert.equal(await page.evaluate((journalKey) => localStorage.getItem(journalKey), journalKey), legacyRaw, 'opening new content leaves all original raw bytes intact');
    let waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    assert.deepEqual(JSON.parse(await readFile(await (await waiting).path(), 'utf8')), legacy);
    assert.equal(await page.evaluate((journalKey) => localStorage.getItem(journalKey), journalKey), legacyRaw, 'export alone must not rewrite legacy storage');
    for (const id of newIds) {
      await page.goto(base + `/study/${route}/#${id}`);
      const step = page.locator(`[data-learning-step="${id}"]`); await step.waitFor({ state: 'visible' });
      if (route === 'paths') await step.locator('.learning-entry summary').click();
      await step.locator('textarea').fill(`Synthetic explicit ${id}: <literal> 🪻`);
      await step.locator('[data-step-complete]').check();
    }
    waiting = page.waitForEvent('download'); await page.locator('#learning-export').click();
    const extended = JSON.parse(await readFile(await (await waiting).path(), 'utf8'));
    for (const [id, entry] of Object.entries(legacy.entries)) assert.deepEqual(extended.entries[id], entry);
    assert.equal(Object.keys(extended.entries).length, 44);
    for (const id of newIds) assert.deepEqual(extended.entries[id], { completed: true, note: `Synthetic explicit ${id}: <literal> 🪻` });
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 } });
  const page = await context.newPage();
  await page.goto(base + '/knowledge/python-json-contracts/');
  await page.getByRole('link', { name: '下载 API 基础练习', exact: true }).focus();
  assert.ok(await page.getByRole('link', { name: '下载 API 基础练习', exact: true }).evaluate((node) => node === document.activeElement));
  await page.goto(base + '/playground/python/#json-contracts');
  assert.ok(await page.locator('#python-load').isDisabled()); assert.ok(await page.locator('#python-example').isDisabled());
  assert.equal(await page.locator('#python-code').isEditable(), false);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await context.close();
  console.log('PASS API foundations: actual ZIP/hash and native reading, shared JSON source/preset, all five choices/reset, original38 exact raw/export and explicit-only44 extension on paths/practice, no implicit interpreter/HTTP/private-store access, 390/768/1440×themes, axe/keyboard/no-JS/320; actual Python/HTTP run separately');
} finally { await browser.close(); }
