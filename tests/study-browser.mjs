import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { expectedPublicNotes } from './expected-notes.mjs';

const notes = await expectedPublicNotes();
const base = (process.env.ATLAS_BASE_URL ||
  'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const prefix = new URL(base).pathname.replace(/\/$/, '');
const shots = process.env.STUDY_SHOT_DIR || 'work/iteration6/study';
const sourceCommit = '756ffbddf5cf4cd87e383a82b7c997563032e93f';
await mkdir(shots, { recursive: true });
assert.ok(notes.includes('bestblogs-research'));
assert.ok(notes.includes('rss-normalization'));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ||
    (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'),
  args: ['--no-sandbox'],
  headless: true
});

async function checkPage(page, path, label) {
  const response = await page.goto(base + path);
  assert.ok(response.ok(), `${label} ${path}`);
  assert.equal(await page.locator('#primary-nav [aria-current="page"]').count(), 1);
  assert.equal(await page.locator('#primary-nav [aria-current="page"]').innerText(), 'Study');
  assert.ok(await page.evaluate(() =>
    document.documentElement.scrollWidth <= innerWidth), `overflow ${label} ${path}`);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(result.violations.map((violation) =>
    `${violation.id}: ${violation.nodes.map((node) => node.target).join(';')}`),
  [], `axe ${label} ${path}`);
}

function noteCard(page, slug) {
  return page.locator('[data-note]').filter({
    has: page.locator(`h3 a[href$="/knowledge/${slug}/"]`)
  });
}

async function keyboardClick(page, locator, key = 'Enter') {
  await locator.focus();
  await page.keyboard.press(key);
}

async function assertFilterState(page, kind, category) {
  assert.equal(await page.locator('[data-note-kinds] [aria-pressed="true"]').count(), 1);
  assert.equal(await page.locator('.study-filters [aria-pressed="true"]').count(), 1);
  assert.equal(await page.locator(`[data-kind="${kind}"]`).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator(`.study-filters [data-category="${category}"]`).getAttribute('aria-pressed'), 'true');
}

