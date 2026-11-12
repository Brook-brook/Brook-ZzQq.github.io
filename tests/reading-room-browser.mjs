import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { READING_KEY } from '../assets/js/atlas/observatory-models.js';

const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.READING_ROOM_SHOT_DIR || 'work/iteration11/room';
const fixture = JSON.parse(await readFile('_data/observatory_stream.json', 'utf8'));
const status = { schema_version: 1, attempted_at: fixture.attempted_at, last_complete_at: fixture.last_complete_at,
  sources_ok: fixture.sources.filter((s) => ['ok', 'not_modified'].includes(s.status)).length,
  sources_total: fixture.sources.length, total: fixture.total, index_path: 'index.json',
  digest: createHash('sha256').update(JSON.stringify(fixture)).digest('hex') };
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), headless: true, args: ['--no-sandbox'] });
const saved = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), READING_KEY);
async function setup(context) {
  await context.route('https://raw.githubusercontent.com/Brook-brook/Brook-ZzQq.github.io/observatory-data/feed/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(route.request().url().endsWith('status.json') ? status : fixture) }));
}
async function open(page) {
  assert.ok((await page.goto(base + '/observatory/')).ok());
  await page.locator('[data-study-item="contrastive-discovery"]').waitFor();
  await page.locator('.stream-controls').waitFor();
  await page.waitForFunction(() => !document.getElementById('stream-check').disabled);
}
async function close(page) {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('reading-room').open && !document.documentElement.classList.contains('reading-room-open'));
}
async function library(page) {
  if (!await page.locator('#reading-room-library-controls').evaluate((n) => n.open)) await page.locator('#reading-room-library-controls > summary').click();
}
async function download(page, id) {
  const [file] = await Promise.all([page.waitForEvent('download'), page.click(id)]);
  return readFile(await file.path(), 'utf8');
}
async function axe(page, label) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(';')}`), [], label);
}
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    await context.addInitScript((theme) => {
      localStorage.setItem('atlas-theme', theme);
      localStorage.setItem('brooks-universe.learning.v1', 'preserve-route-journal');
      localStorage.setItem('atlas-campus-favorites-v1', '["library"]');
    }, theme);
    await setup(context); const page = await context.newPage(); const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await open(page); assert.equal(await saved(page), null);
    await page.locator('[data-open-reading-room]').first().click();
    assert.ok(await page.locator('#reading-room-empty').isVisible());
    assert.equal(await saved(page), null, 'opening an empty room creates no reading record');
    await close(page);
    assert.ok(await page.locator('[data-open-reading-room]').first().evaluate((n) => document.activeElement === n));
    await page.locator('[data-study-item="contrastive-discovery"]').click();
    assert.ok(await page.locator('#reading-room').isVisible());
    assert.equal((await saved(page)).saved.length, 1);
    const snapshot = structuredClone((await saved(page)).saved[0]);
    assert.equal(snapshot.url, 'https://arxiv.org/abs/2611.14514v1');
    assert.match(await page.locator('#reading-room-lens-title').innerText(), /AI/);
    assert.equal(await page.locator('#reading-room-library-controls').evaluate((n) => n.open), width > 768);
    assert.ok(await page.locator('#reading-room-note').evaluate((n) => parseFloat(getComputedStyle(n).fontSize) >= 16));
    const text = `测试示例 LOCAL-${width}-${theme} <img src=x onerror=alert(1)>`;
    await page.locator('#reading-room-note').fill(text);
    await page.locator('#reading-room-note').press('End'); await page.locator('#reading-room-note').pressSequentially(' + evidence');
    assert.equal((await saved(page)).saved[0].reflection, text + ' + evidence');
    await page.click('#reading-room-outline');
    const annotated = (await saved(page)).saved[0].reflection;
    assert.ok(annotated.startsWith(text + ' + evidence')); assert.ok(annotated.includes('【研读提纲｜AI 证据】'));
    await page.click('#reading-room-outline');
    assert.match(await page.locator('#reading-room-edit-feedback').innerText(), /已有/);
    assert.equal((await saved(page)).saved[0].reflection, annotated);
    assert.equal(await page.locator('#reading-room-current img').count(), 0);
    assert.ok(await page.locator('#reading-room').evaluate((n) => n.scrollWidth <= n.clientWidth));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await page.locator('#reading-room').evaluate((n) => n.getAnimations().length), 0, 'reduced-motion removes entry animation');
    await axe(page, `${width} ${theme} editing`);
    await page.screenshot({ path: `${shots}/editing-${width}-${theme}.png` });
    await close(page);
    assert.ok(await page.locator('[data-study-item="contrastive-discovery"]').evaluate((n) => document.activeElement === n));
    assert.equal(await page.locator('#reading-note-contrastive-discovery').inputValue(), annotated);
    const economy = page.locator('[data-reading-item][data-topic="economy"] [data-study-item]').first();
    const economicId = await economy.getAttribute('data-study-item'); await economy.click();
    assert.match(await page.locator('#reading-room-lens-title').innerText(), /经济/);
    await page.click('#reading-room-outline'); assert.match(await page.locator('#reading-room-note').inputValue(), /经济口径/);
    await close(page);
    const political = page.locator('[data-reading-item][data-topic="politics"] [data-study-item]').first();
    const politicalId = await political.getAttribute('data-study-item'); await political.click();
    await page.locator('#reading-room-lens > summary').click();
    assert.match(await page.locator('#reading-room-questions').innerText(), /草案、通过、公布、施行/);
    await library(page); await page.locator('#reading-room-query').fill('ＬＯＣＡＬ');
    assert.match(await page.locator('#reading-room-count').innerText(), /找到 1 \/ 3/);
    assert.equal(await page.inputValue('#reading-room-select'), politicalId, 'filtering does not replace the current editor');
    await page.selectOption('#reading-room-select', 'contrastive-discovery');
    assert.equal(await page.locator('#reading-room-note').inputValue(), annotated);
    await page.click('#reading-room-reset');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'reading-room-query');
    await page.check('#reading-room-annotated');
    assert.match(await page.locator('#reading-room-count').innerText(), /找到 2 \/ 3/);
    await page.click('#reading-room-reset');
    await page.locator('#reading-room-compare > summary').click(); await page.selectOption('#reading-room-compare-select', economicId);
    assert.ok(await page.locator('#reading-room-comparison').isVisible());
    await page.locator('#reading-room-comparison details > summary').click();
    assert.ok((await page.locator('#reading-room-compare-note').textContent()).includes('经济口径'));
    assert.match(await page.locator('#reading-room-comparison').innerText(), /独立证据/);
    const requests = []; page.on('request', (r) => { if (r.url().startsWith('http')) requests.push(r.url()); });
    const backup = JSON.parse(await download(page, '#reading-room-json'));
    assert.equal(backup.version, 2); assert.equal(backup.saved.length, 3); assert.equal(backup.saved[0].reflection, annotated);
    const md = await download(page, '#reading-room-md'); assert.ok(md.includes('\\<img')); assert.ok(md.includes(snapshot.url));
    assert.deepEqual(requests, [], 'room interactions/exports perform no HTTP request');
    await page.locator('#reading-room-close').focus(); await page.keyboard.press('Shift+Tab');
    assert.ok(await page.evaluate(() => !!document.activeElement.closest('#reading-room')));
    await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.id), 'reading-room-close');
    await axe(page, `${width} ${theme} comparison`);
    await page.screenshot({ path: `${shots}/comparison-${width}-${theme}.png` });
    await close(page); await page.reload(); await page.locator('[data-open-reading-room]').first().click();
    assert.equal((await saved(page)).saved[0].reflection, annotated);
    assert.equal((await saved(page)).saved[0].version, snapshot.version);
    assert.equal(await page.evaluate(() => localStorage.getItem('brooks-universe.learning.v1')), 'preserve-route-journal');
    assert.equal(await page.evaluate(() => localStorage.getItem('atlas-campus-favorites-v1')), '["library"]');
    assert.equal(await page.evaluate(() => localStorage.getItem('atlas-theme')), theme);
    assert.deepEqual(errors, []); await context.close();
    console.log(`PASS reading room ${width} ${theme}: empty/no history, direct study, three guides, preserved notes/outline, local retrieval, comparison, real exports, native focus/Esc, reload, axe/reduced-motion/layout`);
  }

  for (const mode of ['blocked', 'quota', 'corrupt']) {
    const context = await browser.newContext(); await setup(context);
    await context.addInitScript(({ key, mode }) => {
      if (mode === 'corrupt') localStorage.setItem(key, '{broken');
      const read = Storage.prototype.getItem; const write = Storage.prototype.setItem;
      Storage.prototype.getItem = function (name) { if (name === key && mode === 'blocked') throw new DOMException('Denied', 'SecurityError'); return read.call(this, name); };
      Storage.prototype.setItem = function (name, value) { if (name === key && mode === 'quota') throw new DOMException('Full', 'QuotaExceededError'); return write.call(this, name, value); };
    }, { key: READING_KEY, mode });
    const p = await context.newPage(); await open(p); await p.locator('[data-study-item="contrastive-discovery"]').click();
    await p.locator('#reading-room-note').fill('测试：仅本页暂存的解释');
    assert.match(await p.locator('#reading-room-status').innerText(), /暂存|无法写入/);
    await library(p); assert.equal(JSON.parse(await download(p, '#reading-room-json')).saved[0].reflection, '测试：仅本页暂存的解释');
    if (mode === 'corrupt') assert.equal(await p.evaluate((key) => localStorage.getItem(key), READING_KEY), '{broken');
    await context.close(); console.log(`PASS room ${mode}: visible modal storage warning and recoverable in-memory notes`);
  }

  const tabs = await browser.newContext(); await setup(tabs);
  const a = await tabs.newPage(); await open(a); await a.locator('[data-study-item="contrastive-discovery"]').click();
  const b = await tabs.newPage(); await open(b); await b.locator('[data-open-reading-room]').first().click();
  await a.locator('#reading-room-note').fill('tab A durable note');
  await b.waitForFunction(() => document.getElementById('reading-room-status').textContent.includes('标签页'));
  await b.locator('#reading-room-note').fill('tab B memory note');
  assert.equal((await saved(a)).saved[0].reflection, 'tab A durable note');
  await library(b); assert.equal(JSON.parse(await download(b, '#reading-room-json')).saved[0].reflection, 'tab B memory note');
  await tabs.close(); console.log('PASS room multi-tab: visible pause, no overwrite and preserved memory backup');

  const legacy = await browser.newContext(); await setup(legacy);
  const old = { version: 1, saved: [{ id: 'old-source', title: '<img src=x onerror=alert(1)>', url: 'https://example.org/old', topic: 'ai', item_type: 'briefing', version: 'old-v1', checked_on: '2026-10-01', question: 'Old prompt', caveat: 'Old caveat' }] };
  const raw = JSON.stringify(old);
  await legacy.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), { key: READING_KEY, raw });
  const p = await legacy.newPage(); await open(p); await p.locator('[data-open-reading-room]').first().click();
  assert.equal(await p.evaluate((key) => localStorage.getItem(key), READING_KEY), raw, 'reading old material does not write a migration');
  assert.equal(await p.locator('#reading-room-current img').count(), 0);
  await p.locator('#reading-room-current > details').first().locator('summary').click();
  assert.match(await p.locator('#reading-room-version').innerText(), /old-v1/);
  await p.locator('#reading-room-note').fill('字'.repeat(1990));
  await p.click('#reading-room-outline'); assert.match(await p.locator('#reading-room-edit-feedback').innerText(), /超过/);
  assert.equal((await saved(p)).saved[0].reflection.length, 1990); assert.equal((await saved(p)).version, 2);
  await legacy.close(); console.log('PASS room legacy/overflow: visit does not rewrite v1, historical snapshots remain safe, outline never truncates notes');

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const n = await nojs.newPage(); await n.goto(base + '/observatory/');
  assert.equal(await n.locator('[data-reading-guide]').count(), 3); await n.locator('[data-reading-guide="ai"] > summary').click();
  assert.ok(await n.locator('[data-reading-guide="ai"] [data-guide-questions]').isVisible());
  assert.equal(await n.locator('#reading-room').isVisible(), false); assert.ok(await n.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await nojs.close(); console.log('PASS room no-JS: native reading guides and valid source methods remain readable, modal stays closed');

  const fallback = await browser.newContext(); await setup(fallback);
  await fallback.addInitScript(() => { HTMLDialogElement.prototype.showModal = undefined; });
  const f = await fallback.newPage(); await f.goto(base + '/observatory/'); await f.locator('.observatory-filters').waitFor();
  assert.equal(await f.locator('[data-study-item]').count(), 0);
  await f.locator('[data-open-reading-room]').first().click(); assert.equal(new URL(f.url()).hash, '#reading-desk');
  await fallback.close(); console.log('PASS room unsupported dialog: original reading desk remains the native anchor fallback');
} finally { await browser.close(); }
