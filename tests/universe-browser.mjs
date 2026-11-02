import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { readdir, mkdir } from 'node:fs/promises';
const expectedNotes = (await readdir('_atlas_notes')).filter((p) =>
  p.endsWith('.md')
).length;
const base =
  process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io';
const shots = process.env.UNIVERSE_SHOT_DIR || 'work/universe';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'),
  args: ['--no-sandbox'],
  headless: true
});
try {
  for (const width of [390, 768, 1440]) {
    for (const theme of ['dark', 'light']) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce'
      });
      await context.addInitScript(
        (t) => localStorage.setItem('atlas-theme', t),
        theme
      );
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      for (const path of ['/', '/study/', '/projects/']) {
        const r = await page.goto(base + path);
        assert.ok(r.ok());
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          ),
          `overflow ${path} ${width}`
        );
        assert.equal(
          await page.locator('#primary-nav [aria-current=page]').count(),
          1
        );
        const a = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        assert.deepEqual(
          a.violations.map(
            (v) => `${v.id}: ${v.nodes.map((n) => n.target).join(';')}`
          ),
          [],
          `axe ${path} ${width} ${theme}`
        );
        await page.screenshot({
          path: `${shots}/${path === '/' ? 'home' : path.replaceAll('/', '')}-${width}-${theme}.png`,
          fullPage: true
        });
      }
      await page.goto(base + '/');
      const tabs = page.getByRole('tab');
      assert.ok((await tabs.count()) >= 4);
      for (let i = 0; i < (await tabs.count()); i++) {
        await tabs.nth(i).click();
        assert.equal(await page.locator('[role=tabpanel]:visible').count(), 1);
        assert.ok(await page.locator('[role=tabpanel]:visible h2').innerText());
        assert.ok(
          await page.locator('[role=tabpanel]:visible pre').innerText()
        );
        assert.equal(await tabs.nth(i).getAttribute('aria-selected'), 'true');
      }
      await tabs.first().focus();
      await page.keyboard.press('End');
      assert.equal(await tabs.last().getAttribute('aria-selected'), 'true');
      await page.keyboard.press('Home');
      assert.equal(await tabs.first().getAttribute('aria-selected'), 'true');
      const image = page.locator('.campus-preview img');
      await image.scrollIntoViewIfNeeded();
      assert.ok(await image.evaluate((e) => e.complete && e.naturalWidth > 0));
      assert.equal(
        await page.locator('.campus-preview a').first().getAttribute('href'),
        `${new URL(base).pathname.replace(/\/$/, '')}/explore/`
      );
      await page.goto(base + '/study/');
      assert.equal(await page.locator('[data-note]').count(), expectedNotes);
      await page.fill('#note-query', 'no-such-learning-record');
      assert.ok(await page.locator('#note-empty').isVisible());
      assert.equal(await page.locator('[data-note]:visible').count(), 0);
      await page.fill('#note-query', '');
      const category = page.locator('.study-filters [data-category]').nth(1);
      const chosen = await category.getAttribute('data-category');
      await category.click();
      assert.ok((await page.locator('[data-note]:visible').count()) > 0);
      assert.ok(
        (
          await page
            .locator('[data-note]:visible')
            .evaluateAll((nodes) => nodes.map((e) => e.dataset.category))
        ).every((c) => c === chosen)
      );
      await page.locator('[data-category=all]').click();
      assert.equal(
        await page.locator('[data-note]:visible').count(),
        expectedNotes
      );
      await page.goto(base + '/projects/');
      assert.ok((await page.locator('.universe-project').count()) >= 4);
      const summary = page.locator('#project-zijingang summary');
      await summary.focus();
      await page.keyboard.press('Enter');
      assert.equal(
        await page.locator('#project-zijingang details').getAttribute('open'),
        ''
      );
      assert.match(
        await page
          .locator('#project-zijingang dd')
          .allTextContents()
          .then((x) => x.join(' ')),
        /不是道路底图/
      );
      assert.equal(
        await page.locator('#project-next a, #project-next button').count(),
        0,
        'planned work has no fake demo'
      );
      if (theme === 'dark')
        await page.screenshot({
          path: `${shots}/projects-expanded-${width}.png`,
          fullPage: true
        });
      await page.goto(base + '/knowledge/');
      assert.equal(
        await page.locator('#primary-nav [aria-current=page]').innerText(),
        'Study'
      );
      assert.equal(await page.locator('[data-note]').count(), expectedNotes);
      assert.deepEqual(errors, []);
      await context.close();
      console.log(
        `PASS Universe ${width} ${theme}: 3 pages, axe, notebook tabs/keyboard, map preview, Study search/categories, project expansion, legacy route`
      );
    }
  }
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 900 }
  });
  const p = await nojs.newPage();
  await p.goto(base + '/study/');
  assert.equal(await p.locator('[data-note]:visible').count(), expectedNotes);
  await p.goto(base + '/');
  assert.ok((await p.locator('[data-preview-panel]:visible').count()) >= 4);
  await nojs.close();
  console.log(
    'PASS Universe no-JavaScript: all tutorials and notebook previews readable'
  );
} finally {
  await browser.close();
}