try {
  for (const width of [390, 768, 1440]) {
    for (const theme of ['dark', 'light']) {
      const label = `${width} ${theme}`;
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce'
      });
      await context.addInitScript((value) =>
        localStorage.setItem('atlas-theme', value), theme);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.status() >= 400 &&
            new URL(response.url()).origin === new URL(base).origin) {
          errors.push(`${response.status()} ${response.url()}`);
        }
      });

      await checkPage(page, '/study/', label);
      await page.waitForSelector('[data-note-kinds]:visible');
      assert.equal(await page.locator('[data-note]:visible').count(), notes.length);
      assert.equal(await page.locator('#note-count').innerText(), `${notes.length} 篇笔记`);
      const research = noteCard(page, 'bestblogs-research');
      const rss = noteCard(page, 'rss-normalization');
      const researchCategory = await research.getAttribute('data-category');
      const tutorialCategory = await rss.getAttribute('data-category');
      assert.equal(await research.locator('.study-note-links a').count(), 1,
        'research card has only its real reading link');
      assert.equal(await research.getAttribute('data-note-kind'), 'research');
      assert.equal(await rss.locator('a[href$="/playground/research/"]').count(), 1);
      assert.equal(await noteCard(page, 'cpp-copy').getAttribute('data-note-kind'), 'tutorial',
        'older notes retain the tutorial default');

      await keyboardClick(page, page.locator('[data-kind="research"]'), 'Space');
      await keyboardClick(page,
        page.locator(`.study-filters [data-category="${researchCategory}"]`));
      await page.locator('#note-query').fill('ginobefun/BestBlogs');
      await assertFilterState(page, 'research', researchCategory);
      assert.equal(await page.locator('[data-note]:visible').count(), 1,
        'kind, category and source query intersect');
      assert.ok(await research.isVisible());

      const sharedUrl = page.url();
      const params = new URL(sharedUrl).searchParams;
      assert.equal(params.get('kind'), 'research');
      assert.equal(params.get('category'), researchCategory);
      assert.equal(params.get('q'), 'ginobefun/BestBlogs');
      await page.reload();
      await page.waitForSelector('[data-note-kinds]:visible');
      assert.equal(await page.locator('#note-query').inputValue(), 'ginobefun/BestBlogs');
      await assertFilterState(page, 'research', researchCategory);
      assert.equal(await page.locator('[data-note]:visible').count(), 1);
      await page.goto(base + '/study/');
      await page.goto(sharedUrl);
      await page.waitForSelector('[data-note-kinds]:visible');
      assert.equal(await page.locator('[data-note]:visible').count(), 1,
        'shared URL restores on a new navigation');

      await page.locator('#note-query').fill('structured-output');
      assert.equal(await page.locator('[data-note]:visible').count(), 1,
        'search indexes tags as well as visible titles');
      assert.ok(await noteCard(page, 'bestblogs-research').isVisible());
      await keyboardClick(page,
        page.locator(`.study-filters [data-category="${tutorialCategory}"]`));
      assert.equal(await page.locator('[data-note]:visible').count(), 0);
      assert.ok(await page.locator('#note-empty').isVisible(),
        'incompatible category/type/query gives a meaningful empty state');
      await keyboardClick(page, page.locator('#note-reset'));
      assert.equal(await page.evaluate(() => document.activeElement.id), 'note-query');
      assert.equal(await page.locator('#note-query').inputValue(), '');
      await assertFilterState(page, 'all', 'all');
      assert.equal(await page.locator('[data-note]:visible').count(), notes.length);
      for (const key of ['kind', 'category', 'q']) {
        assert.equal(new URL(page.url()).searchParams.has(key), false);
      }

      await keyboardClick(page, page.locator('[data-kind="tutorial"]'));
      await keyboardClick(page,
        page.locator(`.study-filters [data-category="${tutorialCategory}"]`), 'Space');
      await page.locator('#note-query').fill('RSS');
      assert.equal(await page.locator('[data-note]:visible').count(), 1);
      assert.ok(await noteCard(page, 'rss-normalization').isVisible());
      await page.locator('#note-query').fill('no-such-source-record');
      assert.ok(await page.locator('#note-empty').isVisible());
      assert.equal(await page.locator('#note-count').innerText(), '0 篇笔记');
      await keyboardClick(page, page.locator('#note-reset'));
      assert.equal(await page.evaluate(() => document.activeElement.id), 'note-query');
      assert.equal(await page.locator('[data-note]:visible').count(), notes.length);
      await page.screenshot({ path: `${shots}/study-${width}-${theme}.png`, fullPage: true });

      await checkPage(page, '/knowledge/bestblogs-research/', label);
      const provenance = page.locator('[data-research-provenance]');
      assert.equal(await provenance.count(), 1);
      assert.equal(await provenance.locator('code').innerText(), sourceCommit);
      for (const rowIndex of [0, 2]) {
        const shape = await provenance.locator('dl > div').nth(rowIndex).locator('dd')
          .evaluate((element) => ({
            height: element.getBoundingClientRect().height,
            lineHeight: parseFloat(getComputedStyle(element).lineHeight)
          }));
        assert.ok(shape.height <= shape.lineHeight * 3 + 2,
          `source value wraps into an unreadable narrow column ${label} row ${rowIndex}`);
      }
      assert.match(await provenance.innerText(), /来源已核对/);
      assert.match(await provenance.innerText(), /AI 辅助整理/);
      assert.match(await provenance.innerText(), /不代表人工批准/);
      assert.equal(await page.getByRole('link', { name: '打开对应实验', exact: true }).count(), 0,
        'research article does not invent an experiment action');
      for (const href of await provenance.locator('ul a').evaluateAll((links) =>
        links.map((link) => link.getAttribute('href')))) {
        assert.ok(href.includes(`/blob/${sourceCommit}/`), 'source links pin the analyzed commit');
      }
      const disclosure = provenance.locator('details');
      const summary = disclosure.locator('summary');
      assert.ok(await disclosure.evaluate((element) => element.open));
      await keyboardClick(page, summary);
      assert.equal(await disclosure.evaluate((element) => element.open), false);
      await page.keyboard.press('Space');
      assert.equal(await disclosure.evaluate((element) => element.open), true);
      assert.ok(await page.evaluate(() =>
        document.documentElement.scrollWidth <= innerWidth), `source overflow ${label}`);
      await page.screenshot({ path: `${shots}/research-note-${width}-${theme}.png`, fullPage: true });

      await checkPage(page, '/knowledge/cpp-copy/', label);
      assert.equal(await page.locator('.note-end a[href$="/playground/#copy"]').getAttribute('href'),
        `${prefix}/playground/#copy`);
      assert.equal(await page.locator('[data-research-provenance]').count(), 0);
      await checkPage(page, '/knowledge/rss-normalization/', label);
      assert.equal(await page.locator('.note-end a[href$="/playground/research/"]').getAttribute('href'),
        `${prefix}/playground/research/`);
      assert.deepEqual(errors, [], `${label} browser/runtime or asset failures`);
      await context.close();
      console.log(`PASS Study ${label}: type/category/query, source/tag search, share/reload, keyboard/reset, provenance, optional labs, axe and layout`);
    }
  }

  for (const width of [390, 1440]) {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width, height: 900 }
    });
    const page = await context.newPage();
    const response = await page.goto(base + '/study/');
    assert.ok(response.ok());
    assert.equal(await page.locator('[data-note]:visible').count(), notes.length);
    assert.ok(await page.locator('.note-search').isHidden());
    assert.ok(await page.locator('[data-note-kinds]').isHidden());
    for (const slug of notes) {
      const noteResponse = await page.goto(`${base}/knowledge/${slug}/`);
      assert.ok(noteResponse.ok(), `no-JS note ${slug}`);
      assert.ok((await page.locator('article.note h1').innerText()).length > 0);
      assert.ok((await page.locator('.prose').innerText()).length > 100);
      assert.ok(await page.evaluate(() =>
        document.documentElement.scrollWidth <= innerWidth), `no-JS overflow ${width} ${slug}`);
    }
    await context.close();
    console.log(`PASS Study no-JavaScript ${width}: ${notes.length} published notes and full content routes readable`);
  }
} finally {
  await browser.close();
}
