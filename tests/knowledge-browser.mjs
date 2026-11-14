import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { expectedPublicNotes } from './expected-notes.mjs';
const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.KNOWLEDGE_SHOT_DIR || 'work/knowledge';
const notes = await expectedPublicNotes();
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
const load = async (page, hash = '') => {
  await page.goto(base + '/knowledge/' + hash);
  await page.locator('#connection-controls').waitFor({ state: 'visible' });
};
async function capture(page, path) {
  await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
  await page.screenshot({ path, fullPage: true });
}
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript((theme) => {
      localStorage.setItem('atlas-theme', theme);
      localStorage.setItem('brooks-universe.learning.v1', 'KNOWLEDGE_PRIVATE_SENTINEL');
      localStorage.setItem('brooks-universe.observatory.v1', 'KNOWLEDGE_PRIVATE_SENTINEL');
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      window.knowledgeReads = []; window.knowledgeWrites = [];
      const keys = ['brooks-universe.learning.v1', 'brooks-universe.observatory.v1'];
      Storage.prototype.getItem = function (key) { if (keys.includes(key)) window.knowledgeReads.push(key); return get.call(this, key); };
      Storage.prototype.setItem = function (key, value) { if (keys.includes(key)) window.knowledgeWrites.push(key); return set.call(this, key, value); };
    }, theme);
    const page = await context.newPage(), errors = [], missing = [], requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (r) => { if (r.url().startsWith(base) && r.status() >= 400) missing.push(r.url()); });
    page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
    await load(page);
    assert.equal(await page.locator('#connection-current option').count(), notes.length);
    assert.equal(await page.inputValue('#connection-current'), 'reading-ai-evidence');
    assert.match(await page.locator('#connection-status').innerText(), /4 条已编排联系/);
    assert.equal(await page.locator('[data-connection-group="before"] li').count(), 1);
    assert.equal(await page.locator('[data-connection-group="after"] li').count(), 1);
    assert.equal(await page.locator('[data-connection-group="compare"] li').count(), 2);
    assert.ok(await page.locator('#connection-current').evaluate((node) => parseFloat(getComputedStyle(node).fontSize) >= 16));
    assert.equal(await page.locator('#connection-directory').evaluate((node) => node.open), false);
    let axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map((v) => `${v.id}:${v.nodes.map((n) => n.target).join(';')}`), [], `knowledge axe ${width} ${theme}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(await page.locator('#connection-note h3').evaluate((node) => node.getBoundingClientRect().bottom <= innerHeight), 'the selected reading title appears in the first viewport');
    await capture(page, `${shots}/connections-${width}-${theme}.png`);
    await page.locator('#connection-current').focus();
    await page.evaluate(() => history.replaceState({ keep: 'public-history-state' }, '', location.href));
    await page.selectOption('#connection-current', 'ai-evaluation-basics');
    assert.ok(await page.locator('#connection-current').evaluate((node) => node === document.activeElement), 'select keyboard navigation is not interrupted');
    assert.equal(new URL(page.url()).hash, '#connection-ai-evaluation-basics');
    assert.equal(await page.evaluate(() => history.state.keep), 'public-history-state');
    await page.locator('[data-connection-kind="compare"]').click();
    assert.equal(await page.locator('[data-connection-id="foundations-metrics"]').count(), 1, 'the new model-foundations comparison is a real curated connection');
    await page.selectOption('#connection-current', 'rss-normalization');
    assert.match(await page.locator('#connection-empty-text').innerText(), /这个类型暂未/);
    assert.ok(await page.locator('#connection-show-all').isVisible());
    await page.locator('#connection-show-all').click();
    assert.match(await page.locator('#connection-status').innerText(), /3 条已编排联系/);
    await page.selectOption('#connection-current', 'skills-mcp-boundaries');
    assert.match(await page.locator('#connection-status').innerText(), /2 条已编排联系/);
    assert.equal(await page.locator('[data-connection-id="tools-skill-protocol"]').count(), 1);
    assert.equal(await page.locator('[data-connection-id="loop-skill-protocol"]').count(), 1);
    assert.equal(await page.locator('#connection-note a[href*="/playground/"], #connection-note a[href*="/study/practice/#"]').count(), 0, 'a reading-only interface guide gets no invented lab or question');
    await page.selectOption('#connection-current', 'cpp-copy');
    assert.match(await page.locator('#connection-empty-text').innerText(), /暂未编排跨笔记/);
    assert.ok(await page.locator('#connection-show-all').isHidden());
    assert.ok(await page.locator('#connection-note a[href$="/playground/#copy"]').isVisible());
    await page.locator('#connection-note details summary').click();
    assert.equal(await page.locator('#connection-note a[href*="/study/practice/#"]').count(), 2);
    await capture(page, `${shots}/empty-${width}-${theme}.png`);
    await page.reload(); await page.locator('#connection-controls').waitFor({ state: 'visible' });
    assert.equal(await page.inputValue('#connection-current'), 'cpp-copy');
    await page.evaluate(() => { location.hash = '#connection-reading-ai-evidence'; });
    await page.waitForFunction(() => document.getElementById('connection-current').value === 'reading-ai-evidence');
    await page.goBack(); await page.waitForFunction(() => document.getElementById('connection-current').value === 'cpp-copy');
    await page.locator('#connection-directory > summary').click();
    assert.equal(await page.locator('#connection-directory ol > li').count(), 23);
    assert.match(await page.locator('#connection-directory').innerText(), /AI 辅助编排/);
    await page.locator('.knowledge-foundations > summary').click();
    assert.equal(await page.locator('.map-nodes a').count(), 5, 'all five original graph destinations remain');
    const effective = await page.locator('.map-nodes text').first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize) * node.getScreenCTM().a);
    assert.ok(effective >= 14, `diagram labels stay readable, actual ${effective}px`);
    if (width === 390) {
      const scroll = page.locator('.foundation-scroll'); await scroll.focus(); await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => document.querySelector('.foundation-scroll').scrollLeft > 0);
    }
    await page.locator('#note-query').fill('no-such-public-note');
    assert.match(await page.locator('#note-count').innerText(), /0 篇/);
    await page.locator('#note-reset').click();
    assert.equal(await page.locator('[data-note]:visible').count(), notes.length);
    assert.equal(await page.inputValue('#note-query'), '');
    assert.equal(new URL(page.url()).hash, '#connection-cpp-copy', 'retained index filtering preserves the public context');
    axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map((v) => v.id), [], 'open retained graph and full directory');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(await page.evaluate(() => window.knowledgeReads), []); assert.deepEqual(await page.evaluate(() => window.knowledgeWrites), []);
    assert.ok(requests.every((r) => r.method === 'GET' && r.url.startsWith(new URL(base).origin) && !r.url.includes('KNOWLEDGE_PRIVATE_SENTINEL')));
    assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    await context.close();
  }

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const noPage = await nojs.newPage(); await noPage.goto(base + '/knowledge/');
  assert.ok(await noPage.locator('#connection-controls').isHidden());
  assert.equal(await noPage.locator('#connection-directory ol > li:visible').count(), 23);
  assert.equal(await noPage.locator('[data-note]:visible').count(), notes.length);
  await noPage.locator('.knowledge-foundations > summary').click(); assert.equal(await noPage.locator('.map-nodes a').count(), 5);
  assert.ok(await noPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await nojs.close();

  for (const fault of ['invalid', 'unsafe', 'literal']) {
    const context = await browser.newContext(); const page = await context.newPage();
    await page.route('**/knowledge/', async (route) => {
      const response = await route.fetch(); let body = await response.text();
      const match = body.match(/<div data-knowledge-model hidden>([\s\S]*?)<\/div>/);
      let data = 'invalid';
      if (fault !== 'invalid') {
        data = JSON.parse(match[1].replaceAll('&quot;', '"').replaceAll('&#39;', '\'').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&'));
        if (fault === 'unsafe') data.notes[0].url = 'javascript:alert(1)';
        else for (const note of data.notes) note.title = '<img src=x onerror="window.knowledgeXss=1"> literal';
        data = JSON.stringify(data);
      }
      const escaped = data.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
      body = body.replace(match[0], `<div data-knowledge-model hidden>${escaped}</div>`);
      await route.fulfill({ response, body });
    });
    await page.goto(base + '/knowledge/');
    if (fault === 'literal') {
      await page.locator('#connection-controls').waitFor({ state: 'visible' });
      assert.match(await page.locator('#connection-note h3').innerText(), /<img/);
      assert.equal(await page.locator('#connection-note img').count(), 0);
      assert.equal(await page.evaluate(() => window.knowledgeXss), undefined);
    } else {
      await page.waitForFunction(() => document.getElementById('connection-status').textContent.includes('无法校验'));
      assert.ok(await page.locator('#connection-controls').isHidden());
      assert.equal(await page.locator('#connection-directory').evaluate((node) => node.open), true);
    }
    await context.close();
  }

  const normal = await browser.newContext({ viewport: { width: 390, height: 700 }, reducedMotion: 'no-preference' });
  const page = await normal.newPage(); await load(page);
  await page.locator('#connection-current').focus(); await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => document.getElementById('connection-neighborhood').getAnimations().length > 0);
  await page.evaluate(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)'); window.knowledgeMotionChanged = media.matches;
    media.addEventListener('change', () => { window.knowledgeMotionChanged = media.matches; });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => window.knowledgeMotionChanged && document.getElementById('connection-neighborhood').getAnimations().length === 0);
  for (const viewport of [{ width: 320, height: 640 }, { width: 768, height: 390 }]) {
    await page.setViewportSize(viewport); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.setViewportSize({ width: 390, height: 900 }); await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await normal.close();
  console.log('PASS knowledge: curated direction/reasons, filters/empty recovery, actual labs/practice, public hash/back/reload, no private reads/writes/network, 390/768/1440 × themes, 14px retained SVG/keyboard scroll, preserved directory/reset, axe, no-JS, corrupt/unsafe/literal data, normal/reduced motion and 320/short/200% text');
} finally { await browser.close(); }
