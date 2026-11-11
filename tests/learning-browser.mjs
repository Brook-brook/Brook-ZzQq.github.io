import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { LEARNING_KEY, MAX_BACKUP_BYTES } from '../assets/js/atlas/learning-models.js';

const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.LEARNING_SHOT_DIR || 'work/iteration8/learning';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'),
  args: ['--no-sandbox'], headless: true
});
const first = (page) => page.locator('[data-learning-step="python-values"]');
const second = (page) => page.locator('[data-learning-step="rss-records"]');
const keyState = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), LEARNING_KEY);
async function open(page) {
  assert.ok((await page.goto(base + '/study/paths/')).ok());
  await page.locator('[data-step-complete]').first().waitFor({ state: 'visible' });
}
async function importFile(page, data, name = 'backup.json') {
  await page.locator('#learning-import').setInputFiles({
    name, mimeType: 'application/json', buffer: Buffer.from(typeof data === 'string' ? data : JSON.stringify(data))
  });
}
async function backup(page) {
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#learning-export')]);
  assert.equal(download.suggestedFilename(), 'brooks-learning-backup.json');
  return JSON.parse(await readFile(await download.path(), 'utf8'));
}
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript((value) => localStorage.setItem('atlas-theme', value), theme);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400 && new URL(response.url()).origin === new URL(base).origin) errors.push(response.url());
    });
    await open(page);
    assert.equal(await page.locator('#primary-nav [aria-current="page"]').innerText(), 'Study');
    assert.equal(await page.locator('[data-learning-path]').count(), 4);
    assert.equal(await page.locator('[data-learning-step]').count(), 9);
    assert.match(await page.locator('#learning-progress').innerText(), /0 \/ 9/);
    assert.equal(await keyState(page), null, 'merely opening a page does not create progress');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map((v) => v.id), [], `axe ${width} ${theme}`);
    assert.ok(await first(page).locator('textarea').evaluate((node) => parseFloat(getComputedStyle(node).fontSize) >= 16));
    await page.screenshot({ path: `${shots}/paths-${width}-${theme}.png`, fullPage: true });

    if (width === 390 && theme === 'dark') {
      await page.goto(base + '/knowledge/python-first-steps/');
      assert.ok(await page.locator('nav[aria-label="相关学习路线"] a[href$="#python-values"]').isVisible());
      assert.equal(await keyState(page), null, 'reading alone never marks completion');
      await page.goto(base + '/playground/python/');
      assert.ok(await page.locator('.learning-related a[href$="#python-values"]').isVisible());
      assert.equal(await keyState(page), null, 'opening a lab never invents progress');
      await open(page);
    }
    await first(page).locator('[data-step-complete]').focus();
    await page.keyboard.press('Space');
    assert.match(await page.locator('#learning-progress').innerText(), /1 \/ 9/);
    await first(page).locator('summary').click();
    await page.evaluate(() => {
      window.learningStatusChanges = 0;
      window.learningStatusObserver = new MutationObserver(() => { window.learningStatusChanges++; });
      for (const id of ['learning-progress', 'learning-storage']) {
        window.learningStatusObserver.observe(document.getElementById(id), { childList: true, characterData: true, subtree: true });
      }
    });
    await first(page).locator('textarea').fill('我能解释空列表与正常输出。<img src=x onerror=alert(1)>');
    assert.equal(await page.evaluate(() => {
      window.learningStatusObserver.disconnect();
      return window.learningStatusChanges;
    }), 0, 'typing a note must not rewrite unchanged live announcements');
    const saved = await keyState(page);
    assert.equal(saved.entries['python-values'].completed, true);
    await page.reload();
    assert.equal(await first(page).locator('[data-step-complete]').isChecked(), true);
    assert.equal(await first(page).locator('textarea').inputValue(), saved.entries['python-values'].note);
    assert.equal(await page.locator('#learning-continue').getAttribute('href'), '#rss-records');
    await page.waitForLoadState('networkidle');
    const actionRequests = [];
    page.on('request', (request) => { if (request.url().startsWith('http')) actionRequests.push(request.url()); });
    assert.deepEqual(await backup(page), saved);
    assert.equal(await page.locator('[onerror]').count(), 0);

    await importFile(page, { version: 2, entries: {} });
    await page.waitForFunction(() => document.getElementById('learning-backup-feedback').textContent.includes('版本'));
    assert.deepEqual(await keyState(page), saved);
    await importFile(page, 'x'.repeat(MAX_BACKUP_BYTES + 1));
    await page.waitForFunction(() => document.getElementById('learning-backup-feedback').textContent.includes('256 KB'));
    await importFile(page, { version: 1, entries: {
      'python-values': { completed: true, note: 'an older conflicting note' },
      'rss-records': { completed: true, note: 'Imported explanation' }
    } });
    await page.locator('#learning-import-preview').waitFor({ state: 'visible' });
    assert.match(await page.locator('#learning-import-summary').innerText(), /可补入 1 条/);
    assert.deepEqual(await keyState(page), saved, 'preview never writes');
    await page.click('#learning-import-confirm');
    assert.match(await page.locator('#learning-backup-feedback').innerText(), /已补入 1 条记录并保存在当前浏览器/);
    assert.match(await page.locator('#learning-progress').innerText(), /2 \/ 9/);
    const merged = await keyState(page);
    assert.equal(merged.entries['python-values'].note, saved.entries['python-values'].note);
    assert.equal(await second(page).locator('[data-step-complete]').isChecked(), true);
    assert.equal(merged.entries['rss-records'].note, 'Imported explanation');

    await importFile(page, { version: 1, entries: { 'source-evidence': { completed: true, note: 'Cancel me' } } });
    await page.locator('#learning-import-preview').waitFor({ state: 'visible' });
    await page.click('#learning-import-cancel');
    assert.deepEqual(await keyState(page), merged);
    await page.evaluate(() => localStorage.setItem('learning-test-other-feature', 'keep-me'));
    await page.locator('.learning-reset summary').click();
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.click('#learning-clear');
    assert.deepEqual(await keyState(page), merged);
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('#learning-clear');
    assert.equal(await keyState(page), null);
    assert.match(await page.locator('#learning-progress').innerText(), /0 \/ 9/);
    assert.equal(await page.evaluate(() => localStorage.getItem('learning-test-other-feature')), 'keep-me');
    assert.equal(await page.evaluate(() => localStorage.getItem('atlas-theme')), theme);
    assert.deepEqual(actionRequests, [], 'saving, import and export do not upload or fetch');
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS learning ${width} ${theme}: axe, manual-only progress, reload, backup, preview/merge/cancel, reset and privacy`);
  }

  for (const mode of ['blocked', 'corrupt', 'quota']) {
    const context = await browser.newContext();
    await context.addInitScript(({ key, mode }) => {
      if (mode === 'corrupt') localStorage.setItem(key, '{broken');
      const get = Storage.prototype.getItem;
      const set = Storage.prototype.setItem;
      Storage.prototype.getItem = function (name) {
        if (mode === 'blocked' && name === key) throw new DOMException('Denied', 'SecurityError');
        return get.call(this, name);
      };
      Storage.prototype.setItem = function (name, value) {
        if ((mode === 'blocked' || mode === 'quota') && name === key) throw new DOMException('Full', 'QuotaExceededError');
        return set.call(this, name, value);
      };
    }, { key: LEARNING_KEY, mode });
    const page = await context.newPage();
    await open(page);
    await first(page).locator('[data-step-complete]').check();
    assert.match(await page.locator('#learning-storage').innerText(), /暂存|无法写入/);
    assert.match(await page.locator('#learning-progress').innerText(), /1 \/ 9/);
    assert.equal((await backup(page)).entries['python-values'].completed, true);
    const warning = await page.locator('#learning-storage').innerText();
    await importFile(page, { version: 2, entries: {} });
    await page.waitForFunction(() => document.getElementById('learning-backup-feedback').textContent.includes('版本'));
    assert.equal(await page.locator('#learning-storage').innerText(), warning, 'an import error must not hide a storage warning');
    await importFile(page, { version: 1, entries: { 'rss-records': { completed: true, note: 'Memory-only imported note' } } });
    await page.locator('#learning-import-preview').waitFor({ state: 'visible' });
    await page.click('#learning-import-confirm');
    assert.match(await page.locator('#learning-backup-feedback').innerText(), /当前无法保存/);
    assert.equal((await backup(page)).entries['rss-records'].note, 'Memory-only imported note');
    if (mode === 'corrupt') assert.equal(await page.evaluate((key) => localStorage.getItem(key), LEARNING_KEY), '{broken');
    await context.close();
    console.log(`PASS learning storage ${mode}: no false durable-save claim, memory/export remain usable`);
  }

  const multi = await browser.newContext();
  const a = await multi.newPage(); const b = await multi.newPage();
  await open(a); await open(b);
  await first(a).locator('[data-step-complete]').check();
  await b.waitForFunction(() => document.getElementById('learning-storage').textContent.includes('标签页'));
  await second(b).locator('[data-step-complete]').check();
  const protectedState = await keyState(a);
  assert.equal(protectedState.entries['python-values'].completed, true);
  assert.equal(protectedState.entries['rss-records'], undefined);
  assert.equal((await backup(b)).entries['rss-records'].completed, true);
  await multi.close();
  console.log('PASS learning multiple tabs: external changes pause saving rather than silently overwrite');

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const page = await nojs.newPage();
  await page.goto(base + '/study/paths/');
  assert.equal(await page.locator('[data-learning-step]').count(), 9);
  assert.equal(await page.locator('.learning-question:visible').count(), 9);
  assert.equal(await page.locator('[data-learning-controls]:visible').count(), 0);
  assert.ok(await page.locator('noscript').isVisible());
  assert.ok((await page.locator('.learning-steps a[href]').count()) >= 9);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await nojs.close();
  console.log('PASS learning no-JS: routes, real resources and questions readable without fake controls');
} finally { await browser.close(); }
