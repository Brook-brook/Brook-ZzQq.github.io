import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { READING_KEY } from '../assets/js/atlas/observatory-models.js';

const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.STREAM_SHOT_DIR || 'work/iteration10/stream';
const feedBase = 'https://raw.githubusercontent.com/Brook-brook/Brook-ZzQq.github.io/observatory-data/feed/';
const original = JSON.parse(await readFile('_data/observatory_stream.json', 'utf8'));
const fixture = structuredClone(original);
fixture.total = fixture.latest.length; fixture.archives[0].count = fixture.total;
const day = fixture.archives[0].date;
const statusOf = (index) => ({ schema_version: 1, attempted_at: index.attempted_at, last_complete_at: index.last_complete_at,
  sources_ok: index.sources.filter((source) => ['ok', 'not_modified'].includes(source.status)).length,
  sources_total: index.sources.length, total: index.total, index_path: 'index.json',
  digest: createHash('sha256').update(JSON.stringify(index)).digest('hex') });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), headless: true, args: ['--no-sandbox'] });
await mkdir(shots, { recursive: true });
const saved = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), READING_KEY);
async function setup(context, control = {}) {
  control.index ||= structuredClone(fixture); control.archive ||= structuredClone(fixture.latest);
  control.requests = [];
  await context.route('**/assets/data/observatory-stream.json', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(fixture) }));
  await context.route(feedBase + '**', (route) => {
    control.requests.push({ url: route.request().url(), method: route.request().method(), body: route.request().postData(), headers: route.request().headers() });
    const path = route.request().url().slice(feedBase.length);
    if (control.fail) return route.fulfill({ status: 503, body: 'fixture unavailable' });
    let value = path === 'status.json' ? statusOf(control.index) : path === 'index.json' ? control.index : { schema_version: 1, date: day, records: control.archive };
    if (path.startsWith('archive/') && control.badArchive) value = { invalid: true };
    if (path === 'status.json' && control.badDigest) value.digest = '0'.repeat(64);
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(value) });
  });
  return control;
}
async function open(page) {
  assert.ok((await page.goto(base + '/observatory/')).ok());
  await page.locator('.stream-controls').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.getElementById('stream-message').textContent.includes('已检查'));
}
async function download(page, button) {
  const [file] = await Promise.all([page.waitForEvent('download'), page.click(button)]);
  return readFile(await file.path(), 'utf8');
}
async function axe(page, label) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(';')}`), [], label);
}
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    await context.addInitScript((theme) => localStorage.setItem('atlas-theme', theme), theme);
    const control = await setup(context); const page = await context.newPage(); const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await open(page);
    assert.equal(await saved(page), null, 'automatic metadata never creates a private reading record');
    assert.equal(await page.locator('[data-stream-item]').count(), 8);
    assert.match(await page.locator('#stream-updated').innerText(), /6 \/ 7/);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const id of ['stream-query', 'stream-topic', 'stream-source', 'stream-day']) assert.ok(await page.locator('#' + id).evaluate((node) => parseFloat(getComputedStyle(node).fontSize) >= 16));
    await page.locator('#updates').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shots}/updates-${width}-${theme}.png` });
    await axe(page, `stream ${width} ${theme}`);
    await page.locator('#stream-query').fill('<img onerror=x>');
    assert.equal(await page.locator('[data-stream-item]').count(), 0); assert.ok(await page.locator('#stream-empty').isVisible());
    await page.click('#stream-reset'); assert.equal(await page.evaluate(() => document.activeElement.id), 'stream-query');
    const chosen = fixture.latest[0]; await page.selectOption('#stream-source', chosen.source_id);
    await page.locator('#stream-query').fill(chosen.title.slice(0, 12));
    assert.ok(await page.locator(`[data-stream-item="${chosen.id}"]`).isVisible());
    await page.click('#stream-reset'); await page.click('#stream-more');
    assert.equal(await page.locator('[data-stream-item]').count(), 16);
    assert.ok(await page.evaluate(() => document.activeElement.matches('#stream-list h3 a')));
    const id = await page.locator('[data-stream-save]').first().getAttribute('data-stream-save');
    await page.locator(`[data-stream-save="${id}"]`).click();
    assert.equal((await saved(page)).version, 2); assert.equal((await saved(page)).saved[0].item_type, 'update');
    await page.locator('#reading-queue summary').click();
    const note = `private-note-${width}-${theme} <img src=x onerror=alert(1)>`;
    const textarea = page.locator('#reading-queue textarea');
    await textarea.fill(note); await textarea.press('End'); await textarea.pressSequentially(' + evidence');
    assert.equal((await saved(page)).saved[0].reflection, note + ' + evidence');
    assert.equal(await page.locator('#reading-queue img').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const backup = JSON.parse(await download(page, '#reading-backup'));
    assert.equal(backup.saved[0].reflection, note + ' + evidence');
    const markdown = await download(page, '#reading-export');
    assert.ok(markdown.includes('首次收集日期')); assert.ok(markdown.includes('\\<img'));
    await page.locator('#reading-desk').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shots}/notes-${width}-${theme}.png` });
    await axe(page, `notes ${width} ${theme}`);
    await page.reload(); await page.locator('.stream-controls').waitFor();
    assert.equal((await saved(page)).saved[0].reflection, note + ' + evidence');
    assert.equal(await page.locator(`[data-stream-save="${id}"]`).getAttribute('aria-pressed'), 'true');
    assert.ok(control.requests.every((request) => request.method === 'GET' && request.body === null && !JSON.stringify(request).includes(note)), 'public snapshot requests never carry notes');
    assert.deepEqual(errors, []);
    await context.close(); console.log(`PASS continuous stream ${width} ${theme}: real DOM filters, load more/focus, metadata selection, typed notes/reload, Markdown+JSON downloads, no uploads, axe`);
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const control = await setup(context); const page = await context.newPage();
  await page.clock.install({ time: new Date('2026-11-12T08:30:00Z') }); await open(page);
  await page.locator('[data-stream-save]').first().click(); await page.locator('#reading-queue summary').click();
  await page.locator('#reading-queue textarea').fill('keep typing privately');
  const next = structuredClone(fixture); next.attempted_at = '2026-11-12T10:01:23.049Z';
  const old = structuredClone(next.latest[0]);
  const revised = { ...old, title: 'Synthetic revision <img src=x>', changed_at: next.attempted_at,
    revision_count: 1, previous_versions: [{ title: old.title, url: old.url, changed_at: old.changed_at, published_at: old.published_at, updated_at: old.updated_at }] };
  const added = { ...old, id: 'n-' + 'a'.repeat(64), url: new URL('/synthetic-fixture', old.url).href,
    title: 'Synthetic newly discovered metadata', first_seen_at: next.attempted_at, changed_at: next.attempted_at };
  control.archive = [revised, ...fixture.latest.slice(1), added]; next.latest = [added, revised, ...next.latest.slice(1, -1)];
  next.total++; next.archives[0].count++; control.index = next;
  await page.clock.fastForward(5 * 60 * 1000);
  await page.locator('#stream-apply').waitFor({ state: 'visible' });
  assert.equal(await page.locator(`[data-stream-item="${added.id}"]`).count(), 0, 'polls never replace a reading list automatically');
  assert.equal(await page.locator('#reading-queue textarea').inputValue(), 'keep typing privately');
  assert.ok(await page.locator('#reading-queue textarea').evaluate((node) => document.activeElement === node));
  await page.click('#stream-apply');
  assert.ok(await page.locator(`[data-stream-item="${added.id}"]`).isVisible());
  assert.equal(await page.evaluate(() => document.activeElement.id), 'stream-check');
  assert.equal((await saved(page)).saved[0].reflection, 'keep typing privately');
  await page.locator(`[data-stream-item="${revised.id}"] summary`).click();
  assert.ok((await page.locator(`[data-stream-item="${revised.id}"] details`).innerText()).includes(old.title));
  assert.equal(await page.locator('#stream-list img').count(), 0);
  await page.selectOption('#stream-day', day);
  await page.waitForFunction(() => document.getElementById('stream-message').textContent.includes('已打开'));
  await page.locator('#stream-query').fill(fixture.latest.at(-1).title);
  assert.equal(await page.locator('[data-stream-item]').count(), 1, 'daily archives retain items outside latest 60');
  await page.click('#stream-reset');
  const beforeHidden = control.requests.length;
  await page.evaluate(() => {
    window.testHidden = true; Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.testHidden });
  });
  await page.clock.fastForward(5 * 60 * 1000); assert.equal(control.requests.length, beforeHidden);
  await page.evaluate(() => { window.testHidden = false; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForFunction(() => document.getElementById('stream-message').textContent.includes('已检查'));
  assert.ok(control.requests.length > beforeHidden, 'returning to a visible page checks a due snapshot');
  control.fail = true; await page.click('#stream-check');
  await page.waitForFunction(() => document.getElementById('stream-message').textContent.includes('HTTP 503'));
  assert.ok(await page.locator('[data-stream-item]').count()); control.fail = false;
  control.index = { ...next, attempted_at: '2026-11-12T12:01:23.049Z' }; control.badDigest = true;
  await page.click('#stream-check'); await page.waitForFunction(() => document.getElementById('stream-message').textContent.includes('校验不一致'));
  assert.ok(await page.locator('[data-stream-item]').count());
  await page.selectOption('#stream-day', 'latest'); control.badArchive = true;
  await page.selectOption('#stream-day', day);
  await page.waitForFunction(() => document.getElementById('stream-message').textContent.includes('格式或来源无效'));
  assert.equal(await page.inputValue('#stream-day'), 'latest');
  control.index = next; control.badDigest = false;
  await page.clock.fastForward(8 * 60 * 60 * 1000);
  await page.waitForFunction(() => document.getElementById('stream-updated').textContent.includes('超过 6 小时'));
  assert.equal((await saved(page)).saved[0].reflection, 'keep typing privately');
  assert.ok(await page.locator('[data-stream-item]').count(), 'an aging open tab retains existing materials');
  await context.close(); console.log('PASS continuous stream: five-minute visible-only polling, explicit snapshot apply, retained typing/focus, revision details, archive outside latest, HTTP/hash/archive failures retain content');
  console.log('PASS continuously open tab: snapshot aging updates after eight clock hours without reload or changing notes');

  const restore = await browser.newContext(); await setup(restore);
  const legacy = { id: 'historical-paper', title: 'Historical document', url: 'https://example.org/old-v1', topic: 'ai', item_type: 'briefing', version: 'v1', checked_on: '2026-10-01', question: 'Evidence?', caveat: 'Historical copy' };
  const raw = JSON.stringify({ version: 1, saved: [legacy] });
  await restore.addInitScript(({ key, raw }) => {
    localStorage.setItem(key, raw); localStorage.setItem('brooks-universe.learning.v1', 'keep-route-journal');
  }, { key: READING_KEY, raw });
  const restored = await restore.newPage(); await open(restored);
  assert.equal(await restored.evaluate((key) => localStorage.getItem(key), READING_KEY), raw, 'opening old records never writes a migration');
  await restored.locator('#reading-queue summary').click(); await restored.locator('#reading-queue textarea').fill('my local explanation');
  assert.equal((await saved(restored)).version, 2);
  await restored.getByText('从 JSON 恢复清单与手记', { exact: true }).click();
  const imported = { version: 2, saved: [{ ...legacy, reflection: 'do not replace local text' }, { ...legacy, id: 'restored-new', reflection: 'a restored explanation' }] };
  await restored.setInputFiles('#reading-import', { name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) });
  await restored.locator('#reading-import-confirm').waitFor({ state: 'visible' });
  assert.equal((await saved(restored)).saved.length, 1, 'preview never imports automatically');
  await restored.click('#reading-import-confirm');
  assert.deepEqual((await saved(restored)).saved.map((item) => item.reflection), ['my local explanation', 'a restored explanation']);
  const beforeBad = await saved(restored);
  await restored.setInputFiles('#reading-import', { name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await restored.waitForFunction(() => document.getElementById('reading-import-status').textContent.includes('未改变'));
  assert.deepEqual(await saved(restored), beforeBad);
  await restored.setInputFiles('#reading-import', { name: 'oversized.json', mimeType: 'application/json', buffer: Buffer.alloc(2 * 1024 * 1024 + 1, 32) });
  await restored.waitForFunction(() => document.getElementById('reading-import-status').textContent.includes('超过 2 MiB'));
  assert.deepEqual(await saved(restored), beforeBad, 'oversized backup never replaces notes');
  restored.once('dialog', (dialog) => dialog.dismiss()); await restored.locator('#reading-queue button').first().click();
  assert.deepEqual(await saved(restored), beforeBad, 'canceling removal retains the whole note');
  await restored.getByText('清除本机阅读清单', { exact: true }).click();
  restored.once('dialog', (dialog) => dialog.accept()); await restored.click('#reading-clear');
  assert.equal(await saved(restored), null);
  assert.equal(await restored.evaluate(() => localStorage.getItem('brooks-universe.learning.v1')), 'keep-route-journal');
  await restore.close(); console.log('PASS reading desk: v1 recovery without rewrite, explicit migration, previewed JSON merge/local-note priority, bad file preservation, cancel removal, reset protects route journal');

  for (const mode of ['quota', 'corrupt']) {
    const recovery = await browser.newContext(); await setup(recovery);
    await recovery.addInitScript(({ key, mode }) => {
      if (mode === 'corrupt') localStorage.setItem(key, '{broken');
      const write = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        if (name === key && mode === 'quota') throw new DOMException('Full', 'QuotaExceededError');
        return write.call(this, name, value);
      };
    }, { key: READING_KEY, mode });
    const p = await recovery.newPage(); await open(p);
    await p.locator('[data-stream-save]').first().click(); await p.locator('#reading-queue summary').click();
    await p.locator('#reading-queue textarea').fill('unsaved local reflection');
    assert.match(await p.locator('#reading-storage').innerText(), /暂存|无法写入/);
    assert.equal(JSON.parse(await download(p, '#reading-backup')).saved[0].reflection, 'unsaved local reflection');
    assert.equal(await p.evaluate((key) => localStorage.getItem(key), READING_KEY), mode === 'corrupt' ? '{broken' : null);
    await recovery.close(); console.log(`PASS note recovery ${mode}: original storage preserved, typed memory-only reflection remains exportable`);
  }

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const offlinePage = await nojs.newPage(); await offlinePage.goto(base + '/observatory/');
  assert.equal(await offlinePage.locator('#stream-list h3 a').count(), 8);
  assert.equal(await offlinePage.locator('.stream-controls:visible').count(), 0);
  assert.equal(await offlinePage.locator('#stream-check:visible').count(), 0);
  assert.ok(await offlinePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await nojs.close(); console.log('PASS no-JS continuous stream: real bundled original links, hidden unavailable controls, phone layout');
} finally { await browser.close(); }
