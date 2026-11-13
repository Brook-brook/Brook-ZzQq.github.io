import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { LEARNING_KEY } from '../assets/js/atlas/learning-models.js';
const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.PRACTICE_SHOT_DIR || 'work/practice';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
const selected = (page) => page.locator('[data-learning-step]:visible');
const state = (page) => page.evaluate((key) => localStorage.getItem(key), LEARNING_KEY);
async function open(page, fragment = '') {
  assert.ok((await page.goto(base + '/study/practice/' + fragment)).ok());
  await page.waitForFunction(() => document.querySelector('[data-practice-workspace]')?.dataset.practiceReady === 'true');
}
async function exportState(page) {
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#learning-export').click()]);
  assert.equal(download.suggestedFilename(), 'brooks-learning-backup.json');
  return JSON.parse(await readFile(await download.path(), 'utf8'));
}
async function importState(page, snapshot) {
  await page.locator('#learning-import').setInputFiles({ name: 'practice-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(snapshot)) });
  await page.locator('#learning-import-preview').waitFor({ state: 'visible' });
}
async function axe(page, label) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(';')}`), [], label);
}
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    await context.addInitScript((theme) => {
      localStorage.setItem('atlas-theme', theme);
      localStorage.setItem('atlas-campus-favorites-v1', '["library"]');
      localStorage.setItem('brooks-universe.observatory.v1', 'PRIVATE_OTHER_FEATURE');
    }, theme);
    const page = await context.newPage();
    const errors = [], missing = [], requests = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => { if (r.url().startsWith(base) && r.status() >= 400) missing.push(r.url()); });
    page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
    await open(page);
    assert.equal(await page.locator('[data-learning-step]').count(), 18);
    assert.equal(await selected(page).count(), 1);
    assert.equal(await selected(page).getAttribute('id'), 'python-values');
    assert.equal(await state(page), null);
    assert.match(await page.locator('#practice-status').innerText(), /18 个匹配/);
    assert.equal(await page.locator('#primary-nav [aria-current="page"]').innerText(), 'Study');
    await selected(page).locator('[data-practice-hint] summary').click();
    await selected(page).locator('[data-practice-reference] summary').click();
    assert.match(await selected(page).locator('[data-practice-reference]').innerText(), /ValueError/);
    assert.equal(await state(page), null, 'hints/references never create learning records');
    await page.selectOption('#practice-pick', 'classification-denominators');
    assert.equal(await selected(page).getAttribute('id'), 'classification-denominators');
    assert.ok(await selected(page).locator('h3').evaluate((node) => node === document.activeElement));
    assert.equal(new URL(page.url()).hash, '#classification-denominators', 'explicit selection replaces only the public question fragment');
    await selected(page).locator('a[href*="/playground/evaluation/"]').click();
    await page.waitForFunction(() => !document.getElementById('evaluation-controls').disabled);
    assert.equal(await state(page), null, 'visiting a lab does not invent progress');
    await page.goBack(); await page.reload();
    await page.waitForFunction(() => document.querySelector('[data-practice-workspace]')?.dataset.practiceReady === 'true');
    assert.equal(await selected(page).getAttribute('id'), 'classification-denominators', 'lab/back/reload preserves the public worksheet context');
    assert.equal(await state(page), null);
    await axe(page, `practice ${width} ${theme}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(await selected(page).locator('textarea').evaluate((node) => parseFloat(getComputedStyle(node).fontSize) >= 16));
    await page.evaluate(() => scrollTo(0, 0));
    assert.ok(await selected(page).locator('h3').evaluate((node) => node.getBoundingClientRect().bottom <= innerHeight), 'the current question heading is visible in the first viewport');
    await page.screenshot({ path: `${shots}/default-${width}-${theme}.png`, fullPage: true });
    const note = 'PRACTICE_PRIVATE_SENTINEL 召回 <img src=x onerror=window.practiceXss=1>\n我还需要核对分母。';
    await selected(page).locator('textarea').fill(note);
    const saved = JSON.parse(await state(page));
    assert.deepEqual(saved.entries['classification-denominators'], { completed: false, note });
    await selected(page).locator('textarea').focus(); await page.keyboard.press('Control+k');
    assert.ok(await page.locator('#site-search-dialog').evaluate((node) => !node.open));
    await page.locator('.practice-filters > summary').click();
    await page.locator('#practice-query').fill('unmatched-local-query');
    assert.match(await page.locator('#practice-status').innerText(), /0 个匹配/);
    assert.equal(await selected(page).getAttribute('id'), 'classification-denominators');
    assert.equal(await selected(page).locator('textarea').inputValue(), note);
    assert.ok(await page.locator('#practice-next').isDisabled());
    assert.equal(await state(page), JSON.stringify(saved));
    await page.locator('#practice-query').fill('PRACTICE_PRIVATE_SENTINEL');
    assert.match(await page.locator('#practice-status').innerText(), /1 个匹配/);
    const beforeComposition = await page.locator('#practice-status').innerText();
    await page.locator('#practice-query').evaluate((node) => {
      node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      node.value = 'composition-not-a-match';
      node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    });
    assert.equal(await page.locator('#practice-status').innerText(), beforeComposition);
    await page.locator('#practice-query').evaluate((node) => node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
    assert.match(await page.locator('#practice-status').innerText(), /0 个匹配/);
    await page.locator('#practice-reset').click();
    assert.equal(await selected(page).locator('textarea').inputValue(), note);
    assert.equal(await state(page), JSON.stringify(saved));
    await page.selectOption('#practice-path', 'frontier-reading');
    assert.match(await page.locator('#practice-status').innerText(), /3 个匹配/);
    assert.equal(await selected(page).getAttribute('id'), 'classification-denominators', 'route filtering preserves the current draft');
    await page.locator('#practice-next').click();
    assert.equal(await selected(page).getAttribute('id'), 'ai-version-scope');
    assert.equal(await state(page), JSON.stringify(saved), 'switching questions never writes history/completion');
    await selected(page).locator('[data-step-complete]').check();
    assert.equal(JSON.parse(await state(page)).entries['ai-version-scope'].completed, true);
    await page.locator('.practice-resume-details > summary').click();
    await page.locator('#learning-continue').click();
    assert.equal(await selected(page).getAttribute('id'), 'classification-denominators');
    assert.equal(new URL(page.url()).hash, '#classification-denominators');
    assert.ok(!page.url().includes('PRACTICE_PRIVATE_SENTINEL'));
    const snapshot = await exportState(page);
    assert.equal(snapshot.entries['classification-denominators'].note, note);
    assert.equal(Object.keys(snapshot.entries).length, 2);
    await importState(page, { version: 1, entries: {
      'classification-denominators': { completed: true, note: 'incoming conflict' },
      'policy-status': { completed: false, note: 'imported policy question' }
    } });
    assert.match(await page.locator('#learning-import-summary').innerText(), /可补入 1 条/);
    assert.equal(await page.locator('#learning-import-details li').count(), 2);
    assert.match(await page.locator('#learning-import-details').innerText(), /保留本页记录/);
    assert.equal(JSON.parse(await state(page)).entries['policy-status'], undefined);
    await page.locator('#learning-import-confirm').click();
    const merged = JSON.parse(await state(page));
    assert.equal(merged.entries['classification-denominators'].note, note);
    assert.equal(merged.entries['policy-status'].note, 'imported policy question');
    await page.goto(base + '/study/paths/#classification-denominators');
    await page.locator('[data-learning-controls]').first().waitFor({ state: 'visible' });
    const oldStep = page.locator('[data-learning-step="classification-denominators"]');
    assert.equal(await oldStep.locator('textarea').inputValue(), note);
    await oldStep.locator('[data-step-complete]').check();
    const beforeReturn = await state(page);
    await open(page, '#classification-denominators');
    assert.equal(await selected(page).locator('textarea').inputValue(), note);
    assert.ok(await selected(page).locator('[data-step-complete]').isChecked());
    assert.equal(await state(page), beforeReturn, 'reading the shared journal never rewrites it');
    await page.locator('.site-search-toggle').click();
    assert.equal(await page.locator('#site-search-query').inputValue(), '');
    await page.locator('#site-search-query').fill('spatial');
    await page.waitForFunction(() => document.querySelector('#site-search-dialog [data-search-count]')?.textContent.includes('个'));
    await page.keyboard.press('Escape');
    const index = await page.evaluate(async (url) => (await fetch(url)).text(), base + '/assets/data/site-search.json');
    assert.ok(!index.includes('PRACTICE_PRIVATE_SENTINEL') && !index.includes('imported policy question'));
    assert.equal(await page.locator('[onerror]').count(), 0);
    assert.ok(requests.every((r) => r.method === 'GET' && !r.url.includes('PRACTICE_PRIVATE_SENTINEL') && !r.url.includes('unmatched-local-query')));
    assert.ok(requests.every((r) => r.url.startsWith(new URL(base).origin) || r.url.startsWith('blob:')));
    assert.equal(await page.evaluate(() => localStorage.getItem('brooks-universe.observatory.v1')), 'PRIVATE_OTHER_FEATURE');
    assert.equal(await page.evaluate(() => localStorage.getItem('atlas-campus-favorites-v1')), '["library"]');
    assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    await context.close();
    console.log(`PASS practice ${width} ${theme}: single question, explicit records, hints/counterexamples, pinned filters/composition, shared v1 round trip, merge preview, public search/privacy, axe and layout`);
  }

  for (const route of ['/study/paths/', '/study/practice/']) for (const failure of ['remove', 'get', 'conflict']) {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    if (route.includes('practice')) await open(page); else { await page.goto(base + route); await page.locator('[data-step-complete]').first().waitFor({ state: 'visible' }); }
    const step = page.locator('[data-learning-step="python-values"]');
    if (!route.includes('practice')) await step.locator('summary').click();
    await step.locator('textarea').fill('KEEP_MY_MEMORY_DRAFT');
    const remote = JSON.stringify({ version: 1, entries: { 'rss-records': { completed: true, note: 'OTHER_TAB_RECORD' } } });
    await page.evaluate(({ key, failure, remote }) => {
      if (failure === 'conflict') localStorage.setItem(key, remote);
      const get = Storage.prototype.getItem, remove = Storage.prototype.removeItem;
      Storage.prototype.getItem = function (name) { if (failure === 'get' && name === key) throw new DOMException('Denied', 'SecurityError'); return get.call(this, name); };
      Storage.prototype.removeItem = function (name) { if (failure === 'remove' && name === key) throw new DOMException('Denied', 'SecurityError'); return remove.call(this, name); };
    }, { key: LEARNING_KEY, failure, remote });
    await page.locator('.learning-reset summary').click();
    page.once('dialog', (dialog) => dialog.accept()); await page.locator('#learning-clear').click();
    assert.equal(await step.locator('textarea').inputValue(), 'KEEP_MY_MEMORY_DRAFT');
    assert.match(await page.locator('#learning-storage').innerText(), /未清除|未重置/);
    assert.equal((await exportState(page)).entries['python-values'].note, 'KEEP_MY_MEMORY_DRAFT');
    if (failure === 'conflict') assert.equal(await state(page), remote);
    await context.close();
    console.log(`PASS ${route} reset ${failure}: fresh guard preserves local drafts/other-tab data and export`);
  }

  for (const route of ['/study/paths/', '/study/practice/']) {
    const context = await browser.newContext({ acceptDownloads: true });
    const raw = '{broken record: <img onerror=x>\uD800';
    await context.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), { key: LEARNING_KEY, raw });
    const page = await context.newPage();
    if (route.includes('practice')) await open(page); else { await page.goto(base + route); await page.locator('[data-step-complete]').first().waitFor({ state: 'visible' }); }
    assert.ok(await page.locator('#learning-raw-recovery').isVisible());
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#learning-export-raw').click()]);
    assert.equal(download.suggestedFilename(), 'brooks-learning-recovery.txt');
    const recovery = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.equal(recovery.raw_value, raw, 'JSON envelope preserves exact original UTF-16, including an unpaired surrogate');
    assert.equal(recovery.storage_key, LEARNING_KEY); assert.equal(recovery.format, 'brooks-learning-raw-recovery');
    assert.equal(await state(page), raw);
    assert.deepEqual(await exportState(page), { version: 1, entries: {} });
    assert.equal(await page.locator('[onerror]').count(), 0);
    await context.close();
    console.log(`PASS ${route} corrupt raw recovery: explicit exact-string diagnostic download; ordinary backup remains separate`);
  }

  const previous = await browser.newContext({ acceptDownloads: true });
  const previousIds = ['python-values', 'rss-records', 'source-evidence', 'mercator-assumptions', 'map-provenance', 'copy-relations', 'lifetime-boundaries', 'individual-collective', 'pure-equilibrium', 'classification-denominators', 'spatial-holdout', 'evaluation-evidence'];
  const previousBackup = { version: 1, entries: Object.fromEntries(previousIds.map((id) => [id, { completed: true, note: `Previous v1: ${id}` }])) };
  const previousText = JSON.stringify(previousBackup, null, 2);
  await previous.addInitScript(({ key, text }) => { if (localStorage.getItem(key) === null) localStorage.setItem(key, text); }, { key: LEARNING_KEY, text: previousText });
  const priorPage = await previous.newPage(); await open(priorPage);
  assert.equal(await selected(priorPage).getAttribute('id'), 'ai-version-scope', 'resume selects the next explicitly unfinished route without recording a visit');
  assert.equal(await state(priorPage), previousText);
  await priorPage.locator('.practice-resume-details > summary').click();
  assert.match(await priorPage.locator('#learning-progress').innerText(), /12 \/ 18/);
  assert.deepEqual(await exportState(priorPage), previousBackup);
  await selected(priorPage).locator('textarea').fill('A new explanation after the twelve-step backup.');
  const extended = JSON.parse(await state(priorPage));
  for (const id of previousIds) assert.deepEqual(extended.entries[id], previousBackup.entries[id]);
  assert.equal(extended.entries['ai-version-scope'].completed, false);
  await previous.close();
  console.log('PASS practice v1 evolution: all twelve prior records/raw opening/export retained; new three steps extend the same key');

  const multi = await browser.newContext({ acceptDownloads: true });
  const pathPage = await multi.newPage(), practicePage = await multi.newPage();
  await pathPage.goto(base + '/study/paths/'); await pathPage.locator('[data-step-complete]').first().waitFor({ state: 'visible' });
  await open(practicePage);
  await selected(practicePage).locator('textarea').fill('OTHER_WORKSPACE_SAVED_NOTE');
  await pathPage.waitForFunction(() => document.getElementById('learning-storage').textContent.includes('标签页'));
  const pathStep = pathPage.locator('[data-learning-step="python-values"]');
  await pathStep.locator('summary').click(); await pathStep.locator('textarea').fill('PATH_MEMORY_DRAFT');
  assert.equal(JSON.parse(await state(practicePage)).entries['python-values'].note, 'OTHER_WORKSPACE_SAVED_NOTE');
  assert.equal((await exportState(pathPage)).entries['python-values'].note, 'PATH_MEMORY_DRAFT');
  await pathPage.locator('.learning-reset summary').click(); pathPage.once('dialog', (dialog) => dialog.accept()); await pathPage.locator('#learning-clear').click();
  assert.match(await pathPage.locator('#learning-storage').innerText(), /未清除/);
  assert.equal(JSON.parse(await state(practicePage)).entries['python-values'].note, 'OTHER_WORKSPACE_SAVED_NOTE');
  assert.equal((await exportState(pathPage)).entries['python-values'].note, 'PATH_MEMORY_DRAFT');
  await multi.close();
  console.log('PASS paths/practice real multi-tab conflict: shared-key writes pause; reset cannot erase the other workspace; both drafts remain exportable');

  for (const mode of ['blocked', 'quota']) {
    const context = await browser.newContext({ acceptDownloads: true });
    await context.addInitScript(({ key, mode }) => {
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      Storage.prototype.getItem = function (name) { if (mode === 'blocked' && name === key) throw new DOMException('Denied', 'SecurityError'); return get.call(this, name); };
      Storage.prototype.setItem = function (name, value) { if (name === key) throw new DOMException('Full', 'QuotaExceededError'); return set.call(this, name, value); };
    }, { key: LEARNING_KEY, mode });
    const page = await context.newPage(); await open(page);
    await selected(page).locator('textarea').fill('EXPORTABLE_MEMORY_ONLY_NOTE');
    assert.match(await page.locator('#learning-storage').innerText(), /暂存|无法写入/);
    assert.equal((await exportState(page)).entries['python-values'].note, 'EXPORTABLE_MEMORY_ONLY_NOTE');
    await context.close();
    console.log(`PASS practice ${mode}: visible memory-only feedback and real usable download`);
  }

  for (const viewport of [{ width: 320, height: 640 }, { width: 768, height: 390 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' });
    const page = await context.newPage(); await open(page);
    await page.keyboard.press('Tab');
    assert.ok(await page.locator('.skip').evaluate((node) => node === document.activeElement));
    assert.ok(await page.locator('.skip').evaluate((node) => node.getBoundingClientRect().top >= 0));
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
    await page.locator('#practice-next').click();
    assert.ok(await selected(page).evaluate((node) => node.getAnimations().some((animation) => animation.playState === 'running')), 'explicit next has one finite worksheet response');
    await page.evaluate(() => { window.practiceReduceObserved = false; matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => { window.practiceReduceObserved = true; }, { once: true }); });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => window.practiceReduceObserved === true);
    assert.equal(await selected(page).evaluate((node) => node.getAnimations().filter((animation) => animation.playState === 'running').length), 0);
    await page.locator('.practice-directory > summary').click();
    await page.locator('[data-practice-jump="policy-status"]').click();
    assert.equal(await selected(page).getAttribute('id'), 'policy-status');
    assert.equal(await selected(page).evaluate((node) => node.getAnimations().filter((animation) => animation.playState === 'running').length), 0, 'new selections stay still under reduced motion');
    await page.locator('[data-practice-jump="economy-denominators"]').click();
    assert.equal(await selected(page).getAttribute('id'), 'economy-denominators');
    await page.goBack();
    await page.waitForFunction(() => !document.getElementById('policy-status').hidden);
    assert.equal(await selected(page).getAttribute('id'), 'policy-status');
    assert.equal(await state(page), null, 'hash navigation and motion do not invent records');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'DOM text scaling preserves reflow');
    await context.close();
    console.log(`PASS practice ${viewport.width}×${viewport.height}: keyboard skip, explicit navigation/back, live reduced motion and DOM text-scale reflow`);
  }

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const noPage = await nojs.newPage(); await noPage.goto(base + '/study/practice/');
  assert.equal(await noPage.locator('[data-learning-step]:visible').count(), 18);
  assert.equal(await noPage.locator('[data-practice-reference]').count(), 18);
  assert.equal(await noPage.locator('[data-learning-controls]:visible, [data-practice-controls]:visible').count(), 0);
  await noPage.locator('[data-practice-reference] summary').first().click();
  assert.match(await noPage.locator('[data-practice-reference]').first().innerText(), /ValueError/);
  assert.ok(await noPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await nojs.close();
  console.log('PASS practice no-JS: every question, method, resource and native reference readable without fake recording controls');
} finally { await browser.close(); }
